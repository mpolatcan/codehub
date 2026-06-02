import {
  LinuxNotificationPreview,
  LiveActivityPreview,
  LiveActivityStateGrid,
  MacNotificationPreview,
  NotificationPreview,
  WindowsNotificationPreview,
} from "@/app/screens/Settings";

/**
 * LiveActivities — standalone visual reference for design/screens/live-activities.jsx.
 *
 * The real delivery path is still Settings → Notifications + native/Tauri event
 * plumbing. This screen keeps the design artboard inspectable in #/__screens
 * without duplicating the underlying live-activity/toast components.
 */
export function LiveActivities() {
  return (
    <div
      className="ch-root"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        minHeight: 0,
        overflow: "hidden",
        color: "var(--fg-1)",
      }}
    >
      <LiveActivityPreview variant="screen" />

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "1.5rem 2rem" }}>
        <LiveActivityStateGrid />

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.875rem",
            marginBottom: "0.875rem",
            marginTop: "0.5rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "var(--fs-16)", fontWeight: 600 }}>
            Cross-platform toasts
          </h2>
          <span className="mono" style={{ fontSize: "var(--fs-12)", color: "var(--fg-2)" }}>
            same event, native styling per OS
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(12rem, 100%), 1fr))",
            gap: "0.875rem",
          }}
        >
          <NotificationPreview os="macOS">
            <MacNotificationPreview />
          </NotificationPreview>
          <NotificationPreview os="Windows 11">
            <WindowsNotificationPreview />
          </NotificationPreview>
          <NotificationPreview os="Linux · GNOME">
            <LinuxNotificationPreview />
          </NotificationPreview>
        </div>
      </div>
    </div>
  );
}
