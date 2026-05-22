import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";
import "./theme.css";
import "./tokens.css";
import "./panes.css";

const PrimitivesGallery = lazy(() => import("./dev/PrimitivesGallery"));
const DevPreview = lazy(() => import("./dev/DevPreview"));

// Apply the persisted dark/light theme before first paint (no flash).
applyTheme(getStoredTheme());

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

const hash = window.location.hash;
const isPrimitivesGallery = import.meta.env.DEV && hash === "#/__primitives";
const isScreenPreview = import.meta.env.DEV && hash.startsWith("#/__screens");

let view = <App />;
if (isPrimitivesGallery) {
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
}

createRoot(root).render(<StrictMode>{view}</StrictMode>);
