import type { ContainerStats } from "./ipc";

// The container_stats poll cadence (ms), used to turn a cumulative byte delta
// into a per-second rate. Mirrors STATS_POLL_MS in useContainerStatsPoll.
const POLL_MS = 2000;

// rx+tx bytes/sec from the last two cumulative samples. null until two samples
// exist; a negative delta (counter reset on container restart) clamps to 0.
export function deriveNetRate(history: ContainerStats[]): number | null {
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  const cur = history[history.length - 1];
  const dRx = Math.max(0, cur.netRx - prev.netRx);
  const dTx = Math.max(0, cur.netTx - prev.netTx);
  return ((dRx + dTx) / POLL_MS) * 1000;
}

// Per-interval net RATE series (bytes/sec) for a sparkline — NOT the cumulative
// byte counter (which only climbs and would peg a chart to a solid block).
export function netRateSeries(history: ContainerStats[]): number[] {
  if (history.length < 2) return [];
  return history.slice(1).map((s, i) => {
    const p = history[i];
    return ((Math.max(0, s.netRx - p.netRx) + Math.max(0, s.netTx - p.netTx)) / POLL_MS) * 1000;
  });
}
