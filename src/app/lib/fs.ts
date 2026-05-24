import type { FileEntry } from "./ipc";

// Shared helpers for the container /workspace browsers (FilesBrowser modal +
// the Workspace view's file tree). Pure functions over container_list_dir
// output — kept here so both surfaces sort and path-join identically.

// Append a child segment to a /workspace path (root "/" has no trailing slash).
export function joinPath(dir: string, name: string): string {
  return dir === "/" ? `/${name}` : `${dir}/${name}`;
}

// Dirs before files, each group alphabetical (links/other sort with files).
export function orderEntries(entries: FileEntry[]): FileEntry[] {
  return [...entries].sort((a, b) => {
    const ad = a.kind === "dir";
    const bd = b.kind === "dir";
    if (ad !== bd) return ad ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// Human byte size: "0 B", "512 B", "1.4 kB", "23 MB". Whole numbers ≥100 or in
// bytes; one decimal otherwise.
export function fmtBytes(n: number): string {
  if (n <= 0) return "0 B";
  const units = ["B", "kB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
