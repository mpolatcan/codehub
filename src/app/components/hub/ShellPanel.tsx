import { useEffect, useState } from "react";
import { PaneMount } from "../../components/PaneMount";
import { IconBtn } from "../../components/primitives/IconBtn";
import { StatusDot } from "../../components/primitives/StatusDot";
import { Ico } from "../../components/primitives/icons";
import { useOverlay } from "../../lib/overlay";
import { activeWorkspace, useStore } from "../../lib/store";

// Docked bottom shell panel (design/screens/hub-states.jsx ShellPanel). It
// mounts a real reusable tmux shell for the active workspace container; it is
// intentionally not part of the split-grid tree.
export function ShellPanel() {
  const ws = useStore(activeWorkspace);
  const status = useStore((s) => s.status);
  const ensureDockedShell = useStore((s) => s.ensureDockedShell);
  const setShell = useOverlay((s) => s.setShell);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const running = status?.state === "running";
  const containerKey = ws?.containerKey ?? null;

  useEffect(() => {
    let alive = true;
    setSession(null);
    setErr(null);
    if (!containerKey) return;
    if (!running) {
      setLoading(false);
      return;
    }

    setLoading(true);
    ensureDockedShell()
      .then((name) => {
        if (!alive) return;
        setSession(name);
        setErr(name ? null : "No workspace shell is available.");
      })
      .catch((e) => {
        if (alive) setErr(String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [containerKey, ensureDockedShell, running]);

  return (
    <div
      style={{
        flexShrink: 0,
        height: 224,
        background: "var(--bg-0)",
        borderTop: "1px solid var(--bd-soft)",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 32,
          flexShrink: 0,
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "0 10px",
        }}
      >
        <span style={{ color: "var(--live)", display: "inline-flex" }}>{Ico.terminal}</span>
        <span style={{ fontSize: 12, color: "var(--fg-0)", fontWeight: 500 }}>Shell</span>
        <div style={{ display: "flex", gap: 2, marginLeft: 7, minWidth: 0 }}>
          <ShellTab name={session ? "bash · workspace shell" : "workspace shell"} active />
        </div>
        <span style={{ flex: 1 }} />
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            minWidth: 0,
            color: "var(--fg-3)",
            fontSize: 10,
          }}
          title={status?.name ?? containerKey ?? undefined}
        >
          <StatusDot status={running ? "live" : "off"} pulse={running} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {status?.name ?? containerKey ?? "no workspace"}
          </span>
        </span>
        <IconBtn
          title="Detach to grid pane (not available yet)"
          disabled
          style={{ width: 22, height: 22 }}
        >
          {Ico.expand}
        </IconBtn>
        <IconBtn
          title="Hide shell (⌘⇧B)"
          onClick={() => setShell(false)}
          style={{ width: 22, height: 22 }}
        >
          {Ico.close}
        </IconBtn>
      </div>

      <div className="pane-body" style={{ background: "var(--bg-0)" }}>
        {session ? (
          <PaneMount session={session} />
        ) : (
          <ShellEmpty loading={loading} running={running} err={err} />
        )}
      </div>
    </div>
  );
}

function ShellTab({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      title={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 4,
        fontFamily: "var(--mono)",
        fontSize: 11,
        background: active ? "var(--bg-3)" : "transparent",
        color: active ? "var(--fg-0)" : "var(--fg-2)",
        border: active ? "1px solid var(--bd-soft)" : "1px solid transparent",
        minWidth: 0,
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 160,
        }}
      >
        {name}
      </span>
    </span>
  );
}

function ShellEmpty({
  loading,
  running,
  err,
}: {
  loading: boolean;
  running: boolean;
  err: string | null;
}) {
  const text = err
    ? err
    : loading
      ? "Starting shell session..."
      : running
        ? "Shell session is not ready."
        : "Start the workspace container to open shell.";
  return (
    <div
      className="mono"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: err ? "var(--err)" : "var(--fg-3)",
        fontSize: 12,
        padding: 18,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
