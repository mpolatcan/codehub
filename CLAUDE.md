# CodeHub — Repository Guide for Claude

A Tauri 2 desktop app that runs multiple AI coding CLIs (Claude Code, Codex, Antigravity) in Docker containers, multiplexed via tmux. Each tab in the window = one tmux session = one agent. Each workspace gets its own container (`codehub-ws-<key>`) so the hub's fleet view reports REAL per-workspace cpu/mem/net/state.

This file is loaded on every Claude session in this repo. Keep it short and load-bearing.

## Behavioral rules

1. **Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them — don't pick silently. If something is unclear, stop and ask. Push back when a simpler approach exists.
2. **Simplicity first.** Minimum code that solves the problem. No features beyond what was asked. No abstractions for single-use code. No speculative "flexibility". If 200 lines could be 50, rewrite it.
3. **Surgical changes.** Touch only what you must. Don't "improve" adjacent code, comments, or formatting. Match existing style. Remove imports/variables YOUR changes made unused — don't remove pre-existing dead code unless asked. Every changed line should trace to the user's request.
4. **Goal-driven execution.** Transform tasks into verifiable goals. For multi-step tasks, state a brief plan with checkpoints. Build → verify → iterate, not build-everything-then-check.

## Stack

- **Backend**: Rust 1.85+, Tauri 2, tokio, bollard (Docker API client), futures-util.
- **Frontend**: React 19 + TypeScript, Vite 5, Zustand 5 (state), Tailwind v4 + shadcn/Radix (Dialog + Popover) for chrome, xterm.js 5 (+ fit + webgl addons) for the terminal panes. xterm panes live OUTSIDE React in a non-reactive registry (`src/app/lib/panes.ts`) — `<PaneMount>` reparents the DOM node so buffers survive splits and tab switches.
- **Runtime image**: Debian-based `node:20-slim` base, `tail -f /dev/null` entrypoint, tmux server spawned on demand.
- **OS support**: macOS primary, Linux secondary, Windows untested.

## Repo layout

```
codehub/
  index.html                # React entry (#root) + SVG bird sprite
  src/                      # Frontend
    terminal.ts             # xterm.js pane factory + theme (framework-agnostic)
    vite-env.d.ts
    app/                    # React app
      main.tsx              # StrictMode render; imports theme.css then panes.css
      App.tsx               # Layout shell; wires lifecycle + keyboard shortcuts
      theme.css             # Tailwind @import + @theme token bridge
      tokens.css            # Design tokens: 3 themes (dark/gray/light), status
                            #   colors, agent accents, shadcn bridge, helper classes
      panes.css             # Structural CSS (splits, panes, rail, tabs, launcher)
      screens/              # Full-page views (15 screens):
                            #   Dashboard, Settings, Usage, Welcome, NewWorkspace,
                            #   SessionDetail, ContainerInspector, AgentDetail,
                            #   Integrations (Settings sub-pane), Companion,
                            #   EmptyState, Resume, SpawnDialog, LiveActivities,
                            #   States
      components/           # Three subdirectories:
                            #   hub/ — HubSidebar, HubTabs, HubStatusBar, Grid,
                            #     PaneHead, PaneMount, ActivityRail, DiffViewer,
                            #     DiffBody, FilesBrowser, ActionBar, CommandPalette,
                            #     Shortcuts, GroupsBar, WorkspaceBar, RuntimeBanner
                            #   primitives/ — AgentGlyph, StatusDot, StatusBadge,
                            #     CompanionAvatar, Character, Logo, Tag, Segmented,
                            #     icons, IconBtn, Spark, MetricStat, ContextGauge
                            #   ui/ — shadcn primitives (Button, Dialog, Popover, etc.)
      hooks/                # useKeyboard, useContainerStatus, useSessionUsage,
                            #   useBurnRate, useActivityPoll, useGitStatusPoll
      lib/                  # store.ts (Zustand main), overlay.ts (Zustand panels/
                            #   modals/grid), panes.ts (registry), tree.ts (split
                            #   layout), catalog.ts (CLIS/MODES), launcher.ts,
                            #   ipc.ts (typed Tauri boundary), bridge.ts (browser-mode
                            #   transport: Tauri IPC vs dev-server REST/WS),
                            #   theme.ts (dark/gray/light toggle + persistence)
  src-tauri/                # Rust backend (workspace ROOT = the app crate)
    Cargo.toml              # [workspace] root + app package `codehub`
    tauri.conf.json
    capabilities/default.json
    devserver/              # Dev-bridge bin crate (workspace member, NOT bundled)
      Cargo.toml            #   pkg `codehub-devserver`; deps on `codehub` w/ feature
      src/main.rs           #   thin entry → codehub_lib::devserver::serve()
    src/
      main.rs               # Tiny entry, calls codehub_lib::run()
      lib.rs                # Tauri commands + setup hook
      manager.rs            # LifecycleManager — per-workspace container
                            #   resolution (codehub-ws-<key>); fleet listing
      lifecycle.rs          # Image pull, container create/start/stop
      docker.rs             # tmux session ops + exec attach
      pty.rs                # PtyRegistry — pane stream pumps (PaneEmitter trait)
      events.rs             # Agent-event hook tailer: one bollard-exec tailer per
                            #   running container, dedup replay cursor, EventsTracker
      activity.rs           # Activity ring buffer + pending-prompt tracking
      config.rs             # Settings / agent-config persistence store
      island.rs             # macOS Dynamic Island companion (objc2/AppKit NSPanel)
      types.rs              # Shared IPC types
      devserver.rs          # Dev-only HTTP/WS bridge logic (feature `devserver`)
  runtime/
    Dockerfile              # Runtime image (CLIs + tmux)
    README.md               # Build + publish instructions
  design/                   # Design canvas (JSX reference screens, not imported)
  .claude/skills/           # Workflow skills (see below)
  TEST_SCENARIOS.md         # Manual verification matrix
```

## How sessions work end-to-end

1. User opens the new-tab Popover (or ⌘T / a split control → Launcher Dialog) → picks CLI × mode → store `newPlate`/`splitSession` → `invoke("create_session", { name, cli, mode, workspace })` → backend resolves the target container via `LifecycleManager` (ensuring `codehub-ws-<key>` exists) → `docker.create_tmux_session` → `docker exec codehub-ws-<key> tmux -S /tmp/codehub new-session -d -s <name> <cli-binary>`.
2. `invoke("attach_session", { name, cols, rows })` → backend `docker.attach_exec` opens a bollard exec with `tty=true` running `tmux attach -t <name>` → returns a `pane_id`.
3. Backend spawns two tokio tasks per pane: output pump (bollard stream → `pty://data/<pane_id>` event) and input pump (mpsc channel → bollard stdin).
4. Frontend `xterm.term.onData` → `invoke("pty_write", ...)`, `term.onResize` → `invoke("pty_resize", ...)`.
5. Closing a session (store `closeSession`, also reachable via ⌘W) calls `kill_session(name)` BEFORE `registry.destroyPane(name)` (which detaches the bollard exec). tmux is killed first so no resize/write can race a dying pane. This order regressed before — guard it (TEST_SCENARIOS S3/S5/S7/S8).

## Local dev

A `Makefile` at repo root is the canonical entry point. Run `make help` for the full list.

```bash
# One-time
source ~/.cargo/env                                 # cargo on PATH (also in ~/.zshrc)
make install                                         # npm deps; cargo fetches on first build
make image                                           # build runtime image at the tag pinned in lib.rs

# Day-to-day
make dev                                             # Vite + Tauri, hot-reloads frontend
make dev-web                                          # Vite + standalone backend bridge, NO Tauri window
                                                     #   → drive the UI in a plain browser at :1420 with a
                                                     #   live backend (visual review / playwright screenshots)
make check                                           # Full lint sweep (Biome + tsc + rustfmt + clippy)
make fix                                             # Apply all safe auto-fixes, then re-check
make image-verify                                    # Smoke-test installed CLIs in the runtime image
```

CI mirrors `make check` (see `.github/workflows/ci.yml`). Don't introduce checks locally that CI doesn't enforce, and vice versa.

Environment knobs:

| Env var | Purpose | Default |
|---|---|---|
| `CODEHUB_IMAGE` | Image tag | `ghcr.io/mpolatcan/codehub-runtime:0.1.3` |
| `CODEHUB_NETWORK_MODE` | Docker network mode | `bridge` |
| `CLAUDE_CODE_OAUTH_TOKEN` | Skip /login in Claude Code | unset |

## Conventions

- **Don't add dependencies casually.** Each Rust crate or npm package counts as a cold-start cost.
- **Frontend state is a single Zustand store** in `src/app/lib/store.ts` (workspaces, session metadata, container status). Two satellite stores exist: `lib/overlay.ts` (docked panels, modals, grid drag state) and `lib/launcher.ts` (spawn modal context). Don't reach for Redux/Context — extend the existing stores.
- **xterm panes are never disposed except by `closeSession`.** They live in the `lib/panes.ts` registry and get reparented by `<PaneMount>`; disposing on unmount would wipe scrollback on every split/tab-switch.
- **Tauri commands return `Result<T, String>`.** Coerce backend errors with `.map_err(|e| e.to_string())`. Don't leak typed errors across the IPC boundary.
- **Three themes: dark (default), gray, light.** Tokens live in `tokens.css` (`--bg-*`, `--fg-*`, `--live`, `--wait`, etc.), bridged to Tailwind in `theme.css`. Theme is toggled via `lib/theme.ts` (localStorage-persisted, `<html>` class swap). Never inline raw hex values; use tokens.
- **Full-page views live in `screens/`** (15 files). For the frontend map, start at `store.ts` (state) + `App.tsx` (routing). The screens directory is the equivalent of a router — `App.tsx` conditionally renders each based on `view` state. Sidebar nav: Hub, Dashboard, Workspaces, Usage, Settings (Integrations lives inside Settings, not as a top-level view).
- **CTA naming convention**: "New workspace" always opens the workspace wizard (`setNewWorkspace`). "New agent" / "Add agent" always opens the spawn dialog (`openLaunch`). Never use "New workspace" for something that spawns an agent. The tab bar "+" opens the workspace wizard; the action bar "New agent ⌘A" opens the spawn dialog.
- **Workspace close confirmation**: closing a workspace tab shows a `confirmCloseWorkspace` dialog that counts working agents. The container persists after close — user can stop it from the Workspaces view.
- **Bird silhouettes go in the SVG sprite** in `index.html`. Reference via `<use href="#bird-foo"/>`. Don't inline new SVGs per-tab.
- **CLIs are enumerated in four places** (kept deliberately in sync): `Cli` enum in `docker.rs`, `Cli` type in `src/app/lib/ipc.ts`, `CLIS` + `MODE_SUPPORT` in `src/app/lib/catalog.ts`, and the `RUN` line in `runtime/Dockerfile`. The `add-cli` skill walks the full update.
- **Never commit `Cargo.lock`** — wait, scratch that: do commit `Cargo.lock`. CodeHub is an application binary, not a library, so the lock is part of the build contract.
- **Don't commit `dist/`** — it's a Vite build artifact. `src-tauri/target/` and `node_modules/` are also gitignored.

## Gotchas / non-obvious things

- **The `make dev-web` Rust bridge (`codehub-devserver`) is a SEPARATELY compiled binary.** When it is already running and you edit a Rust struct that crosses IPC (e.g. `AgentConfig`, `Settings`), the live bridge keeps serving the OLD shape — serde silently drops unknown fields — so browser-mode verification shows stale/empty data even though the code is right. Rebuild + restart the bridge (`cargo run -p codehub-devserver` recompiles on launch) after any backend struct change before trusting a `make dev-web` check.
- **SPA hash routes (`#/companion`, dev `#/__states` etc.) need a FULL page reload to switch.** `src/app/main.tsx` reads `window.location.hash` exactly once at module load to pick the root. Navigating via Playwright `goto …#/companion` (or any in-page hash change) does NOT re-render — you keep seeing the previous view. Force `window.location.reload()` after setting the hash when driving these routes for visual checks.
- **The app crate (`src-tauri/Cargo.toml`) must have exactly ONE binary, and the dev bridge lives in a separate workspace member (`src-tauri/devserver/`).** Tauri's bundler enumerates *every* bin target of the package being built — both `[[bin]]` entries AND every file under `src/bin/` — and tries to copy each into the bundle, **ignoring `required-features`**. A feature-gated dev bin inside the app package therefore breaks `tauri build` ("Failed to copy binary … `release/devserver` does not exist"), even though it's never compiled. So the bridge is its own crate, run with `cargo run -p codehub-devserver` (no `--features` flag — the member enables the `devserver` feature on its `codehub` path-dep). Don't add a second `[[bin]]` or any `src/bin/*.rs` to the app crate; add a workspace member instead. (This bit us on the v0.1.1 release — v0.1.0 shipped fine because it had a single binary.)
- **`tauri::generate_context!` macro reads `tauri.conf.json` at compile time** and validates icon paths + `frontendDist`. If `dist/` is missing, `cargo check` fails with a proc-macro panic. Either run `npm run build` once, or keep the gitignored placeholder. Avoid this trap when running CI.
- **Bollard `create_exec` requires explicit type annotation** in our codebase: `create_exec::<String>(...)`. Without it the compiler cannot infer `T: Into<String>`.
- **`SHELL ["bash", "-euo", "pipefail", "-c"]` is set in the runtime Dockerfile.** This matters because we use `curl ... | bash` patterns to install CLIs; without pipefail, a failing curl silently succeeds and the CLI is missing from the image. Do not remove it.
- **macOS Docker Desktop "host network" is gated behind a beta flag.** We default `CODEHUB_NETWORK_MODE=bridge` to keep things portable. Override to `host` only if the user has Docker Desktop 4.34+ with the beta enabled.
- **Every container's entrypoint is `tail -f /dev/null`.** It does NOT launch tmux. The tmux server is started by the first `docker exec ... tmux new-session ...` call, per container. Sessions share `TMUX_TMPDIR=/tmp/codehub` *within a container*; with per-workspace containers (default) each workspace runs its OWN tmux server, so `tmux ls` only lists that workspace's sessions — verify lifecycle (S3/S5/S7/S8) against the specific `codehub-ws-<key>` container, not globally. A container persists running-but-empty after its last tab closes (lifecycle is decoupled from sessions; prune via the Workspaces inspector).
- **The in-pane tmux status bar is themed via `runtime/tmux.conf`** (COPYed to `/root/.tmux.conf`, loaded on tmux server start). It restyles tmux's default green to CodeHub's palette (`bg=#171b22` panel, neutral `#ecedf0` wordmark) so the bar reads as app chrome. Changing it needs an image rebuild (`make image`); to preview on a live container without a rebuild: `docker cp runtime/tmux.conf <container>:/root/.tmux.conf && docker exec -e TMUX_TMPDIR=/tmp/codehub <container> tmux source-file /root/.tmux.conf` (replace `<container>` with the workspace container name, e.g. `codehub-ws-...`). Keep the hexes in sync with the design tokens in `tokens.css` (`--bg-*`/`--fg-*`); xterm's own ANSI palette mirrors the same tokens in `src/terminal.ts` (sRGB conversions of the oklch accents).
- **The webview drag region** is set via `-webkit-app-region: drag` on the masthead and tabbar (React sets it through the `WebkitAppRegion` style prop). Buttons inside those regions must reset with `WebkitAppRegion: "no-drag"` or clicks get captured by window-drag.
- **Antigravity install URL is unverified** (`antigravity.google/cli/install.sh` returned an SSL self-signed cert chain error during build). The line is commented out in `runtime/Dockerfile`, and `catalog.ts` `MODE_SUPPORT` caps Antigravity to Standard only. Until confirmed, selecting Antigravity spawns a tmux session that exits immediately.
- **xterm panes mount via `absolute inset-0`, never flexbox.** `.pane-body` is `position:relative; flex:1` but NOT `display:flex`; a `flex-1` slot collapses to height 0 and the absolutely-positioned `.term-surface` renders blank. `<PaneMount>` fills the slot with `absolute inset-0` + a `ResizeObserver` that re-fits on resize (there is no window-level resize handler — the observer is it).
- **Global keyboard shortcuts (`useKeyboard`) attach at the capture phase** so they beat xterm's textarea handler. Don't switch to bubble phase, and don't blanket-skip on `TEXTAREA` — xterm's helper IS a textarea, so the rename-input guard keys off the `.pane-name-input` class instead.
- **Spawn background tasks in the Tauri `setup` hook with `tauri::async_runtime::spawn`, NOT `tokio::spawn`.** `setup` runs on the main thread with no entered tokio runtime, so a bare `tokio::spawn` panics (`there is no reactor running`) — and because it unwinds across the Obj-C `did_finish_launching` boundary, the process *aborts* instead of erroring. Code shared with the dev bridge (which runs under `#[tokio::main]`, where `tokio::spawn` is valid) must not bake in the spawner: expose the loop as a plain `async fn` and let each caller spawn on its own runtime (see `events::event_tailer_loop` + its two call sites). This shipped as a latent startup crash because the subsystem had only ever run via `make dev-web`, never a real Tauri launch.
- **The agent-event tailer (`events.rs`) keys strictly by container ID, never name.** Agents append JSON lines to `/tmp/codehub/events/<session>.jsonl` (container-LOCAL, NOT mounted — that's why per-workspace containers each need their own tailer). The reconciler runs one bollard-exec `tail` per running container, re-scanning every 5s, and a per-container/per-session replay cursor de-dups the full-file replays that `tail -n +1 -F` re-emits on every (re)attach. Key the cursor by container **ID** (not name): a recreate (new id, fresh `/tmp`) then drops the stale cursor instead of suppressing fresh events, and an old tailer can't exec into a same-name replacement. Don't reintroduce a name fallback — it replays from line 1 on the first id flip (this regressed four times; see PR #64).

## Frontend work

Frontend design, skills, and token rules live in their own file:

@.claude/rules/frontend.md

## Testing posture

Testing + visual-verification rules live in their own file, imported here:

@.claude/rules/testing.md

Short version: no automated IPC suite — run `TEST_SCENARIOS.md` before a release (guard S3/S5/S7/S8); any UI change MUST be visually verified via `make dev-web` + Playwright, never inference.

## When in doubt

- Prefer reading `src-tauri/src/lib.rs` first for the backend — it lists every Tauri command and is the cleanest map of how the app is glued together. For the frontend, `src/app/lib/store.ts` is the equivalent map (every state mutation + the IPC calls each one fires).
- If a backend change requires a new IPC command, it now has a **four-point sync** (the dev bridge mirrors the IPC surface): the `tauri::generate_handler![...]` list in `lib.rs:run()`, the typed `ipc` object in `src/app/lib/ipc.ts`, a REST route in `src-tauri/src/devserver.rs`, and its command→REST mapping in `src/app/lib/bridge.ts`. Skip the last two only if you never need browser-mode (`make dev-web`).
- If a frontend file fails to type-check after a CSS import, ensure `src/vite-env.d.ts` declares the module.
