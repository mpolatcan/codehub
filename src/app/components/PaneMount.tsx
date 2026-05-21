import { useLayoutEffect, useRef } from "react";
import * as registry from "../lib/panes";

// Moves a pre-created pane's xterm DOM node into this slot, and parks it back in
// the offscreen stash on unmount. The Terminal is never disposed here — only
// closeSession (store) tears a pane down. This is what lets buffers survive
// splits and tab switches.
export function PaneMount({ session }: { session: string }) {
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    registry.mountPane(session, slot);
    const raf = requestAnimationFrame(() => registry.fit(session));
    return () => {
      cancelAnimationFrame(raf);
      registry.parkPane(session);
    };
  }, [session]);

  return <div ref={slotRef} className="relative flex-1 min-w-0 min-h-0" />;
}
