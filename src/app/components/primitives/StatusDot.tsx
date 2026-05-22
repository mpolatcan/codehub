/** Status dot and badge primitives. Faithful port of design/components.jsx. */

export type StatusKey = "live" | "wait" | "idle" | "done" | "err" | "off";

export const STATUS: Record<StatusKey, { label: string; color: string; cls: string }> = {
  live: { label: "Running", color: "var(--live)", cls: "live" },
  wait: { label: "Awaiting input", color: "var(--wait)", cls: "wait" },
  idle: { label: "Idle", color: "var(--idle)", cls: "idle" },
  done: { label: "Done", color: "var(--done)", cls: "done" },
  err: { label: "Failed", color: "var(--err)", cls: "err" },
  off: { label: "Stopped", color: "var(--fg-3)", cls: "off" },
};

export interface StatusDotProps {
  status?: StatusKey;
  pulse?: boolean;
}

export function StatusDot({ status = "idle", pulse = false }: StatusDotProps) {
  const pulseClass = pulse && status === "live" ? " pulse" : "";
  return <span className={`dot ${status}${pulseClass}`} />;
}
