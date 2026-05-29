import { fileIcon } from "../../lib/fileIcon";
import { Ico } from "./icons";

// Per-file-type monogram chip for the file tree: a small rounded square tinted by
// the file's language color (see lib/fileIcon) with a 1–2 char label. One color
// language across Files / Diff / Preview.
export function FileGlyph({ name, size = 16 }: { name: string; size?: number }) {
  const { label, color } = fileIcon(name);
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: `color-mix(in oklab, ${color} 20%, transparent)`,
        color,
        fontFamily: "var(--mono)",
        fontSize: label.length > 2 ? 6.5 : 8.5,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}
    >
      {label}
    </span>
  );
}

// Folder mark for the tree: a faint folder glyph that brightens when open. The
// expand chevron is rendered separately by the row (so it can sit in the gutter).
export function FolderGlyph({ open, size = 16 }: { open: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: open ? "var(--pri)" : "var(--fg-2)",
      }}
    >
      {Ico.files}
    </span>
  );
}
