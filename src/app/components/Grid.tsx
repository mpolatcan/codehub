import { useEffect, useRef } from "react";
import { groupKey, useLauncher } from "../lib/launcher";
import * as registry from "../lib/panes";
import { useStore } from "../lib/store";
import type { Group, LayoutNode, SplitNode, Workspace } from "../lib/tree";
import { activeGroup, leavesOf } from "../lib/tree";
import { PaneHead } from "./PaneHead";
import { PaneMount } from "./PaneMount";
import { Ico } from "./primitives/icons";

// Renders the active pane group's binary split tree. Leaves carry a PaneHead +
// the reparented xterm surface (PaneMount); split nodes lay out two cells with a
// draggable divider between them. An empty group (no panes) shows the
// group-grid empty-state CTA (design GroupGrid).
export function Grid({ ws }: { ws: Workspace }) {
  const group = activeGroup(ws);
  if (!group?.root) return <EmptyGroup ws={ws} group={group} />;
  return <RenderNode node={group.root} ws={ws} group={group} />;
}

// Empty-group state (design GroupGrid empty branch): a dashed-plus affordance +
// a quick-spawn CTA. The CTA opens the shared launcher targeted at this group
// (groupKey ctx), so the spawn lands here rather than in a new tab.
function EmptyGroup({ ws, group }: { ws: Workspace; group: Group }) {
  const open = useLauncher((s) => s.open);
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "var(--bg-0)",
        minHeight: 0,
        width: "100%",
        padding: 32,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: "1.5px dashed var(--bd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--fg-3)",
          }}
        >
          {Ico.plus}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: group.color }} />
          <span style={{ fontSize: 15, color: "var(--fg-0)", fontWeight: 500 }}>{group.name}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", textAlign: "center", maxWidth: 384 }}>
          This group is empty. Add an agent to start working here.
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          open(groupKey(group.id), { dir: "row", groupId: group.id, workspaceId: ws.id })
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 14px",
          borderRadius: 7,
          border: "none",
          background: "var(--pri)",
          color: "var(--pri-fg, #fff)",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {Ico.plus}
        <span>Add agent</span>
      </button>
    </div>
  );
}

function RenderNode({ node, ws, group }: { node: LayoutNode; ws: Workspace; group: Group }) {
  if (node.kind === "leaf") {
    return <Leaf session={node.session} group={group} />;
  }
  return <Split node={node} ws={ws} group={group} />;
}

function Leaf({ session, group }: { session: string; group: Group }) {
  const focusSession = useStore((s) => s.focusSession);
  const focused = group.focused === session;
  return (
    <div
      className={`pane-leaf${focused ? " focused" : ""}`}
      data-session={session}
      onMouseDown={() => focusSession(session)}
    >
      <PaneHead session={session} />
      <div className="pane-body">
        <PaneMount session={session} />
      </div>
    </div>
  );
}

function Split({ node, ws, group }: { node: SplitNode; ws: Workspace; group: Group }) {
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const commitRatio = useStore((s) => s.commitRatio);
  // Aborts an in-flight drag's document listeners if this Split unmounts (e.g. a
  // sibling close collapses the split, or the tab switches) before mouseup.
  const dragAbort = useRef<AbortController | null>(null);

  useEffect(() => () => dragAbort.current?.abort(), []);

  const onDividerDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const container = wrapRef.current;
    if (!container) return;
    const horizontal = node.dir === "row";
    let latest = node.ratio;

    const ac = new AbortController();
    dragAbort.current = ac;
    const { signal } = ac;

    const onMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const total = horizontal ? rect.width : rect.height;
      if (total <= 0) return;
      const pos = horizontal ? ev.clientX - rect.left : ev.clientY - rect.top;
      latest = Math.min(0.85, Math.max(0.15, pos / total));
      if (aRef.current) aRef.current.style.flex = `${latest} 1 0`;
      if (bRef.current) bRef.current.style.flex = `${1 - latest} 1 0`;
    };
    const onUp = () => {
      ac.abort();
      dragAbort.current = null;
      document.body.classList.remove("dragging");
      commitRatio(ws.id, node.id, latest);
      for (const s of leavesOf(node)) registry.fit(s);
    };
    document.addEventListener("mousemove", onMove, { signal });
    document.addEventListener("mouseup", onUp, { signal });
    document.body.classList.add("dragging");
  };

  return (
    <div ref={wrapRef} className={`split ${node.dir}`}>
      <div ref={aRef} className="split-cell" style={{ flex: `${node.ratio} 1 0` }}>
        <RenderNode key={node.a.id} node={node.a} ws={ws} group={group} />
      </div>
      <div className={`divider ${node.dir}`} onMouseDown={onDividerDown} />
      <div ref={bRef} className="split-cell" style={{ flex: `${1 - node.ratio} 1 0` }}>
        <RenderNode key={node.b.id} node={node.b} ws={ws} group={group} />
      </div>
    </div>
  );
}
