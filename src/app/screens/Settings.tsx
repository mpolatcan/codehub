/**
 * Settings — sectioned left-nav + right pane. Ported from design/screens/settings.jsx.
 *
 * Every pane is now ported and reads real data:
 *  - Agents & API keys: versions from `agent_versions`, connection state from
 *    `agent_key_status` (host-env presence, never the value); default agent is
 *    live (config store → launcher); "Stop all" is real (closeAllSessions).
 *  - Container runtime / Repositories: live `docker_*` / git reads.
 *  - Appearance: theme (useTheme) + terminal font size (config store → panes) +
 *    density (config store → data-density on <html> → compact chrome).
 *  - General: "confirm before closing a running agent" (config store + ⌘W guard)
 *    + Startup restore/reopen (config store → boot lifecycle session adoption).
 *  - Notifications: the three prefs persist for real (config store); OS delivery
 *    isn't wired yet, stated honestly in the pane (no fabricated capability).
 *  - About: build/host identity from `app_info` / `docker_info`; update status
 *    from `check_update` (honest "up to date" — the updater plugin isn't wired,
 *    so `available` is null and there is no in-app install).
 *
 * The persisted preferences live in the config store (config::Settings, written
 * to settings.json) — get/set via `ipc.getConfig`/`setConfig`, surfaced through
 * the store's `config` + `updateConfig`. Controls whose feature isn't built yet
 * (per-agent permissions, cost/context budgets) render disabled until they wire.
 *
 * Copy note: keys are forwarded from the host environment, NOT an OS keychain —
 * wording corrected from the design.
 */
import { AGENT_META, AgentGlyph } from "@/app/components/primitives/AgentGlyph";
import { Logo } from "@/app/components/primitives/Logo";
import { Segmented } from "@/app/components/primitives/Segmented";
import { StatusDot } from "@/app/components/primitives/StatusDot";
import { Tag } from "@/app/components/primitives/Tag";
import { Ico } from "@/app/components/primitives/icons";
import { CLIS } from "@/app/lib/catalog";
import {
  type AgentCli,
  type AppInfo,
  type AppSettings,
  type AuthProgress,
  type Cli,
  ipc,
  onAuthProgress,
} from "@/app/lib/ipc";
import { useStore } from "@/app/lib/store";
import { type Theme, useTheme } from "@/app/lib/theme";
import { Button } from "@/app/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/ui/select";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { ApiKeyDialog } from "../components/ApiKeyDialog";
import { LoginTerminalDialog } from "../components/LoginTerminalDialog";
import { AgentDetail } from "./AgentDetail";
import { IntegrationsPane } from "./Integrations";

export interface SettingsProps {
  /** Kill every running session. Defaults to the store's closeAllSessions. */
  onStopAll?: () => void;
  /** Dev preview hook: open Agents directly on one agent's factual detail view. */
  initialAgentDetail?: AgentCli;
}

const NAV_GROUPS: { label: string; items: { key: string; label: string; soon?: boolean }[] }[] = [
  {
    label: "Workspace",
    items: [
      { key: "general", label: "General" },
      { key: "agents", label: "Agents & API keys" },
      { key: "integrations", label: "Integrations" },
      { key: "platform", label: "Platform" },
    ],
  },
  {
    label: "Experience",
    items: [
      { key: "notifications", label: "Notifications" },
      { key: "appearance", label: "Appearance" },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "billing", label: "Usage & billing", soon: true },
      { key: "team", label: "Team", soon: true },
    ],
  },
];

export function Settings({ onStopAll, initialAgentDetail }: SettingsProps) {
  // Every pane is now ported. Panes with a real backend (Agents, Container
  // runtime, Repositories, Keyboard shortcuts, Appearance, About) show live
  // data; the rest (General, Notifications) render honest disabled controls
  // until the Tier-2 config store lands (BACKEND_PLAN.md).
  // Active sub-pane is lifted to the store so other surfaces can deep-link into a
  // pane (the sidebar's "Integrations" entry, Welcome's "From GitHub" card, the
  // palette's GitHub repo rows) by setting it before navigating to Settings.
  const active = useStore((s) => s.settingsSection);
  const setActive = useStore((s) => s.setSettingsSection);

  // App/platform identity is static (build + host consts), so fetch it once.
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  useEffect(() => {
    let alive = true;
    ipc
      .appInfo()
      .then((info) => alive && setAppInfo(info))
      .catch(() => alive && setAppInfo(null));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        background: "var(--bg-1)",
        minWidth: 0,
        height: "100%",
        color: "var(--fg-1)",
      }}
    >
      {/* settings nav */}
      <nav
        style={{
          width: 220,
          flexShrink: 0,
          background: "var(--bg-1)",
          borderRight: "1px solid var(--bd-soft)",
          padding: "20px 12px",
          overflow: "auto",
        }}
        className="scroll"
      >
        <h2 style={{ margin: "0 6px 14px", fontSize: 17, fontWeight: 600, color: "var(--fg-0)" }}>
          Settings
        </h2>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <div className="lbl" style={{ padding: "0 6px 4px" }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => !item.soon && setActive(item.key)}
                disabled={item.soon}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12.5,
                  fontFamily: "var(--sans)",
                  color: item.soon
                    ? "var(--fg-3)"
                    : active === item.key
                      ? "var(--fg-0)"
                      : "var(--fg-1)",
                  background: active === item.key ? "var(--bg-3)" : "transparent",
                  cursor: item.soon ? "default" : "pointer",
                  opacity: item.soon ? 0.5 : 1,
                  marginBottom: 1,
                  transition: "background 0.12s ease, color 0.12s ease",
                }}
              >
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.soon && (
                  <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)" }}>
                    soon
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* pane */}
      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
        {active === "agents" ? (
          <AgentsPane onStopAll={onStopAll} initialDetail={initialAgentDetail} />
        ) : active === "integrations" ? (
          <IntegrationsPane />
        ) : active === "platform" ? (
          <PlatformPane appInfo={appInfo} />
        ) : active === "notifications" ? (
          <NotificationsPane />
        ) : active === "appearance" ? (
          <AppearancePane />
        ) : (
          <GeneralPane />
        )}
      </div>
    </main>
  );
}

// Page header shared by every pane: title + lead paragraph, capped width.
function PaneHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h1
        style={{
          margin: "0 0 4px",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--fg-0)",
        }}
      >
        {title}
      </h1>
      <p style={{ margin: "0 0 28px", color: "var(--fg-2)", fontSize: 13 }}>{children}</p>
    </>
  );
}

const NATIVE_PROVIDERS: Record<AgentCli, string> = {
  claude: "Anthropic",
  codex: "OpenAI",
  antigravity: "Google",
};

const AGENT_DESCRIPTIONS: Record<AgentCli, string> = {
  claude:
    "Default agent · supports Anthropic + OpenAI-compatible providers (MiniMax, GLM, Qwen, custom). Click the avatar to upload a custom logo PNG — falls back to the built-in glyph.",
  codex:
    "OpenAI agent · uses GPT models via the OpenAI API. Supports standard, auto, and YOLO permission modes.",
  antigravity:
    "Google agent · uses Gemini models. Standard mode only — launch flags are unverified.",
};

function avatarHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function avatarInitials(label: string): string {
  const parts = label.split(/[\s.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

// Agents & API keys — tabbed per-agent view with hero, accounts, and providers.
function AgentsPane({
  onStopAll,
  initialDetail,
}: {
  onStopAll?: () => void;
  initialDetail?: AgentCli;
}) {
  const keyStatus = useStore((s) => s.keyStatus);
  const agentVersions = useStore((s) => s.agentVersions);
  const sessionCount = useStore((s) => Object.keys(s.sessionMeta).length);
  const closeAllSessions = useStore((s) => s.closeAllSessions);
  const config = useStore((s) => s.config);
  const profiles = useStore((s) => s.accountProfiles);
  const loadAccountProfiles = useStore((s) => s.loadAccountProfiles);
  const removeAccountProfile = useStore((s) => s.removeAccountProfile);
  const [detail, setDetail] = useState<AgentCli | null>(initialDetail ?? null);
  const [selectedAgent, setSelectedAgent] = useState<AgentCli>("claude");
  const [keyDialog, setKeyDialog] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginProgress, setLoginProgress] = useState<AuthProgress | null>(null);
  const [terminalDialog, setTerminalDialog] = useState<{
    provider: string;
    profileId: string;
    sessionName: string;
    workspace: string;
  } | null>(null);
  const pendingProfileId = useRef<string | null>(null);

  const stopAll = () => {
    if (sessionCount === 0) return;
    if (!window.confirm(`Stop all ${sessionCount} running session(s)? Scrollback is kept.`)) return;
    (onStopAll ?? (() => void closeAllSessions()))();
  };

  useEffect(() => {
    let unsub: (() => void) | null = null;
    onAuthProgress((p) => {
      setLoginProgress(p);
      if (p.stage === "success") {
        setLoginBusy(null);
        setLoginError(null);
        void loadAccountProfiles();
        setTimeout(() => setLoginProgress(null), 3000);
      } else if (p.stage === "error") {
        setLoginBusy(null);
        setLoginError(p.message ?? "Login failed");
      }
    }).then((u) => {
      unsub = u;
    });
    return () => unsub?.();
  }, [loadAccountProfiles]);

  useEffect(() => {
    void loadAccountProfiles();
  }, [loadAccountProfiles]);

  const defaultLoginLabel = (provider: string) =>
    provider === "github"
      ? "GitHub"
      : provider === "codex"
        ? "Codex"
        : provider === "antigravity"
          ? "Antigravity"
          : "Claude";

  const startLogin = async (provider: string, agent: string) => {
    setLoginBusy(provider);
    setLoginError(null);
    setLoginProgress(null);
    let createdId: string | null = null;
    try {
      const label = defaultLoginLabel(provider);
      const existingIds = new Set(profiles.map((p) => p.id));
      const list = await ipc.addAccountProfile(agent, label, undefined, "vault");
      useStore.setState({ accountProfiles: list });
      const created = list.find((p) => !existingIds.has(p.id));
      if (!created) throw new Error("profile creation failed");
      createdId = created.id;
      const result = await ipc.vaultInitiateOauth(provider, created.id);
      if (result?.sessionName && result?.workspace) {
        pendingProfileId.current = created.id;
        setTerminalDialog({
          provider,
          profileId: created.id,
          sessionName: result.sessionName,
          workspace: result.workspace,
        });
        setLoginBusy(null);
      }
    } catch (e) {
      const msg = String(e).replace(/^Error:\s*/, "");
      setLoginError(msg);
      setLoginBusy(null);
      if (createdId) {
        void useStore.getState().removeAccountProfile(createdId);
      }
    }
  };

  const handleDialogDone = (result: "captured" | "cancelled") => {
    const pendingId = pendingProfileId.current;
    setTerminalDialog(null);
    pendingProfileId.current = null;
    if (result === "captured") {
      void loadAccountProfiles();
    } else if (pendingId) {
      void (async () => {
        try {
          if (await ipc.vaultHasKey(pendingId)) {
            await loadAccountProfiles();
          } else {
            await useStore.getState().removeAccountProfile(pendingId);
          }
        } catch {
          await useStore.getState().removeAccountProfile(pendingId);
        }
      })();
    }
  };

  if (detail)
    return <AgentDetail agent={detail} onBack={() => setDetail(null)} onSwitch={setDetail} />;

  const key = keyStatus?.[selectedAgent];
  const ver = agentVersions?.[selectedAgent];
  const meta = AGENT_META[selectedAgent];
  const cliSpec = CLIS.find((c) => c.id === selectedAgent)!;
  const agentProfiles = profiles.filter((p) => p.agent === selectedAgent);
  const providers = config?.providers ?? [];

  const tabSubtitle = (agent: AgentCli) => {
    if (agent === "claude" && providers.length > 0) return `${providers.length + 1} providers`;
    return NATIVE_PROVIDERS[agent];
  };

  return (
    <div>
      <PaneHead title="Agents & API keys">
        Configure the coding agents available in the spawn dialog. Keys are read from your host
        environment and forwarded into running containers — CodeHub never stores them.
      </PaneHead>

      {/* ── Defaults for new sessions ────────────────────────────────── */}
      <SectionHead label="Defaults for new sessions" />
      <SettingRow
        label="Default agent"
        desc="Pre-selected in the spawn dialog (⌘N)."
        control={<DefaultAgentSelect />}
        live
      />
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--fg-2)" }}>
        The controls below aren't wired yet — they arrive with per-agent permission settings.
      </p>
      <SettingRow
        label="Auto-approve safe commands"
        desc="Read-only operations (ls, cat, git status) run without prompting."
        control={<Toggle on />}
      />
      <SettingRow
        label="Approve writes"
        desc="Always ask before edits, branch ops, or shell execution."
        control={<Toggle on />}
      />
      <SettingRow
        label="Cost budget per turn"
        desc="Auto-pause when a turn exceeds this. 0 disables."
        control={<InputStub value="$1.00" suffix="USD" />}
      />
      <SettingRow
        label="Context budget"
        desc="Stop loading more context once this fills."
        control={<InputStub value="800k" suffix="tokens" />}
        last
      />

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <SectionHead label="Danger zone" tone="err" />
      <div
        className="ch-card"
        style={{
          padding: 14,
          borderColor: "color-mix(in oklab, var(--err) 30%, var(--bd))",
          background: "color-mix(in oklab, var(--err) 4%, var(--bg-2))",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
              Stop all running agents
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
              SIGTERMs every session and persists their tmux scrollback.
              {sessionCount > 0 ? ` ${sessionCount} running.` : " None running."}
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <Button variant="destructive" size="sm" onClick={stopAll} disabled={sessionCount === 0}>
            Stop all
          </Button>
        </div>
      </div>

      {/* ── Agent tab bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--bd-soft)",
          marginBottom: 28,
        }}
      >
        {CLIS.map((c) => {
          const sel = selectedAgent === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedAgent(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                border: "none",
                cursor: "pointer",
                background: "transparent",
                borderBottom: sel ? "2px solid var(--fg-0)" : "2px solid transparent",
                color: sel ? "var(--fg-0)" : "var(--fg-2)",
                fontSize: 13,
                fontFamily: "var(--sans)",
                fontWeight: sel ? 500 : 400,
                marginBottom: -1,
                transition: "color 0.12s ease",
              }}
            >
              <AgentGlyph
                agent={c.id}
                size={14}
                color={sel ? AGENT_META[c.id].accent : "var(--fg-3)"}
              />
              {c.label}
              <span style={{ color: "var(--fg-3)", fontSize: 12 }}>· {tabSubtitle(c.id)}</span>
            </button>
          );
        })}
        <button
          type="button"
          disabled
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "10px 14px",
            border: "none",
            cursor: "default",
            background: "transparent",
            color: "var(--fg-3)",
            fontSize: 12.5,
            fontFamily: "var(--sans)",
            opacity: 0.5,
          }}
        >
          {Ico.plus} Custom agent
        </button>
      </div>

      {/* ── Agent hero ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 18,
          marginBottom: 32,
        }}
      >
        <button
          type="button"
          onClick={() => setDetail(selectedAgent)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            background: `color-mix(in oklab, ${meta.accent} 14%, var(--bg-1))`,
            border: `1px solid color-mix(in oklab, ${meta.accent} 30%, var(--bd))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="View agent details"
        >
          <span style={{ transform: "scale(2.4)" }}>
            <AgentGlyph agent={selectedAgent} size={14} color={meta.accent} />
          </span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--fg-0)",
              }}
            >
              {cliSpec.label}
            </span>
            {ver?.version && <Tag>v{ver.version}</Tag>}
            {key && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: key.present
                    ? "color-mix(in oklab, var(--live) 15%, transparent)"
                    : "color-mix(in oklab, var(--wait) 15%, transparent)",
                  color: key.present ? "var(--live)" : "var(--wait)",
                  border: `1px solid ${
                    key.present
                      ? "color-mix(in oklab, var(--live) 30%, transparent)"
                      : "color-mix(in oklab, var(--wait) 30%, transparent)"
                  }`,
                }}
              >
                <StatusDot status={key.present ? "live" : "wait"} />
                {key.present ? "Connected" : "Key needed"}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--fg-2)",
              lineHeight: 1.55,
              maxWidth: 700,
            }}
          >
            {AGENT_DESCRIPTIONS[selectedAgent]}
          </p>
        </div>
        <div style={{ flexShrink: 0 }}>
          <RefreshVersionsButton />
        </div>
      </div>

      {/* ── Accounts ─────────────────────────────────────────────────── */}
      <SectionHead label={`Accounts · ${agentProfiles.length}`} />
      {agentProfiles.length > 0 ? (
        <div className="ch-card" style={{ padding: 0, marginBottom: 12 }}>
          {agentProfiles.map((p, i) => {
            const hue = avatarHue(p.id);
            const color = `oklch(0.55 0.12 ${hue})`;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderBottom:
                    i === agentProfiles.length - 1 ? "none" : "1px solid var(--bd-soft)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `color-mix(in oklab, ${color} 25%, var(--bg-3))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color,
                    flexShrink: 0,
                  }}
                >
                  {avatarInitials(p.label)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>
                      {p.label}
                    </span>
                    <Tag>{p.agent}</Tag>
                    {p.source === "vault" && (
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
                        keychain
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                    {p.source === "vault"
                      ? p.present
                        ? "stored in keychain"
                        : "missing from keychain"
                      : (p.varName ?? "host env")}
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11.5,
                    color: p.present ? "var(--live)" : "var(--err)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <StatusDot status={p.present ? "live" : "err"} />
                  {p.present ? "Active" : "Missing"}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => void removeAccountProfile(p.id)}
                  aria-label={`Manage ${p.label}`}
                >
                  Manage
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="ch-card"
          style={{
            padding: "20px 16px",
            marginBottom: 12,
            fontSize: 12.5,
            color: "var(--fg-2)",
            textAlign: "center",
          }}
        >
          No accounts configured for {cliSpec.label}.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Button
          variant="outline"
          size="sm"
          disabled={loginBusy != null}
          onClick={() => startLogin(selectedAgent, selectedAgent)}
        >
          {Ico.plus}
          {loginBusy === selectedAgent ? "Signing in…" : `Sign in with ${cliSpec.alias}`}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setKeyDialog(selectedAgent)}>
          Add API key
        </Button>
      </div>

      {loginProgress && loginProgress.stage !== "success" && (
        <div
          className="ch-card mono"
          style={{
            padding: "10px 14px",
            marginBottom: 10,
            fontSize: 11.5,
            color: loginProgress.stage === "error" ? "var(--err)" : "var(--fg-1)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loginProgress.stage === "starting" && (
              <span style={{ color: "var(--fg-2)" }}>Starting...</span>
            )}
            {loginProgress.stage === "url" && (
              <span>Browser opened — authenticate to continue</span>
            )}
            {loginProgress.stage === "device_code" && <span>Enter code in your browser:</span>}
            {loginProgress.stage === "waiting" && (
              <span style={{ color: "var(--fg-2)" }}>Waiting for authentication...</span>
            )}
            {loginProgress.stage === "error" && <span>{loginProgress.message}</span>}
          </div>
          {loginProgress.userCode && (
            <div
              style={{
                padding: "6px 12px",
                background: "var(--bg-0)",
                border: "1px solid var(--bd)",
                borderRadius: 6,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "var(--fg-0)",
                textAlign: "center",
              }}
            >
              {loginProgress.userCode}
            </div>
          )}
          {loginProgress.url && loginProgress.stage !== "error" && (
            <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{loginProgress.url}</div>
          )}
          {loginProgress.message && loginProgress.stage !== "error" && (
            <div style={{ fontSize: 10.5, color: "var(--fg-2)" }}>{loginProgress.message}</div>
          )}
        </div>
      )}

      {loginProgress?.stage === "success" && (
        <div
          className="mono"
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 6,
            background: "color-mix(in oklab, var(--live) 8%, var(--bg-2))",
            border: "1px solid color-mix(in oklab, var(--live) 30%, var(--bd))",
            fontSize: 11.5,
            color: "var(--live)",
          }}
        >
          {loginProgress.message ?? "Signed in successfully"}
        </div>
      )}

      {loginError && !loginProgress && (
        <div
          className="mono"
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 6,
            background: "color-mix(in oklab, var(--err) 8%, var(--bg-2))",
            border: "1px solid color-mix(in oklab, var(--err) 30%, var(--bd))",
            fontSize: 11.5,
            color: "var(--err)",
          }}
        >
          {loginError}
        </div>
      )}

      {/* ── Model Providers ──────────────────────────────────────────── */}
      <SectionHead label={`Model Providers · ${providers.length + 1}`} />
      <div className="ch-card" style={{ padding: 0, marginBottom: 12 }}>
        {/* Native provider for selected agent */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 16px",
            borderBottom: providers.length === 0 ? "none" : "1px solid var(--bd-soft)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--bg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--fg-1)",
              flexShrink: 0,
            }}
          >
            {NATIVE_PROVIDERS[selectedAgent][0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>
                {NATIVE_PROVIDERS[selectedAgent]}
              </span>
              <Tag>default</Tag>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
              Native · {key?.source === "vault" ? "keychain" : "env"}
            </div>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: key?.present ? "var(--live)" : "var(--fg-2)",
              whiteSpace: "nowrap",
            }}
          >
            <StatusDot status={key?.present ? "live" : "idle"} />
            {key?.present ? "Connected" : "Disconnected"}
          </span>
          <button
            type="button"
            style={{
              padding: "4px 6px",
              border: "1px solid var(--bd)",
              borderRadius: 6,
              background: "transparent",
              color: "var(--fg-2)",
              fontSize: 14,
              cursor: "pointer",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            ···
          </button>
        </div>
        {/* Custom providers */}
        {providers.map((p, i) => {
          const hue = avatarHue(p.name);
          const color = `oklch(0.55 0.12 ${hue})`;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderBottom: i === providers.length - 1 ? "none" : "1px solid var(--bd-soft)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `color-mix(in oklab, ${color} 25%, var(--bg-3))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color,
                  flexShrink: 0,
                }}
              >
                {p.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>
                    {p.name}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                  {p.kind}
                  {p.endpoint ? ` · ${p.endpoint}` : ""}
                </div>
              </div>
              {p.models.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.models.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className="mono"
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid var(--bd)",
                        background: "var(--bg-1)",
                        fontSize: 10.5,
                        color: "var(--fg-1)",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11.5,
                  color: p.enabled ? "var(--live)" : "var(--fg-2)",
                  whiteSpace: "nowrap",
                }}
              >
                <StatusDot status={p.enabled ? "live" : "idle"} />
                {p.enabled ? "Connected" : "Disabled"}
              </span>
              <span
                style={{ color: "var(--fg-3)", fontSize: 16, cursor: "pointer", lineHeight: 1 }}
              >
                ···
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        <Button variant="outline" size="sm" disabled>
          {Ico.plus} Add provider
        </Button>
        {["OpenAI-compatible", "AWS Bedrock", "Vertex AI", "Ollama"].map((preset) => (
          <span
            key={preset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--bd)",
              background: "var(--bg-2)",
              color: "var(--fg-2)",
              fontSize: 11.5,
              opacity: 0.6,
            }}
          >
            {preset}
          </span>
        ))}
      </div>

      {keyDialog && (
        <ApiKeyDialog
          agent={keyDialog}
          onClose={() => setKeyDialog(null)}
          onSaved={() => void loadAccountProfiles()}
        />
      )}
      {terminalDialog && (
        <LoginTerminalDialog
          provider={terminalDialog.provider}
          profileId={terminalDialog.profileId}
          sessionName={terminalDialog.sessionName}
          workspace={terminalDialog.workspace}
          onDone={handleDialogDone}
        />
      )}
    </div>
  );
}

// General — workspace-level defaults, all live (config store). "Confirm before
// closing" gates the ⌘W / close-button kill; the Startup toggles gate the boot
// lifecycle's tmux-session adoption + last-tab restore (store bootstrap).
function GeneralPane() {
  const restore = useStore((s) => s.config?.restoreSessionsOnLaunch ?? true);
  return (
    <div>
      <PaneHead title="General">
        Workspace-wide defaults. Saved to this machine and applied immediately.
      </PaneHead>

      <SectionHead label="Closing" />
      <SettingRow
        label="Confirm before closing a running agent"
        desc="Ask before ⌘W or the close button kills a session whose agent is working."
        control={<LiveToggle field="confirmCloseRunningAgent" />}
        live
        last
      />

      <SectionHead label="Startup" />
      <SettingRow
        label="Restore sessions on launch"
        desc="Reattach to the tmux sessions that survived the last quit. Off leaves them running in the container but starts the Hub clean."
        control={<LiveToggle field="restoreSessionsOnLaunch" />}
        live
      />
      <SettingRow
        label="Reopen last workspace"
        desc="Re-select the tab whose session was focused when you quit. Needs session restore on."
        control={<LiveToggle field="reopenLastWorkspace" disabled={!restore} />}
        live
        last
      />
    </div>
  );
}

// Platform — static capability matrix mapping every feature to where it works:
// Desktop (this build) vs Web (planned). Ported from design/screens/platform.jsx.
// This is a factual reference doc, not live telemetry — the only dynamic value is
// the running build's version (real, from app_info). The desktop column states
// what THIS build ships today; the web column states the planned web build's
// shape. Where the design's mock implied features CodeHub hasn't built yet
// (self-update, push, OS toasts), the desktop cell is marked "planned" too rather
// than claiming support we don't have.
type Support = "full" | "server" | "degraded" | "planned" | "none";
type MatrixRow = { group: string } | { name: string; d: Support; w: Support; note?: string };

const PLATFORM_MATRIX: MatrixRow[] = [
  { group: "Core surfaces" },
  {
    name: "Main Hub (workspace tabs, panes, terminals)",
    d: "full",
    w: "full",
    note: "xterm.js inside the browser tab",
  },
  { name: "Command palette · ⌘K", d: "full", w: "full" },
  { name: "Session detail · diff inspector", d: "full", w: "full" },
  { name: "Resume library · past sessions", d: "full", w: "full" },
  { name: "Dashboard · Usage · Settings", d: "full", w: "full" },

  { group: "Container runtime" },
  {
    name: "Docker daemon access",
    d: "full",
    w: "server",
    note: "Web needs a CodeHub server bridging to a remote daemon",
  },
  {
    name: "Workspace filesystem mount",
    d: "full",
    w: "server",
    note: "Local path on desktop · git URL → server-side checkout on web",
  },
  {
    name: "Built-in container shell (tmux)",
    d: "full",
    w: "full",
    note: "WebSocket from server to xterm.js",
  },
  {
    name: "File browser pane",
    d: "full",
    w: "server",
    note: "Reads container fs through the server proxy",
  },
  { name: "Container exec / restart / stop", d: "full", w: "server" },

  { group: "Notifications & ambient" },
  { name: "In-app notifications (right rail)", d: "full", w: "full" },
  {
    name: "Dynamic Island · live activity",
    d: "full",
    w: "degraded",
    note: "macOS only on desktop · pinned top-center widget in the tab on web",
  },
  {
    name: "OS-native toast (macOS / Win / GNOME)",
    d: "full",
    w: "degraded",
    note: "Fires on await-input / turn-finish · web would use the browser Notification API",
  },
  {
    name: "Push notifications when app is closed",
    d: "planned",
    w: "full",
    note: "Web Push API via the server",
  },
  {
    name: "Companion · floating monitor window",
    d: "full",
    w: "none",
    note: "Requires an always-on-top window — not possible in a browser",
  },
  { name: "Menu bar tray icon", d: "planned", w: "none" },

  { group: "Shortcuts & interactions" },
  { name: "Per-tab keyboard shortcuts (when focused)", d: "full", w: "full" },
  {
    name: "Global shortcuts (when not focused)",
    d: "full",
    w: "none",
    note: "⌘⇧J toggles the companion / island from any app",
  },
  {
    name: "Drag-and-drop files into container",
    d: "planned",
    w: "degraded",
    note: "Browser drop area · no global drop targets",
  },

  { group: "Storage & security" },
  {
    name: "API keys forwarded from host env",
    d: "full",
    w: "server",
    note: "Desktop reads host env vars · web stores secrets server-side",
  },
  {
    name: "Multiple OS users / profiles",
    d: "full",
    w: "full",
    note: "Single-tenant desktop · multi-tenant server on web",
  },
  {
    name: "Offline mode",
    d: "degraded",
    w: "none",
    note: "Local container work still functions on desktop",
  },

  { group: "Integrations" },
  { name: "GitHub auth · clone/push/PR", d: "full", w: "full" },
  {
    name: "MCP servers (stdio)",
    d: "full",
    w: "server",
    note: "A browser cannot spawn local processes",
  },
  { name: "MCP servers (SSE / HTTP)", d: "full", w: "full" },

  { group: "Auto-update & telemetry" },
  {
    name: "Self-update from About",
    d: "planned",
    w: "none",
    note: "Updater not wired yet · web is always latest",
  },
  { name: "Update notification banner", d: "planned", w: "full" },
];

const SUPPORT_META: Record<Support, { color: string; icon: string; label: string }> = {
  full: { color: "var(--live)", icon: "✓", label: "full" },
  server: { color: "var(--idle)", icon: "◐", label: "server" },
  degraded: { color: "var(--wait)", icon: "~", label: "degraded" },
  planned: { color: "var(--fg-2)", icon: "·", label: "planned" },
  none: { color: "var(--err)", icon: "×", label: "no" },
};

const MATRIX_COLS = "1fr 104px 104px 1.1fr";

function PlatformPane({ appInfo }: { appInfo: AppInfo | null }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 26,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--fg-0)",
            }}
          >
            Platform
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--fg-2)",
              fontSize: 13,
              maxWidth: 540,
              lineHeight: 1.5,
            }}
          >
            CodeHub ships desktop-first; web support is on the roadmap. This page maps every feature
            to where it works — so you and your team know what to expect per build. It is a static
            reference, not live status.
          </p>
        </div>
        <span style={{ flex: 1 }} />
        <PlatformPill version={appInfo?.version ?? null} />
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          padding: "10px 14px",
          background: "var(--bg-2)",
          border: "1px solid var(--bd)",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        <span className="lbl" style={{ fontSize: 11 }}>
          legend
        </span>
        <Legend tone="full" label="full support" />
        <Legend tone="server" label="via server" />
        <Legend tone="degraded" label="degraded UX" />
        <Legend tone="planned" label="planned" />
        <Legend tone="none" label="unavailable" />
      </div>

      {/* matrix */}
      <div className="ch-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="mono"
          style={{
            display: "grid",
            gridTemplateColumns: MATRIX_COLS,
            background: "var(--bg-1)",
            borderBottom: "1px solid var(--bd-soft)",
            padding: "10px 16px",
            gap: 12,
            fontSize: 10.5,
            color: "var(--fg-2)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>feature</span>
          <span style={{ textAlign: "center" }}>desktop</span>
          <span style={{ textAlign: "center" }}>web</span>
          <span>note</span>
        </div>
        {PLATFORM_MATRIX.map((r, i) =>
          "group" in r ? (
            <div
              key={r.group}
              className="mono"
              style={{
                padding: "14px 16px 6px",
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: "var(--bg-1)",
                borderTop: i === 0 ? "none" : "1px solid var(--bd-soft)",
              }}
            >
              {r.group}
            </div>
          ) : (
            <div
              key={r.name}
              style={{
                display: "grid",
                gridTemplateColumns: MATRIX_COLS,
                gap: 12,
                padding: "10px 16px",
                borderBottom: "1px solid var(--bd-soft)",
                alignItems: "center",
                fontSize: 12,
              }}
            >
              <span style={{ color: "var(--fg-0)" }}>{r.name}</span>
              <span style={{ textAlign: "center" }}>
                <SupportChip tone={r.d} />
              </span>
              <span style={{ textAlign: "center" }}>
                <SupportChip tone={r.w} />
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                {r.note ?? ""}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// Two-state pill: which platform this build is. Desktop is live (real version);
// web is "planned" until that build exists.
function PlatformPill({ version }: { version: string | null }) {
  const cells: { id: "desktop" | "web"; label: string; on: boolean }[] = [
    { id: "desktop", label: version ? `Desktop · v${version}` : "Desktop", on: true },
    { id: "web", label: "Web · planned", on: false },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--bg-2)",
        border: "1px solid var(--bd)",
        borderRadius: 999,
      }}
    >
      {cells.map((c) => (
        <span
          key={c.id}
          className="mono"
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 12,
            background: c.on ? "var(--bg-0)" : "transparent",
            color: c.on ? "var(--fg-0)" : "var(--fg-2)",
            border: c.on ? "1px solid var(--bd)" : "1px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontWeight: c.on ? 500 : 400,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: c.on ? "var(--live)" : "var(--fg-3)",
            }}
          />
          {c.label}
        </span>
      ))}
    </div>
  );
}

function Legend({ tone, label }: { tone: Support; label: string }) {
  const color = SUPPORT_META[tone].color;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        color: "var(--fg-1)",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: `color-mix(in oklab, ${color} 25%, transparent)`,
          border: `1px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}

function SupportChip({ tone }: { tone: Support }) {
  const m = SUPPORT_META[tone];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        color: m.color,
        background: `color-mix(in oklab, ${m.color} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${m.color} 30%, transparent)`,
      }}
    >
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
}

// Notifications — desktop notification PREFERENCES. The three flags persist for
// real (config::Settings → settings.json) AND drive real OS delivery: the event
// tailer reads the ConfigStore at event time and fires a tauri-plugin-notification
// toast on a permission prompt (await-input) or turn end (turn-finish), with an
// optional sound. Delivery is live in the packaged desktop app; the browser dev
// bridge (`make dev-web`) has no Tauri window so it persists the choice but emits
// no toast — that's the one place a saved toggle won't fire.
function NotificationsPane() {
  return (
    <div>
      <PaneHead title="Notifications">
        How CodeHub should alert you when an agent needs attention while its window isn't focused.
      </PaneHead>

      <SectionHead label="Desktop notifications" />
      <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
        These fire a real OS notification (macOS / Windows / GNOME) when the desktop app is running.
        In the browser dev preview there's no system window, so the choice is saved but no toast
        appears.
      </p>
      <SettingRow
        label="Notify when an agent awaits input"
        desc="OS notification when a backgrounded session hits a permission prompt."
        control={<LiveToggle field="notifyAwaitInput" />}
        live
      />
      <SettingRow
        label="Notify when a turn finishes"
        desc="Ping when an agent completes work in an unfocused session."
        control={<LiveToggle field="notifyTurnFinish" />}
        live
      />
      <SettingRow
        label="Play a sound"
        desc="Audible cue alongside the notification."
        control={<LiveToggle field="playSound" />}
        live
        last
      />

      <SectionHead label="Live activity preview" />
      <LiveActivityPreview />
      <LiveActivityStateGrid />

      <SectionHead label="Cross-platform toasts" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <NotificationPreview os="macOS">
          <MacNotificationPreview />
        </NotificationPreview>
        <NotificationPreview os="Windows 11">
          <WindowsNotificationPreview />
        </NotificationPreview>
        <NotificationPreview os="Linux · GNOME">
          <LinuxNotificationPreview />
        </NotificationPreview>
      </div>
    </div>
  );
}

export function LiveActivityPreview({ variant = "panel" }: { variant?: "panel" | "screen" }) {
  const screen = variant === "screen";
  return (
    <div
      style={{
        position: "relative",
        height: screen ? 420 : 336,
        overflow: "hidden",
        border: screen ? "none" : "1px solid var(--bd)",
        borderRadius: screen ? 0 : 10,
        background:
          "radial-gradient(ellipse at 26% 16%, oklch(0.35 0.06 30), oklch(0.18 0.04 230) 58%, oklch(0.12 0.03 250))",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          mixBlendMode: "overlay",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          fontSize: 12,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <span style={{ fontWeight: 600, marginRight: 18 }}>CodeHub</span>
        <span style={{ marginRight: 14 }}>Session</span>
        <span style={{ marginRight: 14 }}>Agent</span>
        <span style={{ marginRight: 14 }}>View</span>
        {screen && <span style={{ marginRight: 14 }}>Help</span>}
        <span style={{ flex: 1 }} />
        <MenuBarActivity />
        <span className="mono" style={{ fontSize: 11 }}>
          21:36
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: screen ? 0 : 40,
          left: screen ? "50%" : "39%",
          transform: screen ? "translateX(-50%)" : "translateX(-50%) scale(0.9)",
          transformOrigin: "top center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 2,
        }}
      >
        <LiveIsland state="wait" />
        <div style={{ transform: "scale(0.94)", transformOrigin: "top center" }}>
          <LiveIsland state="live" />
        </div>
        <div style={{ transform: "scale(0.88)", transformOrigin: "top center", opacity: 0.85 }}>
          <LiveIsland state="done" />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: screen ? 36 : 42,
          right: 16,
          bottom: screen ? 60 : 18,
          width: screen ? 304 : 268,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          background: "rgba(28,28,32,0.58)",
          backdropFilter: "blur(40px) saturate(140%)",
          WebkitBackdropFilter: "blur(40px) saturate(140%)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
        }}
      >
        <div
          style={{
            padding: "4px 8px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,0.62)",
          }}
        >
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em" }}>
            LIVE ACTIVITIES
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11 }}>3 active</span>
        </div>
        <NotificationCenterCard
          agent="claude"
          title="Refactor auth middleware"
          meta="turn 04:12 · 184k ctx"
          live
        />
        <NotificationCenterCard
          agent="codex"
          title="Needs permission · migrate:up"
          meta="awaiting · 14s blocked"
          tone="wait"
        />
        <NotificationCenterCard
          agent="antigravity"
          title="Profiling complete · 3 hotspots"
          meta="2m ago · done"
          tone="done"
        />
        {screen && (
          <>
            <div
              className="mono"
              style={{
                padding: "6px 8px 5px",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.48)",
              }}
            >
              EARLIER TODAY
            </div>
            <NotificationCenterCard
              agent="claude"
              title="Failed: ENOENT /tmp/snap-3"
              meta="34m ago"
              tone="err"
            />
            <NotificationCenterCard
              agent="claude"
              title="Ran pnpm test · 218 pass"
              meta="14m ago"
              tone="done"
            />
          </>
        )}
      </div>
      {screen && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
          <span>
            macOS notch · menu bar widget · Notification Center ·{" "}
            <span
              className="mono"
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              ⌘⇧J
            </span>{" "}
            cycles focus
          </span>
        </div>
      )}
    </div>
  );
}

function MenuBarActivity() {
  const r = 5.5;
  return (
    <span
      title="Claude · turn 04:12"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 22,
        padding: "2px 10px",
        marginRight: 14,
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
        <circle cx="7" cy="7" r={r} stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none" />
        <circle
          cx="7"
          cy="7"
          r={r}
          stroke="oklch(0.80 0.17 145)"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray={`${0.62 * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          transform="rotate(-90 7 7)"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 11, color: "#fff" }}>Refactor auth</span>
      <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
        04:12
      </span>
    </span>
  );
}

export function LiveActivityStateGrid() {
  return (
    <div style={{ marginTop: 10, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-0)" }}>States</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
          island, stack, and expanded variants
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--bd-soft)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <IslandStateCard title="Idle" detail="compact summary">
          <LiveIsland state="idle" />
        </IslandStateCard>
        <IslandStateCard title="Live" detail="turn in progress">
          <LiveIsland state="live" />
        </IslandStateCard>
        <IslandStateCard title="Awaiting input" detail="approve or deny inline" tone="wait">
          <LiveIsland state="wait" />
        </IslandStateCard>
        <IslandStateCard title="Turn finished" detail="review before it fades" tone="done">
          <LiveIsland state="done" />
        </IslandStateCard>
        <IslandStateCard title="Failed" detail="sticks until acknowledged" tone="err">
          <LiveIsland state="err" />
        </IslandStateCard>
        <IslandStateCard title="Split" detail="two simultaneous events">
          <LiveIsland state="split" />
        </IslandStateCard>
        <IslandStateCard title="Multi" detail="condensed event stack">
          <LiveIsland state="multi" />
        </IslandStateCard>
        <IslandStateCard title="Stack" detail="priority ordered queue" tone="wait">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <LiveIsland state="wait" />
            <div style={{ transform: "scale(0.92)", transformOrigin: "top center" }}>
              <LiveIsland state="live" />
            </div>
            <div style={{ transform: "scale(0.84)", transformOrigin: "top center", opacity: 0.78 }}>
              <LiveIsland state="done" />
            </div>
          </div>
        </IslandStateCard>
        <div style={{ gridColumn: "1 / -1" }}>
          <IslandStateCard title="Expanded" detail="rich card with terminal peek">
            <ExpandedIslandPreview />
          </IslandStateCard>
        </div>
      </div>
    </div>
  );
}

function IslandStateCard({
  title,
  detail,
  tone,
  children,
}: {
  title: string;
  detail: string;
  tone?: "wait" | "done" | "err";
  children: ReactNode;
}) {
  const color =
    tone === "wait"
      ? "var(--wait)"
      : tone === "done"
        ? "var(--idle)"
        : tone === "err"
          ? "var(--err)"
          : "var(--fg-2)";
  return (
    <div className="ch-card" style={{ padding: 0, overflow: "hidden", background: "var(--bg-2)" }}>
      <div
        style={{
          minHeight: 92,
          padding: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 10%, oklch(0.24 0.04 250), oklch(0.13 0.03 250))",
          borderBottom: "1px solid var(--bd-soft)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-0)" }}>{title}</span>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function LiveIsland({
  state,
}: { state: "idle" | "live" | "wait" | "done" | "err" | "split" | "multi" }) {
  const base: CSSProperties = {
    background: "#000",
    color: "rgba(255,255,255,0.95)",
    fontFamily: "var(--mono)",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 6px 22px rgba(0,0,0,0.55)",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.04)",
  };
  if (state === "idle") {
    return (
      <div
        style={{
          ...base,
          height: 28,
          padding: "0 14px",
          borderRadius: 999,
          gap: 9,
          fontSize: 12,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "oklch(0.80 0.17 145)",
            boxShadow: "0 0 8px oklch(0.80 0.17 145)",
          }}
        />
        <span>2 agents</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>·</span>
        <span className="tnum">04:12</span>
      </div>
    );
  }
  if (state === "wait") {
    return (
      <div
        style={{
          ...base,
          width: 326,
          height: 52,
          padding: "0 6px 0 14px",
          borderRadius: 26,
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "oklch(0.83 0.14 80)",
            boxShadow: "0 0 10px oklch(0.83 0.14 80)",
          }}
        />
        <AgentGlyph agent="codex" size={13} color="oklch(0.78 0.10 265)" />
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            lineHeight: 1.2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap" }}>
            Codex needs permission
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.58)" }}>
            aurora-api · pnpm migrate:up
          </span>
        </span>
        <IslandButton>Deny</IslandButton>
        <IslandButton tone="ok">Approve</IslandButton>
      </div>
    );
  }
  if (state === "err") {
    return (
      <div
        style={{
          ...base,
          width: 290,
          height: 46,
          padding: "0 7px 0 14px",
          borderRadius: 23,
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "oklch(0.68 0.18 25)",
            boxShadow: "0 0 10px oklch(0.68 0.18 25)",
          }}
        />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Claude failed</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.58)" }}>ENOENT /tmp/snap-3</span>
        </span>
        <IslandButton tone="white">Open</IslandButton>
      </div>
    );
  }
  if (state === "split") {
    return (
      <div
        style={{
          ...base,
          height: 38,
          padding: 0,
          borderRadius: 19,
          fontSize: 12,
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
          <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
          <span>refactor auth</span>
          <span className="tnum" style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
            04:12
          </span>
        </div>
        <span style={{ width: 1, background: "rgba(255,255,255,0.10)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "oklch(0.83 0.14 80)",
              boxShadow: "0 0 8px oklch(0.83 0.14 80)",
            }}
          />
          <AgentGlyph agent="codex" size={13} color="oklch(0.78 0.10 265)" />
          <span>needs input</span>
        </div>
      </div>
    );
  }
  if (state === "multi") {
    return (
      <div
        style={{
          ...base,
          height: 34,
          padding: "0 14px",
          borderRadius: 17,
          gap: 9,
          fontSize: 12,
        }}
      >
        <span style={{ display: "inline-flex", marginRight: -4 }}>
          <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        </span>
        <span style={{ display: "inline-flex", marginLeft: -3 }}>
          <AgentGlyph agent="codex" size={13} color="oklch(0.78 0.10 265)" />
        </span>
        <span>5 updates</span>
        <span
          className="tnum"
          style={{
            padding: "1px 7px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            fontSize: 11,
          }}
        >
          +3
        </span>
      </div>
    );
  }
  if (state === "done") {
    return (
      <div
        style={{
          ...base,
          width: 288,
          height: 48,
          padding: "0 6px 0 14px",
          borderRadius: 24,
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: "50%", background: "oklch(0.78 0.08 200)" }}
        />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            lineHeight: 1.2,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500 }}>Claude finished refactor</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.58)" }}>
            14 edits · 4:21 elapsed
          </span>
        </span>
        <IslandButton tone="white">Review</IslandButton>
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        height: 38,
        padding: "0 14px",
        borderRadius: 19,
        gap: 10,
        position: "relative",
      }}
    >
      <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, gap: 2 }}>
        <span style={{ fontSize: 12 }}>Claude · refactor auth</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
          turn 04:12 · tests passing
        </span>
      </span>
      <span
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 4,
          height: 2,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 999,
        }}
      >
        <span
          style={{
            display: "block",
            width: "62%",
            height: "100%",
            background: "oklch(0.80 0.17 145)",
            borderRadius: 999,
          }}
        />
      </span>
    </div>
  );
}

function ExpandedIslandPreview() {
  return (
    <div
      style={{
        width: "min(100%, 460px)",
        background: "#000",
        color: "#fff",
        borderRadius: 22,
        boxShadow: "0 18px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "oklch(0.80 0.17 145)",
            boxShadow: "0 0 10px oklch(0.80 0.17 145)",
          }}
        />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Claude · aurora-api</span>
        <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
          opus · feat/auth
        </span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
          04:12
        </span>
      </div>
      <div
        className="mono"
        style={{
          margin: "0 12px",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          fontSize: 11.5,
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.84)",
        }}
      >
        <div style={{ color: "oklch(0.80 0.17 145)" }}>
          Bash <span style={{ color: "rgba(255,255,255,0.55)" }}>pnpm test src/auth</span>
        </div>
        <div>
          <span style={{ color: "oklch(0.80 0.17 145)" }}>✓</span> verifier.spec.ts{" "}
          <span style={{ color: "rgba(255,255,255,0.45)" }}>(4 tests)</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.56)" }}>Running final typecheck…</div>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <IslandButton tone="white">Jump to terminal</IslandButton>
        <IslandButton>View diff</IslandButton>
        <IslandButton>Dismiss</IslandButton>
      </div>
    </div>
  );
}

function IslandButton({ children, tone }: { children: ReactNode; tone?: "ok" | "white" }) {
  return (
    <button
      type="button"
      style={{
        border: "none",
        cursor: "default",
        fontSize: 11.5,
        fontWeight: 600,
        padding: "7px 10px",
        borderRadius: 999,
        background:
          tone === "ok"
            ? "oklch(0.80 0.17 145)"
            : tone === "white"
              ? "#fff"
              : "rgba(255,255,255,0.10)",
        color: tone === "ok" || tone === "white" ? "#000" : "rgba(255,255,255,0.85)",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function NotificationCenterCard({
  agent,
  title,
  meta,
  tone,
  live,
}: {
  agent: AgentCli;
  title: string;
  meta: string;
  tone?: "wait" | "done" | "err";
  live?: boolean;
}) {
  const color =
    tone === "wait"
      ? "oklch(0.83 0.14 80)"
      : tone === "err"
        ? "oklch(0.68 0.18 25)"
        : tone === "done"
          ? "rgba(255,255,255,0.45)"
          : "oklch(0.80 0.17 145)";
  return (
    <div
      style={{
        marginBottom: 6,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(50,50,55,0.62)",
        border: "0.5px solid rgba(255,255,255,0.06)",
        color: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: live ? `0 0 8px ${color}` : "none",
          }}
        />
        <AgentGlyph agent={agent} size={11} color={color} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>CodeHub</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
          {meta.split(" · ").at(-1)}
        </span>
      </div>
      <div style={{ fontSize: 12, marginBottom: 2 }}>{title}</div>
      <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.56)" }}>
        {meta}
      </div>
    </div>
  );
}

export function NotificationPreview({ os, children }: { os: string; children: ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--bd)",
        borderRadius: 10,
        padding: 12,
        background: "var(--bg-2)",
      }}
    >
      <div
        style={{
          minHeight: 124,
          borderRadius: 7,
          padding: "18px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, oklch(0.30 0.05 230), oklch(0.18 0.04 250))",
          border: "1px solid var(--bd-soft)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="lbl" style={{ fontSize: 11 }}>
          {os}
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--bd-soft)" }} />
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
          native APIs
        </span>
      </div>
    </div>
  );
}

export function MacNotificationPreview() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        padding: "11px 12px",
        borderRadius: 14,
        background: "rgba(28,28,32,0.92)",
        border: "0.5px solid rgba(255,255,255,0.06)",
        color: "#fff",
        display: "flex",
        gap: 10,
        boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "var(--bg-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Logo size={18} withText={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>CodeHub</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>now</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }}>Codex needs permission</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
          aurora-api · run pnpm migrate:up?
        </div>
      </div>
    </div>
  );
}

export function WindowsNotificationPreview() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        padding: 12,
        borderRadius: 8,
        background: "rgba(28,28,30,0.94)",
        color: "#fff",
        boxShadow: "0 12px 32px rgba(0,0,0,0.50)",
        border: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          bottom: 0,
          background: "oklch(0.78 0.10 265)",
          borderRadius: "8px 0 0 8px",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Logo size={13} withText={false} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.70)" }}>CodeHub</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>1m ago</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Claude finished refactor</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
        14 edits, 218 tests pass · 4:21 elapsed
      </div>
    </div>
  );
}

export function LinuxNotificationPreview() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 296,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(20,22,26,0.96)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 10px 36px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "oklch(0.72 0.18 25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        !
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>
          Claude failed · dash-web
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.70)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          ENOENT: no such file '/tmp/snap-3'
        </div>
      </div>
    </div>
  );
}

// Appearance — Theme + terminal font size are live (theme via useTheme, font
// via the config store → every open xterm pane). Density is a disabled stub
// until the compact layout pass.
function AppearancePane() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <PaneHead title="Appearance">
        Theme and terminal font size apply instantly and are remembered on this machine.
      </PaneHead>

      <SectionHead label="Theme" />
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 0" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--fg-0)", marginBottom: 2 }}>Color theme</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-2)" }}>
            Switches the whole interface between dark, gray, and light.
          </div>
        </div>
        <ThemeChoice theme={theme} onChange={setTheme} />
      </div>

      <SectionHead label="Terminal" />
      <SettingRow
        label="Terminal font size"
        desc="Applies live to every xterm pane."
        control={<FontSizeInput />}
        live
        last
      />

      <SectionHead label="Display" />
      <SettingRow
        label="Density"
        desc="Compact tightens the terminal chrome — tab bar, pane headers, split dividers, and the launcher."
        control={<DensityChoice />}
        live
        last
      />
    </div>
  );
}

// Segmented comfortable/compact selector, bound to the density setting. Writes
// through the config store, which reflects it onto the document root
// (data-density) so the chrome tightens immediately.
function DensityChoice() {
  const value = useStore((s) => s.config?.density ?? "comfortable");
  const updateConfig = useStore((s) => s.updateConfig);
  return (
    <Segmented
      value={value}
      onChange={(density) => void updateConfig({ density })}
      options={[
        { key: "comfortable", label: "Comfortable" },
        { key: "compact", label: "Compact" },
      ]}
    />
  );
}

// Segmented dark/light selector — the one genuinely live control in Settings.
function ThemeChoice({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <Segmented<Theme>
      value={theme}
      onChange={onChange}
      options={[
        { key: "dark", label: "Dark" },
        { key: "gray", label: "Gray" },
        { key: "light", label: "Light" },
      ]}
    />
  );
}

// — Live controls, backed by the config store —

// Boolean keys of AppSettings, so LiveToggle can only target a real toggle.
type BoolSettingKey = {
  [K in keyof AppSettings]: AppSettings[K] extends boolean ? K : never;
}[keyof AppSettings];

// A working toggle bound to one boolean setting; writes through updateConfig.
function LiveToggle({ field, disabled }: { field: BoolSettingKey; disabled?: boolean }) {
  const on = useStore((s) => Boolean(s.config?.[field]));
  const updateConfig = useStore((s) => s.updateConfig);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => void updateConfig({ [field]: !on } as Partial<AppSettings>)}
      style={{
        width: 32,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--fg-0)" : "var(--bg-3)",
        border: `1px solid ${on ? "var(--fg-0)" : "var(--bd-strong)"}`,
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: on ? 16 : 1,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: on ? "var(--bg-0)" : "var(--fg-1)",
          transition: "left .15s",
        }}
      />
    </button>
  );
}

// Stepper for the terminal font size (10–20 px). Each change writes through the
// config store, which pushes the new size onto every open pane (panes.setFontSize).
function FontSizeInput() {
  const size = useStore((s) => s.config?.terminalFontSize ?? 13);
  const updateConfig = useStore((s) => s.updateConfig);
  const set = (n: number) => void updateConfig({ terminalFontSize: Math.max(10, Math.min(20, n)) });
  const StepBtn = ({ d, label }: { d: number; label: string }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => set(size + d)}
      disabled={d < 0 ? size <= 10 : size >= 20}
      style={{
        width: 24,
        height: 28,
        border: "none",
        background: "transparent",
        color: "var(--fg-1)",
        fontSize: 15,
        cursor: "pointer",
      }}
    >
      {d < 0 ? "−" : "+"}
    </button>
  );
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid var(--bd)",
        borderRadius: 6,
        background: "var(--bg-1)",
        overflow: "hidden",
      }}
    >
      <StepBtn d={-1} label="Decrease font size" />
      <span
        className="mono tnum"
        style={{
          minWidth: 40,
          textAlign: "center",
          fontSize: 12,
          color: "var(--fg-0)",
        }}
      >
        {size} px
      </span>
      <StepBtn d={1} label="Increase font size" />
    </div>
  );
}

// Re-probe each agent binary's reported version (`agent_versions`) on demand and
// push the fresh map back into the store, so the agent cards + About pane reflect
// it immediately. The bootstrap fetches this once at launch; this re-runs the
// same real read (e.g. after upgrading a CLI inside the container) — no fabrication.
function RefreshVersionsButton() {
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    try {
      const agentVersions = await ipc.agentVersions();
      useStore.setState({ agentVersions });
    } catch (e) {
      console.warn("agent_versions refresh failed", e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={() => void refresh()}>
      {Ico.search} {busy ? "Checking…" : "Check for update"}
    </Button>
  );
}

// Agent dropdown bound to the default-agent setting (pre-selects the launcher).
function DefaultAgentSelect() {
  const value = useStore((s) => s.config?.defaultAgent ?? "claude");
  const updateConfig = useStore((s) => s.updateConfig);
  return (
    <Select value={value} onValueChange={(v) => void updateConfig({ defaultAgent: v as Cli })}>
      <SelectTrigger style={{ width: 180, gap: 8 }}>
        <AgentGlyph agent={value} size={11} color={`var(--a-${value})`} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CLIS.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <AgentGlyph agent={c.id} size={11} color={AGENT_META[c.id].accent} />
              {c.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SectionHead({ label, tone }: { label: string; tone?: "err" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 12px" }}>
      <span
        className="lbl"
        style={{ color: tone === "err" ? "var(--err)" : "var(--fg-1)", fontSize: 11 }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--bd-soft)" }} />
    </div>
  );
}

function SettingRow({
  label,
  desc,
  control,
  last,
  live,
}: {
  label: string;
  desc: string;
  control: ReactNode;
  last?: boolean;
  // When set, the control is interactive (backed by the config store). Default
  // rows are dimmed + inert because their feature isn't wired yet.
  live?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--bd-soft)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--fg-0)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{desc}</div>
      </div>
      {live ? (
        control
      ) : (
        // Dimmed + inert: this control's feature isn't wired yet, so it must not
        // look clickable.
        <div aria-disabled style={{ opacity: 0.45, pointerEvents: "none" }}>
          {control}
        </div>
      )}
    </div>
  );
}

// Minimal presentational controls matching the design's monochrome style.
// Real wiring (to the Tier-2 config store) lands when these panes go live.
function Toggle({ on }: { on?: boolean }) {
  return (
    <span
      style={{
        width: 32,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--fg-0)" : "var(--bg-3)",
        border: `1px solid ${on ? "var(--fg-0)" : "var(--bd-strong)"}`,
        display: "inline-flex",
        alignItems: "center",
        padding: "0 2px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: on ? 16 : 1,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: on ? "var(--bg-0)" : "var(--fg-1)",
          transition: "left .15s",
        }}
      />
    </span>
  );
}

function InputStub({ value, suffix }: { value: string; suffix: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        border: "1px solid var(--bd)",
        borderRadius: 6,
        background: "var(--bg-1)",
        fontFamily: "var(--mono)",
        fontSize: 12,
        minWidth: 140,
      }}
    >
      <span style={{ color: "var(--fg-0)" }}>{value}</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: "var(--fg-3)", fontSize: 11 }}>{suffix}</span>
    </div>
  );
}
