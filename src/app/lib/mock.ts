/** Mock account data used by the gallery and AccountAvatar. */
export interface Account {
  name: string;
  short: string;
  tier: string;
  agent: "claude" | "codex" | "antigravity";
  usage: number;
  limit: string;
  plan: string;
  tone?: string;
}

export const ACCOUNTS: Record<string, Account> = {
  cm: {
    name: "m.kim",
    short: "MK",
    tier: "Claude Max",
    agent: "claude",
    usage: 0.58,
    limit: "5x Pro",
    plan: "personal",
  },
  cw: {
    name: "m.kim · work",
    short: "WK",
    tier: "Claude Team",
    agent: "claude",
    usage: 0.21,
    limit: "shared",
    plan: "work",
  },
  ca: {
    name: "aurora-bot",
    short: "AB",
    tier: "API · Anthropic",
    agent: "claude",
    usage: 0.04,
    limit: "$200/mo",
    plan: "api",
  },
  cx: {
    name: "m.kim",
    short: "MK",
    tier: "OpenAI Plus",
    agent: "codex",
    usage: 0.31,
    limit: "10x free",
    plan: "personal",
  },
  cxa: {
    name: "aurora-bot",
    short: "AB",
    tier: "API · OpenAI",
    agent: "codex",
    usage: 0.12,
    limit: "$100/mo",
    plan: "api",
  },
  ag: {
    name: "m.kim",
    short: "MK",
    tier: "Google AI",
    agent: "antigravity",
    usage: 0.18,
    limit: "free tier",
    plan: "personal",
  },
};
