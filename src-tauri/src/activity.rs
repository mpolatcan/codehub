//! Per-session activity signal, derived from pane output flow + hook events.
//!
//! The output-flow signal (bytes from the pty pump) gives coarse working/idle.
//! The hook-driven `SessionStatus` (set by events.rs from agent-native hooks)
//! adds richer states: Awaiting, Done, Failed. Both are real observations —
//! nothing is fabricated.

use serde::Serialize;
use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;
use std::time::Instant;

/// A session is "working" while output arrived within this window, else "idle".
const WORKING_GRACE_MS: u64 = 1500;

/// How many recent tool interactions to keep per session for the island's
/// output block. Small — it's a glance surface, not a transcript.
const RECENT_TOOLS_CAP: usize = 5;

/// Coarse, observable activity state from output flow.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ActivityState {
    Working,
    Idle,
}

/// Richer session lifecycle status, driven by agent-native hook events.
///
/// Defaults to `Idle`: a freshly-registered session has not started a turn yet,
/// so claiming `Running` would be fabricated. A turn only becomes `Running` on a
/// real `UserPromptSubmit`/`PreToolUse` hook (or, for hook-less CLIs, the
/// byte-flow `ActivityState` fallback the consumer applies when `seen_hooks` is
/// false).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Running,
    #[default]
    Idle,
    Awaiting,
    Done,
    Failed,
}

/// The outcome of the most recently finished turn — drives the transient
/// "finished"/"failed" badge that lingers for a few seconds (mirroring the
/// companion design) before the row settles back to its steady status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum TurnOutcome {
    Completed,
    Failed,
}

/// One observed tool interaction within the current turn: the tool name, a short
/// argument summary (Bash command / file path / pattern …), and a short result
/// snippet once `PostToolUse` returns. All fields are captured TRUNCATED by the
/// in-container hook (never full output) — honest, glance-sized, never fabricated.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolLine {
    pub tool: String,
    pub arg: Option<String>,
    pub result: Option<String>,
}

/// One session's activity snapshot as the frontend sees it.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionActivity {
    pub session: String,
    pub state: ActivityState,
    pub idle_ms: u64,
    pub bytes: u64,
    pub cli: Option<String>,
    pub alias: Option<String>,
    /// Human workspace title (e.g. "my-project"), for OS notifications that fire
    /// outside the app where the tab/sidebar context is gone. `None` until
    /// `set_workspace` ran (the `workspace` create-arg is the container KEY, not
    /// this readable title — they're different values).
    pub workspace: Option<String>,
    pub claude_id: Option<String>,
    /// Codex conversation/rollout uuid (the notify `thread-id`), captured from the
    /// event stream — the key that locates this session's rollout for token/turn
    /// telemetry. Codex's analog of `claude_id`. `None` until the first turn-finish.
    pub codex_id: Option<String>,
    pub task_description: Option<String>,
    pub turn_elapsed_ms: Option<u64>,
    pub session_status: SessionStatus,
    pub failure_reason: Option<String>,
    pub git_branch: Option<String>,
    /// Turns this session has taken (one per `UserPromptSubmit`). Hook-driven —
    /// stays 0 for hook-less CLIs (honest, never inferred from output).
    pub turns: u64,
    /// Tool invocations observed (one per `PreToolUse`).
    pub tool_calls: u64,
    /// Tool currently executing (set on `PreToolUse`, cleared on `PostToolUse`
    /// /turn-end). `Some` ⇒ "running <tool>"; `None` while `Running` ⇒ "thinking".
    pub current_tool: Option<String>,
    /// Outcome of the last finished turn; pair with `outcome_ms_ago` to render a
    /// transient finished/failed badge. `None` until the first turn ends.
    pub last_outcome: Option<TurnOutcome>,
    /// Milliseconds since `last_outcome` was recorded (for the linger window).
    pub outcome_ms_ago: Option<u64>,
    /// Whether ANY agent hook has fired for this session. Gate for status trust:
    /// `true` ⇒ believe `session_status`; `false` ⇒ fall back to byte-flow `state`.
    pub seen_hooks: bool,
    /// Recent tool interactions of the CURRENT turn (oldest→newest), for the
    /// island's output block. Cleared on each new turn (`UserPromptSubmit`).
    /// Empty for hook-less CLIs or before any tool ran.
    pub recent_tools: Vec<ToolLine>,
}

/// Readable identity for an OS notification — pane alias, workspace title, cli.
/// All optional; absent fields fall back to the raw session name at the call site.
#[derive(Default)]
pub struct NotifyLabel {
    pub alias: Option<String>,
    pub workspace: Option<String>,
    pub cli: Option<String>,
}

#[derive(Default)]
struct Entry {
    last_output: Option<Instant>,
    bytes: u64,
    cli: Option<String>,
    alias: Option<String>,
    workspace: Option<String>,
    claude_id: Option<String>,
    codex_id: Option<String>,
    task_description: Option<String>,
    turn_started_at: Option<Instant>,
    session_status: SessionStatus,
    failure_reason: Option<String>,
    git_branch: Option<String>,
    turns: u64,
    tool_calls: u64,
    current_tool: Option<String>,
    /// `(outcome, epoch-ms observed)` — epoch (not `Instant`) so the snapshot can
    /// report `outcome_ms_ago` and consumers can dedupe announcements by time.
    last_outcome: Option<(TurnOutcome, i64)>,
    seen_hooks: bool,
    /// Recent tool interactions of the current turn (capped at RECENT_TOOLS_CAP).
    recent_tools: VecDeque<ToolLine>,
}

/// Shared, in-memory per-session activity tracker.
#[derive(Default)]
pub struct ActivityTracker {
    inner: Mutex<HashMap<String, Entry>>,
}

impl ActivityTracker {
    pub fn new() -> Self {
        Self::default()
    }

    fn lock_inner(&self) -> std::sync::MutexGuard<'_, HashMap<String, Entry>> {
        self.inner.lock().unwrap_or_else(|e| e.into_inner())
    }

    /// Record output bytes. Tracks turn start on idle→working transition.
    pub fn mark(&self, session: &str, len: usize) {
        let mut map = self.lock_inner();
        let entry = map.entry(session.to_string()).or_default();
        let was_idle = entry
            .last_output
            .map(|t| t.elapsed().as_millis() as u64 >= WORKING_GRACE_MS)
            .unwrap_or(true);
        entry.last_output = Some(Instant::now());
        entry.bytes = entry.bytes.saturating_add(len as u64);
        // Byte-flow only owns turn timing for hook-less CLIs. Once a session has
        // fired hooks, `UserPromptSubmit`/turn-end own `turn_started_at` precisely
        // (output can keep flowing mid-turn, so a byte transition is the wrong
        // boundary there).
        if was_idle && !entry.seen_hooks {
            entry.turn_started_at = Some(Instant::now());
        }
    }

    /// Attach agent identity at session creation.
    pub fn register(
        &self,
        session: &str,
        cli: &str,
        alias: &str,
        claude_id: Option<&str>,
        git_branch: Option<&str>,
        task_description: Option<&str>,
    ) {
        let mut map = self.lock_inner();
        let entry = map.entry(session.to_string()).or_default();
        entry.cli = Some(cli.to_string());
        entry.alias = Some(alias.to_string());
        entry.claude_id = claude_id.map(|s| s.to_string());
        entry.git_branch = git_branch.map(|s| s.to_string());
        entry.task_description = task_description.map(|s| s.to_string());
    }

    /// Attach the human workspace title (for OS notifications). Set right after
    /// `register`, but `or_default` keeps it safe if a hook raced the register on
    /// restart-adopt. Separate from `register` so the many test call sites of
    /// `register` don't all need a new argument.
    pub fn set_workspace(&self, session: &str, workspace: &str) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.workspace = Some(workspace.to_string());
    }

    /// Pane alias + workspace title + cli for a session, for building a readable OS
    /// notification. All-`None` for an unknown session → caller falls back to the
    /// raw session name.
    pub fn notify_label(&self, session: &str) -> NotifyLabel {
        let map = self.lock_inner();
        match map.get(session) {
            Some(e) => NotifyLabel {
                alias: e.alias.clone(),
                workspace: e.workspace.clone(),
                cli: e.cli.clone(),
            },
            None => NotifyLabel::default(),
        }
    }

    /// Record the Codex conversation/rollout uuid (notify `thread-id`) once. Stable
    /// per session, so first capture wins — a later turn carries the same id, and
    /// we never overwrite with a stale/empty one. No-op for an unregistered session.
    pub fn set_codex_id(&self, session: &str, id: &str) {
        let mut map = self.lock_inner();
        if let Some(e) = map.get_mut(session) {
            if e.codex_id.is_none() {
                e.codex_id = Some(id.to_string());
            }
        }
    }

    /// Update session status from hook events. Creates the entry if absent (a hook
    /// proves the session is live — see the lifecycle note below).
    pub fn set_status(&self, session: &str, status: SessionStatus, reason: Option<String>) {
        let mut map = self.lock_inner();
        let entry = map.entry(session.to_string()).or_default();
        entry.seen_hooks = true;
        entry.session_status = status;
        if reason.is_some() {
            entry.failure_reason = reason;
        }
    }

    // ── Hook-driven turn lifecycle ────────────────────────────────────────────
    // Called from `events.rs::ingest` as the agent's hooks arrive. Each marks the
    // session as hook-aware (`seen_hooks`) so consumers trust `session_status` over
    // the byte-flow fallback. Each CREATES the entry if absent (`or_default`): a hook
    // firing proves the session is live, and it can be ingested before the session is
    // registered (on app restart the event tailer replays the events file — possibly
    // before the pane re-attaches and calls `register`). No-op'ing there would lose
    // the hook AND advance the replay cursor past it, so `seen_hooks` would never get
    // set and the idle session's redraws (scroll / panel-resize) would read "working"
    // forever. A stale entry for a closed session is harmless — rows render from the
    // workspace tree, never from this map (callers look up activity by known session).

    /// `UserPromptSubmit`: a new turn begins. Counts the turn, (re)starts the turn
    /// timer, and clears any lingering tool/outcome from the previous turn.
    pub fn on_prompt_submit(&self, session: &str) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.seen_hooks = true;
        e.turns = e.turns.saturating_add(1);
        e.turn_started_at = Some(Instant::now());
        e.current_tool = None;
        e.last_outcome = None;
        e.recent_tools.clear();
        e.session_status = SessionStatus::Running;
    }

    /// `PreToolUse`: the agent is invoking a tool. Counts it, records the tool
    /// name as the current activity ("running <tool>"), and appends a tool line
    /// (tool + short arg summary) to the current turn's recent-tools buffer.
    pub fn on_pre_tool(&self, session: &str, tool: Option<&str>, arg: Option<&str>) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.seen_hooks = true;
        e.tool_calls = e.tool_calls.saturating_add(1);
        e.current_tool = tool.map(|s| s.to_string());
        e.session_status = SessionStatus::Running;
        // Record the interaction for the island's output block. Keyed on a real
        // tool name; a None tool (rare) is counted but not shown as a line.
        if let Some(t) = tool {
            if e.recent_tools.len() >= RECENT_TOOLS_CAP {
                e.recent_tools.pop_front();
            }
            e.recent_tools.push_back(ToolLine {
                tool: t.to_string(),
                arg: arg.map(|s| s.to_string()),
                result: None,
            });
        }
        // A turn may surface its first hook as a tool (no prompt_submit seen):
        // start the timer here so the elapsed clock isn't missing.
        if e.turn_started_at.is_none() {
            e.turn_started_at = Some(Instant::now());
        }
    }

    /// `PostToolUse`: the tool returned; the agent is back to thinking. Clears the
    /// current tool, attaches the (short) result to the last recorded tool line,
    /// but keeps the turn `Running`.
    pub fn on_post_tool(&self, session: &str, result: Option<&str>) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.seen_hooks = true;
        e.current_tool = None;
        e.session_status = SessionStatus::Running;
        if let (Some(r), Some(last)) = (result, e.recent_tools.back_mut()) {
            last.result = Some(r.to_string());
        }
    }

    /// `Stop`/`StopFailure`: the turn finished. Stops the timer, records the
    /// transient outcome (at `at` epoch-ms), and settles the steady status.
    pub fn on_turn_end(&self, session: &str, at: i64, failed: bool, reason: Option<String>) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.seen_hooks = true;
        e.current_tool = None;
        e.turn_started_at = None;
        let outcome = if failed {
            TurnOutcome::Failed
        } else {
            TurnOutcome::Completed
        };
        e.last_outcome = Some((outcome, at));
        e.session_status = if failed {
            SessionStatus::Failed
        } else {
            SessionStatus::Idle
        };
        if failed && reason.is_some() {
            e.failure_reason = reason;
        }
    }

    /// `SessionStart`: the agent process came up. A turn hasn't begun, so the status
    /// stays `Idle` — but the hook firing PROVES this CLI emits hooks, so mark
    /// `seen_hooks`. Without this, a freshly-launched (pre-first-prompt) hook-aware
    /// CLI stays `seen_hooks=false`, and consumers fall back to the byte-flow signal
    /// — so its idle TUI redraws (startup paint, a scroll, a SIGWINCH from opening a
    /// docked panel) read as "working". Marking it here keeps an unprompted session
    /// honestly idle.
    pub fn on_session_start(&self, session: &str) {
        let mut map = self.lock_inner();
        // Create-if-absent: on app restart the tailer often replays SessionStart
        // before the pane re-attaches/registers — this is the line that must still
        // land so the session is hook-aware from the start.
        let e = map.entry(session.to_string()).or_default();
        // Only flip the hook-trust gate; leave `session_status` untouched (it
        // defaults to Idle, and a late/duplicate SessionStart must not stomp a real
        // in-flight status set by an earlier-replayed prompt/tool hook).
        e.seen_hooks = true;
    }

    /// `SessionEnd`: the whole agent session ended.
    pub fn on_session_end(&self, session: &str) {
        let mut map = self.lock_inner();
        let e = map.entry(session.to_string()).or_default();
        e.seen_hooks = true;
        e.current_tool = None;
        e.turn_started_at = None;
        e.session_status = SessionStatus::Done;
    }

    /// Forget a session.
    pub fn remove(&self, session: &str) {
        self.lock_inner().remove(session);
    }

    /// Every currently tracked session name — for stale-entry reconciliation
    /// against the set of live tmux sessions (see `prune_stale_activity_loop`).
    pub fn sessions(&self) -> Vec<String> {
        self.lock_inner().keys().cloned().collect()
    }

    /// Current activity for every tracked session.
    pub fn snapshot(&self) -> Vec<SessionActivity> {
        let now = Instant::now();
        let now_epoch = now_ms();
        self.lock_inner()
            .iter()
            .map(|(session, e)| {
                let idle_ms = e
                    .last_output
                    .map(|t| now.duration_since(t).as_millis() as u64)
                    .unwrap_or(0);
                let state = if e.last_output.is_some() && idle_ms < WORKING_GRACE_MS {
                    ActivityState::Working
                } else {
                    ActivityState::Idle
                };
                let turn_elapsed_ms = e
                    .turn_started_at
                    .map(|t| now.duration_since(t).as_millis() as u64);
                let (last_outcome, outcome_ms_ago) = match e.last_outcome {
                    Some((o, at)) => (Some(o), Some((now_epoch - at).max(0) as u64)),
                    None => (None, None),
                };
                SessionActivity {
                    session: session.clone(),
                    state,
                    idle_ms,
                    bytes: e.bytes,
                    cli: e.cli.clone(),
                    alias: e.alias.clone(),
                    workspace: e.workspace.clone(),
                    claude_id: e.claude_id.clone(),
                    codex_id: e.codex_id.clone(),
                    task_description: e.task_description.clone(),
                    turn_elapsed_ms,
                    session_status: e.session_status,
                    failure_reason: e.failure_reason.clone(),
                    git_branch: e.git_branch.clone(),
                    turns: e.turns,
                    tool_calls: e.tool_calls,
                    current_tool: e.current_tool.clone(),
                    last_outcome,
                    outcome_ms_ago,
                    seen_hooks: e.seen_hooks,
                    recent_tools: e.recent_tools.iter().cloned().collect(),
                }
            })
            .collect()
    }
}

/// Wall-clock epoch milliseconds, matching the `at` field the hook scripts stamp
/// and the epoch stored in `Entry::last_outcome`.
fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;
    use std::time::Duration;

    #[test]
    fn fresh_output_is_working() {
        let t = ActivityTracker::new();
        t.mark("s1", 10);
        let snap = t.snapshot();
        assert_eq!(snap.len(), 1);
        assert_eq!(snap[0].state, ActivityState::Working);
        assert_eq!(snap[0].bytes, 10);
        assert!(snap[0].idle_ms < WORKING_GRACE_MS);
    }

    #[test]
    fn bytes_accumulate_across_marks() {
        let t = ActivityTracker::new();
        t.mark("s1", 10);
        t.mark("s1", 5);
        assert_eq!(t.snapshot()[0].bytes, 15);
    }

    #[test]
    fn goes_idle_after_grace_window() {
        let t = ActivityTracker::new();
        t.mark("s1", 1);
        sleep(Duration::from_millis(WORKING_GRACE_MS + 200));
        let snap = t.snapshot();
        assert_eq!(snap[0].state, ActivityState::Idle);
        assert!(snap[0].idle_ms >= WORKING_GRACE_MS);
    }

    #[test]
    fn remove_drops_the_session() {
        let t = ActivityTracker::new();
        t.mark("s1", 1);
        t.remove("s1");
        assert!(t.snapshot().is_empty());
    }

    #[test]
    fn register_attaches_identity_and_survives_output() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", Some("abc-123"), None, None);
        t.mark("s1", 7);
        let snap = t.snapshot();
        assert_eq!(snap.len(), 1);
        assert_eq!(snap[0].cli.as_deref(), Some("claude"));
        assert_eq!(snap[0].alias.as_deref(), Some("Claude 1"));
        assert_eq!(snap[0].claude_id.as_deref(), Some("abc-123"));
        assert_eq!(snap[0].bytes, 7);
        assert_eq!(snap[0].state, ActivityState::Working);
    }

    #[test]
    fn registered_but_silent_session_is_idle() {
        let t = ActivityTracker::new();
        t.register("s1", "codex", "Codex 1", None, None, None);
        let snap = t.snapshot();
        assert_eq!(snap.len(), 1);
        assert_eq!(snap[0].state, ActivityState::Idle);
        assert_eq!(snap[0].idle_ms, 0);
        assert_eq!(snap[0].bytes, 0);
        assert_eq!(snap[0].alias.as_deref(), Some("Codex 1"));
        assert_eq!(snap[0].claude_id, None);
    }

    #[test]
    fn hook_on_unregistered_session_creates_hook_aware_entry() {
        // On app restart the event tailer can replay a session's hooks BEFORE the
        // pane re-attaches and calls register(). The hook must still land (create the
        // entry + set seen_hooks), else the replay cursor advances past it and the
        // idle session reads "working" off byte-flow forever.
        let t = ActivityTracker::new();
        t.on_session_start("ghost"); // never registered
        t.mark("ghost", 4096); // an idle TUI redraw
        let snap = t.snapshot();
        assert_eq!(snap.len(), 1);
        assert!(
            snap[0].seen_hooks,
            "an ingested hook must mark the session hook-aware"
        );
        assert_eq!(snap[0].session_status, SessionStatus::Idle);
        // Byte-flow says working, but seen_hooks=true means consumers ignore it.
        assert_eq!(snap[0].state, ActivityState::Working);
    }

    #[test]
    fn session_start_marks_hook_aware_but_stays_idle() {
        // A fresh session that has only fired SessionStart must be hook-aware (so
        // byte-flow redraws are ignored) yet still report Idle, not Running.
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_session_start("s1");
        t.mark("s1", 4096); // simulate an idle TUI redraw (scroll / SIGWINCH)
        let snap = t.snapshot();
        assert!(
            snap[0].seen_hooks,
            "SessionStart proves the CLI emits hooks"
        );
        assert_eq!(snap[0].session_status, SessionStatus::Idle);
        assert_eq!(snap[0].turns, 0);
        // Byte-flow `state` may say working, but seen_hooks means consumers ignore it.
        assert_eq!(snap[0].state, ActivityState::Working);
    }

    #[test]
    fn session_start_does_not_clobber_running_status() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1"); // Running
        t.on_session_start("s1"); // a late/duplicate SessionStart
        assert_eq!(t.snapshot()[0].session_status, SessionStatus::Running);
    }

    #[test]
    fn set_status_updates_session() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.set_status("s1", SessionStatus::Awaiting, None);
        assert_eq!(t.snapshot()[0].session_status, SessionStatus::Awaiting);
        t.set_status("s1", SessionStatus::Failed, Some("OOM".into()));
        let snap = t.snapshot();
        assert_eq!(snap[0].session_status, SessionStatus::Failed);
        assert_eq!(snap[0].failure_reason.as_deref(), Some("OOM"));
    }

    #[test]
    fn turn_elapsed_tracks_working_transition() {
        let t = ActivityTracker::new();
        t.mark("s1", 1);
        let snap = t.snapshot();
        assert!(snap[0].turn_elapsed_ms.is_some());
        assert!(snap[0].turn_elapsed_ms.unwrap() < 100);
    }

    #[test]
    fn register_with_branch_and_task() {
        let t = ActivityTracker::new();
        t.register(
            "s1",
            "claude",
            "Claude 1",
            None,
            Some("feat/auth"),
            Some("Fix login"),
        );
        let snap = t.snapshot();
        assert_eq!(snap[0].git_branch.as_deref(), Some("feat/auth"));
        assert_eq!(snap[0].task_description.as_deref(), Some("Fix login"));
    }

    #[test]
    fn default_status_is_idle_with_no_hooks() {
        let t = ActivityTracker::new();
        t.register("s1", "codex", "Codex 1", None, None, None);
        let snap = t.snapshot();
        assert_eq!(snap[0].session_status, SessionStatus::Idle);
        assert!(!snap[0].seen_hooks);
        assert_eq!(snap[0].turns, 0);
        assert_eq!(snap[0].tool_calls, 0);
        assert_eq!(snap[0].current_tool, None);
        assert_eq!(snap[0].last_outcome, None);
    }

    #[test]
    fn prompt_submit_counts_turn_and_runs() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1");
        let snap = t.snapshot();
        assert_eq!(snap[0].turns, 1);
        assert_eq!(snap[0].session_status, SessionStatus::Running);
        assert!(snap[0].seen_hooks);
        assert!(snap[0].turn_elapsed_ms.is_some());
    }

    #[test]
    fn pre_tool_sets_current_tool_then_post_tool_clears_to_thinking() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1");
        t.on_pre_tool("s1", Some("Bash"), Some("pnpm test"));
        let snap = t.snapshot();
        assert_eq!(snap[0].tool_calls, 1);
        assert_eq!(snap[0].current_tool.as_deref(), Some("Bash"));
        assert_eq!(snap[0].session_status, SessionStatus::Running);
        t.on_post_tool("s1", None);
        let snap = t.snapshot();
        assert_eq!(snap[0].current_tool, None); // thinking
        assert_eq!(snap[0].session_status, SessionStatus::Running);
        assert_eq!(snap[0].tool_calls, 1); // count is not decremented
    }

    #[test]
    fn turn_end_records_outcome_stops_timer_and_idles() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1");
        t.on_pre_tool("s1", Some("Edit"), Some("src/auth.ts"));
        t.on_turn_end("s1", 1_000, false, None);
        let snap = t.snapshot();
        assert_eq!(snap[0].last_outcome, Some(TurnOutcome::Completed));
        assert_eq!(snap[0].session_status, SessionStatus::Idle);
        assert_eq!(snap[0].current_tool, None);
        assert_eq!(snap[0].turn_elapsed_ms, None); // timer stopped
        assert!(snap[0].outcome_ms_ago.is_some());
    }

    #[test]
    fn failed_turn_records_failure_reason() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_turn_end("s1", 1_000, true, Some("boom".into()));
        let snap = t.snapshot();
        assert_eq!(snap[0].last_outcome, Some(TurnOutcome::Failed));
        assert_eq!(snap[0].session_status, SessionStatus::Failed);
        assert_eq!(snap[0].failure_reason.as_deref(), Some("boom"));
    }

    #[test]
    fn recent_tools_capture_arg_and_result_and_reset_per_turn() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1");
        t.on_pre_tool("s1", Some("Bash"), Some("pnpm test src/auth"));
        t.on_post_tool("s1", Some("✓ 4 passed"));
        t.on_pre_tool("s1", Some("Read"), Some("src/auth.ts"));
        let snap = t.snapshot();
        assert_eq!(snap[0].recent_tools.len(), 2);
        assert_eq!(snap[0].recent_tools[0].tool, "Bash");
        assert_eq!(
            snap[0].recent_tools[0].arg.as_deref(),
            Some("pnpm test src/auth")
        );
        assert_eq!(
            snap[0].recent_tools[0].result.as_deref(),
            Some("✓ 4 passed")
        );
        assert_eq!(snap[0].recent_tools[1].tool, "Read");
        assert_eq!(snap[0].recent_tools[1].result, None);
        // A new turn clears the buffer.
        t.on_prompt_submit("s1");
        assert!(t.snapshot()[0].recent_tools.is_empty());
    }

    #[test]
    fn recent_tools_cap_evicts_oldest() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_prompt_submit("s1");
        for i in 0..(RECENT_TOOLS_CAP + 3) {
            t.on_pre_tool("s1", Some("Bash"), Some(&format!("cmd {i}")));
        }
        let snap = t.snapshot();
        assert_eq!(snap[0].recent_tools.len(), RECENT_TOOLS_CAP);
        // Oldest evicted: first retained arg is "cmd 3".
        assert_eq!(snap[0].recent_tools[0].arg.as_deref(), Some("cmd 3"));
    }

    #[test]
    fn new_turn_clears_prior_outcome() {
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_turn_end("s1", 1_000, false, None);
        assert!(t.snapshot()[0].last_outcome.is_some());
        t.on_prompt_submit("s1");
        let snap = t.snapshot();
        assert_eq!(snap[0].last_outcome, None);
        assert_eq!(snap[0].turns, 1);
    }

    #[test]
    fn hooks_own_turn_timer_over_byte_flow() {
        // Once hooks are seen, a later byte transition must NOT reset the turn
        // timer (hooks own the boundary).
        let t = ActivityTracker::new();
        t.register("s1", "claude", "Claude 1", None, None, None);
        t.on_turn_end("s1", 1_000, false, None); // seen_hooks=true, timer cleared
        t.mark("s1", 10); // byte output after a finished turn
        assert_eq!(
            t.snapshot()[0].turn_elapsed_ms,
            None,
            "byte flow must not restart the turn timer for a hook-aware session"
        );
    }
}
