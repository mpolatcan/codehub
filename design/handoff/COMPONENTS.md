# Component map — design canvas → shadcn / source

Use this when porting screens. Left column: what you'll see in
`design/screens/*.jsx` and `design/components.jsx`. Right column: what
to use in the real code.

---

## Token mapping (CSS variables)

Replace the design canvas tokens with shadcn-style names. The values stay the same.

| Design canvas    | shadcn name             | Value (dark)           |
|------------------|-------------------------|------------------------|
| `--bg-1`         | `--background`          | `#10131a`              |
| `--fg-0`         | `--foreground`          | `#ecedf0`              |
| `--bg-2`         | `--card`                | `#171b22`              |
| `--fg-0`         | `--card-foreground`     | `#ecedf0`              |
| `--bg-2`         | `--popover`             | `#171b22`              |
| `--pri`          | `--primary`             | `oklch(0.74 0.16 295)` |
| `--bg-0`         | `--primary-foreground`  | `#08090b`              |
| `--bg-3`         | `--secondary`           | `#1f242d`              |
| `--fg-0`         | `--secondary-foreground`| `#ecedf0`              |
| `--bg-3`         | `--muted`               | `#1f242d`              |
| `--fg-2`         | `--muted-foreground`    | `#6a6f79`              |
| `--bg-3`         | `--accent`              | `#1f242d`              |
| `--fg-0`         | `--accent-foreground`   | `#ecedf0`              |
| `--err`          | `--destructive`         | `oklch(0.72 0.18 25)`  |
| `--bd`           | `--border`              | `#262b34`              |
| `--bd`           | `--input`               | `#262b34`              |
| `--pri`          | `--ring`                | `oklch(0.74 0.16 295)` |

**`--pri` is violet (hue 295)**, not the previous warm coral. The shift makes
it distinct from Claude orange (35h), wait amber (80h), and live green
(145h) — primary CTAs are the only cool element in a warm palette.

Plus **add custom semantic tokens** (no shadcn equivalent):

```css
/* primary CTA tint */
--pri: oklch(0.74 0.16 295);

/* status accents */
--live: oklch(0.80 0.17 145);
--live-dim: oklch(0.80 0.17 145 / 0.18);
--wait: oklch(0.83 0.14 80);
--wait-dim: oklch(0.83 0.14 80 / 0.20);
--idle: oklch(0.78 0.06 240);
--err: oklch(0.72 0.18 25);
--done: oklch(0.78 0.08 200);
--spend-warn: var(--wait);
--spend-over: var(--err);

/* agent identity */
--a-claude:      oklch(0.78 0.13 35);
--a-codex:       oklch(0.78 0.10 265);
--a-antigravity: oklch(0.78 0.13 200);
```

Repeat for `.light` block — see `design/styles.css` for the light values.

---

## Built-in primitive → shadcn

| Design canvas | shadcn | Notes |
|---|---|---|
| `.btn` | `<Button variant="outline">` | default |
| `.btn.pri` | `<Button>` | tinted primary |
| `.btn.pri.solid` | `<Button>` | strongest fill (used in `SpawnSplitBtn` + `NewAgentBtn variant="solid"`) |
| `.btn.ok` / `.btn.ok.solid` | `<Button variant="success">` | **add this variant**: bg `--live`, fg `--bg-0` |
| `.btn.danger` | `<Button variant="destructive">` | |
| `.btn.ghost` | `<Button variant="ghost">` | |
| `.btn.sm` | `<Button size="sm">` | |
| `.btn.xs` | `<Button size="xs">` | **add this size**: padding 4px 7px |
| `.card` | `<Card>` / `<CardContent>` | |
| `Toggle` | `<Switch>` | |
| `Tag` | `<Badge variant="outline">` | use color via className |
| `.kbd` | `<Kbd>` (community) or stay custom | |
| `SectionHead` | composition: `<div className="flex items-center gap-2"><span className="lbl">…</span><Separator/></div>` | |
| `NavGroup` / `NavItem` | shadcn `<Sidebar>` or `<Tabs orientation="vertical">` | |
| `CommandPalette` | `<CommandDialog>` / `<Command>` | drop-in |
| Modal (Spawn / Shortcuts / About) | `<Dialog>` / `<DialogContent>` | |
| `IconBtn` | `<Button variant="ghost" size="icon">` | |
| Input | `<Input>` | |
| Settings select | `<Select>` / `<SelectTrigger>` | |
| Permission rules segmented control | `<ToggleGroup type="single">` | |

---

## Domain primitives (port to `src/components/primitives/`)

Originals — no shadcn equivalent.

| Component | What it does | Where it's used |
|---|---|---|
| `AgentGlyph` | SVG mark per agent (Claude/Codex/Antigravity) | every identity surface |
| `AccountAvatar` | hash-derived letter avatar | spawn dialog, sidebar, meta strips, panes, dashboard |
| `StatusDot` | 6px colored circle with pulse anim | every status indicator |
| `StatusBadge` | dot + label pill | session rows, headers |
| `ContextGauge` | inline `label [bar] used/max` | every pane header, session detail, island, companion. **Aligns to text baseline** — use the structure in `design/components.jsx` exactly (bar inside a `height: 0` wrapper) or sibling stats will misalign. |
| `MetricStat` | inline label + tabular value + delta | pane headers, dashboard, session detail |
| `Spark` | tiny inline svg sparkline | dashboard cards, container CPU, usage cards |
| `Tag` | small colored chip | many places |
| `TermBlock` / `TermLine` | terminal output renderer (`[[cls, text], …]`) | terminal panes, container logs, broadcast columns, island |
| `Island` | dynamic island, 7 states | live activities artboard + standalone window |
| `CompanionAvatar` | floating puck with status ring + bubble | companion window |
| `Character` | character variants for companion | companion settings |
| `Logo` | wordmark + icon | sidebar header, About |
| `PaneTypeChip` | AGENT/SHELL/FILES selector inside a pane head | legacy workspace screen |
| `WorkspaceTab` | tab showing repo + agent stack | hub top bar |
| `NewAgentBtn` | three variants (toolbar / block / solid) for the "+ New agent" CTA. Used outside the hub action bar (welcome, dashboard, empty state). | global CTAs |
| `SpawnSplitBtn` | **split-button** that replaces Split-right + Split-down + New-agent in the hub bottom action bar. Two halves: left = primary spawn CTA (default placement), right = chevron opening a `SpawnPlacementMenu` (Split right ⌘\, Split down ⌘⇧\, In new group ⌘G, In new tab ⌘⇧T). | bottom action bar of every hub-derived screen |
| `PaneAddBtn` | utility-toggle chip for the bottom action bar (Files ⌘E, Shell ⌘⇧B, Diff ⌘D). `active` prop fills the chip with the pane-type accent so the user can see which utility pane is currently docked. **There is no `kind="agent"`** in production usage — agents go through `SpawnSplitBtn`. | bottom action bar |

---

## Hub chrome primitives (port to `src/components/chrome/`)

Shared shell components used by `main-hub-a` and every state snapshot in
`hub-states.jsx`. Each state snapshot is `<HubFrame>` with a different
body — port `<HubFrame>` once and the states reduce to body components.

| Component | Slot | What it does |
|---|---|---|
| `HubFrame` | `src/components/chrome/HubFrame.tsx` | Full hub chrome: sidebar + tab bar + (optional left/bottom docked panels) + body + (optional meta strip) + action bar + status bar + (optional drawer/rail). Props: `tabs`, `pseudoTab`, `tabsOverflow`, `meta`, `status`, `banner`, `leftPanel`, `bottomPanel`, `drawer`, `rail`, `actionBar`, `resumeActive`, `filesOpen`, `shellOpen`, `diffOpen`. |
| `StaticTabBar` + `StaticTab` | inside `HubFrame` | Workspace tabs row driven by props (not a live store). Use this shape for the real implementation too — the design canvas just bypasses the store. |
| `HubWorkspaceTabBar` + `HubPseudoTab` | live-data variant in `main-hub-a.jsx` | Same chrome wired to the `useStore()` workspaces. `pseudoTab` is the way to render a non-workspace active tab (e.g. an inspector). |
| `MetaStrip` | row above the action bar | Compact mono summary: repos · uncommitted · CI · agents · cost. |
| `ActionBar` | bottom action row | Holds `PaneAddBtn × 3` (Files/Shell/Diff toggles), `SpawnSplitBtn`, and the Resume button. Receives `filesOpen / shellOpen / diffOpen / resumeActive` to highlight the active utility toggles. |
| `StatusBar` | bottom of main | Mono one-liner: container status · resource stats · keyboard hints. |
| `HubBanner` | above the body | Full-width tinted banner for hub-level alerts (workspace offline, indexing, etc.). Tones: `err / warn / info / live`. |
| `MockGroupTab` | inside the body | Static group-tab visualization for state snapshots. |

---

## Patterns that aren't components

These appear inline in the design canvas. Keep them inline OR extract to
helpers as you go.

- **Dashed forecast row** at bottom of usage cards (`border-top: dashed`)
- **Status rail** (3px colored vertical bar) on resume cards
- **Gradient fade** at bottom of terminal peeks for elegant truncation
- **Drop quadrants** in `hub-states.jsx → DropQuadrants` — 4 thin edge strips + center swap pill for pane drag
- **Mini progress bar** at the bottom of the live island state

---

## Things to NOT bring over

- Babel-standalone runtime (we use Vite in production)
- The `<window.DesignCanvas>` wrapper (canvas-only)
- The Tweaks panel (it's a design-time tool — settings are real settings now)
- Inline-style font stacks (use Tailwind theme)
- The `ch-root` class wrapper (use `body.dark` / `body.light` instead)
- `HubStateCompare`, `ComparePickPane`, and the `Compare` button — Compare mode was cut
- `Broadcast` and `MainHubB` components — Broadcast and Hub B were cut
