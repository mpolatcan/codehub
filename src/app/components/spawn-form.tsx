/**
 * Shared spawn-form pieces, used by BOTH the SpawnDialog modal and the
 * new-workspace wizard. Extracted so the two surfaces can't drift — every
 * honest adaptation (keychain-backed accounts, per-workspace containers,
 * the real /workspace mount picker with its recreate affordance) lives here once.
 */
import { AGENT_META, AgentGlyph, type AgentId } from "@/app/components/primitives/AgentGlyph";
import { StatusBadge } from "@/app/components/primitives/StatusBadge";
import { Tag } from "@/app/components/primitives/Tag";
import { Tip } from "@/app/components/primitives/Tip";
import { Ico } from "@/app/components/primitives/icons";
import { type AgentCli, ipc } from "@/app/lib/ipc";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import { type ReactNode, useEffect, useState } from "react";

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
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}
      >
        <span className="lbl" style={{ color: "var(--fg-1)" }}>
          {label}
        </span>
        {optional && (
          <span className="mono" style={{ fontSize: "var(--fs-11)", color: "var(--fg-3)" }}>
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
        padding: "0.75rem 0.875rem",
        background: selected ? "var(--bg-3)" : "var(--bg-1)",
        border: `1px solid ${selected ? "var(--fg-2)" : "var(--bd)"}`,
        borderRadius: "0.5rem",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "0.375rem",
      }}
    >
      {selected && (
        <span
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            width: "1rem",
            height: "1rem",
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
      <div
        style={{
          fontSize: "var(--fs-13)",
          fontWeight: 500,
          color: "var(--fg-0)",
          marginTop: "0.125rem",
        }}
      >
        {meta.name}
      </div>
      <div className="mono" style={{ fontSize: "var(--fs-11)", color: "var(--fg-2)" }}>
        {agent in MODEL_HINT ? MODEL_HINT[agent as AgentCli] : ""}
      </div>
    </button>
  );
}

// One selectable account card. A status dot reflects whether its credential is present.
export function AccountCard({
  title,
  sub,
  present,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  sub: string;
  present: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: "0.625rem 0.75rem",
        background: selected ? "var(--bg-3)" : "var(--bg-1)",
        border: `1px solid ${selected ? "var(--fg-2)" : "var(--bd)"}`,
        borderRadius: "0.5rem",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.1875rem",
        minHeight: "3.25rem",
        justifyContent: "center",
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <span
          style={{
            width: "0.375rem",
            height: "0.375rem",
            borderRadius: "50%",
            background: present ? "var(--live)" : "var(--err)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "var(--fs-13)", fontWeight: 500, color: "var(--fg-0)" }}>
          {title}
        </span>
      </div>
      <div className="mono" style={{ fontSize: "var(--fs-10)", color: "var(--fg-2)" }}>
        {sub}
      </div>
    </button>
  );
}

// One read-only runtime indicator. `on` = an active runtime behavior (filled
// dot); `soon` = a deferred capability ("Coming soon" tag); neither = a stated
// fact (hollow dot). Not interactive — these describe the workspace container, they
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
      <span
        aria-hidden="true"
        style={{
          width: "0.75rem",
          height: "0.75rem",
          flexShrink: 0,
          borderRadius: "0.1875rem",
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
        <span className="mono" style={{ fontSize: "var(--fs-10)", color: "var(--fg-3)" }}>
          Coming soon
        </span>
      )}
    </span>
  );
}

// The honest "Container" surface: the active workspace container. Live state
// badge reflects the real container status; no sizing/cost is fabricated.
export function SharedRuntimePanel() {
  const status = useStore((s) => s.status);
  const live = status?.state === "running";
  return (
    <>
      <div
        style={{
          padding: "0.75rem 0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          background: live ? "color-mix(in oklab, var(--live) 8%, var(--bg-1))" : "var(--bg-1)",
          border: live
            ? "1px solid color-mix(in oklab, var(--live) 40%, var(--bd))"
            : "1px solid var(--bd)",
          borderRadius: "0.5rem",
        }}
      >
        <span
          style={{
            width: "1rem",
            height: "1rem",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.125rem",
            }}
          >
            <span style={{ fontSize: "var(--fs-13)", fontWeight: 500, color: "var(--fg-0)" }}>
              Workspace container
            </span>
            <span className="mono" style={{ fontSize: "var(--fs-11)", color: "var(--fg-2)" }}>
              {status?.name ?? "—"}
            </span>
            <StatusBadge status={live ? "live" : "idle"}>
              {live ? "Running" : "Stopped"}
            </StatusBadge>
          </div>
          <div
            style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-11)", color: "var(--fg-2)" }}
          >
            workspace mounted at /workspace · panes reuse this container
          </div>
        </div>
        <Tag color={live ? "var(--live)" : "var(--fg-3)"}>{live ? "~instant" : "off"}</Tag>
      </div>

      {/* Real container facts as read-only indicators. Per-spawn checkboxes would
          imply backend flags that do not exist. Sizing is a deferral, marked
          "Coming soon", not faked. */}
      <div
        style={{
          marginTop: "0.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.375rem 1rem",
          fontSize: "var(--fs-11)",
          color: "var(--fg-2)",
        }}
      >
        <RuntimeFact on>Workspace mounted read-write</RuntimeFact>
        <RuntimeFact on>Credentials from OS keychain</RuntimeFact>
        <RuntimeFact>Network: bridge (host networking off)</RuntimeFact>
        <RuntimeFact soon>Container sizing</RuntimeFact>
      </div>
    </>
  );
}

// The real /workspace mount picker (Tier-2). Uncontrolled mode edits the active
// runtime mount and surfaces the recreate affordance. Controlled mode is used by
// NewWorkspace to collect a repo path without mutating the active workspace.
export function RepositoryPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (path: string) => void;
}) {
  const dash = "—";
  const controlled = onChange !== undefined;
  const inBrowser = typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
  const workspaceInfo = useStore((s) => s.workspaceInfo);
  const error = useStore((s) => s.error);
  // Default outside the selector — a `?? []` inside returns a fresh array per
  // render and loops useSyncExternalStore (config starts null).
  const recents = useStore((s) => s.config?.recentWorkspaces) ?? [];
  const running = useStore((s) => s.status?.state === "running");
  const loadWorkspaceInfo = useStore((s) => s.loadWorkspaceInfo);
  const pickWorkspaceDir = useStore((s) => s.pickWorkspaceDir);
  const selectWorkspaceDir = useStore((s) => s.selectWorkspaceDir);
  const recreateRuntime = useStore((s) => s.recreateRuntime);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPath, setManualPath] = useState("");

  const effective = controlled ? (value ?? null) : (workspaceInfo?.effective ?? null);
  const needsRecreate = !controlled && (workspaceInfo?.needsRecreate ?? false);
  // Other recents (exclude the one currently selected).
  const otherRecents = recents.filter((p) => p !== effective).slice(0, 4);

  useEffect(() => {
    void loadWorkspaceInfo();
  }, [loadWorkspaceInfo]);

  useEffect(() => {
    if (effective && !manualPath) setManualPath(effective);
  }, [effective, manualPath]);

  const chooseWithDialog = async () => {
    if (controlled) {
      const path = await ipc.pickDirectory().catch(() => null);
      if (path) {
        setManualPath(path);
        onChange(path);
      } else setManualOpen(true);
      return;
    }
    const picked = await pickWorkspaceDir();
    // Browser dev bridge cannot open a native folder dialog; it returns null.
    // Fall back to a typed absolute path in that case.
    if (!picked) setManualOpen(true);
  };

  const submitManualPath = () => {
    const path = manualPath.trim();
    if (!path) return;
    if (controlled) onChange(path);
    else void selectWorkspaceDir(path);
  };

  const chooseRecent = (path: string) => {
    if (controlled) {
      setManualPath(path);
      onChange(path);
      return;
    }
    void selectWorkspaceDir(path);
  };

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
          gap: "0.625rem",
          background: "var(--bg-1)",
          border: "1px solid var(--bd)",
          borderRadius: "0.5rem",
          padding: "0.5625rem 0.75rem",
        }}
      >
        {Ico.files}
        <Tip text={effective ?? ""}>
          <span
            className="mono"
            style={{
              fontSize: "var(--fs-13)",
              color: "var(--fg-1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {effective ?? dash}
          </span>
        </Tip>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: "var(--fs-11)", color: "var(--fg-3)" }}>
          /workspace
        </span>
        <Button variant="outline" size="xs" onClick={() => void chooseWithDialog()}>
          {inBrowser ? "Type path…" : "Change…"}
        </Button>
      </div>

      {(manualOpen || !effective) && (
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Input
            className="mono h-auto flex-1 min-w-0 rounded-md px-2 py-1.5 text-[0.75rem]"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManualPath();
            }}
            placeholder="/absolute/path/to/repo"
            spellCheck={false}
          />
          <Button
            variant="outline"
            size="xs"
            disabled={!manualPath.trim()}
            onClick={submitManualPath}
          >
            Use path
          </Button>
        </div>
      )}

      {!controlled && error?.startsWith("set workspace dir failed") && (
        <div
          className="mono"
          style={{ marginTop: "0.375rem", fontSize: "var(--fs-11)", color: "var(--err)" }}
        >
          {error}
        </div>
      )}

      {otherRecents.length > 0 && (
        <div style={{ marginTop: "0.375rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {otherRecents.map((p) => (
            <Tip key={p} text={p}>
              <button
                type="button"
                onClick={() => chooseRecent(p)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <Tag>{shortPath(p)}</Tag>
              </button>
            </Tip>
          ))}
        </div>
      )}

      {needsRecreate && (
        <div
          style={{
            marginTop: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.5rem 0.6875rem",
            background: "color-mix(in oklab, var(--wait) 10%, var(--bg-1))",
            border: "1px solid color-mix(in oklab, var(--wait) 40%, var(--bd))",
            borderRadius: "0.5rem",
          }}
        >
          <span style={{ fontSize: "var(--fs-12)", color: "var(--fg-1)", flex: 1 }}>
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
