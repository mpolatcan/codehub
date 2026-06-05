import { useEffect } from "react";
import { useOverlay } from "../lib/overlay";
import { confirmCloseRunningSession, confirmCloseWorkspace, useStore } from "../lib/store";
import { type Theme, applyTheme, getStoredTheme, persistTheme } from "../lib/theme";
import { type SplitDir, activeGroup } from "../lib/tree";

// Split the focused pane along its longer visible axis — wider panes split into
// a row (side-by-side), taller ones into a column. Compares the leaf's dataset
// rather than building a selector: bootstrap-imported tmux names can contain
// selector-special chars and would throw querySelector.
export function autoSplitDir(session: string): SplitDir {
  const el = [...document.querySelectorAll<HTMLElement>(".pane-leaf")].find(
    (n) => n.dataset.session === session,
  );
  return el && el.clientWidth >= el.clientHeight ? "row" : "col";
}

// Global keyboard shortcuts. ONE clean scheme — every binding here is also
// listed verbatim in the cheat sheet (Shortcuts.tsx) and on the matching UI
// control, and NONE shadow a reserved webview/OS combo (notably ⌘R is left free
// for window reload). Keep all three in sync when changing a binding.
//
//   ⌘/Ctrl T  — open the launcher (new / recent / resume workspace)
//   ⌘/Ctrl N  — new agent in the current workspace (split focused / fill empty group)
//   ⌘⇧N       — new agent in a fresh group
//   ⌘/Ctrl W  — close the focused pane
//   ⌘⇧W       — close the active workspace tab
//   ⌘[ / ⌘]   — previous / next workspace tab
//   ⌘/Ctrl 1-9 — switch to tab N
//   ⌘/Ctrl \  — split the focused pane (longer axis); ⌘⇧\ forces the other axis
//   ⌘/Ctrl E  — toggle the Files docked viewer
//   ⌘/Ctrl D  — toggle the Source-control dock
//   ⌘/Ctrl J  — toggle the Shell docked panel
//   ⌘/Ctrl I  — toggle the Details (workspace metrics) panel
//   ⌘B        — collapse/expand the sidebar
//   ⌘/Ctrl K  — command palette
//   ⌘/Ctrl ,  — settings
//   ⌘⇧L       — cycle theme (dark → gray → light)
//   ⌘/Ctrl /  — keyboard-shortcuts cheat sheet
//   ?          — cheat sheet when focus is outside an editor/terminal
//   (⌘⇧J — toggle the macOS Dynamic Island — is a process-global shortcut,
//    registered in the Rust backend, not here.)
//
// Attached at the capture phase so they win over xterm.js, which installs its
// own keydown handler on the pane textarea. Skipped while the inline rename
// field is focused so ⌘W there doesn't nuke the pane mid-edit.
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const editable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        target?.getAttribute("role") === "textbox";

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !editable) {
        e.preventDefault();
        useOverlay.getState().toggleShortcuts();
        return;
      }

      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (target?.classList?.contains("pane-name-input")) return;

      const store = useStore.getState();
      const overlay = useOverlay.getState();
      const ws = store.workspaces.find((w) => w.id === store.activeWorkspaceId);
      // The focused session of the active group — every grid shortcut acts on it.
      const focused = ws ? (activeGroup(ws)?.focused ?? null) : null;

      // While the palette / cheat sheet is open, only the two toggles below stay
      // live (so ⌘K and ⌘/ can dismiss). Everything else — ⌘W, ⌘\, ⌘N, ⌘1-9 —
      // would act on the pane hidden behind the dialog, so swallow it. esc is
      // handled by Radix on the dialog itself.
      if (overlay.palette || overlay.shortcuts) {
        if (e.key === "k" || e.key === "/") {
          e.preventDefault();
          if (e.key === "k") overlay.togglePalette();
          else overlay.toggleShortcuts();
        }
        return;
      }

      // ⌘1-9 — jump to tab by index.
      if (/^[1-9]$/.test(e.key)) {
        const tab = store.workspaces[Number(e.key) - 1];
        if (tab) {
          e.preventDefault();
          store.switchWorkspace(tab.id);
        }
        return;
      }

      if (e.key === "[" || e.key === "]") {
        if (store.workspaces.length === 0 || !store.activeWorkspaceId) return;
        const idx = store.workspaces.findIndex((w) => w.id === store.activeWorkspaceId);
        if (idx === -1) return;
        e.preventDefault();
        const dir = e.key === "[" ? -1 : 1;
        const next =
          store.workspaces[(idx + dir + store.workspaces.length) % store.workspaces.length];
        store.switchWorkspace(next.id);
        return;
      }

      switch (e.key.toLowerCase()) {
        case "t":
          // ⌘T — open the launcher tab (new / recent / resume workspace). Force
          // the hub view first (the launcher renders there); setView clears the
          // launcher, so open it AFTER.
          e.preventDefault();
          store.setView("hub");
          overlay.setLauncher(true);
          break;
        case "n": {
          // ⌘N — drop a configuring pane in the current workspace; ⌘⇧N — in a
          // fresh group. No workspace at all → open the launcher (need one first).
          e.preventDefault();
          if (!ws) {
            overlay.setLauncher(true);
            break;
          }
          if (e.shiftKey) {
            const gid = store.addGroup(ws.id);
            store.beginGroupSpawn(ws.id, gid);
          } else {
            // Auto-place into the active group's even ≤3-col grid (no half-split
            // of the focused pane).
            store.beginGroupSpawn(ws.id, ws.activeGroupId);
          }
          break;
        }
        case "k":
          e.preventDefault();
          useOverlay.getState().togglePalette();
          break;
        case "/":
          e.preventDefault();
          useOverlay.getState().toggleShortcuts();
          break;
        case "w":
          e.preventDefault();
          if (e.shiftKey) {
            if (!ws) return;
            if (confirmCloseWorkspace(ws.id)) void store.closeWorkspace(ws.id);
            return;
          }
          if (!focused) return;
          if (!confirmCloseRunningSession(focused)) return;
          void store.closeSession(focused);
          break;
        case ",":
          e.preventDefault();
          store.setView("settings");
          break;
        case "e": // toggle the Files docked viewer
          e.preventDefault();
          overlay.setFiles(!overlay.files);
          break;
        case "d": // toggle the Source-control dock
          e.preventDefault();
          overlay.setDiff(overlay.diff === null ? "" : null);
          break;
        case "j": // toggle the Shell docked panel
          e.preventDefault();
          overlay.setShell(!overlay.shell);
          break;
        case "i": // toggle the Details (workspace metrics) panel
          e.preventDefault();
          overlay.setDetails(!overlay.details);
          break;
        case "b": // collapse / expand the sidebar
          e.preventDefault();
          store.toggleSidebar();
          break;
        case "l":
          // ⌘⇧L — cycle theme (dark → gray → light). Applies + persists directly
          // (Settings re-reads on mount); no-op without shift so ⌘L stays free.
          if (e.shiftKey) {
            e.preventDefault();
            const cur = getStoredTheme();
            const next: Theme = cur === "dark" ? "gray" : cur === "gray" ? "light" : "dark";
            applyTheme(next);
            persistTheme(next);
          }
          break;
        case "|":
        case "\\": {
          if (!focused) return;
          e.preventDefault();
          // ⌘⇧\ (arrives as "|") forces the opposite axis; plain ⌘\ auto-picks.
          store.beginSplitSpawn(focused, e.shiftKey ? "col" : autoSplitDir(focused));
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}
