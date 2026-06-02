import type { CSSProperties } from "react";

/** A terminal line segment: [className, text]. className may be "" for plain text. */
export type TermSeg = [string, string];

/** A terminal line: an array of [className, text] segments. */
export type TermLineData = TermSeg[];

export interface TermLineProps {
  segs: TermLineData;
}

export function TermLine({ segs }: TermLineProps) {
  return (
    <div>
      {segs.map(([cls, txt], i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: terminal segments are positional, no stable id
        <span key={i} className={cls || undefined}>
          {txt}
        </span>
      ))}
      {segs.length === 0 ? " " : null}
    </div>
  );
}

export interface TermBlockProps {
  lines: TermLineData[];
  style?: CSSProperties;
}

export function TermBlock({ lines, style }: TermBlockProps) {
  return (
    <div
      className="term"
      style={{ flex: 1, padding: "0.75rem 0.875rem", overflow: "hidden", ...style }}
    >
      {lines.map((segs, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: terminal lines are positional, no stable id
        <TermLine key={i} segs={segs} />
      ))}
    </div>
  );
}

/** Pre-built terminal snippets for gallery / demo use. */
export const SNIPPETS: Record<string, TermLineData[]> = {
  ccBrief: [
    [["user", "> Implement rate limit on /api/auth/login"]],
    [],
    [
      ["ok", "● "],
      ["user", "Plan"],
    ],
    [
      ["dim", "  ├ "],
      ["ok", "✓ "],
      ["meta", "Add rate-limit middleware (10/min)"],
    ],
    [
      ["dim", "  ├ "],
      ["ok", "✓ "],
      ["meta", "Wire into auth router"],
    ],
    [
      ["dim", "  └ "],
      ["warn", "● "],
      ["user", "Write tests"],
    ],
    [],
    [
      ["prompt", "⏺ "],
      ["user", "Edit "],
      ["path", "src/middleware/rate-limit.ts"],
    ],
    [["added", "   + import { rateLimit } from 'express-rate-limit';"]],
    [["added", "   + export const loginLimit = rateLimit({ ... });"]],
    [],
    [["meta", "→ pnpm test src/middleware"]],
    [
      ["ok", "   ✓ 12 passed"],
      ["meta", "  213ms"],
    ],
    [],
    [["prompt blink", "▍"]],
  ],
  codexBrief: [
    [["user", "> Add audit_log migration"]],
    [],
    [
      ["prompt", "⏺ "],
      ["user", "Write "],
      ["path", "migrations/0008_audit_log.sql"],
    ],
    [["added", "   + CREATE TABLE audit_log (id, user_id, event, ...)"]],
    [["added", "   + CREATE INDEX idx_audit_user ..."]],
    [],
    [
      ["prompt", "⏺ "],
      ["user", "Bash "],
      ["dim", "pnpm migrate:up"],
    ],
    [["warn", "   ⚠ Permission required"]],
    [],
    [["warn", "  Allow Codex to run pnpm migrate:up?"]],
    [
      ["ok", "  [a] approve"],
      ["meta", "  "],
      ["err", "[d] deny"],
    ],
    [],
    [["prompt blink", "▍"]],
  ],
  antigravBrief: [
    [["user", "> Profile the nightly batch pipeline"]],
    [],
    [
      ["prompt", "⏺ "],
      ["user", "Run "],
      ["dim", "py-spy record -o profile.svg ..."],
    ],
    [["meta", "   Recording 30s of batch_runner.py"]],
    [["ok", "   ✓ Captured 12,481 samples"]],
    [],
    [
      ["ok", "● "],
      ["user", "Hotspots"],
    ],
    [
      ["dim", "  ├ "],
      ["err", "42% "],
      ["meta", "pandas.read_csv (no chunking)"],
    ],
    [
      ["dim", "  ├ "],
      ["warn", "18% "],
      ["meta", "json.loads in row loop"],
    ],
    [
      ["dim", "  └ "],
      ["warn", "11% "],
      ["meta", "redundant astype(float)"],
    ],
    [],
    [["prompt blink", "▍"]],
  ],
  ccIdle: [
    [["dim", "─── Session resumed from 2h ago ───"]],
    [],
    [
      ["user", "> Last turn:"],
      ["dim", ' "Refactor middleware/auth.ts"'],
    ],
    [
      ["ok", "   ✓ "],
      ["meta", "14 files edited · 218 tests pass"],
    ],
    [],
    [["meta", "Waiting for next instruction..."]],
    [["prompt blink", "▍"]],
  ],
};
