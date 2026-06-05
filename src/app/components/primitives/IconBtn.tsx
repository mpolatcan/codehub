import type { ButtonHTMLAttributes, CSSProperties, MouseEventHandler, ReactNode, Ref } from "react";
import { Button } from "../../ui/button";
import { Tip } from "./Tip";

// Extends the native button props so the handlers/ref/data-* that Radix injects
// when an external `<Tip>`/<DropdownMenuTrigger asChild> clones an <IconBtn>
// have a typed home and get forwarded to the underlying <Button>.
export interface IconBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  // Square edge length (default 26). Authored in px-at-base but rendered in rem
  // (px ÷ 16) so the control scales with the fluid root like the rest of the
  // chrome — e.g. <IconBtn size={22}> for the compact controls in tabs/footers.
  size?: number;
  style?: CSSProperties;
  // Foreground/hover overrides for use on a colored surface (e.g. a tinted pane
  // header). Default to the standard fg tokens so existing callers are unchanged.
  idleColor?: string;
  hoverColor?: string;
  hoverBg?: string;
  // Forwarded to <Button> so a wrapping `<Tip><IconBtn/></Tip>` (Radix asChild)
  // can attach its tooltip ref — without it the cloned ref has nowhere to land
  // and the tooltip never opens.
  ref?: Ref<HTMLButtonElement>;
  // Accessible name for icon-only buttons (no visible text child).
  "aria-label"?: string;
}

// Token-driven icon button. Renders the shadcn <Button> (variant `ghostIcon`)
// so every icon control shares the one button implementation; idle/hover/active
// colors flow through CSS custom properties (no JS hover handlers), which also
// lets a tinted pane header recolor the whole control via the *Color props.
export function IconBtn({
  children,
  onClick,
  title,
  active = false,
  danger = false,
  disabled = false,
  size = 26,
  style,
  idleColor,
  hoverColor,
  hoverBg,
  ref,
  "aria-label": ariaLabel,
  // Radix-injected handlers (onPointerMove/onFocus/data-state/…) land here and
  // are spread onto <Button> so the trigger's hover/press wiring actually binds.
  ...rest
}: IconBtnProps) {
  // Map state → the CSS vars consumed by the `ghostIcon` variant. active pins
  // hover to the active colors so it reads "stuck on"; an explicit idleColor
  // (tinted header) wins over the danger default; unset vars fall back to the
  // neutral icon-button look defined in the variant.
  const vars: Record<string, string> = {};
  if (active) {
    vars["--ib-bg"] = "var(--bg-active)";
    vars["--ib-fg"] = "var(--fg-0)";
    vars["--ib-hover-bg"] = "var(--bg-active)";
    vars["--ib-hover-fg"] = "var(--fg-0)";
  } else {
    if (idleColor) vars["--ib-fg"] = idleColor;
    else if (danger) vars["--ib-fg"] = "var(--err)";
    if (hoverColor) vars["--ib-hover-fg"] = hoverColor;
    if (hoverBg) vars["--ib-hover-bg"] = hoverBg;
  }

  const btn = (
    <Button
      {...rest}
      ref={ref}
      type="button"
      variant="ghostIcon"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      // Layout (size/radius) stays inline so callers can override width/height.
      // The icon is pinned to 0.875rem (14px at base, scales with the root)
      // instead of the variant's size-4, so box + glyph grow together. disabled
      // opacity matches the old 0.4.
      className="rounded-md p-0 disabled:opacity-40 [&_svg]:!size-[0.875rem]"
      style={
        { width: `${size / 16}rem`, height: `${size / 16}rem`, ...vars, ...style } as CSSProperties
      }
    >
      {children}
    </Button>
  );

  return title ? <Tip text={title}>{btn}</Tip> : btn;
}
