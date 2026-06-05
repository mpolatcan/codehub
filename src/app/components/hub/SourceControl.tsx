import { motion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { rootPx, useResizableDock } from "../../hooks/useResizableDock";
import { EASE } from "../../hooks/useSlideIn";
import type { BranchInfo, GraphCommit } from "../../lib/ipc";
import { ipc } from "../../lib/ipc";
import { activeWorkspace, useStore } from "../../lib/store";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { IconBtn } from "../primitives/IconBtn";
import { Segmented } from "../primitives/Segmented";
import { Tip } from "../primitives/Tip";
import { Ico } from "../primitives/icons";
import { DiffBody, diffCounts, parseDiff } from "./DiffBody";
import { ResizeHandle } from "./ResizeHandle";
import { type GraphRow, laneColor, layoutGraph } from "./git-graph";

// The right-docked Source-control panel (was the read-only DiffViewer). Three
// tabs over the active workspace's container, all driven by the container-routed
// git IPC: Changes (working tree + stage/commit/discard), History (the commit
// DAG, with per-commit diff + reset), and Branches (checkout/create/delete +
// remote sync). Opened from the hub ActionBar (⌘D) or on a specific file from
// the activity rail; `path` carries the empty-string "all" sentinel or a file to
// pre-select in Changes. Destructive ops (force push, hard reset, branch delete,
// discard) are confirm-gated. Remote ops authenticate with the vault GitHub
// token in-container (HTTPS only — see the backend git_authed_script).

// 23rem default — a touch wider than the old diff dock to fit the graph lanes.
const WIDTH = 23;

// Match the pane context menu's look (PaneContextMenu / `.ctx-row`) so every
// menu in the app reads the same — bg-2 surface, soft shadow, bg-3 row hover.
// tailwind-merge lets these arbitrary values override the shadcn defaults.
const MENU_CLS =
  "min-w-[13rem] rounded-[0.375rem] border-[var(--bd)] bg-[var(--bg-2)] p-[0.3125rem] shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.45)]";
const MENU_ITEM_CLS =
  "gap-2 rounded-[0.25rem] px-2 py-[0.3125rem] focus:bg-[var(--bg-3)] focus:text-[var(--fg-0)] data-[variant=destructive]:focus:bg-[var(--bg-3)]";

// Leading icon slot for menu rows — matches the pane context menu's icon column.
function MenuIco({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", width: "0.875rem", flexShrink: 0, opacity: 0.85 }}>
      {children}
    </span>
  );
}

type Tab = "changes" | "history" | "branches";
type Note = { kind: "ok" | "err"; text: string } | null;
interface Confirm {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function SourceControl({ path, onClose }: { path: string; onClose: () => void }) {
  const containerKey = useStore((s) => activeWorkspace(s)?.containerKey);
  const ck = containerKey ?? "";
  const gitStatus = useStore((s) => s.gitStatus);
  const setGitStatus = useStore((s) => s.setGitStatus);

  const [tab, setTab] = useState<Tab>("changes");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  // Bumped after every write so the active tab re-fetches its data.
  const [reloadKey, setReloadKey] = useState(0);

  const { size, dragging, ref, beginResize, reset } = useResizableDock("ch.diff.wr2", WIDTH, {
    min: 14,
    max: () => Math.max(14, Math.min(window.innerWidth * 0.5, 43.75 * rootPx()) / rootPx()),
    edge: "left",
  });

  const refreshStatus = useCallback(async () => {
    if (!containerKey) return;
    try {
      setGitStatus(await ipc.containerGitStatus(containerKey));
    } catch {
      /* leave the last good snapshot; the app-wide poll will reconcile */
    }
  }, [containerKey, setGitStatus]);

  // Run a write action: surface git's message on success/failure, then refresh
  // the working-tree status and signal the active tab to re-fetch.
  const run = useCallback(
    async (fn: () => Promise<unknown>, ok?: string) => {
      if (busy) return;
      setBusy(true);
      setNote(null);
      try {
        const r = await fn();
        const msg = ok ?? (typeof r === "string" && r.trim() ? r.split("\n")[0] : "Done.");
        setNote({ kind: "ok", text: msg });
        setReloadKey((k) => k + 1);
        await refreshStatus();
      } catch (e) {
        setNote({ kind: "err", text: String(e).replace(/^Error:\s*/, "") });
      } finally {
        setBusy(false);
      }
    },
    [busy, refreshStatus],
  );

  const ask = useCallback((c: Confirm) => setConfirm(c), []);

  const changedCount = gitStatus?.files.length ?? 0;

  return (
    <motion.aside
      ref={ref}
      initial={{ width: "0rem" }}
      animate={{ width: `${size}rem` }}
      exit={{ width: "0rem" }}
      transition={{ duration: dragging ? 0 : 0.28, ease: EASE }}
      style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
    >
      <div
        style={{
          width: `${size}rem`,
          height: "100%",
          background: "var(--bg-1)",
          borderLeft: "1px solid var(--bd-soft)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          color: "var(--fg-1)",
        }}
      >
        {/* Header: title + close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4375rem",
            padding: "0.5rem 0.625rem",
            borderBottom: "1px solid var(--bd-soft)",
          }}
        >
          <span style={{ color: "var(--wait)", display: "inline-flex" }}>{Ico.branch}</span>
          <span
            className="lbl"
            style={{ flex: 1, minWidth: 0, color: "var(--fg-1)", letterSpacing: "0.04em" }}
          >
            Git
          </span>
          <IconBtn title="Hide Git (⌘D)" onClick={onClose}>
            {Ico.close}
          </IconBtn>
        </div>

        {/* Branch + remote-sync bar */}
        <BranchBar gitStatus={gitStatus} busy={busy} ck={ck} run={run} ask={ask} />

        {/* Tabs */}
        <div style={{ padding: "0.5rem 0.625rem 0.4375rem" }}>
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            fullWidth
            options={[
              { key: "changes", label: changedCount > 0 ? `Changes ${changedCount}` : "Changes" },
              { key: "history", label: "History" },
              { key: "branches", label: "Branches" },
            ]}
          />
        </div>

        {note && (
          <Tip text="Dismiss">
            <button
              type="button"
              className="mono"
              onClick={() => setNote(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4375rem",
                textAlign: "left",
                width: "auto",
                margin: "0 0.625rem 0.4375rem",
                padding: "0.3125rem 0.5rem",
                borderRadius: "0.3125rem",
                fontSize: "var(--fs-11)",
                cursor: "pointer",
                color: note.kind === "ok" ? "var(--live)" : "var(--err)",
                background:
                  note.kind === "ok"
                    ? "color-mix(in oklab, var(--live) 12%, transparent)"
                    : "color-mix(in oklab, var(--err) 12%, transparent)",
                border: `1px solid color-mix(in oklab, ${
                  note.kind === "ok" ? "var(--live)" : "var(--err)"
                } 35%, transparent)`,
              }}
            >
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                {note.kind === "ok" ? Ico.check : Ico.bell}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {note.text}
              </span>
            </button>
          </Tip>
        )}

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {!gitStatus?.isRepo ? (
            <Empty icon={Ico.branch}>/workspace is not a git repository.</Empty>
          ) : tab === "changes" ? (
            <ChangesTab
              ck={ck}
              initialPath={path}
              gitFiles={gitStatus.files}
              reloadKey={reloadKey}
              busy={busy}
              run={run}
              ask={ask}
            />
          ) : tab === "history" ? (
            <HistoryTab ck={ck} reloadKey={reloadKey} busy={busy} run={run} ask={ask} />
          ) : (
            <BranchesTab ck={ck} reloadKey={reloadKey} busy={busy} run={run} ask={ask} />
          )}
        </div>
      </div>
      <ResizeHandle edge="left" onMouseDown={beginResize} onDoubleClick={reset} />

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.danger ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                confirm?.onConfirm();
                setConfirm(null);
              }}
            >
              {confirm?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.aside>
  );
}

// ── Shared types for the tab/bar components ──────────────────────────────────
type RunFn = (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
type AskFn = (c: Confirm) => void;

// ── Branch + remote-sync bar ─────────────────────────────────────────────────
function BranchBar({
  gitStatus,
  busy,
  ck,
  run,
  ask,
}: {
  gitStatus: ReturnType<typeof useStore.getState>["gitStatus"];
  busy: boolean;
  ck: string;
  run: RunFn;
  ask: AskFn;
}) {
  const branch = gitStatus?.branch ?? "—";
  const ahead = gitStatus?.ahead ?? 0;
  const behind = gitStatus?.behind ?? 0;
  const synced = !!gitStatus?.isRepo && ahead === 0 && behind === 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.4375rem 0.625rem",
        borderBottom: "1px solid var(--bd-soft)",
        background: "var(--bg-2)",
      }}
    >
      <span style={{ display: "inline-flex", flexShrink: 0, color: "var(--fg-3)" }}>
        {Ico.branch}
      </span>
      <Tip text={`Current branch: ${branch}`}>
        <span
          className="mono"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "var(--fs-12)",
            color: "var(--fg-0)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          {branch}
        </span>
      </Tip>
      {/* Ahead / behind indicator, or a calm ✓ when in sync */}
      {synced ? (
        <Tip text="In sync with upstream">
          <span style={{ display: "inline-flex", color: "var(--done)", flexShrink: 0 }}>
            {Ico.check}
          </span>
        </Tip>
      ) : (
        <span
          className="mono tnum"
          style={{ display: "inline-flex", gap: "0.3125rem", flexShrink: 0 }}
        >
          {behind > 0 && (
            <Tip text={`${behind} behind upstream`}>
              <span style={{ fontSize: "var(--fs-11)", color: "var(--wait)" }}>↓{behind}</span>
            </Tip>
          )}
          {ahead > 0 && (
            <Tip text={`${ahead} ahead of upstream`}>
              <span style={{ fontSize: "var(--fs-11)", color: "var(--live)" }}>↑{ahead}</span>
            </Tip>
          )}
        </span>
      )}
      <span
        style={{
          width: "1px",
          alignSelf: "stretch",
          margin: "0.0625rem 0.125rem",
          background: "var(--bd-soft)",
          flexShrink: 0,
        }}
      />
      <Tip text="Fetch all + prune">
        <IconBtn
          size={22}
          disabled={busy}
          aria-label="Fetch"
          onClick={() => void run(() => ipc.containerGitFetch(ck))}
        >
          {Ico.restart}
        </IconBtn>
      </Tip>
      <Tip text="Pull (fast-forward only)">
        <IconBtn
          size={22}
          disabled={busy}
          aria-label="Pull"
          onClick={() => void run(() => ipc.containerGitPull(ck))}
        >
          <span style={{ display: "inline-flex", color: behind > 0 ? "var(--wait)" : undefined }}>
            {Ico.download}
          </span>
        </IconBtn>
      </Tip>
      <Tip text="Push to origin">
        <IconBtn
          size={22}
          disabled={busy}
          aria-label="Push"
          onClick={() => void run(() => ipc.containerGitPush(false, ck))}
        >
          <span style={{ display: "inline-flex", color: ahead > 0 ? "var(--live)" : undefined }}>
            {Ico.upload}
          </span>
        </IconBtn>
      </Tip>
      <DropdownMenu>
        <Tip text="More actions (stash, force push)">
          <DropdownMenuTrigger asChild>
            <span style={{ display: "inline-flex" }}>
              <IconBtn size={22} disabled={busy} aria-label="More git actions">
                {Ico.more}
              </IconBtn>
            </span>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent align="end" className={MENU_CLS}>
          <DropdownMenuItem
            className={MENU_ITEM_CLS}
            onSelect={() => void run(() => ipc.containerGitStash(ck), "Stashed.")}
          >
            <MenuIco>{Ico.download}</MenuIco>
            Stash changes
          </DropdownMenuItem>
          <DropdownMenuItem
            className={MENU_ITEM_CLS}
            onSelect={() => void run(() => ipc.containerGitStashPop(ck), "Stash applied.")}
          >
            <MenuIco>{Ico.upload}</MenuIco>
            Pop stash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={MENU_ITEM_CLS}
            variant="destructive"
            onSelect={() =>
              ask({
                title: "Force push?",
                body: `Overwrite the remote branch with your local ${
                  gitStatus?.branch ?? "branch"
                } using --force-with-lease. This refuses to clobber refs that moved since your last fetch, but still rewrites remote history.`,
                confirmLabel: "Force push",
                danger: true,
                onConfirm: () => void run(() => ipc.containerGitPush(true, ck)),
              })
            }
          >
            <MenuIco>{Ico.upload}</MenuIco>
            Force push (--force-with-lease)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Changes tab ──────────────────────────────────────────────────────────────
function fileBadge(code: string): { ch: string; color: string } {
  if (code === "??") return { ch: "U", color: "var(--wait)" };
  const c = code[0] !== " " && code[0] !== "?" ? code[0] : code[1];
  const map: Record<string, { ch: string; color: string }> = {
    A: { ch: "A", color: "var(--live)" },
    M: { ch: "M", color: "var(--wait)" },
    D: { ch: "D", color: "var(--err)" },
    R: { ch: "R", color: "var(--pri)" },
    C: { ch: "C", color: "var(--pri)" },
    U: { ch: "U", color: "var(--err)" },
  };
  return map[c] ?? { ch: c || "?", color: "var(--fg-3)" };
}
const isStaged = (code: string) => code !== "??" && code[0] !== " " && code[0] !== "?";
const hasWorktree = (code: string) => code === "??" || code[1] !== " ";

function ChangesTab({
  ck,
  initialPath,
  gitFiles,
  reloadKey,
  busy,
  run,
  ask,
}: {
  ck: string;
  initialPath: string;
  gitFiles: { path: string; status: string }[];
  reloadKey: number;
  busy: boolean;
  run: RunFn;
  ask: AskFn;
}) {
  // "" → combined "all changes" diff; a path → that file.
  const [selected, setSelected] = useState<string>(initialPath);
  const [diff, setDiff] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-fetches after a write action.
  useEffect(() => {
    let alive = true;
    setDiff(null);
    const load = selected === "" ? ipc.containerGitDiffAll(ck) : ipc.containerGitDiff(selected, ck);
    load.then((d) => alive && setDiff(d)).catch(() => alive && setDiff(""));
    return () => {
      alive = false;
    };
  }, [selected, ck, reloadKey]);

  const counts = diff ? diffCounts(parseDiff(diff)) : null;
  const staged = gitFiles.filter((f) => isStaged(f.status));
  const unstaged = gitFiles.filter((f) => hasWorktree(f.status));

  const stageBtn = (path: string) => (
    <Tip text="Stage">
      <IconBtn
        size={20}
        disabled={busy}
        aria-label="Stage"
        onClick={(e) => {
          e.stopPropagation();
          void run(() => ipc.containerGitStageFile(path, ck), "Staged.");
        }}
      >
        {Ico.plus}
      </IconBtn>
    </Tip>
  );
  const discardBtn = (f: { path: string; status: string }) => (
    <Tip text="Discard changes">
      <IconBtn
        size={20}
        danger
        disabled={busy}
        aria-label="Discard"
        onClick={(e) => {
          e.stopPropagation();
          ask({
            title: "Discard changes?",
            body: `Discard your changes to ${f.path}. ${
              f.status === "??"
                ? "This untracked file will be deleted."
                : "This reverts the file to the last commit and cannot be undone."
            }`,
            confirmLabel: "Discard",
            danger: true,
            onConfirm: () => void run(() => ipc.containerGitDiscardFile(f.path, ck), "Discarded."),
          });
        }}
      >
        {Ico.trash}
      </IconBtn>
    </Tip>
  );
  const unstageBtn = (path: string) => (
    <Tip text="Unstage">
      <IconBtn
        size={20}
        disabled={busy}
        aria-label="Unstage"
        onClick={(e) => {
          e.stopPropagation();
          void run(() => ipc.containerGitUnstageFile(path, ck), "Unstaged.");
        }}
      >
        {Ico.minus}
      </IconBtn>
    </Tip>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div className="scroll" style={{ maxHeight: "42%", overflow: "auto", flexShrink: 0 }}>
        <FileRow
          active={selected === ""}
          onClick={() => setSelected("")}
          badge={{ ch: "∑", color: "var(--fg-2)" }}
          label="All changes"
          count={gitFiles.length}
        />
        {gitFiles.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4375rem",
              padding: "0.625rem 0.75rem",
              color: "var(--fg-3)",
              fontSize: "var(--fs-11)",
            }}
          >
            <span style={{ display: "inline-flex", color: "var(--done)" }}>{Ico.check}</span>
            Working tree clean.
          </div>
        )}

        {staged.length > 0 && <SectionLabel count={staged.length}>Staged</SectionLabel>}
        {staged.map((f) => (
          <FileRow
            key={`s-${f.path}`}
            active={selected === f.path}
            onClick={() => setSelected(f.path)}
            badge={fileBadge(f.status)}
            label={f.path}
            staged
            actions={unstageBtn(f.path)}
          />
        ))}

        {unstaged.length > 0 && (
          <SectionLabel
            count={unstaged.length}
            action={
              <Button
                variant="ghost"
                size="xs"
                disabled={busy}
                onClick={() => void run(() => ipc.containerGitStageAll(ck), "Staged all changes.")}
              >
                Stage all
              </Button>
            }
          >
            Changes
          </SectionLabel>
        )}
        {unstaged.map((f) => (
          <FileRow
            key={`w-${f.path}`}
            active={selected === f.path}
            onClick={() => setSelected(f.path)}
            badge={fileBadge(f.status)}
            label={f.path}
            actions={
              <>
                {stageBtn(f.path)}
                {discardBtn(f)}
              </>
            }
          />
        ))}
      </div>

      <div
        style={{ borderTop: "1px solid var(--bd-soft)", flex: 1, minHeight: 0, display: "flex" }}
      >
        <DiffBody
          diff={diff}
          emptyLabel={
            selected === ""
              ? "No tracked changes — the working tree is clean."
              : "No diff to show — the file may be unchanged or binary."
          }
          style={{ flex: 1, minHeight: 0, overflow: "auto" }}
        />
      </div>

      {counts && (counts.added > 0 || counts.removed > 0) && (
        <div
          className="mono tnum"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.3125rem 0.625rem",
            fontSize: "var(--fs-11)",
            borderTop: "1px solid var(--bd-soft)",
            color: "var(--fg-3)",
          }}
        >
          <span style={{ color: "var(--live)" }}>+{counts.added}</span>
          <span style={{ color: "var(--err)" }}>−{counts.removed}</span>
          <DiffStatBar added={counts.added} removed={counts.removed} />
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--bd-soft)",
          padding: "0.5rem 0.625rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4375rem",
          background: "var(--bg-1)",
        }}
      >
        <Textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder={
            staged.length > 0
              ? `Commit message for ${staged.length} staged file${staged.length > 1 ? "s" : ""}`
              : "Stage changes, then write a commit message"
          }
          className="min-h-[3.75rem] resize-none font-mono text-[0.75rem]"
        />
        <Button
          size="sm"
          disabled={busy || !commitMsg.trim() || staged.length === 0}
          onClick={() =>
            void run(async () => {
              const summary = await ipc.containerGitCommit(commitMsg.trim(), ck);
              setCommitMsg("");
              return summary;
            })
          }
        >
          {Ico.check}
          Commit{staged.length > 0 ? ` ${staged.length}` : ""}
        </Button>
      </div>
    </div>
  );
}

// Tiny added/removed proportion bar — a calm diffstat glyph next to the counts.
function DiffStatBar({ added, removed }: { added: number; removed: number }) {
  const total = added + removed;
  if (total === 0) return null;
  const a = Math.round((added / total) * 5);
  const cells = Array.from({ length: 5 }, (_, i) => i);
  return (
    <span style={{ display: "inline-flex", gap: "0.125rem", marginLeft: "auto" }}>
      {cells.map((i) => (
        <span
          key={i}
          style={{
            width: "0.4375rem",
            height: "0.4375rem",
            borderRadius: "0.0625rem",
            background: i < a ? "var(--live)" : "var(--err)",
            opacity: 0.85,
          }}
        />
      ))}
    </span>
  );
}

function FileRow({
  active,
  onClick,
  badge,
  label,
  count,
  staged,
  actions,
}: {
  active: boolean;
  onClick: () => void;
  badge: { ch: string; color: string };
  label: string;
  count?: number;
  staged?: boolean;
  actions?: ReactNode;
}) {
  // Split path → dim the directory, keep the basename bright; the dir truncates
  // first so the filename stays legible.
  const slash = label.lastIndexOf("/");
  const dir = slash >= 0 ? label.slice(0, slash + 1) : "";
  const base = slash >= 0 ? label.slice(slash + 1) : label;
  return (
    <div
      className="rail-file sc-row"
      data-active={active}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4375rem",
        padding: "0.3125rem 0.625rem 0.3125rem 0.5rem",
        background: active ? "var(--bg-active)" : "transparent",
        boxShadow: active ? "inset 0.125rem 0 0 var(--pri)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4375rem",
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          color: "var(--fg-1)",
          cursor: "pointer",
          textAlign: "left",
          padding: 0,
        }}
      >
        <span
          className="mono"
          style={{
            flexShrink: 0,
            width: "1.0625rem",
            height: "1.0625rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0.25rem",
            fontWeight: 700,
            fontSize: "var(--fs-10)",
            color: badge.color,
            background: `color-mix(in oklab, ${badge.color} 16%, transparent)`,
          }}
        >
          {badge.ch}
        </span>
        <Tip text={label}>
          <span
            className="mono"
            style={{
              flex: 1,
              minWidth: 0,
              display: "inline-flex",
              alignItems: "baseline",
              fontSize: "var(--fs-12)",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {dir && (
              <span
                style={{
                  color: "var(--fg-3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                }}
              >
                {dir}
              </span>
            )}
            <span
              style={{
                flexShrink: 0,
                color: staged ? "var(--fg-0)" : "var(--fg-1)",
                fontWeight: staged ? 500 : 400,
              }}
            >
              {base}
            </span>
          </span>
        </Tip>
        {typeof count === "number" && (
          <span
            className="mono tnum"
            style={{ flexShrink: 0, fontSize: "var(--fs-10)", color: "var(--fg-3)" }}
          >
            {count}
          </span>
        )}
      </button>
      {actions && (
        <span
          className="sc-actions"
          style={{ flexShrink: 0, display: "inline-flex", gap: "0.125rem" }}
        >
          {actions}
        </span>
      )}
    </div>
  );
}

// ── History tab ──────────────────────────────────────────────────────────────
function HistoryTab({
  ck,
  reloadKey,
  busy,
  run,
  ask,
}: {
  ck: string;
  reloadKey: number;
  busy: boolean;
  run: RunFn;
  ask: AskFn;
}) {
  const [commits, setCommits] = useState<GraphCommit[] | null>(null);
  const [selected, setSelected] = useState<GraphCommit | null>(null);
  const [diff, setDiff] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-fetches after a write action.
  useEffect(() => {
    let alive = true;
    setCommits(null);
    ipc
      .containerGitGraph(200, ck)
      .then((c) => alive && setCommits(c))
      .catch(() => alive && setCommits([]));
    return () => {
      alive = false;
    };
  }, [ck, reloadKey]);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    setDiff(null);
    setBody("");
    ipc
      .containerGitShow(selected.hash, ck)
      .then((d) => alive && setDiff(d))
      .catch(() => alive && setDiff(""));
    ipc
      .containerGitMessage(selected.hash, ck)
      .then((m) => alive && setBody(m.trim()))
      .catch(() => alive && setBody(""));
    return () => {
      alive = false;
    };
  }, [selected, ck]);

  const { rows, width } = useMemo(() => layoutGraph(commits ?? []), [commits]);

  if (commits === null) return <Loading>Loading history…</Loading>;
  if (commits.length === 0) return <Empty icon={Ico.commit}>No commits yet.</Empty>;

  if (selected) {
    const copyHash = () => {
      void navigator.clipboard?.writeText(selected.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4375rem",
            padding: "0.4375rem 0.625rem",
            borderBottom: "1px solid var(--bd-soft)",
          }}
        >
          <IconBtn
            size={22}
            title="Back to history"
            aria-label="Back to history"
            onClick={() => setSelected(null)}
          >
            {Ico.chevL}
          </IconBtn>
          <Tip text={selected.subject}>
            <span
              className="mono"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: "var(--fs-12)",
                color: "var(--fg-0)",
                fontWeight: 500,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.35,
              }}
            >
              {selected.subject}
            </span>
          </Tip>
          <DropdownMenu>
            <Tip text="Commit actions (checkout, reset)">
              <DropdownMenuTrigger asChild>
                <span style={{ display: "inline-flex" }}>
                  <IconBtn size={22} disabled={busy} aria-label="Commit actions">
                    {Ico.more}
                  </IconBtn>
                </span>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end" className={MENU_CLS}>
              <DropdownMenuItem
                className={MENU_ITEM_CLS}
                onSelect={() =>
                  ask({
                    title: "Checkout this commit?",
                    body: `Move HEAD to ${selected.hash.slice(0, 7)} in a DETACHED state (not on any branch). Your branches and their commits stay intact — switch back to a branch to reattach. Fails if you have uncommitted changes.`,
                    confirmLabel: "Checkout",
                    onConfirm: () =>
                      void run(
                        () => ipc.containerGitCheckoutCommit(selected.hash, ck),
                        `Detached HEAD at ${selected.hash.slice(0, 7)}.`,
                      ),
                  })
                }
              >
                <MenuIco>{Ico.branch}</MenuIco>
                Checkout this commit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={MENU_ITEM_CLS}
                onSelect={() =>
                  void run(
                    () => ipc.containerGitReset(selected.hash, "soft", ck),
                    "Reset (soft) — changes kept staged.",
                  )
                }
              >
                <MenuIco>{Ico.restart}</MenuIco>
                Reset (soft) to here
              </DropdownMenuItem>
              <DropdownMenuItem
                className={MENU_ITEM_CLS}
                onSelect={() =>
                  void run(
                    () => ipc.containerGitReset(selected.hash, "mixed", ck),
                    "Reset (mixed) — changes kept unstaged.",
                  )
                }
              >
                <MenuIco>{Ico.restart}</MenuIco>
                Reset (mixed) to here
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={MENU_ITEM_CLS}
                variant="destructive"
                onSelect={() =>
                  ask({
                    title: "Hard reset?",
                    body: `Move HEAD to ${selected.hash.slice(0, 7)} and DISCARD all working-tree and staged changes. This cannot be undone.`,
                    confirmLabel: "Hard reset",
                    danger: true,
                    onConfirm: () =>
                      void run(
                        () => ipc.containerGitReset(selected.hash, "hard", ck),
                        "Hard reset complete.",
                      ),
                  })
                }
              >
                <MenuIco>{Ico.trash}</MenuIco>
                Hard reset to here
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div
          className="mono"
          style={{
            padding: "0.375rem 0.625rem",
            borderBottom: "1px solid var(--bd-soft)",
            fontSize: "var(--fs-11)",
            color: "var(--fg-3)",
            display: "flex",
            alignItems: "center",
            gap: "0.4375rem",
          }}
        >
          <Tip text={copied ? "Copied!" : "Copy full SHA"}>
            <button
              type="button"
              onClick={copyHash}
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                border: "1px solid var(--bd-soft)",
                borderRadius: "0.25rem",
                padding: "0.0625rem 0.3125rem",
                background: "var(--bg-2)",
                color: copied ? "var(--live)" : "var(--fg-2)",
                cursor: "pointer",
                fontSize: "var(--fs-10)",
              }}
            >
              {selected.hash.slice(0, 9)}
              <span style={{ display: "inline-flex" }}>{copied ? Ico.check : Ico.copy}</span>
            </button>
          </Tip>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {selected.author}
          </span>
          <span style={{ flexShrink: 0 }}>{selected.relative}</span>
        </div>
        {body && (
          <div
            className="scroll mono"
            style={{
              maxHeight: "8rem",
              overflow: "auto",
              padding: "0.5rem 0.625rem",
              borderBottom: "1px solid var(--bd-soft)",
              fontSize: "var(--fs-11)",
              lineHeight: 1.5,
              color: "var(--fg-2)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "var(--bg-1)",
            }}
          >
            {body}
          </div>
        )}
        <DiffBody
          diff={diff}
          emptyLabel="No changes in this commit."
          style={{ flex: 1, minHeight: 0, overflow: "auto" }}
        />
      </div>
    );
  }

  return (
    <div className="scroll" style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
      {rows.map((r) => (
        <CommitRow
          key={r.commit.hash}
          row={r}
          width={width}
          onClick={() => setSelected(r.commit)}
        />
      ))}
    </div>
  );
}

// SVG geometry units (px-exempt — a fixed glyph grid; the wrapper sizes it in
// rem so it still scales with the fluid root). Lanes past MAX_LANES collapse
// onto the last column so the graph gutter stays narrow on deep histories.
const COL = 12;
const ROW = 36;
const DOT = 3.4;
const MAX_LANES = 6;

const clampCol = (c: number) => (c < MAX_LANES ? c : MAX_LANES - 1);

interface Seg {
  key: string;
  d: string;
  color: string;
  // Through-lanes (a branch merely passing the row) render dim so the commit's
  // own thread — its convergence + parent fan — stays the brightest mark.
  dim?: boolean;
}

// Connector between two lane points. A straight line when the column holds; for
// a lane shift the horizontal move is CONFINED to a short band around the
// segment's midpoint (vertical rail → tight S-bend → vertical rail) so a row
// where many lanes shift at once reads as neat parallel rails, not a fan of
// full-span diagonal sweeps.
function lanePath(x1: number, y1: number, x2: number, y2: number): string {
  if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const ym = (y1 + y2) / 2;
  const t = Math.min(Math.abs(y2 - y1) / 2, 6);
  return `M ${x1} ${y1} L ${x1} ${ym - t} C ${x1} ${ym}, ${x2} ${ym}, ${x2} ${ym + t} L ${x2} ${y2}`;
}

function commitSegs(row: GraphRow): Seg[] {
  const cx = (c: number) => clampCol(c) * COL + COL / 2;
  const mid = ROW / 2;
  const segs: Seg[] = [];
  // Passing lanes: each incoming lane that isn't this commit flows to its
  // outgoing column — curved when it shifts, straight when it holds.
  row.incoming.forEach((v, i) => {
    if (v == null) return;
    if (v === row.commit.hash) {
      // Convergence / continuation INTO the dot — top half only.
      segs.push({
        key: `in${i}`,
        d: lanePath(cx(i), 0, cx(row.col), mid),
        color: laneColor(clampCol(row.col)),
      });
    } else {
      const o = row.outgoing.indexOf(v);
      if (o >= 0)
        segs.push({
          key: `ps${i}`,
          d: lanePath(cx(i), 0, cx(o), ROW),
          color: laneColor(clampCol(o)),
          dim: true,
        });
    }
  });
  // Fan-out from the dot to each parent's outgoing column — bottom half.
  row.parentCols.forEach((pc, i) => {
    segs.push({
      key: `pr${i}`,
      d: lanePath(cx(row.col), mid, cx(pc), ROW),
      color: laneColor(clampCol(pc)),
    });
  });
  return segs;
}

// Middle-ellipsis so sibling branches that share a long prefix stay
// distinguishable — end-truncation collapses `feat/completion-toast` and
// `feat/completion-companion` to an identical "feat/completion-…", which is the
// noise this view suffered from. Keeps both the namespace and the leaf.
function midTruncate(s: string, max = 20): string {
  if (s.length <= max) return s;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${s.slice(0, head)}…${s.slice(s.length - tail)}`;
}

interface RefChip {
  key: string;
  label: string;
  full: string;
  color: string;
  kind: "head" | "tag" | "branch" | "remote";
  pushed: boolean;
}

// Collapse a commit's raw git decoration into display chips: drop the redundant
// `origin/<x>` when local `<x>` is present (the local chip carries a "pushed"
// mark instead), drop `origin/HEAD` noise, classify HEAD / tag / local / remote,
// and order them HEAD → local branch → tag → remote-only. This is what turns the
// old wall of identical truncated badges into a legible, deduped set.
function refChips(refs: string[]): RefChip[] {
  const locals = new Set(
    refs.filter((r) => r !== "HEAD" && !r.startsWith("tag:") && !r.startsWith("origin/")),
  );
  const chips: RefChip[] = [];
  for (const ref of refs) {
    if (ref === "HEAD") {
      chips.push({
        key: ref,
        label: "HEAD",
        full: "HEAD (detached)",
        color: "var(--done)",
        kind: "head",
        pushed: false,
      }); // prettier-ignore
    } else if (ref.startsWith("tag:")) {
      const t = ref.replace(/^tag:\s*/, "");
      chips.push({
        key: ref,
        label: midTruncate(t),
        full: t,
        color: "var(--wait)",
        kind: "tag",
        pushed: false,
      }); // prettier-ignore
    } else if (ref.startsWith("origin/")) {
      const bare = ref.slice("origin/".length);
      if (bare === "HEAD" || locals.has(bare)) continue; // redundant with local / noise
      chips.push({
        key: ref,
        label: midTruncate(bare),
        full: ref,
        color: "var(--idle)",
        kind: "remote",
        pushed: false,
      }); // prettier-ignore
    } else {
      chips.push({
        key: ref,
        label: midTruncate(ref),
        full: ref,
        color: "var(--pri)",
        kind: "branch",
        pushed: refs.includes(`origin/${ref}`),
      }); // prettier-ignore
    }
  }
  const rank = { head: 0, branch: 1, tag: 2, remote: 3 } as const;
  return chips.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

// Compact ref chip for graph rows. Branch tips lead with a fork glyph, tags with
// a tag glyph, remote-only branches read muted; a pushed local branch gets a
// faint up-tick so it's distinct from a not-yet-pushed one without a 2nd badge.
function RefBadge({ chip }: { chip: RefChip }) {
  const { color, label, kind, pushed } = chip;
  return (
    <span
      className="mono"
      style={{
        flexShrink: 0,
        minWidth: 0,
        maxWidth: "10rem",
        marginRight: "0.25rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.1875rem",
        padding: "0 0.3125rem 0 0.25rem",
        height: "1rem",
        lineHeight: "1rem",
        borderRadius: "0.25rem",
        fontSize: "var(--fs-10)",
        letterSpacing: "0.01em",
        color,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-flex", flexShrink: 0, opacity: 0.85 }}>
        {kind === "tag" ? RefIco.tag : kind === "head" ? RefIco.head : RefIco.branch}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      {pushed && (
        <span style={{ display: "inline-flex", flexShrink: 0, opacity: 0.6 }}>{RefIco.pushed}</span>
      )}
    </span>
  );
}

// Tiny inline glyphs for the ref chips (kept local — these are 9px decorative
// marks, not the shared icon set used for controls).
const RefIco = {
  branch: (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 6v4M6 5h2M4 9c0-3 3-2 6-3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  tag: (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2h5l7 7-5 5-7-7V2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="5" r="1.1" fill="currentColor" />
    </svg>
  ),
  head: (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  ),
  pushed: (
    <svg width="8" height="8" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 13V4M8 4l-4 4M8 4l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
} as const;

function CommitRow({ row, width, onClick }: { row: GraphRow; width: number; onClick: () => void }) {
  const lanes = Math.min(width, MAX_LANES);
  const w = lanes * COL;
  const cx = (c: number) => clampCol(c) * COL + COL / 2;
  const mid = ROW / 2;
  const dotX = cx(row.col);
  const dotColor = laneColor(clampCol(row.col));
  const segs = commitSegs(row);
  const chips = refChips(row.commit.refs);
  const hasRefs = chips.length > 0;
  const shown = chips.slice(0, 2);
  const extra = chips.length - shown.length;

  return (
    <button
      type="button"
      className="rail-file"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: "0.375rem",
        width: "100%",
        height: `${ROW / 16}rem`,
        textAlign: "left",
        border: "none",
        borderBottom: "1px solid var(--bd-soft)",
        background: "transparent",
        color: "var(--fg-1)",
        cursor: "pointer",
        padding: "0 0.5rem 0 0.25rem",
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${ROW}`}
        width={w}
        height={ROW}
        style={{ width: `${w / 16}rem`, height: `${ROW / 16}rem`, flexShrink: 0 }}
        aria-hidden
      >
        <title>commit graph</title>
        {segs.map((s) => (
          <path
            key={s.key}
            d={s.d}
            stroke={s.color}
            strokeWidth={s.dim ? 1.3 : 1.9}
            strokeOpacity={s.dim ? 0.45 : 1}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {/* Ref/HEAD commits get an outer ring; the solid inner dot sits over the
            connectors so lanes tuck cleanly under it. */}
        {hasRefs && (
          <circle
            cx={dotX}
            cy={mid}
            r={DOT + 2.1}
            fill="var(--bg-1)"
            stroke={dotColor}
            strokeWidth={1.4}
          />
        )}
        <circle cx={dotX} cy={mid} r={DOT} fill={dotColor} />
      </svg>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.0625rem",
          overflow: "hidden",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", minWidth: 0, overflow: "hidden" }}>
          {shown.map((chip) => (
            <Tip key={chip.key} text={chip.full}>
              <RefBadge chip={chip} />
            </Tip>
          ))}
          {extra > 0 && (
            <Tip
              text={chips
                .slice(2)
                .map((c) => c.full)
                .join(", ")}
            >
              <span
                className="mono"
                style={{
                  flexShrink: 0,
                  marginRight: "0.25rem",
                  padding: "0 0.25rem",
                  height: "1rem",
                  lineHeight: "1rem",
                  borderRadius: "0.25rem",
                  fontSize: "var(--fs-10)",
                  color: "var(--fg-3)",
                  background: "var(--bg-3)",
                }}
              >
                +{extra}
              </span>
            </Tip>
          )}
          <Tip text={row.commit.subject}>
            <span
              className="mono"
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: "var(--fs-12)",
                color: "var(--fg-0)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.commit.subject}
            </span>
          </Tip>
        </span>
        <span
          className="mono"
          style={{
            display: "flex",
            gap: "0.4375rem",
            fontSize: "var(--fs-10)",
            color: "var(--fg-3)",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ flexShrink: 0, color: "var(--fg-2)" }}>{row.commit.hash.slice(0, 7)}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.commit.author}
          </span>
          <span style={{ flexShrink: 0 }}>{row.commit.relative}</span>
        </span>
      </span>
    </button>
  );
}

// ── Branches tab ─────────────────────────────────────────────────────────────
function BranchesTab({
  ck,
  reloadKey,
  busy,
  run,
  ask,
}: {
  ck: string;
  reloadKey: number;
  busy: boolean;
  run: RunFn;
  ask: AskFn;
}) {
  const [branches, setBranches] = useState<BranchInfo[] | null>(null);
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-fetches after a write action.
  useEffect(() => {
    let alive = true;
    setBranches(null);
    ipc
      .containerGitBranches(ck)
      .then((b) => alive && setBranches(b))
      .catch(() => alive && setBranches([]));
    return () => {
      alive = false;
    };
  }, [ck, reloadKey]);

  const createBranch = () => {
    const name = newName.trim();
    if (!name) return;
    void run(async () => {
      await ipc.containerGitCreateBranch(name, true, ck);
      setNewName("");
      return `Created ${name}.`;
    });
  };

  if (branches === null) return <Loading>Loading branches…</Loading>;

  const q = filter.trim().toLowerCase();
  const match = (b: BranchInfo) => !q || b.name.toLowerCase().includes(q);
  const local = branches.filter((b) => !b.remote && match(b));
  const remote = branches.filter((b) => b.remote && match(b));
  const total = branches.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.4375rem",
          padding: "0.5rem 0.625rem 0.4375rem",
          borderBottom: "1px solid var(--bd-soft)",
        }}
      >
        <div style={{ display: "flex", gap: "0.375rem" }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createBranch();
            }}
            placeholder="New branch name"
            className="h-8 font-mono text-[0.75rem]"
          />
          <Button size="sm" disabled={busy || !newName.trim()} onClick={createBranch}>
            {Ico.plus}
            Create
          </Button>
        </div>
        {total > 6 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0 0.5rem",
              height: "1.875rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--bd-soft)",
              background: "var(--bg-2)",
            }}
          >
            <span style={{ display: "inline-flex", color: "var(--fg-3)", flexShrink: 0 }}>
              {Ico.search}
            </span>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter branches"
              className="h-auto border-0 bg-transparent p-0 font-mono text-[0.75rem] shadow-none focus-visible:ring-0"
            />
            {filter && (
              <IconBtn
                size={18}
                title="Clear filter"
                aria-label="Clear filter"
                onClick={() => setFilter("")}
              >
                {Ico.close}
              </IconBtn>
            )}
          </div>
        )}
      </div>

      <div className="scroll" style={{ overflow: "auto", flex: 1, minHeight: 0 }}>
        <SectionLabel count={local.length}>Local</SectionLabel>
        {local.length === 0 && <EmptyLine>No matching local branches.</EmptyLine>}
        {local.map((b) => (
          <BranchRow
            key={b.name}
            b={b}
            busy={busy}
            onCheckout={
              b.current
                ? undefined
                : () => void run(() => ipc.containerGitCheckout(b.name, ck), `On ${b.name}.`)
            }
            menu={
              b.current ? null : (
                <DropdownMenuContent align="end" className={MENU_CLS}>
                  <DropdownMenuItem
                    className={MENU_ITEM_CLS}
                    onSelect={() =>
                      void run(() => ipc.containerGitCheckout(b.name, ck), `On ${b.name}.`)
                    }
                  >
                    <MenuIco>{Ico.check}</MenuIco>
                    Switch to this branch
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={MENU_ITEM_CLS}
                    variant="destructive"
                    onSelect={() =>
                      ask({
                        title: "Delete branch?",
                        body: `Delete the local branch ${b.name}. Fails if it has unmerged commits.`,
                        confirmLabel: "Delete",
                        danger: true,
                        onConfirm: () =>
                          void run(
                            () => ipc.containerGitDeleteBranch(b.name, false, ck),
                            "Deleted.",
                          ),
                      })
                    }
                  >
                    <MenuIco>{Ico.trash}</MenuIco>
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={MENU_ITEM_CLS}
                    variant="destructive"
                    onSelect={() =>
                      ask({
                        title: "Force delete branch?",
                        body: `Force-delete ${b.name} even if it has unmerged commits. Those commits may become unreachable.`,
                        confirmLabel: "Force delete",
                        danger: true,
                        onConfirm: () =>
                          void run(
                            () => ipc.containerGitDeleteBranch(b.name, true, ck),
                            "Deleted.",
                          ),
                      })
                    }
                  >
                    <MenuIco>{Ico.trash}</MenuIco>
                    Force delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )
            }
          />
        ))}

        {remote.length > 0 && <SectionLabel count={remote.length}>Remote</SectionLabel>}
        {remote.map((b) => {
          // DWIM: checking out the short name creates a tracking branch.
          const short = b.name.includes("/") ? b.name.slice(b.name.indexOf("/") + 1) : b.name;
          return (
            <BranchRow
              key={b.name}
              b={b}
              busy={busy}
              onCheckout={() => void run(() => ipc.containerGitCheckout(short, ck), `On ${short}.`)}
              menu={
                <DropdownMenuContent align="end" className={MENU_CLS}>
                  <DropdownMenuItem
                    className={MENU_ITEM_CLS}
                    onSelect={() =>
                      void run(() => ipc.containerGitCheckout(short, ck), `On ${short}.`)
                    }
                  >
                    <MenuIco>{Ico.download}</MenuIco>
                    Checkout as tracking branch
                  </DropdownMenuItem>
                </DropdownMenuContent>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function BranchRow({
  b,
  busy,
  onCheckout,
  menu,
}: {
  b: BranchInfo;
  busy: boolean;
  onCheckout?: () => void;
  menu: ReactNode;
}) {
  return (
    <div
      className="rail-file sc-row"
      data-active={b.current}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4375rem",
        padding: "0.3125rem 0.625rem 0.3125rem 0.5rem",
        cursor: onCheckout ? "pointer" : "default",
        background: b.current ? "var(--bg-active)" : "transparent",
        boxShadow: b.current ? "inset 0.125rem 0 0 var(--live)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onCheckout}
        disabled={!onCheckout || busy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4375rem",
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          color: "var(--fg-1)",
          cursor: onCheckout ? "pointer" : "default",
          textAlign: "left",
          padding: 0,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            width: "0.875rem",
            display: "inline-flex",
            color: b.current ? "var(--live)" : "var(--fg-3)",
          }}
        >
          {b.current ? Ico.check : Ico.branch}
        </span>
        <Tip
          text={
            b.current
              ? `Current branch · ${b.subject || b.name}`
              : `Click to switch · ${b.subject || b.name}`
          }
        >
          <span
            className="mono"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "var(--fs-12)",
              color: b.current ? "var(--fg-0)" : "var(--fg-1)",
              fontWeight: b.current ? 600 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {b.name}
          </span>
        </Tip>
        {b.ahead > 0 && (
          <span className="mono tnum" style={{ fontSize: "var(--fs-10)", color: "var(--live)" }}>
            ↑{b.ahead}
          </span>
        )}
        {b.behind > 0 && (
          <span className="mono tnum" style={{ fontSize: "var(--fs-10)", color: "var(--wait)" }}>
            ↓{b.behind}
          </span>
        )}
      </button>
      {menu && (
        <DropdownMenu>
          <Tip text="Branch actions">
            <DropdownMenuTrigger asChild>
              <span className="sc-actions" style={{ display: "inline-flex" }}>
                <IconBtn size={20} disabled={busy} aria-label={`Actions for ${b.name}`}>
                  {Ico.more}
                </IconBtn>
              </span>
            </DropdownMenuTrigger>
          </Tip>
          {menu}
        </DropdownMenu>
      )}
    </div>
  );
}

function SectionLabel({
  children,
  count,
  action,
}: {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 0.4375rem 0.1875rem 0.625rem",
      }}
    >
      <span className="lbl" style={{ fontSize: "var(--fs-10)", color: "var(--fg-3)" }}>
        {children}
      </span>
      {typeof count === "number" && (
        <span
          className="mono tnum"
          style={{
            fontSize: "var(--fs-10)",
            color: "var(--fg-3)",
            background: "var(--bg-3)",
            borderRadius: "0.625rem",
            padding: "0 0.3125rem",
            lineHeight: "1.05rem",
          }}
        >
          {count}
        </span>
      )}
      <span style={{ flex: 1 }} />
      {action}
    </div>
  );
}

function EmptyLine({ children }: { children: string }) {
  return (
    <div
      style={{
        padding: "0.375rem 0.75rem",
        color: "var(--fg-3)",
        fontSize: "var(--fs-11)",
      }}
    >
      {children}
    </div>
  );
}

function Empty({ children, icon }: { children: string; icon?: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "1.5rem 1rem",
        textAlign: "center",
        color: "var(--fg-3)",
        fontSize: "var(--fs-12)",
      }}
    >
      {icon && (
        <span style={{ display: "inline-flex", color: "var(--fg-4)", transform: "scale(1.6)" }}>
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

function Loading({ children }: { children: string }) {
  return (
    <div
      className="mono"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4375rem",
        padding: "1.5rem 1rem",
        color: "var(--fg-3)",
        fontSize: "var(--fs-12)",
      }}
    >
      <span style={{ display: "inline-flex" }}>{Ico.spinner}</span>
      {children}
    </div>
  );
}
