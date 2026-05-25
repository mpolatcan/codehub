import { PaneAddBtn } from "../../components/primitives/PaneAddBtn";
import { SpawnSplitBtn } from "../../components/primitives/SpawnSplitBtn";
import { Ico } from "../../components/primitives/icons";
import { autoSplitDir } from "../../hooks/useKeyboard";
import { useOverlay } from "../../lib/overlay";
import { activeWorkspace, useStore } from "../../lib/store";
import { activeGroup } from "../../lib/tree";
import { Button } from "../../ui/button";

// Bottom action bar of the Hub, ported from design/screens/hub-states.jsx
// `ActionBar`. Left: Files / Shell / Diff pane affordances. Right: a Resume
// shortcut + the primary SpawnSplitBtn CTA.
//
// REAL wiring: Files / Diff toggle the docked viewers via the overlay store
// (the chip's active fill mirrors their open state); Shell spawns a real bash
// pane (split off the focused pane, or a fresh tab when empty); Resume toggles
// the docked Resume drawer (its fill mirrors the open state). Nothing here
// fabricates data.
export function ActionBar() {
  const filesOpen = useOverlay((s) => s.files);
  const setFiles = useOverlay((s) => s.setFiles);
  const diffOpen = useOverlay((s) => s.diff) !== null;
  const setDiff = useOverlay((s) => s.setDiff);
  const resumeOpen = useOverlay((s) => s.resume);
  const setResume = useOverlay((s) => s.setResume);
  const active = useStore(activeWorkspace);
  const focused = (active && activeGroup(active)?.focused) ?? null;
  const splitSession = useStore((s) => s.splitSession);
  const newPlate = useStore((s) => s.newPlate);

  // Shell is a one-shot spawn: split the focused pane along its longer axis, or
  // open a fresh tab with a shell when nothing is focused. Both store actions
  // already no-op when the runtime is down, so no extra guard is needed.
  const addShell = () => {
    if (focused) void splitSession(focused, autoSplitDir(focused), "shell", "standard");
    else void newPlate("shell", "standard");
  };

  return (
    <div
      style={{
        height: 36,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 12px",
        background: "var(--bg-1)",
        borderTop: "1px solid var(--bd-soft)",
      }}
    >
      <PaneAddBtn kind="files" kbd="⌘E" active={filesOpen} onClick={() => setFiles(!filesOpen)} />
      <PaneAddBtn kind="shell" kbd="⌘⇧B" onClick={addShell} />
      <PaneAddBtn
        kind="diff"
        kbd="⌘D"
        active={diffOpen}
        onClick={() => setDiff(diffOpen ? null : "")}
      />

      <span style={{ flex: 1 }} />

      <Button
        variant="ghost"
        size="xs"
        onClick={() => setResume(!resumeOpen)}
        title={resumeOpen ? "Hide Resume drawer (⌘R)" : "Resume a past session (⌘R)"}
        style={
          resumeOpen
            ? {
                background: "var(--bg-3)",
                color: "var(--fg-0)",
                outline: "1px solid var(--bd-soft)",
                outlineOffset: -1,
              }
            : undefined
        }
      >
        {Ico.clock}
        Resume
        <span className="kbd">⌘R</span>
      </Button>
      <SpawnSplitBtn />
    </div>
  );
}
