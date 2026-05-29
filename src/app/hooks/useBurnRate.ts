import { useEffect, useRef, useState } from "react";
import { ipc } from "../lib/ipc";
import { useStore } from "../lib/store";

// Derived spend-rate ($/h) for the Hub status bar (design "burn $0.62/h").
//
// There is no billing API to read a real burn rate from. What IS real is the
// backend's cumulative *estimated* cost (claude_usage.estCostUsd = transcript
// tokens × a dated price table). We sample that cumulative estimate on a slow
// poll and divide its delta by elapsed wall-clock to get a rate — a genuine
// measurement of how fast the estimate is climbing, not a fabricated number.
//
// Honesty: it's an estimate of an estimate, surfaced as such (the status bar
// labels it "token-derived estimate, not billed"). Returns null until there are
// two samples spanning enough time to divide — fresh sessions show an em-dash
// rather than a guessed rate. Cleared when the runtime is down.
const POLL_MS = 30_000; // slow — claude_usage walks transcripts
const WINDOW_MS = 6 * 60_000; // rolling 6-minute window
const MIN_SPAN_MS = 45_000; // need at least this much elapsed to call it a rate

interface Sample {
  t: number;
  cost: number;
}

// Rolling rate samples retained for the status-bar sparkline. At the 30s poll
// this is ~15 min of trend — sparse but real (no fabricated points).
const SERIES_WINDOW = 30;

export interface BurnInfo {
  // Latest $/h rate, or null until two samples span enough wall-clock.
  rate: number | null;
  // History of computed rates (newest last) for a sparkline.
  series: number[];
}

export function useBurnRate(): BurnInfo {
  const running = useStore((s) => s.status?.state === "running");
  const samples = useRef<Sample[]>([]);
  const seriesRef = useRef<number[]>([]);
  const [info, setInfo] = useState<BurnInfo>({ rate: null, series: [] });

  useEffect(() => {
    if (!running) {
      samples.current = [];
      seriesRef.current = [];
      setInfo({ rate: null, series: [] });
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const usage = await ipc.claudeUsage();
        if (!alive) return;
        const now = Date.now();
        const buf = samples.current;
        buf.push({ t: now, cost: usage.estCostUsd });
        // Drop samples older than the rolling window (keep one straddler so the
        // window stays full-width as soon as enough time has passed).
        while (buf.length > 2 && buf[1].t < now - WINDOW_MS) buf.shift();

        const oldest = buf[0];
        const newest = buf[buf.length - 1];
        const spanMs = newest.t - oldest.t;
        if (buf.length < 2 || spanMs < MIN_SPAN_MS) {
          setInfo({ rate: null, series: seriesRef.current });
          return;
        }
        const perHour = ((newest.cost - oldest.cost) / spanMs) * 3_600_000;
        const rate = perHour > 0 ? perHour : 0;
        seriesRef.current = [...seriesRef.current, rate].slice(-SERIES_WINDOW);
        setInfo({ rate, series: seriesRef.current });
      } catch {
        // A failed read (runtime dropped mid-poll) just leaves the last value; the
        // running-flag effect clears it when the runtime actually goes down.
      }
    };
    void tick();
    const h = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running]);

  return info;
}
