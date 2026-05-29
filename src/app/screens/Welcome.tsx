import { AgentGlyph } from "@/app/components/primitives/AgentGlyph";
import { StatusDot, type StatusKey } from "@/app/components/primitives/StatusDot";
import { Ico } from "@/app/components/primitives/icons";
import {
  type ContainerState,
  type SavedWorkspace,
  type WorkspaceContainer,
  ipc,
} from "@/app/lib/ipc";
import { useOverlay } from "@/app/lib/overlay";
import { containerKeyFor, useStore } from "@/app/lib/store";
import { workspaceLeaves } from "@/app/lib/tree";
import { Button } from "@/app/ui/button";
import { useEffect, useMemo, useState } from "react";

// One launcher row = one workspace you can open. Keyed by CONTAINER key (a saved
// workspace maps to its container via `containerKeyFor`); merges three sources so
// the list shows EVERY reopenable workspace, not just named/saved ones:
//   - a real container (running or stopped), enriched with its saved name/dir,
//   - an unsaved container (ad-hoc / restored), derived-named,
//   - a saved workspace with no container yet (create-on-open).
interface LauncherEntry {
  key: string;
  name: string;
  dir?: string;
  pinned: boolean;
  lastOpened: number | null;
  savedId?: string;
  container?: WorkspaceContainer;
}

// Friendly name for an unsaved container key: "<lead>-sw-<id>" → "<lead>";
// "ws-<n>-<rand>" → "Workspace <n>"; else the raw key.
function deriveName(key: string): string {
  const sw = /^(.+?)-sw-[a-z0-9-]+$/i.exec(key);
  if (sw?.[1]) return sw[1];
  const wsN = /^ws-(\d+)-/.exec(key);
  if (wsN) return `Workspace ${wsN[1]}`;
  return key;
}

// Short, readable container id for the card's "behind this" row.
function shortContainer(name: string): string {
  const s = name.replace(/^\/?codehub-ws-/, "");
  return s.length > 30 ? `${s.slice(0, 28)}…` : s;
}

const STATE_DOT: Record<ContainerState, StatusKey> = {
  running: "live",
  starting: "wait",
  stopped: "off",
  missing: "off",
  unreachable: "err",
};

function buildEntries(saved: SavedWorkspace[], containers: WorkspaceContainer[]): LauncherEntry[] {
  const savedByKey = new Map<string, SavedWorkspace>();
  for (const sw of saved) {
    savedByKey.set(containerKeyFor({ title: sw.name, savedWorkspaceId: sw.id }), sw);
  }
  const seen = new Set<string>();
  const out: LauncherEntry[] = [];
  for (const c of containers) {
    const sw = savedByKey.get(c.key);
    out.push({
      key: c.key,
      name: sw?.name ?? deriveName(c.key),
      dir: sw?.dir,
      pinned: sw?.pinned ?? false,
      lastOpened: sw?.lastOpened ?? null,
      savedId: sw?.id,
      container: c,
    });
    seen.add(c.key);
  }
  for (const sw of saved) {
    const key = containerKeyFor({ title: sw.name, savedWorkspaceId: sw.id });
    if (seen.has(key)) continue;
    out.push({
      key,
      name: sw.name,
      dir: sw.dir,
      pinned: sw.pinned,
      lastOpened: sw.lastOpened,
      savedId: sw.id,
    });
  }
  // Running containers first, then pinned, then most-recently-opened.
  return out.sort((a, b) => {
    const ar = a.container?.status.state === "running" ? 1 : 0;
    const br = b.container?.status.state === "running" ? 1 : 0;
    if (ar !== br) return br - ar;
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.lastOpened ?? 0) - (a.lastOpened ?? 0);
  });
}

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

// Rendered two ways: inline as the Hub's empty state (no `onClose`), and as the
// launcher OVERLAY above open tabs (`onClose` set, opened by ⌘T / the tab "+").
// In overlay mode every action closes the launcher after acting, and Esc / a
// close button dismiss it — so a workspace can be reopened or resumed without
// first closing every tab.
export function Welcome({ onClose }: { onClose?: () => void } = {}) {
  const saved = useStore((s) => s.config?.savedWorkspaces) ?? [];
  const containers = useStore((s) => s.workspaceContainers) ?? [];
  const openWizard = useOverlay((s) => s.setNewWorkspace);
  const setResume = useOverlay((s) => s.setResume);
  const setView = useStore((s) => s.setView);
  const setSettingsSection = useStore((s) => s.setSettingsSection);
  const refreshContainers = useStore((s) => s.refreshWorkspaceContainers);
  const [query, setQuery] = useState("");

  // Live fleet ops (rehomed from the old Workspaces screen). Poll the real tmux
  // session keys every 3s to tell which RUNNING containers are idle (no agents),
  // and re-read the container fleet so cards/counts stay current as the user
  // stops/prunes. Lifecycle reuses the same ipc the inspector used.
  const [liveKeys, setLiveKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    const tick = () => {
      void refreshContainers();
      ipc
        .listSessions()
        .then((ss) => alive && setLiveKeys(new Set(ss.map((s) => s.workspace))))
        .catch(() => {});
    };
    tick();
    const h = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [refreshContainers]);

  const stoppedContainers = containers.filter((c) => c.status.state !== "running");
  // Idle = running but no real tmux session — the empty containers that leak
  // CPU/mem. Saved-but-empty counts too: this is the user's explicit choice.
  const idleContainers = containers.filter(
    (c) => c.status.state === "running" && !liveKeys.has(c.key),
  );
  const stopIdle = async () => {
    if (idleContainers.length === 0) return;
    await Promise.all(idleContainers.map((c) => ipc.containerStop(c.key).catch(() => {})));
    await refreshContainers();
  };
  const pruneStopped = async () => {
    if (stoppedContainers.length === 0) return;
    const n = stoppedContainers.length;
    if (
      !window.confirm(
        `Remove ${n} stopped container${n === 1 ? "" : "s"}? Bind-mounted /workspace files are preserved; container-local state is lost.`,
      )
    )
      return;
    await Promise.all(
      stoppedContainers.map((c) => ipc.removeWorkspaceContainer(c.key).catch(() => {})),
    );
    await refreshContainers();
  };

  // Overlay mode: Esc dismisses (stopPropagation so it doesn't also fire a pane's
  // own Esc handler behind the scrim).
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const entries = useMemo(() => buildEntries(saved, containers), [saved, containers]);
  const q = query.toLowerCase();
  const filtered = useMemo(
    () =>
      entries.filter(
        (e) => !q || e.name.toLowerCase().includes(q) || (e.dir ?? "").toLowerCase().includes(q),
      ),
    [entries, q],
  );
  const showSearch = entries.length >= 4;

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
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {idleContainers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => void stopIdle()}
              title="Stop running containers that have no agents (frees CPU/mem)"
            >
              Stop idle · {idleContainers.length}
            </Button>
          )}
          {stoppedContainers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => void pruneStopped()}
              title="Remove all stopped containers"
            >
              Prune stopped
            </Button>
          )}
          <Button
            onClick={() => {
              openWizard(true);
              onClose?.();
            }}
            title="Create a new workspace"
          >
            {Ico.plus}New workspace
          </Button>
        </div>
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

        {filtered.length > 0 && (
          <CardSection title="Workspaces" count={filtered.length}>
            {filtered.map((e) => (
              <WorkspaceCard key={e.key} entry={e} onClose={onClose} />
            ))}
          </CardSection>
        )}

        {query && filtered.length === 0 && (
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
              onClick={() => {
                openWizard(true);
                onClose?.();
              }}
            />
            <TemplateCard
              title="From GitHub"
              desc="Clone a repo URL, auto-detect language, pre-configure container."
              icon={Ico.search}
              cta="Clone repo"
              onClick={() => {
                setSettingsSection("integrations");
                setView("settings");
                onClose?.();
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
                onClose?.();
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

function WorkspaceCard({ entry, onClose }: { entry: LauncherEntry; onClose?: () => void }) {
  const workspaces = useStore((s) => s.workspaces);
  const sessionMeta = useStore((s) => s.sessionMeta);
  const openSavedWorkspace = useStore((s) => s.openSavedWorkspace);
  const openContainerWorkspace = useStore((s) => s.openContainerWorkspace);
  const removeSavedWorkspace = useStore((s) => s.removeSavedWorkspace);
  const togglePin = useStore((s) => s.toggleWorkspacePin);
  const beginNewWorkspaceSpawn = useStore((s) => s.beginNewWorkspaceSpawn);
  const refreshContainers = useStore((s) => s.refreshWorkspaceContainers);

  // Match the live tab by CONTAINER key (accurate — saved workspaces can share a
  // /workspace dir, so a dir match would mark them all "open").
  const liveWs = workspaces.find((w) => w.containerKey === entry.key);
  const isOpen = !!liveWs;
  const agents = (liveWs ? workspaceLeaves(liveWs) : [])
    .map((s) => sessionMeta[s])
    .filter((m) => m && m.cli !== "shell");

  const state = entry.container?.status.state;
  const dot: StatusKey = state ? STATE_DOT[state] : "off";
  const stateLabel = isOpen
    ? "open"
    : !entry.container
      ? "no container"
      : state === "running"
        ? "running"
        : state === "starting"
          ? "starting"
          : "stopped";
  const action = isOpen ? "Show" : entry.container ? "Resume" : "Open";

  // Click = open/resume into the Hub. An existing container is adopted (its live
  // agents re-attach) or opened empty; a saved workspace with no container yet is
  // created through the spawn dialog (mount set first).
  const open = async () => {
    if (entry.container) {
      await openContainerWorkspace(entry.key);
    } else if (entry.savedId) {
      await openSavedWorkspace(entry.savedId);
      // No container yet → create the workspace tab bound to the saved identity
      // with an inline configuring first pane (replaces the legacy spawn modal).
      beginNewWorkspaceSpawn(undefined, {
        title: entry.name,
        dir: entry.dir,
        savedWorkspaceId: entry.savedId,
      });
    } else {
      await openContainerWorkspace(entry.key);
    }
    onClose?.();
  };

  // Remove from the launcher. For a container-backed entry this PRUNES the
  // container (reclaims it) behind a confirm; for a saved-only entry it just drops
  // the config record. Hidden while the workspace is open in a tab (close it with
  // ⌘⇧W first — can't prune the container you're attached to).
  const canRemove = !isOpen && (entry.container != null || entry.savedId != null);
  const remove = async () => {
    if (entry.container) {
      if (
        !window.confirm(
          `Remove the "${entry.name}" workspace container? Bind-mounted /workspace files are preserved; container-local state is lost.`,
        )
      )
        return;
      await ipc.removeWorkspaceContainer(entry.key).catch(() => {});
    }
    if (entry.savedId) await removeSavedWorkspace(entry.savedId);
    await refreshContainers();
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
      title={`${entry.name} — ${action.toLowerCase()} (${stateLabel})`}
      style={{
        padding: "14px 16px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderColor: isOpen ? "var(--pri)" : undefined,
      }}
    >
      {/* name row: pin + name + state badge + remove */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {entry.savedId && (
          <button
            type="button"
            title={entry.pinned ? "Unpin" : "Pin to top"}
            aria-pressed={entry.pinned}
            onClick={(e) => {
              e.stopPropagation();
              if (entry.savedId) void togglePin(entry.savedId);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 2,
              cursor: "pointer",
              color: entry.pinned ? "var(--wait)" : "var(--fg-3)",
              display: "inline-flex",
              lineHeight: 0,
            }}
          >
            <PinGlyph filled={entry.pinned} />
          </button>
        )}
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
          {entry.name}
        </span>
        <span
          title={`Container is ${stateLabel}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: isOpen ? "var(--pri)" : dot === "live" ? "var(--live)" : "var(--fg-3)",
            padding: "2px 6px",
            borderRadius: 999,
            background: isOpen
              ? "color-mix(in oklab, var(--pri) 12%, transparent)"
              : dot === "live"
                ? "color-mix(in oklab, var(--live) 12%, transparent)"
                : "var(--bg-3)",
          }}
        >
          <StatusDot status={isOpen ? "live" : dot} pulse={isOpen} />
          {stateLabel}
        </span>
        {canRemove && (
          <button
            type="button"
            className="ws-remove"
            title={
              entry.container ? "Remove workspace + prune container" : "Remove from workspaces"
            }
            onClick={(e) => {
              e.stopPropagation();
              void remove();
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
        )}
      </div>

      {/* container identity — WHICH container is behind this workspace */}
      <div
        title={entry.container?.status.name ?? "No container yet — opening creates one"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--fg-2)",
        }}
      >
        <span style={{ color: "var(--fg-3)", display: "inline-flex" }}>{Ico.container}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.container ? shortContainer(entry.container.status.name) : "no container yet"}
        </span>
        {entry.dir && (
          <>
            <span style={{ color: "var(--fg-3)" }}>·</span>
            <span
              title={entry.dir}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                color: "var(--fg-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {Ico.branch}
              {dirName(entry.dir)}
            </span>
          </>
        )}
      </div>

      {/* footer: agents (when live) + age + the open/resume affordance */}
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
        {agents.length > 0 ? (
          <>
            <span>
              {agents.length} agent{agents.length === 1 ? "" : "s"}
            </span>
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
          </>
        ) : (
          <span style={{ color: "var(--fg-3)" }}>{relTime(entry.lastOpened)}</span>
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--fg-1)" }}
        >
          {action}
          {Ico.arrowR}
        </span>
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
