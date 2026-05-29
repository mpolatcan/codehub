import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { Tip } from "./Tip";

export interface IconBtnProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  // Foreground/hover overrides for use on a colored surface (e.g. a tinted pane
  // header). Default to the standard fg tokens so existing callers are unchanged.
  idleColor?: string;
  hoverColor?: string;
  hoverBg?: string;
}

export function IconBtn({
  children,
  onClick,
  title,
  active = false,
  danger = false,
  disabled = false,
  style,
  idleColor,
  hoverColor,
  hoverBg,
}: IconBtnProps) {
  // An explicit idleColor wins over the danger/active defaults so a tinted header
  // can recolor every control (including close) to its contrast ink.
  const restColor = idleColor ?? (danger ? "var(--err)" : active ? "var(--fg-0)" : "var(--fg-2)");
  const btn = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        background: active ? "var(--bg-active)" : "transparent",
        color: restColor,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background .12s, color .12s, opacity .12s",
        padding: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = hoverBg ?? "var(--bg-3)";
          e.currentTarget.style.color = hoverColor ?? "var(--fg-0)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = restColor;
        }
      }}
    >
      {children}
    </button>
  );

  return title ? <Tip text={title}>{btn}</Tip> : btn;
}
