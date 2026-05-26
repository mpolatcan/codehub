import { useEffect, useRef, useState } from "react";
import { AgentGlyph } from "../../components/primitives/AgentGlyph";
import { IconBtn } from "../../components/primitives/IconBtn";
import { StatusDot } from "../../components/primitives/StatusDot";
import { Ico } from "../../components/primitives/icons";
import { useLauncher } from "../../lib/launcher";
import { useOverlay } from "../../lib/overlay";
import { useStore } from "../../lib/store";
import { activeGroup, workspaceLeaves } from "../../lib/tree";

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
  const setPalette = useOverlay((s) => s.setPalette);
  // Awaiting-input signal for the bell dot: any session with a pending prompt
  // (← pending_prompts / live agent-event, §7). Real for Claude/Codex; empty
  // (no dot) for Antigravity and until the BE track lands.
  const pendingPrompts = useStore((s) => s.pendingPrompts);
  const pendingCount = pendingPrompts.length;
  const pendingSessions = pendingPrompts.map((p) => p.session);

  const stripRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(workspaces.length);
  const [overflowOpen, setOverflowOpen] = useState(false);
  // True when the tab strip is scrolled past its viewport (more tabs than fit).
  // Drives the trailing "⌄" overflow affordance (design HubStateTabOverflow).
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const strip = stripRef.current;
    if (strip && workspaces.length > prevCount.current) {
      strip.scrollTo({ left: strip.scrollWidth, behavior: "smooth" });
    }
    prevCount.current = workspaces.length;
  }, [workspaces.length]);

  // Measure overflow whenever tabs change or the window resizes.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const measure = () => setOverflowing(strip.scrollWidth > strip.clientWidth + 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    return () => ro.disconnect();
  }, []);

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
          const sessions = workspaceLeaves(ws);
          const active = ws.id === activeId;
          const focused = activeGroup(ws)?.focused;
          const primary = focused && sessions.includes(focused) ? focused : sessions[0];
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

      {/* trailing actions — persistent ⌘K search (design: main-hub-a tab bar)
          + overflow menu (when tabs exceed the strip) + the awaiting-input bell.
          Files / Diff / split / spawn live in the bottom ActionBar, not here. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 8px",
          position: "relative",
        }}
      >
        <button
          type="button"
          title="Search workspaces (⌘K)"
          onClick={() => setPalette(true)}
          style={{
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 7px",
            background: "transparent",
            border: "none",
            color: "var(--fg-2)",
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          {Ico.search}
          <span className="kbd">⌘K</span>
        </button>
        {overflowing && (
          <IconBtn
            title="All workspaces"
            active={overflowOpen}
            onClick={() => setOverflowOpen((v) => !v)}
          >
            {Ico.chevD}
          </IconBtn>
        )}
        {overflowOpen && (
          <>
            {/* click-away scrim */}
            <button
              type="button"
              aria-label="Close workspace menu"
              onClick={() => setOverflowOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "transparent",
                border: "none",
                cursor: "default",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 4,
                width: 280,
                zIndex: 50,
                background: "var(--bg-2)",
                border: "1px solid var(--bd)",
                borderRadius: 8,
                boxShadow: "var(--shadow-2)",
                padding: 6,
              }}
            >
              <div
                style={{
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderBottom: "1px solid var(--bd-soft)",
                  marginBottom: 4,
                }}
              >
                <span className="lbl" style={{ fontSize: 10 }}>
                  Workspaces · {workspaces.length}
                </span>
                <span style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                  ⌘P
                </span>
              </div>
              {workspaces.map((ws) => {
                const sessions = workspaceLeaves(ws);
                const waits = sessions.filter((s) => pendingSessions.includes(s)).length;
                const focused = activeGroup(ws)?.focused;
                const primary = focused && sessions.includes(focused) ? focused : sessions[0];
                const meta = primary ? sessionMeta[primary] : undefined;
                const name = meta && sessions.length === 1 ? meta.alias : `Tab ${ws.plate}`;
                return (
                  <div
                    key={ws.id}
                    className="ctx-row"
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setOverflowOpen(false);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <StatusDot status={ws.id === activeId ? "live" : "idle"} />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        lineHeight: 1.15,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 13,
                          color: "var(--fg-0)",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                        {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                      </span>
                    </div>
                    {waits > 0 && (
                      <span className="mono" style={{ fontSize: 10, color: "var(--wait)" }}>
                        {waits} wait
                      </span>
                    )}
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid var(--bd-soft)", marginTop: 4, paddingTop: 4 }}>
                <div
                  className="ctx-row"
                  onClick={() => {
                    setOverflowOpen(false);
                    setPalette(true);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}
                >
                  {Ico.search}
                  Search workspaces…
                  <span className="kbd" style={{ marginLeft: "auto" }}>
                    ⌘P
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
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
