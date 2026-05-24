/**
 * CompanionAvatar — a minimal avatar with a working/idle status ring, for the
 * always-on-top companion + Hub session rows. Phase-0 stub primitive: real,
 * minimal; the fleet wires the live activity signal into `working`.
 */
import type { CSSProperties } from "react";
import { Character } from "./Character";

export interface CompanionAvatarProps {
  /** Agent identity, drives the glyph + accent. */
  agent?: string;
  /** Live working/idle ring (working → --live, else neutral). */
  working?: boolean;
  size?: number;
  style?: CSSProperties;
}

export function CompanionAvatar({
  agent = "claude",
  working = false,
  size = 28,
  style,
}: CompanionAvatarProps) {
  const ring = working ? "var(--live)" : "var(--bd-strong)";
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-2)",
        boxShadow: `0 0 0 1.5px ${ring}`,
        flexShrink: 0,
        ...style,
      }}
    >
      <Character agent={agent} size={Math.round(size * 0.58)} />
    </span>
  );
}
