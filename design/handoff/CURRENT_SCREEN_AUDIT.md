# Current Screen Audit

Updated: 2026-05-27

This is the first-pass comparison of `design/screens/*.jsx` against the current
React implementation. The implementation intentionally binds design slots to real
data only; unavailable data is either omitted, disabled, or labelled as not built.

## Matches Or Routed

| Design screen | Current implementation | First-pass status |
| --- | --- | --- |
| `main-hub-a.jsx` | `src/app/App.tsx` plus `components/hub/*`, previewable at `#/__screens/main-hub-a` | Routed as the main Hub. Workspace tabs, groups, pane grid, meta strip, action bar, status bar, and activity rail are implemented with live store/runtime data. |
| `hub-states.jsx` | `src/app/App.tsx`, `Grid.tsx`, `FilesBrowser.tsx`, `ShellPanel.tsx`, `DiffViewer.tsx`, `Resume.tsx`, `RuntimeBanner.tsx`, previewable at `#/__screens/hub-states` | Core states are decomposed into real conditionals and docked panels. Empty group now has the designed quick actions plus right-click menu. The preview route renders the live Hub, not the full static multi-artboard catalogue from the design file; rare states like saturated groups, tab overflow, dragging, and offline banners need trigger-specific checks. |
| `empty-state.jsx` | `src/app/screens/EmptyState.tsx`, previewable at `#/__screens/empty-state` | Implemented as the onboarding/no-workspace state with agent cards, setup checklist, and workspace action. |
| `welcome.jsx` | `src/app/screens/Welcome.tsx` | Implemented from saved workspaces and real MRU/config data. |
| `new-workspace.jsx` | `src/app/screens/NewWorkspace.tsx` | Implemented as a 3-step wizard. Browser dev fallback for repository selection is present through typed absolute paths, and the wizard keeps the new repo choice local until launch so it does not ask to restart the active workspace. |
| `spawn-dialog.jsx` | `src/app/screens/SpawnDialog.tsx`, previewable at `#/__screens/spawn-dialog` | Implemented and reused with `components/spawn-form.tsx`. The dev preview now renders it over the real hub frame. Cost estimate and inert templates are omitted until backend data exists. |
| `command-palette.jsx` | `src/app/components/hub/CommandPalette.tsx`, previewable at `#/__screens/command-palette` | Implemented with real commands, sessions, spawn actions, recent repos, and view navigation including the Settings → Integrations deep-link. The preview chrome title now matches the design's `codehub · ⌘K`. Transcript search and mute rows are omitted because no action exists yet. |
| `shortcuts.jsx` | `src/app/components/hub/Shortcuts.tsx` and Settings shortcut pane | Implemented for currently wired shortcuts only. The design handoff's `⌘A` new-agent binding is wired and listed. Design-only shortcuts are not listed until handlers exist. |
| `about.jsx` | `src/app/components/AboutDialog.tsx` and Settings About pane | Implemented with app/runtime/update facts. In-app update install still depends on updater wiring. |
| `dashboard.jsx` | `src/app/screens/Dashboard.tsx` | Implemented with live sessions, prompt queue, container stats, activity history, and transcript usage. Per-user "Mine", per-pane CPU, and per-session cost are omitted. |
| `usage.jsx` | `src/app/screens/Usage.tsx` | Implemented with transcript/rate-limit usage from Claude and Codex. Provider subscription, renewal, budget, and billing API fields are not available. |
| `container-inspector.jsx` | `src/app/screens/ContainerInspector.tsx`, previewable at `#/__screens/container-inspector` | Implemented as "Workspaces" inspector with real per-workspace containers, stats, logs, mounts, image identity, processes, and attached agents. The preview chrome title now matches the design's `codehub · workspaces · runtime`. |
| `integrations.jsx` | `src/app/screens/Integrations.tsx` inside Settings, previewable at `#/__screens/integrations` | Implemented for GitHub presence/repo visibility and Claude runtime config. Other hosts/trackers/observability remain coming soon. |
| `settings.jsx` | `src/app/screens/Settings.tsx` | Implemented with section nav and live General, Agents, Runtime, Repos, Platform, Shortcuts, Notifications, Appearance, and About panes. |
| `agent-settings.jsx` | `src/app/screens/AgentDetail.tsx` inside Settings Agents | Implemented factually for Claude config/account/MCP/skills/plugins where readable. Codex and Antigravity only expose version/key state for now. The dev preview now opens this inside the full Settings shell so it matches the design frame. |
| `platform.jsx` | `src/app/screens/Settings.tsx` Platform pane, previewable at `#/__screens/platform` | Implemented as a Settings pane. |
| `resume.jsx` | `src/app/screens/Resume.tsx` | Implemented as a docked drawer. Claude true resume is wired; Codex is labelled as fresh session because backend resume is absent; Antigravity history is omitted. |
| `session-detail.jsx` | `src/app/screens/SessionDetail.tsx` | Implemented with live diff, file rail, unified/split layout, stage all, commit, and open PR actions. |
| `states.jsx` | `src/app/screens/States.tsx` | Implemented as reusable primitives plus `#/__states` gallery. |
| `live-activities.jsx` | `src/app/screens/LiveActivities.tsx`, `src/app/screens/Settings.tsx` Notifications pane, plus native event plumbing | Standalone visual reference is exposed in `#/__screens/live-activities`; Settings Notifications keeps the real notification preferences. Real OS delivery exists in the desktop app path; browser dev cannot emit OS toasts. |
| `companion.jsx` | `src/app/screens/Companion.tsx` at `#/companion` and `#/__screens/companion` | Implemented as a standalone companion route/window with live polling and the showcase. |
| `_term.jsx` | `src/app/components/primitives/TermBlock.tsx` and terminal panes | Folded into shared terminal primitives/panes rather than a standalone screen. |
| `workspace.jsx` | Legacy reference only | Intentionally skipped per `SCREENS.md`; canonical hub is `main-hub-a.jsx` plus `hub-states.jsx`. |

## Backend/Data Gaps To Discuss

| Area | Missing source | Current behavior |
| --- | --- | --- |
| Billing/subscriptions | Provider billing APIs, renewal dates, budgets, account-level plan data | Usage shows factual transcript/rate-limit data and labels estimated cost. |
| Dashboard row telemetry | Per-session CPU/mem and per-session cost attribution | Dashboard shows container-wide stats and em-dashes for unavailable row fields. |
| Multi-user filters | User/team identity and session ownership | "Mine" and team filters are omitted. |
| GitHub repo actions | Clone/add repo/attach repo backend | GitHub repos are visible; rows navigate to Integrations rather than pretending to attach. |
| Codex resume | Backend resume flag/path for Codex sessions | Resume drawer labels Codex action as "New Codex". |
| Antigravity history/usage | Readable local transcripts and usage source | Omitted or shown as not installed/no readable data. |
| Agent permissions/budgets | Per-agent policy/config write backend | Settings/Agent Detail show real config and disable unbacked controls. |
| Container sizing/cost/sleep | Runtime sizing scheduler/cost model | New workspace/spawn surfaces show current workspace-container facts, not mocked pricing. |
| Native live activities | OS-specific island/window behavior in browser dev | Visuals are previewed; full behavior needs desktop/Tauri runtime. |

## First-Pass Verification Notes

- `playwright-cli` verified repository selection fallback in the New Workspace wizard: browser dev shows `Type path...`, accepts a typed absolute path, updates the wizard locally, and does not show the active-workspace restart warning.
- `playwright-cli` verified creating a workspace through the real app route: the wizard saved the workspace, launched the first agent, closed, and the new workspace appeared in the sidebar and tab strip.
- `playwright-cli` verified the empty-group state renders the group-specific copy and opens a right-click action menu with agent and utility actions.
- `playwright-cli` verified the shortcut sheet renders the `⌘A` new-agent binding.
- `playwright-cli` verified `#/__screens/shortcuts` renders the shortcuts modal over the hub frame with the live filter input, wired shortcut groups, `⌘A`, and no console errors. Design-only shortcut rows remain omitted until handlers exist.
- `playwright-cli` verified `#/__screens/about` renders the About dialog over the hub frame with real app/runtime/agent versions, changelog, update status, and no console errors. The design's mocked update availability is only shown when the backend reports a real available version.
- `playwright-cli` verified `#/__screens/dashboard` renders the full Dashboard page in the app frame with the five metric cards, sessions table, attention/runtime card, activity chart, token usage card, and no console errors. Mock-only per-user/per-session billing and CPU fields remain omitted or shown as unavailable.
- `playwright-cli` verified `#/__screens/usage` renders the Usage screen in the app frame with the aggregate strip, agent filters, Claude/Codex/Antigravity usage cards, disabled unbacked billing actions, and no console errors. The implementation intentionally shows factual transcript/rate-limit state instead of the design's fabricated subscription, renewal, budget, and account totals.
- `playwright-cli` verified `#/__screens/container-inspector` resolves through the design-file alias and renders the Workspaces runtime inspector with the `codehub · workspaces · runtime` chrome title, fleet list, metrics, image metadata, attached agents, mounts, forwarded credentials, process table, container logs, and no console errors.
- `playwright-cli` verified `#/__screens/settings` renders the Settings nav plus the Agents & API keys pane from `design/screens/settings.jsx`, with live agent version/key state, account profile controls, defaults, danger zone, and no console errors. The implementation highlights the Agents pane because that matches the screen content; the design file's General highlight is inconsistent with its pane body.
- `playwright-cli` verified `#/__screens/integrations` resolves through the design-file alias and renders the Settings-hosted Integrations pane with the `codehub · integrations` chrome title, GitHub card, source-control/tracker/observability sections, runtime Claude config, and no console errors. Mocked connected third-party services stay "Coming soon" until backend integrations exist.
- `playwright-cli` verified `#/__screens/platform` resolves through the design-file alias and renders the Settings-hosted Platform pane with the `codehub · platform` chrome title, desktop/web pill, support legend, full feature matrix, factual planned states for unwired desktop features, and no console errors.
- `playwright-cli` verified `#/__screens/main-hub-a` renders the live Hub in the app frame with workspace tabs, group bar, pane grid, workspace meta strip, action bar, status bar, active sidebar, and no console errors.
- `playwright-cli` verified `#/__screens/hub-states` currently renders the same live Hub shell with the design title `codehub · hub states` and no console errors. The design file is a static state catalogue; the current app covers those states through real conditionals instead of a separate static gallery.
- `playwright-cli` verified `⌘A` opens the in-workspace spawn flow and the bottom action bar advertises `New agent ⌘A`.
- `playwright-cli` verified the command palette renders Integrations as a real Go To target plus current views, sessions, commands, spawn rows, and recent repos with no console errors.
- `playwright-cli` verified `#/__screens/command-palette` uses the design-file route alias, renders over the hub frame, and now carries the `codehub · ⌘K` chrome title.
- `playwright-cli` verified `#/__screens/agent-settings` renders the Settings app rail, Settings nav, agent tab bar, and Claude detail content rather than a standalone detail panel.
- `playwright-cli` verified the dev screen harness now uses the real expanded app sidebar on full app screens; `#/__screens/session-detail` and `#/__screens/dashboard` render with the same sidebar frame used by the design references and current app.
- `playwright-cli` verified overlay previews now sit over the real hub backdrop instead of the empty onboarding screen; `#/__screens/resume` renders the docked drawer beside Hub tabs/groups/grid/actions/status, and `#/__screens/palette` still renders Integrations plus current commands without console errors.
- `playwright-cli` verified `#/__screens/new-workspace` uses the Welcome/workspace launcher as its blurred backdrop, matching `design/screens/new-workspace.jsx`'s `FauxWelcomeBg`, while the wizard still exposes the typed-path repository fallback.
- `playwright-cli` verified `#/__screens/settings` now lands on the Agents & API keys pane, matching the content in `design/screens/settings.jsx`; `#/__screens/settings-agents` remains an equivalent explicit route.
- `playwright-cli` verified `#/__screens/live-activities` renders the standalone macOS live-activity hero, stacked island states, Notification Center cards, state gallery, and cross-platform toast gallery; `#/__screens/settings-notifications` still renders the Settings preferences pane cleanly.
- `playwright-cli` verified `#/__screens/companion` renders the standalone companion design window in the same dev harness used for the other migrated screens: desktop hero, floating pucks, state cards, radial menu, preferences, and character gallery are present.
- `playwright-cli` verified design-file route aliases for `empty-state`, `spawn-dialog`, `command-palette`, `container-inspector`, `integrations`, `platform`, `main-hub-a`, and `hub-states`; these now land on their implemented preview screens with no console errors.
- `playwright-cli` caught and the implementation fixed the `empty-state` preview double-sidebar regression; `#/__screens/empty-state` now uses one onboarding sidebar plus the hero, matching the design's empty app frame.
- `playwright-cli` verified `#/__screens/welcome` renders the workspace launcher in the app frame with real saved-workspace data and no console errors. The implementation intentionally shows real directories/container identity instead of the design's fabricated repo, size, and live-agent footer data.
- `playwright-cli` verified `#/__screens/spawn-dialog` now renders the add-agent dialog over the real hub preview frame instead of the standalone skeleton backdrop, matching `design/screens/spawn-dialog.jsx`'s modal-over-hub composition; the active workspace group row is visible when a workspace exists.
- `#/__screens` now exposes the main implemented screens and important overlays for visual comparison, instead of only the old Empty/Settings/Spawn preview set.
