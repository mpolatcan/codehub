// CodeHub — Broadcast. Send one prompt to N agents at once and compare.
// Useful when you want a second opinion or to pit models against each other
// on the same task. Pick the best result and promote it to a real session.

function Broadcast() {
  return (
    <AppChrome w={1440} h={900} title="codehub · broadcast">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
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
          {/* header */}
          <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}>Broadcast</h1>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>one prompt → many agents · pick the best, promote to a session</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm ghost">{Ico.search}Templates</button>
              <button className="btn sm">{Ico.plus}Add agent column</button>
            </div>

            {/* the shared prompt */}
            <div style={{
              background: 'var(--bg-0)',
              border: '1px solid var(--bd)',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span className="mono" style={{ color: 'var(--live)', fontSize: 13, paddingTop: 2 }}>▸</span>
              <div style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)', lineHeight: 1.5 }}>
                Look at <span style={{ color: 'var(--idle)' }}>src/middleware/auth.ts</span> and propose a refactor that extracts JWT verification into its own module. Be brief — outline the modules, one paragraph of rationale, no code yet.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', textAlign: 'right' }}>broadcast · 3 agents</span>
                <span style={{ flex: 1 }} />
                <button className="btn ok solid sm">Re-broadcast<span className="kbd">⌘⏎</span></button>
              </div>
            </div>
          </div>

          {/* 3 agent columns */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
            <BroadcastColumn agent="claude" account="cm" model="opus-4.7"
              status="live" elapsed="12s" tokens="3.4k" cost="$0.07"
              winner
              answer={CL_ANSWER} />

            <BroadcastColumn agent="codex" account="cx" model="o4-mini"
              status="live" elapsed="4s" tokens="2.1k" cost="$0.02"
              answer={CX_ANSWER} />

            <BroadcastColumn agent="antigravity" account="ag" model="gemini-2.5-pro"
              status="done" elapsed="9s" tokens="2.8k" cost="$0.00"
              answer={AG_ANSWER} />
          </div>

          {/* status */}
          <div style={{
            height: 30, flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
          }}>
            <span><StatusDot status="live" /> 2 streaming · 1 done</span>
            <span>total <span style={{ color: 'var(--fg-1)' }}>8.3k tokens</span> · <span style={{ color: 'var(--fg-1)' }}>$0.09</span></span>
            <span>elapsed <span style={{ color: 'var(--fg-1)' }}>0:12</span></span>
            <div style={{ flex: 1 }} />
            <span>⌘1–3 focus column</span>
            <span>⏎ promote winner</span>
            <span>⌘N new column</span>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

const CL_ANSWER = [
  [['user', 'New modules:']],
  [],
  [['ok', '  src/auth/verifier.ts'], ['meta', '   verify token, return tagged result']],
  [['ok', '  src/auth/errors.ts'],    ['meta', '     map JOSE errors to domain reasons']],
  [['ok', '  src/auth/secret.ts'],    ['meta', '     centralize secret loading & rotation']],
  [['ok', '  src/middleware/auth.ts'], ['meta', '  becomes thin koa middleware']],
  [],
  [['user', 'Rationale.']],
  [['dim', '  The middleware today mixes parsing, verification, and HTTP']],
  [['dim', '  error mapping. Splitting verifyToken into a pure function lets']],
  [['dim', '  us unit-test the cases (expired / malformed / wrong-iss) in']],
  [['dim', '  isolation, swap libraries later, and reuse the verifier inside']],
  [['dim', '  background jobs that read the same JWTs. Error mapping moves to']],
  [['dim', '  its own table-driven file so adding "revoked" later is a 2-line']],
  [['dim', '  change. Secret loading deserves its own module because it']],
  [['dim', '  changes per environment and we want one cache.']],
  [],
  [['prompt blink', '▍']],
];

const CX_ANSWER = [
  [['user', 'Proposed split:']],
  [],
  [['ok', '  • auth/verify.ts'], ['meta', ' — verifyToken(string) → Result']],
  [['ok', '  • auth/middleware.ts'], ['meta', ' — koa wrapper, sets ctx.user']],
  [['ok', '  • auth/secret.ts'], ['meta', ' — getJwk()']],
  [],
  [['user', 'Why.']],
  [['dim', '  Verification is library code; middleware is framework code.']],
  [['dim', '  Keeping them apart means we can swap koa for fastify later']],
  [['dim', '  without rewriting the JWT logic. A discriminated Result type']],
  [['dim', '  is easier to test than try/catch sprinkled in middleware.']],
  [],
  [['prompt blink', '▍']],
];

const AG_ANSWER = [
  [['user', 'Modules to introduce:']],
  [],
  [['ok', '  1. JwtVerifier'],      ['meta', '   class, holds jwks fetcher, caches']],
  [['ok', '  2. authMiddleware'],   ['meta', '   thin koa adapter']],
  [['ok', '  3. AuthError'],        ['meta', '       typed error → http status mapping']],
  [],
  [['user', 'Rationale.']],
  [['dim', '  A class-based verifier lets us cache JWKS keys per-issuer and']],
  [['dim', '  rotate them on a TTL without leaking lifecycle into the middleware.']],
  [['dim', '  Typed errors carry an HTTP status, so the middleware just maps them.']],
  [['dim', '  Lifts ~80 LOC of one-time setup out of the request hot path and']],
  [['dim', '  doubles the boot-time validation surface (we can sanity-check JWKS']],
  [['dim', '  on app start, not on first request).']],
  [],
  [['ok', '● '], ['user', 'done · 9.2s · 2.8k tokens']],
];

// ── BROADCAST COLUMN ──────────────────────────────────────────────────────
function BroadcastColumn({ agent, account, model, status, elapsed, tokens, cost, winner, answer }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-0)', minWidth: 0, position: 'relative',
      outline: winner ? `1.5px solid color-mix(in oklab, var(--live) 70%, transparent)` : 'none',
      outlineOffset: -1.5, zIndex: winner ? 1 : 0,
    }}>
      {/* head */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px 4px' }}>
          <StatusDot status={status} pulse />
          <AgentGlyph agent={agent} size={14} color={meta.accent} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-0)' }}>{meta.name}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{model}</span>
          {winner && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontFamily: 'var(--mono)',
              padding: '2px 6px', borderRadius: 4,
              background: 'color-mix(in oklab, var(--live) 22%, transparent)',
              color: 'var(--live)',
              border: '1px solid color-mix(in oklab, var(--live) 35%, transparent)',
              fontWeight: 600, letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>★ pick</span>
          )}
          <span style={{ flex: 1 }} />
          <IconBtn title="Mute column" style={{ width: 20, height: 20 }}>{Ico.bell}</IconBtn>
          <IconBtn title="Change model" style={{ width: 20, height: 20 }}>{Ico.more}</IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 8px' }}>
          <AccountAvatar id={account} size={13} />
          <span style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{ACCOUNTS[account].tier}</span>
          <span style={{ flex: 1 }} />
          <MetricStat label="t" value={elapsed} />
          <MetricStat label="tok" value={tokens} />
          <MetricStat label="$" value={cost} />
        </div>
      </div>

      {/* answer */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <TermBlock lines={answer} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, transparent, var(--bg-0))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* actions */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid var(--bd-soft)',
        background: 'var(--bg-1)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <button className="btn ok solid sm" style={{ flex: 1 }}>
          {winner ? 'Promote to session' : 'Use this'}<span className="kbd">⏎</span>
        </button>
        <button className="btn sm">Regenerate</button>
        <IconBtn title="Send to running session">{Ico.arrowR}</IconBtn>
      </div>
    </div>
  );
}

window.Broadcast = Broadcast;
