/**
 * EmptyState — first-run / no-sessions hero. Ported from design/screens/empty-state.jsx.
 *
 * P2 scope: presentational. The full app chrome (aside sidebar) is reproduced
 * for the standalone preview; in P3 this becomes the no-sessions body inside the
 * real shell. The docker-info pill, agent versions, and key checklist use
 * placeholder data pending Tier-1 IPC (docker_info / agent_versions /
 * agent_key_status — see BACKEND_PLAN.md). "New agent" / "Start with…" call the
 * optional `onNew` prop, wired to the spawn flow in P3.
 *
 * Copy note: keys are forwarded from the host environment, not an OS keychain
 * (BACKEND_PLAN.md decision) — wording corrected from the design.
 */
import { AGENT_META, AgentGlyph, type AgentId } from "@/app/components/primitives/AgentGlyph";
import { Logo } from "@/app/components/primitives/Logo";
import { StatusDot } from "@/app/components/primitives/StatusDot";
import { Ico } from "@/app/components/primitives/icons";
import { CLIS } from "@/app/lib/catalog";
import type { Cli } from "@/app/lib/ipc";
import { Button } from "@/app/ui/button";

export interface EmptyStateProps {
  onNew?: (cli?: Cli) => void;
}

// Placeholder per-agent copy. Descriptions are static; version + keySet are
// stand-ins until agent_versions / agent_key_status (Tier 1) are wired.
const AGENT_COPY: Record<Cli, { desc: string; version: string; keySet: boolean }> = {
  claude: {
    desc: "Long-context refactors, planned edits, deep code reading.",
    version: "—",
    keySet: true,
  },
  codex: {
    desc: "Snappy iteration, safe shell tools, focused diffs.",
    version: "—",
    keySet: false,
  },
  antigravity: {
    desc: "Multi-step automations, profiling, longer-running analyses.",
    version: "—",
    keySet: false,
  },
};

export function EmptyState({ onNew }: EmptyStateProps) {
  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, height: "100%", color: "var(--fg-1)" }}>
      {/* aside */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--bg-1)",
          borderRight: "1px solid var(--bd-soft)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--bd-soft)" }}>
          <Logo />
        </div>
        <div style={{ padding: "10px 10px 6px" }}>
          <Button
            onClick={() => onNew?.()}
            style={{ justifyContent: "space-between", width: "100%" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {Ico.plus}New agent
            </span>
            <span style={{ display: "flex", gap: 2, opacity: 0.7 }}>
              <span className="kbd">⌘</span>
              <span className="kbd">N</span>
            </span>
          </Button>
        </div>

        <div style={{ padding: "10px 10px 4px" }}>
          <div className="lbl" style={{ padding: "0 4px 6px" }}>
            Views
          </div>
          <div className="side-item active">
            {Ico.hub}
            <span style={{ flex: 1 }}>Hub</span>
          </div>
          <div className="side-item" style={{ opacity: 0.4 }}>
            {Ico.grid}
            <span style={{ flex: 1 }}>Dashboard</span>
          </div>
          <div className="side-item" style={{ opacity: 0.4 }}>
            {Ico.container}
            <span style={{ flex: 1 }}>Containers</span>
          </div>
          <div className="side-item">
            {Ico.settings}
            <span style={{ flex: 1 }}>Settings</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "14px 10px 4px" }}>
          <div className="lbl" style={{ padding: "0 4px 6px" }}>
            Sessions · 0
          </div>
          <div
            style={{
              padding: "20px 12px",
              textAlign: "center",
              border: "1px dashed var(--bd)",
              borderRadius: 8,
              fontSize: 11.5,
              color: "var(--fg-2)",
              lineHeight: 1.55,
            }}
          >
            No sessions yet.
            <br />
            <span className="mono" style={{ color: "var(--fg-3)" }}>
              ⌘N
            </span>{" "}
            to start one.
          </div>
        </div>
      </aside>

      {/* hero */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "var(--bg-1)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(0deg, transparent 0 19px, var(--bd-soft) 19px 20px), radial-gradient(ellipse at 50% 30%, var(--bg-2), var(--bg-1) 70%)",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "60px 60px 30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ maxWidth: 880, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              {/* docker_info (Tier 1) not wired — placeholder pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  border: "1px solid var(--bd)",
                  borderRadius: 999,
                  fontSize: 11,
                  color: "var(--fg-2)",
                  fontFamily: "var(--mono)",
                  marginBottom: 22,
                }}
              >
                <span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--live)" }}
                />
                docker daemon connected
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--fg-0)",
                }}
              >
                Run coding agents,
                <br />
                <span style={{ color: "var(--fg-2)" }}>side by side, in containers.</span>
              </h1>
              <p
                style={{
                  margin: "14px auto 0",
                  maxWidth: 520,
                  fontSize: 14,
                  color: "var(--fg-2)",
                  lineHeight: 1.55,
                }}
              >
                Each session spawns a fresh tmux on a shared Docker runtime — your repo is mounted,
                your API keys are forwarded from the host environment, and you can compare agents in
                split panes.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {CLIS.map((c) => (
                <BigAgentCard
                  key={c.id}
                  agent={c.id}
                  name={c.label}
                  desc={AGENT_COPY[c.id].desc}
                  version={AGENT_COPY[c.id].version}
                  keySet={AGENT_COPY[c.id].keySet}
                  onStart={() => onNew?.(c.id)}
                />
              ))}
            </div>

            {/* Setup checklist — placeholder until docker_info / agent_key_status */}
            <div className="ch-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="lbl">Setup</span>
                <div className="bar thin" style={{ flex: 1, maxWidth: 220 }}>
                  <i style={{ width: "50%", background: "var(--live)" }} />
                </div>
              </div>
              <ChecklistItem done label="Docker daemon connected" sub="runtime reachable" />
              <ChecklistItem done label="Claude Code key" sub="CLAUDE_CODE_OAUTH_TOKEN present" />
              <ChecklistItem
                todo
                label="OpenAI key for Codex"
                sub="Set OPENAI_API_KEY in your host environment."
                action="How to"
              />
              <ChecklistItem
                todo
                label="Google API key for Antigravity"
                sub="Set GOOGLE_API_KEY to enable the Antigravity agent."
                action="How to"
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "var(--fg-2)" }}>
              <span>
                Press <span className="kbd">⌘</span>
                <span className="kbd" style={{ marginLeft: 2 }}>
                  N
                </span>{" "}
                to start your first agent.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BigAgentCard({
  agent,
  name,
  desc,
  version,
  keySet,
  onStart,
}: {
  agent: AgentId;
  name: string;
  desc: string;
  version: string;
  keySet?: boolean;
  onStart?: () => void;
}) {
  const meta = AGENT_META[agent];
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: "var(--bg-2)",
        border: "1px solid var(--bd)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        minHeight: 200,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `color-mix(in oklab, ${meta.accent} 16%, var(--bg-1))`,
          border: `1px solid color-mix(in oklab, ${meta.accent} 35%, var(--bd))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ transform: "scale(1.6)" }}>
          <AgentGlyph agent={agent} size={14} color={meta.accent} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-0)" }}>{name}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
          {version}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>{desc}</p>
      <div style={{ flex: 1 }} />
      {keySet ? (
        <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }} onClick={onStart}>
          Start with {name}
          <span style={{ marginLeft: 4 }}>{Ico.arrowR}</span>
        </Button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--wait)",
            fontSize: 11.5,
          }}
        >
          <StatusDot status="wait" /> Add API key to enable
        </div>
      )}
    </div>
  );
}

function ChecklistItem({
  done,
  todo,
  label,
  sub,
  action,
}: {
  done?: boolean;
  todo?: boolean;
  label: string;
  sub: string;
  action?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
        borderTop: "1px solid var(--bd-soft)",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `1.5px solid ${done ? "var(--live)" : "var(--bd-strong)"}`,
          background: done ? "var(--live)" : "transparent",
          color: done ? "var(--bg-0)" : "var(--fg-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          flexShrink: 0,
        }}
      >
        {done && Ico.check}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: done ? "var(--fg-1)" : "var(--fg-0)" }}>{label}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
          {sub}
        </div>
      </div>
      {todo && action && (
        <Button variant="outline" size="xs">
          {action}
        </Button>
      )}
    </div>
  );
}
