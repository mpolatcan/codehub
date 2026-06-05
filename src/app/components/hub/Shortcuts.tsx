import { useMemo, useState } from "react";
import { useOverlay } from "../../lib/overlay";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";

type Sc = { keys: string[]; desc: string };

// EVERY entry here is a real, implemented binding (useKeyboard.ts, or the
// process-global ⌘⇧J in the Rust backend). No aspirational/fictional rows — the
// cheat sheet is a contract with the handler. Add a row only when its handler
// exists, and keep the keys identical to useKeyboard + the matching UI control.
export const SHORTCUT_GROUPS: { title: string; items: Sc[] }[] = [
  {
    title: "Workspace",
    items: [
      { keys: ["⌘", "T"], desc: "Open / new workspace" },
      { keys: ["⌘", "N"], desc: "New agent (current workspace)" },
      { keys: ["⌘", "⇧", "N"], desc: "New agent in a new group" },
      { keys: ["⌘", "W"], desc: "Close pane" },
      { keys: ["⌘", "⇧", "W"], desc: "Close workspace tab" },
      { keys: ["⌘", "\\"], desc: "Split pane" },
      { keys: ["⌘", "⇧", "\\"], desc: "Split pane (other axis)" },
    ],
  },
  {
    title: "Panels",
    items: [
      { keys: ["⌘", "E"], desc: "Files" },
      { keys: ["⌘", "D"], desc: "Source control" },
      { keys: ["⌘", "J"], desc: "Shell" },
      { keys: ["⌘", "I"], desc: "Resource graphs" },
      { keys: ["⌘", "B"], desc: "Sidebar" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["⌘", "1–9"], desc: "Jump to tab" },
      { keys: ["⌘", "["], desc: "Previous tab" },
      { keys: ["⌘", "]"], desc: "Next tab" },
      { keys: ["⌘", "K"], desc: "Command palette" },
      { keys: ["esc"], desc: "Exit focus / close overlay" },
    ],
  },
  {
    title: "System",
    items: [
      { keys: ["⌘", ","], desc: "Settings" },
      { keys: ["⌘", "⇧", "L"], desc: "Cycle theme (dark / gray / light)" },
      { keys: ["⌘", "⇧", "J"], desc: "Toggle Dynamic Island (macOS)" },
      { keys: ["⌘", "/"], desc: "This help" },
      { keys: ["?"], desc: "This help" },
    ],
  },
  {
    title: "In a terminal pane",
    items: [
      { keys: ["↵"], desc: "Send to the agent" },
      { keys: ["⇧", "↵"], desc: "New line" },
      { keys: ["esc"], desc: "Cancel the current turn" },
      { keys: ["⌘", "C"], desc: "Copy selection" },
    ],
  },
];

export function Shortcuts() {
  const open = useOverlay((s) => s.shortcuts);
  const setShortcuts = useOverlay((s) => s.setShortcuts);
  const [filter, setFilter] = useState("");

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SHORTCUT_GROUPS;
    return SHORTCUT_GROUPS.map((g) => ({
      title: g.title,
      items: g.items.filter(
        (sc) =>
          sc.desc.toLowerCase().includes(q) ||
          sc.keys.join(" ").toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q),
      ),
    })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <Dialog open={open} onOpenChange={setShortcuts}>
      <DialogContent
        className="w-[min(70rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[0.875rem] border-[var(--bd-strong)] bg-[var(--bg-2)] p-0 shadow-[0_30px_80px_rgba(0,0,0,.6)] sm:max-w-none"
        showCloseButton={false}
        style={{ maxHeight: "min(47.5rem, calc(100vh - 3rem))" }}
      >
        <DialogHeader className="gap-0">
          <div
            style={{
              padding: "0.875rem 1.375rem",
              borderBottom: "1px solid var(--bd-soft)",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              flexWrap: "wrap",
            }}
          >
            <DialogTitle style={{ fontSize: "var(--fs-16)" }}>Keyboard shortcuts</DialogTitle>
            <DialogDescription className="sr-only">
              Search and review the keyboard shortcuts available in CodeHub.
            </DialogDescription>
            <span className="mono" style={{ fontSize: "var(--fs-12)", color: "var(--fg-2)" }}>
              press <span className="kbd">?</span> anywhere to open ·{" "}
              <span className="kbd">esc</span> to close
            </span>
            <span style={{ flex: 1 }} />
            <Input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter shortcuts…"
              spellCheck={false}
              className="mono h-auto w-full max-w-[13.75rem] rounded-md px-2.5 py-1 text-xs"
            />
          </div>
        </DialogHeader>

        <div
          className="scroll"
          style={{
            overflow: "auto",
            padding: "1.375rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(12rem, 100%), 1fr))",
            gap: "1.75rem 1.375rem",
            minHeight: "5rem",
          }}
        >
          {groups.length === 0 ? (
            <p
              className="mono"
              style={{
                margin: 0,
                fontSize: "var(--fs-12)",
                color: "var(--fg-3)",
                gridColumn: "1 / -1",
              }}
            >
              No shortcuts match "{filter}".
            </p>
          ) : (
            groups.map((g) => (
              <div key={g.title}>
                <div
                  className="lbl"
                  style={{
                    marginBottom: "0.625rem",
                    color: "var(--fg-1)",
                    fontSize: "var(--fs-11)",
                  }}
                >
                  {g.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {g.items.map((sc) => (
                    <div
                      key={`${sc.keys.join("+")} ${sc.desc}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.1875rem 0",
                      }}
                    >
                      <span style={{ display: "inline-flex", gap: "0.1875rem" }}>
                        {sc.keys.map((k) => (
                          <span key={k} className="kbd">
                            {k}
                          </span>
                        ))}
                      </span>
                      <span style={{ flex: 1 }} />
                      <span
                        style={{
                          fontSize: "var(--fs-12)",
                          color: "var(--fg-1)",
                          textAlign: "right",
                        }}
                      >
                        {sc.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.625rem 1.375rem",
            borderTop: "1px solid var(--bd-soft)",
            background: "var(--bg-1)",
          }}
        >
          <p
            className="mono"
            style={{ margin: 0, fontSize: "var(--fs-11)", color: "var(--fg-3)", flex: 1 }}
          >
            vim-style keys also work inside terminal panes (handled by tmux)
          </p>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
