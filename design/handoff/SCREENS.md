# Screens index — source map + priority

Every screen in `design/screens/` + its real-code destination + status.
Updated to reflect the consolidated **Hub** section (entry → core surfaces
→ overlays → inspector → 15 state snapshots), the toggle-vs-spawn split in
the bottom action bar, and the **Containers → Workspaces** rename.

## Hub (the home surface) — Phase 3

The hub is now ONE screen with many state variations. `main-hub-a.jsx` is
the canonical layout; `hub-states.jsx` carries 15 condition snapshots that
share a `<HubFrame>` chrome. Read both before porting.

| Screen file | Description | Destination | Notes |
|---|---|---|---|
| `welcome.jsx` | **Workspace launcher.** Pinned + recent workspace cards + start-new templates. First screen when no workspace is open. | `src/routes/welcome/page.tsx` | Pure presentational, driven by workspaces store. |
| `new-workspace.jsx` | 3-step wizard (repos → container → first agent). | `src/routes/welcome/new/page.tsx` | Shares form patterns with the spawn dialog. |
| `main-hub-a.jsx` | **The home view.** Workspace tabs (1 container = 1 workspace) + groups bar + recursive split pane grid + meta strip + bottom action bar + status bar + activity rail. | `src/routes/hub/page.tsx` | The largest port. Touches tmux + Docker + agent supervision. The bottom action bar holds: Files/Shell/Diff toggles + `SpawnSplitBtn` (split-button: `+ New agent ⌘N` with placement-menu chevron). Files/Shell/Diff are **workspace-level toggle panes**, NOT spawned agents — at most one of each visible. |
| `hub-states.jsx` | **15 state snapshots of the hub shell.** Each composes a shared `<HubFrame>` with a different body. Covers: empty workspace, empty inner group, spawning agent, files docked, shell docked, diff docked, awaiting approvals, saturated split, focus, tab overflow, drag-in-progress, group full, workspace offline, no workspace, heavy load. | Decompose: `<HubFrame>` → `src/components/chrome/HubFrame.tsx`; each state body becomes either a real route or an inline conditional render inside the main hub. | Read this file before porting the main hub — it documents every chrome variation the real implementation must support. `<MetaStrip>`, `<ActionBar>`, `<StatusBar>`, `<HubBanner>`, `<StaticTabBar>` are the chrome contract. |
| `workspace.jsx` | Older 3-pane prototype (files + agent + shell). Retained for reference; the canonical layout is now `main-hub-a.jsx` + `hub-states.jsx`. | Skip; use `main-hub-a` as the destination model. | Treat as legacy. Do not port wholesale. |
| `resume.jsx` | **Resume drawer** docked to the side of the main hub. Past agent sessions grouped by agent (Claude / Codex / Antigravity). Toggled via the Resume button in the hub's action bar (⌘R). | `src/components/drawers/ResumeDrawer.tsx` mounted inside the hub route. | Per-agent, not per-workspace — drawer overlays the current workspace. Backed by tmux scrollback + agent context snapshot DB. |
| `session-detail.jsx` | **Diff inspector.** Single-agent focused view, full-width unified diff with the changed-files rail inline. No tabs (Files/Logs/Container are workspace toggles, not session tabs). Uses `<HubFrame>` so chrome matches every other hub-derived screen. | `src/routes/session/[id]/page.tsx` | Use `react-diff-view` or similar. Stage hunk / commit / open PR are the only footer actions. |

## Overlays + dialogs — Phase 2 / 4

| Screen file | Description | Destination | Notes |
|---|---|---|---|
| `spawn-dialog.jsx` | Modal: agent + account + repo + container + initial prompt. Triggered globally by `⌘N` when no specific pane is in focus. | `src/components/dialogs/SpawnDialog.tsx` | shadcn `<Dialog>`. The **in-hub** "New agent" flow is the spawning pane state (`hub-states.jsx` → `HubStateSpawning`); the modal is the keyboard-driven fallback. |
| `command-palette.jsx` | `⌘K` palette: sessions / spawn / commands / repos. | `src/components/CommandPalette.tsx` | shadcn `<CommandDialog>`. |
| `shortcuts.jsx` | Keyboard cheat sheet modal. `?` opens. **Source of truth** for every binding (incl. `⌘\` split, `⌘E` files, `⌘⇧B` shell, `⌘D` diff, `⌘R` resume, `⌘A` new agent, `⌘N` spawn, `⌘G` new group, `⌘⇧T` new tab). | `src/components/dialogs/ShortcutsDialog.tsx` | Cross-check every binding listed here when porting. |
| `about.jsx` | Version + update + env + changelog. | `src/components/dialogs/AboutDialog.tsx` | Wired to `tauri-plugin-updater`. |

## Ops surfaces — Phase 4

| Screen file | Description | Destination | Notes |
|---|---|---|---|
| `dashboard.jsx` | At-a-glance status. Metric tiles + sessions table + attention queue + activity chart + accounts + workspaces (CPU/mem bars). | `src/routes/dashboard/page.tsx` | Recharts via shadcn `<ChartContainer>`. The right-rail widget is **Workspaces** (formerly "Containers"); the bars themselves still display the container IDs because those describe the runtime layer underneath each workspace. |
| `usage.jsx` | Per-account subscription detail + forecasts. | `src/routes/usage/page.tsx` | Real subscription introspection needed per provider. |
| `container-inspector.jsx` | **Workspaces inspector** — runtime detail per workspace (specs, env, mounts, logs, network, attached agents). One container per workspace. Sidebar item name is **Workspaces**, not Containers. File kept its old name for legacy file path stability. | `src/routes/workspaces/[id]/page.tsx` | Wire to `bollard` (Rust). |
| `integrations.jsx` | GitHub (PAT) + other code hosts + trackers + observability. | `src/routes/settings/integrations/page.tsx` | Use `octokit` for GitHub REST. |
| `settings.jsx` | General settings shell with sectioned nav. | `src/routes/settings/page.tsx` | Lands first in Phase 2. Validates form patterns. |
| `agent-settings.jsx` | Per-agent: accounts, model providers (incl. MiniMax/GLM/Qwen), MCP servers, sub-agents, skills, plugins, permission rules, auto behaviors. | `src/routes/settings/agents/[id]/page.tsx` | Massive — split into sections, each a separate component. |
| `platform.jsx` | Desktop-vs-web feature matrix. | `src/routes/settings/platform/page.tsx` | Reference doc, low-priority. |

## Onboarding + notifications — Phase 2 / 5

| Screen file | Description | Destination | Notes |
|---|---|---|---|
| `empty-state.jsx` | First-run hero + 3 agent cards + setup checklist. | `src/routes/onboarding/page.tsx` | Lands second in Phase 2. |
| `states.jsx` | Loading/error/empty/rate-limited reference (pane-level). | Decompose into reusable components inside each route's loader/error boundary. | Reference for designers/devs. |
| `live-activities.jsx` | Dynamic island states + cross-OS notifications reference. | Two destinations: islands → separate WebviewWindow at `src/island/`. Notification toasts → fed to OS via `tauri-plugin-notification`. | Tauri-specific (Phase 5). |
| `companion.jsx` | Floating puck + 6 character styles + radial menu + preferences. | Separate WebviewWindow at `src/companion/`. | Tauri-specific (Phase 5). |

## Quick reference — what triggers what

| User action | Opens / toggles |
|---|---|
| Launch app, no workspaces | `welcome` |
| `⌘N` | `spawn-dialog` (global) |
| `⌘A` inside a workspace | spawning agent state (`hub-states.jsx → HubStateSpawning`) |
| `⌘K` | `command-palette` |
| `?` | `shortcuts` |
| Click workspace tab | `main-hub` for that workspace |
| Right-click agent pane → Open detail | `session-detail` (diff inspector) |
| Click Workspaces in sidebar | `container-inspector` (renamed surface) |
| Click Dashboard / Usage in sidebar | `dashboard` / `usage` |
| `⌘R` in hub | toggles `Resume` drawer |
| `⌘E` / `⌘⇧B` / `⌘D` in hub | toggle Files / Shell / Diff docked panel (one instance each per workspace) |
| `⌘\` / `⌘⇧\` | split focused pane right / down |
| `⌘G` | new group in current workspace |
| `⌘⇧T` | new workspace tab |
| `⌘,` | `settings` |
| About menu → About CodeHub | `about` |
| Agent fires event when not focused | `island` (overlay window) |
| Drag companion from tray | `companion` (overlay window) |

## What was removed (don't look for these)

- **`main-hub-b.jsx`** — the old 2×2 compare grid. Hub flexibility lives inside `main-hub-a`'s recursive split (`WorkspaceArea`); the activity rail can be toggled off via Tweaks to get the hub-b look.
- **`broadcast.jsx`** — fan-out prompt to N agents. Over-engineered for v1; cut entirely. Use parallel agents in split panes instead.
- **Compare mode** — was a button in the bottom action bar with its own state; removed because the same outcome ships via side-by-side split panes.
- **Standalone Split right / Split down icon buttons** — folded into `SpawnSplitBtn`'s placement menu so there is one CTA for "add agent here".
- **"Agent" chip on the left of the action bar** — duplicated `SpawnSplitBtn`; Files/Shell/Diff are the only utility toggles now.
- **"ADD PANE" label** — removed; the button icons + tooltips speak for themselves.
