import { type Variants, motion } from "motion/react";
import type { CSSProperties } from "react";
import { AGENT_META, AgentGlyph, type AgentId } from "./primitives/AgentGlyph";
import { StatusDot, type StatusKey } from "./primitives/StatusDot";
import { Ico } from "./primitives/icons";

// Dynamic-Island surface (macOS notch window), composed entirely from existing
// CodeHub primitives + tokens so it is pixel-consistent with the rest of the app
// — JetBrains Mono, the `--a-*` agent accents, `--live`/`--wait`/… status colors.
//
// One black SURFACE that morphs between two content modes (the caller animates its
// width/height for the fluid expand/collapse; this file owns the chrome + content):
//   • COLLAPSED  → `IslandBar`: pane title (+ workspace) + a live-agent count badge.
//   • EXPANDED   → `IslandList`: every live agent as a row (status dot / active-row
//                  glyph, title, workspace marker, relative time, hover jump glyph);
//                  the active row adds a status action line ("Needs input").
//
// Honesty boundary: every field is a REAL activity-feed signal. There is no
// terminal-app concept here (agents run in containers), so the WORKSPACE is the
// honest second identifier (a session belongs to its workspace container). It is
// shown only when known — restored sessions carry none — and never fabricated.

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
  /** Launch task — the idle active row's meta-line fallback when there's no event. */
  subtitle?: string;
  /** Live event for this row's meta line — the humanized status label ("Thinking…" /
   *  "Running Bash" / "Needs input" / "Finished" / "Failed" / "Working…"); none idle. */
  action?: string;
}

const dim: CSSProperties = { color: "var(--fg-2)" };

// Indeterminate "working" indicator — a tiny equalizer of bars that bounce in the
// agent's accent. Honest: it signals ACTIVITY, not a percentage (we have no real
// progress %). Shown wherever a session is LIVE (collapsed strip + live rows), so a
// glance at the notch reads "an agent is working" without expanding. Motion lives in
// `.island-eq` (panes.css); respects prefers-reduced-motion. `aria-hidden` — the
// status is already conveyed by the dot/label for assistive tech.
function ActivityBars({
  color = "currentColor",
  style,
}: { color?: string; style?: CSSProperties }) {
  return (
    <span className="island-eq" style={{ color, ...style }} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

// The pill surface: a pure-black box that MERGES with the notch (VibeIsland model).
// On a notched display the native window top sits at the screen top (island.rs) and
// the top STRIP is exactly the notch height, so the camera-black + this black read
// as one continuous shape; content flanks the camera (a center dead-zone) and the
// body grows DOWN from the notch on expand. SQUARE top corners (flush to the screen
// edge / notch), rounded bottom. The live island wraps this in a `motion.div` and
// animates `width` (horizontal) + the body `height` (vertical) for the grows-from-
// the-notch morph. `overflow: hidden` clips the body during the height morph.
// `backgroundColor` (not the `background` shorthand) so the `.island-surface`
// class can layer a top sheen via `background-image` on expand without the inline
// style clobbering it; the float shadow + inner ring also live in that class so
// they can intensify when open (see `[data-open]` in panes.css).
export const ISLAND_SURFACE: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
  backgroundColor: "var(--island-bg)",
  borderRadius: "0 0 0.875rem 0.875rem",
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

// Live-agent count chip. `tone` (a status color) tints the chip + brightens the
// number when the lead agent needs attention, so the COLLAPSED pill announces
// urgency without expanding — a glowing count reads as "something up there".
function CountBadge({ count, tone }: { count: number; tone?: string }) {
  return (
    <span
      className="tnum"
      style={{
        flexShrink: 0,
        fontSize: "var(--fs-11)",
        lineHeight: 1,
        fontWeight: 600,
        color: tone ? "var(--fg-0)" : "var(--fg-1)",
        background: tone ? `color-mix(in oklab, ${tone} 28%, transparent)` : "var(--bg-3)",
        boxShadow: tone
          ? `inset 0 0 0 1px color-mix(in oklab, ${tone} 45%, transparent)`
          : undefined,
        borderRadius: "0.3125rem",
        padding: "0.125rem 0.3125rem",
      }}
    >
      {count}
    </span>
  );
}

// The lead agent's status color, but only when it warrants attention (waiting /
// finished / failed) — used to tint the collapsed count chip. Working/idle → none.
function urgentTone(active: IslandSessionView | null): string | undefined {
  if (!active) return undefined;
  return active.status === "wait" || active.status === "err" || active.status === "done"
    ? statusColor(active.status)
    : undefined;
}

// Workspace tag for the COLLAPSED notch strip (single-agent case). Mirrors the
// expanded row's WorkspaceMeta (container glyph + name); the strip widens its flanks
// for a lone agent (see screens/Island.tsx `collapsedW`) so the name fits un-clipped,
// only ellipsizing very long names at the cap.
function CollapsedWorkspace({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        maxWidth: "7rem",
        minWidth: 0,
        color: "var(--fg-1)",
        fontSize: "var(--fs-10)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          flexShrink: 0,
          color: "var(--fg-3)",
          transform: "scale(0.85)",
        }}
      >
        {Ico.container}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
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
  const accent = active ? (AGENT_META[active.agent]?.accent ?? "var(--a-claude)") : "var(--live)";
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
        {/* Live → the equalizer is the activity signal (motion reads as "working" at a
            glance); any other status → the colored status dot carries the semantics. */}
        {status === "live" ? (
          <ActivityBars color={accent} />
        ) : (
          <StatusDot status={status} pulse={status === "wait"} />
        )}
        {/* Collapsed only: the camera-hugging glyph IDs the active agent at a glance.
            When expanded it would duplicate the per-row glyphs below, so it drops. */}
        {active && !expanded ? (
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
          gap: "0.3125rem",
          paddingLeft: expanded ? 0 : "0.5rem",
          paddingRight: expanded ? "0.875rem" : 0,
          minWidth: 0,
        }}
      >
        {/* Collapsed context: a SINGLE agent shows its workspace (the count would just
            say "1"); MULTIPLE agents show the count badge instead (one workspace can't
            represent them). Expanded → always the count (rows carry their own
            workspace). Mirrors the expanded row's "⌂ <workspace>" marker. */}
        {!expanded && count === 1 && active?.workspace ? (
          <CollapsedWorkspace name={active.workspace} />
        ) : count > 0 ? (
          <CountBadge count={count} tone={urgentTone(active)} />
        ) : null}
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
          {active.status === "live" ? (
            <ActivityBars color={AGENT_META[active.agent]?.accent ?? "var(--a-claude)"} />
          ) : (
            <StatusDot status={active.status} pulse={active.status === "wait"} />
          )}
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
      {count > 0 ? <CountBadge count={count} tone={urgentTone(active)} /> : null}
    </div>
  );
}

export interface IslandRowProps {
  s: IslandSessionView;
  /** Active row: glyph + subtitle + status action line. */
  detailed?: boolean;
  /** Cursor is over this row — native-driven hover (see `is-cursor`), used so the
   *  row/jump highlight works while CodeHub is backgrounded (CSS `:hover` is frozen
   *  there). Mirrors `:hover`; both can be set at once when focused (idempotent). */
  cursor?: boolean;
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

// Workspace marker — a dim "⌂ <name>" (container glyph + title). Workspace IS the
// container in CodeHub's model, so the container icon is the honest marker. Shown on
// every row when known; restored sessions carry no workspace (in-memory only) → it
// is honestly omitted, never faked.
function WorkspaceMeta({ name }: { name: string }) {
  return (
    <span
      style={{
        flexShrink: 0,
        minWidth: 0,
        maxWidth: "10rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        color: "var(--fg-2)",
        fontSize: "var(--fs-10)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        padding: "0.0625rem 0.375rem 0.0625rem 0.3125rem",
        borderRadius: "0.375rem",
        background: "color-mix(in oklab, var(--fg-0) 5%, transparent)",
        boxShadow: "inset 0 0 0 1px var(--bd-soft)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          flexShrink: 0,
          color: "var(--fg-3)",
          transform: "scale(0.78)",
        }}
      >
        {Ico.container}
      </span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    </span>
  );
}

// Persistent jump-to-terminal affordance: a faint rounded chip carrying the
// terminal glyph that sits at the row's trailing edge ALWAYS (so the row visibly
// reads as "open this in the terminal" at rest, not only on hover), then fills
// with the primary accent + lifts when the row is hovered. Styling lives in
// `.island-row__jump` (panes.css). The whole row is the click target; this is the
// visual cue for it.
function JumpHint() {
  return (
    <span className="island-row__jump" aria-hidden>
      {Ico.terminal}
    </span>
  );
}

// One clickable session row — the whole row jumps to that terminal. The active
// (detailed) row carries a status-colored accent rail on its left so the agent that
// matters reads at a glance. No agent-name tag: the title ("Claude 4") already names
// the agent and the active row's glyph carries the accent — the tag only tripled it.
export function IslandRow({ s, detailed = false, cursor = false, onJump }: IslandRowProps) {
  const accent = AGENT_META[s.agent]?.accent ?? "var(--a-claude)";
  // EVERY row gets a meta line so each item announces its own state, not just the
  // active one: the live event ("Thinking…" / "Running Bash" / "Needs input") on the
  // left, the workspace marker on the right. Idle rows have no event → the active row
  // falls back to its launch task (taskDescription); plain idle rows show just the
  // workspace. Event text is colored by status; live events lead with the equalizer.
  const event = s.action ?? (detailed ? s.subtitle : undefined);
  const eventColored = Boolean(s.action);
  const cls = `island-row${detailed ? " island-row--active" : ""}${cursor ? " is-cursor" : ""}`;
  return (
    <button
      type="button"
      onClick={() => onJump(s.session)}
      data-island-row={s.session}
      className={cls}
      style={
        {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "0.1875rem",
          width: "100%",
          textAlign: "left",
          border: "none",
          cursor: "pointer",
          padding: detailed ? "0.4375rem 0.625rem 0.4375rem 0.9375rem" : "0.3125rem 0.625rem",
          borderRadius: detailed ? "0.625rem" : "0.5rem",
          // Active row: a soft accent RING for definition. (The old inset box-shadow
          // rail followed the corner radius → read as a rounded bracket; the crisp
          // status rail is now the `.island-row__rail` capsule below.) The faint wash
          // behind it is driven by `--row-accent` in `.island-row--active`.
          boxShadow: detailed
            ? "inset 0 0 0 1px color-mix(in oklab, var(--row-accent) 18%, transparent)"
            : undefined,
          ["--row-accent" as string]: statusColor(s.status),
          fontFamily: "var(--mono)",
        } as CSSProperties
      }
    >
      {detailed ? <span className="island-row__rail" aria-hidden /> : null}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4375rem", width: "100%" }}>
        {/* Agent glyph leads EVERY row so each item is identifiable at a glance (the
            title alias alone doesn't say which CLI). Dimmed when idle so a dormant
            agent reads as off; full accent while it has anything going on. Status is
            carried by the active row's rail + the event line below. */}
        <AgentGlyph
          agent={s.agent}
          size={detailed ? 14 : 13}
          color={s.status === "idle" ? "var(--fg-3)" : accent}
          style={{ flexShrink: 0 }}
        />
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
        <span className="tnum" style={{ flexShrink: 0, fontSize: "var(--fs-10)", ...dim }}>
          {s.ago}
        </span>
        <JumpHint />
      </div>
      {/* Unified meta line — event (left) + workspace (right). Indented to clear the
          row's leading indicator so it aligns under the title. */}
      {event || s.workspace ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
            paddingLeft: "1.375rem",
            minWidth: 0,
          }}
        >
          {event ? (
            <span
              style={{
                flex: 1,
                minWidth: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4375rem",
                fontSize: "var(--fs-11)",
                fontWeight: eventColored ? 600 : 400,
                color: eventColored ? statusColor(s.status) : "var(--fg-2)",
              }}
            >
              {s.status === "live" ? <ActivityBars color={accent} /> : null}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event}
              </span>
            </span>
          ) : (
            <span style={{ flex: 1, minWidth: 0 }} aria-hidden />
          )}
          {s.workspace ? <WorkspaceMeta name={s.workspace} /> : null}
        </div>
      ) : null}
    </button>
  );
}

export interface IslandListProps {
  sessions: IslandSessionView[];
  onJump: (session: string) => void;
  /** Drives the staggered row reveal — true while the island is expanded. */
  show?: boolean;
  /** Session of the row the native cursor bridge reports the pointer over (for
   *  backgrounded hover; see `IslandRow.cursor`). */
  cursorSession?: string | null;
}

// Expanded content: the active session as a detailed row on top, the rest as
// compact rows below a hairline separator. Transparent — the surface owns the box.
// Rows stagger in (top-down) keyed off `show` so the roster unfurls on expand.
export function IslandList({ sessions, onJump, show = true, cursorSession }: IslandListProps) {
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
            <IslandRow
              s={s}
              detailed={i === 0}
              cursor={cursorSession === s.session}
              onJump={onJump}
            />
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
