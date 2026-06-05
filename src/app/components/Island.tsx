import { AnimatePresence, type Variants, motion } from "motion/react";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { AGENT_META, AgentGlyph, type AgentId } from "./primitives/AgentGlyph";
import { IconBtn } from "./primitives/IconBtn";
import { MascotGif } from "./primitives/MascotGif";
import { type MascotState, RobotMascot } from "./primitives/RobotMascot";
import { STATUS, StatusDot, type StatusKey } from "./primitives/StatusDot";
import { Ico } from "./primitives/icons";

// Shared color set for the island's bare icon controls (collapse / minimize / restore),
// so a ghost IconBtn reads correctly on the dark surface: dim at rest, brightening to
// full foreground over a faint wash on hover. No tooltips on these (the island window
// clips a Radix popover); the chevron/minus glyph is self-evident.
const ISLAND_CTRL = {
  idleColor: "var(--fg-3)",
  hoverColor: "var(--fg-0)",
  hoverBg: "color-mix(in oklab, var(--fg-0) 14%, transparent)",
} as const;

// The island's inline icon controls (minimize `>-<` / restore `<->`). Wrapped in a
// `.island-ctrl` span carrying `data-island-ctrl=<id>` so the native cursor bridge can
// hit-test it (`island://cursor` → elementFromPoint) and force the hover look via
// `.is-cursor` — IconBtn's hover is plain CSS `:hover`, which is FROZEN in the backgrounded
// non-key helper webview (same reason rows use the bridge). `cursorCtrl` is the id the
// bridge reports the pointer over; CSS `:hover` still covers the dev-web (active) case.
function IslandCtrl({
  id,
  label,
  cursorCtrl,
  onClick,
  children,
}: {
  id: string;
  label: string;
  cursorCtrl?: string | null;
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}) {
  return (
    <span
      className={`island-ctrl${cursorCtrl === id ? " is-cursor" : ""}`}
      data-island-ctrl={id}
      style={{ display: "inline-flex" }}
    >
      <IconBtn size={18} {...ISLAND_CTRL} aria-label={label} onClick={onClick}>
        {children}
      </IconBtn>
    </span>
  );
}

// Dynamic-Island surface (macOS notch window), composed entirely from existing
// CodeHub primitives + tokens so it is pixel-consistent with the rest of the app
// — JetBrains Mono, the `--a-*` agent accents, `--live`/`--wait`/… status colors.
//
// One black SURFACE that morphs between two content modes (the caller animates its
// width/height for the fluid expand/collapse; this file owns the chrome + content):
//   • COLLAPSED  → `IslandBar`: pane title (+ workspace) + a live-agent count badge.
//   • EXPANDED   → `IslandList`: every live agent as a row — an identity line (agent
//                  glyph, terminal name, workspace chip, relative time, hover jump
//                  glyph) over a status line (the live event, e.g. "Needs input").
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
  /** Active-turn elapsed ("0:42") — set only while live; replaces `ago` then so a
   *  working agent reads how long its turn has run instead of a meaningless "now". */
  timer?: string;
  /** Launch task — the idle active row's meta-line fallback when there's no event. */
  subtitle?: string;
  /** Live event for this row's meta line — the humanized status label ("Thinking…" /
   *  "Running Bash" / "Needs input" / "Finished" / "Failed" / "Working…"); none idle. */
  action?: string;
}

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

// Aggregate working/idle state for the COLLAPSED island's mascot. The minimized pill
// can't name concurrent sessions, so instead of a per-session title it shows ONE robot
// whose animation conveys "is the fleet working". Worst-attention-wins across all live
// agents: any failed → error, any finished → success, any awaiting → thinking, any
// working → coding, else idle. (wait/err/done auto-expand the island, so in practice
// the COLLAPSED mascot is only ever coding or idle — the honest working/not signal.)
export function mascotStateFor(sessions: IslandSessionView[]): MascotState {
  if (sessions.some((s) => s.status === "err")) return "error";
  if (sessions.some((s) => s.status === "done")) return "success";
  if (sessions.some((s) => s.status === "wait")) return "thinking";
  if (sessions.some((s) => s.status === "live")) return "coding";
  return "idle";
}

// The aggregate mascot state mapped to a status key — the single source for tinting the
// whole island to the fleet's state ("status as light"): the header dot + mascot-well
// glow + status-spine divider (expanded) and the count chip (collapsed) all read from
// it, so a glance anywhere on the chrome reads green=working / amber=awaiting / red=
// failed / blue=done / neutral=idle.
export const MASCOT_STATUS: Record<MascotState, StatusKey> = {
  idle: "idle",
  thinking: "wait",
  coding: "live",
  building: "live",
  success: "done",
  error: "err",
};

/** The CSS color for the fleet's aggregate state. */
export function mascotAccent(state: MascotState): string {
  return STATUS[MASCOT_STATUS[state]].color;
}

/** Aggregate accent as a chip TONE — the same color, but `undefined` while idle so the
 *  resting collapsed pill stays neutral (only a working/awaiting fleet glows). */
function mascotTone(state: MascotState): string | undefined {
  return state === "idle" ? undefined : mascotAccent(state);
}

// One-word aggregate label beside the mascot on the notch-LESS pill (which has the
// room a notch strip doesn't). Honest fleet state, not a session name.
function mascotLabel(state: MascotState): string {
  return state === "idle" ? "Idle" : "Working";
}

// Per-status head-count of the fleet, ordered by attention (awaiting first). Real
// counts straight off the roster — feeds the expanded banner's breakdown chip so a
// MIXED fleet (e.g. 1 waiting + 2 working) reads its composition at a glance instead
// of a flat "3 agents". Skips empty statuses; order matches the roster sort.
const TALLY_ORDER: StatusKey[] = ["wait", "err", "done", "live", "idle"];
export function statusTally(sessions: IslandSessionView[]): { key: StatusKey; n: number }[] {
  const counts = new Map<StatusKey, number>();
  for (const s of sessions) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
  return TALLY_ORDER.filter((k) => counts.has(k)).map((k) => ({
    key: k,
    n: counts.get(k) as number,
  }));
}

// The COLLAPSED-state mascot. Default → the robot-only animated GIF, full-frame
// (`zoom=1`): the assets are transparent status-bar pixel-art where the robot fills the
// canvas (no desk scene), so no crop is needed. The notch box is `size` CSS px but the
// island webview renders at 2× on Retina, so a 36px box paints ~72 physical px — crisp
// at the gif's native 88px. Under prefers-reduced-motion → the static CSS sprite (a GIF
// can't be paused).
function CollapsedMascot({ state, size }: { state: MascotState; size: number }) {
  const reduce =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // The notch is BINARY: idle vs working. Idle → the idle gif; any working state
  // (live/thinking/etc.) → the "writing" gif (the `coding` key maps to writing.gif).
  // The richer per-state art (thinking/deploying/success/debugging) lives in the
  // expanded banner only, so the notch never flickers through them on a state change.
  const s: MascotState = state === "idle" ? "idle" : "coding";
  // "Status as light" in the MINIMIZED notch too: an alpha-aware drop-shadow makes the
  // robot itself EMIT its status color into the black notch (green = working, amber =
  // awaiting), so the notch reads as lit even collapsed. drop-shadow (not a bg glow) is
  // used because the robot fills the frame opaquely — a glow behind it would be occluded;
  // this haloes the robot's own silhouette and bleeds outward (the wrapper doesn't clip).
  // Idle → no glow (the notch stays dark at rest).
  const tone = mascotTone(state);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        filter: tone
          ? `drop-shadow(0 0 0.375rem color-mix(in oklab, ${tone} 70%, transparent))`
          : undefined,
      }}
    >
      {reduce ? (
        <RobotMascot state={s} size={size} />
      ) : (
        <MascotGif state={s} size={size} radius="0.375rem" />
      )}
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
  /** Aggregate working/idle state for the COLLAPSED mascot (mascotStateFor). */
  mascot: MascotState;
  /** Mascot box size (px) — sized to the notch height by the caller. */
  mascotSize: number;
  /** Minimize (collapsed only) → shrink to the icon+count pill. Stops propagation so it
   *  doesn't also trigger the pill's expand click. */
  onPeek?: () => void;
  /** Restore (minimized only) → widen back to the collapsed strip (the `<->` control). It
   *  STAYS visible in peek so the shrink/restore affordance never vanishes on click. */
  onRestore?: () => void;
  /** Minimized (peek) variant: mascot + count + the `<->` restore control, tight flanks. */
  minimized?: boolean;
  /** Id the native cursor bridge reports the pointer over (forces control hover on the
   *  backgrounded panel where CSS `:hover` is frozen). See `IslandCtrl`. */
  cursorCtrl?: string | null;
}

// The always-on top strip that occupies the notch area, with a center dead-zone the
// width of the notch so nothing ever lands under the camera (it stays centered in
// both states, so it always clears the lens). Its height is the notch height, so the
// black fills the notch and reads as one shape with it.
//   • COLLAPSED → the strip is the minimized HUD: LEFT of the camera the lead agent's
//     activity indicator + glyph + PANE TITLE ("which pane"); RIGHT of it the live
//     EVENT ("what it's doing" — "Thinking…" / "Running npm test" / "Needs input"),
//     status-colored, plus a count badge when more than one agent is live. So a glance
//     at the notch answers which agent, which pane, and what it's doing — no expand.
//   • EXPANDED → the indicators fan to the strip's outer edges (lined up with the
//     roster below) and the rich per-row detail lives in the body (see IslandList).
export function NotchStrip({
  active,
  count,
  notchW,
  notchH,
  expanded = false,
  mascot,
  mascotSize,
  onPeek,
  onRestore,
  minimized = false,
  cursorCtrl,
}: NotchStripProps) {
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
          justifyContent: "flex-start",
          gap: "0.4375rem",
          paddingLeft: "0.875rem",
          paddingRight: expanded ? 0 : "0.5rem",
          minWidth: 0,
        }}
      >
        {/* COLLAPSED → one mascot whose loop conveys the AGGREGATE working/idle state
            (concurrent sessions can't each show a name, so a per-session title would be
            misleading). EXPANDED → the per-row roster below carries identity, so the
            strip's left edge falls back to the lead's activity indicator (equalizer when
            live, dot otherwise), lined up with the rows. The two morph (fade + scale) on
            the transition — a liquid hand-off, not a hard cut. */}
        <AnimatePresence initial={false} mode="popLayout">
          {expanded ? (
            <motion.span
              key="ind"
              style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {status === "live" ? (
                <ActivityBars color={accent} />
              ) : (
                <StatusDot status={status} pulse={status === "wait"} />
              )}
            </motion.span>
          ) : (
            <motion.span
              key="mascot"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4375rem",
                flexShrink: 0,
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <CollapsedMascot state={mascot} size={mascotSize} />
              {/* One-word aggregate status beside the mascot ("Idle"/"Working") — the
                  collapsed strip's status text, mirroring the notch-less IslandBar. The
                  MINIMIZED pill drops it: only the icon + count survive there. */}
              {!minimized ? (
                <span
                  style={{
                    fontSize: "var(--fs-12)",
                    lineHeight: 1,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    color: mascot === "idle" ? "var(--fg-2)" : "var(--fg-0)",
                  }}
                >
                  {mascotLabel(mascot)}
                </span>
              ) : null}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div style={{ width: `${notchW}px`, flexShrink: 0 }} aria-hidden />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.3125rem",
          paddingLeft: expanded ? 0 : "0.5rem",
          paddingRight: expanded ? "0.875rem" : "0.625rem",
          minWidth: 0,
        }}
      >
        {/* Just the live-agent count, COLLAPSED only — pinned to the right edge (it
            slides, never blinks). When expanded the header's count pill owns it, so the
            strip badge hides to avoid showing the number twice. The collapsed per-session
            event/timer are gone: with the mascot carrying the aggregate working/idle
            state, a single session's text would misrepresent a multi-agent fleet. */}
        {count > 0 && !expanded ? <CountBadge count={count} tone={mascotTone(mascot)} /> : null}
        {/* MINIMIZED → the `<->` restore control STAYS here (the affordance must not vanish
            on shrink — the peek flank is widened to hold count + this button without the count
            sliding under the camera); COLLAPSED → the `>-<` minimize control. Both stopPropagation
            so they don't also fire the pill's click, and both force-hover via the native cursor
            bridge (CSS :hover is frozen in the backgrounded panel). Roster open/close is the
            centered chevron tab below the strip (ExpandTab), never an inline control here. */}
        {minimized && onRestore ? (
          <IslandCtrl
            id="restore"
            label="Restore"
            cursorCtrl={cursorCtrl}
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
          >
            {Ico.expandH}
          </IslandCtrl>
        ) : !expanded && !minimized && onPeek ? (
          <IslandCtrl
            id="minimize"
            label="Minimize"
            cursorCtrl={cursorCtrl}
            onClick={(e) => {
              e.stopPropagation();
              onPeek();
            }}
          >
            {Ico.contractH}
          </IslandCtrl>
        ) : null}
      </div>
    </div>
  );
}

export interface IslandBarProps {
  /** Number of live agents (drives the count badge). */
  count: number;
  /** Aggregate working/idle state for the mascot (mascotStateFor). */
  mascot: MascotState;
  /** Minimize → icon+count pill (see NotchStrip.onPeek). */
  onPeek?: () => void;
  /** Restore (minimized only) → widen back to the collapsed bar (the `<->` control); stays
   *  visible in peek so the affordance never vanishes on click. */
  onRestore?: () => void;
  /** Minimized (peek) variant: mascot + count + the `<->` restore control. */
  minimized?: boolean;
  /** Id the native cursor bridge reports the pointer over (forces control hover). */
  cursorCtrl?: string | null;
}

// Collapsed content for a NOTCH-LESS display (external monitor): a plain pill — the
// animated mascot carrying the AGGREGATE working/idle state, a one-word label, and the
// live-agent count. Like the notch strip, it deliberately does NOT name a single
// session: concurrent agents can't be represented by one name. (On a notched display
// the collapsed state is `NotchStrip` instead.)
export function IslandBar({
  count,
  mascot,
  onPeek,
  onRestore,
  minimized = false,
  cursorCtrl,
}: IslandBarProps) {
  return (
    // Content-sized (inline-flex, no width:100%): the surface hugs this pill, so the
    // label always shows in FULL — never truncated by a fixed-width container.
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: minimized ? "0.375rem" : "0.5rem",
        width: "max-content",
        boxSizing: "border-box",
        padding: minimized ? "0.25rem 0.625rem" : "0.25rem 0.5rem 0.25rem 0.875rem",
        fontFamily: "var(--mono)",
      }}
    >
      <CollapsedMascot state={mascot} size={28} />
      {/* MINIMIZED → icon + count only (the label/controls drop). */}
      {!minimized ? (
        <span
          style={{
            fontSize: "var(--fs-12)",
            lineHeight: 1,
            color: mascot === "idle" ? "var(--fg-2)" : "var(--fg-0)",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {mascotLabel(mascot)}
        </span>
      ) : null}
      {count > 0 ? <CountBadge count={count} tone={mascotTone(mascot)} /> : null}
      {/* MINIMIZED → `<->` restore (stays visible — affordance never vanishes on shrink);
          COLLAPSED → `>-<` minimize. Both force-hover via the native cursor bridge. Roster
          open/close is the centered chevron tab below the bar (ExpandTab), not here. */}
      {minimized && onRestore ? (
        <IslandCtrl
          id="restore"
          label="Restore"
          cursorCtrl={cursorCtrl}
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
        >
          {Ico.expandH}
        </IslandCtrl>
      ) : !minimized && onPeek ? (
        <IslandCtrl
          id="minimize"
          label="Minimize"
          cursorCtrl={cursorCtrl}
          onClick={(e) => {
            e.stopPropagation();
            onPeek();
          }}
        >
          {Ico.contractH}
        </IslandCtrl>
      ) : null}
    </div>
  );
}

// The roster open/close affordance — a small black "pull-tab" HANDLE that hangs off the
// island's bottom-center, just past its edge. It's a sibling BELOW the surface (in the
// card's flex column), but painted in the same `--island-bg` black with rounded bottom
// corners + a slight upward overlap, so it reads as a tongue extending FROM the island —
// unambiguously island chrome, not the browser tab bar / menu chrome that sits below it
// on screen (a bare floating glyph there blended into the window's own tab strip). Same
// place both states: ▾ collapsed (→ expand) flips to ▴ expanded (→ collapse), so the
// panel's collapse lives here too, not in the banner. Carries the island's float shadow
// (so it floats with the surface) plus the fleet-tone glow when working ("status as
// light"). Hover/press feedback is the `.island-tab` pull beat (panes.css).
export function ExpandTab({
  expanded = false,
  onToggle,
  mascot,
  cursor = false,
}: { expanded?: boolean; onToggle: () => void; mascot: MascotState; cursor?: boolean }) {
  const tone = mascotTone(mascot);
  // Box styling (size, black bg, rounded bottom, 1px surface overlap, float shadow, the
  // hover/press wash + lift) lives in `.island-tab` (panes.css) so the hover state can
  // override the background — an inline `background` would beat a `:hover`/`.is-cursor`
  // rule. `.is-cursor` is the native-cursor-bridge hover (CSS :hover is frozen in the
  // backgrounded panel). Only the dynamic tone color + glow stay inline.
  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <button
        type="button"
        className={`island-tab${cursor ? " is-cursor" : ""}`}
        data-island-ctrl="chevron"
        aria-label={expanded ? "Collapse" : "Expand"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          color: tone ?? "var(--fg-3)",
          filter: tone
            ? `drop-shadow(0 0 0.25rem color-mix(in oklab, ${tone} 55%, transparent))`
            : undefined,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            transform: `scale(0.9)${expanded ? " rotate(180deg)" : ""}`,
          }}
        >
          {Ico.chevD}
        </span>
      </button>
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

// Workspace chip — a "⌂ <name>" capsule (container glyph + title) that rides the
// IDENTITY line right beside the terminal name. Workspace IS the container in
// CodeHub's model, so the container icon is the honest marker. It sits next to the
// name (not as a far-right afterthought) because the agent name alone repeats across
// workspaces ("Claude 1" in two projects) — the workspace is what DISAMBIGUATES the
// row, so it belongs with the name as one identity unit. Shrinks/ellipsizes when long
// so the name never gets pushed out; shown only when known (restored sessions carry
// no workspace — in-memory only — so it is honestly omitted, never faked).
function WorkspaceChip({ name }: { name: string }) {
  return (
    <span
      title={name}
      style={{
        flexShrink: 1,
        minWidth: "2.5rem",
        maxWidth: "12.5rem",
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
        background: "color-mix(in oklab, var(--fg-0) 6%, transparent)",
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
  // Line 1 is the IDENTITY (glyph + name + workspace chip + time + jump); line 2 is
  // the STATUS — the live event ("Thinking…" / "Running Bash" / "Needs input"),
  // colored by status, leading with the equalizer when live. Idle rows have no event
  // → the active row falls back to its launch task (taskDescription); a plain idle
  // row shows just its identity line (the workspace already sits beside the name).
  const event = s.action ?? (detailed ? s.subtitle : undefined);
  const eventColored = Boolean(s.action);
  // A non-lead row that needs the user (awaiting / failed) still gets a faint status
  // wash so it glows in the roster — the lead row already has the `--active` wash.
  const attn = !detailed && (s.status === "wait" || s.status === "err");
  const cls = `island-row${detailed ? " island-row--active" : ""}${
    attn ? " island-row--attn" : ""
  }${cursor ? " is-cursor" : ""}`;
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
          padding: detailed
            ? "0.4375rem 0.625rem 0.4375rem 0.9375rem"
            : "0.3125rem 0.625rem 0.3125rem 0.8125rem",
          borderRadius: detailed ? "0.625rem" : "0.5rem",
          // Active row: a soft accent RING for definition. (The old inset box-shadow
          // rail followed the corner radius → read as a rounded bracket; the crisp
          // status rail is now the `.island-row__rail` capsule below.) The faint wash
          // behind it is driven by `--row-accent` in `.island-row--active`.
          boxShadow: detailed
            ? "inset 0 0 0 1px color-mix(in oklab, var(--row-accent) 14%, transparent)"
            : undefined,
          ["--row-accent" as string]: statusColor(s.status),
          fontFamily: "var(--mono)",
        } as CSSProperties
      }
    >
      {/* Status rail on EVERY row (thin + dim when compact, bright + glowing on the
          active lead) so the fleet state scans down the left edge — the amber awaiting
          row pops, green = working, neutral = idle. */}
      <span className="island-row__rail" aria-hidden />

      {/* IDENTITY LINE — glyph + name + workspace chip, then time + jump pinned right.
          The name stays fixed-width (short, e.g. "Claude 1"); the workspace chip sits
          immediately beside it and shrinks/ellipsizes, so two same-named agents read
          as distinct identities ("Claude 1 ⌂honey-badger" vs "Claude 1 ⌂supra"). */}
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
          title={s.title}
          style={{
            flexShrink: 0,
            maxWidth: "9rem",
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
        {s.workspace ? <WorkspaceChip name={s.workspace} /> : null}
        <span style={{ flex: 1, minWidth: "0.5rem" }} aria-hidden />
        {/* Live → the ticking turn timer (brighter, to read as "counting up"); else the
            relative idle time. tnum keeps the digits from jittering as they change. */}
        <span
          className="tnum"
          style={{
            flexShrink: 0,
            fontSize: "var(--fs-10)",
            color: s.timer ? "var(--fg-1)" : "var(--fg-2)",
          }}
        >
          {s.timer ?? s.ago}
        </span>
        <JumpHint />
      </div>
      {/* STATUS LINE — the live event, colored by status (equalizer when live).
          Indented to clear the row's leading glyph so it aligns under the name. Absent
          for a plain idle row (its identity line already says everything). */}
      {event ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            paddingLeft: "1.375rem",
            minWidth: 0,
          }}
        >
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
        // Calm empty state — the banner above already shows the idle mascot + "All idle",
        // so the roster just confirms there's nothing to act on (no sad red "none" box).
        <div
          style={{
            padding: "0.625rem 0.75rem 0.875rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "0.1875rem",
          }}
        >
          <span style={{ fontSize: "var(--fs-13)", fontWeight: 600, color: "var(--fg-1)" }}>
            No agents running
          </span>
          <span style={{ fontSize: "var(--fs-11)", color: "var(--fg-3)" }}>Idle and ready</span>
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
