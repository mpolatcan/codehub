import { useEffect, useRef, useState } from "react";
import { splitKey, useLauncher } from "../../lib/launcher";
import { activeWorkspace, useStore } from "../../lib/store";
import { type SplitDir, activeGroup } from "../../lib/tree";
import { Ico } from "./icons";

// THE primary spawn CTA for the Hub ActionBar — one button replacing the old
// "Split right + Split down + New agent" trio (design/components.jsx
// `SpawnSplitBtn`). Left half opens the launcher for a new tab; the chevron half
// opens a placement popover for splitting the focused pane.
//
// Honest deviation from the design (which spawns split-right by default on the
// left half): CodeHub's established model is ⌘N = new tab / ⌘\ = split, and every
// spawn flows through the rich launcher (SpawnModal). So the default click stays
// "new tab" — matching ⌘N and the sidebar New-agent button — and split is an
// explicit menu choice. No keyboard hint lies. ("Open in new group" is deferred
// to the groups layer, Wave 3.)
export function SpawnSplitBtn() {
  const openLaunch = useLauncher((s) => s.open);
  const active = useStore(activeWorkspace);
  const focused = (active && activeGroup(active)?.focused) ?? null;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const newTab = () => {
    setOpen(false);
    openLaunch("newtab");
  };
  const split = (dir: SplitDir) => {
    if (!focused) return;
    setOpen(false);
    openLaunch(splitKey(focused), { dir, session: focused });
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        className="spawn-half spawn-main"
        title="New agent — new tab (⌘N)"
        onClick={newTab}
      >
        {Ico.plus}
        New agent
        <span className="kbd">⌘N</span>
      </button>
      <button
        type="button"
        className={`spawn-half spawn-chev${open ? " open" : ""}`}
        title="Placement options"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {Ico.chevD}
      </button>
      {open && <SpawnPlacementMenu focused={focused} onSplit={split} onNewTab={newTab} />}
    </div>
  );
}

// Popover anchored to the chevron half. Split rows act on the focused pane and
// are disabled when nothing is focused (an empty workspace can't be split).
function SpawnPlacementMenu({
  focused,
  onSplit,
  onNewTab,
}: {
  focused: string | null;
  onSplit: (dir: SplitDir) => void;
  onNewTab: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 7px)",
        right: 0,
        minWidth: 240,
        zIndex: 30,
        background: "var(--bg-2)",
        border: "1px solid var(--bd)",
        borderRadius: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        padding: 5,
        fontSize: 13,
        color: "var(--fg-1)",
      }}
    >
      <div
        style={{
          padding: "4px 8px",
          display: "flex",
          borderBottom: "1px solid var(--bd-soft)",
          marginBottom: 4,
        }}
      >
        <span className="lbl" style={{ fontSize: 10 }}>
          Placement
        </span>
      </div>
      <SpawnMenuRow
        icon={Ico.splitV}
        label="Split right"
        kbd="⌘\"
        disabled={!focused}
        onClick={() => onSplit("row")}
      />
      <SpawnMenuRow
        icon={Ico.splitH}
        label="Split down"
        kbd="⌘⇧\"
        disabled={!focused}
        onClick={() => onSplit("col")}
      />
      <div style={{ height: 1, background: "var(--bd-soft)", margin: "4px 0" }} />
      <SpawnMenuRow icon={Ico.plus} label="Open in new tab" kbd="⌘⇧T" onClick={onNewTab} />
    </div>
  );
}

function SpawnMenuRow({
  icon,
  label,
  kbd,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="ctx-row"
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      <span style={{ display: "inline-flex", color: "var(--fg-2)", width: 14 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span className="kbd">{kbd}</span>
    </div>
  );
}
