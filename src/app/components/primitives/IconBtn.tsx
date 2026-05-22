import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

export interface IconBtnProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  active?: boolean;
  danger?: boolean;
  style?: CSSProperties;
}

export function IconBtn({
  children,
  onClick,
  title,
  active = false,
  danger = false,
  style,
}: IconBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        border: "none",
        background: active ? "var(--bg-active)" : "transparent",
        color: danger ? "var(--err)" : active ? "var(--fg-0)" : "var(--fg-2)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background .12s, color .12s",
        padding: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--bg-3)";
          e.currentTarget.style.color = "var(--fg-0)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = danger ? "var(--err)" : "var(--fg-2)";
        }
      }}
    >
      {children}
    </button>
  );
}
