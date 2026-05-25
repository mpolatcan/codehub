// CodeHub — Session Detail. A focused inspector for one agent's session.
// The entire body is the diff for that agent — no tabbed Files/Logs/Container
// secondary views (Files and Shell are workspace-level toggle panes from the
// main hub bottom bar, not session-scoped tabs; logs live in Workspaces /
// runtime). The chrome reuses HubFrame so workspace tabs, meta strip, and
// status bar match every other hub-derived screen.

function SessionDetail() {
  return (
    <window.HubFrame
      title="codehub · aurora-api · diff inspector"
      tabs={[
        { color: 'var(--pri)',     name: 'aurora-api', repos: '2 repos',    agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web',   repos: 'dash-web',   agentCount: 1 },
      ]}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        extras: <span style={{ color: 'var(--wait)' }}>diff inspector · Claude · aurora-api</span>,
        agents: '2 agents · 04:26', cost: '$2.62',
      }}
      actionBar={false}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span>⌘⇧K stage hunk · ⌘⏎ commit · Esc back to workspace</span>
      </>}
    >
      {/* Inspector context strip — same shape as the group bar slot in the hub:
          it sits directly below the workspace tab row and tells you what
          inspector context you're in. */}
      <div style={{
        padding: '0.5rem 1rem', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap',
        background: 'var(--bg-1)',
      }}>
        <span className="lbl" style={{ fontSize: '0.625rem', color: 'var(--fg-3)', letterSpacing: '0.08em' }}>INSPECT · DIFF</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDot status="live" pulse />
          <AgentGlyph agent="claude" size={13} color="var(--a-claude)" />
          <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>Claude · aurora-api</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>· opus-4.7</span>
          <AccountAvatar id="cm" size={14} ring />
        </div>
        <div className="vr" style={{ height: '1.125rem' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
          {Ico.branch}<span className="mono">feat/auth-rewrite</span>
          <span className="mono" style={{ color: 'var(--wait)' }}>·7</span>
        </div>
        <div className="vr" style={{ height: '1.125rem' }} />
        <ContextGauge used={184200} max={1000000} label="ctx" width={96} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <MetricStat label="turn" value="04:12" />
          <MetricStat label="tok" value="184.2k" />
          <MetricStat label="$" value="2.31" />
          <MetricStat label="edits" value="14" delta="+3" deltaTone="up" />
        </div>
        <div className="vr" style={{ height: '1.125rem' }} />
        <button className="btn sm" title="Back to workspace (Esc)">Back<span className="kbd">Esc</span></button>
        <button className="btn sm danger" title="Stop this agent">Stop</button>
      </div>

      {/* Diff body — full-width single column. No tabs, no secondary panes. */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-0)' }}>
        {/* Diff control bar — file filter + layout toggle. Replaces the old
            tab strip; keeps controls relevant to the diff itself only. */}
        <div style={{
          height: '2.25rem', flexShrink: 0,
          background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
          display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem',
        }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>
            <span style={{ color: 'var(--live)' }}>+113</span> <span style={{ color: 'var(--err)' }}>−28</span>
            <span style={{ color: 'var(--fg-3)' }}> · 3 files</span>
          </span>
          <div className="vr" style={{ height: '1.125rem', margin: '0 0.25rem' }} />
          <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All · 3</button>
          <button className="btn xs ghost">Staged · 0</button>
          <button className="btn xs ghost">Unstaged · 3</button>
          <span style={{ flex: 1 }} />
          <div style={{
            display: 'inline-flex', border: '1px solid var(--bd-soft)', borderRadius: 4,
            background: 'var(--bg-1)',
          }}>
            <button className="btn xs" style={{ background: 'var(--bg-3)', border: 'none', borderRadius: 0 }} title="Unified">Unified</button>
            <button className="btn xs ghost" style={{ border: 'none', borderRadius: 0 }} title="Split">Split</button>
          </div>
          <IconBtn title="Refresh">{Ico.search}</IconBtn>
        </div>

        <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
          <DiffFile path="src/auth/verifier.ts" added={42} removed={0} />
          <DiffBlock lines={[
            ['+ ', 'import { jwtVerify, errors } from \'jose\';'],
            ['+ ', 'import { JWTPayload } from \'../types/jwt\';'],
            ['+ ', ''],
            ['+ ', 'export type VerifyResult ='],
            ['+ ', '  | { ok: true; payload: JWTPayload }'],
            ['+ ', '  | { ok: false; reason: \'expired\' | \'malformed\' | \'wrong-iss\' };'],
            ['+ ', ''],
            ['+ ', 'export async function verifyToken('],
            ['+ ', '  token: string,'],
            ['+ ', '  secret: Uint8Array,'],
            ['+ ', '): Promise<VerifyResult> {'],
            ['+ ', '  try {'],
            ['+ ', '    const { payload } = await jwtVerify(token, secret);'],
            ['+ ', '    return { ok: true, payload };'],
            ['+ ', '  } catch (e) {'],
            ['+ ', '    if (e instanceof errors.JWTExpired) return { ok: false, reason: \'expired\' };'],
            ['+ ', '    return { ok: false, reason: \'malformed\' };'],
            ['+ ', '  }'],
            ['+ ', '}'],
          ]} />

          <DiffFile path="src/middleware/auth.ts" added={3} removed={28} />
          <DiffBlock lines={[
            [' ', 'import type { Middleware } from \'koa\';'],
            ['- ', 'import { jwtVerify } from \'jose\';'],
            ['+ ', 'import { verifyToken } from \'../auth/verifier\';'],
            [' ', ''],
            [' ', 'export const requireAuth: Middleware = async (ctx, next) => {'],
            ['- ', '  try {'],
            ['- ', '    const token = ctx.headers.authorization?.replace(/^Bearer /, \'\');'],
            ['- ', '    if (!token) ctx.throw(401);'],
            ['- ', '    const { payload } = await jwtVerify(token, SECRET);'],
            ['- ', '    ctx.state.user = payload;'],
            ['- ', '  } catch { ctx.throw(401); }'],
            ['+ ', '  const token = ctx.headers.authorization?.replace(/^Bearer /, \'\');'],
            ['+ ', '  const r = token && await verifyToken(token, SECRET);'],
            ['+ ', '  if (!r || !r.ok) ctx.throw(401, r?.reason ?? \'no-token\');'],
            ['+ ', '  ctx.state.user = r.payload;'],
            [' ', '  await next();'],
            [' ', '};'],
          ]} />

          <DiffFile path="src/auth/verifier.spec.ts" added={68} removed={0} collapsed />
        </div>

        {/* Commit footer — only diff-relevant actions live here. */}
        <div style={{
          padding: '0.625rem 1rem', borderTop: '1px solid var(--bd-soft)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: 'var(--bg-1)',
        }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>
            unstaged · <span style={{ color: 'var(--live)' }}>+113</span> <span style={{ color: 'var(--err)' }}>−28</span>
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn sm">Stage all<span className="kbd">⌘A</span></button>
          <button className="btn sm">Commit…<span className="kbd">⌘⏎</span></button>
          <button className="btn sm pri">Open PR<span className="kbd">⌘⇧P</span></button>
        </div>
      </div>
    </window.HubFrame>
  );
}

// File header row in the diff stream — shows path + hunk size + a tiny
// 5-cell sparkline of additions vs removals so multi-file diffs scan at a glance.
function DiffFile({ path, added, removed, collapsed }) {
  return (
    <div style={{
      padding: '0.625rem 1rem',
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--bd-soft)',
      borderTop: '1px solid var(--bd-soft)',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      fontFamily: 'var(--mono)', fontSize: '0.75rem',
      cursor: 'pointer',
    }}>
      <span style={{ display: 'inline-flex', transform: collapsed ? 'rotate(-90deg)' : 'none', color: 'var(--fg-2)' }}>{Ico.chevD}</span>
      <span style={{ color: 'var(--fg-0)' }}>{path}</span>
      <span style={{ flex: 1 }} />
      {added > 0 && <span style={{ color: 'var(--live)' }}>+{added}</span>}
      {removed > 0 && <span style={{ color: 'var(--err)' }}>−{removed}</span>}
      <span style={{ color: 'var(--fg-3)' }}>·</span>
      <span style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{
            width: '0.3125rem', height: '0.5rem',
            background: i < Math.min(5, Math.ceil(added / 10))
              ? 'var(--live)'
              : i < Math.min(5, Math.ceil((added + removed) / 10))
                ? 'var(--err)'
                : 'var(--bg-3)',
          }} />
        ))}
      </span>
    </div>
  );
}

function DiffBlock({ lines }) {
  return (
    <div style={{
      background: 'var(--bg-0)',
      fontFamily: 'var(--mono)', fontSize: '0.75rem',
      padding: '0.375rem 0',
    }}>
      {lines.map(([marker, txt], i) => {
        let bg = 'transparent', fg = 'var(--fg-1)';
        if (marker.startsWith('+')) { bg = 'color-mix(in oklab, var(--live) 9%, transparent)'; fg = 'var(--live)'; }
        else if (marker.startsWith('-')) { bg = 'color-mix(in oklab, var(--err) 9%, transparent)'; fg = 'var(--err)'; }
        else { fg = 'var(--fg-2)'; }
        return (
          <div key={i} style={{ display: 'flex', background: bg, padding: '1px 0', minHeight: '1.125rem' }}>
            <span style={{ width: '2.5rem', color: 'var(--fg-3)', textAlign: 'right', paddingRight: '0.75rem', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ width: '1.125rem', color: fg, flexShrink: 0 }}>{marker}</span>
            <span style={{ color: marker === ' ' ? 'var(--fg-1)' : fg, whiteSpace: 'pre' }}>{txt}</span>
          </div>
        );
      })}
    </div>
  );
}

window.SessionDetail = SessionDetail;
