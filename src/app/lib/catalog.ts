import type { Cli, Mode } from "./ipc";

export interface ModeSpec {
  id: Mode;
  label: string;
  hint: string;
  badge: string;
}

export const MODES: ModeSpec[] = [
  { id: "standard", label: "Standard", hint: "Agent asks before edits and commands.", badge: "" },
  {
    id: "auto",
    label: "Auto",
    hint: "Auto-accepts edits in the workspace, still sandboxed.",
    badge: "AUTO",
  },
  {
    id: "yolo",
    label: "YOLO",
    hint: "Skips all approvals & sandbox — the container is the boundary.",
    badge: "YOLO",
  },
];

export const MODE_BY_ID: Record<Mode, ModeSpec> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
) as Record<Mode, ModeSpec>;

// Antigravity's launch flags are unverified, so it offers Standard only.
export const MODE_SUPPORT: Record<Cli, Mode[]> = {
  claude: ["standard", "auto", "yolo"],
  codex: ["standard", "auto", "yolo"],
  antigravity: ["standard"],
};

export interface CliSpec {
  id: Cli;
  // Full product name for the launcher row (e.g. "Claude Code").
  label: string;
  // Short name used to number default sessions (e.g. "Claude 1").
  alias: string;
}

export const CLIS: CliSpec[] = [
  { id: "claude", label: "Claude Code", alias: "Claude" },
  { id: "codex", label: "Codex", alias: "Codex" },
  { id: "antigravity", label: "Antigravity", alias: "Antigravity" },
];

export const SPEC_BY_CLI: Record<Cli, CliSpec> = Object.fromEntries(
  CLIS.map((c) => [c.id, c]),
) as Record<Cli, CliSpec>;
