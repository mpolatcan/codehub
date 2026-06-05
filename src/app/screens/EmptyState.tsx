/**
 * EmptyState — first-run / no-sessions hero.
 *
 * Two exports:
 *  - `EmptyHero` — just the hero column. Used inside the live Hub shell (App.tsx),
 *    which supplies its own sidebar + activity rail.
 *  - `EmptyState` — hero + a standalone aside, for the dev screen preview
 *    (#/__screens) where there is no surrounding shell.
 *
 * Design philosophy: agent-first, not setup-first. The hero leads with the value
 * prop and "New workspace" CTA, then shows agent cards as the primary content.
 * Docker status and API keys are guidance, not a gate — each surfaces inline
 * where it's relevant (Docker as an actionable banner, keys on agent cards).
 */
import { DockerRuntimeBanner, useDockerRuntime } from "@/app/components/hub/DockerRuntimeBanner";
import { AGENT_META, AgentGlyph, type AgentId } from "@/app/components/primitives/AgentGlyph";
import { Logo } from "@/app/components/primitives/Logo";
import { RobotMascot } from "@/app/components/primitives/RobotMascot";
import { StatusDot } from "@/app/components/primitives/StatusDot";
import { Tip } from "@/app/components/primitives/Tip";
import { Ico } from "@/app/components/primitives/icons";
import { CLIS } from "@/app/lib/catalog";
import type { Cli } from "@/app/lib/ipc";
import { useOverlay } from "@/app/lib/overlay";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { type ReactNode, useEffect, useRef } from "react";

export interface EmptyStateProps {
  onNew?: (cli?: Cli) => void;
}

export function EmptyHero({ onNew }: EmptyStateProps) {
  const keyStatus = useStore((s) => s.keyStatus);
  const setView = useStore((s) => s.setView);
  const setSettingsSection = useStore((s) => s.setSettingsSection);
  const openWizard = useOverlay((s) => s.setNewWorkspace);
  // Shared docker truth: `checked` gates the status pill, `daemonUp` drives its
  // dot/label, `down` dims the "New workspace" CTA (a dead-end with no runtime) so
  // the banner's "Start Docker" reads as the primary action.
  const { checked, daemonUp, down, version } = useDockerRuntime();

  const goToKeys = () => {
    setSettingsSection("agents");
    setView("settings");
  };

  // Cursor spotlight: write the pointer position into CSS vars on the host (no React
  // re-render — direct style writes, rAF-throttled). The `.empty-spotlight` layer
  // reads them. Disabled under reduced-motion.
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main
      ref={heroRef}
      className="empty-hero"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--bg-1)",
        position: "relative",
        color: "var(--fg-1)",
      }}
    >
      {/* Layered backdrop: base radial wash · masked dot-grid · primary top-glow
          · bottom vignette. Builds depth so the screen reads as designed space,
          not a flat void. */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 90% 70% at 50% 28%, var(--bg-2), var(--bg-1) 72%)",
          }}
        />
        <div className="empty-grid" style={{ position: "absolute", inset: 0 }} />
        <div
          className="empty-glow"
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 0%",
            background:
              "radial-gradient(ellipse 55% 45% at 50% 0%, color-mix(in oklab, var(--pri) 11%, transparent), transparent 68%)",
          }}
        />
        {/* interactive cursor spotlight — fades in while the pointer is over the hero */}
        <div className="empty-spotlight" style={{ position: "absolute", inset: 0 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 58%, color-mix(in oklab, var(--bg-0) 55%, transparent))",
          }}
        />
        {/* film grain — subtle texture for depth */}
        <div className="empty-grain" style={{ position: "absolute", inset: 0 }} />
      </div>

      <div
        className="scroll"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "2.5rem 3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* margin:auto vertically centers the column yet stays scrollable when the
            viewport is short (justify-content:center would clip the top). */}
        <div style={{ margin: "auto 0", maxWidth: "min(56rem, 100%)", width: "100%" }}>
          {/* hero header — orchestrated load reveal: mascot → title → subtitle →
              CTAs cascade in via staggered dash-rise delays. */}
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            {/* brand mascot — the friendly pixel robot that also lives in the
                Dynamic Island; anchors first run with personality + a soft glow. */}
            <div
              className="dash-rise"
              style={{ position: "relative", display: "inline-flex", marginBottom: "0.5rem" }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-40% -40% -25%",
                  background:
                    "radial-gradient(circle at 50% 45%, color-mix(in oklab, var(--pri) 26%, transparent), transparent 70%)",
                  filter: "blur(0.5rem)",
                  pointerEvents: "none",
                }}
              />
              <RobotMascot state="idle" size={54} style={{ position: "relative" }} />
            </div>
            <h1
              className="dash-rise"
              style={{
                animationDelay: "0.05s",
                margin: 0,
                fontSize: "var(--fs-26)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--fg-0)",
                lineHeight: 1.12,
              }}
            >
              Run coding agents,
              <br />
              <span style={{ color: "var(--fg-2)" }}>side by side, in containers.</span>
            </h1>
            <p
              className="dash-rise"
              style={{
                animationDelay: "0.1s",
                margin: "0.875rem auto 0",
                maxWidth: "min(34rem, 100%)",
                fontSize: "var(--fs-14)",
                color: "var(--fg-2)",
                lineHeight: 1.6,
              }}
            >
              Each session spawns a fresh tmux in a per-workspace container — your repo is mounted
              and credentials live in an encrypted local vault.
            </p>
            <div
              className="dash-rise"
              style={{
                animationDelay: "0.15s",
                marginTop: "1.125rem",
                display: "flex",
                gap: "0.625rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Tip
                text={
                  down
                    ? "Start a container runtime first — a workspace needs one"
                    : "Create a new workspace"
                }
              >
                <span style={{ display: "inline-flex" }}>
                  <Button onClick={() => openWizard(true)} disabled={down}>
                    {Ico.plus}New workspace
                  </Button>
                </span>
              </Tip>
              <Tip text="Manage coding agents & API keys">
                <Button variant="outline" onClick={goToKeys}>
                  {Ico.settings}Set up agents
                </Button>
              </Tip>
            </div>
          </div>

          {/* Docker not running / not installed — shared, self-gating banner. While
              down it owns the primary action (Start Docker), so the dimmed "New
              workspace" above defers to it. */}
          <DockerRuntimeBanner style={{ marginBottom: "1.5rem" }} />

          {/* agent cards — primary content */}
          <div
            className="lbl dash-rise"
            style={{
              animationDelay: "0.2s",
              marginBottom: "0.75rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            Choose an agent to get started
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(13rem, 100%), 1fr))",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {CLIS.map((c, i) => (
              <AgentCard
                key={c.id}
                agent={c.id}
                name={c.label}
                keySet={keyStatus?.[c.id]?.present ?? false}
                onStart={() => onNew?.(c.id)}
                onSetupKey={goToKeys}
                delay={0.24 + i * 0.05}
              />
            ))}
          </div>

          {/* "How it works" flow — fills the lower screen with the real 3-step
              lifecycle so the page reads as a complete onboarding surface. */}
          <div className="dash-rise" style={{ animationDelay: "0.4s" }}>
            <HowItWorks />
          </div>

          {/* terminal-style status bar — relocates Docker status off the top into a
              bottom bar paired with real keyboard shortcuts (the app's command deck). */}
          <HeroStatusBar checked={checked} daemonUp={daemonUp} version={version} />
        </div>
      </div>
    </main>
  );
}

const STEPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: Ico.container,
    title: "Create a workspace",
    body: "Mount a repo into a fresh, isolated container.",
  },
  {
    icon: Ico.terminal,
    title: "Spawn agents",
    body: "Launch Claude, Codex & more — each in its own pane.",
  },
  {
    icon: Ico.grid,
    title: "Work in parallel",
    body: "Multiplex sessions with tmux, side by side.",
  },
];

function HowItWorks() {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: "0.75rem", textAlign: "center" }}>
        How it works
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {STEPS.map((s, i) => (
          <div key={s.title} style={{ display: "contents" }}>
            <div
              style={{
                flex: "1 1 0",
                minWidth: "11rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4375rem",
                padding: "0.875rem",
                borderRadius: "0.625rem",
                border: "1px solid var(--bd-soft)",
                background: "color-mix(in oklab, var(--bg-2) 55%, transparent)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  className="mono tnum"
                  style={{
                    width: "1.375rem",
                    height: "1.375rem",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.4375rem",
                    fontSize: "var(--fs-11)",
                    fontWeight: 600,
                    color: "var(--pri)",
                    background: "var(--pri-dim)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--fg-3)", display: "inline-flex" }}>{s.icon}</span>
                <span style={{ fontSize: "var(--fs-13)", fontWeight: 600, color: "var(--fg-0)" }}>
                  {s.title}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--fs-12)",
                  color: "var(--fg-2)",
                  lineHeight: 1.5,
                }}
              >
                {s.body}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "var(--fg-3)",
                  flexShrink: 0,
                }}
              >
                {Ico.arrowR}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ onNew }: EmptyStateProps) {
  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, height: "100%", color: "var(--fg-1)" }}>
      <aside
        style={{
          width: "clamp(11rem, 22vw, 15rem)",
          flexShrink: 0,
          background: "var(--bg-1)",
          borderRight: "1px solid var(--bd-soft)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{ padding: "0.75rem 0.875rem 0.625rem", borderBottom: "1px solid var(--bd-soft)" }}
        >
          <Logo />
        </div>
        <div style={{ padding: "0.625rem 0.625rem 0.375rem" }}>
          <Button
            onClick={() => onNew?.()}
            style={{ justifyContent: "space-between", width: "100%" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {Ico.plus}New agent
            </span>
            <span style={{ display: "flex", gap: "0.125rem", opacity: 0.7 }}>
              <span className="kbd">⌘</span>
              <span className="kbd">N</span>
            </span>
          </Button>
        </div>
        <div style={{ padding: "0.625rem 0.625rem 0.25rem" }}>
          <div className="lbl" style={{ padding: "0 0.25rem 0.375rem" }}>
            Views
          </div>
          <div className="side-item active">
            {Ico.hub}
            <span style={{ flex: 1 }}>Hub</span>
          </div>
          <div className="side-item" style={{ opacity: 0.4 }}>
            {Ico.settings}
            <span style={{ flex: 1 }}>Settings</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "0.875rem 0.625rem 0.25rem" }}>
          <div className="lbl" style={{ padding: "0 0.25rem 0.375rem" }}>
            Sessions · 0
          </div>
        </div>
      </aside>
      <EmptyHero onNew={onNew} />
    </div>
  );
}

function AgentCard({
  agent,
  name,
  keySet,
  onStart,
  onSetupKey,
  delay = 0,
}: {
  agent: AgentId;
  name: string;
  keySet?: boolean;
  onStart?: () => void;
  onSetupKey?: () => void;
  delay?: number;
}) {
  const meta = AGENT_META[agent];
  return (
    <Tip
      text={keySet ? `Start a session with ${name}` : `Open agent setup to add a key for ${name}`}
    >
      <button
        type="button"
        className="ch-card-interactive agent-pick dash-rise"
        onClick={keySet ? onStart : onSetupKey}
        // --agent-accent feeds the hover ring/glow + CTA color (see tokens.css)
        style={{ ["--agent-accent" as string]: meta.accent, animationDelay: `${delay}s` }}
      >
        <div className="agent-pick-icon">
          <span style={{ transform: "scale(1.4)" }}>
            <AgentGlyph agent={agent} size={14} color={meta.accent} />
          </span>
        </div>
        <span style={{ fontSize: "var(--fs-16)", fontWeight: 600, color: "var(--fg-0)" }}>
          {name}
        </span>
        {/* real key state, not a label — tells the user which agents are ready */}
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "var(--fs-11)",
            color: "var(--fg-2)",
          }}
        >
          <StatusDot status={keySet ? "live" : "off"} />
          {keySet ? "API key ready" : "No API key"}
        </span>
        <span
          className="mono agent-pick-cta"
          style={{
            marginTop: "0.125rem",
            fontSize: "var(--fs-12)",
            fontWeight: 600,
            color: keySet ? "var(--agent-accent)" : "var(--fg-2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {keySet ? "Start" : "Setup"} {Ico.arrowR}
        </span>
      </button>
    </Tip>
  );
}

// Real, in-app keyboard bindings (kept in lockstep with useKeyboard.ts).
const HERO_KEYS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "T"], label: "launcher" },
  { keys: ["⌘", "N"], label: "new agent" },
  { keys: ["⌘", "\\"], label: "split" },
  { keys: ["⌘", "B"], label: "sidebar" },
];

function HeroStatusBar({
  checked,
  daemonUp,
  version,
}: {
  checked: boolean;
  daemonUp: boolean;
  version: string | null;
}) {
  return (
    <div
      className="dash-rise"
      style={{
        animationDelay: "0.45s",
        marginTop: "1.125rem",
        paddingTop: "0.75rem",
        borderTop: "1px solid var(--bd-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        fontFamily: "var(--mono)",
        fontSize: "var(--fs-11)",
      }}
    >
      {/* runtime status, terminal-prompt styled */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--fg-2)",
        }}
      >
        <span style={{ color: "var(--fg-3)" }}>❯</span>
        <StatusDot status={!checked ? "idle" : daemonUp ? "live" : "wait"} pulse={daemonUp} />
        {!checked
          ? "checking runtime…"
          : daemonUp
            ? "docker daemon connected"
            : "waiting for docker daemon"}
        {version && <span style={{ color: "var(--fg-3)" }}>· {version}</span>}
        <span className="hero-caret" aria-hidden>
          ▋
        </span>
      </span>
      {/* real keyboard shortcuts — the command deck */}
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}
      >
        {HERO_KEYS.map(({ keys, label }) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3125rem",
              color: "var(--fg-3)",
            }}
          >
            {keys.map((k) => (
              <span key={k} className="kbd">
                {k}
              </span>
            ))}
            <span style={{ color: "var(--fg-2)" }}>{label}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
