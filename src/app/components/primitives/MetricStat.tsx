export interface MetricStatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  mono?: boolean;
  spend?: "warn" | "over" | "ok";
}

export function MetricStat({
  label,
  value,
  delta,
  deltaTone,
  mono = true,
  spend,
}: MetricStatProps) {
  let valueColor = "var(--fg-0)";
  if (spend === "warn") valueColor = "var(--spend-warn)";
  else if (spend === "over") valueColor = "var(--spend-over)";

  const dtone =
    deltaTone === "up" ? "var(--live)" : deltaTone === "down" ? "var(--err)" : "var(--fg-2)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        height: 18,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--fg-3)",
          fontWeight: 400,
        }}
      >
        {label}
      </span>
      <span
        className={mono ? "mono tnum" : "tnum"}
        style={{ fontSize: 12.5, color: valueColor, fontWeight: 500 }}
      >
        {value}
      </span>
      {delta && (
        <span className="mono" style={{ fontSize: 10.5, color: dtone, marginLeft: -2 }}>
          {delta}
        </span>
      )}
    </span>
  );
}
