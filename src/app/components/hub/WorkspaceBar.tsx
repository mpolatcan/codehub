import { Ico } from "../../components/primitives/icons";
import { activeWorkspace, useStore } from "../../lib/store";
import { workspaceLeaves } from "../../lib/tree";

// Workspace meta strip, ported from design/screens/main-hub-a.jsx. Sits BELOW
// the group grid, between the grid and the pane-actions bar (design order:
// grid → meta strip → actions → status).
//
// REAL, git-only: the /workspace working-tree summary from the shared
// container_git_status poll (branch + ahead/behind + uncommitted count). The
// design's multi-repo "2 repos" count and CI ✓ / tests / lint badges have NO
// backend source (CodeHub mounts ONE /workspace, and there's no CI/test runner
// wired) — they're dropped rather than faked. The right side shows the real
// agent count for this workspace; per-spend cost lives on the Usage screen.
const AGENT_CLIS = new Set(["claude", "codex", "antigravity"]);

export function WorkspaceBar() {
  const git = useStore((s) => s.gitStatus);
  const ws = useStore(activeWorkspace);
  const sessionMeta = useStore((s) => s.sessionMeta);

  // Count agent panes (exclude shell/utility panes) across all groups of the tab.
  const sessions = ws ? workspaceLeaves(ws) : [];
  const agentCount = sessions.filter((s) => AGENT_CLIS.has(sessionMeta[s]?.cli ?? "")).length;
  const groupCount = ws?.groups.length ?? 0;

  return (
    <div
      style={{
        height: 26,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        borderTop: "1px solid var(--bd-soft)",
        background: "var(--bg-1)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--fg-2)",
      }}
    >
      {/* /workspace git summary — real, from the shared git poll. */}
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--fg-1)" }}
        title={git?.isRepo ? `/workspace · ${git.branch ?? "detached"}` : "/workspace"}
      >
        {Ico.branch}
        {git?.isRepo ? (
          <>
            <span>{git.branch ?? "detached"}</span>
            {git.total > 0 ? (
              <span style={{ color: "var(--wait)" }}>+{git.total} uncommitted</span>
            ) : (
              <span style={{ color: "var(--fg-3)" }}>clean</span>
            )}
            {git.ahead > 0 && <span style={{ color: "var(--fg-3)" }}>↑{git.ahead}</span>}
            {git.behind > 0 && <span style={{ color: "var(--fg-3)" }}>↓{git.behind}</span>}
          </>
        ) : (
          <span style={{ color: "var(--fg-3)" }}>not a git repository</span>
        )}
      </span>

      <span style={{ flex: 1 }} />

      <span title="Agent panes in this workspace">
        {agentCount} agent{agentCount === 1 ? "" : "s"}
      </span>
      {groupCount > 1 && <span style={{ color: "var(--fg-3)" }}>{groupCount} groups</span>}
    </div>
  );
}
