import { useEffect, useState } from "react";
import { CLIS } from "../lib/catalog";
import { type AppInfo, type ImageInfo, ipc } from "../lib/ipc";
import { useOverlay } from "../lib/overlay";
import { useStore } from "../lib/store";
import { Logo } from "./primitives/Logo";

// About CodeHub — a modal "about this app", ported from design/screens/about.jsx.
// Opened from the sidebar wordmark. Every value shown is REAL: version/os/arch
// from app_info, the daemon line from docker_info, the runtime image from
// container_image, agent versions from the bootstrap probe. The design mock
// carried an updater ("update available v0.43.0") and a hand-written changelog;
// CodeHub has no updater wired and no curated changelog feed, so neither is
// shown — fabricating them would violate the no-fabrication rule. The footer
// states the honest auto-update posture instead, and links out to the repo
// releases page (selectable text — no in-app browser is opened).
const REPO_RELEASES = "https://github.com/mpolatcan/codehub/releases";

export function AboutDialog() {
  const open = useOverlay((s) => s.about);
  const close = () => useOverlay.getState().setAbout(false);
  const dockerInfo = useStore((s) => s.dockerInfo);
  const agentVersions = useStore((s) => s.agentVersions);

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [image, setImage] = useState<ImageInfo | null>(null);

  // Fetch the static identity (app_info) + the runtime image tag once the dialog
  // is opened. Both are cheap reads; image is best-effort (em-dash if the daemon
  // is down). Guarded by `open` so a closed dialog does no I/O.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    ipc
      .appInfo()
      .then((i) => alive && setAppInfo(i))
      .catch(() => alive && setAppInfo(null));
    ipc
      .containerImage()
      .then((i) => alive && setImage(i))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  const dash = "—";
  const platform = appInfo ? `${appInfo.os}-${appInfo.arch}` : dash;
  const dockerLine = dockerInfo?.reachable ? (dockerInfo.version ?? "reachable") : "not reachable";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(6,7,9,0.72)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div
        style={{
          width: 600,
          maxWidth: "calc(100vw - 48px)",
          background: "var(--bg-2)",
          border: "1px solid var(--bd-strong)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,.6)",
          color: "var(--fg-1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* hero */}
        <div
          style={{
            padding: "26px 28px 22px",
            background: "linear-gradient(135deg, oklch(0.25 0.06 250), var(--bg-2))",
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "var(--bg-0)",
              border: "1px solid var(--bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Logo size={32} withText={false} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--fg-0)",
              }}
            >
              CodeHub
            </div>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--fg-2)",
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>
                v{appInfo?.version ?? dash} · {platform}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "color-mix(in oklab, var(--live) 12%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--live) 30%, transparent)",
                  color: "var(--live)",
                  fontSize: 10.5,
                }}
              >
                <span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--live)" }}
                />
                desktop
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="mono"
            style={{
              alignSelf: "flex-start",
              padding: "3px 8px",
              borderRadius: 6,
              border: "1px solid var(--bd)",
              background: "var(--bg-1)",
              color: "var(--fg-2)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            esc
          </button>
        </div>

        {/* environment — every field is real */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--bd-soft)" }}>
          <div className="lbl" style={{ fontSize: 11, marginBottom: 10 }}>
            Environment
          </div>
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 24px",
              fontSize: 11.5,
            }}
          >
            <Kv k="Version" v={appInfo ? `v${appInfo.version}` : dash} />
            <Kv k="Docker" v={dockerLine} />
            <Kv k="OS" v={appInfo?.os ?? dash} />
            <Kv k="Docker API" v={dockerInfo?.apiVersion ?? dash} />
            <Kv k="Architecture" v={appInfo?.arch ?? dash} />
            <Kv k="Image" v={image?.tag ?? dash} />
          </div>
        </div>

        {/* agents — real versions from the runtime probe */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid var(--bd-soft)" }}>
          <div className="lbl" style={{ fontSize: 11, marginBottom: 10 }}>
            Agents
          </div>
          <div
            className="mono"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 24px",
              fontSize: 11.5,
            }}
          >
            {CLIS.map((c) => (
              <Kv key={c.id} k={c.label} v={agentVersions?.[c.id]?.version ?? dash} />
            ))}
          </div>
        </div>

        {/* credits */}
        <div
          style={{
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 11.5,
            color: "var(--fg-2)",
            flexWrap: "wrap",
          }}
        >
          <span>MIT licensed</span>
          <span style={{ color: "var(--fg-3)" }}>·</span>
          <span>built on Tauri, tmux, Docker, and Geist Mono</span>
        </div>

        {/* footer — honest auto-update posture (no updater is wired) */}
        <div
          style={{
            padding: "12px 28px",
            borderTop: "1px solid var(--bd-soft)",
            background: "var(--bg-1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            auto-update not configured — releases at
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-1)", userSelect: "all" }}>
            {REPO_RELEASES}
          </span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={close}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "1px solid var(--bd)",
              background: "var(--bg-2)",
              color: "var(--fg-0)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Mono key/value row: dim key left, bright value right, truncated.
function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span
        style={{
          color: "var(--fg-0)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {v}
      </span>
    </div>
  );
}
