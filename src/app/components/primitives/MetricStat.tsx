export interface MetricStatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  mono?: boolean;
  spend?: "warn" | "over" | "ok";
  // When the pane is tinted, the footer passes the paired contrast ink so the
  // label + value read against the colored fill (mirrors the pane head).
  ink?: string;
}

export function MetricStat({
  label,
  value,
  delta,
  deltaTone,
  mono = true,
  spend,
  ink,
}: MetricStatProps) {
  // Spend signals override the ink (they're a warning that must still pop).
  let valueColor = ink ?? "var(--fg-0)";
  if (spend === "warn") valueColor = "var(--spend-warn)";
  else if (spend === "over") valueColor = "var(--spend-over)";

  const labelColor = ink ? `color-mix(in oklab, ${ink} 62%, transparent)` : "var(--fg-3)";
  const dtone =
    deltaTone === "up"
      ? "var(--live)"
      : deltaTone === "down"
        ? "var(--err)"
        : ink
          ? `color-mix(in oklab, ${ink} 70%, transparent)`
          : "var(--fg-2)";

  return (
    <span
      style={{
        display: "inline-flex",
        // Center (not baseline) so a row mixing MetricStat with ContextGauge — which
        // vertically-centers its text around the gauge bar — keeps every label and
        // value on one line (pane footer).
        alignItems: "center",
        gap: "0.375rem",
        height: "1.125rem",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "var(--fs-11)",
          color: labelColor,
          fontWeight: 400,
        }}
      >
        {label}
      </span>
      <span
        className={mono ? "mono tnum" : "tnum"}
        style={{ fontSize: "var(--fs-13)", color: valueColor, fontWeight: 500 }}
      >
        {value}
      </span>
      {delta && (
        <span
          className="mono"
          style={{ fontSize: "var(--fs-11)", color: dtone, marginLeft: "-0.125rem" }}
        >
          {delta}
        </span>
      )}
    </span>
  );
}
