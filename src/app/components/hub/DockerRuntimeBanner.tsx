import { StatusDot } from "@/app/components/primitives/StatusDot";
import { Ico } from "@/app/components/primitives/icons";
import { ipc } from "@/app/lib/ipc";
import { recheckDocker, useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { type CSSProperties, useCallback, useState } from "react";

// Shared "container runtime is down" treatment for BOTH welcome surfaces (the
// first-run EmptyHero and the workspace launcher). Self-contained: it reads the
// real docker state from the store and renders NOTHING while the daemon is up, so
// callers just drop <DockerRuntimeBanner/> wherever it belongs. Two variants:
//   - nothing installed → err tone + install links
//   - installed but not running → warn tone + a Start button per runtime
// Nothing is fabricated — copy + actions are wired to real docker state/IPC.

const RUNTIME_LABELS: Record<string, string> = {
  docker: "Docker Desktop",
  orbstack: "OrbStack",
};
const RUNTIME_URLS: Record<string, string> = {
  docker: "https://www.docker.com/products/docker-desktop/",
  orbstack: "https://orbstack.dev",
};

// Shared docker-runtime state + the start action, so the welcome screens can BOTH
// render the banner AND gate their CTAs (a card "Open"/"Start" against a dead
// daemon is a dead-end) off the same truth.
export function useDockerRuntime() {
  const dockerInfo = useStore((s) => s.dockerInfo);
  const dockerRuntime = useStore((s) => s.dockerRuntime);
  const runtimeRunning = useStore((s) => s.status?.state === "running");
  const [starting, setStarting] = useState<string | null>(null);

  // `checked` gates the "down" verdict on an actual probe — null dockerInfo (boot,
  // not yet read) must NOT read as down, or every CTA flickers disabled on launch.
  const checked = dockerInfo !== null;
  const daemonUp = (dockerInfo?.reachable ?? false) || runtimeRunning;
  const down = checked && !daemonUp;
  const installed = dockerRuntime?.installed ?? [];
  const nothingInstalled = dockerRuntime !== null && installed.length === 0;

  // Launch the runtime app, then poll until the daemon answers (Docker Desktop's
  // cold boot can take ~30–60s). On reachable, recheckDocker() updates the store →
  // `down` flips false → the banner unmounts on its own (no manual reload). Bounded
  // so a failed boot resets the CTA instead of spinning "Starting…" forever.
  const startRuntime = useCallback(async (runtime: string) => {
    setStarting(runtime);
    try {
      await ipc.startDockerApp(runtime);
    } catch (e) {
      console.warn("start_docker_app failed", e);
      setStarting(null);
      return;
    }
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      if (await recheckDocker()) return; // store update unmounts the banner
    }
    setStarting(null);
  }, []);

  return {
    dockerInfo,
    checked,
    daemonUp,
    down,
    installed,
    nothingInstalled,
    starting,
    startRuntime,
    version: dockerInfo?.version ?? null,
  };
}

export function DockerRuntimeBanner({ style }: { style?: CSSProperties }) {
  const { down, nothingInstalled, installed, starting, startRuntime } = useDockerRuntime();
  if (!down) return null;

  const tone = nothingInstalled ? "var(--err)" : "var(--wait)";
  const title = nothingInstalled ? "No container runtime found" : "Container runtime isn't running";
  const subtext = nothingInstalled
    ? "Install Docker Desktop or OrbStack to run agents in isolated containers."
    : installed.length === 1
      ? `Start ${RUNTIME_LABELS[installed[0]] ?? installed[0]} to launch and resume agents.`
      : "Start a container runtime to launch and resume agents.";

  return (
    <div
      className="dash-rise"
      // biome-ignore lint/a11y/useSemanticElements: a tonal notice card is a generic live region, not an <output>
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.875rem 1rem 0.875rem 0.875rem",
        borderRadius: "0.625rem",
        border: `1px solid color-mix(in oklab, ${tone} 30%, var(--bd))`,
        background: `linear-gradient(180deg, color-mix(in oklab, ${tone} 9%, var(--bg-2)), var(--bg-2))`,
        boxShadow: `inset 0 1px 0 color-mix(in oklab, ${tone} 16%, transparent)`,
        ...style,
      }}
    >
      {/* runtime glyph tile + a status dot (pulsing while it can be started) */}
      <div style={{ position: "relative", flexShrink: 0, lineHeight: 0 }}>
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "0.5rem",
            background: `color-mix(in oklab, ${tone} 14%, var(--bg-1))`,
            border: `1px solid color-mix(in oklab, ${tone} 30%, var(--bd))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tone,
          }}
        >
          {Ico.container}
        </div>
        <span style={{ position: "absolute", right: "-0.1875rem", bottom: "-0.1875rem" }}>
          <StatusDot status={nothingInstalled ? "err" : "wait"} pulse={!nothingInstalled} />
        </span>
      </div>

      {/* title + one-line guidance */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--fs-13)", fontWeight: 600, color: "var(--fg-0)" }}>
          {title}
        </div>
        <div style={{ fontSize: "var(--fs-12)", color: "var(--fg-2)", lineHeight: 1.45 }}>
          {subtext}
        </div>
      </div>

      {/* actions: install links (none installed) or a Start button per runtime */}
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        {nothingInstalled
          ? ["docker", "orbstack"].map((rt) => (
              <Button key={rt} asChild size="sm" variant="outline">
                <a href={RUNTIME_URLS[rt]} target="_blank" rel="noreferrer">
                  Get {RUNTIME_LABELS[rt]}
                </a>
              </Button>
            ))
          : installed.map((rt) => (
              <Button
                key={rt}
                size="sm"
                variant={installed.length > 1 ? "outline" : "default"}
                disabled={starting !== null}
                onClick={() => void startRuntime(rt)}
              >
                {starting === rt ? (
                  <>
                    <span style={{ display: "inline-flex", lineHeight: 0 }}>{Ico.spinner}</span>
                    Starting…
                  </>
                ) : (
                  <>
                    <span style={{ display: "inline-flex", lineHeight: 0 }}>{Ico.play}</span>
                    Start {RUNTIME_LABELS[rt] ?? rt}
                  </>
                )}
              </Button>
            ))}
      </div>
    </div>
  );
}
