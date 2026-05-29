import { useEffect } from "react";
import { ipc } from "../lib/ipc";
import { activeWorkspace, useStore } from "../lib/store";

// Single app-wide poll of container_stats (cpu/mem/net/disk) into the store while
// the runtime is up. Centralized deliberately: the surfaces that show resource
// gauges (Hub bar + status bar, Workspace + SessionDetail headers, Dashboard,
// Container inspector) all READ `containerStats` from the store instead of each
// firing its own poll. Mount ONCE at the app root. Clears to null when no
// workspace is active so the gauges fall back to honest em-dashes.
const STATS_POLL_MS = 2000;

export function useContainerStatsPoll() {
  const running = useStore((s) => s.status?.state === "running");
  const containerKey = useStore((s) => activeWorkspace(s)?.containerKey);
  const setContainerStats = useStore((s) => s.setContainerStats);
  const setContainerHealth = useStore((s) => s.setContainerHealth);
  const clearStatsHistory = useStore((s) => s.clearStatsHistory);

  useEffect(() => {
    if (!running || !containerKey) {
      setContainerStats(null);
      setContainerHealth(null);
      return;
    }
    // New container / runtime just came up → start a fresh sparkline window so the
    // previous container's series doesn't splice into this one.
    clearStatsHistory();
    let alive = true;
    const tick = () => {
      ipc
        .containerStats(containerKey)
        .then((s) => alive && setContainerStats(s))
        .catch(() => alive && setContainerStats(null));
      // Health (uptime/restart/oom) rides the same poll + active container so the
      // bottom-bar runtime dot and the Details panel share one snapshot.
      ipc
        .containerHealth(containerKey)
        .then((h) => alive && setContainerHealth(h))
        .catch(() => alive && setContainerHealth(null));
    };
    tick();
    const h = setInterval(tick, STATS_POLL_MS);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running, containerKey, setContainerStats, setContainerHealth, clearStatsHistory]);
}
