import type { CSSProperties, ReactNode } from "react";

export interface TagProps {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}

export function Tag({ children, color, style }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--mono)",
        fontSize: 10.5,
        letterSpacing: "0.03em",
        color: color ?? "var(--fg-1)",
        background: color ? `color-mix(in oklab, ${color} 14%, transparent)` : "var(--bg-3)",
        border: `1px solid ${color ? `color-mix(in oklab, ${color} 35%, transparent)` : "var(--bd)"}`,
        padding: "2px 6px",
        borderRadius: 4,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
