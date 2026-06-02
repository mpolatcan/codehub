import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ISLAND_SURFACE,
  IslandBar,
  IslandList,
  type IslandSessionView,
  NotchStrip,
} from "../components/Island";
import type { AgentId } from "../components/primitives/AgentGlyph";
import type { StatusKey } from "../components/primitives/StatusDot";
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

// Surface widths in PX (numbers, not rem) — the island root is pinned to 16px so it
// is a fixed-size native surface, not the fluid chrome, and a numeric width lets the
// spring morph between the notch-sized collapsed box and the expanded box smoothly.
// On a notched display the collapsed width is `notch.width + 2·FLANK` (computed live)
// so the strip just clears the camera; COLLAPSED_W is the notch-less fallback.
const COLLAPSED_W = 280;
const EXPANDED_W = 360;
// Room (px) each side of the camera dead-zone for the status dot / count chip (and,
// when a single agent is active, its collapsed workspace tag).
const FLANK = 64;
// One spring drives BOTH the width morph and the body height-accordion so the box
// grows out of the notch as a single fluid motion (Apple-DI feel). Snappy, settled.
const SURFACE_SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

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
    subtitle,
    action: eventLabel(label),
  };
}

export function Island() {
  const [sessions, setSessions] = useState<IslandSessionView[]>([]);
  // An agent needs attention (waiting / just finished / failed) → auto-expand so
  // the island announces it without a hover. Working/idle alone stay collapsed.
  const [urgent, setUrgent] = useState(false);
  // Pointer is over the notch surface → expand on demand (like the real DI).
  // `hovering` is the in-webview signal (fires only when CodeHub is the active
  // app); `nativeHover` is pushed from the native global/local mouse monitor
  // (island.rs) so hover-expand ALSO works while CodeHub is in the background —
  // a non-activating window otherwise never sees mouse-moved events when inactive.
  const [hovering, setHovering] = useState(false);
  const [nativeHover, setNativeHover] = useState(false);
  // Notch geometry (px) of the screen the island is currently on, pushed by the
  // native window (island.rs `island://notch`). On a notched display the top strip
  // height == notch.height and the collapsed content flanks a camera dead-zone of
  // notch.width; both 0 on external/notch-less displays (→ a plain pill below the
  // menu bar). Changes as the island follows the cursor across screens.
  const [notch, setNotch] = useState({ width: 0, height: 0 });
  // After a jump (a row click), collapse the island and KEEP it collapsed even
  // though the cursor is still over it — otherwise `nativeHover`/`hovering` would
  // hold it open. Cleared once the cursor actually leaves (both hover signals go
  // false), so the next hover re-expands normally. Urgency still overrides it.
  const [suppressed, setSuppressed] = useState(false);
  // Session of the row the cursor is over, hit-tested from the native cursor bridge
  // (island://cursor → elementFromPoint). Drives inner-row hover while CodeHub is
  // backgrounded, where CSS :hover is frozen (no mouse-moved to an inactive app).
  const [cursorSession, setCursorSession] = useState<string | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  // Native: trust ONLY the poll (`nativeHover`) — DOM hover can stick after a jump.
  // Browser: the poll never fires, so fall back to DOM hover.
  const hover = nativeHover || (!IS_TAURI && hovering);
  const expanded = urgent || (hover && !suppressed);

  // Cursor left the surface → drop the post-jump suppression so hovering works again,
  // and clear the native-driven row highlight.
  useEffect(() => {
    if (!hover) {
      if (suppressed) setSuppressed(false);
      setCursorSession(null);
    }
  }, [hover, suppressed]);

  // Native signals — all work regardless of app focus (see island.rs monitors).
  // No-ops in browser (dev bridge never emits them); the JS hover above covers dev.
  useEffect(() => {
    const uns: UnlistenFn[] = [];
    listen<boolean>("island://hover", (e) => setNativeHover(e.payload)).then((f) => uns.push(f));
    listen<{ width: number; height: number }>("island://notch", (e) => setNotch(e.payload)).then(
      (f) => uns.push(f),
    );
    // Native cursor bridge → drive inner-row hover by hit-testing the reported point.
    // Coords are window-local CSS px (island.rs flips Cocoa's bottom-left origin).
    listen<{ x: number; y: number }>("island://cursor", (e) => {
      const el = document.elementFromPoint(e.payload.x, e.payload.y);
      const row = el?.closest("[data-island-row]");
      setCursorSession(row?.getAttribute("data-island-row") ?? null);
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

  // Keep the native window sized to the current content (+ shadow margin). A
  // callback ref re-attaches the ResizeObserver as the bar/list swap in and out.
  const cardRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!node) {
      roRef.current = null;
      return;
    }
    const ro = new ResizeObserver(() => {
      const r = node.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        void ipc.resizeIsland(Math.ceil(r.width), Math.ceil(r.height)).catch(() => {});
      }
    });
    ro.observe(node);
    roRef.current = ro;
  }, []);

  const onJump = useCallback((session: string) => {
    // Collapse immediately on jump (stays collapsed until the cursor leaves), so
    // focus visibly moves to the terminal instead of leaving the roster hanging open.
    setSuppressed(true);
    void ipc.focusSessionFromCompanion(session).catch(() => {});
  }, []);

  const active = sessions[0] ?? null;
  const notched = notch.height > 0;
  // A lone agent shows its workspace in the collapsed strip — widen the camera flanks
  // so the name isn't truncated, but never past the expanded width (a collapsed pill
  // wider than the open one would look broken). Multiple agents → the count chip is
  // tiny, keep the tight FLANK.
  const singleWs = sessions.length === 1 && !!active?.workspace;
  const collapsedW = Math.min(EXPANDED_W, notch.width + 2 * (singleWs ? 96 : FLANK));

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Stable outer node (ResizeObserver target). On a notched display the native
          window top sits at the SCREEN top (island.rs), so this top pad is 0 and the
          surface's notch-height top strip fills the notch area and merges with it.
          The shadow margin (sides + bottom) is included so the window covers the
          float shadow. */}
      <motion.div
        ref={cardRef}
        style={{ transformOrigin: "top center", padding: "0 1.5rem 1.5rem" }}
        initial={{ opacity: 0, y: "-1rem" }}
        animate={{ opacity: 1, y: "0rem" }}
        transition={SURFACE_SPRING}
      >
        {/* THE morphing surface — a SINGLE black box. Width springs (horizontal grow)
            and, on a notched display, the body height springs from 0→auto (vertical
            grow) so the box grows OUT of the notch. Animating real width/height (not a
            framer `layout` transform) is what lets the RO-driven native window follow
            the morph continuously instead of snapping. */}
        {notched ? (
          <motion.div
            className="island-surface"
            data-open={expanded}
            initial={false}
            animate={{ width: expanded ? EXPANDED_W : collapsedW }}
            transition={SURFACE_SPRING}
            style={ISLAND_SURFACE}
          >
            {/* Always-on notch strip (fills the notch, content flanks the camera). */}
            <NotchStrip
              active={active}
              count={sessions.length}
              notchW={notch.width}
              notchH={notch.height}
              expanded={expanded}
            />
            {/* Body grows DOWN from the notch on expand; all text lives here, below
                the camera. */}
            <motion.div
              initial={false}
              animate={{ height: expanded ? "auto" : 0 }}
              transition={SURFACE_SPRING}
              style={{ overflow: "hidden" }}
            >
              <IslandList
                sessions={sessions}
                onJump={onJump}
                show={expanded}
                cursorSession={cursorSession}
              />
            </motion.div>
          </motion.div>
        ) : (
          // Notch-less display (external monitor): a plain pill that morphs bar↔list.
          <motion.div
            className="island-surface"
            data-open={expanded}
            initial={false}
            animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
            transition={SURFACE_SPRING}
            style={ISLAND_SURFACE}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={expanded ? "list" : "bar"}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={SURFACE_SPRING}
                style={{ overflow: "hidden" }}
              >
                {expanded ? (
                  <IslandList sessions={sessions} onJump={onJump} cursorSession={cursorSession} />
                ) : (
                  <IslandBar active={active} count={sessions.length} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
