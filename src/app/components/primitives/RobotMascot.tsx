import type { CSSProperties } from "react";
import sheet from "../../assets/mascot/robot-states.png";

// Pixel-art mascot for the Dynamic Island. One combined sprite sheet — 96×96 px
// frames, 8 frames per state (cols), 6 states (rows), 12 fps — animated entirely
// in CSS via `steps(8)` (no GIF: themeable, reduced-motion-safe, and the frame is
// swapped to the REAL aggregate agent state). The sheet is imported (Vite emits a
// relative hashed URL) so it resolves under BOTH the app's tauri:// origin and the
// island helper's file:// origin — an absolute `/…` path would 404 in the helper.
//
// Sizing is px (a fixed sprite grid, like AgentGlyph / the xterm glyph exemption):
// the inner 96px sprite is `transform: scale()`d to `size` so the pixel art stays
// crisp at any notch height.
export type MascotState = "idle" | "thinking" | "coding" | "building" | "success" | "error";

// Sheet row order (see codehub_mascot_manifest.json).
const ROW: Record<MascotState, number> = {
  idle: 0,
  thinking: 1,
  coding: 2,
  building: 3,
  success: 4,
  error: 5,
};

export function RobotMascot({
  state,
  size = 32,
  style,
}: {
  state: MascotState;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span className="mascot-box" style={{ width: size, height: size, ...style }} aria-hidden>
      <span
        className="mascot-sprite"
        style={{
          backgroundImage: `url(${sheet})`,
          backgroundPositionY: `${-ROW[state] * 96}px`,
          transform: `scale(${size / 96})`,
        }}
      />
    </span>
  );
}
