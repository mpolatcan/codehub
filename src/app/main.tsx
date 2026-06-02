import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";
import "./fonts.css";
import "./theme.css";
import "./tokens.css";
import "./panes.css";

const PrimitivesGallery = lazy(() => import("./dev/PrimitivesGallery"));
const DevPreview = lazy(() => import("./dev/DevPreview"));
// Dev-only loading/error/empty-state gallery (F-OVERLAYS). Reachable at
// #/__states; the reusable building blocks live in screens/States.tsx.
const StatesGallery = lazy(() => import("./screens/States"));
// Dev-only Dynamic-Island announce-card preview (#/__island).
const IslandPreview = lazy(() => import("./dev/IslandPreview"));
// Content of the macOS Dynamic Island window (P5, macOS-only). NOT dev-gated —
// `island.rs` loads index.html#/island as a real transparent second window at
// the notch; the route polls the activity feed and announces agent events.
const Island = lazy(() => import("./screens/Island").then((m) => ({ default: m.Island })));

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

const hash = window.location.hash;
const isIsland = hash === "#/island";
const isPrimitivesGallery = import.meta.env.DEV && hash === "#/__primitives";
const isScreenPreview = import.meta.env.DEV && hash.startsWith("#/__screens");
const isStatesGallery = import.meta.env.DEV && hash.startsWith("#/__states");
const isIslandPreview = import.meta.env.DEV && hash.startsWith("#/__island");

// Apply the persisted dark/light theme before first paint (no flash). The
// Dynamic Island sits behind the physical (black) notch, so it is ALWAYS dark
// regardless of the app theme — a light card growing from a black notch reads
// broken.
applyTheme(isIsland || isIslandPreview ? "dark" : getStoredTheme());

let view = <App />;
if (isIsland) {
  view = (
    <Suspense fallback={null}>
      <Island />
    </Suspense>
  );
} else if (isStatesGallery) {
  view = (
    <Suspense fallback={null}>
      <StatesGallery />
    </Suspense>
  );
} else if (isPrimitivesGallery) {
  view = (
    <Suspense fallback={null}>
      <PrimitivesGallery />
    </Suspense>
  );
} else if (isScreenPreview) {
  view = (
    <Suspense fallback={null}>
      <DevPreview />
    </Suspense>
  );
} else if (isIslandPreview) {
  view = (
    <Suspense fallback={null}>
      <IslandPreview />
    </Suspense>
  );
}

createRoot(root).render(<StrictMode>{view}</StrictMode>);
