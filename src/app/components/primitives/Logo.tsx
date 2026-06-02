export interface LogoProps {
  size?: number;
  withText?: boolean;
}

export function Logo({ size = 18, withText = true }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Outer box in rem (px ÷ 16) so the mark scales with the fluid root like
          the wordmark; the viewBox keeps the internal SVG coords fixed. */}
      <svg
        width={`${size / 16}rem`}
        height={`${size / 16}rem`}
        viewBox="0 0 20 20"
        role="img"
        aria-label="CodeHub"
      >
        <rect
          x="1.5"
          y="1.5"
          width="17"
          height="17"
          rx="4"
          stroke="var(--fg-0)"
          strokeWidth="1.4"
          fill="none"
        />
        <path
          d="M6 7l-2 3 2 3M14 7l2 3-2 3M11 6l-2 8"
          stroke="var(--fg-0)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && (
        <span
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--fs-14)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          CodeHub
        </span>
      )}
    </div>
  );
}
