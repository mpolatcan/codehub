import { Ico } from "../primitives/icons";

// Honest placeholder for a sidebar view whose screen hasn't been ported yet.
// Used so the nav item is reachable (no dead link) without faking a screen.
export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "var(--bg-1)",
        color: "var(--fg-2)",
        minWidth: 0,
        padding: 40,
        textAlign: "center",
      }}
    >
      <span style={{ color: "var(--fg-3)", transform: "scale(1.8)" }}>{Ico.grid}</span>
      <h1 style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 600, color: "var(--fg-0)" }}>
        {title}
      </h1>
      <p style={{ margin: 0, maxWidth: 360, fontSize: 13, lineHeight: 1.55 }}>{note}</p>
      <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
        Coming soon
      </span>
    </main>
  );
}
