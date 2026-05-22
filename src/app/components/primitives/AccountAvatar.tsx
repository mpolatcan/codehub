/**
 * AccountAvatar — hash-derived colored letter avatar.
 *
 * Accepts an account `id` and looks it up in ACCOUNTS from mock.ts for the
 * `.short` label. The tone (background hue) is derived deterministically from
 * the id unless the account defines a `tone` override. Pass a full Account
 * object via `account` prop to avoid the mock lookup in non-gallery contexts.
 */
import type { Account } from "@/app/lib/mock";
import { ACCOUNTS } from "@/app/lib/mock";

export interface AccountAvatarProps {
  id: string;
  size?: number;
  ring?: boolean;
  /** Override: pass a full Account object directly instead of doing a mock lookup. */
  account?: Account;
}

export function AccountAvatar({ id, size = 18, ring = false, account }: AccountAvatarProps) {
  const a = account ?? ACCOUNTS[id] ?? ACCOUNTS.cm;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const tone = a.tone ?? `oklch(0.72 0.13 ${hue})`;

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
        background: `linear-gradient(135deg, ${tone}, color-mix(in oklab, ${tone} 55%, var(--bg-0)))`,
        color: "var(--bg-0)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: size * 0.42,
        fontWeight: 600,
        flexShrink: 0,
        boxShadow: ring ? `0 0 0 1.5px var(--bg-2), 0 0 0 2.5px ${tone}` : "none",
        letterSpacing: "-0.02em",
      }}
    >
      {a.short}
    </span>
  );
}
