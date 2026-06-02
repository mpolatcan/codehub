import {
  type Pane,
  createPane,
  destroyPane as destroyTerminal,
  fitPane,
  focusPane,
  setPaneFontSize,
} from "../../terminal";

// Pane registry — xterm surfaces live here, OUTSIDE React. React renders empty
// slots; <PaneMount> moves a pane's DOM node into the active slot and parks it
// back in the stash on unmount. The Terminal is never disposed during
// reparenting, so buffers survive splits and tab switches (proven in Phase 0).

const stash = document.createElement("div");
stash.className = "pane-stash";
stash.style.cssText =
  "position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";
document.body.appendChild(stash);

const panes = new Map<string, Pane>();

// Terminal font size, fed from the persisted config store. Kept module-level (not
// in the React/Zustand tree) so the framework-agnostic pane registry stays
// decoupled — the store pushes changes in via setFontSize rather than panes.ts
// importing the store (which would cycle).
//
// `baseFontSize` is the Settings value, authored for the 1440×900 identity size
// (where the fluid root == 16px). The EFFECTIVE size SCALES with the live root, so
// the terminal grows/shrinks with the rest of the chrome instead of being the one
// fixed-px island in an otherwise fluid UI. This also de-rasterizes the terminal on
// large low-DPI monitors: at devicePixelRatio 1 a bigger glyph gets more device
// pixels per cell, so curves read smoother.
let baseFontSize = 13;

// Live root font px (the clamp() in theme.css). 16 == the design identity.
function rootPx(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

// Responsive px fed to xterm. xterm's `fontSize` is a NUMBER (no rem / responsive
// unit), so we derive the px from the fluid root ourselves. Rounded to an integer:
// fractional cell sizes blur on the canvas renderer, and the integer step doubles
// as debouncing — the grid only reflows when the size crosses a whole-px boundary.
function effectiveFontSize(): number {
  return Math.max(8, Math.round((baseFontSize * rootPx()) / 16));
}

// Re-apply the effective size to every open pane (setPaneFontSize no-ops when a
// pane is already at that size, so most resize ticks cost nothing).
function applyFontSize(): void {
  const fs = effectiveFontSize();
  for (const pane of panes.values()) setPaneFontSize(pane, fs);
}

// The chrome rescales itself via CSS (the clamp root); the terminal needs JS to
// follow, since xterm can't take a responsive unit. Recompute on window resize,
// coalesced to one rAF.
let fontResizeFrame: number | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    if (fontResizeFrame !== null) return;
    fontResizeFrame = requestAnimationFrame(() => {
      fontResizeFrame = null;
      applyFontSize();
    });
  });
}

// Create + attach a pane's terminal to the backend. Awaited by store actions
// before the layout references the session, so PaneMount always finds it.
// `workspace` is the per-workspace-container key (the session's workspace id) so
// the attach targets the container that workspace's session lives in.
export async function spawnPane(name: string, workspace?: string): Promise<void> {
  if (panes.has(name)) return;
  const pane = await createPane(stash, name, effectiveFontSize(), workspace);
  panes.set(name, pane);
}

// Apply a new BASE terminal font size (the persisted setting) to every open pane
// and remember it for panes spawned later. No-op when unchanged.
export function setFontSize(size: number): void {
  if (size === baseFontSize) return;
  baseFontSize = size;
  applyFontSize();
}

export function getPane(name: string): Pane | undefined {
  return panes.get(name);
}

export function mountPane(name: string, slot: HTMLElement): void {
  const pane = panes.get(name);
  if (pane) slot.appendChild(pane.el);
}

export function parkPane(name: string): void {
  const pane = panes.get(name);
  if (pane) stash.appendChild(pane.el);
}

// Tear a pane down. Callers MUST kill the tmux session FIRST (see store
// closeSession / CLAUDE.md), then call this — destroyPane runs detach_session.
export async function destroyPane(name: string): Promise<void> {
  const pane = panes.get(name);
  if (!pane) return;
  panes.delete(name);
  await destroyTerminal(pane);
}

export function fit(name: string): void {
  const pane = panes.get(name);
  if (pane) fitPane(pane);
}

export function focus(name: string): void {
  const pane = panes.get(name);
  if (pane) focusPane(pane);
}
