import { type ReactNode, useEffect, useState } from "react";
import { PaneHead } from "../components/PaneHead";
import { PaneMount } from "../components/PaneMount";
import { AgentGlyph } from "../components/primitives/AgentGlyph";
import { StatusDot } from "../components/primitives/StatusDot";
import { Ico } from "../components/primitives/icons";
import { joinPath as join, orderEntries as order } from "../lib/fs";
import { type FileEntry, type GitStatus, ipc } from "../lib/ipc";
import { splitKey, useLauncher } from "../lib/launcher";
import { getPane } from "../lib/panes";
import { activeWorkspace, useStore } from "../lib/store";
import { leavesList } from "../lib/tree";

// Workspace view — the 3-pane layout from design/screens/workspace.jsx: a real
// /workspace file tree on the left, then the active workspace's live panes
// (agent or shell, each a reparented xterm via PaneMount, same registry the Hub
// uses) tiled across the rest. Nothing here is mocked: the tree reads the
// container fs (container_list_dir, lazily per directory) with git marks from
// container_git_status, and the panes ARE the live sessions. Clicking a file
// types its path into the focused pane — a real assist, no fabricated preview.
//
// This view and the Hub are mutually exclusive, so they never fight over a
// pane's single DOM node (the registry reparents on view switch, exactly like
// the tabs↔compare-grid toggle).

const ROOT = "/workspace";

// Map a porcelain XY code to a single-letter mark + tone. Added/untracked → A
// (live), anything else changed → M (wait). Unknown/clean → none.
function gitMark(status: string | undefined): { mark: string; color: string } | null {
  if (!status) return null;
  const s = status.trim();
  if (s === "??" || s.startsWith("A")) return { mark: "A", color: "var(--live)" };
  if (s.includes("D")) return { mark: "D", color: "var(--err)" };
  return { mark: "M", color: "var(--wait)" };
}

export function Workspace() {
  const ws = useStore(activeWorkspace);
  const focused = ws?.focused;
  const sessions = ws ? leavesList(ws.root) : [];

  // Git status of /workspace, fetched once on mount (real; em-dash-ish empty
  // when not a repo or runtime down). Keyed by path relative to /workspace.
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

  const marks = new Map<string, string>();
  for (const f of git?.files ?? []) marks.set(`${ROOT}/${f.path}`, f.status);

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
      {/* 3-pane body: files + the workspace's live panes */}
      <div style={{ flex: 1, display: "flex", gap: 1, background: "var(--bd-soft)", minHeight: 0 }}>
        <FilesPane marks={marks} total={git?.total ?? null} onPick={insertPath} />

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

// ── FILES PANE ─────────────────────────────────────────────────────────
function FilesPane({
  marks,
  total,
  onPick,
}: {
  marks: Map<string, string>;
  total: number | null;
  onPick: (path: string) => void;
}) {
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
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
          {ROOT}
        </span>
      </div>

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
        <DirNode dir={ROOT} depth={0} marks={marks} onPick={onPick} />
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
        <span>{total != null ? `${total} changed` : "—"}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "var(--fg-3)" }}>click a file → focused pane</span>
      </div>
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
  onPick,
}: {
  dir: string;
  depth: number;
  marks: Map<string, string>;
  onPick: (path: string) => void;
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
  const rows = order(entries);
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
        empty
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
              marks={marks}
              onPick={onPick}
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

// A directory row that toggles its own DirNode child on click.
function DirRow({
  name,
  path,
  depth,
  marks,
  onPick,
}: {
  name: string;
  path: string;
  depth: number;
  marks: Map<string, string>;
  onPick: (p: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
      </button>
      {open && <DirNode dir={path} depth={depth + 1} marks={marks} onPick={onPick} />}
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
// surface (PaneMount), prefixed with a type chip (AGENT vs SHELL).
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
          padding: "5px 10px 0",
          background: "var(--bg-1)",
        }}
      >
        <PaneTypeChip kind={kind} agent={meta.cli} />
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

// PaneTypeChip — colored label for a pane's role. Static indicator (CodeHub does
// not convert a live pane's type), so no dropdown affordance, unlike the design's
// switcher mock.
function PaneTypeChip({ kind, agent }: { kind: "agent" | "shell" | "files"; agent?: string }) {
  const map = {
    agent: { label: "AGENT", color: `var(--a-${agent ?? "claude"})` },
    shell: { label: "SHELL", color: "var(--live)" },
    files: { label: "FILES", color: "var(--idle)" },
  } as const;
  const m = map[kind];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 7px",
        borderRadius: 4,
        background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
        color: m.color,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        border: `1px solid color-mix(in oklab, ${m.color} 25%, transparent)`,
      }}
    >
      {kind === "agent" && agent && <AgentGlyph agent={agent} size={11} color={m.color} />}
      {m.label}
    </span>
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
        <span>
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
