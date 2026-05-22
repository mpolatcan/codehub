import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";
import "./tokens.css";
import "./panes.css";

const PrimitivesGallery = lazy(() => import("./dev/PrimitivesGallery"));

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

const isPrimitivesGallery = import.meta.env.DEV && window.location.hash === "#/__primitives";

createRoot(root).render(
  <StrictMode>
    {isPrimitivesGallery ? (
      <Suspense fallback={null}>
        <PrimitivesGallery />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
