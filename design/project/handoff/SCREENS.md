# Screens index — source map + priority

Every screen in `design/screens/` + its real-code destination + status.

| Screen file | Description | Destination | Phase | Notes |
|---|---|---|---|---|
| `main-hub-a.jsx` | **The home view.** Workspace tabs (group of agents per container) + per-pane meta headers (each pane has its own ContextGauge + MetricStat row) + activity rail. | `src/routes/hub/page.tsx` | 3 | Largest port. Touches tmux + docker + agent supervision. Preserve all runtime state hookups. |
| `main-hub-b.jsx` | 2×2 grid for comparing agents side-by-side. | `src/routes/hub/grid.tsx` | 4 | Secondary layout, toggle from Hub A. |
| `workspace.jsx` | 3-pane: files + agent + plain bash shell. PaneTypeChip switches a pane's mode. | `src/routes/hub/workspace.tsx` | 4 | Files pane reads container fs via Rust IPC. |
| `broadcast.jsx` | One prompt → N agents in parallel; pick a winner. | `src/routes/broadcast/page.tsx` | 5 | Stretch goal; ship after main hub. |
| `spawn-dialog.jsx` | Modal: agent + account + repo + container + initial prompt. | `src/components/dialogs/SpawnDialog.tsx` | 2 | Triggered by `⌘N` from anywhere. |
| `command-palette.jsx` | `⌘K` palette: sessions / spawn / commands / repos. | `src/components/CommandPalette.tsx` | 4 | shadcn `<CommandDialog>`. |
| `session-detail.jsx` | Single-session focus view with terminal + tabbed inspector (Diff/Files/Logs/Container). | `src/routes/session/[id]/page.tsx` | 4 | Diff renderer — pull `react-diff-view` or similar. |
| `dashboard.jsx` | At-a-glance status. Metric tiles + sessions table + attention queue + activity chart + accounts. | `src/routes/dashboard/page.tsx` | 4 | Recharts for the chart via shadcn `<ChartContainer>`. |
| `usage.jsx` | Per-account subscription detail + forecasts. | `src/routes/usage/page.tsx` | 4 | Real subscription introspection needed per provider. |
| `container-inspector.jsx` | Docker container detail with multi-session attachment. | `src/routes/containers/[id]/page.tsx` | 4 | Wire to `bollard` (Rust). |
| `resume.jsx` | Past sessions library. Branch from a turn, retry, open transcript. | `src/routes/resume/page.tsx` | 4 | Backed by tmux scrollback + agent context snapshot DB. |
| `settings.jsx` | General settings shell with sectioned nav. | `src/routes/settings/page.tsx` | 2 | Lands first. Validates form patterns. |
| `agent-settings.jsx` | Per-agent: accounts, model providers (incl. MiniMax/GLM/Qwen), MCP servers, sub-agents, skills, plugins, permission rules, auto behaviors. | `src/routes/settings/agents/[id]/page.tsx` | 4 | Massive screen — split into sections, each a separate component. |
| `integrations.jsx` | GitHub (PAT) + other code hosts + trackers + observability. | `src/routes/settings/integrations/page.tsx` | 4 | Use `octokit` for GitHub REST. |
| `platform.jsx` | Desktop-vs-web feature matrix. | `src/routes/settings/platform/page.tsx` | 6 | Reference doc, low-priority. |
| `shortcuts.jsx` | Keyboard cheat sheet modal. `?` opens. | `src/components/dialogs/ShortcutsDialog.tsx` | 4 | Source of truth for every binding. |
| `empty-state.jsx` | First-run hero + 3 big agent cards + setup checklist. | `src/routes/onboarding/page.tsx` | 2 | Lands second. |
| `live-activities.jsx` | Dynamic island states + cross-OS notifications reference. | Two destinations: islands → separate WebviewWindow at `src/island/`. Notification toasts → fed to OS via `tauri-plugin-notification`. | 5 | Tauri-specific phase. |
| `companion.jsx` | Floating puck + 6 character styles + radial menu + preferences. | Separate WebviewWindow at `src/companion/`. | 5 | Tauri-specific phase. |
| `states.jsx` | Loading/error/empty reference. | Decompose into reusable components inside each route's loader/error boundary. | 6 | Reference for designers/devs. |
| `about.jsx` | Version + update + env + changelog. | `src/components/dialogs/AboutDialog.tsx` | 6 | Wired to `tauri-plugin-updater`. |

---

## Quick reference — what triggers what

| User action | Opens screen |
|---|---|
| Launch app, no sessions | empty-state |
| `⌘N` | spawn-dialog |
| `⌘K` | command-palette |
| `?` | shortcuts |
| Click session tab | hub-a |
| Right-click session row → Open | session-detail |
| Click container in sidebar | container-inspector |
| Click "Usage" in rail | dashboard / usage |
| Click "Resume" or empty hub | resume |
| `⌘,` | settings |
| Click agent in settings | agent-settings |
| About menu → About CodeHub | about |
| Agent fires event when not focused | island (overlay window) |
| Drag companion from tray | companion (overlay window) |
