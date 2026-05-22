import { create } from "zustand";

// Global overlays that float above every view: the command palette (⌘K), the
// keyboard-shortcuts cheat sheet (⌘/), and the diff viewer. Kept in their own
// tiny store, like the launcher, so opening one from a keyboard handler or the
// Hub toolbar doesn't touch app state.
interface OverlayState {
  palette: boolean;
  shortcuts: boolean;
  // Path whose diff is open in the DiffViewer: a /workspace path, the empty
  // string "" for the combined "all changes" view, or null when closed. Lives
  // here (not in ActivityRail's local state) so both the Hub toolbar's Diff
  // button and the rail's file rows drive the same viewer.
  diff: string | null;
  setPalette: (open: boolean) => void;
  setShortcuts: (open: boolean) => void;
  setDiff: (path: string | null) => void;
  togglePalette: () => void;
  toggleShortcuts: () => void;
}

export const useOverlay = create<OverlayState>((set) => ({
  palette: false,
  shortcuts: false,
  diff: null,
  setPalette: (palette) => set({ palette }),
  setShortcuts: (shortcuts) => set({ shortcuts }),
  setDiff: (diff) => set({ diff }),
  // Opening one overlay closes the other so they never stack.
  togglePalette: () => set((s) => ({ palette: !s.palette, shortcuts: false })),
  toggleShortcuts: () => set((s) => ({ shortcuts: !s.shortcuts, palette: false })),
}));
