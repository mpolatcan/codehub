import { create } from "zustand";

// Global overlays that float above every view: the command palette (⌘K) and the
// keyboard-shortcuts cheat sheet (⌘/). Kept in their own tiny store, like the
// launcher, so opening one from a keyboard handler doesn't touch app state.
interface OverlayState {
  palette: boolean;
  shortcuts: boolean;
  setPalette: (open: boolean) => void;
  setShortcuts: (open: boolean) => void;
  togglePalette: () => void;
  toggleShortcuts: () => void;
}

export const useOverlay = create<OverlayState>((set) => ({
  palette: false,
  shortcuts: false,
  setPalette: (palette) => set({ palette }),
  setShortcuts: (shortcuts) => set({ shortcuts }),
  // Opening one overlay closes the other so they never stack.
  togglePalette: () => set((s) => ({ palette: !s.palette, shortcuts: false })),
  toggleShortcuts: () => set((s) => ({ shortcuts: !s.shortcuts, palette: false })),
}));
