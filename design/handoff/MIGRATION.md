# CodeHub Migration — phased rollout

Land each phase as its own PR. Don't skip ahead. Total ~6 sessions.

---

## Phase 0 · Setup & rename (no behavior change)

**Goal**: rebrand the existing Aviary repo to CodeHub without touching any
UI yet. The next phase needs a clean foundation.

- [ ] `git mv` all `aviary`-named files → `codehub`
- [ ] Replace identifier strings `aviary` → `codeHub` / `CodeHub` (preserve casing context)
- [ ] Update `tauri.conf.json`: `productName`, `identifier`, `mainBinaryName`
- [ ] Update window title in `main.rs`
- [ ] Update `package.json` name + bin
- [ ] Update `Info.plist` (CFBundleName, CFBundleDisplayName, CFBundleIdentifier)
- [ ] Update README.md headline only (full content rewrite later)
- [ ] Remove any owl/bird references in copy, code comments, asset filenames
- [ ] Replace placeholder icon (use one I provide, or a coarse "CH" wordmark)
- [ ] Run existing test suite — all must still pass

**Deliverable**: PR titled `chore: rebrand to CodeHub (no behavior change)`.

---

## Phase 1 · Foundation (shadcn + tokens + primitives)

**Goal**: install shadcn, port tokens, build domain primitives. No screens yet.

- [ ] Install Tailwind CSS v4 (or v3, whichever the project already uses)
- [ ] `pnpm dlx shadcn@latest init` — choose dark default, CSS variables, system font fallback
- [ ] Replace `app/globals.css` with the token set from `design/styles.css`. Map names per `COMPONENTS.md`. **Note the `--pri` shift to violet (oklch hue 295)** — every primary CTA + active workspace tab + focus outline uses this; don't carry the old warm coral forward.
- [ ] Add Geist + Geist Mono + JetBrains Mono via Google Fonts. Wire to Tailwind theme.
- [ ] Install shadcn primitives we'll need: `button card dialog dropdown-menu input label scroll-area select separator sheet switch tabs tooltip badge command kbd avatar progress`
- [ ] Build `src/components/primitives/`:
  - `AgentGlyph.tsx`
  - `AccountAvatar.tsx`
  - `StatusDot.tsx` + `StatusBadge.tsx`
  - `ContextGauge.tsx` — match the design canvas baseline-alignment structure exactly
  - `MetricStat.tsx`
  - `Spark.tsx`
  - `TermBlock.tsx`
  - `Tag.tsx`
- [ ] Build `src/components/chrome/`:
  - `AppShell.tsx` — title bar + rail + main slot
  - `SidebarRail.tsx`
  - `Sidebar.tsx` (full). Top-level item is **Workspaces** (not "Containers").
  - `HubFrame.tsx` — the hub shell contract. Props: `tabs / pseudoTab / tabsOverflow / meta / status / banner / leftPanel / bottomPanel / drawer / rail / actionBar / resumeActive / filesOpen / shellOpen / diffOpen`. Port from `design/screens/hub-states.jsx → HubFrame`.
  - `WorkspaceTab.tsx`
  - `ActionBar.tsx` + `StatusBar.tsx` + `MetaStrip.tsx` + `HubBanner.tsx`
  - `PaneAddBtn.tsx` (Files / Shell / Diff utility toggles)
  - `SpawnSplitBtn.tsx` + `SpawnPlacementMenu.tsx` — the bottom-bar primary CTA
- [ ] Smoke-screen route `/__primitives` rendering every primitive in every state.
  Used for visual review; gate behind dev build only.

**Deliverable**: PR titled `feat(ui): shadcn foundation + domain primitives + hub chrome`.

---

## Phase 2 · First three screens (cycle the foundation)

**Goal**: prove the foundation by porting three low-risk, no-runtime-state screens.

Order:

1. **Settings** — pure form. Validates Switch, Select, Input, Tabs, Dialog patterns.
2. **Welcome + empty-state / onboarding** — pure presentational. Validates onboarding copy + CTAs + setup checklist.
3. **Spawn dialog** — modal with agent picker + account picker + container picker. Validates Dialog + RadioGroup.

For each:
- Read `design/screens/<name>.jsx` first.
- Port to `src/routes/<name>/page.tsx` (or whatever the existing routing uses).
- Replace `.btn` → `<Button>`, `.card` → `<Card>`, etc. per `COMPONENTS.md`.
- Hook to existing state stores (don't reinvent — Aviary already has these).

**Deliverable**: PR titled `feat(ui): settings, onboarding, spawn dialog`.

---

## Phase 3 · Main hub (the heart of the product)

**Goal**: port the hub. This is where tmux/Docker state meets the new design.

- [ ] Port `design/screens/main-hub-a.jsx` to `src/routes/hub/page.tsx`.
- [ ] Use the `<HubFrame>` chrome built in Phase 1.
- [ ] Wire workspace tabs to the existing workspaces store (1 container = 1 workspace tab).
- [ ] Each pane header carries: agent identity row + metric row (ContextGauge, MetricStat ×4, status). See `design/screens/main-hub-a.jsx` for the authoritative structure.
- [ ] Bottom action bar:
  - **Files / Shell / Diff** (`PaneAddBtn`) — workspace-level toggle panes (at most one of each docked at a time, like an IDE's sidebar/bottom-panel/right-rail). Wire `filesOpen / shellOpen / diffOpen` props so the active utility highlights.
  - **Resume button** — toggles the `ResumeDrawer` overlay.
  - **`SpawnSplitBtn`** — primary CTA: clicking spawns a new agent into the default split-right placement; the chevron opens `SpawnPlacementMenu` for Split right / Split down / In new group / In new tab.
- [ ] Right-side **Activity rail** wired to the existing event bus. Toggleable via Tweaks.
- [ ] Awaiting-input toast wired to the existing permission-prompt system.
- [ ] Port **every hub state** from `design/screens/hub-states.jsx` as conditional renders or sub-routes:
  - `HubStateEmpty` — workspace open, no panes
  - `HubStateEmptyGroup` — workspace has panes elsewhere, active group empty
  - `HubStateSpawning` — new agent configuring (centered form: Agent / Model / Repo / Container dropdowns)
  - `HubStateFilesOpen` / `HubStateShellOpen` / `HubStateDiffOpen` — each utility toggle docked
  - `HubStateAwaiting` — approval queue rail
  - `HubStateSaturated` — 6 panes, tight chrome
  - `HubStateFocus` — one pane maximized, others as minimized cards
  - `HubStateTabOverflow` — workspace tabs scroll + dropdown
  - `HubStateDragging` — drop-zone quadrants
  - `HubStateGroupFull` — 5/5 panes prompt to split into new group
  - `HubStateDisconnected` — workspace offline banner + per-pane reconnect chrome
  - `HubStateNoWorkspace` — recovery prompt with new/resume/search cards
  - `HubStateHeavyLoad` — Jobs rail with progress bars
- [ ] Keep all keyboard shortcuts (`⌘N` spawn, `⌘\` / `⌘⇧\` split, `⌘1–9` jump, `⌘E` / `⌘⇧B` / `⌘D` toggles, `⌘R` resume drawer, `⌘G` new group, `⌘⇧T` new tab) — source of truth is `design/screens/shortcuts.jsx`.

**Deliverable**: PR titled `feat(ui): main hub + 15 hub states`.

This is the largest single PR. ~1200–1800 LOC is expected.

---

## Phase 4 · Remaining screens

Port in this order; each is its own commit but may share a PR:

1. **Workspaces inspector** (`design/screens/container-inspector.jsx`) — destination route is `src/routes/workspaces/[id]/`. Sidebar item name is **Workspaces**.
2. **Resume drawer** (`design/screens/resume.jsx`) — mounts inside the hub route as an overlay drawer, not its own page.
3. **Dashboard** + **Usage** (`design/screens/dashboard.jsx`, `usage.jsx`)
4. **Session detail / diff inspector** (`design/screens/session-detail.jsx`) — diff-only, uses `<HubFrame>` chrome.
5. **Integrations** (`design/screens/integrations.jsx`) — GitHub + others
6. **Agent settings** (`design/screens/agent-settings.jsx`) — providers, MCP, sub-agents, skills, plugins
7. **Command palette** (`design/screens/command-palette.jsx`) — use shadcn `<CommandDialog>`
8. **Keyboard shortcuts** (`design/screens/shortcuts.jsx`)
9. **About** + **Platform** + (legacy) **Workspace** (`design/screens/{about,platform,workspace}.jsx`)

**Deliverable**: PR per ~3 screens.

> **Cut from scope**: `main-hub-b.jsx` (compare grid) and `broadcast.jsx`
> (one-prompt-to-N agents) were removed from the design. Compare mode in
> the action bar was also removed. Don't port them; if a future iteration
> needs them they'll be re-designed.

---

## Phase 5 · Always-on-top windows (Tauri-specific)

**Goal**: ship the Dynamic Island + Companion as separate WebviewWindows.

- [ ] In `tauri.conf.json`, define `island` and `companion` windows: frameless,
      transparent, always-on-top, skip-taskbar, no-focus.
- [ ] macOS: bump NSWindowLevel to NSStatusWindowLevel via cocoa-rs.
- [ ] Add `setIgnoreCursorEvents` for click-through on companion.
- [ ] Build `src/island/` and `src/companion/` entries (port from
      `design/screens/live-activities.jsx` and `companion.jsx`).
- [ ] IPC: emit `agent-event` from Rust on every state change; both
      windows subscribe.
- [ ] Add `tauri-plugin-window-state` so positions persist.
- [ ] Add global shortcut `⌘⇧J` to expand island.
- [ ] Add tray icon (`tauri-plugin-tray`) — quick spawn + show/hide windows.

**Deliverable**: PR titled `feat(desktop): dynamic island + companion overlay windows`.

---

## Phase 6 · States, About, Platform (polish)

- [ ] Pane-level states (`design/screens/states.jsx`) → real loading / error / empty / rate-limited / offline components across the app.
- [ ] About modal wired to `tauri-plugin-updater`.
- [ ] Platform feature-matrix page in Settings.
- [ ] Final dead-code sweep — delete old Aviary CSS / components.

**Deliverable**: PR titled `feat(ui): polish — states, about, platform`.

---

## Cross-cutting checklist (every PR)

- [ ] No reproduced third-party logos. Logos load from `assets/agents/*.svg`
      if present, otherwise `AgentGlyph` fallback.
- [ ] No emojis in chrome.
- [ ] Tabular nums on all numeric stats.
- [ ] **Containers → Workspaces** rename observed in every user-facing string. Container IDs (e.g. `aurora-cc-3a8f`) stay as-is in runtime/infra surfaces because they describe the technical layer underneath each workspace.
- [ ] All copy uses CodeHub voice, no Aviary leftovers.
- [ ] Both `.dark` and `.light` themes verified (add a screenshot to the PR).
- [ ] Keyboard shortcuts in `design/screens/shortcuts.jsx` all work — especially the split shortcuts (`⌘\`, `⌘⇧\`) which moved off `⌘D` to free `⌘D` for the Diff toggle.
- [ ] No `console.log` shipped. No `TODO` without a tracking issue.
