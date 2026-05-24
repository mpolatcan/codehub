// CodeHub — Session Detail: focused single-agent view with terminal on the
// left and a tab stack (Diff / Files / Logs / Container) on the right.

function SessionDetail() {
  return (
    <AppChrome w={1440} h={900} title="codehub · aurora-api · cc">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* RAIL */}
        <aside style={{
          width: 52, background: 'var(--bg-0)', borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0',
        }}>
          <div style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--bd-soft)', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon active>{Ico.hub}</RailIcon>
          <RailIcon badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* head — breadcrumb + meta */}
          <div style={{
            padding: '12px 22px', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>
              Sessions <span style={{ margin: '0 6px' }}>›</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusDot status="live" pulse />
              <AgentGlyph agent="claude" size={14} color="var(--a-claude)" />
              <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-0)' }}>aurora-api</span>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>· cc · opus-4.7</span>
              <AccountAvatar id="cm" size={16} ring />
            </div>
            <div className="vr" style={{ height: 18 }} />
            <ContextGauge used={184200} max={1000000} label="ctx" width={120} />
            <div className="vr" style={{ height: 18 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              {Ico.branch}<span className="mono">feat/auth-rewrite</span>
              <span className="mono" style={{ color: 'var(--wait)' }}>·7</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <MetricStat label="turn" value="04:12" />
              <MetricStat label="tokens" value="184.2k" />
              <MetricStat label="cost" value="$2.31" delta="this turn" />
              <MetricStat label="budget" value="46%" delta="of $5.00" deltaTone="up" />
            </div>
            <div className="vr" style={{ height: 18 }} />
            <IconBtn title="Split">{Ico.splitV}</IconBtn>
            <IconBtn title="Container">{Ico.container}</IconBtn>
            <button className="btn sm danger">Stop</button>
          </div>

          {/* SPLIT WORKSPACE */}
          <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
            {/* LEFT: terminal column */}
            <div style={{ flex: '1 1 720px', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', minWidth: 0 }}>
              <TerminalPaneClaude active />
            </div>

            {/* RIGHT: tabbed inspector */}
            <div style={{ flex: '0 0 580px', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', minWidth: 0 }}>
              {/* tabs */}
              <div style={{
                height: 38, display: 'flex', alignItems: 'stretch',
                borderBottom: '1px solid var(--bd-soft)',
                paddingLeft: 4,
              }}>
                <InspectTab icon={Ico.diff} label="Diff" count="14" active />
                <InspectTab icon={Ico.files} label="Files" count="9" />
                <InspectTab icon={Ico.cpu} label="Logs" />
                <InspectTab icon={Ico.container} label="Container" />
                <span style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <IconBtn title="Refresh">{Ico.search}</IconBtn>
                </div>
              </div>

              {/* diff content */}
              <div className="scroll" style={{ flex: 1, overflow: 'auto' }}>
                <DiffFile path="src/auth/verifier.ts" added={42} removed={0} />
                <DiffBlock kind="new" lines={[
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

              {/* diff footer */}
              <div style={{
                padding: '10px 14px', borderTop: '1px solid var(--bd-soft)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--bg-1)',
              }}>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>
                  <span style={{ color: 'var(--live)' }}>+113</span> <span style={{ color: 'var(--err)' }}>−28</span> · 3 files
                </span>
                <span style={{ flex: 1 }} />
                <button className="btn sm">Stage all</button>
                <button className="btn sm">Commit…</button>
                <button className="btn sm primary">PR</button>
              </div>
            </div>
          </div>

          {/* status bar */}
          <div style={{
            height: 26, flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 14,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
          }}>
            <span><StatusDot status="live" /> aurora-cc-3a8f · cpu 47% · mem 1.2/4 GiB</span>
            <div style={{ flex: 1 }} />
            <span>⌘D diff</span><span>⌘B files</span><span>⌘L logs</span>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function InspectTab({ icon, label, count, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '0 14px', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      background: active ? 'var(--bg-2)' : 'transparent',
      cursor: 'pointer', position: 'relative',
      fontSize: 12,
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />}
      {icon}{label}
      {count && <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginLeft: 2 }}>{count}</span>}
    </div>
  );
}

function DiffFile({ path, added, removed, collapsed }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--bd-soft)',
      borderTop: '1px solid var(--bd-soft)',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--mono)', fontSize: 11.5,
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
          <span key={i} style={{ width: 5, height: 8, background: i < Math.min(5, Math.ceil(added / 10)) ? 'var(--live)' : i < Math.min(5, Math.ceil((added + removed) / 10)) ? 'var(--err)' : 'var(--bg-3)' }} />
        ))}
      </span>
    </div>
  );
}

function DiffBlock({ kind, lines }) {
  return (
    <div style={{
      background: 'var(--bg-0)',
      fontFamily: 'var(--mono)', fontSize: 11.5,
      padding: '6px 0',
    }}>
      {lines.map(([marker, txt], i) => {
        let bg = 'transparent', fg = 'var(--fg-1)';
        if (marker.startsWith('+')) { bg = 'color-mix(in oklab, var(--live) 9%, transparent)'; fg = 'var(--live)'; }
        else if (marker.startsWith('-')) { bg = 'color-mix(in oklab, var(--err) 9%, transparent)'; fg = 'var(--err)'; }
        else { fg = 'var(--fg-2)'; }
        return (
          <div key={i} style={{ display: 'flex', background: bg, padding: '1px 0', minHeight: 18 }}>
            <span style={{ width: 36, color: 'var(--fg-3)', textAlign: 'right', paddingRight: 10, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ width: 18, color: fg, flexShrink: 0 }}>{marker}</span>
            <span style={{ color: marker === ' ' ? 'var(--fg-1)' : fg, whiteSpace: 'pre' }}>{txt}</span>
          </div>
        );
      })}
    </div>
  );
}

window.SessionDetail = SessionDetail;
