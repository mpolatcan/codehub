import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Ico } from "../../components/primitives/icons";
import { type FileEntry, ipc } from "../../lib/ipc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";

// Browses the runtime container's /workspace, one directory at a time
// (container_list_dir → `find -maxdepth 1`), with a read-only preview of a
// selected file's first 256 KiB (container_read_file → `head -c`). Both reads
// are confined to /workspace server-side. Nothing here is fabricated — an empty
// directory, a down runtime, or a binary file each render an honest line.

const ROOT = "/workspace";

// Append a child segment to a /workspace path (root has no trailing slash).
function join(dir: string, name: string): string {
  return dir === "/" ? `/${name}` : `${dir}/${name}`;
}

// Dirs before files, each group alphabetical (links/other sort with files).
function order(entries: FileEntry[]): FileEntry[] {
  return [...entries].sort((a, b) => {
    const ad = a.kind === "dir";
    const bd = b.kind === "dir";
    if (ad !== bd) return ad ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function FilesBrowser({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Current directory, its listing (null = loading, [] = empty/error), and the
  // selected file's path + contents (null content = loading).
  const [cwd, setCwd] = useState(ROOT);
  const [entries, setEntries] = useState<FileEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);

  // Each open starts fresh at the workspace root.
  useEffect(() => {
    if (open) {
      setCwd(ROOT);
      setFile(null);
      setBody(null);
    }
  }, [open]);

  // Load the listing whenever the directory changes while open.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setEntries(null);
    setErr(null);
    ipc
      .containerListDir(cwd)
      .then((e) => alive && setEntries(e))
      .catch((e) => {
        if (alive) {
          setEntries([]);
          setErr(String(e));
        }
      });
    return () => {
      alive = false;
    };
  }, [open, cwd]);

  // Load a file's preview when one is selected.
  useEffect(() => {
    if (file === null) return;
    let alive = true;
    setBody(null);
    ipc
      .containerReadFile(file)
      .then((b) => alive && setBody(b))
      .catch((e) => alive && setBody(`(could not read file: ${e})`));
    return () => {
      alive = false;
    };
  }, [file]);

  const enter = (e: FileEntry) => {
    if (e.kind === "dir") {
      setFile(null);
      setBody(null);
      setCwd(join(cwd, e.name));
    } else if (e.kind === "file") {
      setFile(join(cwd, e.name));
    }
  };

  const rows = entries ? order(entries) : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent style={{ maxWidth: 860, padding: 0 }}>
        <DialogHeader style={{ padding: "16px 18px 10px" }}>
          <DialogTitle style={{ fontSize: 13, fontWeight: 500 }}>Files</DialogTitle>
          <Crumbs
            cwd={cwd}
            onNav={(p) => {
              setFile(null);
              setBody(null);
              setCwd(p);
            }}
          />
        </DialogHeader>
        <div
          style={{
            display: "flex",
            borderTop: "1px solid var(--bd-soft)",
            background: "var(--bg-0)",
            height: "62vh",
          }}
        >
          {/* directory listing */}
          <div
            className="scroll"
            style={{
              width: file ? 300 : "100%",
              flexShrink: 0,
              overflow: "auto",
              borderRight: file ? "1px solid var(--bd-soft)" : "none",
              padding: "6px 8px",
            }}
          >
            {entries === null ? (
              <Note>Reading {cwd}…</Note>
            ) : err ? (
              <Note>{err}</Note>
            ) : rows.length === 0 ? (
              <Note>Empty directory.</Note>
            ) : (
              rows.map((e) => (
                <EntryRow
                  key={e.name}
                  entry={e}
                  active={file === join(cwd, e.name)}
                  onClick={() => enter(e)}
                />
              ))
            )}
          </div>

          {/* file preview */}
          {file && (
            <div
              className="scroll"
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "auto",
                fontFamily: "var(--mono)",
                fontSize: 11.5,
                lineHeight: 1.55,
              }}
            >
              <div
                className="mono"
                style={{
                  position: "sticky",
                  top: 0,
                  padding: "8px 12px",
                  fontSize: 11,
                  color: "var(--fg-2)",
                  background: "var(--bg-1)",
                  borderBottom: "1px solid var(--bd-soft)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.slice(cwd.length + 1)}
              </div>
              {body === null ? (
                <Note>Reading file…</Note>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "var(--fg-1)",
                  }}
                >
                  {body || "(empty file)"}
                </pre>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Clickable path segments. The leading "/workspace" is one crumb; deeper
// segments each navigate to that ancestor. The last crumb is the current dir.
function Crumbs({ cwd, onNav }: { cwd: string; onNav: (path: string) => void }) {
  const segs = cwd.split("/").filter(Boolean); // ["workspace", "a", "b"]
  return (
    <div
      className="mono"
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, fontSize: 11.5 }}
    >
      {segs.map((seg, i) => {
        const path = `/${segs.slice(0, i + 1).join("/")}`;
        const last = i === segs.length - 1;
        return (
          <span key={path} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
            <button
              type="button"
              disabled={last}
              onClick={() => onNav(path)}
              style={{
                border: "none",
                background: "transparent",
                cursor: last ? "default" : "pointer",
                color: last ? "var(--fg-1)" : "var(--fg-2)",
                padding: "1px 3px",
                borderRadius: 3,
                fontFamily: "var(--mono)",
                fontSize: 11.5,
              }}
              className={last ? undefined : "rail-file"}
            >
              {seg}
            </button>
            {!last && <span style={{ color: "var(--fg-3)" }}>/</span>}
          </span>
        );
      })}
    </div>
  );
}

function EntryRow({
  entry,
  active,
  onClick,
}: {
  entry: FileEntry;
  active: boolean;
  onClick: () => void;
}) {
  const isDir = entry.kind === "dir";
  return (
    <button
      type="button"
      onClick={onClick}
      title={entry.name}
      className="rail-file"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "4px 6px",
        borderRadius: 4,
        border: "none",
        background: active ? "var(--bg-2)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--mono)",
        fontSize: 11.5,
      }}
    >
      <span style={{ flexShrink: 0, color: isDir ? "var(--fg-1)" : "var(--fg-3)" }}>
        {isDir ? Ico.files : Ico.diff}
      </span>
      <span
        style={{
          color: entry.kind === "link" ? "var(--wait)" : "var(--fg-1)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.name}
        {isDir && "/"}
      </span>
      {!isDir && (
        <span className="tnum" style={{ flexShrink: 0, fontSize: 10.5, color: "var(--fg-3)" }}>
          {fmtBytes(entry.size)}
        </span>
      )}
      {isDir && <span style={{ flexShrink: 0, color: "var(--fg-3)" }}>{Ico.arrowR}</span>}
    </button>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div
      className="mono"
      style={{ padding: "20px 14px", fontSize: 11, color: "var(--fg-3)", lineHeight: 1.5 }}
    >
      {children}
    </div>
  );
}

function fmtBytes(n: number): string {
  if (n <= 0) return "0 B";
  const units = ["B", "kB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
