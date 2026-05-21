import { useEffect, useState } from "react";
import { PaneMount } from "./PaneMount";
import { creationCount, firstBufferLine, getOrCreatePane } from "./paneRegistry";

type Layout = "single-a" | "split" | "single-b" | "hidden";

// What each layout mounts. Anything not listed is parked in the stash.
const VISIBLE: Record<Layout, string[]> = {
  "single-a": ["a"],
  split: ["a", "b"],
  "single-b": ["b"],
  hidden: [],
};

interface Probe {
  creations: number;
  panes: { id: string; bornAt: number; line: string }[];
}

function probe(): Probe {
  return {
    creations: creationCount(),
    panes: ["a", "b"].map((id) => {
      const p = getOrCreatePane(id);
      return { id, bornAt: p.bornAt, line: firstBufferLine(p) };
    }),
  };
}

export function Spike() {
  const [layout, setLayout] = useState<Layout>("single-a");
  const [readout, setReadout] = useState<Probe>(() => probe());

  // Refresh the readout shortly after each layout change (after reparenting).
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout is the trigger, intentionally re-runs the probe on every layout switch.
  useEffect(() => {
    const t = setTimeout(() => setReadout(probe()), 80);
    return () => clearTimeout(t);
  }, [layout]);

  // Expose for headless verification.
  useEffect(() => {
    (window as unknown as { __spikeProbe: () => Probe }).__spikeProbe = probe;
  }, []);

  const visible = VISIBLE[layout];
  // Spike success: panes a,b each created exactly once (creations===2) and
  // their seeded born-marker is intact after reparenting.
  const pass =
    readout.creations === 2 &&
    readout.panes[0]?.bornAt === 1 &&
    readout.panes[1]?.bornAt === 2 &&
    readout.panes[0]?.line.includes("born #1") &&
    readout.panes[1]?.line.includes("born #2");

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0f1012",
        color: "#c9cdd4",
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <header
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #2a2e35",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <strong style={{ color: "#e8a33d" }}>xterm-reparent spike</strong>
        <button type="button" id="b-single-a" onClick={() => setLayout("single-a")}>
          single A
        </button>
        <button type="button" id="b-split" onClick={() => setLayout("split")}>
          split A|B
        </button>
        <button type="button" id="b-single-b" onClick={() => setLayout("single-b")}>
          single B (park A)
        </button>
        <button type="button" id="b-hidden" onClick={() => setLayout("hidden")}>
          hidden (tab away)
        </button>
        <span style={{ marginLeft: "auto" }}>
          layout: <code id="cur-layout">{layout}</code>
        </span>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0, padding: 12, gap: 12 }}>
        {visible.length === 0 ? (
          <div style={{ margin: "auto", color: "#5c636d" }}>
            both panes parked (simulating another tab)
          </div>
        ) : (
          visible.map((id) => (
            <div
              key={id}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                border: "1px solid #2a2e35",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  padding: "4px 8px",
                  background: "#16181c",
                  fontSize: 11,
                  color: "#8b929c",
                }}
              >
                pane {id}
              </div>
              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <PaneMount id={id} />
              </div>
            </div>
          ))
        )}
      </div>

      <footer
        id="spike-readout"
        style={{ padding: "10px 14px", borderTop: "1px solid #2a2e35", fontSize: 12 }}
      >
        <div>
          <strong>Terminal creations:</strong> <code id="creations">{readout.creations}</code>{" "}
          (expected 2)
        </div>
        {readout.panes.map((p) => (
          <div key={p.id}>
            pane {p.id}: born #<code>{p.bornAt}</code> — buffer: <code>{p.line}</code>
          </div>
        ))}
        <div
          id="spike-verdict"
          data-pass={pass}
          style={{ marginTop: 8, fontWeight: 700, color: pass ? "#6ee787" : "#d6604d" }}
        >
          {pass
            ? "PASS — terminals survived reparenting, no remount"
            : "checking… cycle the layouts"}
        </div>
      </footer>
    </div>
  );
}
