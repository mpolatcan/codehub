import {
  ISLAND_SURFACE,
  IslandList,
  type IslandSessionView,
  NotchStrip,
} from "../components/Island";

// Dev-only harness (#/__island) to eyeball the Dynamic-Island surface in the real
// design system. Not shipped — production renders the same components driven by the
// live activity feed (see screens/Island.tsx). The faked notch dimensions below
// mirror a 14" MacBook Pro so the merge + camera dead-zone can be checked without a
// native build.

const NOTCH_W = 180; // camera dead-zone width (px) — ~14" MBP
const NOTCH_H = 32; // notch / menu-bar height (px)
const FLANK = 58;
const EXPANDED_W = 420;

const SAMPLE: IslandSessionView[] = [
  {
    session: "claude-1",
    status: "done",
    title: "fix auth bug",
    agent: "claude",
    agentName: "Claude",
    workspace: "aurora-api",
    ago: "28m",
    subtitle: "fix the auth bug in middleware",
    action: "Finished — click to jump",
  },
  {
    session: "codex-1",
    status: "live",
    title: "backend server",
    agent: "codex",
    agentName: "Codex",
    workspace: "edge",
    ago: "1h",
  },
  {
    session: "antigravity-1",
    status: "idle",
    title: "optimize queries",
    agent: "antigravity",
    agentName: "Antigravity",
    workspace: "warehouse",
    ago: "5h",
  },
];

// One mock "display": a dark panel with the physical notch drawn at its top-center,
// and the island surface merged into it (top strip fills the notch, body flares
// below). `expanded` shows the full roster.
function Stage({ expanded }: { expanded: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: "40rem",
        height: "18rem",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% -10%, #2a3b57 0%, #16202f 60%, #0c121b 100%)",
        border: "1px solid var(--bd-soft)",
      }}
    >
      {/* The physical notch (camera housing). */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${NOTCH_W}px`,
          height: `${NOTCH_H}px`,
          background: "#000",
          borderBottomLeftRadius: "0.625rem",
          borderBottomRightRadius: "0.625rem",
          zIndex: 1,
        }}
      />
      {/* The island surface, top flush with the screen top so its notch-height strip
          merges with the notch above; camera dead-zone aligns with the notch. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${expanded ? EXPANDED_W : NOTCH_W + 2 * FLANK}px`,
          zIndex: 2,
          ...ISLAND_SURFACE,
        }}
      >
        <NotchStrip
          active={SAMPLE[0]}
          count={SAMPLE.length}
          notchW={NOTCH_W}
          notchH={NOTCH_H}
          expanded={expanded}
        />
        {expanded ? <IslandList sessions={SAMPLE} onJump={() => {}} /> : null}
      </div>
    </div>
  );
}

export default function IslandPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07090c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2.5rem",
        padding: "3rem 0 4rem",
      }}
    >
      <div style={{ color: "var(--fg-2)", fontFamily: "var(--mono)", fontSize: "var(--fs-12)" }}>
        Collapsed — fills the notch, content flanks the camera
      </div>
      <Stage expanded={false} />
      <div style={{ color: "var(--fg-2)", fontFamily: "var(--mono)", fontSize: "var(--fs-12)" }}>
        Expanded — grows down + out of the notch
      </div>
      <Stage expanded={true} />
    </div>
  );
}
