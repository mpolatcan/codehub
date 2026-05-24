/**
 * Character — a placeholder character glyph (the agent "mascot" face). Phase-0
 * stub primitive: a simple SVG face tinted by the agent accent, standing in
 * until the fleet ships the real character art. Reuses the agent accent tokens.
 */
import type { CSSProperties } from "react";

export interface CharacterProps {
  agent?: string;
  size?: number;
  style?: CSSProperties;
}

// Map an agent id to its accent token; unknown agents fall back to neutral.
function accentFor(agent: string): string {
  switch (agent) {
    case "claude":
      return "var(--a-claude)";
    case "codex":
      return "var(--a-codex)";
    case "antigravity":
      return "var(--a-antigravity)";
    case "shell":
      return "var(--a-shell)";
    default:
      return "var(--fg-2)";
  }
}

export function Character({ agent = "claude", size = 18, style }: CharacterProps) {
  const accent = accentFor(agent);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      role="img"
      aria-label={`${agent} character`}
    >
      {/* head */}
      <circle cx="12" cy="12" r="9" fill="none" stroke={accent} strokeWidth="1.5" />
      {/* eyes */}
      <circle cx="9" cy="10.5" r="1.1" fill={accent} />
      <circle cx="15" cy="10.5" r="1.1" fill={accent} />
      {/* smile */}
      <path
        d="M8.5 14.5 Q12 17 15.5 14.5"
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
