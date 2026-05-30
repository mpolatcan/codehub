// Single source of truth for an agent's LIVE status, shared by every surface
// that paints it (panes, sidebar, status bar, activity rail, companion, and the
// native macOS island's feed mirror). Before this helper each surface re-derived
// "working" from a different signal — some from the byte-flow `state`, some from
// the hook-driven `sessionStatus` — so a thinking agent could read "idle" in one
// place and "working" in another. This centralizes the precedence so they agree.
//
// Everything here is REAL signal: hook lifecycle when the agent emits hooks,
// byte-flow as the honest fallback for hook-less CLIs. Nothing is timer-faked.

import type { SessionActivity } from "./ipc";

export type LiveStatus = "wait" | "err" | "done" | "live" | "idle";

// How long a finished/failed turn lingers as a transient badge before the row
// settles to its steady status. Mirrors the companion design's ~6s linger.
export const OUTCOME_LINGER_MS = 6000;

export interface LiveView {
  status: LiveStatus;
  // True only while live with no active tool (model generating) → "thinking".
  thinking: boolean;
  // Tool running right now, when live and inside a tool call.
  currentTool: string | null;
  // One-line label: "running Bash" | "thinking" | "needs input" | "finished" |
  // "failed" | "working" | "idle 3s".
  label: string;
}

// Precedence mirrors the companion design:
//   awaiting > failed(transient) > finished(transient) > live(tool/thinking) > idle
// `awaiting` is passed separately because the pending-prompt list is tracked
// apart from the activity snapshot (and the snapshot's own `awaiting` status is
// also honored, for surfaces that don't have the prompt list handy).
export function deriveLiveStatus(act: SessionActivity, awaiting: boolean): LiveView {
  // 1. Blocked on the user.
  if (awaiting || act.sessionStatus === "awaiting") {
    return { status: "wait", thinking: false, currentTool: null, label: "needs input" };
  }
  // 2. Transient outcome of the turn that just finished (lingers a few seconds).
  const lingering = act.outcomeMsAgo != null && act.outcomeMsAgo < OUTCOME_LINGER_MS;
  if (lingering && act.lastOutcome === "failed") {
    return { status: "err", thinking: false, currentTool: null, label: "failed" };
  }
  if (lingering && act.lastOutcome === "completed") {
    return { status: "done", thinking: false, currentTool: null, label: "finished" };
  }
  // 3. Working — trust the hook lifecycle when present, else the byte-flow signal.
  const running = act.seenHooks ? act.sessionStatus === "running" : act.state === "working";
  if (running) {
    if (act.currentTool) {
      return {
        status: "live",
        thinking: false,
        currentTool: act.currentTool,
        label: `running ${act.currentTool}`,
      };
    }
    // Hook-aware agent with no active tool = genuinely thinking; a hook-less CLI
    // that's merely emitting output is just "working" (we can't see its thoughts).
    return {
      status: "live",
      thinking: act.seenHooks,
      currentTool: null,
      label: act.seenHooks ? "thinking" : "working",
    };
  }
  // 4. At rest.
  return {
    status: "idle",
    thinking: false,
    currentTool: null,
    label: `idle ${fmtIdle(act.idleMs)}`,
  };
}

// Compact quiet/elapsed duration: "3s" / "2m" / "1h".
export function fmtIdle(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// Live turn timer "0:42" / "3:05" / "1:02:33" from turnElapsedMs.
export function fmtTurnClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// "turn 3 · 14 tools" summary of the hook counters; null when there's nothing
// real to show (hook-less CLI, or a session that hasn't acted yet).
export function fmtCounters(act: SessionActivity): string | null {
  if (!act.seenHooks || (act.turns === 0 && act.toolCalls === 0)) return null;
  const parts: string[] = [];
  if (act.turns > 0) parts.push(`turn ${act.turns}`);
  parts.push(`${act.toolCalls} tool${act.toolCalls === 1 ? "" : "s"}`);
  return parts.join(" · ");
}
