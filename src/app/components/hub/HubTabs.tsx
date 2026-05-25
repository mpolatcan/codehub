import { useEffect, useRef } from "react";
import { AgentGlyph } from "../../components/primitives/AgentGlyph";
import { IconBtn } from "../../components/primitives/IconBtn";
import { StatusDot } from "../../components/primitives/StatusDot";
import { Ico } from "../../components/primitives/icons";
import { useLauncher } from "../../lib/launcher";
import { useStore } from "../../lib/store";
import { leavesList } from "../../lib/tree";

// Workspace tab strip, ported from design/screens/main-hub-a.jsx. Each tab is a
// live workspace; the agent glyphs reflect its panes. The trailing area carries
// only the awaiting-input bell — Files/Shell/Diff toggles + the spawn CTA live
// in the bottom ActionBar (design contract). The "+" opens the shared launcher.
const NEW_KEY = "tabbar";

export function HubTabs() {
  const workspaces = useStore((s) => s.workspaces);
  const activeId = useStore((s) => s.activeWorkspaceId);
  const sessionMeta = useStore((s) => s.sessionMeta);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const closeWorkspace = useStore((s) => s.closeWorkspace);
  const openLaunch = useLauncher((s) => s.open);
  // Awaiting-input signal for the bell dot: any session with a pending prompt
  // (← pending_prompts / live agent-event, §7). Real for Claude/Codex; empty
  // (no dot) for Antigravity and until the BE track lands.
  const pendingCount = useStore((s) => s.pendingPrompts.length);

  const stripRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(workspaces.length);
  useEffect(() => {
    const strip = stripRef.current;
    if (strip && workspaces.length > prevCount.current) {
      strip.scrollTo({ left: strip.scrollWidth, behavior: "smooth" });
    }
    prevCount.current = workspaces.length;
  }, [workspaces.length]);

  return (
    <div
      style={{
        height: "var(--tabbar-h, 40px)",
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid var(--bd-soft)",
        background: "var(--bg-1)",
        paddingLeft: 8,
        flexShrink: 0,
      }}
    >
      <div
        ref={stripRef}
        style={{ display: "flex", minWidth: 0, overflowX: "auto", scrollbarWidth: "none" }}
      >
        {workspaces.map((ws) => {
          const sessions = leavesList(ws.root);
          const active = ws.id === activeId;
          const primary = ws.focused && sessions.includes(ws.focused) ? ws.focused : sessions[0];
          const meta = primary ? sessionMeta[primary] : undefined;
          const title = meta && sessions.length === 1 ? meta.alias : `Tab ${ws.plate}`;
          return (
            <div
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 12px",
                height: "100%",
                borderRight: "1px solid var(--bd-soft)",
                background: active ? "var(--bg-2)" : "transparent",
                color: active ? "var(--fg-0)" : "var(--fg-1)",
                cursor: "pointer",
                position: "relative",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "var(--pri)",
                  }}
                />
              )}
              <StatusDot status={active ? "live" : "idle"} pulse={active} />
              <div
                style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: active ? "var(--fg-0)" : "var(--fg-1)",
                  }}
                >
                  {title}
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                  {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center", marginLeft: 4 }}>
                {sessions.map((session) => {
                  const m = sessionMeta[session];
                  if (!m) return null;
                  return (
                    <AgentGlyph key={session} agent={m.cli} size={11} color={`var(--a-${m.cli})`} />
                  );
                })}
              </span>
              <IconBtn
                title="Close tab"
                style={{ width: 18, height: 18, marginLeft: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  void closeWorkspace(ws.id);
                }}
              >
                {Ico.close}
              </IconBtn>
            </div>
          );
        })}

        {/* new tab — opens the shared spawn modal */}
        <button
          type="button"
          title="New tab (⌘N)"
          onClick={() => openLaunch(NEW_KEY)}
          style={{
            alignSelf: "center",
            marginLeft: 6,
            padding: "4px 6px",
            background: "transparent",
            border: "none",
            color: "var(--fg-2)",
            cursor: "pointer",
            display: "inline-flex",
          }}
        >
          {Ico.plus}
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* trailing actions — the awaiting-input bell. Files / Diff / split / spawn
          live in the bottom ActionBar (design: main-hub-a), not here. */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 8px" }}>
        <IconBtn
          title={
            pendingCount > 0
              ? `${pendingCount} session${pendingCount === 1 ? "" : "s"} awaiting input`
              : "No sessions awaiting input"
          }
          active={pendingCount > 0}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            {Ico.bell}
            {pendingCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--wait)",
                }}
              />
            )}
          </span>
        </IconBtn>
      </div>
    </div>
  );
}
