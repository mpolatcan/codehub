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
- [ ] Remove all owl/bird references in copy, code comments, and asset filenames
- [ ] Replace placeholder icon (use one I provide, or a coarse "CH" wordmark)
- [ ] Run existing test suite — all must still pass

**Deliverable**: PR titled `chore: rebrand to CodeHub (no behavior change)`.

---

## Phase 1 · Foundation (shadcn + tokens + primitives)

**Goal**: install shadcn, port tokens, build domain primitives. No screens yet.

- [ ] Install Tailwind CSS v4 (or v3, whichever the project already uses)
- [ ] `pnpm dlx shadcn@latest init` — choose dark default, CSS variables, system font fallback
- [ ] Replace `app/globals.css` with the token set from `design/styles.css`. Map names per `COMPONENTS.md`.
- [ ] Add Geist + Geist Mono + JetBrains Mono via Google Fonts `<link>`. Wire to Tailwind theme.
- [ ] Install shadcn primitives we'll need: `button card dialog dropdown-menu input label scroll-area select separator sheet switch tabs tooltip badge command kbd avatar progress`
- [ ] Build `src/components/primitives/`:
  - `AgentGlyph.tsx` — port from `design/components.jsx`
  - `AccountAvatar.tsx`
  - `StatusDot.tsx` + `StatusBadge.tsx`
  - `ContextGauge.tsx`
  - `MetricStat.tsx`
  - `Spark.tsx`
  - `TermBlock.tsx`
  - `Tag.tsx`
- [ ] Build `src/components/chrome/`:
  - `AppShell.tsx` — title bar + rail + main slot
  - `SidebarRail.tsx`
  - `Sidebar.tsx` (full)
  - `WorkspaceTab.tsx`
- [ ] Smoke-screen route `/__primitives` rendering every primitive in every state.
  Used for visual review; gate behind dev build only.

**Deliverable**: PR titled `feat(ui): shadcn foundation + domain primitives`.

---

## Phase 2 · First three screens (cycle the foundation)

**Goal**: prove the foundation by porting three low-risk, no-runtime-state screens.

Order:

1. **Settings** — pure form. Validates Switch, Select, Input, Tabs, Dialog patterns.
2. **Empty state / first-run** — pure presentational. Validates onboarding copy + CTAs + setup checklist.
3. **Spawn dialog** — modal with agent picker + account picker + container picker. Validates Dialog + RadioGroup.

For each:
- Read `design/screens/<name>.jsx` first.
- Port to `src/routes/<name>/page.tsx` (or whatever the existing routing uses).
- Replace `.btn` → `<Button>`, `.card` → `<Card>`, etc. per `COMPONENTS.md`.
- Hook to existing state stores (don't reinvent — Aviary already has these).

**Deliverable**: PR titled `feat(ui): settings, empty state, spawn dialog`.

---

## Phase 3 · Main hub (the heart of the product)

**Goal**: port Hub A (workspace tabs + per-pane metric headers). This is
where tmux/Docker state meets the new design.

- [ ] Port `design/screens/main-hub-a.jsx` to `src/routes/hub/page.tsx`.
- [ ] Replace old session-tab logic with `WorkspaceTab` (groups agents per
      container, not one tab per agent).
- [ ] Remove the global session meta strip. Move metrics INTO each pane's header.
- [ ] Each pane header carries: agent identity row + metric row (ContextGauge,
      MetricStat ×4, status). See `design/screens/main-hub-a.jsx` for the
      authoritative structure.
- [ ] Wire the Activity rail on the right to the existing event bus.
- [ ] Wire the awaiting-input toast to the existing permission-prompt system.
- [ ] Keep all keyboard shortcuts (`⌘N`, `⌘\`, `⌘1–9`, etc.) — see `design/screens/shortcuts.jsx`.

**Deliverable**: PR titled `feat(ui): Hub A — workspaces + per-pane metrics`.

This is the largest single PR. ~800–1200 LOC is expected.

---

## Phase 4 · Remaining screens

Port in this order; each is its own commit but may share a PR:

1. **Container inspector** (`design/screens/container-inspector.jsx`)
2. **Resume library** (`design/screens/resume.jsx`)
3. **Dashboard** + **Usage** (`design/screens/dashboard.jsx`, `usage.jsx`)
4. **Session detail / diff inspector** (`design/screens/session-detail.jsx`)
5. **Integrations** (`design/screens/integrations.jsx`) — GitHub + others
6. **Agent settings** (`design/screens/agent-settings.jsx`) — providers, MCP, sub-agents, skills, plugins
7. **Command palette** (`design/screens/command-palette.jsx`) — use shadcn `<CommandDialog>`
8. **Keyboard shortcuts** (`design/screens/shortcuts.jsx`)
9. **About** + **Platform** + **Workspace** + **Broadcast** (`design/screens/{about,platform,workspace,broadcast}.jsx`)
10. **Hub B** (`design/screens/main-hub-b.jsx`) — 2×2 compare grid

**Deliverable**: PR per ~3 screens.

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

- [ ] States artboard → real loading / error / empty components across the app.
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
- [ ] All copy uses CodeHub voice, no Aviary leftovers.
- [ ] Both `.dark` and `.light` themes verified (add a screenshot to the PR).
- [ ] Keyboard shortcuts in `design/screens/shortcuts.jsx` all work.
- [ ] No `console.log` shipped. No `TODO` without a tracking issue.
