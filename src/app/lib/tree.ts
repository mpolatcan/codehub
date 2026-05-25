import type { Cli, Mode } from "./ipc";

// A workspace (tab) owns a binary split tree of sessions. Leaves are sessions;
// split nodes divide space row/col with a ratio. Ported verbatim from the
// vanilla layout model so behaviour (and TEST_SCENARIOS) stays identical.

export type SplitDir = "row" | "col";

export interface LeafNode {
  kind: "leaf";
  id: number;
  session: string;
}

export interface SplitNode {
  kind: "split";
  id: number;
  dir: SplitDir;
  ratio: number;
  a: LayoutNode;
  b: LayoutNode;
}

export type LayoutNode = LeafNode | SplitNode;

// A group is a named, colored set of panes within a workspace — it owns its own
// split tree + focus (design/screens/main-hub-a.jsx `GroupsBar` / `GroupGrid`).
// A workspace holds N groups; one is active and shown in the grid. tmux sessions
// stay flat in the single shared container — groups are frontend organisation.
export interface Group {
  id: string;
  name: string;
  color: string;
  root: LayoutNode | null;
  focused: string | null;
}

export interface Workspace {
  id: string;
  plate: number;
  groups: Group[];
  activeGroupId: string;
}

export interface SessionMeta {
  cli: Cli;
  num: number;
  alias: string;
  mode: Mode;
  workspaceId: string;
  // Group within the workspace this session's pane lives in.
  groupId: string;
  // Claude conversation id this session was launched with (`--session-id`, or
  // the id it resumed). Lets the Hub read this session's own transcript for a
  // live token tally. Only set for Claude sessions.
  claudeId?: string;
}

let nodeCounter = 0;
export function nid(): number {
  nodeCounter += 1;
  return nodeCounter;
}

// Group accent palette — design GroupTab dots cycle these (var(--*) tokens).
export const GROUP_COLORS = [
  "var(--pri)",
  "var(--a-codex)",
  "var(--live)",
  "var(--wait)",
  "var(--idle)",
];

let groupCounter = 0;
export function makeGroup(
  name?: string,
  root: LayoutNode | null = null,
  focused: string | null = null,
  color?: string,
): Group {
  groupCounter += 1;
  const n = groupCounter;
  return {
    id: `grp-${n}-${Date.now().toString(36)}`,
    name: name || `Group ${n}`,
    color: color ?? GROUP_COLORS[(n - 1) % GROUP_COLORS.length],
    root,
    focused,
  };
}

// The group currently shown in the grid. Falls back to the first group so
// callers never have to null-check a malformed workspace.
export function activeGroup(ws: Workspace): Group {
  return ws.groups.find((g) => g.id === ws.activeGroupId) ?? ws.groups[0];
}

// Find which group within a workspace owns a given session (by leaf membership).
export function findGroupOf(ws: Workspace, session: string): Group | undefined {
  return ws.groups.find((g) => g.root != null && leavesList(g.root).includes(session));
}

// All session names across every group of a workspace.
export function workspaceLeaves(ws: Workspace): string[] {
  return ws.groups.flatMap((g) => leavesList(g.root));
}

// Immutably replace one group in a workspace's group list.
export function updateGroup(ws: Workspace, groupId: string, fn: (g: Group) => Group): Workspace {
  return { ...ws, groups: ws.groups.map((g) => (g.id === groupId ? fn(g) : g)) };
}

export function leafNode(session: string): LeafNode {
  return { kind: "leaf", id: nid(), session };
}

export function* leavesOf(node: LayoutNode): Generator<string> {
  if (node.kind === "leaf") {
    yield node.session;
  } else {
    yield* leavesOf(node.a);
    yield* leavesOf(node.b);
  }
}

export function leavesList(node: LayoutNode | null): string[] {
  return node ? [...leavesOf(node)] : [];
}

export function firstLeaf(node: LayoutNode): string {
  return leavesOf(node).next().value as string;
}

export function replaceLeaf(
  node: LayoutNode,
  session: string,
  make: (leaf: LeafNode) => LayoutNode,
): LayoutNode {
  if (node.kind === "leaf") {
    return node.session === session ? make(node) : node;
  }
  return {
    ...node,
    a: replaceLeaf(node.a, session, make),
    b: replaceLeaf(node.b, session, make),
  };
}

export function removeLeaf(node: LayoutNode, session: string): LayoutNode | null {
  if (node.kind === "leaf") {
    return node.session === session ? null : node;
  }
  const a = removeLeaf(node.a, session);
  const b = removeLeaf(node.b, session);
  if (a === null) return b;
  if (b === null) return a;
  return { ...node, a, b };
}

// Swap two sessions' positions in the tree by exchanging the `session` field on
// their leaves. No node is added or removed and no tmux session dies — the two
// panes just trade slots, so their xterm surfaces survive (PaneMount reparents
// by session on the next render). Used by drag-to-center "swap" (hub-states
// HubStateDragging). Returns the node unchanged if either session is absent.
export function swapLeaves(node: LayoutNode, a: string, b: string): LayoutNode {
  if (a === b) return node;
  if (node.kind === "leaf") {
    if (node.session === a) return { ...node, session: b };
    if (node.session === b) return { ...node, session: a };
    return node;
  }
  return { ...node, a: swapLeaves(node.a, a, b), b: swapLeaves(node.b, a, b) };
}

// Move a session next to a target, splitting the target's slot in `dir`. The
// dragged leaf is removed from its current position (collapsing its old split,
// like a close) and re-inserted beside `target`; `before=true` places the moved
// pane on the leading side (top/left), else trailing (bottom/right). No tmux
// session dies — both panes survive the reshape (drag-to-edge split, hub-states
// HubStateDragging). No-op when moving onto itself.
export function moveLeaf(
  node: LayoutNode,
  session: string,
  target: string,
  dir: SplitDir,
  before: boolean,
): LayoutNode {
  if (session === target) return node;
  const without = removeLeaf(node, session);
  if (without === null) return node; // dragged leaf was the whole tree — nothing to do
  const moved = leafNode(session);
  return replaceLeaf(without, target, (leaf) => ({
    kind: "split",
    id: nid(),
    dir,
    ratio: 0.5,
    a: before ? moved : leaf,
    b: before ? leaf : moved,
  }));
}

// Immutably set a split node's ratio by node id (used by divider drag commit).
export function setRatio(node: LayoutNode, id: number, ratio: number): LayoutNode {
  if (node.kind === "leaf") return node;
  if (node.id === id) return { ...node, ratio };
  return { ...node, a: setRatio(node.a, id, ratio), b: setRatio(node.b, id, ratio) };
}
