import { ContextGauge } from "../components/primitives/ContextGauge";
import { MetricStat } from "../components/primitives/MetricStat";
import { fmtTokens, useCodexUsage, useSessionUsage } from "../hooks/useSessionUsage";
import { useStore } from "../lib/store";

// Pane FOOTER telemetry strip — moved out of PaneHead so the live tally sits at the
// bottom of the agent pane, reading as a status bar beneath the terminal. Shows a
// context-window gauge (used / model max), the turn count, and total tokens. No
// edits metric (dropped for both Claude and Codex). Renders nothing until the
// session has a real tally (Claude transcript / Codex rollout) — an idle or
// pre-transcript pane drops the strip rather than show em-dashes.
export function PaneFoot({ session }: { session: string }) {
  const meta = useStore((s) => s.sessionMeta[session]);
  const activity = useStore((s) => s.sessionActivity[session]);

  // Per-pane telemetry: Claude reads its transcript by claudeId, Codex its rollout
  // by codexId (notify thread-id). BOTH hooks run unconditionally and above the meta
  // guard (Rules of Hooks); the unused one gets a null id → null. The two usage
  // shapes are identical (turns / tokens / contextUsed / contextWindow).
  const claudeId = activity?.claudeId ?? (meta?.cli === "claude" ? meta.claudeId : undefined);
  const codexId = meta?.cli === "codex" ? (activity?.codexId ?? undefined) : undefined;
  const claudeUsage = useSessionUsage(claudeId ?? null);
  const codexUsage = useCodexUsage(codexId ?? null);
  const usage = claudeUsage ?? codexUsage;

  if (!meta || !usage) return null;

  // A picked pane color tints the footer to match the head; the gauge/metrics
  // grounded on a dark mix so their default text stays legible over the fill.
  const tint = meta.color;

  return (
    <div
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "5px 12px",
        background: tint ? `color-mix(in oklab, ${tint} 22%, var(--bg-1))` : "var(--bg-1)",
        borderTop: tint
          ? `1px solid color-mix(in oklab, ${tint} 40%, var(--bd-soft))`
          : "1px solid var(--bd-soft)",
        overflow: "hidden",
      }}
    >
      <ContextGauge used={usage.contextUsed} max={usage.contextWindow} width={84} />
      <span className="vr" style={{ height: 14 }} />
      <MetricStat label="turn" value={String(usage.turns)} />
      <MetricStat label="tok" value={fmtTokens(usage.tokensIn + usage.tokensOut)} />
    </div>
  );
}
