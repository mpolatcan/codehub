/**
 * SpawnDialog — "New agent session" modal. Ported from design/screens/spawn-dialog.jsx.
 *
 * Real surfaces: agent selection (CLIS catalog), permission mode, an
 * `initialPrompt` textarea, the Tier-3 account picker (label-only profiles +
 * host-env presence), and the Tier-2 repository picker (the real /workspace
 * mount + native folder change + MRU recents + a "restart runtime to apply"
 * affordance). The shared container is still a single runtime (per-session reuse
 * / sizing remain Tier-3). Cost estimate stays omitted (no usage capture).
 *
 * Copy note: the design said "secrets stay in the keychain". CodeHub forwards
 * keys from the host environment instead (see BACKEND_PLAN.md), so that wording
 * is corrected throughout. Account profiles store an env var NAME, never a value.
 *
 * The form pieces (agent/account cards, the /workspace picker, the shared-runtime
 * panel) live in `components/spawn-form` so the new-workspace wizard reuses the
 * exact same honest surfaces — no copy-paste drift.
 */
import { Segmented } from "@/app/components/primitives/Segmented";
import { Tag } from "@/app/components/primitives/Tag";
import {
  AccountCard,
  AgentCard,
  FormRow,
  PROMPT_TEMPLATES,
  RepositoryPicker,
  SharedRuntimePanel,
} from "@/app/components/spawn-form";
import { CLIS, MODE_BY_ID, modesFor } from "@/app/lib/catalog";
import type { AgentCli, Cli, Mode } from "@/app/lib/ipc";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { useState } from "react";

export interface SpawnDialogProps {
  /**
   * Called with the chosen agent, permission mode, initial prompt + optional
   * account-profile id (undefined → the default host-env credential) on launch.
   */
  onLaunch?: (cli: Cli, mode: Mode, initialPrompt: string, account?: string) => void;
  onCancel?: () => void;
  /** Pre-selected agent (from the persisted default). Defaults to Claude. */
  defaultCli?: Cli;
  /** True when invoked from a pane split / tab-add (adjusts the head + footer copy). */
  splitting?: boolean;
}

export function SpawnDialog({
  onLaunch,
  onCancel,
  defaultCli = "claude",
  splitting,
}: SpawnDialogProps) {
  const [agent, setAgentRaw] = useState<Cli>(defaultCli);
  const [mode, setMode] = useState<Mode>("standard");
  const [prompt, setPrompt] = useState("");
  // Selected account-profile id; undefined → the default host-env credential.
  const [account, setAccount] = useState<string | undefined>(undefined);

  const keyStatus = useStore((s) => s.keyStatus);
  const accountProfiles = useStore((s) => s.accountProfiles);

  // Switching agent clamps the mode to what that agent supports (e.g.
  // Antigravity → Standard only) and resets the account (profiles are per-agent).
  const setAgent = (next: Cli) => {
    setAgentRaw(next);
    if (!modesFor(next).includes(mode)) setMode("standard");
    setAccount(undefined);
  };
  const modes = modesFor(agent);
  // Account profiles for the selected agent (the default host-env is implicit).
  const agentAccounts = accountProfiles.filter((p) => p.agent === agent);
  const defaultKey = agent === "shell" ? null : (keyStatus?.[agent as AgentCli] ?? null);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg-1)",
        minHeight: 0,
        overflow: "hidden",
        color: "var(--fg-1)",
      }}
    >
      <FauxHubBg />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6,7,9,0.72)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
        }}
      />

      {/* modal */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 720,
          maxHeight: "calc(100% - 48px)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-2)",
          border: "1px solid var(--bd-strong)",
          borderRadius: 12,
          boxShadow: "var(--shadow-3)",
          overflow: "hidden",
        }}
      >
        {/* head */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--bd-soft)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-0)" }}>
            {splitting ? "Split — new agent in this tab" : "New agent session"}
          </span>
          <span style={{ flex: 1 }} />
          <span className="kbd">esc</span>
        </div>

        {/* form */}
        <div style={{ padding: "18px 18px 6px", overflow: "auto" }}>
          <FormRow label="Agent">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {CLIS.map((c) => (
                <AgentCard
                  key={c.id}
                  agent={c.id}
                  selected={agent === c.id}
                  onSelect={() => setAgent(c.id)}
                />
              ))}
            </div>
          </FormRow>

          <FormRow label="Mode">
            <Segmented
              value={mode}
              onChange={setMode}
              options={modes.map((m) => ({ key: m, label: MODE_BY_ID[m].label }))}
            />
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 6 }}>
              {MODE_BY_ID[mode].hint}
            </div>
          </FormRow>

          {/* Account — label-only profiles (Tier-3). The default forwards the
              canonical host-env key; each profile remaps the CLI's credential var
              onto another host env var BY NAME (no secret stored). */}
          <FormRow label="Account">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <AccountCard
                title="Host environment"
                sub={
                  defaultKey?.present
                    ? `${defaultKey.varName} · present`
                    : defaultKey
                      ? "no key on host"
                      : "default credential"
                }
                present={defaultKey?.present ?? true}
                selected={account === undefined}
                onSelect={() => setAccount(undefined)}
              />
              {agentAccounts.map((p) => (
                <AccountCard
                  key={p.id}
                  title={p.label}
                  sub={`${p.varName} · ${p.present ? "present" : "missing"}`}
                  present={p.present}
                  selected={account === p.id}
                  onSelect={() => setAccount(p.id)}
                />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 6 }}>
              Accounts map to host env vars (names, never values). Manage them in Settings → Agents.
            </div>
          </FormRow>

          {/* Repository — the real host directory bound at /workspace (Tier-2). */}
          <FormRow label="Repository">
            <RepositoryPicker />
          </FormRow>

          {/* Container — single shared runtime today; reuse/sizing is Tier 3. */}
          <FormRow label="Container">
            <SharedRuntimePanel />
          </FormRow>

          <FormRow label="Initial prompt" optional>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the first task for the agent…"
              spellCheck={false}
              style={{
                width: "100%",
                resize: "vertical",
                background: "var(--bg-0)",
                border: "1px solid var(--bd)",
                borderRadius: 8,
                padding: "10px 12px",
                minHeight: 76,
                fontFamily: "var(--mono)",
                fontSize: 12,
                color: "var(--fg-1)",
                lineHeight: 1.5,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PROMPT_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  // "+ Templates" is an inert affordance for now (no picker yet, P2);
                  // the rest drop their text into the prompt.
                  onClick={() => {
                    if (!t.startsWith("+")) setPrompt(t);
                  }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <Tag>{t}</Tag>
                </button>
              ))}
            </div>
          </FormRow>
        </div>

        {/* foot */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--bd-soft)",
            background: "var(--bg-1)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Cost estimate is Tier 3 (no usage capture yet). Omitted rather than faked. */}
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
            spawns a fresh tmux window in the shared runtime
          </span>
          <span style={{ flex: 1 }} />
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            style={{ padding: "6px 14px" }}
            onClick={() => onLaunch?.(agent, mode, prompt, account)}
          >
            Launch agent
            <span className="kbd" style={{ marginLeft: 6 }}>
              ⏎
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function FauxHubBg() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", minHeight: 0 }}>
      <div
        style={{ width: 264, background: "var(--bg-1)", borderRight: "1px solid var(--bd-soft)" }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-1)" }}>
        <div style={{ height: 74, borderBottom: "1px solid var(--bd-soft)" }} />
        <div style={{ flex: 1, display: "flex", gap: 1, background: "var(--bd-soft)" }}>
          <div style={{ flex: 1, background: "var(--bg-0)" }} />
          <div style={{ flex: 1, background: "var(--bg-0)" }} />
        </div>
      </div>
    </div>
  );
}
