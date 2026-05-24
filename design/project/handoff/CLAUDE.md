# CodeHub — implementation guide for Claude Code

> **SUPERSEDED (historical).** This was the Aviary→CodeHub migration brief.
> The migration shipped; the repo is React 19, not 18. Kept as a design-intent
> record only. For current guidance use the root `./CLAUDE.md`.

> Read this whole file before touching any source. The design is finished;
> your job is to port it cleanly into the existing Tauri v2 + React codebase
> formerly known as **Aviary**.

---

## What you're building

**CodeHub** — a Tauri-based desktop hub that runs coding agents (Claude Code,
Codex, Antigravity) in Docker containers and presents them through tmux
sessions. The product was previously named "Aviary" and is being rebranded.

This repo is the existing Aviary codebase. Your work is:

1. Rename Aviary → CodeHub throughout (binary, window title, plist, etc.)
2. Rebuild the UI using the new design system documented in `design/`
3. Preserve all existing runtime behavior (tmux, Docker, agent processes)

You are **not** replacing the Rust backend or the agent process management.
You are replacing the **chrome** (sidebars, tabs, panes, modals, settings).

---

## Source-of-truth files (read in this order)

```
design/CLAUDE.md          ← you are here
design/MIGRATION.md       ← phased rollout plan
design/COMPONENTS.md      ← component map: our names → shadcn names
design/SCREENS.md         ← list of every screen + which one to port first
design/styles.css         ← design tokens (CSS vars)
design/components.jsx     ← shared primitives (AgentGlyph, MetricStat, …)
design/screens/*.jsx      ← canonical layout for each screen
design/index.html         ← how the screens are wired together
```

The `design/` folder is a working React canvas. You can `open design/index.html`
in a browser to see every screen rendered at 1440×900 with current data. Use
it as your visual reference; do not import from it.

---

## Tech stack decisions (already made — do not re-litigate)

- **Tauri v2** for the desktop shell. Existing build. Keep.
- **React 18** + **TypeScript** for the UI. Existing.
- **shadcn/ui** for primitives. Add this.
- **Tailwind CSS** as the styling backbone. Replace existing CSS-in-JS with
  Tailwind classes paired with shadcn primitives.
- **xterm.js** for tmux output. Existing.
- **JetBrains Mono** + **Geist** fonts. Load from Google Fonts.
- **No emojis** in chrome. No reproduced third-party logos.

---

## Design language rules (non-negotiable)

1. **Mono-first, sans for prose.** Default font stack is JetBrains Mono. Use
   Geist (sans) for body prose: settings descriptions, captions, hints. Use
   `font-weight: 600` for headings to compensate.
2. **Cool-neutral darks.** Surfaces lift from `bg-0` (`#08090b`) to `bg-3`
   (`#1f242d`). Borders sit between bg layers, not on top of them.
3. **Three semantic accents only.** `--live` (green), `--wait` (amber),
   `--err` (red). Status everywhere uses these. Agent identity colors
   (`--a-claude`, `--a-codex`, `--a-antigravity`) appear ONLY on glyphs,
   avatars, and chips — never on chrome.
4. **Antigravity is cyan, not green.** `oklch(0.78 0.13 200)`. Avoid drift
   toward green-teal — it collides with `--live`.
5. **Tabular nums for all numeric stats** (cost, tokens, turn, percentages).
   `font-variant-numeric: tabular-nums` or shadcn's `tabular-nums` class.
6. **No tracked-uppercase labels in metric strips.** Use lowercase mono
   labels (the `.lbl-soft` class) so the *value* is the loud thing.
7. **Light mode is real.** Token names match shadcn. `.dark` and `.light`
   selectors swap them. Both themes ship.

---

## Component vocabulary

These are domain components I built in `design/components.jsx`. They do NOT
exist in shadcn. Port them as plain React components into
`src/components/primitives/`:

- `AgentGlyph({agent, size, color})` — geometric mark per agent
- `AccountAvatar({id, size, ring})` — hash-derived colored letter avatar
- `StatusDot({status, pulse})` — small colored dot with pulse animation
- `StatusBadge({status, children})` — pill with dot + label
- `ContextGauge({used, max, label, width})` — inline bar showing token usage
- `MetricStat({label, value, delta, deltaTone, spend})` — inline label/value pair
- `Spark({data, w, h, color, fill})` — minimal sparkline svg
- `TermBlock({lines})` — terminal output renderer (lines = [[className, text], …])
- `Tag({children, color})` — small bordered chip
- `Island({state})` — dynamic island in its six states
- `CompanionAvatar({agent, status, bubble})` — floating puck with status ring
- `Character({kind, expression})` — companion character styles

For shadcn equivalents of our built-in helpers (Toggle → `Switch`, .card →
`<Card>`, .btn → `<Button>`), see `design/COMPONENTS.md`.

---

## What MUST be preserved from the Aviary codebase

- Tmux session management (the Rust side that spawns/attaches tmux)
- Docker container lifecycle (pull, create, mount, exec, stop, prune)
- Agent process supervision (Claude Code, Codex, Antigravity child procs)
- Existing API-key keychain reads
- File-watcher for `/workspace` modifications
- WebSocket pipe from Rust → xterm.js
- The IPC command surface (`#[tauri::command]` entries). Refactor only if
  the new design needs additional commands; never remove existing ones
  without first proving they're unused.

---

## What MUST change

- Window title `Aviary` → `CodeHub`
- Bundle id `com.aviary.*` → `com.codehub.*` (coordinate with whoever owns
  the cert)
- App icon (placeholder for now; new asset coming)
- The owl/bird metaphor everywhere (variables, copy, asset filenames,
  notification titles) — replace with neutral CodeHub vocabulary
- All UI components and CSS

---

## How to interact with me (the human running you)

1. **Always read first.** Before any edit, summarize what you found and what
   you plan to do. I will say "proceed" before you run code.
2. **One phase per session.** Do not start Phase 2 work while finishing
   Phase 1. The `MIGRATION.md` ordering is intentional.
3. **Branch per phase.** `feat/codehub-phase-0`, `feat/codehub-phase-1`, etc.
   Open a PR at the end of each phase.
4. **Tests stay green.** Every PR must pass the existing test suite.
   If a test references "Aviary" branding, update it; if it tests behavior,
   never weaken it.
5. **Ask, don't guess** on naming. The new product name is **CodeHub**.
   Variable names like `aviaryClient` should become `codeHubClient`, NOT
   `client` (preserves the namespace).

---

## Out of scope for v1

- Web build (we are desktop-first)
- Mobile companion
- Team / shared sessions
- Session checkpoints / branching
- MCP marketplace UI (we have an "Add MCP" button but no browse experience)
- Workspace templates

These are documented in `design/screens/` for future reference but should
NOT be implemented in v1. Stub buttons that link to "Coming soon" are
acceptable placeholders.

---

## First action

Read `design/MIGRATION.md`. Confirm you understand the phased plan and
present a 5-bullet summary of Phase 0 before touching any files.
