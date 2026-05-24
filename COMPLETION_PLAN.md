# CodeHub — Frontend/Backend completion plan

Status: **planning** · Created 2026-05-24 · Companion to [`BACKEND_PLAN.md`](./BACKEND_PLAN.md)

Goal: close the gap between the finished design (`design/project/screens/*.jsx`,
22 screens) and the shipped app, **without fabricating data**. Execution model:
a **parallel agent fleet** on isolated git worktrees, one per cluster, against a
frozen IPC contract.

---

## 1. Current reality (audit 2026-05-24)

Almost everything already exists and is wired. 49/49 IPC commands are backed by
real data; no screen ships fabricated data. The "incompleteness" is **fidelity
depth**, in two distinct categories:

| Category | Meaning | Unblock path |
|---|---|---|
| **FE-only** | UI section the design has, the port skipped. No new data needed. | Pure frontend port. |
| **BE-blocked** | UI deliberately omitted because backend captures no such data. Faking it violates the honesty contract (documented in code + BACKEND_PLAN.md). | Backend capture first, then wire. |

**Important update to BACKEND_PLAN.md:** the "big unlock" (per-turn token/cost
capture for Claude by reading `~/.claude/projects/**/*.jsonl` in-container) is
**already partially landed** — `claude_usage`, `claude_sessions`,
`claude_session_usage`, `claude_integrations`, `claude_agent_config` exist and
are real. So Claude-backed cost/turn/usage screens can be lit up NOW.

**Correction (2026-05-24 research): Codex ALSO has readable session files** — the
earlier "Codex has no readable session files → honest-thin" was wrong. Codex
writes `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<uuid>.jsonl` (in-container
`/root/.codex/...`, read via `docker exec cat` like Claude). Per-turn lines carry:
- `event_msg/token_count` → `payload.info.last_token_usage` (this turn's delta) +
  `total_token_usage` (cumulative), each split input/cached_input/output/
  reasoning_output/total. Cost derivable from a model×price table (same as Claude;
  cost is never on disk for any CLI).
- `event_msg/task_started`/`task_complete` → `turn_id`, `duration_ms`,
  `time_to_first_token_ms`, `model_context_window` (turn boundaries + timing).
- `turn_context` → per-turn `model` + `effort`.
- **`payload.rate_limits { primary/secondary: {used_percent, window_minutes,
  resets_at}, plan_type }`** — Codex is the ONE CLI that logs real quota/rate-window
  + plan data on disk, directly backing the Usage screen's Codex meters with NO
  billing API. (Claude assistant lines carry `service_tier` but no quota/window.)

So Codex → **real (file-read), near-Claude parity** for tokens/cost/turns/timing,
and uniquely real for rate-limit/plan meters. Only **Antigravity stays honest-thin**:
confirmed NOT installed in the runtime image (install line commented out in
`runtime/Dockerfile`, no `/root/.gemini` or `/root/.antigravity` dir) → nothing on
disk. Blocked on first fixing the install; honest-empty until then.

> Note: hooks (§7) and file-read are **complementary**, not either/or. Hooks give
> LIVE events (awaiting-input, turn boundary, done, edit) for the toast/bell/island;
> the jsonl/rollout files give the authoritative HISTORICAL token/cost/turn/rate
> totals. Wire both: hooks for liveness, file-read for accuracy.

### Completeness by screen (audit)

| Screen | Built file | % | Dominant gap kind |
|---|---|---|---|
| Hub A | App+hub/* + Grid + PaneHead | 65% | FE chrome + BE (toast, activity feed) |
| Hub B | hub/CompareGrid | 45% | FE (topbar, layout selector) |
| Workspace | screens/Workspace | 55% | FE (header bar, breadcrumb, search) |
| Settings | screens/Settings | 85% | FE + small BE (writes) |
| Agent settings | screens/AgentDetail | 45% | BE (writes) + FE sections |
| Integrations | screens/Integrations | 25% | BE (GitHub connector) |
| Platform | embedded in Settings | 100% | — (faithful, as a Settings tab) |
| Dashboard | screens/Dashboard | 45% | BE (per-session metrics, chart) |
| Usage | screens/Usage | 35% | BE (Claude real now; multi-account stays honest) |
| Container inspector | screens/ContainerInspector | 70% | Tier-3 multi-container (deferred) |
| Resume | screens/Resume | 55% | BE (cost/status/edits) + FE (actions) |
| Session detail | screens/SessionDetail | 60% | BE (budget) + FE (Files/Container tabs) |
| Spawn dialog | components/SpawnModal | 75% | FE + Tier-3 (container sizing, deferred) |
| Command palette | hub/CommandPalette | 55% | FE + BE (commands) |
| Shortcuts | hub/Shortcuts | 45% | FE (full grid, filter, print) |
| About | components/AboutDialog | 60% | FE + BE (updater, changelog) |
| Broadcast | hub/BroadcastModal | 35% | BE (compare columns) |
| Empty state | screens/EmptyState | 70% | FE (agent prose) |
| Live activities (island) | src-tauri/island.rs | 50% | FE (rich states) + BE (metrics) |
| Companion | screens/Companion | 20% | FE (full port — DECIDED IN SCOPE) |
| States | — | 30% | FE (no reusable gallery exists) |

### Missing primitives (FE-only, trivial)

`PaneTypeChip`, `CompanionAvatar`, `Character` (companion needs these), plus
utilities `KV` / `formatK`. `AppChrome` intentionally replaced by `AppShell`.

---

## 2. Decisions (locked with owner 2026-05-24)

1. **Data gaps → build real capture, in parallel.** Claude lights up for real
   (jsonl reader already exists, extend it). **Codex lights up for real too** via
   a new `~/.codex/sessions/**/rollout-*.jsonl` reader (per-turn token_count +
   rate_limits + plan_type + timing — see §1 correction). Only **Antigravity** is
   honest-thin (not installed → no data). Multi-account subscriptions (billing $,
   budgets, seats, RPM caps), multi-container fleet → remain deferred (Tier-3, no
   non-billing data source).
2. **Companion → full port** (avatar states, 6 character styles, radial menu,
   preferences). Largest FE-only item.
3. **Execution → parallel agent fleet** on isolated worktrees.
4. **Live agent state → via agent-native hooks, NOT TUI scraping.** Claude Code's
   `hooks` and Codex's `notify` emit structured events. We own the runtime image,
   so we bake a hook config that appends event JSON to a file CodeHub tails. This
   is robust + version-stable (scraping was the fragile thing we rejected). It
   delivers **awaiting-input, turn boundaries, done state, and edit counts as REAL
   live events** for Claude (Codex via `notify`, coarser). Antigravity → honest-thin.
   Unblocks: Hub awaiting-input toast + bell dot, island "approve" state, Dashboard
   attention queue, real-time per-turn edit/turn counts. See §7.
5. **Agent settings → display-only.** AgentDetail restores all design sections
   but as **read-only** displays of real on-disk Claude config. No writes to
   `~/.claude`. (No agent-config mutation in v1.)
6. **GitHub token → host env var, presence-only.** Matches the existing key
   model; never store/return the value. No secret-at-rest in config.

### Honesty contract (unchanged, binding)

- Never fabricate cost/turn/token/approval data. Absent → em-dash or honest empty
  state, never invented.
- Claude + Codex: real (jsonl / rollout files). Antigravity: "not installed / no
  readable usage" note until its install is unblocked.
- Multi-account / multi-container / team-billing (provider billing APIs): render
  "Coming soon", not faked. Codex's on-disk `rate_limits`/`plan_type` is the ONE
  exception that IS real (it's in the session file, not a billing API).

---

## 3. Parallel execution model

### 3.1 The conflict problem

Worktrees running concurrently collide on **shared files**:
`store.ts`, `ipc.ts`, `lib.rs`, `devserver.rs`, `bridge.ts`, `theme.css`,
`panes.css`, `catalog.ts`.

### 3.2 Solution — Phase 0 spike + contract freeze (sequential, BEFORE the fleet)

First run the hooks spike (§7.6) — its results pin down the agent-event contract.
Then one commit on the base branch front-loads every shared-file edit so the
fleet touches mostly its own component files:

- **`ipc.ts`**: add all new command signatures + TS interfaces (typed, real
  shapes). Frontend tracks code against these immediately; backend fills them in.
- **`store.ts`**: add new state slices + selector skeletons for each cluster
  (empty/default values), so tracks read existing selectors and only append
  actions inside clearly-delimited per-cluster regions.
- **`lib.rs`**: register the new `tauri::command` names (pointing at stub Rust
  fns that `Err("unimplemented")`), so the backend track only edits fn bodies.
- **`devserver.rs` + `bridge.ts`**: add the REST routes + command→REST mapping
  for every new command (four-point sync, per CLAUDE.md).
- **`theme.css` / `panes.css`**: add any new design tokens + empty class hooks.
- New primitive files: `PaneTypeChip.tsx`, `CompanionAvatar.tsx`, `Character.tsx`,
  `KV.tsx`, `format.ts` helper — created as stubs so imports resolve.

Output: `feat/completion-phase0-contract` PR. **Fleet branches from this commit.**

**STATUS — contract FROZEN (2026-05-24).** The new IPC surface is written + wired
four-point + `make check` green. Surface: 10 commands (`pending_prompts`,
`respond_prompt`, `session_activity_history`, `codex_usage`, `codex_sessions`,
`codex_session_usage`, `codex_rate_limits`, `github_status`, `github_repos`,
`check_update`) + event `codehub://agent-event` (+`onAgentEvent`/`onFocusSession`)
+ 12 typed interfaces in `ipc.ts`. Backend fns are honest-empty STUBS (return
empty/None/`connected:false`, NOT panics) commented for the BE track. Store has 8
new slices + load actions (not yet bootstrap-polled). New primitives:
`PaneTypeChip`/`CompanionAvatar`/`Character`/`KV` (+ existing `format.ts#formatK`).
Caveats for the fleet: `ratesAsOf` stub = `"unloaded"` sentinel until the real
rate table lands; `ActivityEvent` is intentionally a trimmed `AgentEvent` (no
`notificationType`/`toolName`) — BE extends if the feed needs them.

### 3.3 The fleet (7 tracks, each own worktree)

Each track = one specialized agent, isolated worktree, own branch, own PR. File
ownership chosen to minimize overlap.

| Track | Agent | Owns (writes) | Depends on |
|---|---|---|---|
| **BE** | rust-tokio-engineer | all `src-tauri/src/*.rs` bodies (+ new `events.rs`), `runtime/Dockerfile` hook config, Rust unit tests | Phase 0 contract + spike |
| **F-HUB** | claude (frontend) | `components/hub/{HubTabs,WorkspaceBar,HubStatusBar,ActivityRail,CompareGrid}`, `components/{Grid,PaneHead}`, `App.tsx` HubView | Phase 0; BE for toast/feed |
| **F-WORKSPACE** | claude | `screens/Workspace`, `components/hub/FilesBrowser` | Phase 0 |
| **F-DATA-A** | claude | `screens/{Dashboard,Usage}` | Phase 0; BE capture |
| **F-DATA-B** | claude | `screens/{Resume,SessionDetail,ContainerInspector}` | Phase 0; BE capture |
| **F-SETTINGS** | claude | `screens/{Settings,AgentDetail,Integrations}` | Phase 0; BE (GitHub) |
| **F-OVERLAYS** | claude | `components/{SpawnModal,AboutDialog}`, `components/hub/{CommandPalette,Shortcuts,BroadcastModal}`, `screens/{EmptyState,States(new)}` | Phase 0; BE (broadcast, updater) |
| **F-COMPANION** | claude + rust | `screens/Companion`, `components/primitives/{CompanionAvatar,Character}`, `src-tauri/src/island.rs`, `lib/overlay.ts` | Phase 0; BE (island metrics) |

**Dependency handling:** BE-blocked frontend work codes against the Phase-0
typed contract using the real shape (mock matching it where helpful), and
integrates when the BE track lands the data. Pure-FE parts never wait.

### 3.3.1 Waves (not all-at-once)

8 tracks run in **two waves** to bound review + rebase load.

**Wave 1 — produce data + build chrome/visuals** (5 parallel): `BE`, `F-HUB`,
`F-WORKSPACE`, `F-COMPANION`, `F-OVERLAYS`. These build full UI against the frozen
contract; the few BE-dependent bits (Hub toast/feed, broadcast compare, companion
metrics) use stub data and integrate after `BE` merges first within the wave.

**Wave 2 — data-display screens** (3 parallel, after `BE` merged): `F-DATA-A`,
`F-DATA-B`, `F-SETTINGS`. These are mostly tables/cards whose value depends on the
real data shape; building them after `BE` proves the shape avoids rework.

Rationale: `BE` is the only hard dependency. Putting it in Wave 1 and merging it
first means Wave 2 starts from a known-real contract, and Wave-1's own
BE-dependent bits rebase on merged `BE` without a cross-wave stall.

### 3.4 Merge order

`phase0` → **Wave 1**: `BE` → `F-HUB` → `F-WORKSPACE` → `F-OVERLAYS` →
`F-COMPANION` → **Wave 2**: `F-DATA-A` → `F-DATA-B` → `F-SETTINGS`. Each rebases
on the prior. `make check` green before each merge.

---

## 4. Per-track task lists

### Track BE — backend capture (Rust + runtime image)

Owns `src-tauri/src/*.rs` bodies + `runtime/Dockerfile` (hook config) + Rust tests.
The hooks subsystem (§7) is the centerpiece — it's the "big unlock" done robustly.

- [ ] **Agent-event hooks subsystem** (§7) — the unlock:
  - [ ] Bake Claude `hooks` + Codex `notify` config into the runtime image so each
        agent appends event JSON to `/tmp/codehub/events/<session>.jsonl`.
  - [ ] Tag events with the tmux session: `create_session` exports
        `CODEHUB_SESSION=<name>` into the pane; the hook script writes it on each line.
  - [ ] `events.rs`: a bollard `tail -F` exec that streams the event files, parses
        lines, updates an in-memory per-session state, emits `codehub://agent-event`.
  - [ ] `pending_prompts() -> PendingPrompt[]` — sessions currently awaiting input
        (Notification hook with a permission message; idle-notifications filtered out).
  - [ ] `respond_prompt(session, allow)` — `pty_write` the accept/deny keystroke to
        that pane (same transport as broadcast; it IS a simulated user keypress).
  - [ ] Live turn/edit counts from the event stream (`Stop` = turn end,
        `PreToolUse` = edit/run) — real-time, complementing the jsonl historical read.
- [ ] **Activity / turn history ring buffer** (FEASIBLE): record state transitions +
      hook events in `activity.rs`, expose `session_activity_history()`. Backs Hub
      ActivityRail feed + Dashboard chart.
- [ ] **Per-session turn + edit count (historical)** (FEASIBLE — Claude jsonl):
      backfill totals from `~/.claude/projects/**/*.jsonl`. Extend `claude_session_usage`.
- [ ] **Codex usage reader** (FEASIBLE — NEW, mirrors the Claude jsonl reader):
      parse `~/.codex/sessions/**/rollout-*.jsonl` (via `docker exec cat`, paths in
      `/root/.codex`). Extract per-turn `token_count` (last + cumulative, input/
      cached/output/reasoning split), `task_started/complete` timing, `turn_context`
      model. Derive cost from a model×price table. Generalize the existing
      Claude-only `*_usage` shapes into agent-agnostic `codex_usage` /
      `codex_sessions` / `codex_session_usage` (or a unified `agent_usage(cli)`).
      Unit-test the parser against a fixture line set (keys only, no content).
- [ ] **Codex rate-limit / plan meter** (FEASIBLE — NEW, unique on-disk quota data):
      from the latest `token_count` line's `payload.rate_limits` (primary/secondary
      `used_percent`/`window_minutes`/`resets_at`) + `plan_type`. Expose
      `codex_rate_limits() -> CodexRateLimits` to back the Usage screen's Codex
      meters WITHOUT any billing API. (No equivalent exists for Claude on disk.)
- [ ] **GitHub connector** (MEDIUM): PAT from **host env var** (e.g. `GITHUB_TOKEN`),
      presence-only surfaced (never the value, unit-tested like `agent_key_status`).
      `github_status()`, `github_repos()` via reqwest. Backs Integrations.
- [ ] **OS notifications** (FEASIBLE): `tauri-plugin-notification`, fire on hook
      `Notification`/`Stop` events. Backs island/companion cross-OS toasts.
- [ ] **Auto-updater** (FEASIBLE): `tauri-plugin-updater`, `check_update()`. Backs About.
- [ ] **NOT building** (decided): agent-settings writes (display-only); multi-account
      subscriptions; multi-container fleet (Tier-3).
- [ ] Image change → bump tag in `lib.rs`, rebuild via `make image` (runtime-rebuild skill).

### Track F-HUB

- [ ] HubTabs: split horizontal/vertical buttons. Bell with wait-colored dot
      (← `pending_prompts` / `codehub://agent-event`); Claude/Codex real, else off.
- [ ] ActivityRail: awaiting-input toast (Approve/Deny + A/D keys → `respond_prompt`,
      ← `pending_prompts`); turn-by-turn history feed (← `session_activity_history`).
- [ ] WorkspaceBar: fill ci/tests/lint/cpu/mem/cost where real (cpu/mem from
      `container_stats`; ci/tests/lint stay em-dash — no source; mark honestly).
- [ ] PaneHead: status badge (awaiting), terminal footer suggested-next (Claude
      only, from transcript), per-pane cost/turn/edits (← extended session usage).
- [ ] CompareGrid: topbar ("Comparing N sessions", 2×2 / 1×4 / 3+1 layout selector,
      search, new-agent, bell); focus outline; grid-mode HubStatusBar variant.

### Track F-WORKSPACE

- [ ] Session header bar: container id + repo/branch + cpu/mem (cost em-dash).
- [ ] Files pane: breadcrumb nav, search button, change-delta footer (+N −N from
      `container_git_status`), per-directory mod counts.
- [ ] PaneTypeChip: unified styled chip (AGENT/SHELL/FILES) across panes.

### Track F-DATA

- [ ] Dashboard: per-session metrics table (turn/tokens/cost — Claude **and Codex**
      real, Antigravity em-dash); activity chart (← history); attention queue
      (← `pending_prompts`, real for Claude/Codex); account breakdown (Claude+Codex
      real, honest).
- [ ] Usage: Claude **and Codex** usage cards real (token/cost/day from
      `claude_usage` / `codex_usage`); **Codex rate-window + plan meters real** (←
      `codex_rate_limits`, the one on-disk quota source); forecast text; CSV export;
      agent filter tabs. Claude rate-windows + all multi-account subscription/budget/
      seat/RPM data → "Coming soon" (provider billing API, deferred). Antigravity →
      "not installed".
- [ ] Resume: date grouping, per-session cost/edits/turn (Claude real), status rail,
      action buttons (Resume/Retry/Open transcript/Branch/Open diff — wire what exists).
- [ ] SessionDetail: Files + Container inspector tabs; diff footer (Stage/Commit/PR);
      context gauge + turn/cost/budget header (Claude real, em-dash else); status bar.
- [ ] ContainerInspector: keep single-runtime (multi-container deferred); add resource
      sparklines (← stats history). Fleet picker stays out.

### Track F-SETTINGS

- [ ] AgentDetail: restore full sections for Claude (accounts, providers, active
      model, skills, plugins, permission rules, auto behaviors) as **read-only display**
      of real on-disk config (no writes — decided). Codex/Antigravity honest
      "no readable config".
- [ ] Integrations: GitHub featured card (status, scope chips, repo list, action
      summary ← `github_*`, PAT from host env var presence-only); other code hosts /
      trackers / observability → "Coming soon".
- [ ] Settings: add-custom-agent (if BE), refresh-versions button, cost-budget
      (Claude), wire notifications toggles to `tauri-plugin-notification`.

### Track F-OVERLAYS

- [ ] SpawnModal: mount/env/network checkboxes (real flags); container sizing →
      "Coming soon" (Tier-3); cost estimate omitted (honest).
- [ ] CommandPalette: command group (broadcast, container restart, mute, transcript
      search — wire existing); repos group; session metadata.
- [ ] Shortcuts: full visible grid of REAL bindings; filter input; print button.
      (Do NOT list bindings for unbuilt features.)
- [ ] AboutDialog: update-available badge + install button (← updater); curated
      changelog; credits/license.
- [ ] BroadcastModal: side-by-side answer columns + per-agent header/metrics
      (Claude real via capture; others honest) + winner/promote. Now unblocked.
- [ ] EmptyState: full agent prose, per-card "Start with X" CTA.
- [ ] **States gallery (NEW)**: extract reusable loading/error/empty components
      (skeleton, CrashPane, ApiKeyError, RateLimited) from `states.jsx`; wire into
      route loaders/error boundaries. Build a dev-only `/__states` gallery.

### Track F-COMPANION (full port)

- [ ] Primitives: `CompanionAvatar` (status ring + bubble), `Character` (6 styles:
      glyph/sprite/face/orb/ascii/robot × expressions).
- [ ] Companion.tsx: all avatar states (idle/thinking/awaiting/done/failed/bubbles/
      dragging/docked); character picker; radial right-click menu (Jump/Approve/Mute/
      Dock/Settings/Hide); preferences panel.
- [ ] island.rs: rich states (idle/live/approve/done/error/split/multi/expanded) —
      "approve" state ← `pending_prompts`; expanded card with metric bars (Claude
      real); action buttons (Jump/View diff/Approve/Dismiss; Approve → `respond_prompt`).
- [ ] Metrics shown only where real (working/idle always; turn/token/cost Claude-only).

---

## 5. Cross-cutting (every PR — from MIGRATION.md)

- [ ] Both `.dark` + `.light` verified (screenshot in PR via `make dev-web` + playwright).
- [ ] Tabular nums on all numeric stats. No emojis in chrome. No reproduced logos.
- [ ] No fabricated data — em-dash / "Coming soon" / honest empty instead.
- [ ] `make check` green (Biome + tsc + rustfmt + clippy).
- [ ] Update four-point IPC sync if any new command (lib.rs / ipc.ts / devserver.rs / bridge.ts).

---

## 6. Resolved (2026-05-24)

1. **Live agent state** → agent-native hooks (Claude `hooks`, Codex `notify`), not
   TUI scraping. Real for Claude/Codex, honest-thin for Antigravity. See decision 4 + §7.
2. **Agent-settings writes** → display-only. See decision 5.
3. **GitHub PAT** → host env var, presence-only. See decision 6.

---

## 7. Hooks subsystem — architecture (the unlock)

Replaces fragile TUI scraping with the agents' own structured event mechanisms.
We control the runtime image, so we configure the hooks at image-build time.

### 7.1 Claude Code hooks

`~/.claude/settings.json` in the image gets a `hooks` block on these events
(verify exact names + stdin payload during the Phase-0 spike):

| Event | Meaning | Drives |
|---|---|---|
| `Notification` | needs permission / idle-waiting | awaiting-input toast, bell dot, island approve, attention queue |
| `Stop` | turn finished | done state, turn count, "done" notification |
| `PreToolUse` / `PostToolUse` | tool call (edit/run) | per-turn edit count |
| `UserPromptSubmit` | turn started | turn boundary |

Each hook command is a tiny script (baked in image) that reads the event JSON on
stdin and appends one line to `/tmp/codehub/events/$CODEHUB_SESSION.jsonl`,
stamped with the tmux session + a timestamp + the event kind.

⚠ `Notification` fires both for permission AND for 60s-idle. Distinguish via the
payload `message` field; if ambiguous, mark the prompt state honest-uncertain
rather than asserting "awaiting approval".

### 7.2 Codex

Codex `config.toml` `notify = [...]` runs a program on turn-complete / approval
events. Point it at the same append script. Coarser than Claude (no per-tool
granularity) but gives done + approval. Antigravity: no known mechanism → thin.

Note the division of labour for Codex: `notify` (hooks) → LIVE done/approval
events; the `rollout-*.jsonl` file (BE-track reader above) → authoritative
historical tokens/cost/turns/timing + the unique `rate_limits`/`plan_type`. The
rollout file is the richer source; `notify` is only for liveness the file can't
give in real time.

### 7.3 Session correlation

Hook events carry the agent's own session id, NOT the tmux name. To map them:
`create_session` exports `CODEHUB_SESSION=<tmux-name>` into the pane env before
launching the CLI; the hook script echoes `$CODEHUB_SESSION` on every line. Rust
keys state by tmux name (what the whole app already uses).

### 7.4 Transport (container → Rust)

A long-lived bollard exec runs `tail -F /tmp/codehub/events/*.jsonl` inside the
container; the Rust `events.rs` task parses each line, updates per-session state
on `PtyRegistry` (so the dev bridge gets it free, like `ActivityTracker`), and
emits `codehub://agent-event`. Falls back to honest-empty when the container is
down or the file doesn't exist yet.

### 7.5 New IPC surface (Phase-0 contract)

```ts
// event
"codehub://agent-event": { session: string; kind: "notification"|"stop"|"pre_tool"|"post_tool"|"prompt_submit"; message?: string; at: number }
// commands
pending_prompts(): PendingPrompt[]            // sessions awaiting input now
respond_prompt(session: string, allow: boolean): void   // pty_write accept/deny key
session_activity_history(session: string): ActivityEvent[]
```

### 7.6 Phase-0 spike — RESULTS (2026-05-24, claude-code 2.1.150)

Run against a throwaway claude install in the live container, `claude -p` with
`CODEHUB_SESSION` + isolated `CLAUDE_CONFIG_DIR`. No host auth token, so only the
no-auth events fired — but that proved the architecture.

**VERIFIED (empirical):**
- [x] **`CODEHUB_SESSION` reaches the hook process** — every captured line tagged
      with the exported value. §7.3 correlation mechanism confirmed.
- [x] **Hook command appending to a file works in-container** (§7.4 transport viable).
- [x] **Hook config format** — the `settings.json` `{hooks:{Event:[{hooks:[{type:
      "command",command}]}]}}` block loads from `CLAUDE_CONFIG_DIR`.
- [x] **`transcript_path` is delivered on every event** → direct jsonl pointer, no
      cwd-encoding guesswork. Path = `$CLAUDE_CONFIG_DIR/projects/<enc-cwd>/<uuid>.jsonl`
      (`/workspace`→`-workspace`). Image sets `CLAUDE_CONFIG_DIR=/config/claude` (mounted)
      → **Claude transcripts are host-readable; no `docker exec cat` needed for Claude.**
- [x] **Actual stdin shapes (current version, supersede the docs where they differ):**
  - `SessionStart`: `{session_id, transcript_path, cwd, hook_event_name, source}`
  - `UserPromptSubmit`: `{…, permission_mode, prompt}` — turn-start boundary
  - `StopFailure`: `{…, effort:{level}, error, last_assistant_message}` — **`error`
    NOT `error_type`; `last_assistant_message` NOT `error_message` (doc drift)**
  - `SessionEnd`: `{…, reason}` — **`reason` NOT `end_reason` (doc drift)**

**STILL UNVERIFIED (need a valid token + a real completed turn; doc shapes provisional):**
- [ ] `Stop` (success) — `{…, response}`. Turn-end on success.
- [ ] `Notification` `{…, notification_type, message}` — the keystone: a typed
      `notification_type:"permission_prompt"` is the awaiting-input signal (vs
      `idle_prompt`). NO message-parsing needed (resolves the §7.1 ⚠). Provisional
      until a real permission gate fires.
- [ ] `PreToolUse`/`PostToolUse` — `{…, tool_name, tool_input[, tool_response, tool_use_id]}`.
- [ ] Codex `notify` payload shape (not in public docs — pull from codex source;
      lower priority, rollout file is the real Codex data source).
- [ ] Accept/deny keystrokes per CLI for `respond_prompt`.

**Decision rule:** the frozen contract uses the VERIFIED field names above; the
unverified events ship with doc-provisional shapes behind the same `codehub://
agent-event` normalizer and are confirmed on first authed run. If a shape differs,
only the BE parser changes — the normalized event + IPC surface stay stable. Any
sub-feature whose source never materializes degrades to honest-empty.
