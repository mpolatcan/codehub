/**
 * SessionDetail — the focused diff inspector for one agent's session. Opened from
 * a pane's expand button (PaneHead → openDetail). The entire body is the diff,
 * full-width (design session-detail.jsx): a context strip, a control bar (file
 * filter + layout toggle + refresh), the diff stream, and a commit footer whose
 * Stage all / Commit / Open PR actions drive REAL git-write backends
 * (container_git_stage_all / _commit / _open_pr).
 *
 * Honesty notes:
 *  • CodeHub runs every session on ONE shared runtime, so the diff + staging +
 *    commit + PR all act on the runtime's single /workspace — they are
 *    workspace-wide, not per-session. Labelled accordingly (the design assumes a
 *    per-agent worktree CodeHub doesn't have).
 *  • The header metric strip (ctx / turn / tokens / edits) IS per-session and
 *    REAL for Claude — read from this session's transcript via useSessionUsage.
 *    Omitted for non-Claude CLIs / before the first response. ctx is a bare count
 *    (no window max is recorded, so no fabricated ratio/gauge); cost ($) stays on
 *    Usage with its estimate disclosure, so it's omitted here.
 *  • Commit/PR results are surfaced verbatim from git / the GitHub API — a missing
 *    committer identity, an empty stage, or an absent token shows the real reason,
 *    never a faked success.
 */
import { useCallback, useEffect, useState } from "react";
import { DiffBody, SplitDiffBody, diffCounts, parseDiff } from "../components/hub/DiffBody";
import { AgentGlyph } from "../components/primitives/AgentGlyph";
import { IconBtn } from "../components/primitives/IconBtn";
import { StatusDot } from "../components/primitives/StatusDot";
import { Ico } from "../components/primitives/icons";
import { fmtTokens, useSessionUsage } from "../hooks/useSessionUsage";
import { MODE_BY_ID, SPEC_BY_CLI } from "../lib/catalog";
import { ipc } from "../lib/ipc";
import { useStore } from "../lib/store";

type Filter = "all" | "staged" | "unstaged";
type Layout = "unified" | "split";
type Note = { kind: "ok" | "err"; text: string } | null;

// File count of a raw diff (= number of `diff --git` headers), for the filter
// pill badges. Empty diff → 0.
function fileCount(diff: string): number {
  if (!diff) return 0;
  return parseDiff(diff).filter((r) => r.kind === "file").length;
}

export function SessionDetail({ session }: { session: string }) {
  const meta = useStore((s) => s.sessionMeta[session]);
  const agentVersions = useStore((s) => s.agentVersions);
  const activity = useStore((s) => s.sessionActivity[session]);
  const status = useStore((s) => s.status);
  const running = status?.state === "running";
  const closeDetail = useStore((s) => s.closeDetail);
  const closeSession = useStore((s) => s.closeSession);
  const stats = useStore((s) => s.containerStats);

  // Real per-session token tally from this Claude conversation's transcript —
  // same hook + claudeId derivation as the pane header. Called above the `!meta`
  // guard so the hook count stays constant as a session is torn down here.
  const claudeId = activity?.claudeId ?? (meta?.cli === "claude" ? meta.claudeId : undefined);
  const usage = useSessionUsage(claudeId);

  // Branch (+ commits ahead of upstream) is workspace-wide (single runtime).
  const [branch, setBranch] = useState<string | null>(null);
  const [ahead, setAhead] = useState(0);

  // The three diff slices (all / staged / unstaged), refreshed together so the
  // filter pills' counts and the active stream stay consistent.
  const [diffs, setDiffs] = useState<Record<Filter, string>>({ all: "", staged: "", unstaged: "" });
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [layout, setLayout] = useState<Layout>("unified");

  // Commit / PR action state.
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [commitOpen, setCommitOpen] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [prOpen, setPrOpen] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");

  // Pull all three diff slices + branch. Used by the 4s poll and by every
  // write action (stage/commit) to reflect the new tree immediately.
  const refresh = useCallback(async () => {
    if (!running) {
      setDiffs({ all: "", staged: "", unstaged: "" });
      setBranch(null);
      setAhead(0);
      setLoaded(true);
      return;
    }
    try {
      const [all, staged, unstaged, git] = await Promise.all([
        ipc.containerGitDiffAll(),
        ipc.containerGitDiffStaged(),
        ipc.containerGitDiffUnstaged(),
        ipc.containerGitStatus(),
      ]);
      setDiffs({ all, staged, unstaged });
      setBranch(git.branch);
      setAhead(git.ahead);
    } catch {
      setDiffs({ all: "", staged: "", unstaged: "" });
    } finally {
      setLoaded(true);
    }
  }, [running]);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (alive) void refresh();
    };
    tick();
    const h = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [refresh]);

  // ── Write actions ─────────────────────────────────────────────────────────
  const stageAll = useCallback(async () => {
    if (busy || !running) return;
    setBusy(true);
    setNote(null);
    try {
      await ipc.containerGitStageAll();
      setNote({ kind: "ok", text: "Staged all changes." });
      await refresh();
      setFilter("staged");
    } catch (e) {
      setNote({ kind: "err", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, running, refresh]);

  const doCommit = useCallback(async () => {
    const msg = commitMsg.trim();
    if (busy || !running || !msg) return;
    setBusy(true);
    setNote(null);
    try {
      const summary = await ipc.containerGitCommit(msg);
      setNote({ kind: "ok", text: summary.split("\n")[0] || "Committed." });
      setCommitMsg("");
      setCommitOpen(false);
      await refresh();
    } catch (e) {
      setNote({ kind: "err", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, running, commitMsg, refresh]);

  const doOpenPr = useCallback(async () => {
    const title = prTitle.trim();
    if (busy || !running || !title) return;
    setBusy(true);
    setNote(null);
    try {
      const url = await ipc.containerGitOpenPr(title, prBody.trim());
      setNote({ kind: "ok", text: `PR opened — ${url}` });
      setPrOpen(false);
      setPrTitle("");
      setPrBody("");
      window.open(url, "_blank");
    } catch (e) {
      setNote({ kind: "err", text: String(e) });
    } finally {
      setBusy(false);
    }
  }, [busy, running, prTitle, prBody]);

  // Keyboard: ⌘⏎ commit · ⌘⇧P open PR · ⌘A stage all. Bound at the window while
  // this view is mounted (it only mounts for a focused session), gated so ⌘A
  // doesn't hijack select-all while typing in the commit/PR inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const inField = (e.target as HTMLElement)?.tagName === "INPUT";
      if (e.key === "Enter") {
        e.preventDefault();
        if (commitOpen) void doCommit();
        else setCommitOpen(true);
      } else if (e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setPrOpen((v) => !v);
      } else if (!inField && !e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        void stageAll();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [commitOpen, doCommit, stageAll]);

  if (!meta) return null;
  const spec = SPEC_BY_CLI[meta.cli];
  const accent = `var(--a-${meta.cli})`;
  const badge = MODE_BY_ID[meta.mode].badge;
  const version = meta.cli === "shell" ? null : (agentVersions?.[meta.cli]?.version ?? null);

  const active = diffs[filter];
  const counts = active ? diffCounts(parseDiff(active)) : { added: 0, removed: 0 };
  const filterLabel: Record<Filter, string> = {
    all: "all",
    staged: "staged",
    unstaged: "unstaged",
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--bg-1)",
        color: "var(--fg-1)",
      }}
    >
      {/* context strip — INSPECT · DIFF + session identity + branch + metrics */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: "8px 16px",
          borderBottom: "1px solid var(--bd-soft)",
          background: "var(--bg-1)",
        }}
      >
        <button
          type="button"
          onClick={closeDetail}
          className="mono"
          title="Back to Hub (Esc)"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: "transparent",
            border: "1px solid var(--bd-soft)",
            borderRadius: 6,
            color: "var(--fg-2)",
            cursor: "pointer",
            fontSize: 11.5,
          }}
        >
          <span style={{ display: "inline-flex", transform: "scaleX(-1)" }}>{Ico.arrowR}</span>
          Hub
        </button>
        <span
          className="lbl"
          style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.08em" }}
        >
          INSPECT · DIFF
        </span>

        <span className="vr" style={{ height: 18 }} />

        <StatusDot status={running ? "live" : "off"} pulse={running} />
        <AgentGlyph agent={meta.cli} size={14} color={accent} />
        <span className="mono" style={{ fontSize: 13, color: "var(--fg-0)", fontWeight: 500 }}>
          {meta.alias}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
          {spec.label}
          {version && ` · ${version}`}
        </span>
        {badge && <span className={`mode-badge badge-${meta.mode}`}>{badge}</span>}

        {branch && (
          <>
            <span className="vr" style={{ height: 18 }} />
            <span
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--fg-2)",
              }}
            >
              <span style={{ display: "inline-flex", color: "var(--fg-3)" }}>{Ico.branch}</span>
              {branch}
              {ahead > 0 && (
                <span style={{ color: "var(--wait)" }} title={`${ahead} ahead of upstream`}>
                  ·{ahead}
                </span>
              )}
            </span>
          </>
        )}

        <span style={{ flex: 1 }} />

        {/* per-session metric strip — REAL for Claude only */}
        {usage && (
          <span
            className="mono tnum"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11 }}
          >
            <Metric label="ctx" value={fmtTokens(usage.contextUsed)} />
            <Metric label="turn" value={String(usage.turns)} />
            <Metric label="tokens" value={fmtTokens(usage.tokensIn + usage.tokensOut)} />
            <Metric label="edits" value={String(usage.edits)} />
            <span className="vr" style={{ height: 16 }} />
          </span>
        )}

        <IconBtn
          title="Stop session"
          danger
          onClick={() => {
            void closeSession(session);
          }}
        >
          {Ico.close}
        </IconBtn>
      </div>

      {/* diff body — full-width single column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          background: "var(--bg-0)",
        }}
      >
        {/* control bar — totals + file filter + layout toggle + refresh */}
        <div
          style={{
            height: 36,
            flexShrink: 0,
            background: "var(--bg-1)",
            borderBottom: "1px solid var(--bd-soft)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
          }}
        >
          <span className="mono tnum" style={{ fontSize: 12, fontWeight: 500 }}>
            <span style={{ color: "var(--live)" }}>+{counts.added}</span>{" "}
            <span style={{ color: "var(--err)" }}>−{counts.removed}</span>
            <span style={{ color: "var(--fg-3)" }}>
              {" · "}
              {fileCount(active)} {fileCount(active) === 1 ? "file" : "files"}
            </span>
          </span>
          <span className="vr" style={{ height: 18, margin: "0 4px" }} />
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>
            All · {fileCount(diffs.all)}
          </Pill>
          <Pill active={filter === "staged"} onClick={() => setFilter("staged")}>
            Staged · {fileCount(diffs.staged)}
          </Pill>
          <Pill active={filter === "unstaged"} onClick={() => setFilter("unstaged")}>
            Unstaged · {fileCount(diffs.unstaged)}
          </Pill>
          <span style={{ flex: 1 }} />
          <div
            style={{
              display: "inline-flex",
              border: "1px solid var(--bd-soft)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Seg active={layout === "unified"} onClick={() => setLayout("unified")}>
              Unified
            </Seg>
            <Seg active={layout === "split"} onClick={() => setLayout("split")}>
              Split
            </Seg>
          </div>
          <IconBtn title="Refresh diff" onClick={() => void refresh()}>
            {Ico.search}
          </IconBtn>
        </div>

        {/* the diff stream */}
        {layout === "split" ? (
          <SplitDiffBody
            diff={loaded ? active : null}
            emptyLabel={emptyLabel(running, filter)}
            style={{ flex: 1, minHeight: 0 }}
          />
        ) : (
          <DiffBody
            diff={loaded ? active : null}
            emptyLabel={emptyLabel(running, filter)}
            style={{ flex: 1, minHeight: 0 }}
          />
        )}

        {/* commit footer — real git-write actions */}
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid var(--bd-soft)",
            background: "var(--bg-1)",
          }}
        >
          {note && (
            <div
              className="mono"
              style={{
                padding: "5px 16px",
                fontSize: 11,
                color: note.kind === "ok" ? "var(--live)" : "var(--err)",
                borderBottom: "1px solid var(--bd-soft)",
                wordBreak: "break-word",
              }}
            >
              {note.text}
            </div>
          )}
          {commitOpen && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 16px",
                borderBottom: "1px solid var(--bd-soft)",
              }}
            >
              <input
                className="mono"
                // biome-ignore lint/a11y/noAutofocus: commit box is opened by an explicit user action
                autoFocus
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                placeholder="Commit message…"
                style={fieldStyle}
              />
              <FooterBtn onClick={() => void doCommit()} disabled={busy || !commitMsg.trim()} pri>
                Commit
              </FooterBtn>
              <FooterBtn
                onClick={() => {
                  setCommitOpen(false);
                  setCommitMsg("");
                }}
              >
                Cancel
              </FooterBtn>
            </div>
          )}
          {prOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "8px 16px",
                borderBottom: "1px solid var(--bd-soft)",
              }}
            >
              <input
                className="mono"
                // biome-ignore lint/a11y/noAutofocus: PR form is opened by an explicit user action
                autoFocus
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                placeholder="PR title…"
                style={fieldStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="mono"
                  value={prBody}
                  onChange={(e) => setPrBody(e.target.value)}
                  placeholder="PR description (optional)…"
                  style={fieldStyle}
                />
                <FooterBtn onClick={() => void doOpenPr()} disabled={busy || !prTitle.trim()} pri>
                  Open PR
                </FooterBtn>
                <FooterBtn
                  onClick={() => {
                    setPrOpen(false);
                  }}
                >
                  Cancel
                </FooterBtn>
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                Pushes the current branch to origin, then opens a PR via the GitHub API.
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
            }}
          >
            <span className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
              {filterLabel[filter]} · <span style={{ color: "var(--live)" }}>+{counts.added}</span>{" "}
              <span style={{ color: "var(--err)" }}>−{counts.removed}</span>
            </span>
            <span style={{ flex: 1 }} />
            <FooterBtn onClick={() => void stageAll()} disabled={busy || !running} kbd="⌘A">
              Stage all
            </FooterBtn>
            <FooterBtn
              onClick={() => setCommitOpen((v) => !v)}
              disabled={busy || !running}
              kbd="⌘⏎"
            >
              Commit…
            </FooterBtn>
            <FooterBtn
              onClick={() => setPrOpen((v) => !v)}
              disabled={busy || !running}
              kbd="⌘⇧P"
              pri
            >
              Open PR
            </FooterBtn>
          </div>
        </div>
      </div>

      {/* status bar — workspace-wide live runtime facts (one shared container) */}
      <div
        className="mono"
        style={{
          height: 26,
          flexShrink: 0,
          background: "var(--bg-0)",
          borderTop: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 14,
          fontSize: 11,
          color: "var(--fg-2)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <StatusDot status={running ? "live" : "off"} pulse={running} />
          {status?.name ?? "codehub-runtime"}
        </span>
        <span className="tnum">
          cpu {stats ? `${stats.cpuPct.toFixed(0)}%` : "—"} · mem{" "}
          {stats ? fmtMem(stats.memUsed, stats.memLimit) : "—"}
        </span>
        <span style={{ color: "var(--fg-3)" }}>workspace-wide — one shared /workspace</span>
        <span style={{ flex: 1 }} />
        <span>⌘A stage · ⌘⏎ commit · Esc back</span>
      </div>
    </main>
  );
}

// Empty-state copy for the diff stream, by run-state + active filter.
function emptyLabel(running: boolean, filter: Filter): string {
  if (!running) return "Runtime not running — start it to see changes.";
  if (filter === "staged") return "Nothing staged — Stage all to stage the working tree.";
  if (filter === "unstaged") return "No unstaged changes — the working tree matches the index.";
  return "No tracked changes — the working tree is clean.";
}

// "1.2/4.0 GiB" memory string from raw bytes; bare used count when no limit.
function fmtMem(used: number, limit: number): string {
  const gib = (n: number) => (n / 1024 ** 3).toFixed(1);
  return limit > 0 ? `${gib(used)}/${gib(limit)} GiB` : `${gib(used)} GiB`;
}

const fieldStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "var(--bg-0)",
  border: "1px solid var(--bd-soft)",
  borderRadius: 6,
  color: "var(--fg-0)",
  padding: "5px 9px",
  fontSize: 12,
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ color: "var(--fg-3)" }}>{label}</span>
      <span style={{ color: "var(--fg-0)", fontWeight: 500 }}>{value}</span>
    </span>
  );
}

// Filter pill: filled chip when active, ghost otherwise (control-bar style).
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        padding: "3px 9px",
        fontSize: 11,
        borderRadius: 5,
        border: "1px solid var(--bd-soft)",
        background: active ? "var(--bg-3)" : "transparent",
        color: active ? "var(--fg-0)" : "var(--fg-2)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// One half of the Unified/Split segmented toggle.
function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        padding: "3px 10px",
        fontSize: 11,
        border: "none",
        borderRadius: 0,
        background: active ? "var(--bg-3)" : "var(--bg-1)",
        color: active ? "var(--fg-0)" : "var(--fg-2)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// Commit-footer button: optional accent (pri) + a keyboard-hint chip.
function FooterBtn({
  onClick,
  disabled,
  pri,
  kbd,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  pri?: boolean;
  kbd?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        fontSize: 11.5,
        borderRadius: 6,
        border: pri ? "1px solid var(--pri)" : "1px solid var(--bd-soft)",
        background: pri ? "var(--pri)" : "transparent",
        color: pri ? "var(--bg-0)" : "var(--fg-1)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
      {kbd && (
        <span
          style={{
            fontSize: 9.5,
            padding: "1px 4px",
            borderRadius: 3,
            background: pri ? "color-mix(in oklab, var(--bg-0) 22%, transparent)" : "var(--bg-2)",
            color: pri ? "var(--bg-0)" : "var(--fg-3)",
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}
