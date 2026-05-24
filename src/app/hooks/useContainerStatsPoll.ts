import { useEffect } from "react";
import { ipc } from "../lib/ipc";
import { useStore } from "../lib/store";

// Single app-wide poll of container_stats (cpu/mem/net/disk) into the store while
// the runtime is up. Centralized deliberately: the surfaces that show resource
// gauges (Hub bar + status bar, Workspace + SessionDetail headers, Dashboard,
// Container inspector) all READ `containerStats` from the store instead of each
// firing its own poll. A docker `stats` read is ~1-2s (stream:false waits for a
// sample); six independent pollers contended on the daemon and stacked latency
// so the first reading took many seconds to appear. One poller fixes that.
// Mount ONCE at the app root. Clears to null when the runtime goes down so the
// gauges fall back to honest em-dashes rather than freezing a dead snapshot.
const STATS_POLL_MS = 2000;

export function useContainerStatsPoll() {
  const running = useStore((s) => s.status?.state === "running");
  const setContainerStats = useStore((s) => s.setContainerStats);

  useEffect(() => {
    if (!running) {
      setContainerStats(null);
      return;
    }
    let alive = true;
    const tick = () => {
      ipc
        .containerStats()
        .then((s) => alive && setContainerStats(s))
        .catch(() => alive && setContainerStats(null));
    };
    tick();
    const h = setInterval(tick, STATS_POLL_MS);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running, setContainerStats]);
}
