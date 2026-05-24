// CodeHub — Main Hub B: 2×2 tiled grid for comparing multiple agents at once.
// Sidebar collapsed to icon rail. No activity rail. Each tile owns its chrome.

function MainHubB() {
  return (
    <AppChrome w={1440} h={900} title="codehub · grid">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* COLLAPSED ICON SIDEBAR */}
        <aside style={{
          width: 52, flexShrink: 0,
          background: 'var(--bg-0)',
          borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '12px 0 10px',
        }}>
          <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--bd-soft)', marginBottom: 12, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon active>{Ico.hub}</RailIcon>
          <RailIcon badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <RailIcon>{Ico.search}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.bell}</RailIcon>
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)' }}>
          {/* topbar */}
          <div style={{
            height: 48, display: 'flex', alignItems: 'center', gap: 14,
            padding: '0 16px', borderBottom: '1px solid var(--bd-soft)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="lbl" style={{ color: 'var(--fg-1)', fontSize: 11.5, letterSpacing: '0.04em', textTransform: 'none' }}>Comparing</span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--fg-0)' }}>4 sessions</span>
            </div>
            <div className="vr" style={{ height: 16 }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn xs" style={{ background: 'var(--bg-3)' }}>2×2</button>
              <button className="btn xs ghost">1×4</button>
              <button className="btn xs ghost">3 + 1</button>
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn ghost sm">{Ico.search}<span>Search</span><span className="kbd">⌘K</span></button>
            <button className="btn sm">{Ico.plus}New agent</button>
            <IconBtn title="Activity"><span style={{ position: 'relative', display: 'inline-flex' }}>{Ico.bell}<span style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: 'var(--wait)' }} /></span></IconBtn>
          </div>

          {/* 2x2 GRID */}
          <div style={{
            flex: 1, display: 'grid',
            gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
            gap: 1, background: 'var(--bd-soft)', minHeight: 0,
          }}>
            <TerminalTile agent="claude" name="aurora-api" branch="feat/auth-rewrite" status="live" task="Refactoring auth middleware" turn="04:12" cpu={47} tokens="184.2k" cost="$2.31" account="cm" ctxUsed={184200} ctxMax={1000000} focus />
            <TerminalTile agent="codex" name="aurora-api" branch="feat/audit-log" status="wait" task="Migration awaiting approval" turn="00:14" cpu={3} tokens="22.6k" cost="$0.31" account="cx" ctxUsed={22600} ctxMax={200000} />
            <TerminalTile agent="claude" name="dash-web" branch="main" status="live" task="Fix lint errors across components/" turn="02:48" cpu={31} tokens="64.0k" cost="$0.81" account="cw" ctxUsed={64000} ctxMax={1000000} peek="lint" />
            <TerminalTile agent="antigravity" name="ml-pipeline" branch="perf/batching" status="idle" task="Profiling complete · 3 hotspots" turn="—" cpu={2} tokens="92.4k" cost="$1.10" account="ag" ctxUsed={92400} ctxMax={1000000} />
          </div>

          {/* status bar */}
          <div style={{
            height: 26, flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 18,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
          }}>
            <span><StatusDot status="live" /> 3 running · <StatusDot status="wait" /> 1 awaiting</span>
            <span>total cpu 83%</span>
            <span>mem 4.8/16 GiB</span>
            <span>tokens 270.8k / $4.42</span>
            <div style={{ flex: 1 }} />
            <span>⌘1–4 focus tile</span>
            <span>⌘\ split</span>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function RailIcon({ children, active, badge }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 7, marginBottom: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--bg-3)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer', position: 'relative',
    }}>
      {children}
      {badge && (
        <span style={{
          position: 'absolute', top: -2, right: -2,
          fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600,
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          borderRadius: 7, padding: '1px 4px', minWidth: 14, textAlign: 'center',
          border: '1.5px solid var(--bg-0)',
        }}>{badge}</span>
      )}
    </div>
  );
}

// Terminal tile — full agent peek with running terminal content
function TerminalTile({ agent, name, branch, status, task, turn, cpu, tokens, focus, peek, account, ctxUsed, ctxMax, cost }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      background: 'var(--bg-0)', display: 'flex', flexDirection: 'column',
      minWidth: 0, minHeight: 0, position: 'relative',
      outline: focus ? '1px solid var(--fg-1)' : 'none',
      outlineOffset: focus ? -1 : 0, zIndex: focus ? 1 : 0,
    }}>
      {/* head */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px 4px' }}>
          <StatusDot status={status} pulse />
          <AgentGlyph agent={agent} size={13} color={meta.accent} />
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>· {meta.short}</span>
          {account && <AccountAvatar id={account} size={13} />}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
            {Ico.branch}<span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{branch}</span>
          </span>
          <span style={{ flex: 1 }} />
          <IconBtn title="Maximize" style={{ width: 20, height: 20 }}>{Ico.expand}</IconBtn>
          <IconBtn title="More" style={{ width: 20, height: 20 }}>{Ico.more}</IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 7px' }}>
          {ctxUsed !== undefined && <ContextGauge used={ctxUsed} max={ctxMax} label="ctx" width={70} />}
          <span style={{ flex: 1 }} />
          <MetricStat label="turn" value={turn} />
          <MetricStat label="tok" value={tokens} />
          {cost && <MetricStat label="$" value={cost} />}
          <MetricStat label="cpu" value={`${cpu}%`} />
        </div>
      </div>

      {/* terminal peek */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <TerminalPeek agent={agent} status={status} variant={peek} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, transparent, var(--bg-0))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* footer task */}
      <div style={{
        height: 28, flexShrink: 0,
        background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12,
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-2)',
      }}>
        <span style={{ color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</span>
      </div>
    </div>
  );
}

function TerminalPeek({ agent, status, variant }) {
  if (agent === 'claude' && variant === 'lint') {
    return (
      <TermBlock lines={[
        [['user', '> Fix lint errors across components/']],
        [],
        [['ok', '● '], ['user', 'Plan'], ['dim', '  12 files · 47 errors total']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Nav.tsx (8 errors)']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Sidebar.tsx (6 errors)']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Search.tsx (4 errors)']],
        [['dim', '  └ '], ['warn', '● '], ['user', 'components/Modal.tsx (4 errors)']],
        [],
        [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'components/Modal.tsx']],
        [['removed', '   - import { useState, useEffect, FC } from "react"']],
        [['added', '   + import { useState, useEffect } from "react"']],
        [['removed', '   - const Modal: FC<Props> = ({ open, ... }) => {']],
        [['added', '   + export function Modal({ open, ... }: Props) {']],
        [],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm lint --fix components/Modal.tsx']],
        [['ok', '   ✓ '], ['meta', '0 errors, 0 warnings']],
        [['prompt blink', '▍']],
      ]} />
    );
  }
  if (agent === 'claude') {
    return (
      <TermBlock lines={[
        [['user', '> Refactor auth middleware to extract JWT verify']],
        [],
        [['ok', '● '], ['user', 'Plan'], ['dim', '  4 steps']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Read auth.ts (218 lines)']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Extract verifyToken → verifier.ts']],
        [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Update middleware imports']],
        [['dim', '  └ '], ['warn', '● '], ['user', 'Write 4 tests for verifier']],
        [],
        [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/auth/verifier.ts']],
        [['added', '   + import { jwtVerify } from \'jose\';']],
        [['added', '   + export async function verifyToken(...)']],
        [],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm test src/auth']],
        [['ok', '   ✓ '], ['user', 'verifier.spec.ts'], ['meta', ' (4 tests)']],
        [['prompt blink', '▍']],
      ]} />
    );
  }
  if (agent === 'codex') {
    return (
      <TermBlock lines={[
        [['user', '> Write a migration to add audit_log table.']],
        [],
        [['prompt', '⏺ '], ['user', 'Write '], ['path', '0008_audit_log.sql']],
        [['added', '   + CREATE TABLE audit_log (']],
        [['added', '   +   id BIGSERIAL PRIMARY KEY,']],
        [['added', '   +   user_id BIGINT REFERENCES users(id),']],
        [['added', '   +   event TEXT NOT NULL,']],
        [['added', '   +   payload JSONB,']],
        [['added', '   + );']],
        [],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm migrate:up']],
        [['warn', '   ⚠ Permission required — awaiting approval']],
        [],
        [['meta', '─────────────────────────────']],
        [['warn', '  Allow pnpm migrate:up?']],
        [['meta', '  '], ['ok', '[a] approve'], ['meta', '  '], ['err', '[d] deny']],
      ]} />
    );
  }
  if (agent === 'antigravity') {
    return (
      <TermBlock lines={[
        [['user', '> Profile slow batches in pipeline/run.py']],
        [],
        [['prompt', '⏺ '], ['user', 'Read '], ['path', 'pipeline/run.py']],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'py-spy record -o flame.svg']],
        [['ok', '   ✓ '], ['meta', '92 samples · 14.2s capture']],
        [],
        [['user', 'Hotspots found:']],
        [['warn', '  ⚡ '], ['user', 'pipeline.transform.normalize()'], ['meta', '  41% self']],
        [['warn', '  ⚡ '], ['user', 'pipeline.io.read_parquet()'], ['meta', '   22% self']],
        [['warn', '  ⚡ '], ['user', 'pipeline.transform.bucket()'], ['meta', '    14% self']],
        [],
        [['ok', '● '], ['user', 'Done · 3 optimization candidates']],
        [['dim', '  Suggested: vectorize normalize() with numpy.']],
        [['prompt blink', '▍']],
      ]} />
    );
  }
  return <TermBlock lines={[[['dim', '(no output)']]]} />;
}

// Dash-web variant of Claude — slightly different content
function TerminalTileDashWeb() {
  return (
    <TermBlock lines={[
      [['user', '> Fix lint errors across components/']],
      [],
      [['ok', '● '], ['user', 'Plan'], ['dim', '  12 files, 47 errors']],
      [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Nav.tsx (8 errors)']],
      [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Sidebar.tsx (6 errors)']],
      [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'components/Search.tsx (4 errors)']],
      [['dim', '  └ '], ['warn', '● '], ['user', 'components/Modal.tsx']],
      [],
      [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'components/Modal.tsx']],
      [['removed', '   - import { useState, useEffect, FC } from "react"']],
      [['added', '   + import { useState, useEffect } from "react"']],
      [['prompt blink', '▍']],
    ]} />
  );
}

window.MainHubB = MainHubB;
window.RailIcon = RailIcon;
window.TerminalTile = TerminalTile;
window.TerminalPeek = TerminalPeek;
