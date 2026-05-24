// Shared terminal line helpers (extracted from main-hub-a)
// Each line is an array of [className, text] segments.

function TermLine({ segs }) {
  return (
    <div>
      {segs.map(([cls, txt], i) => (
        <span key={i} className={cls || undefined}>{txt}</span>
      ))}
      {segs.length === 0 ? '\u00a0' : null}
    </div>
  );
}

function TermBlock({ lines, style }) {
  return (
    <div className="term" style={{ flex: 1, padding: '12px 14px', overflow: 'hidden', ...style }}>
      {lines.map((segs, i) => <TermLine key={i} segs={segs} />)}
    </div>
  );
}

// Pre-built terminal snippets
const SNIPPETS = {
  ccBrief: [
    [['user', '> Implement rate limit on /api/auth/login']],
    [],
    [['ok', '● '], ['user', 'Plan']],
    [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Add rate-limit middleware (10/min)']],
    [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Wire into auth router']],
    [['dim', '  └ '], ['warn', '● '], ['user', 'Write tests']],
    [],
    [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/middleware/rate-limit.ts']],
    [['added', '   + import { rateLimit } from \'express-rate-limit\';']],
    [['added', '   + export const loginLimit = rateLimit({ ... });']],
    [],
    [['meta', '→ pnpm test src/middleware']],
    [['ok', '   ✓ 12 passed'], ['meta', '  213ms']],
    [],
    [['prompt blink', '▍']],
  ],
  codexBrief: [
    [['user', '> Add audit_log migration']],
    [],
    [['prompt', '⏺ '], ['user', 'Write '], ['path', 'migrations/0008_audit_log.sql']],
    [['added', '   + CREATE TABLE audit_log (id, user_id, event, ...)']],
    [['added', '   + CREATE INDEX idx_audit_user ...']],
    [],
    [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm migrate:up']],
    [['warn', '   ⚠ Permission required']],
    [],
    [['warn', '  Allow Codex to run pnpm migrate:up?']],
    [['ok', '  [a] approve'], ['meta', '  '], ['err', '[d] deny']],
    [],
    [['prompt blink', '▍']],
  ],
  antigravBrief: [
    [['user', '> Profile the nightly batch pipeline']],
    [],
    [['prompt', '⏺ '], ['user', 'Run '], ['dim', 'py-spy record -o profile.svg ...']],
    [['meta', '   Recording 30s of batch_runner.py']],
    [['ok', '   ✓ Captured 12,481 samples']],
    [],
    [['ok', '● '], ['user', 'Hotspots']],
    [['dim', '  ├ '], ['err', '42% '], ['meta', 'pandas.read_csv (no chunking)']],
    [['dim', '  ├ '], ['warn', '18% '], ['meta', 'json.loads in row loop']],
    [['dim', '  └ '], ['warn', '11% '], ['meta', 'redundant astype(float)']],
    [],
    [['prompt blink', '▍']],
  ],
  ccIdle: [
    [['dim', '─── Session resumed from 2h ago ───']],
    [],
    [['user', '> Last turn:'], ['dim', ' "Refactor middleware/auth.ts"']],
    [['ok', '   ✓ '], ['meta', '14 files edited · 218 tests pass']],
    [],
    [['meta', 'Waiting for next instruction...']],
    [['prompt blink', '▍']],
  ],
};

window.TermLine = TermLine;
window.TermBlock = TermBlock;
window.SNIPPETS = SNIPPETS;
