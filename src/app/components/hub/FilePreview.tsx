import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { IconBtn } from "../../components/primitives/IconBtn";
import { Tip } from "../../components/primitives/Tip";
import { Ico } from "../../components/primitives/icons";
import { rootPx, useResizableDock } from "../../hooks/useResizableDock";
import { EASE } from "../../hooks/useSlideIn";
import { highlight, langFromExt } from "../../lib/highlight";
import { ipc } from "../../lib/ipc";
import { activeWorkspace, useStore } from "../../lib/store";
import { ResizeHandle } from "./ResizeHandle";

const WIDTH = 22.5; // rem (scales with the fluid root)

export function FilePreview({ path, onClose }: { path: string; onClose: () => void }) {
  const [body, setBody] = useState<string | null>(null);
  const containerKey = useStore((s) => activeWorkspace(s)?.containerKey);
  const { size, dragging, ref, beginResize, reset } = useResizableDock("ch.filePreview.wr2", WIDTH, {
    min: 12,
    max: () => Math.max(12, Math.min(window.innerWidth * 0.5, 43.75 * rootPx()) / rootPx()),
    edge: "left",
  });

  useEffect(() => {
    let alive = true;
    setBody(null);
    ipc
      .containerReadFile(path, containerKey)
      .then((b) => alive && setBody(b))
      .catch((e) => alive && setBody(`(could not read file: ${e})`));
    return () => {
      alive = false;
    };
  }, [path, containerKey]);

  const filename = path.split("/").pop() ?? path;
  const dir = path.slice(0, -(filename.length + 1));
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : null;
  const lineCount = body ? body.split("\n").length : 0;
  const lang = ext ? langFromExt(ext) : null;
  const highlighted = useMemo(() => (body && lang ? highlight(body, lang) : null), [body, lang]);

  return (
    <motion.aside
      ref={ref}
      initial={{ width: "0rem" }}
      animate={{ width: `${size}rem` }}
      exit={{ width: "0rem" }}
      transition={{ duration: dragging ? 0 : 0.28, ease: EASE }}
      style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
    >
      {/* sized inner so content doesn't reflow while the outer width animates */}
      <div
        style={{
          width: `${size}rem`,
          height: "100%",
          background: "var(--bg-1)",
          borderLeft: "1px solid var(--bd-soft)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          color: "var(--fg-1)",
        }}
      >
        <div
          style={{
            padding: "0.5rem 0.625rem",
            borderBottom: "1px solid var(--bd-soft)",
            display: "flex",
            alignItems: "center",
            gap: "0.4375rem",
          }}
        >
          <span style={{ color: "var(--idle)", display: "inline-flex" }}>{Ico.diff}</span>
          <Tip text={path}>
            <span
              className="mono"
              style={{
                fontSize: "var(--fs-12)",
                fontWeight: 500,
                color: "var(--fg-0)",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                direction: "rtl",
                textAlign: "left",
              }}
            >
              {filename}
            </span>
          </Tip>
          {ext && (
            <span
              className="mono"
              style={{
                fontSize: "var(--fs-10)",
                color: "var(--fg-3)",
                padding: "0.0625rem 0.3125rem",
                borderRadius: "0.1875rem",
                background: "var(--bg-2)",
                flexShrink: 0,
              }}
            >
              {ext}
            </span>
          )}
          <IconBtn title="Close file preview" onClick={onClose}>
            {Ico.close}
          </IconBtn>
        </div>

        <div
          className="scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            fontFamily: "var(--mono)",
            fontSize: "var(--fs-12)",
            lineHeight: 1.55,
            background: "var(--bg-0)",
          }}
        >
          {body === null ? (
            <Note>Reading file…</Note>
          ) : body.startsWith("(could not read") ? (
            <Note>{body}</Note>
          ) : body === "" ? (
            <Note>(empty file)</Note>
          ) : (
            <div style={{ display: "flex", margin: 0 }}>
              <LineNumbers count={lineCount} />
              <pre
                style={{
                  margin: 0,
                  padding: "0.625rem 0.75rem 0.625rem 0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: "var(--fg-1)",
                  flex: 1,
                  minWidth: 0,
                }}
                // biome-ignore lint: safe — tokenized source, not user-controlled
                dangerouslySetInnerHTML={highlighted ? { __html: highlighted } : undefined}
              >
                {highlighted ? undefined : body}
              </pre>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "0.4375rem 0.625rem",
            borderTop: "1px solid var(--bd-soft)",
            display: "flex",
            alignItems: "center",
            gap: "0.4375rem",
            fontFamily: "var(--mono)",
            fontSize: "var(--fs-10)",
            color: "var(--fg-3)",
            minHeight: "1.75rem",
          }}
        >
          {body !== null && lineCount > 0 && <span>{lineCount} lines</span>}
          {lang && (
            <span
              style={{
                padding: "0.0625rem 0.3125rem",
                borderRadius: "0.1875rem",
                background: "var(--bg-2)",
              }}
            >
              {lang}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <Tip text={dir}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dir}
            </span>
          </Tip>
        </div>
      </div>
      <ResizeHandle edge="left" onMouseDown={beginResize} onDoubleClick={reset} />
    </motion.aside>
  );
}

function LineNumbers({ count }: { count: number }) {
  const width = String(count).length * 7.5 + 16;
  return (
    <div
      aria-hidden
      className="tnum"
      style={{
        width,
        flexShrink: 0,
        padding: "0.625rem 0.5rem 0.625rem 0.625rem",
        textAlign: "right",
        color: "var(--fg-4, var(--fg-3))",
        opacity: 0.4,
        fontSize: "var(--fs-11)",
        lineHeight: 1.55,
        userSelect: "none",
        borderRight: "1px solid var(--bd-soft)",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static line-number gutter (1..count), never reordered
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        padding: "1.25rem 0.875rem",
        fontSize: "var(--fs-11)",
        color: "var(--fg-3)",
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
