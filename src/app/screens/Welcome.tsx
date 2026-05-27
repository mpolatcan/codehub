import { AgentGlyph } from "@/app/components/primitives/AgentGlyph";
import { Ico } from "@/app/components/primitives/icons";
import { shortPath } from "@/app/components/spawn-form";
import type { SavedWorkspace } from "@/app/lib/ipc";
import { useLauncher } from "@/app/lib/launcher";
import { useOverlay } from "@/app/lib/overlay";
import { useStore } from "@/app/lib/store";
import { workspaceLeaves } from "@/app/lib/tree";
import { Button } from "@/app/ui/button";
import { useMemo, useState } from "react";

function relTime(ms: number | null): string {
  if (!ms) return "not opened yet";
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 172800) return "yesterday";
  return `${Math.floor(secs / 86400)}d ago`;
}

function dirName(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function Welcome() {
  const saved = useStore((s) => s.config?.savedWorkspaces) ?? [];
  const openWizard = useOverlay((s) => s.setNewWorkspace);
  const setResume = useOverlay((s) => s.setResume);
  const setView = useStore((s) => s.setView);
  const setSettingsSection = useStore((s) => s.setSettingsSection);
  const [query, setQuery] = useState("");

  const pinned = saved.filter((w) => w.pinned);
  const rest = saved
    .filter((w) => !w.pinned)
    .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0));

  const q = query.toLowerCase();
  const filteredPinned = useMemo(
    () =>
      pinned.filter(
        (ws) => !q || ws.name.toLowerCase().includes(q) || ws.dir.toLowerCase().includes(q),
      ),
    [pinned, q],
  );
  const filteredRest = useMemo(
    () =>
      rest.filter(
        (ws) => !q || ws.name.toLowerCase().includes(q) || ws.dir.toLowerCase().includes(q),
      ),
    [rest, q],
  );
  const showSearch = saved.length >= 4;

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--bg-1)",
        overflow: "hidden",
        color: "var(--fg-1)",
      }}
    >
      {/* hero band — matches design welcome.jsx */}
      <div
        style={{
          padding: "40px 48px 28px",
          borderBottom: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="lbl" style={{ marginBottom: 10 }}>
            Workspaces
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--fg-0)",
            }}
          >
            Pick up where you left off,
            <span style={{ color: "var(--fg-2)" }}> or start fresh.</span>
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "var(--fg-2)",
              fontSize: 13,
              maxWidth: 512,
              lineHeight: 1.55,
            }}
          >
            A workspace bundles repos and a container together. Open one to spawn agents inside it.
          </p>
        </div>
        <Button onClick={() => openWizard(true)} title="Create a new workspace (⌘⇧N)">
          {Ico.plus}New workspace
          <span className="kbd" style={{ marginLeft: 6 }}>
            ⌘⇧N
          </span>
        </Button>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "24px 48px 40px" }}>
        {/* search */}
        {showSearch && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "var(--bg-2)",
                border: "1px solid var(--bd-soft)",
                borderRadius: 8,
                maxWidth: 360,
              }}
            >
              <span style={{ color: "var(--fg-3)", display: "inline-flex" }}>{Ico.search}</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter workspaces…"
                className="mono"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--fg-0)",
                  fontSize: 12,
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--fg-3)",
                    cursor: "pointer",
                    display: "inline-flex",
                    padding: 0,
                  }}
                >
                  {Ico.close}
                </button>
              )}
            </div>
          </div>
        )}

        {filteredPinned.length > 0 && (
          <CardSection title="Pinned" count={filteredPinned.length}>
            {filteredPinned.map((w) => (
              <WorkspaceCard key={w.id} ws={w} />
            ))}
          </CardSection>
        )}

        {filteredRest.length > 0 && (
          <CardSection title="Recent" count={filteredRest.length}>
            {filteredRest.map((w) => (
              <WorkspaceCard key={w.id} ws={w} />
            ))}
          </CardSection>
        )}

        {query && filteredPinned.length === 0 && filteredRest.length === 0 && (
          <div
            className="mono"
            style={{
              padding: "32px 0",
              textAlign: "center",
              fontSize: 12,
              color: "var(--fg-3)",
            }}
          >
            No workspaces match "{query}".
          </div>
        )}

        {/* start a new workspace — template cards (design welcome.jsx) */}
        <div>
          <div className="lbl" style={{ marginBottom: 14 }}>
            Start a new workspace
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            <TemplateCard
              title="Blank workspace"
              desc="Pick repos and container size yourself."
              icon={Ico.plus}
              cta="Start"
              onClick={() => openWizard(true)}
            />
            <TemplateCard
              title="From GitHub"
              desc="Clone a repo URL, auto-detect language, pre-configure container."
              icon={Ico.search}
              cta="Clone repo"
              onClick={() => {
                setSettingsSection("integrations");
                setView("settings");
              }}
            />
            <TemplateCard
              title="Resume session"
              desc="Reattach to a recent agent session and continue."
              icon={Ico.bell}
              cta="Browse sessions"
              onClick={() => {
                setView("hub");
                setResume(true);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function CardSection({
  title,
  count,
  children,
}: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span className="lbl">{title}</span>
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
          {count}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function WorkspaceCard({ ws }: { ws: SavedWorkspace }) {
  const effective = useStore((s) => s.workspaceInfo?.effective ?? null);
  const workspaces = useStore((s) => s.workspaces);
  const sessionMeta = useStore((s) => s.sessionMeta);
  const openSavedWorkspace = useStore((s) => s.openSavedWorkspace);
  const removeSavedWorkspace = useStore((s) => s.removeSavedWorkspace);
  const togglePin = useStore((s) => s.toggleWorkspacePin);
  const openLaunch = useLauncher((s) => s.open);

  const isMounted = effective !== null && effective === ws.dir;
  const liveWs = workspaces.find((w) => w.dir === ws.dir);
  const agentSessions = liveWs ? workspaceLeaves(liveWs) : [];
  const agents = agentSessions.map((s) => sessionMeta[s]).filter((m) => m && m.cli !== "shell");

  const open = async () => {
    await openSavedWorkspace(ws.id);
    openLaunch("newtab", {
      dir: "row",
      workspaceTitle: ws.name,
      workspaceDir: ws.dir,
      savedWorkspaceId: ws.id,
    });
  };

  return (
    <div
      className="ch-card ws-card"
      // biome-ignore lint/a11y/useSemanticElements: card nests pin/remove buttons, so it can't be a <button>
      role="button"
      tabIndex={0}
      onClick={() => void open()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void open();
        }
      }}
      style={{
        padding: "14px 16px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderColor: isMounted ? "var(--pri)" : undefined,
      }}
    >
      {/* name row: pin + name + open badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <button
          type="button"
          title={ws.pinned ? "Unpin" : "Pin to top"}
          aria-pressed={ws.pinned}
          onClick={(e) => {
            e.stopPropagation();
            void togglePin(ws.id);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
            color: ws.pinned ? "var(--wait)" : "var(--fg-3)",
            display: "inline-flex",
            lineHeight: 0,
          }}
        >
          <PinGlyph filled={ws.pinned} />
        </button>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--fg-0)",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ws.name}
        </span>
        {isMounted && (
          <span
            title="Mounted at /workspace"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--pri)",
              padding: "2px 6px",
              borderRadius: 999,
              background: "color-mix(in oklab, var(--pri) 12%, transparent)",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--pri)" }} />
            open
          </span>
        )}
        <button
          type="button"
          className="ws-remove"
          title="Remove from workspaces"
          onClick={(e) => {
            e.stopPropagation();
            void removeSavedWorkspace(ws.id);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: "pointer",
            color: "var(--fg-3)",
            display: "inline-flex",
            lineHeight: 0,
            opacity: 0,
            transition: "opacity .15s",
          }}
        >
          {Ico.close}
        </button>
      </div>

      {/* repo chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <span
          title={ws.dir}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 4,
            background: "var(--bg-3)",
            border: "1px solid var(--bd-soft)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--fg-1)",
          }}
        >
          {Ico.branch}
          {dirName(ws.dir)}
        </span>
      </div>

      {/* container meta + time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--fg-2)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {Ico.container}container
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "var(--fg-3)" }}>{relTime(ws.lastOpened)}</span>
      </div>

      {/* agent strip — only when workspace is live with agents */}
      {agents.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--fg-2)",
            borderTop: "1px solid var(--bd-soft)",
            paddingTop: 8,
          }}
        >
          <span>
            {agents.length} agent{agents.length === 1 ? "" : "s"}
          </span>
          <span style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 3 }}>
            {agents.map((m, i) => (
              <AgentGlyph
                // biome-ignore lint/suspicious/noArrayIndexKey: positional agent indicators
                key={i}
                agent={m.cli}
                size={12}
                color={`var(--a-${m.cli})`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  title,
  desc,
  icon,
  cta,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  cta: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="ch-card tmpl-card"
      // biome-ignore lint/a11y/useSemanticElements: card nests a cta <Button>, so it can't be a <button>
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "var(--bg-3)",
          border: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-1)",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-0)" }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--fg-2)", lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <Button variant="outline" size="xs" style={{ alignSelf: "flex-start", marginTop: 2 }}>
        {cta}
      </Button>
    </div>
  );
}

function PinGlyph({ filled }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.4}
    >
      <path d="M9 1l1.2 1.2L8 4.5l3.5 3.5 2.3-2.3L15 6.9l-3 3 2 5-2-1-3-3-3.5 3.5L4 13l3.5-3.5-3-3-1 1-1.2-1.2 2.4-2.3L1 1.7 2.2 0.5 6 4.3 9 1z" />
    </svg>
  );
}
