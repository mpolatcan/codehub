import { useState } from "react";
import { ColorDot } from "../components/primitives/ColorDot";
import { IconBtn } from "../components/primitives/IconBtn";
import { MetricStat } from "../components/primitives/MetricStat";
import { StatusBadge } from "../components/primitives/StatusBadge";
import { Tip } from "../components/primitives/Tip";
import { Ico } from "../components/primitives/icons";
import { fmtTokens, useSessionUsage } from "../hooks/useSessionUsage";
import { MODE_BY_ID } from "../lib/catalog";
import { useOverlay } from "../lib/overlay";
import { confirmCloseRunningSession, useStore } from "../lib/store";
import { leavesList, paneInk } from "../lib/tree";

// Pane header, visually aligned with design/screens/main-hub-a.jsx: index + a
// status dot that doubles as the color picker (ColorDot) + colored pane title +
// badges, then expand/more/close, with the metric strip below. When the user
// picks a color the WHOLE bar takes that fill and every control flips to the
// paired contrast ink (PANE_COLORS), so the title and buttons stay legible in
// all three themes. Telemetry values stay real; unknown telemetry renders as an
// em-dash rather than copying the mock's sample numbers.
export function PaneHead({
  session,
  draggable,
  onDragStart,
  onDragEnd,
  onMenu,
}: {
  session: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  // Opens the pane context menu (split/spawn/close) at the ⋯ button. Supplied by
  // the grid leaf, which owns the menu position state.
  onMenu?: (e: React.MouseEvent) => void;
}) {
  const meta = useStore((s) => s.sessionMeta[session]);
  const activity = useStore((s) => s.sessionActivity[session]);
  const focused = useStore((s) =>
    s.workspaces.some((w) => w.groups.some((g) => g.focused === session)),
  );
  const siblings = useStore((s) => {
    for (const w of s.workspaces)
      for (const g of w.groups) {
        const ls = leavesList(g.root);
        if (ls.includes(session)) return ls.length;
      }
    return 1;
  });
  const awaiting = useStore((s) => s.pendingPrompts.some((p) => p.session === session));
  const closeSession = useStore((s) => s.closeSession);
  const renameSession = useStore((s) => s.renameSession);
  const setSessionColor = useStore((s) => s.setSessionColor);
  const focusSession = useStore((s) => s.focusSession);
  const focusMode = useOverlay((s) => s.focusMode);
  const setFocusMode = useOverlay((s) => s.setFocusMode);
  const [editing, setEditing] = useState(false);

  const claudeId = activity?.claudeId ?? (meta?.cli === "claude" ? meta.claudeId : undefined);
  const usage = useSessionUsage(claudeId);

  if (!meta) return null;

  const accent = `var(--a-${meta.cli})`;
  const badge = MODE_BY_ID[meta.mode].badge;
  const working = activity?.state === "working";
  const statusText = awaiting ? "Awaiting input" : working ? "Working" : "Idle";
  const canMax = siblings > 1;
  const isMax = focusMode && focused && canMax;

  // A user-picked color fills the whole bar; `ink` is its paired contrast
  // foreground (title + every control). The agent accent is the fallback and
  // drives the left identity rail when no color is picked.
  const tint = meta.color;
  const ink = paneInk(tint);
  const railColor = tint ?? accent;
  const headBg =
    tint ?? (awaiting ? `color-mix(in oklab, ${accent} 22%, var(--bg-1))` : "var(--bg-1)");
  const titleColor = ink ?? "var(--fg-0)";
  const headBorder = tint
    ? `1px solid color-mix(in oklab, ${ink} 28%, transparent)`
    : awaiting
      ? `1px solid color-mix(in oklab, ${accent} 40%, var(--bd-soft))`
      : "1px solid var(--bd-soft)";
  // Shared control recolor while tinted — recolors expand/more/close to the ink.
  const tintBtn = ink
    ? {
        idleColor: `color-mix(in oklab, ${ink} 78%, transparent)`,
        hoverColor: ink,
        hoverBg: `color-mix(in oklab, ${ink} 16%, transparent)`,
      }
    : {};

  return (
    <div
      style={{
        flex: "0 0 auto",
        background: headBg,
        borderBottom: headBorder,
        color: ink ?? "var(--fg-1)",
        // Agent-identity rail: full color when this pane is focused, dimmed
        // otherwise — a clear focused-vs-background read the lone status dot
        // can't carry. Uses the picked color when set, else the agent accent.
        borderLeft: `3px solid ${
          focused ? railColor : `color-mix(in oklab, ${railColor} 38%, transparent)`
        }`,
        userSelect: "none",
      }}
    >
      <div
        className="ch-pane-head"
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          cursor: draggable ? "grab" : undefined,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          {/* The status dot IS the color picker: it carries live state
              (pulse/ring) and clicking it recolors the whole pane. On a colored
              bar it shows the contrast ink (not the agent accent) so it never
              clashes with the fill; on a neutral bar it shows the agent accent.
              One dot instead of a separate swatch — same mechanism as the group
              and workspace tabs. */}
          <ColorDot
            size={12}
            display={ink ?? accent}
            selected={meta.color}
            onPick={(c) => setSessionColor(session, c)}
            pulse={working}
            ring={
              working || awaiting
                ? `color-mix(in oklab, ${ink ?? accent} 22%, transparent)`
                : undefined
            }
            border={
              ink
                ? `1px solid color-mix(in oklab, ${ink} 45%, transparent)`
                : `1px solid color-mix(in oklab, ${accent} 60%, black)`
            }
            title={`${statusText} · click to set pane color`}
          />
          {editing ? (
            <input
              className="pane-name-input"
              defaultValue={meta.alias}
              maxLength={32}
              // biome-ignore lint/a11y/noAutofocus: rename input is opened by an explicit user action
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => {
                renameSession(session, e.currentTarget.value);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  renameSession(session, e.currentTarget.value);
                  setEditing(false);
                } else if (e.key === "Escape") {
                  setEditing(false);
                }
              }}
            />
          ) : (
            <Tip text="Double-click to rename">
              <span
                className="mono ch-rename"
                style={{ fontSize: 13, color: titleColor, fontWeight: 500 }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                {meta.alias}
              </span>
            </Tip>
          )}
        </span>

        {badge && <span className={`mode-badge badge-${meta.mode}`}>{badge}</span>}
        {awaiting && <StatusBadge status="wait">Awaiting</StatusBadge>}

        <span style={{ flex: 1 }} />

        <IconBtn
          title={isMax ? "Restore split" : canMax ? "Maximize pane" : "Maximize — split first"}
          active={isMax}
          disabled={!canMax}
          style={{ width: 22, height: 22 }}
          {...tintBtn}
          onClick={(e) => {
            e.stopPropagation();
            if (isMax) {
              setFocusMode(false);
            } else {
              focusSession(session);
              setFocusMode(true);
            }
          }}
        >
          {isMax ? Ico.grid : Ico.expand}
        </IconBtn>
        <IconBtn
          title="Pane menu — spawn, split, close"
          style={{ width: 22, height: 22 }}
          {...tintBtn}
          onClick={(e) => {
            e.stopPropagation();
            onMenu?.(e);
          }}
        >
          {Ico.more}
        </IconBtn>
        <IconBtn
          title="Close session (⌘W)"
          danger={!ink}
          style={{ width: 22, height: 22 }}
          {...tintBtn}
          onClick={(e) => {
            e.stopPropagation();
            if (!confirmCloseRunningSession(session)) return;
            void closeSession(session);
          }}
        >
          {Ico.close}
        </IconBtn>
      </div>

      {/* Telemetry strip — only when the session has a real transcript tally
          (Claude w/ usage). Idle / non-Claude / pre-transcript panes drop it
          entirely rather than show a row of em-dashes. Context is shown as a raw
          token count (the transcript records no window max — no fake ratio). A
          tinted head grounds the strip on a dark mix so the default metric text
          stays legible (rather than fighting the vivid fill). */}
      {usage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "4px 12px",
            background: tint ? `color-mix(in oklab, ${tint} 26%, var(--bg-1))` : "var(--bg-1)",
            borderTop: tint
              ? `1px solid color-mix(in oklab, ${tint} 40%, var(--bd-soft))`
              : "1px solid var(--bd-soft)",
            fontSize: 10,
          }}
        >
          <MetricStat label="ctx" value={fmtTokens(usage.contextUsed)} />
          <MetricStat label="turn" value={String(usage.turns)} />
          <MetricStat label="tok" value={fmtTokens(usage.tokensIn + usage.tokensOut)} />
          <MetricStat label="edits" value={String(usage.edits)} />
        </div>
      )}
    </div>
  );
}
