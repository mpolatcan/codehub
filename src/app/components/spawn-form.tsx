/**
 * Shared spawn-form pieces, used by BOTH the SpawnDialog modal and the
 * new-workspace wizard. Extracted so the two surfaces can't drift — every
 * honest adaptation (host-env accounts not keychain, the single shared runtime,
 * the real /workspace mount picker with its recreate affordance) lives here once.
 */
import { AGENT_META, AgentGlyph, type AgentId } from "@/app/components/primitives/AgentGlyph";
import { StatusBadge } from "@/app/components/primitives/StatusBadge";
import { Tag } from "@/app/components/primitives/Tag";
import { Ico } from "@/app/components/primitives/icons";
import type { AgentCli } from "@/app/lib/ipc";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import type { ReactNode } from "react";

// Per-agent model/window hint shown under the glyph. Static catalog copy.
export const MODEL_HINT: Record<AgentCli, string> = {
  claude: "opus-4.7 · 1M",
  codex: "o4-mini · 200k",
  antigravity: "g-2.5 · 1M",
};

export const PROMPT_TEMPLATES = [
  "Fix lint errors",
  "Write tests for…",
  "Review recent diff",
  "+ Templates",
];

export function FormRow({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span className="lbl" style={{ color: "var(--fg-1)" }}>
          {label}
        </span>
        {optional && (
          <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
            optional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function AgentCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentId;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const meta = AGENT_META[agent];
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: "12px 14px",
        background: selected ? "var(--bg-3)" : "var(--bg-1)",
        border: `1px solid ${selected ? "var(--fg-2)" : "var(--bd)"}`,
        borderRadius: 8,
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--fg-0)",
            color: "var(--bg-0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Ico.check}
        </span>
      )}
      <AgentGlyph agent={agent} size={18} color={meta.accent} />
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)", marginTop: 2 }}>
        {meta.name}
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-2)" }}>
        {agent in MODEL_HINT ? MODEL_HINT[agent as AgentCli] : ""}
      </div>
    </button>
  );
}

// One selectable account card: the default host-env credential, or a label-only
// profile. A status dot reflects whether its host env var is present.
export function AccountCard({
  title,
  sub,
  present,
  selected,
  onSelect,
}: {
  title: string;
  sub: string;
  present: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: "10px 12px",
        background: selected ? "var(--bg-3)" : "var(--bg-1)",
        border: `1px solid ${selected ? "var(--fg-2)" : "var(--bd)"}`,
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minHeight: 52,
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: present ? "var(--live)" : "var(--err)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-0)" }}>{title}</span>
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-2)" }}>
        {sub}
      </div>
    </button>
  );
}

// One read-only runtime indicator. `on` = an active runtime behavior (filled
// dot); `soon` = a deferred capability ("Coming soon" tag); neither = a stated
// fact (hollow dot). Not interactive — these describe the shared runtime, they
// don't toggle anything (no per-spawn backend flag exists).
export function RuntimeFact({
  on,
  soon,
  children,
}: {
  on?: boolean;
  soon?: boolean;
  children: ReactNode;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        aria-hidden="true"
        style={{
          width: 12,
          height: 12,
          flexShrink: 0,
          borderRadius: 3,
          border: `1px solid ${on ? "var(--live)" : "var(--bd-strong)"}`,
          background: on ? "var(--live)" : "transparent",
          color: "var(--bg-0)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {on && Ico.check}
      </span>
      <span style={{ color: soon ? "var(--fg-3)" : "var(--fg-2)" }}>{children}</span>
      {soon && (
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
          Coming soon
        </span>
      )}
    </span>
  );
}

// The honest "Container" surface: a single shared runtime (no per-workspace
// sizing/cost to fabricate). Live state badge reflects the real container status.
export function SharedRuntimePanel() {
  const status = useStore((s) => s.status);
  const live = status?.state === "running";
  return (
    <>
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: live ? "color-mix(in oklab, var(--live) 8%, var(--bg-1))" : "var(--bg-1)",
          border: live
            ? "1px solid color-mix(in oklab, var(--live) 40%, var(--bd))"
            : "1px solid var(--bd)",
          borderRadius: 8,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--fg-0)",
            color: "var(--bg-0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Ico.check}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-0)" }}>
              Workspace container
            </span>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
              {status?.name ?? "—"}
            </span>
            <StatusBadge status={live ? "live" : "idle"}>
              {live ? "Running" : "Stopped"}
            </StatusBadge>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--fg-2)" }}>
            workspace mounted at /workspace · per-session reuse coming soon
          </div>
        </div>
        <Tag color={live ? "var(--live)" : "var(--fg-3)"}>{live ? "~instant" : "off"}</Tag>
      </div>

      {/* Real runtime facts as read-only indicators (the shared runtime config is
          fixed, so a per-spawn checkbox would be a lie). Sizing is a deferral,
          marked "Coming soon", not faked. */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          fontSize: 11,
          color: "var(--fg-2)",
        }}
      >
        <RuntimeFact on>Workspace mounted read-write</RuntimeFact>
        <RuntimeFact on>API keys forwarded from host environment</RuntimeFact>
        <RuntimeFact>Network: bridge (host networking off)</RuntimeFact>
        <RuntimeFact soon>Container sizing</RuntimeFact>
      </div>
    </>
  );
}

// The real /workspace mount picker (Tier-2). Shows the effective host dir, lets
// the user change it via the native folder dialog or an MRU recent, and — since
// the mount source is fixed at container create-time — surfaces a "restart
// runtime to apply" affordance when the choice differs from what's mounted.
export function RepositoryPicker() {
  const dash = "—";
  const workspaceInfo = useStore((s) => s.workspaceInfo);
  // Default outside the selector — a `?? []` inside returns a fresh array per
  // render and loops useSyncExternalStore (config starts null).
  const recents = useStore((s) => s.config?.recentWorkspaces) ?? [];
  const running = useStore((s) => s.status?.state === "running");
  const pickWorkspaceDir = useStore((s) => s.pickWorkspaceDir);
  const selectWorkspaceDir = useStore((s) => s.selectWorkspaceDir);
  const recreateRuntime = useStore((s) => s.recreateRuntime);

  const effective = workspaceInfo?.effective ?? null;
  const needsRecreate = workspaceInfo?.needsRecreate ?? false;
  // Other recents (exclude the one currently selected).
  const otherRecents = recents.filter((p) => p !== effective).slice(0, 4);

  const restart = () => {
    if (
      window.confirm(
        "Restart the runtime to apply the new workspace? This ends every running session (scrollback is kept in tmux).",
      )
    ) {
      void recreateRuntime();
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-1)",
          border: "1px solid var(--bd)",
          borderRadius: 8,
          padding: "9px 12px",
        }}
      >
        {Ico.files}
        <span
          className="mono"
          style={{
            fontSize: 12.5,
            color: "var(--fg-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={effective ?? undefined}
        >
          {effective ?? dash}
        </span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
          /workspace
        </span>
        <Button variant="outline" size="xs" onClick={() => void pickWorkspaceDir()}>
          Change…
        </Button>
      </div>

      {otherRecents.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {otherRecents.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => void selectWorkspaceDir(p)}
              title={p}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Tag>{shortPath(p)}</Tag>
            </button>
          ))}
        </div>
      )}

      {needsRecreate && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 11px",
            background: "color-mix(in oklab, var(--wait) 10%, var(--bg-1))",
            border: "1px solid color-mix(in oklab, var(--wait) 40%, var(--bd))",
            borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 11.5, color: "var(--fg-1)", flex: 1 }}>
            Workspace changed — restart the runtime to mount it. Affects every session.
          </span>
          <Button variant="outline" size="xs" disabled={!running} onClick={restart}>
            Restart now
          </Button>
        </div>
      )}
    </>
  );
}

// Compact a host path for an MRU chip / card: the last two segments, ellipsized.
export function shortPath(p: string): string {
  const parts = p.split("/").filter(Boolean);
  const tail = parts.slice(-2).join("/");
  return parts.length > 2 ? `…/${tail}` : `/${tail}`;
}
