import { create } from "zustand";

// Global overlays that float above or dock into every view: the command palette
// (⌘K), keyboard-shortcuts cheat sheet (⌘/), and hub utility panels. Kept in
// their own tiny store, like the launcher, so opening one from a keyboard
// handler or the Hub toolbar doesn't touch app state.
interface OverlayState {
  palette: boolean;
  shortcuts: boolean;
  // Path whose diff is open in the DiffViewer: a /workspace path, the empty
  // string "" for the combined "all changes" view, or null when closed. Lives
  // here (not in ActivityRail's local state) so both the Hub toolbar's Diff
  // button and the rail's file rows drive the same viewer.
  diff: string | null;
  // Files browser open/closed. Like `diff`, lives here so the Hub toolbar's
  // Files button (and later a shortcut) drive the one viewer.
  files: boolean;
  // Workspace-level Shell panel open/closed. This is the design's docked bottom
  // utility panel, separate from agent split panes and restored by the Hub when
  // toggled from the ActionBar / shortcut.
  shell: boolean;
  // Workspace container Details panel open/closed (⌘I, the ActionBar "Details"
  // chip). A right-docked panel — live cpu/mem/net/disk gauges + sparklines,
  // health (uptime/restart/oom), mounts, and lifecycle controls — scoped to the
  // active workspace's container. Peer of Files/Shell/Diff.
  details: boolean;
  // Resume drawer open/closed (⌘R, the ActionBar "Resume" button, Welcome's
  // "Browse sessions" card). A docked right-side drawer over the live hub — past
  // Claude/Codex transcripts, grouped by agent. Lives here (not a top-level view)
  // so resuming pulls a session INTO the current workspace without leaving it.
  resume: boolean;
  // Which side the Resume drawer docks on (design resume.jsx header toggle). The
  // drawer replaces the activity-rail slot on the right by default; the user can
  // flip it to the left of the hub. Session-local (a UI preference, not data).
  resumeSide: "left" | "right";
  // About dialog open/closed — app + environment identity (real data), opened
  // from the sidebar wordmark. A modal "About this app", separate from the
  // Settings › About pane which embeds the same facts in the config surface.
  about: boolean;
  // New-workspace wizard open/closed (the launcher's "Blank workspace" template).
  // A modal that creates a saved workspace + opens its first agent. Lives here so
  // the launcher (and a keyboard handler) can open it directly.
  newWorkspace: boolean;
  // Launcher overlay open/closed (⌘T, the tab-bar "+"). The Welcome content —
  // recent workspaces, resume, blank/GitHub templates — rendered as a modal
  // ABOVE the live hub, so a workspace can be reopened/resumed WITHOUT first
  // closing every tab (the Welcome screen itself only renders when no tab is
  // open). The single entry point for "open / create / resume a workspace".
  launcher: boolean;
  // File preview panel — path of the file being previewed on the right side,
  // or null when closed. Set from the FilesBrowser listing; the panel renders
  // in HubView as a right-side sibling (independent of DiffViewer).
  filePreview: string | null;
  // Focus mode (design hub-states HubStateFocus): the active group's focused pane
  // is maximized; its siblings collapse to a "Minimized · N" side strip. Esc (or
  // the strip's "Show all") exits. Only meaningful when the group has 2+ panes;
  // session-local UI state. The store clears it on every group/workspace switch
  // (resetGridOverlays in switchWorkspace/setActiveGroup) so it can't bleed into
  // another group's grid.
  focusMode: boolean;
  // Session being dragged across the pane grid (design hub-states HubStateDragging),
  // or null when no drag is in flight. Set on a pane header dragstart so every
  // OTHER leaf renders its drop-zone overlay; cleared on dragend/drop, and
  // defensively on any group/workspace switch (resetGridOverlays) so a drag cut
  // short by a switch can't leave every pane stuck showing its overlay. Lives here
  // (not React state) so the source leaf and all target leaves coordinate without
  // prop-drilling through the split tree.
  dragSession: string | null;
  setPalette: (open: boolean) => void;
  setShortcuts: (open: boolean) => void;
  setDiff: (path: string | null) => void;
  setFiles: (open: boolean) => void;
  setShell: (open: boolean) => void;
  setDetails: (open: boolean) => void;
  setResume: (open: boolean) => void;
  setResumeSide: (side: "left" | "right") => void;
  setAbout: (open: boolean) => void;
  setNewWorkspace: (open: boolean) => void;
  setLauncher: (open: boolean) => void;
  setFilePreview: (path: string | null) => void;
  setFocusMode: (on: boolean) => void;
  setDragSession: (session: string | null) => void;
  togglePalette: () => void;
  toggleShortcuts: () => void;
}

export const useOverlay = create<OverlayState>((set) => ({
  palette: false,
  shortcuts: false,
  diff: null,
  files: false,
  shell: false,
  details: false,
  resume: false,
  resumeSide: "right",
  about: false,
  newWorkspace: false,
  launcher: false,
  filePreview: null,
  focusMode: false,
  dragSession: null,
  setPalette: (palette) => set({ palette }),
  setShortcuts: (shortcuts) => set({ shortcuts }),
  // Diff + FilePreview share the right dock — opening one closes the other so
  // they can't stack alongside Files and crush the terminal grid to slivers.
  setDiff: (diff) => set(diff !== null ? { diff, filePreview: null } : { diff }),
  setFiles: (files) => set({ files }),
  setShell: (shell) => set({ shell }),
  setDetails: (details) => set({ details }),
  setResume: (resume) => set({ resume }),
  setResumeSide: (resumeSide) => set({ resumeSide }),
  setAbout: (about) => set({ about }),
  setNewWorkspace: (newWorkspace) => set({ newWorkspace }),
  setLauncher: (launcher) => set({ launcher }),
  setFilePreview: (filePreview) =>
    set(filePreview !== null ? { filePreview, diff: null } : { filePreview }),
  setFocusMode: (focusMode) => set({ focusMode }),
  setDragSession: (dragSession) => set({ dragSession }),
  // Opening one overlay closes the other so they never stack.
  togglePalette: () => set((s) => ({ palette: !s.palette, shortcuts: false })),
  toggleShortcuts: () => set((s) => ({ shortcuts: !s.shortcuts, palette: false })),
}));
