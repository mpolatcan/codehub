import { create } from "zustand";
import type { SplitDir } from "./tree";

// Context carried while the spawn modal is open. `session` present → the launch
// splits that pane; absent → it opens a new tab.
export interface LaunchCtx {
  dir: SplitDir;
  session?: string;
}

// Every launch surface (new-tab "+", ⌘T, pane split controls, sidebar "New
// agent") opens the SAME spawn modal (see components/SpawnModal). The store
// tracks which surface opened it by key plus the split context, so a keyboard
// shortcut can open it without a synthetic click. Keys:
//   "newtab" / "tabbar" — a new-tab spawn (no split context)
//   "split:<session>"   — a pane head's split (carries dir + session in ctx)
interface LauncherState {
  openKey: string | null;
  ctx: LaunchCtx | null;
  open: (key: string, ctx?: LaunchCtx) => void;
  close: () => void;
}

export const useLauncher = create<LauncherState>((set) => ({
  openKey: null,
  ctx: null,
  open: (openKey, ctx) => set({ openKey, ctx: ctx ?? null }),
  close: () => set({ openKey: null, ctx: null }),
}));

export const splitKey = (session: string) => `split:${session}`;
