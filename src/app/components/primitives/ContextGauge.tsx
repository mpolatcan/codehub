import { formatK } from "@/app/lib/format";

export interface ContextGaugeProps {
  used: number;
  max: number;
  label?: string;
  width?: number;
  // When the pane is tinted, the footer passes the paired contrast ink so the
  // label/value/track read against the colored fill (mirrors the pane head).
  ink?: string;
}

export function ContextGauge({ used, max, label = "ctx", width = 110, ink }: ContextGaugeProps) {
  // Guard max <= 0 so an unset/zero context window yields 0%, not NaN%.
  const pct = max > 0 ? Math.min(1, used / max) : 0;
  // Context-pressure thresholds stay as status colors even when tinted (a full
  // gauge is a warning that must still pop); the nominal fill uses the ink so it
  // reads on the colored bar instead of clashing.
  const barColor = pct > 0.85 ? "var(--err)" : pct > 0.7 ? "var(--wait)" : (ink ?? "var(--fg-1)");
  const dim = ink ? `color-mix(in oklab, ${ink} 62%, transparent)` : "var(--fg-3)";
  const strong = ink ?? "var(--fg-0)";
  const track = ink ? `color-mix(in oklab, ${ink} 20%, transparent)` : "var(--bg-3)";
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", height: "1.125rem" }}
    >
      <span style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-11)", color: dim }}>
        {label}
      </span>
      <span
        style={{
          width,
          height: "0.375rem",
          borderRadius: 999,
          background: track,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "block",
            width: `${pct * 100}%`,
            height: "100%",
            background: barColor,
            borderRadius: "inherit",
          }}
        />
      </span>
      <span
        className="mono tnum"
        style={{ fontSize: "var(--fs-12)", color: strong, fontWeight: 500 }}
      >
        {max > 0 ? (
          <>
            {formatK(used)}
            <span style={{ color: dim, fontWeight: 400 }}> / {formatK(max)}</span>
          </>
        ) : (
          // No context-window feed yet: em-dash, not a fake "0 / 0".
          <span style={{ color: dim }}>—</span>
        )}
      </span>
    </span>
  );
}
