# Component map — design canvas → shadcn / source

Use this when porting screens. Left column: what you'll see in
`design/screens/*.jsx`. Right column: what to use in the real code.

---

## Token mapping (CSS variables)

Replace the design canvas tokens with shadcn-style names. The values stay the same.

| Design canvas    | shadcn name           | Value (dark)           |
|------------------|-----------------------|------------------------|
| `--bg-1`         | `--background`        | `#10131a`              |
| `--fg-0`         | `--foreground`        | `#ecedf0`              |
| `--bg-2`         | `--card`              | `#171b22`              |
| `--fg-0`         | `--card-foreground`   | `#ecedf0`              |
| `--bg-2`         | `--popover`           | `#171b22`              |
| `--fg-0`         | `--primary`           | `#ecedf0`              |
| `--bg-0`         | `--primary-foreground`| `#08090b`              |
| `--bg-3`         | `--secondary`         | `#1f242d`              |
| `--fg-0`         | `--secondary-foreground`| `#ecedf0`            |
| `--bg-3`         | `--muted`             | `#1f242d`              |
| `--fg-2`         | `--muted-foreground`  | `#6a6f79`              |
| `--bg-3`         | `--accent`            | `#1f242d`              |
| `--fg-0`         | `--accent-foreground` | `#ecedf0`              |
| `--err`          | `--destructive`       | `oklch(0.72 0.18 25)`  |
| `--bd`           | `--border`            | `#262b34`              |
| `--bd`           | `--input`             | `#262b34`              |
| `--live`         | `--ring`              | `oklch(0.80 0.17 145)` |

Plus **add custom semantic tokens** (no shadcn equivalent):

```css
--live: oklch(0.80 0.17 145);
--live-dim: oklch(0.80 0.17 145 / 0.18);
--wait: oklch(0.83 0.14 80);
--wait-dim: oklch(0.83 0.14 80 / 0.20);
--idle: oklch(0.78 0.06 240);
--err: oklch(0.72 0.18 25);
--done: oklch(0.78 0.08 200);
--spend-warn: var(--wait);
--spend-over: var(--err);
--a-claude: oklch(0.78 0.13 35);
--a-codex: oklch(0.78 0.10 265);
--a-antigravity: oklch(0.78 0.13 200);
```

Repeat for `.light` block — see `design/styles.css` for the light values.

---

## Built-in primitive → shadcn

| Design canvas | shadcn | Notes |
|---|---|---|
| `.btn` | `<Button variant="outline">` | default |
| `.btn.primary` | `<Button>` | shadcn default solid |
| `.btn.ok` | `<Button variant="success">` | **add this variant**: bg `--live`, fg `--bg-0` |
| `.btn.ok.solid` | `<Button variant="success">` | same |
| `.btn.danger` | `<Button variant="destructive">` | |
| `.btn.ghost` | `<Button variant="ghost">` | |
| `.btn.sm` | `<Button size="sm">` | |
| `.btn.xs` | `<Button size="xs">` | **add this size**: padding 4px 7px |
| `.card` | `<Card>` / `<CardContent>` | |
| `Toggle` | `<Switch>` | |
| `Tag` | `<Badge variant="outline">` | use color via className |
| `.kbd` | `<Kbd>` (community) or stay custom | |
| `SectionHead` | composition: `<div className="flex items-center gap-2"><span className="lbl">…</span><Separator/></div>` | |
| `NavGroup` / `NavItem` | shadcn `<Sidebar>` (new in v0.6) or `<Tabs orientation="vertical">` | |
| `CommandPalette` | `<CommandDialog>` / `<Command>` | drop-in |
| Modal (Spawn / Shortcuts / About) | `<Dialog>` / `<DialogContent>` | |
| `IconBtn` | `<Button variant="ghost" size="icon">` | |
| Input | `<Input>` | |
| Settings select | `<Select>` / `<SelectTrigger>` | |
| Permission rules segmented control | `<ToggleGroup type="single">` | |

---

## Domain primitives (port to `src/components/primitives/`)

These are originals, no shadcn equivalent.

| Component | What it does | Where it's used |
|---|---|---|
| `AgentGlyph` | SVG mark per agent (Claude/Codex/Antigravity) | everywhere identity appears |
| `AccountAvatar` | hash-derived letter avatar | spawn dialog, sidebar, meta strips, panes, dashboard |
| `StatusDot` | 6px colored circle with pulse anim | every status indicator |
| `StatusBadge` | dot + label pill | session rows, headers |
| `ContextGauge` | inline `label [bar] used/max` | every pane header, session detail, island, companion |
| `MetricStat` | inline label + tabular value + delta | pane headers, dashboard, broadcast, session detail |
| `Spark` | tiny inline svg sparkline | dashboard cards, container CPU, usage cards |
| `Tag` | small colored chip | many places |
| `TermBlock` / `TermLine` | terminal output renderer (`[[cls, text], …]`) | terminal panes, container logs, broadcast columns, island |
| `Island` | dynamic island, 7 states | live activities artboard + standalone window |
| `CompanionAvatar` | floating puck with status ring + bubble | companion window |
| `Character` | character variants for companion (glyph/sprite/face/orb/ascii/robot) | companion settings |
| `Logo` | wordmark + icon | sidebar header, About |
| `PaneTypeChip` | AGENT/SHELL/FILES selector | workspace panes |
| `WorkspaceTab` | tab showing repo + agent stack | hub top bar |

Port them as-is. The signatures in `design/components.jsx` and the
per-screen helpers are the contract.

---

## Patterns that aren't components

These appear inline in the design canvas. Keep them inline OR extract to
helpers as you go — your call. Document the choice in your PR.

- **Dashed forecast row** at bottom of usage cards (`border-top: dashed`)
- **Status rail** (3px colored vertical bar) on resume cards
- **Gradient fade** at bottom of terminal peeks for elegant truncation
- **Mini progress bar** at the bottom of the live island state

---

## Things to NOT bring over

- Babel-standalone runtime (we use Vite in production)
- The `<window.DesignCanvas>` wrapper (canvas-only)
- The Tweaks panel (it's a design-time tool — settings are real settings now)
- Inline-style font stacks (use Tailwind theme)
- The `ch-root` class wrapper (use `body.dark` / `body.light` instead)
