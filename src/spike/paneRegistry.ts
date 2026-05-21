import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

// PHASE-0 SPIKE — proves an xterm Terminal can survive being reparented between
// React-rendered slots (split, tab-switch) without being remounted or disposed.
// The registry lives OUTSIDE React; React only renders empty slots and a
// <PaneMount> moves the pane's DOM node into the active slot. Buffers persist
// because the Terminal instance is never recreated.

export interface SpikePane {
  id: string;
  el: HTMLDivElement;
  term: Terminal;
  fit: FitAddon;
  /** Which creation this was — must stay stable across reparenting. */
  bornAt: number;
}

// Offscreen parking lot for panes not currently mounted in the tree.
const stash = document.createElement("div");
stash.style.cssText =
  "position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";
document.body.appendChild(stash);

const panes = new Map<string, SpikePane>();

// Global counter: total Terminal instances ever created. The spike asserts this
// does NOT grow when panes are merely moved between slots.
let creations = 0;
export function creationCount(): number {
  return creations;
}

export function getOrCreatePane(id: string): SpikePane {
  const existing = panes.get(id);
  if (existing) return existing;

  creations += 1;
  const bornAt = creations;

  const el = document.createElement("div");
  el.className = "spike-term-surface";
  el.style.cssText = "position:absolute;inset:0";
  el.dataset.bornAt = String(bornAt);
  stash.appendChild(el);

  const term = new Terminal({
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 13,
    cursorBlink: true,
    theme: { background: "#131417", foreground: "#c9cdd4", cursor: "#e8a33d" },
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(el);

  // Seed a unique, identifiable buffer. If reparenting remounted/recreated the
  // terminal, this line would be lost or the bornAt would change.
  term.writeln(`\x1b[38;2;232;163;61m# pane ${id} — born #${bornAt}\x1b[0m`);
  term.writeln(`seeded at ${new Date().toISOString()}`);
  term.write("$ ");

  const pane: SpikePane = { id, el, term, fit, bornAt };
  panes.set(id, pane);
  return pane;
}

export function parkPane(pane: SpikePane) {
  stash.appendChild(pane.el);
}

// First non-empty line of the terminal buffer — used to confirm the seeded
// content survived reparenting.
export function firstBufferLine(pane: SpikePane): string {
  const buf = pane.term.buffer.active;
  for (let i = 0; i < buf.length; i++) {
    const line = buf.getLine(i)?.translateToString(true) ?? "";
    if (line.trim()) return line.trim();
  }
  return "(empty)";
}
