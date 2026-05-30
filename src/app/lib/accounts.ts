import type { AccountProfileStatus, AgentCli, Cli, KeyStatus, ModelProvider } from "./ipc";

export const AUTO_ACCOUNT = "__auto__";
export const HOST_ACCOUNT = "__host__";

// Which agent a provider's harness env targets. Anthropic-compatible endpoints
// drive Claude (ANTHROPIC_BASE_URL/AUTH_TOKEN/MODEL); OpenAI-compatible drive
// Codex. Cloud-credential (bedrock/vertex) + router-only (openrouter) kinds
// aren't launch-wired from a bare token, so they target no agent.
export function providerTargetAgent(kind: string): Cli | null {
  if (kind === "anthropic" || kind === "anthropic-compatible") return "claude";
  if (kind === "openai" || kind === "openai-compatible") return "codex";
  return null;
}

// A provider is selectable at launch when it's enabled, has a stored token, and
// maps to a wired harness env (so selecting it actually changes the agent's
// endpoint).
export function providerLaunchable(p: ModelProvider): boolean {
  return p.enabled && p.hasToken && providerTargetAgent(p.kind) !== null;
}

export function agentAccountState(
  agent: Cli,
  accountProfiles: AccountProfileStatus[],
  keyStatus: Partial<Record<AgentCli, KeyStatus>> | null | undefined,
  accountChoice: string,
) {
  // Disabled profiles are kept in settings but never offered at spawn.
  const agentAccounts = accountProfiles.filter((p) => p.agent === agent && p.enabled);
  const defaultKey = agent === "shell" ? null : (keyStatus?.[agent as AgentCli] ?? null);
  const newestPresentAccount = [...agentAccounts].reverse().find((p) => p.present)?.id;
  const autoAccountChoice =
    defaultKey?.present || agentAccounts.length === 0
      ? HOST_ACCOUNT
      : (newestPresentAccount ?? HOST_ACCOUNT);
  const effectiveAccountChoice =
    accountChoice === AUTO_ACCOUNT ||
    (accountChoice !== HOST_ACCOUNT && !agentAccounts.some((p) => p.id === accountChoice))
      ? autoAccountChoice
      : accountChoice;
  const selectedAccount =
    effectiveAccountChoice === HOST_ACCOUNT ? undefined : effectiveAccountChoice;

  return {
    agentAccounts,
    defaultKey,
    effectiveAccountChoice,
    selectedAccount,
  };
}

export function accountProfileSubtitle(profile: AccountProfileStatus): string {
  if (profile.source === "vault") {
    return `keychain · ${profile.present ? "stored" : "missing"}`;
  }
  return `API key · ${profile.present ? "stored" : "missing"}`;
}
