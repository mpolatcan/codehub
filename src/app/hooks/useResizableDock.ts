import { type RefObject, useCallback, useRef, useState } from "react";

// Drag-to-resize for a docked panel, mirroring the split-divider drag in
// Grid.tsx: mousedown → document mousemove updates the size live → mouseup
// commits. The size persists to localStorage (per `key`) like lib/theme.ts —
// pure UI preference, no backend/IPC round-trip. Returns a ref to attach to the
// panel's motion root (for edge geometry) + a `beginResize` mousedown handler +
// `reset` (double-click → default).

export type DockEdge = "left" | "right" | "top";

interface Opts {
  min: number;
  // Fixed cap, or a thunk for a viewport-relative cap (e.g. () => innerHeight*0.7).
  max: number | (() => number);
  edge: DockEdge;
}

export interface ResizableDock {
  size: number;
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
    return Number.isFinite(raw) && raw > 0 ? clamp(raw) : def;
  });
  const [dragging, setDragging] = useState(false);

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
        const raw =
          opts.edge === "right"
            ? ev.clientX - rect.left
            : opts.edge === "left"
              ? rect.right - ev.clientX
              : rect.bottom - ev.clientY;
        latest = clamp(raw);
        setSize(latest);
      };
      const onUp = () => {
        ac.abort();
        setDragging(false);
        document.body.classList.remove("dragging");
        localStorage.setItem(key, String(Math.round(latest)));
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
