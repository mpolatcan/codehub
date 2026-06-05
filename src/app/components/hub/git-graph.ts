import type { GraphCommit } from "../../lib/ipc";

// Swim-lane layout for the commit DAG (Source-control "History" graph). Walk the
// commits in the order git returned them (`--date-order`), tracking which commit
// each active lane is "waiting" to draw next. Each row records the column of its
// own dot plus the lane arrays entering (top edge) and leaving (bottom edge) the
// row, so the SVG renderer can draw continuous connectors — passing lanes, merge
// convergence, and the fan-out to parents — one row band at a time. Pure (no
// JSX) so the algorithm can be reasoned about on its own.

export interface GraphRow {
  commit: GraphCommit;
  // Column of this commit's dot.
  col: number;
  // Lane targets (commit hashes) entering this row at the top edge.
  incoming: (string | null)[];
  // Lane targets leaving this row at the bottom edge.
  outgoing: (string | null)[];
  // Outgoing column for each parent (the dot's fan-out), parents[i] → parentCols[i].
  parentCols: number[];
}

function firstFree(lanes: (string | null)[]): number {
  const i = lanes.indexOf(null);
  return i === -1 ? lanes.length : i;
}

export function layoutGraph(commits: GraphCommit[]): { rows: GraphRow[]; width: number } {
  const lanes: (string | null)[] = [];
  const rows: GraphRow[] = [];
  let width = 1;
  for (const commit of commits) {
    const incoming = lanes.slice();
    // This commit's lane is whichever one was waiting for it; if none (a tip),
    // claim the first free column.
    let col = lanes.indexOf(commit.hash);
    if (col === -1) {
      col = firstFree(lanes);
      lanes[col] = commit.hash;
    }
    // Converge: any OTHER lane also waiting for this commit merges into `col`.
    for (let i = 0; i < lanes.length; i++) {
      if (i !== col && lanes[i] === commit.hash) lanes[i] = null;
    }
    // Fan out to parents: the first parent continues this lane; the rest take a
    // fresh column (or reuse one already targeting that parent so a shared
    // ancestor converges later).
    const parentCols: number[] = [];
    if (commit.parents.length === 0) {
      lanes[col] = null; // root commit — the lane ends here
    } else {
      commit.parents.forEach((p, idx) => {
        if (idx === 0) {
          lanes[col] = p;
          parentCols.push(col);
        } else {
          let pc = lanes.indexOf(p);
          if (pc === -1) {
            pc = firstFree(lanes);
            lanes[pc] = p;
          }
          parentCols.push(pc);
        }
      });
    }
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop();
    const outgoing = lanes.slice();
    width = Math.max(width, incoming.length, outgoing.length, col + 1);
    rows.push({ commit, col, incoming, outgoing, parentCols });
  }
  return { rows, width };
}

// A small token-backed palette cycled per lane so adjacent branches read apart.
export const LANE_COLORS = [
  "var(--pri)",
  "var(--a-claude)",
  "var(--a-codex)",
  "var(--live)",
  "var(--wait)",
  "var(--a-antigravity)",
  "var(--done)",
];

export function laneColor(col: number): string {
  return LANE_COLORS[((col % LANE_COLORS.length) + LANE_COLORS.length) % LANE_COLORS.length];
}
