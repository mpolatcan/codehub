/**
 * SpawnPane — the "New agent · configuring" pane (design hub configuring state).
 * Rendered IN the grid for a configuring leaf (a `__spawn-N` placeholder with a
 * draft but no tmux session yet). A centered card of horizontal rows — Agent /
 * Mode / Repo / Account — then "Spawn agent" commits the draft (creates the
 * session, swaps this slot for the live terminal). No head bar: the card titles
 * itself and carries its own cancel. The container isn't shown — it's always
 * inherited from the workspace (CodeHub runs one container per workspace).
 *
 * REPO is real: for an existing workspace it selects the working repo/dir inside
 * the mounted /workspace; for a NEW workspace (no container yet) it opens the
 * native folder picker to choose the host repo that gets mounted at /workspace.
 */
import { AGENT_META, AgentGlyph } from "@/app/components/primitives/AgentGlyph";
import {
  AUTO_ACCOUNT,
  HOST_ACCOUNT,
  accountProfileSubtitle,
  agentAccountState,
  providerTargetAgent,
} from "@/app/lib/accounts";
import { CLIS, MODE_BY_ID, modesFor } from "@/app/lib/catalog";
import { type Cli, type Mode, type RepoInfo, ipc } from "@/app/lib/ipc";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/app/ui/select";
import { type ReactNode, useEffect, useState } from "react";
import { Ico } from "./primitives/icons";
import { MODEL_HINT } from "./spawn-form";

const WORKSPACE_ROOT = "/workspace";

function dirName(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

const ROW =
  "w-full h-11 px-3 gap-2.5 justify-start bg-[var(--bg-1)] border-[var(--bd)] rounded-lg text-[var(--fg-0)] hover:bg-[var(--bg-hover)] hover:border-[var(--bd-strong)]";
const ITEM = "text-[var(--fg-1)] focus:bg-[var(--bg-hover)] focus:text-[var(--fg-0)]";
const POPOVER = "bg-[var(--bg-2)] border-[var(--bd-strong)]";

// Leading icon + uppercase label column shared by every row.
function RowHead({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      <span style={{ display: "inline-flex", color: "var(--fg-2)", width: 16, flexShrink: 0 }}>
        {icon}
      </span>
      <span className="lbl" style={{ width: 62, flexShrink: 0, color: "var(--fg-2)" }}>
        {label}
      </span>
    </>
  );
}

function RowValue({ value, meta }: { value: string; meta?: ReactNode }) {
  return (
    <>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          color: "var(--fg-0)",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
      {meta && (
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", flexShrink: 0 }}>
          {meta}
        </span>
      )}
    </>
  );
}

export function SpawnPane({ id }: { id: string }) {
  const draft = useStore((s) => s.spawnDrafts[id]);
  const ws = useStore((s) => s.workspaces.find((w) => w.id === draft?.workspaceId));
  const update = useStore((s) => s.updateSpawnDraft);
  const commit = useStore((s) => s.commitSpawn);
  const cancel = useStore((s) => s.cancelSpawn);
  const keyStatus = useStore((s) => s.keyStatus);
  const accountProfiles = useStore((s) => s.accountProfiles);
  const loadAccountProfiles = useStore((s) => s.loadAccountProfiles);
  const providers = useStore((s) => s.providers);
  const loadProviders = useStore((s) => s.loadProviders);

  const [accountChoice, setAccountChoice] = useState<string>(AUTO_ACCOUNT);
  const [repos, setRepos] = useState<RepoInfo[]>([]);

  const workspaceKey = ws?.containerKey;
  // A NEW-workspace draft has no container yet (the repo it picks becomes the
  // /workspace mount); an existing workspace lists the repos inside its mount.
  const isNewWs = !!draft?.workspaceDir;

  useEffect(() => {
    if (!workspaceKey || isNewWs) return;
    let alive = true;
    ipc
      .containerRepos(workspaceKey)
      .then((r) => alive && setRepos(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [workspaceKey, isNewWs]);

  useEffect(() => {
    void loadAccountProfiles();
    void loadProviders();
  }, [loadAccountProfiles, loadProviders]);

  if (!draft) return null;

  const agent = draft.cli;
  const mode = draft.mode;
  const cwd = draft.cwd ?? WORKSPACE_ROOT;
  const resuming = !!draft.resume;
  const modes = modesFor(agent);
  // Launch-wired providers for this agent (enabled + token stored), offered in
  // the account picker as an alternative credential. Selecting one routes its
  // id through the `account` param; the backend injects its harness env.
  const agentProviders = providers.filter(
    (p) => providerTargetAgent(p.kind) === agent && p.enabled && p.hasToken,
  );
  const isProviderChoice = agentProviders.some((p) => p.id === accountChoice);
  const base = agentAccountState(agent, accountProfiles, keyStatus, accountChoice);
  const { agentAccounts, defaultKey } = base;
  const effectiveAccountChoice = isProviderChoice ? accountChoice : base.effectiveAccountChoice;
  const selectedAccount = isProviderChoice ? accountChoice : base.selectedAccount;

  const setAgent = (next: Cli) => {
    update(id, { cli: next, mode: modesFor(next).includes(mode) ? mode : "standard" });
    setAccountChoice(AUTO_ACCOUNT);
  };

  const spawn = () => {
    update(id, { account: selectedAccount, cwd });
    void commit(id);
  };

  const pickMount = async () => {
    const path = await ipc.pickDirectory().catch(() => null);
    if (path) update(id, { workspaceDir: path, cwd: WORKSPACE_ROOT });
  };

  const accountOptions = [
    {
      value: HOST_ACCOUNT,
      label: "Default",
      sub: defaultKey?.present ? "credential active" : defaultKey ? "no credential" : "auto-select",
      present: defaultKey?.present ?? true,
      disabled: false,
    },
    ...agentAccounts.map((p) => ({
      value: p.id,
      label: p.label,
      sub: accountProfileSubtitle(p),
      present: p.present,
      disabled: !p.present,
    })),
    ...agentProviders.map((p) => ({
      value: p.id,
      label: p.name,
      sub: `provider · ${p.model ?? p.models[0] ?? p.kind}`,
      present: true,
      disabled: false,
    })),
  ];
  const accountActive = accountOptions.find((o) => o.value === effectiveAccountChoice);

  // Repo row presentation.
  const repoLabel = (r: RepoInfo): string => {
    const name =
      r.path === WORKSPACE_ROOT ? (ws?.dir ? dirName(ws.dir) : "workspace") : dirName(r.path);
    return r.branch ? `${name} · ${r.branch}` : name;
  };
  const cwdRepo = repos.find((r) => r.path === cwd);
  const repoValue = isNewWs
    ? draft.workspaceDir
      ? dirName(draft.workspaceDir)
      : "Choose a repo…"
    : cwdRepo
      ? repoLabel(cwdRepo)
      : ws?.dir
        ? dirName(ws.dir)
        : "/workspace";
  const repoOptions = repos.length ? repos : [{ path: WORKSPACE_ROOT, branch: null }];

  return (
    <div
      className="pane-body"
      onKeyDown={(e) => {
        // ⌘1–3 swap the agent quickly (matches the tip).
        if ((e.metaKey || e.ctrlKey) && ["1", "2", "3"].includes(e.key) && !resuming) {
          const c = CLIS[Number(e.key) - 1];
          if (c) {
            e.preventDefault();
            setAgent(c.id);
            return;
          }
        }
        if (
          e.key === "Enter" &&
          (e.metaKey || !(e.target as HTMLElement).closest("[role=combobox]"))
        ) {
          e.preventDefault();
          spawn();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel(id);
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-0)",
        overflow: "auto",
        padding: 24,
      }}
    >
      <div style={{ width: "min(420px, 100%)", display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              // Purple draft styling — matches the dashed pane frame + Spawn button
              // (theme primary), not the per-agent accent.
              border: "1.5px dashed color-mix(in oklab, var(--pri) 55%, var(--bd))",
              background: "color-mix(in oklab, var(--pri) 12%, var(--bg-1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AgentGlyph agent={agent} size={22} color="var(--pri)" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 600, color: "var(--fg-0)" }}>
            {resuming ? "Resume agent" : "New agent"}
          </span>
          <span
            style={{ fontSize: 12.5, color: "var(--fg-2)", textAlign: "center", maxWidth: 320 }}
          >
            {resuming ? (
              <>
                Continue this {AGENT_META[agent]?.name ?? agent} session.{" "}
                <span className="kbd">⏎</span> to resume.
              </>
            ) : (
              <>
                Pick the agent, repo, and mode. <span className="kbd">⏎</span> to spawn.
              </>
            )}
          </span>
        </div>

        {/* rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* AGENT */}
          <Select value={agent} onValueChange={(v) => setAgent(v as Cli)} disabled={resuming}>
            <SelectTrigger className={ROW} aria-label="Agent">
              <RowHead
                icon={<AgentGlyph agent={agent} size={15} color="var(--fg-2)" />}
                label="Agent"
              />
              <RowValue
                value={AGENT_META[agent]?.name ?? agent}
                meta={agent === "shell" ? undefined : MODEL_HINT[agent]}
              />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} className={POPOVER}>
              {CLIS.map((c, i) => (
                <SelectItem key={c.id} value={c.id} className={ITEM}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <AgentGlyph agent={c.id} size={14} color={AGENT_META[c.id].accent} />
                    <span>{c.label}</span>
                    <span className="kbd" style={{ marginLeft: 4 }}>{`⌘${i + 1}`}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* MODE */}
          <Select value={mode} onValueChange={(v) => update(id, { mode: v as Mode })}>
            <SelectTrigger className={ROW} aria-label="Mode">
              <RowHead icon={Ico.gauge} label="Mode" />
              <RowValue value={MODE_BY_ID[mode].label} />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} className={POPOVER}>
              {modes.map((m) => (
                <SelectItem key={m} value={m} className={ITEM}>
                  {MODE_BY_ID[m].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* REPO — pick the working repo, or the host dir to mount for a new ws */}
          {isNewWs ? (
            <button type="button" className={ROW} onClick={pickMount}>
              <RowHead icon={Ico.branch} label="Repo" />
              <RowValue value={repoValue} meta="browse" />
              <span style={{ display: "inline-flex", color: "var(--fg-2)", flexShrink: 0 }}>
                {Ico.chevD}
              </span>
            </button>
          ) : (
            <Select value={cwd} onValueChange={(v) => update(id, { cwd: v })}>
              <SelectTrigger className={ROW} aria-label="Repo">
                <RowHead icon={Ico.branch} label="Repo" />
                <RowValue value={repoValue} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6} className={POPOVER}>
                {repoOptions.map((r) => (
                  <SelectItem key={r.path} value={r.path} className={ITEM}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span>{repoLabel(r)}</span>
                      {r.path === WORKSPACE_ROOT && (
                        <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                          mount root
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* ACCOUNT */}
          <Select value={effectiveAccountChoice} onValueChange={setAccountChoice}>
            <SelectTrigger className={ROW} aria-label="Account">
              <RowHead icon={Ico.settings} label="Account" />
              <RowValue
                value={accountActive?.label ?? "Default"}
                meta={
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: accountActive?.present === false ? "var(--err)" : "var(--live)",
                    }}
                  />
                }
              />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6} className={POPOVER}>
              {accountOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={ITEM}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: opt.present ? "var(--live)" : "var(--err)",
                      }}
                    />
                    <span>{opt.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                      {opt.sub}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* spawn */}
        <Button size="sm" style={{ width: "100%", marginTop: 16 }} onClick={spawn}>
          {Ico.plus}
          {resuming ? "Resume agent" : "Spawn agent"}
          <span className="kbd" style={{ marginLeft: 6 }}>
            ⏎
          </span>
        </Button>

        {/* tip */}
        <div
          className="mono"
          style={{ marginTop: 14, fontSize: 10.5, color: "var(--fg-3)", textAlign: "center" }}
        >
          {resuming
            ? "Esc cancel · Tab next field"
            : "⌘1–3 swap agent · Esc cancel · Tab next field"}
        </div>
      </div>
    </div>
  );
}
