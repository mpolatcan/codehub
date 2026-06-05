import type { CSSProperties } from "react";
import building from "../../assets/mascot/gifs/building.gif";
import coding from "../../assets/mascot/gifs/coding.gif";
import error from "../../assets/mascot/gifs/error.gif";
import idle from "../../assets/mascot/gifs/idle.gif";
import success from "../../assets/mascot/gifs/success.gif";
import thinking from "../../assets/mascot/gifs/thinking.gif";
import type { MascotState } from "./RobotMascot";

// Animated mascot — a transparent robot-only status-bar GIF per state (the robot fills
// the canvas, no desk scene). One GIF per state, swapped by `src` so the browser only
// fetches the active one (the others stay unrequested even though Vite bundles all six).
// GIFs are imported (Vite emits relative hashed URLs) so they resolve under BOTH the
// app's tauri:// origin and the island helper's file:// origin. Pixel art → kept crisp
// with `image-rendering: pixelated`. Sizes/offsets are px (a fixed art asset, like
// RobotMascot / AgentGlyph), exempt from the rem rule.
//
// `zoom`/`focusX`/`focusY` can FOCAL-CROP the frame (box=`size`, image drawn `size·zoom`
// and shifted so the focal point lands at box center, overflow clipped) — but the
// robot-only assets fill the frame, so both the collapsed notch and the expanded banner
// use the default `zoom=1` (whole frame). The crop knobs are retained for future
// non-square / off-center art.
const SRC: Record<MascotState, string> = {
  idle,
  thinking,
  coding,
  building,
  success,
  error,
};

export function MascotGif({
  state,
  size = 72,
  zoom = 1,
  focusX = 0.5,
  focusY = 0.5,
  radius = "0.625rem",
  style,
}: {
  state: MascotState;
  size?: number;
  zoom?: number;
  focusX?: number;
  focusY?: number;
  radius?: string;
  style?: CSSProperties;
}) {
  const inner = size * zoom;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={SRC[state]}
        alt=""
        aria-hidden
        width={inner}
        height={inner}
        style={{
          position: "absolute",
          left: size / 2 - focusX * inner,
          top: size / 2 - focusY * inner,
          width: inner,
          height: inner,
          // Tailwind preflight sets `img { max-width: 100% }`, which would clamp the
          // zoomed image back to the box width and break the focal crop — opt out.
          maxWidth: "none",
          display: "block",
          imageRendering: "pixelated",
        }}
      />
    </span>
  );
}
