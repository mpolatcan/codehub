/**
 * DevPreview — dev-only harness for previewing ported screens in isolation.
 * Gated behind import.meta.env.DEV + the #/__screens hash in main.tsx. NOT in
 * production builds. Provides a screen switcher + dark/light theme toggle so the
 * Phase-2 screens (Settings, Empty state, Spawn dialog) can be reviewed against
 * the design without the live tmux/Docker runtime.
 */
import { AppShell } from "@/app/components/chrome/AppShell";
import { SidebarRail } from "@/app/components/chrome/SidebarRail";
import { useTheme } from "@/app/lib/theme";
import { EmptyState } from "@/app/screens/EmptyState";
import { Settings } from "@/app/screens/Settings";
import { SpawnDialog } from "@/app/screens/SpawnDialog";
import { useEffect, useState } from "react";

type ScreenKey = "empty" | "settings" | "spawn";

const SCREENS: { key: ScreenKey; label: string; title: string }[] = [
  { key: "empty", label: "Empty state", title: "codehub · welcome" },
  { key: "settings", label: "Settings", title: "codehub · settings" },
  { key: "spawn", label: "Spawn dialog", title: "codehub · new agent" },
];

function currentScreen(): ScreenKey {
  const m = window.location.hash.match(/#\/__screens\/(\w+)/);
  const k = m?.[1] as ScreenKey | undefined;
  return k && SCREENS.some((s) => s.key === k) ? k : "empty";
}

export default function DevPreview() {
  const { theme, toggle } = useTheme();
  const [screen, setScreen] = useState<ScreenKey>(currentScreen);

  useEffect(() => {
    const onHash = () => setScreen(currentScreen());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (k: ScreenKey) => {
    window.location.hash = `#/__screens/${k}`;
    setScreen(k);
  };

  const meta = SCREENS.find((s) => s.key === screen) ?? SCREENS[0];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-0)",
      }}
    >
      {/* dev toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderBottom: "1px solid var(--bd-soft)",
          background: "var(--bg-1)",
          flexShrink: 0,
          fontFamily: "var(--sans)",
        }}
      >
        <span className="lbl" style={{ color: "var(--fg-2)" }}>
          P2 preview
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {SCREENS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => select(s.key)}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--r-2)",
                border: "1px solid var(--bd)",
                background: screen === s.key ? "var(--bg-3)" : "transparent",
                color: screen === s.key ? "var(--fg-0)" : "var(--fg-2)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={toggle}
          style={{
            padding: "4px 12px",
            borderRadius: "var(--r-2)",
            border: "1px solid var(--bd)",
            background: "var(--bg-3)",
            color: "var(--fg-0)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Theme: {theme}
        </button>
      </div>

      {/* framed screen */}
      <div style={{ flex: 1, overflow: "hidden", padding: 16 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r-4)",
            overflow: "hidden",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <AppShell title={meta.title} rail={screen === "settings" ? <SidebarRail /> : undefined}>
            {screen === "empty" && <EmptyState onNew={() => {}} />}
            {screen === "settings" && <Settings onStopAll={() => {}} />}
            {screen === "spawn" && (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <SpawnDialog standalone onLaunch={() => {}} onCancel={() => {}} />
              </div>
            )}
          </AppShell>
        </div>
      </div>
    </div>
  );
}
