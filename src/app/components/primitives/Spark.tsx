export interface SparkProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}

export function Spark({ data, w = 60, h = 16, color = "var(--fg-1)", fill = false }: SparkProps) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts: [number, number][] = data.map((v, i) => {
    // Single-point series would divide by zero; pin it to the middle.
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return [x, y];
  });
  const path = `M ${pts.map((p) => p.join(" ")).join(" L ")}`;
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      {fill && <path d={area} fill={color} opacity="0.15" />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
