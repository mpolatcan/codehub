import { type ReactNode, useEffect, useMemo, useState } from "react";
import { PaneHead } from "../components/PaneHead";
import { PaneMount } from "../components/PaneMount";
import { AgentGlyph } from "../components/primitives/AgentGlyph";
import { IconBtn } from "../components/primitives/IconBtn";
import { PaneTypeChip } from "../components/primitives/PaneTypeChip";
import { StatusDot } from "../components/primitives/StatusDot";
import { Ico } from "../components/primitives/icons";
import { joinPath as join, orderEntries as order } from "../lib/fs";
import {
  type ContainerStats,
  type ContainerStatus,
  type FileEntry,
  type GitStatus,
  ipc,
} from "../lib/ipc";
import { splitKey, useLauncher } from "../lib/launcher";
import { getPane } from "../lib/panes";
import { activeWorkspace, useStore } from "../lib/store";
import { leavesList } from "../lib/tree";

// Workspace view — the 3-pane layout from design/screens/workspace.jsx: a real
// /workspace file tree on the left, then the active workspace's live panes
// (agent or shell, each a reparented xterm via PaneMount, same registry the Hub
// uses) tiled across the rest. Nothing here is mocked: the tree reads the
// container fs (container_list_dir, lazily per directory) with git marks from
// container_git_status, the panes ARE the live sessions, and the session header
// reads the real runtime identity (container_status) + live resource stats
// (container_stats). Cost has no per-session source for shell/workspace panes,
// so it renders an honest em-dash — never a fabricated dollar figure.
//
// This view and the Hub are mutually exclusive, so they never fight over a
// pane's single DOM node (the registry reparents on view switch, exactly like
// the tabs↔compare-grid toggle).

const ROOT = "/workspace";

// Map a porcelain XY code to a single-letter mark + tone. Added/untracked → A
// (live), deleted → D (err), anything else changed → M (wait). Clean → none.
function gitMark(status: string | undefined): { mark: string; color: string } | null {
  if (!status) return null;
  const s = status.trim();
  if (s === "??" || s.startsWith("A")) return { mark: "A", color: "var(--live)" };
  if (s.includes("D")) return { mark: "D", color: "var(--err)" };
  return { mark: "M", color: "var(--wait)" };
}

// Real change classification over git.files (no line-count source exists in
// GitStatus, so the footer counts FILES, never fabricates +N/−N lines):
//   added   = untracked/added paths   (A / ??)
//   removed = deleted paths           (D anywhere in the XY code)
// Everything else changed counts toward neither bucket but still in `total`.
function changeTally(git: GitStatus | null): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const f of git?.files ?? []) {
    const s = f.status.trim();
    if (s === "??" || s.startsWith("A")) added++;
    else if (s.includes("D")) removed++;
  }
  return { added, removed };
}

export function Workspace() {
  const ws = useStore(activeWorkspace);
  const status = useStore((s) => s.status);
  const focused = ws?.focused;
  const sessions = ws ? leavesList(ws.root) : [];

  // Git status of /workspace, fetched once on mount (real; honest-empty when not
  // a repo or runtime down). Keyed by path relative to /workspace.
  const [git, setGit] = useState<GitStatus | null>(null);
  useEffect(() => {
    let alive = true;
    ipc
      .containerGitStatus()
      .then((g) => alive && setGit(g))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Live resource snapshot (cpu/mem) from the single app-wide stats poll in the
  // store. Null while down / before the first read → header renders honest
  // em-dashes, never zeros.
  const stats = useStore((s) => s.containerStats);

  // Per-path git mark (absolute /workspace path → raw XY code) + per-directory
  // modified-file counts, derived once from the real git.files list. The dir
  // counts roll every changed file up to each of its ancestor directories so the
  // tree can show "src 9" next to a folder without re-walking the listing.
  const { marks, dirCounts } = useMemo(() => {
    const marks = new Map<string, string>();
    const dirCounts = new Map<string, number>();
    for (const f of git?.files ?? []) {
      marks.set(`${ROOT}/${f.path}`, f.status);
      const parts = f.path.split("/");
      // Every ancestor directory of the changed file gets +1.
      let acc = ROOT;
      for (let i = 0; i < parts.length - 1; i++) {
        acc = `${acc}/${parts[i]}`;
        dirCounts.set(acc, (dirCounts.get(acc) ?? 0) + 1);
      }
    }
    return { marks, dirCounts };
  }, [git]);

  // Type a path into the focused pane's PTY (no trailing newline — the user
  // decides when to send). Real pty_write to the live session.
  const insertPath = (path: string) => {
    if (!focused) return;
    const pane = getPane(focused);
    if (pane) void ipc.ptyWrite(pane.paneId, path);
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--bg-1)",
        height: "100%",
      }}
    >
      <SessionHeader status={status} git={git} stats={stats} />

      {/* 3-pane body: files + the workspace's live panes */}
      <div style={{ flex: 1, display: "flex", gap: 1, background: "var(--bd-soft)", minHeight: 0 }}>
        <FilesPane
          marks={marks}
          dirCounts={dirCounts}
          git={git}
          total={git?.total ?? null}
          onPick={insertPath}
        />

        {sessions.length === 0 ? (
          <EmptyPanes />
        ) : (
          sessions.map((session) => <SessionColumn key={session} session={session} />)
        )}
      </div>

      <StatusBar ws={ws?.plate ?? null} count={sessions.length} git={git} />
    </main>
  );
}

// ── SESSION HEADER ─────────────────────────────────────────────────────
// The container/repo identity bar from the design. Container id + branch are
// real (container_status / container_git_status); cpu/mem are the live polled
// container_stats; cost is em-dash — CodeHub captures no per-session cost for
// shell/workspace panes, and faking one would violate the honesty contract.
function SessionHeader({
  status,
  git,
  stats,
}: {
  status: ContainerStatus | null;
  git: GitStatus | null;
  stats: ContainerStats | null;
}) {
  // Short container id (first 12 hex), matching the inspector's convention; the
  // human name is the fallback label when the id isn't known yet.
  const cid = status?.id ? status.id.slice(0, 12) : null;
  const name = status?.name ?? "codehub-runtime";
  const branch = git?.isRepo ? (git.branch ?? "detached") : null;

  return (
    <div
      style={{
        height: 38,
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid var(--bd-soft)",
        paddingLeft: 8,
        flexShrink: 0,
        background: "var(--bg-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          background: "var(--bg-2)",
          borderRight: "1px solid var(--bd-soft)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "var(--fg-0)",
          }}
        />
        <span style={{ color: "var(--fg-1)", display: "inline-flex" }}>{Ico.container}</span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-0)" }}>
          {cid ?? name}
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-2)" }}>
          {branch ? `${name} · ${branch}` : name}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
          fontSize: 11,
          color: "var(--fg-2)",
        }}
      >
        <span>
          cpu{" "}
          <span className="tnum" style={{ color: "var(--fg-0)" }}>
            {stats ? `${stats.cpuPct.toFixed(0)}%` : "—"}
          </span>
        </span>
        <span>
          mem{" "}
          <span className="tnum" style={{ color: "var(--fg-0)" }}>
            {stats ? memLabel(stats) : "—"}
          </span>
        </span>
        <span className="vr" style={{ height: 14 }} />
        <span>
          cost{" "}
          <span
            className="tnum"
            style={{ color: "var(--fg-2)" }}
            title="No per-session cost source"
          >
            —
          </span>
        </span>
      </div>
    </div>
  );
}

// "1.2/4.0 GiB" when a limit is known, else just the used figure. GiB to mirror
// the design; container_stats gives raw bytes.
function memLabel(stats: ContainerStats): string {
  const gib = (n: number) => (n / 1024 ** 3).toFixed(1);
  if (stats.memLimit > 0) return `${gib(stats.memUsed)}/${gib(stats.memLimit)} GiB`;
  return `${gib(stats.memUsed)} GiB`;
}

// ── FILES PANE ─────────────────────────────────────────────────────────
function FilesPane({
  marks,
  dirCounts,
  git,
  total,
  onPick,
}: {
  marks: Map<string, string>;
  dirCounts: Map<string, number>;
  git: GitStatus | null;
  total: number | null;
  onPick: (path: string) => void;
}) {
  // Breadcrumb reflects the last directory the user expanded (real navigation
  // state); defaults to the workspace root. A live filter narrows the tree by
  // name — it filters what the lazy listing has loaded, nothing fabricated.
  const [crumb, setCrumb] = useState(ROOT);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [modOnly, setModOnly] = useState(false);
  const tally = changeTally(git);

  return (
    <div
      style={{
        flex: "0 0 280px",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-2)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--bd-soft)",
        }}
      >
        <PaneTypeChip kind="files" />
        <span style={{ flex: 1 }} />
        <IconBtn
          title="Search files"
          active={searching}
          style={{ width: 22, height: 22 }}
          onClick={() => {
            setSearching((s) => !s);
            if (searching) setQuery("");
          }}
        >
          {Ico.search}
        </IconBtn>
        <IconBtn
          title={modOnly ? "Show all files" : "Show modified only"}
          active={modOnly}
          style={{ width: 22, height: 22 }}
          onClick={() => setModOnly((m) => !m)}
        >
          {Ico.diff}
        </IconBtn>
      </div>

      {searching && (
        <div
          style={{
            padding: "6px 10px",
            background: "var(--bg-1)",
            borderBottom: "1px solid var(--bd-soft)",
          }}
        >
          <input
            // biome-ignore lint/a11y/noAutofocus: focus the filter the moment it opens
            autoFocus
            className="mono"
            placeholder="filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearching(false);
                setQuery("");
              }
            }}
            style={{
              width: "100%",
              padding: "4px 8px",
              borderRadius: 5,
              border: "1px solid var(--bd-soft)",
              background: "var(--bg-0)",
              color: "var(--fg-0)",
              fontSize: 11.5,
              outline: "none",
            }}
          />
        </div>
      )}

      {/* breadcrumb — clickable ancestors of the focused directory */}
      <Breadcrumb path={crumb} onNav={setCrumb} />

      <div
        className="scroll"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 6px",
          fontFamily: "var(--mono)",
          fontSize: 12,
        }}
      >
        <DirNode
          dir={ROOT}
          depth={0}
          marks={marks}
          dirCounts={dirCounts}
          query={query.trim().toLowerCase()}
          modOnly={modOnly}
          onPick={onPick}
          onEnter={setCrumb}
        />
      </div>

      <div
        className="mono"
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--bd-soft)",
          background: "var(--bg-1)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10.5,
          color: "var(--fg-2)",
        }}
      >
        {/* file-level change deltas — real counts from git.files, not line counts */}
        <span className="tnum" style={{ color: "var(--live)" }} title="Added / untracked files">
          +{tally.added}
        </span>
        <span className="tnum" style={{ color: "var(--err)" }} title="Deleted files">
          −{tally.removed}
        </span>
        <span style={{ flex: 1 }} />
        <span className="tnum">{total != null ? `${total} changed` : "—"}</span>
      </div>
    </div>
  );
}

// Clickable path segments for the focused directory, "/ workspace / src / auth".
function Breadcrumb({ path, onNav }: { path: string; onNav: (p: string) => void }) {
  const segs = path.split("/").filter(Boolean); // ["workspace", "src", "auth"]
  return (
    <div
      className="mono"
      style={{
        padding: "8px 12px",
        fontSize: 11,
        color: "var(--fg-2)",
        borderBottom: "1px solid var(--bd-soft)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ color: "var(--fg-3)" }}>/</span>
      {segs.map((seg, i) => {
        const p = `/${segs.slice(0, i + 1).join("/")}`;
        const last = i === segs.length - 1;
        return (
          <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: "var(--fg-3)" }}>/</span>}
            <button
              type="button"
              disabled={last}
              onClick={() => onNav(p)}
              className={last ? undefined : "rail-file"}
              style={{
                border: "none",
                background: "transparent",
                cursor: last ? "default" : "pointer",
                color: last ? "var(--fg-0)" : "var(--fg-1)",
                padding: "0 1px",
                fontFamily: "var(--mono)",
                fontSize: 11,
              }}
            >
              {seg}
            </button>
          </span>
        );
      })}
    </div>
  );
}

// One directory level — only ever mounted while its parent row is expanded, so
// it loads its listing on mount (container_list_dir = `find -maxdepth 1`), then
// renders child dirs (recursive) + files. null = loading, [] = empty/error.
function DirNode({
  dir,
  depth,
  marks,
  dirCounts,
  query,
  modOnly,
  onPick,
  onEnter,
}: {
  dir: string;
  depth: number;
  marks: Map<string, string>;
  dirCounts: Map<string, number>;
  query: string;
  modOnly: boolean;
  onPick: (path: string) => void;
  onEnter: (path: string) => void;
}) {
  const [entries, setEntries] = useState<FileEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    ipc
      .containerListDir(dir)
      .then((e) => alive && setEntries(e))
      .catch(() => alive && setEntries([]));
    return () => {
      alive = false;
    };
  }, [dir]);

  if (entries === null) {
    return (
      <div
        style={{
          paddingLeft: 8 + depth * 14,
          color: "var(--fg-3)",
          fontSize: 11,
          padding: "2px 8px",
        }}
      >
        …
      </div>
    );
  }
  let rows = order(entries);
  // A live name filter applies to this level's own entries (the tree is lazy, so
  // each level filters what it loaded). Directories always survive so their
  // matching children stay reachable.
  if (query) rows = rows.filter((e) => e.kind === "dir" || e.name.toLowerCase().includes(query));
  // "Show modified only" keeps dirs that contain changes + files with a git mark.
  if (modOnly) {
    rows = rows.filter((e) => {
      const path = join(dir, e.name);
      return e.kind === "dir" ? (dirCounts.get(path) ?? 0) > 0 : marks.has(path);
    });
  }
  if (rows.length === 0) {
    return (
      <div
        style={{
          paddingLeft: 8 + depth * 14,
          color: "var(--fg-3)",
          fontSize: 11,
          padding: "2px 8px",
        }}
      >
        {query || modOnly ? "no matches" : "empty"}
      </div>
    );
  }

  return (
    <>
      {rows.map((e) => {
        const path = join(dir, e.name);
        if (e.kind === "dir") {
          return (
            <DirRow
              key={e.name}
              name={e.name}
              path={path}
              depth={depth}
              modCount={dirCounts.get(path) ?? 0}
              marks={marks}
              dirCounts={dirCounts}
              query={query}
              modOnly={modOnly}
              onPick={onPick}
              onEnter={onEnter}
            />
          );
        }
        return (
          <FileRow
            key={e.name}
            name={e.name}
            mark={marks.get(path)}
            depth={depth}
            onPick={() => onPick(path)}
          />
        );
      })}
    </>
  );
}

// A directory row that toggles its own DirNode child on click and reports the
// path to the breadcrumb. Shows a real per-directory modified-file count.
function DirRow({
  name,
  path,
  depth,
  modCount,
  marks,
  dirCounts,
  query,
  modOnly,
  onPick,
  onEnter,
}: {
  name: string;
  path: string;
  depth: number;
  modCount: number;
  marks: Map<string, string>;
  dirCounts: Map<string, number>;
  query: string;
  modOnly: boolean;
  onPick: (p: string) => void;
  onEnter: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          onEnter(path);
        }}
        className="rail-file"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          width: "100%",
          padding: "3px 8px",
          paddingLeft: 8 + depth * 14,
          borderRadius: 4,
          border: "none",
          background: "transparent",
          color: "var(--fg-0)",
          cursor: "pointer",
          fontFamily: "var(--mono)",
          fontSize: 12,
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 10,
            color: "var(--fg-3)",
            display: "inline-flex",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform .12s",
          }}
        >
          {Ico.chevD}
        </span>
        <span style={{ flex: 1, color: "var(--fg-0)" }}>{name}/</span>
        {modCount > 0 && (
          <span
            className="tnum"
            style={{ fontSize: 10, color: "var(--wait)" }}
            title={`${modCount} modified`}
          >
            {modCount}
          </span>
        )}
      </button>
      {open && (
        <DirNode
          dir={path}
          depth={depth + 1}
          marks={marks}
          dirCounts={dirCounts}
          query={query}
          modOnly={modOnly}
          onPick={onPick}
          onEnter={onEnter}
        />
      )}
    </>
  );
}

function FileRow({
  name,
  mark,
  depth,
  onPick,
}: {
  name: string;
  mark: string | undefined;
  depth: number;
  onPick: () => void;
}) {
  const m = gitMark(mark);
  return (
    <button
      type="button"
      onClick={onPick}
      className="rail-file"
      title={`Type ${name} into the focused pane`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        width: "100%",
        padding: "3px 8px",
        paddingLeft: 8 + depth * 14 + 14,
        borderRadius: 4,
        border: "none",
        background: "transparent",
        color: "var(--fg-1)",
        cursor: "pointer",
        fontFamily: "var(--mono)",
        fontSize: 12,
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "var(--fg-3)" }}>·</span>
      <span style={{ flex: 1, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name}
      </span>
      {m && (
        <span
          className="tnum"
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            background: `color-mix(in oklab, ${m.color} 22%, transparent)`,
            color: m.color,
            fontSize: 9,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {m.mark}
        </span>
      )}
    </button>
  );
}

// ── SESSION COLUMN ─────────────────────────────────────────────────────
// One live pane of the active workspace: reuses PaneHead + the reparented xterm
// surface (PaneMount), prefixed with the shared PaneTypeChip (AGENT vs SHELL).
function SessionColumn({ session }: { session: string }) {
  const meta = useStore((s) => s.sessionMeta[session]);
  const focused = useStore((s) => activeWorkspace(s)?.focused === session);
  const focusSession = useStore((s) => s.focusSession);
  if (!meta) return null;
  const kind = meta.cli === "shell" ? "shell" : "agent";

  return (
    <div
      className={`pane-leaf${focused ? " focused" : ""}`}
      data-session={session}
      onMouseDown={() => focusSession(session)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--bg-0)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px 0",
          background: "var(--bg-1)",
        }}
      >
        <PaneTypeChip kind={kind} />
        {kind === "agent" && (
          <AgentGlyph agent={meta.cli} size={12} color={`var(--a-${meta.cli})`} />
        )}
      </div>
      <PaneHead session={session} />
      <div className="pane-body">
        <PaneMount session={session} />
      </div>
    </div>
  );
}

// Empty middle when the active workspace has no sessions yet.
function EmptyPanes() {
  const openLaunch = useLauncher((s) => s.open);
  const ws = useStore(activeWorkspace);
  const focused = ws?.focused;
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "var(--bg-0)",
        color: "var(--fg-2)",
      }}
    >
      <span className="mono" style={{ fontSize: 12 }}>
        No panes in this workspace.
      </span>
      <button
        type="button"
        onClick={() =>
          openLaunch(
            focused ? splitKey(focused) : "newtab",
            focused ? { dir: "row", session: focused } : undefined,
          )
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid var(--bd)",
          background: "var(--bg-2)",
          color: "var(--fg-0)",
          cursor: "pointer",
          fontSize: 12.5,
        }}
      >
        {Ico.plus}
        New pane
      </button>
    </div>
  );
}

function StatusBar({
  ws,
  count,
  git,
}: {
  ws: number | null;
  count: number;
  git: GitStatus | null;
}) {
  return (
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
        <StatusDot status={count > 0 ? "live" : "idle"} />
        {ws ? `Tab ${ws}` : "no workspace"} · {count} {count === 1 ? "pane" : "panes"}
      </span>
      {git?.isRepo && (
        <span className="tnum">
          {git.branch ?? "detached"} · {git.total} changed
        </span>
      )}
      <span style={{ flex: 1 }} />
      <Hint k="⌘\\" label="split" />
      <Hint k="⌘E" label="files" />
    </div>
  );
}

function Hint({ k, label }: { k: string; label: string }): ReactNode {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span>{label}</span>
    </span>
  );
}
