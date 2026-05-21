import { useLayoutEffect, useRef } from "react";
import { getOrCreatePane, parkPane } from "./paneRegistry";

// Mounts a registry pane's DOM node into this slot. On unmount (layout change,
// tab-switch) the node is parked back in the stash — NOT disposed — so the
// Terminal instance and its buffer survive. This is the React-idiomatic form of
// the vanilla app's manual reparenting.
export function PaneMount({ id }: { id: string }) {
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const pane = getOrCreatePane(id);
    slot.appendChild(pane.el);
    requestAnimationFrame(() => {
      try {
        pane.fit.fit();
      } catch {
        // slot momentarily zero-sized during reflow
      }
    });
    return () => {
      parkPane(pane);
    };
  }, [id]);

  return (
    <div
      ref={slotRef}
      className="pane-slot"
      style={{ position: "relative", flex: 1, minWidth: 0, minHeight: 0 }}
    />
  );
}
