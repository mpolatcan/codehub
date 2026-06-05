import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExpandTab,
  ISLAND_SURFACE,
  IslandBar,
  IslandList,
  type IslandSessionView,
  MASCOT_STATUS,
  NotchStrip,
  mascotAccent,
  mascotStateFor,
  statusTally,
} from "../components/Island";
import type { AgentId } from "../components/primitives/AgentGlyph";
import { MascotGif } from "../components/primitives/MascotGif";
import type { MascotState } from "../components/primitives/RobotMascot";
import { StatusDot, type StatusKey } from "../components/primitives/StatusDot";
import { deriveLiveStatus, fmtIdle } from "../lib/activity";
import { type UnlistenFn, listen } from "../lib/bridge";
import { type SessionActivity, ipc } from "../lib/ipc";

// Real content of the macOS Dynamic Island window (index.html#/island, loaded by
// the native `island.rs` webview). A PERSISTENT presence when enabled: a collapsed
// bar (active agent's task + a live-agent count badge) hugs the notch, and it
// EXPANDS into the full agent list on hover OR whenever an agent needs attention
// (a session waiting on input, or a turn that just finished/failed). Clicking a
// row jumps to that terminal.
//
// All which-session / expand logic lives HERE; Rust only does the window ops via
// `islandPresent` / `islandDismiss` / `resizeIsland`. Every field is a REAL
// activity signal — the feed is pruned to LIVE tmux sessions backend-side
// (`prune_stale_activity_loop`) so the list never shows ghost rows.

const POLL_MS = 700;

// Native (Tauri webview) vs the dev-web browser. In the native island the cursor
// poll in `island.rs` is the AUTHORITATIVE hover signal (it works foreground AND
// backgrounded); the in-webview DOM `onMouseEnter/Leave` is UNRELIABLE there — a
// non-key island window can miss the `mouseleave` after a jump refocuses the main
// window, leaving DOM hover stuck `true` and pinning the island's state. So we use
// DOM hover ONLY in the browser, where the native events never fire.
const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
// True wherever the authoritative native cursor poll exists: the Tauri app AND the
// .accessory helper webview (its bridge shim sets `__CODEHUB_ISLAND_NATIVE`). In
// both we trust ONLY the poll and IGNORE the in-webview DOM hover — the helper is
// not Tauri, so keying off IS_TAURI alone misclassified it as a dev browser and
// fell back to DOM hover, which never fires mouseleave when CodeHub is inactive →
// the island stuck EXPANDED after the cursor left (only collapsed on a row click).
const NATIVE_HOVER =
  IS_TAURI || (typeof window !== "undefined" && "__CODEHUB_ISLAND_NATIVE" in window);
// In the native panel the WINDOW is sized natively — `island-helper` interpolates the
// panel frame to the per-mode target (rAF is suspended in the hidden helper webview, so
// neither framer-motion nor a CSS width transition can animate the box). So the card +
// surface FILL the window (width:100%) and follow that native frame animation via layout
// → the visible black pill grows/shrinks WITH the window, symmetric (the native place()
// recenters x each step). In the dev browser there's no native window, so the card takes
// its explicit per-mode target width (snaps; keeps the route pill-sized + verifiable).
const NATIVE_PANEL = NATIVE_HOVER;

// Surface widths in PX (numbers, not rem) — the island root is pinned to 16px so it
// is a fixed-size native surface, not the fluid chrome, and a numeric width lets the
// spring morph between the notch-sized collapsed box and the expanded box smoothly.
// On a notched display the collapsed width is at least `notch.width + 2·FLANK`
// (computed live) so the strip clears the camera with room for its content;
// COLLAPSED_W is the minimum notched surface and the notch-less fallback.
const COLLAPSED_W = 340;
const EXPANDED_W = 420;
// Collapsed notch-strip flank sizing (px, each side of the camera dead-zone). The
// strip SIZES TO ITS CONTENT instead of a fixed width: each flank grows to fit the
// lead agent's title (left) and live event (right) so the text shows in FULL when it
// fits, and ellipsizes only once a flank would reach the menu bar. So short content
// yields a NARROW strip (no overlap) while long content widens up to the expanded
// width rather than truncating over an empty-looking pill. Symmetric (the camera
// dead-zone stays centered): the larger of the two needs sets both flanks.
const FLANK_MIN = 40;
// Ceiling per flank. The whole collapsed pill is still clamped to EXPANDED_W, so this
// only bounds how wide each side grows for its content (mascot + label left, count
// right) before the overall cap kicks in.
const FLANK_MAX = 150;

// The transparent shadow margin baked into the outer card (`padding: 0 1.5rem 1.5rem`).
// The island pins its rem root to 16px, so 1.5rem = 24px. The native window is sized to
// surface + this margin so the float shadow isn't clipped. Used to compute the window
// target directly (no per-frame ResizeObserver) — see the resize effects below.
const PAD_X = 24;
const PAD_B = 24;

// PEEK (minimized) surface — the island shrunk so only the mascot + count show and the
// pill narrows symmetrically (reducing equally on both sides as the native window
// recenters), freeing the menu bar to its sides. On a notched display the mascot still
// flanks the camera (left) with the count on the right, just with tight flanks; off-notch
// it's a small mascot+count pill. The peek flank only needs the mascot box + a little pad
// (the label is dropped), so it's much tighter than the collapsed flank.
const PEEK_FLANK_PAD = 18;
// Height (px) of the transparent zone BELOW the black surface that holds the floating
// chevron (ExpandTab) — the tab sits OUTSIDE the island, just past its bottom edge. Added
// to the collapsed + expanded window targets (above the PAD_B shadow margin) so the chevron
// is inside the window (clickable + not clipped). Peek has no tab.
const EXPAND_TAB_H = 15;
type IslandMode = "expanded" | "collapsed" | "peek";

// Measure an element's natural border-box size via ResizeObserver, exposed as state.
// Used on the NATURAL content (banner+list / bar) — which is pinned to a FIXED width (or
// is content-sized), so its measured size is morph-STABLE: it changes only when the
// rows/banner/label change, never during the expand/collapse spring. That stability is
// what lets the window jump to its final size ONCE instead of chasing the animation
// frame-by-frame (the old shake — a width-tracking measurer reflowed every frame).
function useMeasuredSize(): [(node: HTMLDivElement | null) => void, number, number] {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ro = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    ro.current?.disconnect();
    if (!node) {
      ro.current = null;
      return;
    }
    const measure = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      if (w > 0 && h > 0) setSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    const obs = new ResizeObserver(measure);
    obs.observe(node);
    ro.current = obs;
    measure();
  }, []);
  return [ref, size.w, size.h];
}

const AGENT_NAME: Record<string, string> = {
  claude: "Claude",
  codex: "Codex",
  antigravity: "Antigravity",
};

// Sort precedence: agents needing attention float to the top, then working, then
// finished/idle. wait > err > done > live > idle; ties break by most-recent.
const RANK: Record<StatusKey, number> = { wait: 5, err: 4, done: 3, live: 2, idle: 1, off: 0 };

// The island is an AGENT monitor. Derive the agent from the session NAME prefix
// (`createSessionName` in store.ts mints `<cli>-<ts>-<n>`), NOT `act.cli`: the cli
// field is only set by create_session's register(), so replayed/restored sessions
// carry cli=null — but the tmux name is immutable. A "shell-…" name (or any
// non-agent prefix) returns null → excluded from the list and count.
function agentFromName(session: string): AgentId | null {
  const slug = session.split("-")[0];
  return slug === "claude" || slug === "codex" || slug === "antigravity" ? slug : null;
}

// Humanize the shared live-status label (deriveLiveStatus) for the island's per-row
// event line. The label is a REAL signal — the hook lifecycle: "thinking" (model
// generating, no tool), "running <tool>" (inside a tool call), "needs input"
// (blocked), "finished"/"failed" (transient turn outcome), "working" (hook-less
// byte-flow). Idle → none (the row's time + dot already say "at rest").
function eventLabel(label: string): string | undefined {
  if (label.startsWith("idle")) return undefined;
  if (label.startsWith("running ")) return `Running ${label.slice("running ".length)}`;
  switch (label) {
    case "needs input":
      return "Needs input";
    case "thinking":
      return "Thinking…";
    case "working":
      return "Working…";
    case "finished":
      return "Finished";
    case "failed":
      return "Failed";
    default:
      return label;
  }
}

// Pane title for the bar/rows. Prefer the rename alias (set at create, e.g.
// "Claude 1"); else derive "<Agent> <n>" from the session name (`<cli>-<ts>-<n>`)
// so the island NEVER shows the raw terminal id — replayed/restored sessions carry
// alias=null but the trailing index in the immutable name still reads cleanly.
function paneTitle(session: string, alias: string | null, agent: AgentId): string {
  if (alias) return alias;
  const idx = session.split("-").pop() ?? "";
  return idx ? `${AGENT_NAME[agent]} ${idx}` : AGENT_NAME[agent];
}

// Active-turn elapsed → "M:SS" (or "H:MM:SS" past an hour). REAL: `turnElapsedMs` is
// `now - turn_started_at` recomputed every snapshot and cleared at turn end, so it
// ticks while the agent works and vanishes when it stops — a glance answers "how long
// has it been grinding". Only shown for a live agent (see toView).
function fmtTurn(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function toView(
  act: SessionActivity,
  status: StatusKey,
  agent: AgentId,
  label: string,
): IslandSessionView {
  const title = paneTitle(act.session, act.alias, agent);
  const subtitle =
    act.taskDescription && act.taskDescription !== title ? act.taskDescription : undefined;
  return {
    session: act.session,
    status,
    title,
    agent,
    agentName: AGENT_NAME[agent] ?? "Agent",
    workspace: act.workspace ?? undefined,
    ago: fmtIdle(act.idleMs),
    timer: status === "live" && act.turnElapsedMs != null ? fmtTurn(act.turnElapsedMs) : undefined,
    subtitle,
    action: eventLabel(label),
  };
}

// Header label for the EXPANDED island's mascot — a per-state phrase (the expanded
// panel has room for the nuance the collapsed strip's working/idle can't).
const BANNER_LABEL: Record<MascotState, string> = {
  idle: "All idle",
  thinking: "Thinking…",
  coding: "Working",
  building: "Deploying",
  success: "Done",
  error: "Needs attention",
};

// Crown of the EXPANDED island: the animated robot mascot seated in a state-tinted
// "well", an app-identity overline, the aggregate state (status dot + phrase), and a
// live-agent count pill — over a status-spine hairline that divides it from the roster.
// Only mounted when expanded (so the active-state GIF is fetched on first expand).
export function MascotBanner({ sessions }: { sessions: IslandSessionView[] }) {
  const count = sessions.length;
  const mascot = mascotStateFor(sessions);
  const key = MASCOT_STATUS[mascot];
  const accent = mascotAccent(mascot);
  // A MIXED fleet (more than one status present) gets a per-status breakdown chip
  // (●1 ●2) instead of a flat "N agents"; a single-status fleet keeps the word count.
  const tally = statusTally(sessions);
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.625rem 0.6875rem 0.5625rem",
        }}
      >
        {/* Mascot well — a rounded surface with an inset ring + soft outer glow tinted
            to the fleet state, so the transparent robot reads as a contained avatar. */}
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            width: "3.25rem",
            height: "3.25rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "color-mix(in oklab, var(--fg-0) 5%, transparent)",
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 30%, var(--bd-soft)), 0 0 1.25rem -0.625rem ${accent}`,
          }}
        >
          <MascotGif state={mascot} size={44} radius="0.5rem" />
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0, flex: 1 }}
        >
          <span
            style={{
              fontSize: "var(--fs-9)",
              letterSpacing: "0.14em",
              fontWeight: 600,
              color: "var(--fg-3)",
              textTransform: "uppercase",
            }}
          >
            CodeHub · Agents
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4375rem", minWidth: 0 }}>
            <StatusDot status={key} pulse={key === "live"} />
            <span
              style={{
                fontSize: "var(--fs-14)",
                fontWeight: 600,
                color: "var(--fg-0)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {BANNER_LABEL[mascot]}
            </span>
          </div>
        </div>
        {/* Fleet count / breakdown — single source of truth (the notch strip's badge is
            hidden while expanded so it isn't shown twice). MIXED fleet → a per-status
            tally (colored dots + counts), ordered awaiting-first; single status → the
            "N agents" word count; empty → nothing (the empty roster below speaks). */}
        {count === 0 ? null : tally.length > 1 ? (
          <div
            style={{
              flexShrink: 0,
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "color-mix(in oklab, var(--fg-0) 6%, transparent)",
              boxShadow: "inset 0 0 0 1px var(--bd-soft)",
              borderRadius: "0.4375rem",
              padding: "0.1875rem 0.5rem",
            }}
          >
            {tally.map(({ key: k, n }) => (
              <span
                key={k}
                className="tnum"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "var(--fs-12)",
                  fontWeight: 700,
                  color: "var(--fg-0)",
                }}
              >
                <StatusDot status={k} pulse={k === "live" || k === "wait"} />
                {n}
              </span>
            ))}
          </div>
        ) : (
          <span
            style={{
              flexShrink: 0,
              alignSelf: "center",
              display: "inline-flex",
              alignItems: "baseline",
              gap: "0.25rem",
              fontSize: "var(--fs-11)",
              color: "var(--fg-2)",
              background: "color-mix(in oklab, var(--fg-0) 6%, transparent)",
              boxShadow: "inset 0 0 0 1px var(--bd-soft)",
              borderRadius: "0.4375rem",
              padding: "0.1875rem 0.4375rem",
            }}
          >
            <b
              className="tnum"
              style={{ fontSize: "var(--fs-13)", fontWeight: 700, color: "var(--fg-0)" }}
            >
              {count}
            </b>
            {count === 1 ? "agent" : "agents"}
          </span>
        )}
        {/* No collapse chevron here — collapse lives in the centered ▴ tab at the bottom
            of the panel (ExpandTab, same place as the collapsed ▾), so the open/close cue
            is in ONE spot, not split between a header button and a bottom tab. */}
      </div>
      {/* Status spine — the header/roster divider carries the fleet's accent, fading to
          transparent at both ends, so the panel reads as lit by the aggregate state
          (neutral hairline while idle). */}
      <div
        style={{
          height: "1px",
          margin: "0 0.5rem",
          background:
            mascot === "idle"
              ? "var(--bd-soft)"
              : `linear-gradient(90deg, transparent, color-mix(in oklab, ${accent} 55%, transparent) 22%, color-mix(in oklab, ${accent} 55%, transparent) 78%, transparent)`,
        }}
      />
    </>
  );
}

export function Island() {
  const [sessions, setSessions] = useState<IslandSessionView[]>([]);
  // An agent needs attention (waiting / just finished / failed) → auto-expand so
  // the island announces it without a click. Working/idle alone stay collapsed.
  const [urgent, setUrgent] = useState(false);
  // CLICK-driven expand (replaces hover-expand): the collapsed pill is a click target
  // → open. Click the header's collapse control (or a row, or let the pointer leave for
  // a beat) → closed. Hover no longer expands — moving the cursor near the notch used to
  // pop the panel open over the menu bar by accident.
  const [open, setOpen] = useState(false);
  // PEEK: the user tucked the island down to a small nub so the menu bar behind it is
  // usable. A third resting state below "collapsed"; restored by clicking the nub.
  const [peeked, setPeeked] = useState(false);
  // Pointer-over signals — no longer drive expand; they drive (a) auto-collapse once the
  // cursor leaves the open panel, and (b) native-bridge row hit-testing. `hovering` is the
  // in-webview signal (fires only when CodeHub is the active app); `nativeHover` is pushed
  // from the native global/local mouse monitor (island.rs) so it ALSO works while CodeHub
  // is backgrounded — a non-activating window never sees mouse-moved events when inactive.
  const [hovering, setHovering] = useState(false);
  const [nativeHover, setNativeHover] = useState(false);
  // Notch geometry (px) of the screen the island is currently on, pushed by the
  // native window (island.rs `island://notch`). On a notched display the top strip
  // height == notch.height and the collapsed content flanks a camera dead-zone of
  // notch.width; both 0 on external/notch-less displays (→ a plain pill below the
  // menu bar). Changes as the island follows the cursor across screens.
  const [notch, setNotch] = useState({ width: 0, height: 0 });
  // Session of the row the cursor is over, hit-tested from the native cursor bridge
  // (island://cursor → elementFromPoint). Drives inner-row hover while CodeHub is
  // backgrounded, where CSS :hover is frozen (no mouse-moved to an inactive app).
  const [cursorSession, setCursorSession] = useState<string | null>(null);
  // Id of the inline control (chevron / minimize / restore) the native cursor bridge
  // reports the pointer over — forces its hover look on the backgrounded panel where CSS
  // :hover is frozen (same mechanism as `cursorSession` for rows). See `IslandCtrl`.
  const [cursorCtrl, setCursorCtrl] = useState<string | null>(null);
  // Brief attention pulse: a ring bloom on the surface when an agent FRESHLY flips to
  // "needs input". Auto-expand alone surfaced the roster silently; the ping is the
  // "look here" cue. Fired on the rising edge only (see effect below), self-clears.
  const [ping, setPing] = useState(false);
  const prevWait = useRef<Set<string>>(new Set());
  // Natural (morph-stable) sizes of the expanded body (banner+list) and the notch-less
  // collapsed bar — drive the window target so it's sized ONCE, not chased. The bar is
  // content-sized, so its WIDTH is measured too: the notch-less collapsed pill hugs the
  // bar (mascot + label + count) instead of a fixed width, so the "Idle"/"Working" label
  // can NEVER truncate — the surface is exactly as wide as its content.
  const [bodyRef, , bodyH] = useMeasuredSize();
  const [barRef, barW, barH] = useMeasuredSize();
  // The notch-less MINIMIZED pill (mascot + count, no label) — measured so the peek
  // window target hugs it exactly (the count can be 1–2 digits).
  const [minRef, minW, minH] = useMeasuredSize();

  // Native: trust ONLY the poll (`nativeHover`). Browser: the poll never fires, so fall
  // back to DOM hover. Used for auto-collapse + row hit-testing, NOT expand.
  const hover = nativeHover || (!NATIVE_HOVER && hovering);
  // The island is OPEN when the user expanded it. (Urgency auto-opens it on the rising
  // edge via the effect below, but the user can still collapse it — `open` is the single
  // source of truth, so an urgent panel isn't force-held open.)
  const expanded = open;
  // Three resting states drive the surface size + content. Open wins over peek.
  const mode: IslandMode = open ? "expanded" : peeked ? "peek" : "collapsed";

  // Cursor left the surface → clear the native-driven row + control highlights.
  useEffect(() => {
    if (!hover) {
      setCursorSession(null);
      setCursorCtrl(null);
    }
  }, [hover]);

  // Auto-collapse: once the pointer leaves the OPEN panel, collapse after a short grace
  // (DI-like — forgiving close without hunting for the chevron). Skipped while urgent so
  // an attention panel stays up until the user acts; the chevron / a row click close it
  // instantly regardless.
  useEffect(() => {
    if (!open || hover || urgent) return;
    const t = setTimeout(() => setOpen(false), 600);
    return () => clearTimeout(t);
  }, [open, hover, urgent]);

  // Urgency announces itself: on the RISING edge of urgent, open the panel (and undo any
  // peek). Edge-triggered so the user can collapse a still-urgent panel and it won't
  // immediately re-open every poll.
  const prevUrgent = useRef(false);
  useEffect(() => {
    if (urgent && !prevUrgent.current) {
      setOpen(true);
      setPeeked(false);
    }
    prevUrgent.current = urgent;
  }, [urgent]);

  // Native signals — all work regardless of app focus (see island.rs monitors).
  // No-ops in browser (dev bridge never emits them); the JS hover above covers dev.
  useEffect(() => {
    const uns: UnlistenFn[] = [];
    listen<boolean>("island://hover", (e) => setNativeHover(e.payload)).then((f) => uns.push(f));
    // The helper RE-EMITS notch dims periodically (a missed first emit, before this
    // listener attached, otherwise left React stuck notch-less → a narrow pill centered
    // UNDER the physical notch = invisible). Dedupe by VALUE so the resync is a no-op
    // when unchanged (no re-render mid-morph — that was the shake).
    listen<{ width: number; height: number }>("island://notch", (e) =>
      setNotch((prev) =>
        prev.width === e.payload.width && prev.height === e.payload.height ? prev : e.payload,
      ),
    ).then((f) => uns.push(f));
    // Native cursor bridge → drive inner-row hover by hit-testing the reported point.
    // Coords are window-local CSS px (island.rs flips Cocoa's bottom-left origin).
    listen<{ x: number; y: number }>("island://cursor", (e) => {
      const el = document.elementFromPoint(e.payload.x, e.payload.y);
      const row = el?.closest("[data-island-row]");
      setCursorSession(row?.getAttribute("data-island-row") ?? null);
      // Same hit-test for the inline controls (chevron / minimize / restore) so they get a
      // real hover on the backgrounded panel (CSS :hover is frozen there).
      const ctrl = el?.closest("[data-island-ctrl]");
      setCursorCtrl(ctrl?.getAttribute("data-island-ctrl") ?? null);
    }).then((f) => uns.push(f));
    return () => {
      for (const u of uns) u();
    };
  }, []);

  // The island is a fixed-size surface, not the fluid main chrome — pin the rem
  // root to 16px so it renders at its designed size in the small notch window,
  // and clear the webview background so only the rounded card paints.
  useEffect(() => {
    const html = document.documentElement;
    const prevFont = html.style.fontSize;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = document.body.style.background;
    html.style.fontSize = "16px";
    html.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      html.style.fontSize = prevFont;
      html.style.background = prevHtmlBg;
      document.body.style.background = prevBodyBg;
    };
  }, []);

  // Poll the live feed; build the sorted agent list + the urgency flag.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const [activity, prompts, live] = await Promise.all([
          ipc.sessionActivity(),
          ipc.pendingPrompts(),
          ipc.listSessions(),
        ]);
        if (!alive) return;
        const awaiting = new Set(prompts.map((p) => p.session));
        // Only sessions that are STILL live tmux sessions right now. The activity
        // snapshot can carry ghosts (closed panes, replayed event files) until the
        // backend prune catches up; intersecting with the live tmux list drops the
        // old/dead ones deterministically.
        const liveNames = new Set(live.map((s) => s.name));

        const views = activity
          .map((act) => {
            // Live agents only: drop ghosts (not a live tmux session) and shells /
            // unknown prefixes (agentFromName → null).
            if (!liveNames.has(act.session)) return null;
            const agent = agentFromName(act.session);
            if (!agent) return null;
            const live = deriveLiveStatus(act, awaiting.has(act.session));
            return { act, status: live.status, agent, idle: act.idleMs, label: live.label };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
          .sort((a, b) => {
            const r = (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0);
            return r !== 0 ? r : a.idle - b.idle; // ties: most-recent first
          })
          .map(({ act, status, agent, label }) => toView(act, status, agent, label));

        setSessions(views);
        setUrgent(
          views.some((v) => v.status === "wait" || v.status === "err" || v.status === "done"),
        );
      } catch {
        // Feed read failed (daemon down / bridge no-op) — keep the last frame.
      } finally {
        if (alive) timer = setTimeout(tick, POLL_MS);
      }
    };
    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Persistent presence: show the window on mount (enabling the feature surfaces
  // the bar immediately, no shortcut), and re-present whenever an agent becomes
  // urgent (re-surfaces even if ⌘⇧J-hidden). NEVER auto-dismissed on idle — it
  // collapses to the bar instead; only ⌘⇧J / disabling the feature hides it.
  useEffect(() => {
    void ipc.islandPresent().catch(() => {});
  }, []);
  useEffect(() => {
    if (urgent) void ipc.islandPresent().catch(() => {});
  }, [urgent]);

  // Attention ping on the RISING EDGE of "needs input": pulse only when a session that
  // wasn't waiting last frame now is, so a steady-state awaiting agent doesn't strobe
  // every poll. Self-clears after the ring animation (~1.4s).
  useEffect(() => {
    const wait = sessions.filter((s) => s.status === "wait").map((s) => s.session);
    const fresh = wait.some((id) => !prevWait.current.has(id));
    prevWait.current = new Set(wait);
    if (!fresh) return;
    setPing(true);
    const t = setTimeout(() => setPing(false), 1400);
    return () => clearTimeout(t);
  }, [sessions]);

  const onJump = useCallback((session: string) => {
    // Collapse on jump so focus visibly moves to the terminal instead of leaving the
    // roster hanging open.
    setOpen(false);
    void ipc.focusSessionFromCompanion(session).catch(() => {});
  }, []);

  const active = sessions[0] ?? null;
  const notched = notch.height > 0;
  // Aggregate working/idle state + a mascot box sized to the notch height (clamped so
  // it stays a crisp pixel sprite). The COLLAPSED island shows ONE mascot instead of a
  // per-session name — concurrent agents can't share one name, so the mascot's loop is
  // the honest "is the fleet working" signal.
  const mascot = mascotStateFor(sessions);
  const mascotSize = Math.min(36, Math.max(24, notch.height - 2));
  // Flank = half the collapsed strip, one each side of the camera dead-zone. Collapsed
  // LEFT flank holds the mascot + a one-word status label ("Idle"/"Working"); RIGHT flank
  // holds the count badge — so the left flank must be wide enough for the label too.
  // Symmetric (camera stays centered): the larger need sets both flanks. Clamped to
  // [COLLAPSED_W, EXPANDED_W] — a hard MIN so the strip flanks the camera instead of
  // hiding under it, and a MAX so the collapsed pill never grows wider than the open one.
  const leftNeed = mascotSize + 8 + 64 + 14; // mascot + gap + label room ("Working") + edge pad
  const rightNeed = 40; // count badge + gaps + edge pad
  const flank = Math.min(FLANK_MAX, Math.max(FLANK_MIN, leftNeed, rightNeed));
  const collapsedW = Math.min(EXPANDED_W, Math.max(COLLAPSED_W, notch.width + 2 * flank));
  // Notch-less collapsed pill hugs its content: the surface is exactly as wide as the
  // bar (mascot + label + count), so the label is never clipped. Falls back to a sane
  // width until the first measure lands; capped at the expanded width.
  const collapsedPillW = barW > 0 ? Math.min(EXPANDED_W, barW) : COLLAPSED_W;

  // The native window target for a resting MODE, computed DIRECTLY from constants + the
  // morph-stable content sizes (no per-frame measurement). Notched: the top strip is the
  // notch height; the body adds `bodyH` only when expanded; peek is a tiny nub. Notch-
  // less: the surface is the bar (collapsed) / banner+list (expanded) / nub (peek). Plus
  // the transparent shadow margin (PAD_X sides, PAD_B bottom; top is flush with the notch).
  // Peek (minimized): mascot + count only. Notched → tight flanks around the camera
  // (mascot left, count right), same strip height; off-notch → the measured mini pill.
  // Peek right flank holds the count + the `<->` restore control, so it must be wide enough
  // that the count never slides under the camera dead-zone (the mascot-only left need is
  // smaller; both flanks render at this width). 60px ≈ count(2-digit) + gap + 18px button +
  // edge pad at the pinned 16px root.
  const peekFlank = Math.max(mascotSize + PEEK_FLANK_PAD, 60);
  const peekW = notched
    ? Math.min(EXPANDED_W, notch.width + 2 * peekFlank)
    : minW > 0
      ? Math.min(EXPANDED_W, minW)
      : 96;
  const winTarget = useCallback(
    (m: IslandMode) => {
      let surfaceW: number;
      let surfaceH: number;
      // The chevron tab is OUTSIDE the black surface now — it floats just below the bottom
      // edge. `belowH` is the transparent zone reserved under the surface for it (above the
      // shadow margin PAD_B). Present collapsed + expanded (same place); peek has no tab.
      let belowH: number;
      if (m === "expanded") {
        surfaceW = EXPANDED_W;
        surfaceH = notched ? notch.height + bodyH : bodyH;
        belowH = EXPAND_TAB_H;
      } else if (m === "peek") {
        surfaceW = peekW;
        surfaceH = notched ? notch.height : minH > 0 ? minH : barH;
        belowH = 0;
      } else {
        surfaceW = notched ? collapsedW : collapsedPillW;
        surfaceH = notched ? notch.height : barH;
        belowH = EXPAND_TAB_H;
      }
      return { w: Math.ceil(surfaceW + 2 * PAD_X), h: Math.ceil(surfaceH + belowH + PAD_B) };
    },
    [notched, collapsedW, collapsedPillW, peekW, notch.height, bodyH, barH, minH],
  );

  // Size the native window to the current mode's FINAL target. The surface snaps to its
  // mode width instantly (no spring), so the window snaps with it — one resize per mode
  // change, correct and centered. (Inert in the native helper — the injected shim drives
  // the panel off the data-attrs below since the route's resizeIsland IPC is a no-op there
  // — but kept correct for the dev browser + future Tauri-native island.)
  useEffect(() => {
    const { w, h } = winTarget(mode);
    void ipc.resizeIsland(w, h).catch(() => {});
  }, [mode, winTarget]);

  const expandedTarget = winTarget("expanded");
  const collapsedTarget = winTarget("collapsed");
  const peekTarget = winTarget("peek");

  // The collapsed pill is a click target → toggle open. The minimize/peek control + the
  // expanded collapse chevron stop propagation so they don't also fire this.
  const toggleOpen = () => {
    setPeeked(false);
    setOpen((o) => !o);
  };
  // Expand straight from the minimized pill (its ▾ lives only in the collapsed state, so
  // the minimized pill restores to collapsed on click — but the collapsed ▾/click then
  // opens). Collapsed → minimized via the − control.
  const minimize = () => {
    setOpen(false);
    setPeeked(true);
  };
  const restore = () => setPeeked(false);

  // Native helper: the card FILLS the window (width 100%) so its content tracks the panel
  // as island.rs animates the frame — no in-webview width animation (dead in the hidden,
  // rAF-suspended WKWebView). Dev-web has no native window, so the card carries the
  // explicit per-mode width itself (snaps per mode; the states stay verifiable in-browser).
  const cardWidth = NATIVE_PANEL ? "100%" : `${winTarget(mode).w}px`;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Stable outer node. On a notched display the native window top sits at the
          SCREEN top (island.rs), so this top pad is 0 and the surface's notch-height top
          strip fills the notch area and merges with it. The shadow margin (sides +
          bottom, PAD_X/PAD_B) is included so the window covers the float shadow.
          `data-island-mode` + the per-mode targets drive the native panel resize (the
          injected shim reads them; the route's own resizeIsland IPC is a no-op there). */}
      <div
        data-island-card
        data-island-mode={mode}
        data-island-expanded-w={expandedTarget.w}
        data-island-expanded-h={expandedTarget.h}
        data-island-collapsed-w={collapsedTarget.w}
        data-island-collapsed-h={collapsedTarget.h}
        data-island-peek-w={peekTarget.w}
        data-island-peek-h={peekTarget.h}
        style={{
          transformOrigin: "top center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 1.5rem 1.5rem",
          width: cardWidth,
          boxSizing: "border-box",
        }}
      >
        {/* THE surface — a SINGLE black box. Width + body height SNAP to the mode target
            (no spring): the native helper's WKWebView runs as a hidden, accessory-app
            panel, so requestAnimationFrame is suspended there — a framer-motion morph
            never ticks, leaving the surface frozen at its old size while the window
            resizes (broken). Plain inline styles apply on render with no rAF, so the box
            is ALWAYS at its mode size. The window is sized to the same target by the resize
            effect (dev/native) or the injected MutationObserver shim (helper). */}
        {notched ? (
          <div
            className={`island-surface${ping ? " is-ping" : ""}`}
            data-open={expanded}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{ ...ISLAND_SURFACE, width: "100%" }}
          >
            {peeked && !open ? (
              // MINIMIZED → icon + count only, flanking the camera at the notch height
              // (the window receded symmetrically to this width). Click anywhere OR the
              // `<->` restore control → back to collapsed.
              <div onClick={restore} style={{ cursor: "pointer" }}>
                <NotchStrip
                  active={active}
                  count={sessions.length}
                  notchW={notch.width}
                  notchH={notch.height}
                  expanded={false}
                  minimized
                  mascot={mascot}
                  mascotSize={mascotSize}
                  onRestore={restore}
                  cursorCtrl={cursorCtrl}
                />
              </div>
            ) : (
              <>
                {/* Always-on notch strip (fills the notch, content flanks the camera).
                    The strip is the click target that toggles the panel open/closed;
                    its `>-<` minimizes. */}
                <div onClick={toggleOpen} style={{ cursor: "pointer" }}>
                  <NotchStrip
                    active={active}
                    count={sessions.length}
                    notchW={notch.width}
                    notchH={notch.height}
                    expanded={expanded}
                    mascot={mascot}
                    mascotSize={mascotSize}
                    onPeek={minimize}
                    cursorCtrl={cursorCtrl}
                  />
                </div>
                {/* Body shows on expand; all text lives here, below the camera. ALWAYS
                    mounted (height clipped to 0 when collapsed) so the inner `bodyRef`
                    div keeps its natural height — measured for the window target even
                    while collapsed (no first-open clip). Height toggles instantly. */}
                <div style={{ overflow: "hidden", height: expanded ? "auto" : 0 }}>
                  {/* Pinned to the FINAL expanded width so the measured height is stable
                      (one measurement, never reflows with the surface width). */}
                  <div ref={bodyRef} style={{ width: `${EXPANDED_W}px` }}>
                    <MascotBanner sessions={sessions} />
                    <IslandList
                      sessions={sessions}
                      onJump={onJump}
                      show={expanded}
                      cursorSession={cursorSession}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Notch-less display (external monitor): a plain pill that toggles bar↔list↔min.
          <div
            className={`island-surface${ping ? " is-ping" : ""}`}
            data-open={expanded}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{ ...ISLAND_SURFACE, width: "100%" }}
          >
            {/* All three variants ALWAYS mounted (height clipped to 0 for the inactive
                ones) so bodyH / barW / minW stay measured for the window targets; only the
                active one has height (toggles instantly — no rAF crossfade in the hidden
                WKWebView). */}
            <>
              <div style={{ overflow: "hidden", height: open ? "auto" : 0 }}>
                <div ref={bodyRef} style={{ width: `${EXPANDED_W}px` }}>
                  <MascotBanner sessions={sessions} />
                  <IslandList sessions={sessions} onJump={onJump} cursorSession={cursorSession} />
                </div>
              </div>
              <div style={{ overflow: "hidden", height: mode === "collapsed" ? "auto" : 0 }}>
                {/* Content-sized (inline-block) so the measured width IS the bar's
                    intrinsic width — the surface then hugs it (no label truncation).
                    The whole bar is a click target → open; its `>-<` minimizes. */}
                <div
                  ref={barRef}
                  onClick={toggleOpen}
                  style={{ display: "inline-block", cursor: "pointer" }}
                >
                  <IslandBar
                    count={sessions.length}
                    mascot={mascot}
                    onPeek={minimize}
                    cursorCtrl={cursorCtrl}
                  />
                </div>
              </div>
              <div style={{ overflow: "hidden", height: peeked && !open ? "auto" : 0 }}>
                {/* MINIMIZED → icon + count only; click anywhere OR the `<->` restore
                    control → back to collapsed. */}
                <div
                  ref={minRef}
                  onClick={restore}
                  style={{ display: "inline-block", cursor: "pointer" }}
                >
                  <IslandBar
                    count={sessions.length}
                    mascot={mascot}
                    minimized
                    onRestore={restore}
                    cursorCtrl={cursorCtrl}
                  />
                </div>
              </div>
            </>
          </div>
        )}
        {/* The chevron lives OUTSIDE the black surface — a single floating glyph just below
            the island's bottom edge (centered by the card's flex column), in the transparent
            zone above the shadow margin. Same place both states: ▾ collapsed (→ expand) /
            ▴ expanded (→ collapse). Hidden while minimized (the peek pill restores via `<->`). */}
        {!(peeked && !open) ? (
          <ExpandTab
            expanded={open}
            onToggle={toggleOpen}
            mascot={mascot}
            cursor={cursorCtrl === "chevron"}
          />
        ) : null}
      </div>
    </div>
  );
}
