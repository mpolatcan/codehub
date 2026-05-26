/**
 * Welcome — the workspace launcher. Ported from design/screens/welcome.jsx, the
 * first screen when no agent tab is open AND the user has saved workspaces (a
 * cold first run with none shows EmptyHero instead).
 *
 * Honest data model: a saved workspace is a name + host directory pointer
 * (config.savedWorkspaces) — every workspace shares the ONE runtime container, so
 * the design's per-workspace container size / vCPU·RAM / live-agent footer are
 * dropped rather than fabricated. Each card shows what's real: the name, the
 * mounted directory, when it was last opened, a pin toggle, and an "open" badge
 * when it's the directory currently bound at /workspace.
 *
 * Opening a workspace points the /workspace mount at its dir and opens the spawn
 * launcher to start the first agent (the same launcher used everywhere). If the
 * dir differs from what's mounted, the launcher surfaces the existing "restart
 * runtime to apply" affordance — honest about the shared-container constraint.
 */
import { Ico } from "@/app/components/primitives/icons";
import { shortPath } from "@/app/components/spawn-form";
import type { SavedWorkspace } from "@/app/lib/ipc";
import { useLauncher } from "@/app/lib/launcher";
import { useOverlay } from "@/app/lib/overlay";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";

// Relative age from an epoch-ms timestamp (lastOpened). Null/0 → "not opened yet".
function relTime(ms: number | null): string {
  if (!ms) return "not opened yet";
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function Welcome() {
  const saved = useStore((s) => s.config?.savedWorkspaces) ?? [];
  const openWizard = useOverlay((s) => s.setNewWorkspace);
  const setResume = useOverlay((s) => s.setResume);
  const setView = useStore((s) => s.setView);
  const setSettingsSection = useStore((s) => s.setSettingsSection);

  const pinned = saved.filter((w) => w.pinned);
  // Everything else, most-recently-opened first.
  const rest = saved
    .filter((w) => !w.pinned)
    .sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0));

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
      {/* hero band */}
      <div
        style={{
          padding: "40px 48px 24px",
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
            A workspace runs in its own container. Open one to spawn agents inside it.
          </p>
        </div>
        <Button onClick={() => openWizard(true)} title="Create a new workspace (⌘⇧N)">
          {Ico.plus}New workspace
          <span className="kbd" style={{ marginLeft: 6 }}>
            ⌘⇧N
          </span>
        </Button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 48px 32px" }}>
        {pinned.length > 0 && (
          <Section title="Pinned" count={pinned.length}>
            {pinned.map((w) => (
              <WorkspaceCard key={w.id} ws={w} />
            ))}
          </Section>
        )}

        {rest.length > 0 && (
          <Section title="Recent" count={rest.length}>
            {rest.map((w) => (
              <WorkspaceCard key={w.id} ws={w} />
            ))}
          </Section>
        )}

        {/* Start new */}
        <div>
          <div className="lbl" style={{ marginBottom: 12 }}>
            Start a new workspace
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(256px, 1fr))",
              gap: 12,
            }}
          >
            <TemplateCard
              title="Blank workspace"
              desc="Pick a folder and a first agent yourself."
              icon={Ico.plus}
              cta="Start"
              onClick={() => openWizard(true)}
            />
            <TemplateCard
              title="From GitHub"
              desc="Browse the repositories your gh CLI can see, then open one."
              icon={Ico.search}
              cta="Browse repos"
              onClick={() => {
                setSettingsSection("integrations");
                setView("settings");
              }}
            />
            <TemplateCard
              title="Resume a session"
              desc="Reattach to a recent Claude session and continue its transcript."
              icon={Ico.bell}
              cta="Browse sessions"
              // Welcome only renders inside HubView (view is already "hub"), but
              // force it for symmetry with ⌘R / the palette so the drawer always
              // has a host to render in.
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

function Section({
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
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
  const openSavedWorkspace = useStore((s) => s.openSavedWorkspace);
  const removeSavedWorkspace = useStore((s) => s.removeSavedWorkspace);
  const togglePin = useStore((s) => s.toggleWorkspacePin);
  const openLaunch = useLauncher((s) => s.open);

  // "Open" = this workspace's dir is the one currently bound at /workspace.
  const isMounted = effective !== null && effective === ws.dir;

  const open = async () => {
    await openSavedWorkspace(ws.id); // points the mount + marks lastOpened
    openLaunch("newtab"); // start the first agent in it (launcher surfaces any recreate)
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
        borderColor: isMounted ? "var(--pri)" : undefined,
      }}
    >
      {/* top row: pin toggle + name + (open badge / remove) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
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
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-0)", flex: 1, minWidth: 0 }}>
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
          }}
        >
          {Ico.close}
        </button>
      </div>

      {/* dir chip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
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
          {shortPath(ws.dir)}
        </span>
      </div>

      {/* meta: shared runtime + last opened */}
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
        <span>{relTime(ws.lastOpened)}</span>
      </div>
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
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
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
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--fg-2)", lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <Button variant="outline" size="xs" style={{ alignSelf: "flex-start", marginTop: 4 }}>
        {cta}
      </Button>
    </div>
  );
}

// Small pushpin glyph (inline; not part of the shared icon sprite). Filled when
// pinned, outline when not, so the one control reads as a toggle.
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
