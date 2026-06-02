import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

// Drag-to-resize for a docked panel, mirroring the split-divider drag in
// Grid.tsx: mousedown → document mousemove updates the size live → mouseup
// commits. The size persists to localStorage (per `key`) like lib/theme.ts —
// pure UI preference, no backend/IPC round-trip. Returns a ref to attach to the
// panel's motion root (for edge geometry) + a `beginResize` mousedown handler +
// `reset` (double-click → default).
//
// `size` is in REM (render it as `${size}rem`), so a docked panel scales with
// the fluid root font like the rest of the chrome instead of sitting at a fixed
// px width. The pointer delta is px, so the drag converts px→rem against the
// live root font-size — the edge still tracks the cursor 1:1 at any window scale.
// `def`, `min`, and `max` (and the max thunk's return) are all rem.

export type DockEdge = "left" | "right" | "top";

// Live root font-size in px (the fluid `html` clamp), for px↔rem conversion.
export function rootPx(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

interface Opts {
  min: number; // rem
  // Fixed cap (rem), or a thunk returning a rem cap (e.g. viewport-relative).
  max: number | (() => number);
  edge: DockEdge;
}

export interface ResizableDock {
  size: number; // rem — render as `${size}rem`
  dragging: boolean;
  ref: RefObject<HTMLElement | null>;
  beginResize: (e: React.MouseEvent) => void;
  reset: () => void;
}

export function useResizableDock(key: string, def: number, opts: Opts): ResizableDock {
  const ref = useRef<HTMLElement | null>(null);
  const clamp = useCallback(
    (v: number) => {
      const max = typeof opts.max === "function" ? opts.max() : opts.max;
      return Math.max(opts.min, Math.min(max, v));
    },
    [opts.max, opts.min],
  );

  const [size, setSize] = useState<number>(() => {
    const raw = Number(localStorage.getItem(key));
    return Number.isFinite(raw) && raw > 0 ? clamp(raw) : clamp(def);
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onResize = () => setSize((current) => clamp(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const beginResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      setDragging(true);
      document.body.classList.add("dragging");
      const ac = new AbortController();
      let latest = size;
      const onMove = (ev: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const rawPx =
          opts.edge === "right"
            ? ev.clientX - rect.left
            : opts.edge === "left"
              ? rect.right - ev.clientX
              : rect.bottom - ev.clientY;
        // px pointer delta → rem against the live root, so the edge tracks the
        // cursor 1:1 now and the panel scales with the root afterward.
        latest = clamp(rawPx / rootPx());
        setSize(latest);
      };
      const onUp = () => {
        ac.abort();
        setDragging(false);
        document.body.classList.remove("dragging");
        localStorage.setItem(key, latest.toFixed(3));
      };
      document.addEventListener("mousemove", onMove, { signal: ac.signal });
      document.addEventListener("mouseup", onUp, { signal: ac.signal });
    },
    [size, clamp, key, opts.edge],
  );

  const reset = useCallback(() => {
    setSize(def);
    localStorage.removeItem(key);
  }, [def, key]);

  return { size, dragging, ref, beginResize, reset };
}
