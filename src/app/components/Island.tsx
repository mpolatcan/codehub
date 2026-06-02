import { type Variants, motion } from "motion/react";
import type { CSSProperties } from "react";
import { AGENT_META, AgentGlyph, type AgentId } from "./primitives/AgentGlyph";
import { StatusDot, type StatusKey } from "./primitives/StatusDot";
import { Tag } from "./primitives/Tag";

// Dynamic-Island surface (macOS notch window), composed entirely from existing
// CodeHub primitives + tokens so it is pixel-consistent with the rest of the app
// — JetBrains Mono, the `--a-*` agent accents, `--live`/`--wait`/… status colors.
//
// One black SURFACE that morphs between two content modes (the caller animates its
// width/height for the fluid expand/collapse; this file owns the chrome + content):
//   • COLLAPSED  → `IslandBar`: pane title (+ workspace) + a live-agent count badge.
//   • EXPANDED   → `IslandList`: every live agent as a row (status dot, title, agent
//                  + workspace tag, relative time); the active row adds a subtitle
//                  (its launch task) and a status action line.
//
// Honesty boundary: every field is a REAL activity-feed signal. There is no
// terminal-app concept here (agents run in containers), so the reference design's
// second tag is the WORKSPACE — the honest equivalent. The launch `task` is shown
// as the subtitle only when it differs from the row title; never fabricated.

// One session as the island renders it.
export interface IslandSessionView {
  session: string;
  status: StatusKey;
  /** Pane title — rename alias, else the agent + index derived from the name. */
  title: string;
  agent: AgentId;
  agentName: string;
  /** Human workspace name (honest stand-in for the reference's terminal-app tag). */
  workspace?: string;
  /** Relative time since last activity ("28m"). */
  ago: string;
  /** Launch task — shown on the expanded active row only when ≠ title. */
  subtitle?: string;
  /** Status line on the active row ("Finished — click to jump"). */
  action?: string;
}

const dim: CSSProperties = { color: "var(--fg-2)" };

// The pill surface: a pure-black box that MERGES with the notch (VibeIsland model).
// On a notched display the native window top sits at the screen top (island.rs) and
// the top STRIP is exactly the notch height, so the camera-black + this black read
// as one continuous shape; content flanks the camera (a center dead-zone) and the
// body grows DOWN from the notch on expand. SQUARE top corners (flush to the screen
// edge / notch), rounded bottom. The live island wraps this in a `motion.div` and
// animates `width` (horizontal) + the body `height` (vertical) for the grows-from-
// the-notch morph. `overflow: hidden` clips the body during the height morph.
export const ISLAND_SURFACE: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
  background: "var(--island-bg)",
  borderRadius: "0 0 0.875rem 0.875rem",
  boxShadow: "0 0.75rem 2rem -0.5rem rgba(0,0,0,0.6)",
  fontFamily: "var(--mono)",
};

// Accent for the action/status line.
function statusColor(s: StatusKey): string {
  switch (s) {
    case "wait":
      return "var(--wait)";
    case "err":
      return "var(--err)";
    case "done":
      return "var(--done)";
    case "live":
      return "var(--live)";
    default:
      return "var(--fg-2)";
  }
}

// Live-agent count chip.
function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="tnum"
      style={{
        flexShrink: 0,
        fontSize: "var(--fs-11)",
        lineHeight: 1,
        fontWeight: 600,
        color: "var(--fg-1)",
        background: "var(--bg-3)",
        borderRadius: "0.3125rem",
        padding: "0.125rem 0.3125rem",
      }}
    >
      {count}
    </span>
  );
}

export interface NotchStripProps {
  active: IslandSessionView | null;
  /** Number of live agents (drives the count badge). */
  count: number;
  /** Camera dead-zone width (px) — content flanks it, never overlaps the camera. */
  notchW: number;
  /** Strip height (px) == the notch height, so the black strip fills the notch. */
  notchH: number;
  /** Expanded → indicators ride the strip's OUTER edges (aligned with the body rows
   *  below); collapsed → hugged tight against the camera dead-zone (minimal pill). */
  expanded?: boolean;
}

// The always-on top strip that occupies the notch area. A status dot + agent glyph
// sit LEFT of the camera and the live-agent count RIGHT of it, with a center dead-
// zone the width of the notch so nothing ever lands under the camera (the dead-zone
// stays centered in both states, so it always clears the lens). Its height is the
// notch height, so the black fills the notch and reads as one shape with it. When
// COLLAPSED the indicators hug the camera (tight minimal pill); when EXPANDED they
// fan out to the strip's outer edges so they line up with the roster below. All rich
// text lives in the body BELOW the camera (see IslandList) — never up here.
export function NotchStrip({ active, count, notchW, notchH, expanded = false }: NotchStripProps) {
  const status = active?.status ?? "idle";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: `${notchH}px`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-start" : "flex-end",
          gap: "0.3125rem",
          paddingLeft: expanded ? "0.875rem" : 0,
          paddingRight: expanded ? 0 : "0.5rem",
          minWidth: 0,
        }}
      >
        <StatusDot status={status} pulse={status === "live" || status === "wait"} />
        {active ? (
          <AgentGlyph
            agent={active.agent}
            size={12}
            color={AGENT_META[active.agent]?.accent ?? "var(--a-claude)"}
            style={{ flexShrink: 0 }}
          />
        ) : null}
      </div>
      <div style={{ width: `${notchW}px`, flexShrink: 0 }} aria-hidden />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-end" : "flex-start",
          paddingLeft: expanded ? 0 : "0.5rem",
          paddingRight: expanded ? "0.875rem" : 0,
          minWidth: 0,
        }}
      >
        {count > 0 ? <CountBadge count={count} /> : null}
      </div>
    </div>
  );
}

export interface IslandBarProps {
  active: IslandSessionView | null;
  /** Number of live agents (drives the count badge). */
  count: number;
}

// Collapsed content for a NOTCH-LESS display (external monitor): a plain pill row —
// status dot + agent glyph + pane title (· workspace) + count badge. (On a notched
// display the collapsed state is `NotchStrip` instead.)
export function IslandBar({ active, count }: IslandBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3125rem",
        width: "100%",
        boxSizing: "border-box",
        padding: "0.375rem 0.875rem",
        fontFamily: "var(--mono)",
      }}
    >
      {active ? (
        <>
          <StatusDot
            status={active.status}
            pulse={active.status === "live" || active.status === "wait"}
          />
          <AgentGlyph
            agent={active.agent}
            size={12}
            color={AGENT_META[active.agent]?.accent ?? "var(--a-claude)"}
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "var(--fs-12)",
              lineHeight: 1,
              color: "var(--fg-0)",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {active.title}
            {active.workspace ? (
              <span style={{ color: "var(--fg-2)", fontWeight: 500 }}> · {active.workspace}</span>
            ) : null}
          </span>
        </>
      ) : (
        <>
          <StatusDot status="idle" />
          <span
            style={{
              flex: 1,
              fontSize: "var(--fs-12)",
              lineHeight: 1,
              color: "var(--fg-1)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Idle
          </span>
        </>
      )}
      {count > 0 ? <CountBadge count={count} /> : null}
    </div>
  );
}

export interface IslandRowProps {
  s: IslandSessionView;
  /** Active row: glyph + subtitle + status action line. */
  detailed?: boolean;
  onJump: (session: string) => void;
}

// Staggered reveal of the expanded roster — rows spring in top-down so the list
// unfurls out of the notch instead of appearing all at once.
const LIST_VARIANTS: Variants = {
  hide: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};
const ROW_VARIANTS: Variants = {
  hide: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 34 } },
};

// One clickable session row — the whole row jumps to that terminal. The active
// (detailed) row carries a status-colored accent rail on its left so the agent that
// matters reads at a glance.
export function IslandRow({ s, detailed = false, onJump }: IslandRowProps) {
  return (
    <button
      type="button"
      onClick={() => onJump(s.session)}
      className="island-row"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: detailed ? "0.1875rem" : 0,
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: detailed ? "0.3125rem 0.75rem 0.3125rem 0.875rem" : "0.25rem 0.75rem",
        borderRadius: "0.5rem",
        boxShadow: detailed ? `inset 0.1875rem 0 0 ${statusColor(s.status)}` : undefined,
        fontFamily: "var(--mono)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4375rem" }}>
        {detailed ? (
          <AgentGlyph
            agent={s.agent}
            size={12}
            color={AGENT_META[s.agent]?.accent ?? "var(--a-claude)"}
            style={{ flexShrink: 0 }}
          />
        ) : (
          <StatusDot status={s.status} pulse={s.status === "live" || s.status === "wait"} />
        )}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "var(--fs-12)",
            color: "var(--fg-0)",
            fontWeight: detailed ? 600 : 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {s.title}
        </span>
        <Tag color={AGENT_META[s.agent]?.accent}>{s.agentName}</Tag>
        {s.workspace ? <Tag>{s.workspace}</Tag> : null}
        <span className="tnum" style={{ flexShrink: 0, fontSize: "var(--fs-10)", ...dim }}>
          {s.ago}
        </span>
      </div>
      {detailed && s.subtitle ? (
        <span
          style={{
            fontSize: "var(--fs-11)",
            color: "var(--fg-2)",
            paddingLeft: "1.4375rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {s.subtitle}
        </span>
      ) : null}
      {detailed && s.action ? (
        <span
          style={{
            fontSize: "var(--fs-11)",
            fontWeight: 600,
            color: statusColor(s.status),
            paddingLeft: "1.4375rem",
          }}
        >
          {s.action}
        </span>
      ) : null}
    </button>
  );
}

export interface IslandListProps {
  sessions: IslandSessionView[];
  onJump: (session: string) => void;
  /** Drives the staggered row reveal — true while the island is expanded. */
  show?: boolean;
}

// Expanded content: the active session as a detailed row on top, the rest as
// compact rows below a hairline separator. Transparent — the surface owns the box.
// Rows stagger in (top-down) keyed off `show` so the roster unfurls on expand.
export function IslandList({ sessions, onJump, show = true }: IslandListProps) {
  return (
    <motion.div
      variants={LIST_VARIANTS}
      initial={false}
      animate={show ? "show" : "hide"}
      style={{ width: "100%", boxSizing: "border-box", padding: "0.375rem 0.5rem" }}
    >
      {sessions.length === 0 ? (
        <div
          style={{
            padding: "0.75rem",
            textAlign: "center",
            fontSize: "var(--fs-13)",
            color: "var(--fg-2)",
          }}
        >
          No active agents
        </div>
      ) : (
        sessions.map((s, i) => (
          <motion.div key={s.session} variants={ROW_VARIANTS}>
            {i === 1 ? (
              <div
                style={{ height: "1px", background: "var(--bd-soft)", margin: "0.1875rem 0.5rem" }}
              />
            ) : null}
            <IslandRow s={s} detailed={i === 0} onJump={onJump} />
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
