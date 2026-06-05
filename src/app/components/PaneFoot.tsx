import { ContextGauge } from "../components/primitives/ContextGauge";
import { MetricStat } from "../components/primitives/MetricStat";
import { Tip } from "../components/primitives/Tip";
import { Ico } from "../components/primitives/icons";
import { fmtTokens, useCodexUsage, useSessionUsage } from "../hooks/useSessionUsage";
import { useStore } from "../lib/store";
import { paneInk } from "../lib/tree";

// Pane FOOTER telemetry strip — moved out of PaneHead so the live tally sits at the
// bottom of the agent pane, reading as a status bar beneath the terminal. Shows the
// working dir, a context-window gauge (used / model max), the turn count, and total
// tokens. ALWAYS rendered from pane open: before the first turn there's no transcript
// yet, so the tally falls back to zeros (the gauge em-dashes an unknown window) rather
// than the strip popping in only once usage exists.
export function PaneFoot({ session }: { session: string }) {
  const meta = useStore((s) => s.sessionMeta[session]);
  const activity = useStore((s) => s.sessionActivity[session]);
  // Workspace mount dir — fallback label when the pane runs at the mount root.
  const wsDir = useStore((s) => {
    const m = s.sessionMeta[session];
    return m ? s.workspaces.find((w) => w.id === m.workspaceId)?.dir : undefined;
  });

  // Per-pane telemetry: Claude reads its transcript by claudeId, Codex its rollout
  // by codexId (notify thread-id). BOTH hooks run unconditionally and above the meta
  // guard (Rules of Hooks); the unused one gets a null id → null. The two usage
  // shapes are identical (turns / tokens / contextUsed / contextWindow).
  const claudeId = activity?.claudeId ?? (meta?.cli === "claude" ? meta.claudeId : undefined);
  const codexId = meta?.cli === "codex" ? (activity?.codexId ?? undefined) : undefined;
  const claudeUsage = useSessionUsage(claudeId ?? null);
  const codexUsage = useCodexUsage(codexId ?? null);
  const usage = claudeUsage ?? codexUsage;

  if (!meta) return null;

  // Zeros until the first turn produces a transcript (gauge em-dashes the unknown
  // window); keeps the strip in place from pane open instead of mounting on turn 1.
  const u = usage ?? { contextUsed: 0, contextWindow: 0, turns: 0, tokensIn: 0, tokensOut: 0 };

  // Working dir this pane targets: cwd basename when pinned to a sub-dir, else the
  // workspace mount's own folder name.
  const dirBase = (p: string) => p.split("/").filter(Boolean).pop() ?? p;
  const workingDir =
    meta.cwd && meta.cwd !== "/workspace"
      ? dirBase(meta.cwd)
      : wsDir
        ? dirBase(wsDir)
        : "workspace";

  // A picked pane color fills the whole footer to mirror the head, and `ink` is its
  // paired contrast foreground so the dir/gauge/turn/tok all flip to the legible
  // contrast color instead of staying on the neutral fg tokens (which washed out
  // against the fill). Undefined → neutral bar with the default fg tokens.
  const tint = meta.color;
  const ink = paneInk(tint);
  const dirColor = ink ?? "var(--fg-2)";
  const iconColor = ink ? `color-mix(in oklab, ${ink} 70%, transparent)` : "var(--fg-3)";
  const vrColor = ink ? `color-mix(in oklab, ${ink} 30%, transparent)` : undefined;

  return (
    <div
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.3125rem 0.75rem",
        background: tint ?? "var(--bg-1)",
        borderTop: ink
          ? `1px solid color-mix(in oklab, ${ink} 28%, transparent)`
          : "1px solid var(--bd-soft)",
        overflow: "hidden",
      }}
    >
      <Tip text={meta.cwd ?? wsDir ?? ""}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3125rem",
            minWidth: 0,
            maxWidth: "min(10rem, 100%)",
            fontFamily: "var(--mono)",
            fontSize: "var(--fs-11)",
            color: dirColor,
          }}
        >
          <span style={{ display: "inline-flex", flexShrink: 0, color: iconColor }}>
            {Ico.files}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {workingDir}
          </span>
        </span>
      </Tip>
      <span className="vr" style={{ height: "0.875rem", background: vrColor }} />
      <ContextGauge used={u.contextUsed} max={u.contextWindow} width={64} ink={ink} />
      <span className="vr" style={{ height: "0.875rem", background: vrColor }} />
      <MetricStat label="turn" value={String(u.turns)} ink={ink} />
      <MetricStat label="tok" value={fmtTokens(u.tokensIn + u.tokensOut)} ink={ink} />
    </div>
  );
}
