import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Spike } from "./Spike";

// StrictMode double-invokes effects in dev — a deliberately harsh test of the
// reparenting/cleanup logic. If the spike passes under StrictMode, it is sound.
createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Spike />
  </StrictMode>,
);
