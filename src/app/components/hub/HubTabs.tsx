import { useEffect, useRef, useState } from "react";
import { IconBtn } from "../../components/primitives/IconBtn";
import { Ico } from "../../components/primitives/icons";
import { useOverlay } from "../../lib/overlay";
import { confirmCloseWorkspace, useStore } from "../../lib/store";
import { workspaceLeaves, workspaceTitle } from "../../lib/tree";

// Workspace tab strip, ported from design/screens/main-hub-a.jsx. Each tab is a
// live workspace. The visual anatomy mirrors the design: drag handle, workspace
// color dot, name/repo stack, one state-count chip, close button. The repo label
// is intentionally conservative because CodeHub has one mounted /workspace, not
// the design mock's multi-repo model.
function dirName(path: string | undefined): string | null {
  if (!path) return null;
  return path.split("/").filter(Boolean).pop() ?? null;
}

export function HubTabs() {
  const workspaces = useStore((s) => s.workspaces);
  const activeId = useStore((s) => s.activeWorkspaceId);
  const git = useStore((s) => s.gitStatus);
  const switchWorkspace = useStore((s) => s.switchWorkspace);
  const closeWorkspace = useStore((s) => s.closeWorkspace);
  const setPalette = useOverlay((s) => s.setPalette);
  const setNewWorkspace = useOverlay((s) => s.setNewWorkspace);
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
          const waits = sessions.filter((session) => pendingSessions.includes(session)).length;
          const state = waits > 0 ? "wait" : sessions.length > 0 ? "live" : "idle";
          const chipLabel =
            waits > 0 ? `${waits} wait` : sessions.length > 0 ? String(sessions.length) : "—";
          const chipBg =
            state === "wait"
              ? "var(--wait)"
              : state === "live"
                ? "color-mix(in oklab, var(--live) 18%, transparent)"
                : "transparent";
          const chipFg =
            state === "wait" ? "var(--bg-0)" : state === "live" ? "var(--live)" : "var(--fg-3)";
          const color = ws.groups[0]?.color ?? "var(--pri)";
          const repoLabel = active && git?.isRepo ? "1 repo" : (dirName(ws.dir) ?? "workspace");
          const title = workspaceTitle(ws);
          return (
            <div
              key={ws.id}
              className={`ch-tab${active ? " active" : ""}`}
              title={`${title} · ${sessions.length} session${sessions.length === 1 ? "" : "s"}${waits > 0 ? ` · ${waits} awaiting input` : ""}`}
              onClick={() => switchWorkspace(ws.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 10px 0 6px",
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
              <span className="tab-handle" title="Drag to reorder / dock" />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                  border: `1px solid color-mix(in oklab, ${color} 60%, #000)`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: active ? "var(--fg-0)" : "var(--fg-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                  {repoLabel}
                </span>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: state === "wait" ? 600 : 500,
                  color: chipFg,
                  background: chipBg,
                  padding: "1px 5px",
                  borderRadius: 999,
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                {state === "live" && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--live)",
                    }}
                  />
                )}
                {chipLabel}
              </span>
              <IconBtn
                title="Close workspace"
                style={{ width: 18, height: 18, marginLeft: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  const result = confirmCloseWorkspace(ws.id);
                  if (result) void closeWorkspace(ws.id);
                }}
              >
                {Ico.close}
              </IconBtn>
            </div>
          );
        })}

        {/* new workspace — opens the workspace wizard */}
        <button
          type="button"
          title="New workspace (⌘⇧N)"
          onClick={() => setNewWorkspace(true)}
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
                const color = ws.groups[0]?.color ?? "var(--pri)";
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
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: color,
                        border: `1px solid color-mix(in oklab, ${color} 60%, #000)`,
                        flexShrink: 0,
                      }}
                    />
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
                        {workspaceTitle(ws)}
                      </span>
                      <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                        {ws.id === activeId && git?.isRepo
                          ? "1 repo"
                          : (dirName(ws.dir) ?? "workspace")}
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
