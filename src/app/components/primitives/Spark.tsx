export interface SparkProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
  /** Stretch to fill parent container instead of using fixed w/h pixel size. */
  responsive?: boolean;
  /**
   * Damp near-constant series: when the data barely varies (e.g. an idle CPU or
   * zero net rate), don't amplify the micro-noise into a full-height ramp/block —
   * render a quiet low baseline so "no activity" reads as calm, not broken.
   */
  calm?: boolean;
}

export function Spark({
  data,
  w = 60,
  h = 16,
  color = "var(--fg-1)",
  fill = false,
  responsive = false,
  calm = false,
}: SparkProps) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  // A series whose spread is a tiny fraction of its range is effectively flat;
  // pin it to a low baseline instead of letting normalization blow it up.
  const spread = Math.max(...data) - Math.min(...data);
  const flat = calm && spread / range < 0.04;
  // Flat series sit mid-height (a calm "steady" line with a half fill) rather than
  // hugging the floor and leaving the card empty above.
  const yOf = (v: number) => (flat ? h - (h - 2) * 0.5 - 1 : h - ((v - min) / range) * (h - 2) - 1);
  const pts: [number, number][] = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    return [x, yOf(v)];
  });
  const path = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg
      {...(responsive
        ? { viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: "none" }
        : { width: w, height: h })}
      style={
        responsive ? { display: "block", width: "100%", height: "100%" } : { display: "block" }
      }
      aria-hidden="true"
    >
      {fill && <path d={area} fill={color} opacity="0.15" />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
