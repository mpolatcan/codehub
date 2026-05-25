// CodeHub — Live Activities + System Notifications.
// Faux macOS desktop hero showing the dynamic-island metaphor in context,
// plus a "states" gallery and cross-OS toast variants.

function LiveActivities() {
  return (
    <AppChrome w={1440} h={900} title="codehub · live activities">
      <div className="ch-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        {/* ── HERO: faux macOS desktop with island + notification center ── */}
        <div style={{ position: 'relative', height: '26.25rem', flexShrink: 0, overflow: 'hidden' }}>
          {/* wallpaper */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, oklch(0.35 0.06 30), oklch(0.18 0.04 230) 60%, oklch(0.12 0.03 250) 100%)',
          }} />
          {/* grain */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '3px 3px',
            mixBlendMode: 'overlay',
            opacity: 0.6,
          }} />

          {/* mac menu bar with notch + live activity widget */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1.75rem',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', padding: '0 0.875rem',
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--sans)',
          }}>
            <span style={{ fontWeight: 600, marginRight: '1.125rem' }}>CodeHub</span>
            <span style={{ marginRight: '0.875rem' }}>File</span>
            <span style={{ marginRight: '0.875rem' }}>Session</span>
            <span style={{ marginRight: '0.875rem' }}>Agent</span>
            <span style={{ marginRight: '0.875rem' }}>View</span>
            <span style={{ marginRight: '0.875rem' }}>Help</span>
            <span style={{ flex: 1 }} />
            {/* menu bar Live Activity widget — progress ring + label, click to open */}
            <span title="Claude · turn 04:12 · click to focus" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4375rem',
              padding: '2px 0.625rem', marginRight: '0.875rem', height: '1.375rem',
              borderRadius: '62.4375rem',
              background: 'rgba(255,255,255,0.10)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}>
              <svg width="13" height="13" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none" />
                <circle cx="7" cy="7" r="5.5" stroke="oklch(0.80 0.17 145)" strokeWidth="1.4" fill="none"
                  strokeDasharray={`${0.62 * 2 * Math.PI * 5.5} ${2 * Math.PI * 5.5}`} transform="rotate(-90 7 7)" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: '0.6875rem', color: '#fff' }}>Refactor auth</span>
              <span className="mono" style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.65)' }}>04:12</span>
            </span>
            {/* status menu cluster */}
            <span title="Wi-Fi" style={{ marginRight: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 6.5a9 9 0 0112 0M4 9a6 6 0 018 0M6 11.5a3 3 0 014 0M8 14h0"/></svg>
            </span>
            <span title="Battery" style={{ marginRight: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2">
                <rect x="1" y="3" width="16" height="8" rx="2" />
                <rect x="17.5" y="5.5" width="1.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
                <rect x="2.5" y="4.5" width="11" height="5" rx="1" fill="rgba(255,255,255,0.85)" />
              </svg>
            </span>
            <span className="mono" style={{ marginRight: '0.75rem', fontSize: '0.6875rem' }}>21:36</span>
            <span style={{ fontSize: '0.6875rem' }}>Wed 22 May</span>
          </div>

          {/* the notch + island STACK — multiple concurrent live activities */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5,
            gap: '0.5rem',
          }}>
            {/* primary (under the notch) — the active, focused activity */}
            <Island state="approve" />
            {/* secondary — slightly indented, full color */}
            <div style={{ transform: 'scale(0.94)', transformOrigin: 'top center' }}>
              <Island state="live" />
            </div>
            {/* tertiary — further indented & dimmed */}
            <div style={{ transform: 'scale(0.88)', transformOrigin: 'top center', opacity: 0.85 }}>
              <Island state="done" />
            </div>
          </div>

          {/* macOS Notification Center — slide-out panel on the right edge */}
          <div style={{
            position: 'absolute', top: '2.25rem', right: '1rem', bottom: '3.75rem',
            width: '19rem', overflow: 'hidden',
            background: 'rgba(28,28,32,0.55)',
            backdropFilter: 'blur(40px) saturate(140%)',
            WebkitBackdropFilter: 'blur(40px) saturate(140%)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            borderRadius: '0.875rem',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column',
            padding: '0.5rem',
          }}>
            <div style={{ padding: '0.375rem 0.5rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Activities</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>3 active</span>
            </div>
            <NCCard agent="claude" name="aurora-api" line1="Refactor auth middleware" meta="turn 04:12 · 184k ctx" pct={0.62} live />
            <NCCard agent="codex" name="aurora-api" line1="Needs permission · migrate:up" meta="awaiting · 14s blocked" tone="wait" />
            <NCCard agent="antigravity" name="ml-pipeline" line1="Profiling complete · 3 hotspots" meta="2m ago · done" tone="done" />
            <div style={{ padding: '0.375rem 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Earlier today</span>
              <span style={{ flex: 1 }} />
            </div>
            <NCCard agent="claude" name="dash-web" line1="Failed: ENOENT /tmp/snap-3" meta="34m ago" tone="err" />
            <NCCard agent="claude" name="aurora-api" line1="Ran pnpm test · 218 pass" meta="14m ago" tone="done" />
          </div>

          {/* hint label */}
          <div style={{
            position: 'absolute', bottom: '1.125rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3125rem 0.625rem', borderRadius: '62.4375rem',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem',
          }}>
            <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: '#fff' }} />
            <span>macOS notch · menu bar widget · Notification Center · <span className="mono" style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 0.3125rem', borderRadius: 3 }}>⌘⇧J</span> cycles focus</span>
          </div>
        </div>

        {/* ── STATES GALLERY ─────────────────────────────────────────── */}
        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', marginBottom: '0.875rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>States</h2>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>tap the island to expand; auto-collapses after 4s or on hover-out</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.375rem' }}>
            <IslandRow caption="Idle · 2 agents at work" desc="Tiny pill summary. Click to expand. Always visible.">
              <Island state="idle" />
            </IslandRow>
            <IslandRow caption="Live · turn in progress" desc="Mini progress bar shows turn timer. Click to jump.">
              <Island state="live" />
            </IslandRow>
            <IslandRow caption="Awaiting input" desc="Inline approve/deny. Hot accept with ↵." tone="wait">
              <Island state="approve" />
            </IslandRow>
            <IslandRow caption="Turn finished" desc="Linger 6s. Jump (⌘O), Later, or auto-collapse." tone="done">
              <Island state="done" />
            </IslandRow>
            <IslandRow caption="Failed" desc="Pulses red briefly, then sticks until acknowledged." tone="err">
              <Island state="error" />
            </IslandRow>
            <IslandRow caption="Split · two events in one pill" desc="When 2 agents are active. Leading + trailing. Click either side to focus.">
              <Island state="split" />
            </IslandRow>
            <IslandRow caption="Multi · stacked counter" desc="When &gt;3 events queued, condenses to a counter and offers a stack peek.">
              <Island state="multi" />
            </IslandRow>
            <IslandRow caption="Concurrent stack" desc="Up to 3 pills below the notch. Drag to reorder priority, ⌘⇧J cycles focus." tone="wait">
              <IslandStack />
            </IslandRow>
            <div style={{ gridColumn: '1 / -1' }}>
              <IslandRow caption="Expanded · the rich card" desc="Hover the pill, press ⌘⇧J, or click any compact state. Shows live terminal peek + jump-to-terminal as primary action. Esc to collapse.">
                <Island state="expanded" />
              </IslandRow>
            </div>
          </div>

          {/* ── CROSS-OS NOTIFICATIONS ──────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', marginBottom: '0.875rem', marginTop: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Cross-platform toasts</h2>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>same event, native styling per OS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            <OSToastCard os="macOS">
              <MacToast />
            </OSToastCard>
            <OSToastCard os="Windows 11">
              <WinToast />
            </OSToastCard>
            <OSToastCard os="Linux · GNOME">
              <LinuxToast />
            </OSToastCard>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── ISLAND ────────────────────────────────────────────────────────────────
function Island({ state }) {
  // Pure black blob, fully rounded. Different shapes per state.
  const base = {
    background: '#000',
    color: 'rgba(255,255,255,0.95)',
    fontFamily: 'var(--mono)',
    display: 'flex', alignItems: 'center',
    boxShadow: '0 6px 22px rgba(0,0,0,0.55)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.04)',
  };

  if (state === 'expanded') {
    return (
      <div style={{
        background: '#000',
        color: '#fff',
        width: '28.75rem',
        borderRadius: '1.375rem',
        boxShadow: '0 18px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        fontFamily: 'var(--sans)',
      }}>
        {/* header */}
        <div style={{ padding: '0.75rem 0.875rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ width: '0.4375rem', height: '0.4375rem', borderRadius: '50%', background: 'oklch(0.80 0.17 145)', boxShadow: '0 0 10px oklch(0.80 0.17 145)' }} />
          <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Claude · aurora-api</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)' }}>opus-4.7 · feat/auth-rewrite</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.65)' }}>turn 04:12</span>
          <span style={{
            width: '1.125rem', height: '1.125rem', borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8125rem', cursor: 'pointer', lineHeight: 1,
          }}>×</span>
        </div>

        {/* mini meta */}
        <div style={{ padding: '0 0.875rem 0.625rem', display: 'flex', alignItems: 'center', gap: '0.875rem', fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)' }}>
          {/* ctx bar */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.625rem' }}>ctx</span>
            <span style={{ width: '4.375rem', height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: '62.4375rem', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: '18%', height: '100%', background: 'oklch(0.80 0.17 145)' }} />
            </span>
            <span style={{ color: '#fff' }}>184k<span style={{ color: 'rgba(255,255,255,0.4)' }}>/1M</span></span>
          </span>
          <span>tok <span style={{ color: '#fff' }}>184.2k</span></span>
          <span>$ <span style={{ color: '#fff' }}>2.31</span></span>
          <span>edits <span style={{ color: '#fff' }}>14</span></span>
        </div>

        {/* terminal peek */}
        <div style={{
          margin: '0 0.75rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.5rem',
          padding: '0.625rem 0.75rem',
          fontFamily: 'var(--mono)',
          fontSize: '0.75rem', lineHeight: 1.55,
          color: 'rgba(255,255,255,0.85)',
        }}>
          <div style={{ color: 'oklch(0.80 0.17 145)' }}>⏺ Bash <span style={{ color: 'rgba(255,255,255,0.55)' }}>pnpm test src/auth</span></div>
          <div style={{ color: 'oklch(0.80 0.17 145)' }}>  ✓ <span style={{ color: '#fff' }}>verifier.spec.ts</span> <span style={{ color: 'rgba(255,255,255,0.45)' }}>(4 tests) 142ms</span></div>
          <div style={{ marginTop: 4, color: 'oklch(0.80 0.17 145)' }}>⏺ Edit <span style={{ color: 'oklch(0.78 0.10 230)' }}>src/middleware/auth.ts</span></div>
          <div style={{ color: 'oklch(0.80 0.17 145)' }}>  + <span style={{ color: 'rgba(255,255,255,0.85)' }}>import {'{'} verifyToken {'}'} from '../auth/verifier';</span></div>
          <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.55)' }}>→ Running pnpm test in aurora-cc-3a8f</div>
          <div><span style={{ color: 'oklch(0.78 0.06 240)' }}>  Tests: </span><span style={{ color: 'oklch(0.80 0.17 145)' }}>218 passed</span><span style={{ color: 'rgba(255,255,255,0.65)' }}>, 0 failed · 4.21s</span></div>
        </div>

        {/* actions */}
        <div style={{
          padding: '0.75rem 0.875rem 0.875rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <button style={{
            ...pillBtn('white'),
            padding: '0.5625rem 0.875rem',
            fontSize: '0.75rem',
            flex: 1,
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13L13 3M13 3H6M13 3v7"/></svg>
              Jump to terminal
            </span>
            <span style={{ padding: '1px 0.3125rem', background: 'rgba(0,0,0,0.18)', borderRadius: 4, fontSize: '0.625rem', color: 'rgba(0,0,0,0.7)' }}>⌘O</span>
          </button>
          <button style={{ ...pillBtn('ghost'), padding: '0.5625rem 0.75rem', fontSize: '0.75rem' }}>View diff</button>
          <button style={{ ...pillBtn('ghost'), padding: '0.5625rem 0.75rem', fontSize: '0.75rem' }}>Dismiss<span style={{ marginLeft: '0.375rem', padding: '1px 0.3125rem', background: 'rgba(255,255,255,0.08)', borderRadius: 4, fontSize: '0.625rem', opacity: 0.7 }}>esc</span></button>
        </div>
      </div>
    );
  }

  if (state === 'split') {
    return (
      <div style={{ ...base, height: '2.375rem', padding: 0, borderRadius: '1.1875rem', fontSize: '0.75rem', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.875rem', flex: 1 }}>
          <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
          <span style={{ color: '#fff' }}>refactor auth</span>
          <span className="tnum" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.6875rem' }}>04:12</span>
        </div>
        <span style={{ width: 1, background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.875rem', flex: 1 }}>
          <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'oklch(0.83 0.14 80)', boxShadow: '0 0 8px oklch(0.83 0.14 80)' }} />
          <AgentGlyph agent="codex" size={13} color="oklch(0.78 0.10 265)" />
          <span style={{ color: '#fff' }}>needs input</span>
        </div>
      </div>
    );
  }

  if (state === 'idle') {
    return (
      <div style={{ ...base, height: '1.75rem', padding: '0 0.875rem', borderRadius: '62.4375rem', gap: '0.5625rem', fontSize: '0.75rem' }}>
        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'oklch(0.80 0.17 145)', boxShadow: '0 0 8px oklch(0.80 0.17 145)' }} />
        <span>2 agents</span>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>·</span>
        <span className="tnum">04:12</span>
      </div>
    );
  }

  if (state === 'live') {
    return (
      <div style={{ ...base, height: '2.375rem', padding: '0 0.875rem', borderRadius: '1.1875rem', gap: '0.625rem', fontSize: '0.75rem', position: 'relative' }}>
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, gap: 2 }}>
          <span style={{ fontSize: '0.75rem' }}>Claude · refactor auth</span>
          <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.55)' }}>turn 04:12 · 218/218 tests passing</span>
        </span>
        <span style={{ flex: 1, minWidth: '1.875rem' }} />
        {/* progress bar at bottom */}
        <span style={{ position: 'absolute', left: '0.875rem', right: '0.875rem', bottom: 4, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: '62.4375rem' }}>
          <span style={{ display: 'block', width: '62%', height: '100%', background: 'oklch(0.80 0.17 145)', borderRadius: '62.4375rem' }} />
        </span>
      </div>
    );
  }

  if (state === 'approve') {
    return (
      <div style={{ ...base, height: '3.375rem', padding: '0 0.375rem 0 1rem', borderRadius: '1.6875rem', gap: '0.75rem', fontSize: '0.75rem', color: '#fff' }}>
        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'oklch(0.83 0.14 80)', boxShadow: '0 0 10px oklch(0.83 0.14 80)', flexShrink: 0 }} />
        <AgentGlyph agent="codex" size={13} color="oklch(0.78 0.10 265)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Codex needs permission</span>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)' }}>aurora-api · <span style={{ color: 'rgba(255,255,255,0.85)' }}>pnpm migrate:up</span></span>
        </span>
        <span style={{ flex: 1, minWidth: '0.375rem' }} />
        <button style={pillBtn('ghost')}>Deny</button>
        <button style={pillBtn('ok')}>Approve <span style={{ marginLeft: 4, padding: '1px 0.3125rem', background: 'rgba(0,0,0,0.25)', borderRadius: 4, fontSize: '0.625rem' }}>↵</span></button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div style={{ ...base, height: '3.125rem', padding: '0 0.375rem 0 1rem', borderRadius: '1.5625rem', gap: '0.75rem', fontSize: '0.75rem' }}>
        <span style={{ width: '0.4375rem', height: '0.4375rem', borderRadius: '50%', background: 'oklch(0.78 0.08 200)', flexShrink: 0 }} />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Claude finished refactor</span>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)' }}>aurora-api · 14 edits · 4:21 elapsed</span>
        </span>
        <span style={{ flex: 1, minWidth: '0.375rem' }} />
        <button style={pillBtn('ghost')}>Later</button>
        <button style={pillBtn('white')}>Review</button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ ...base, height: '3.125rem', padding: '0 0.375rem 0 1rem', borderRadius: '1.5625rem', gap: '0.75rem', fontSize: '0.75rem',
        background: 'linear-gradient(to right, #2a0a0a, #000 60%)',
        boxShadow: '0 6px 22px rgba(120,30,30,0.45), 0 0 0 1px rgba(255,80,80,0.15)' }}>
        <span style={{ width: '0.4375rem', height: '0.4375rem', borderRadius: '50%', background: 'oklch(0.72 0.18 25)', boxShadow: '0 0 8px oklch(0.72 0.18 25)', flexShrink: 0 }} />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'oklch(0.85 0.12 25)' }}>Claude failed</span>
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)' }}>dash-web · ENOENT on /tmp/snap-3</span>
        </span>
        <span style={{ flex: 1, minWidth: '0.375rem' }} />
        <button style={pillBtn('ghost')}>Mute</button>
        <button style={pillBtn('white')}>Open</button>
      </div>
    );
  }

  if (state === 'multi') {
    return (
      <div style={{ ...base, height: '2rem', padding: '0 0.5rem 0 0.75rem', borderRadius: '62.4375rem', gap: '0.5rem', fontSize: '0.75rem' }}>
        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'oklch(0.80 0.17 145)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>2</span>
        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'oklch(0.83 0.14 80)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>1</span>
        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'oklch(0.78 0.08 200)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>3</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '1.125rem', height: '1.125rem', borderRadius: '0.5625rem',
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          fontSize: '0.625rem', fontWeight: 600,
          padding: '0 0.3125rem', marginLeft: 2,
        }}>+5</span>
      </div>
    );
  }

  return null;
}

function pillBtn(kind) {
  const base = {
    border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)',
    fontSize: '0.75rem', fontWeight: 500,
    padding: '0.5rem 0.75rem',
    borderRadius: '62.4375rem',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, whiteSpace: 'nowrap',
  };
  if (kind === 'ok') return { ...base, background: 'oklch(0.80 0.17 145)', color: '#0a0a0a', fontWeight: 600 };
  if (kind === 'white') return { ...base, background: '#fff', color: '#000', fontWeight: 600 };
  return { ...base, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)' };
}

// ── ISLAND STACK (cascading pills for concurrent activities) ─────────────
function IslandStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
      <Island state="approve" />
      <div style={{ transform: 'scale(0.94)', transformOrigin: 'top center' }}>
        <Island state="live" />
      </div>
      <div style={{ transform: 'scale(0.88)', transformOrigin: 'top center', opacity: 0.85 }}>
        <Island state="done" />
      </div>
    </div>
  );
}

// ── STATE ROW (gallery card) ─────────────────────────────────────────────
function IslandRow({ caption, desc, tone, children }) {
  const toneColor = tone === 'wait' ? 'var(--wait)' : tone === 'done' ? 'var(--idle)' : tone === 'err' ? 'var(--err)' : 'var(--live)';
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--bd)',
      borderRadius: '0.625rem',
      padding: '1.125rem',
      display: 'flex', flexDirection: 'column', gap: '0.875rem',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #14171c, #0a0b0d)',
        borderRadius: '0.4375rem', padding: '1.5rem',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '5rem',
        border: '1px solid var(--bd-soft)',
      }}>
        {children}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
          <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: toneColor }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{caption}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>{desc}</div>
      </div>
    </div>
  );
}

// ── OS TOAST WRAPPERS ────────────────────────────────────────────────────
function OSToastCard({ os, children }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--bd)',
      borderRadius: '0.625rem', padding: '1.125rem',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.05 230), oklch(0.18 0.04 250))',
        borderRadius: '0.4375rem', padding: '1.5rem 1.125rem',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '8.125rem',
        border: '1px solid var(--bd-soft)',
        position: 'relative', overflow: 'hidden',
      }}>
        {children}
      </div>
      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="lbl" style={{ fontSize: '0.6875rem' }}>{os}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>native APIs</span>
      </div>
    </div>
  );
}

// macOS notification banner
function MacToast() {
  return (
    <div style={{
      background: 'rgba(28,28,32,0.92)',
      backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      borderRadius: '0.875rem', padding: '0.75rem 0.875rem',
      width: '20rem',
      color: '#fff', display: 'flex', gap: '0.75rem',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '0.4375rem',
        background: 'var(--bg-0)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Logo size={18} withText={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: 1 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>CodeHub</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>now</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 1 }}>Codex needs permission</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
          aurora-api · run <span style={{ color: '#fff', fontFamily: 'var(--mono)' }}>pnpm migrate:up</span>?
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
          <button style={{ ...pillBtn('ghost'), padding: '0.3125rem 0.75rem', fontSize: '0.6875rem', background: 'rgba(255,255,255,0.12)' }}>Deny</button>
          <button style={{ ...pillBtn('white'), padding: '0.3125rem 0.75rem', fontSize: '0.6875rem' }}>Approve</button>
        </div>
      </div>
    </div>
  );
}

// Windows 11 toast
function WinToast() {
  return (
    <div style={{
      background: 'rgba(28,28,30,0.94)',
      backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
      borderRadius: '0.5rem', padding: '0.875rem',
      width: '20rem',
      color: '#fff',
      boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
      border: '1px solid rgba(255,255,255,0.04)',
      fontFamily: 'var(--sans)',
      position: 'relative',
    }}>
      {/* Win 11 accent stripe top */}
      <span style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: 'oklch(0.78 0.10 265)', borderRadius: '0.5rem 0 0 0.5rem' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{
          width: '1.125rem', height: '1.125rem', borderRadius: 4,
          background: 'var(--bg-0)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Logo size={12} withText={false} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>CodeHub</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>1m ago</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', cursor: 'pointer' }}>×</span>
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 2 }}>Claude finished refactor</div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
        aurora-api · 14 edits, 218 tests pass · 4:21 elapsed
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem' }}>
        <button style={{ ...pillBtn('ghost'), padding: '0.375rem 0.75rem', fontSize: '0.6875rem', background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>Dismiss</button>
        <button style={{ ...pillBtn('white'), padding: '0.375rem 0.75rem', fontSize: '0.6875rem', borderRadius: 4 }}>Review diff</button>
      </div>
    </div>
  );
}

// Linux / GNOME-style top banner
function LinuxToast() {
  return (
    <div style={{
      background: 'rgba(20,22,26,0.96)',
      borderRadius: '0.625rem', padding: '0.625rem 0.875rem',
      width: '22.5rem',
      color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem',
      boxShadow: '0 10px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{
        width: '1.75rem', height: '1.75rem', borderRadius: '50%',
        background: 'oklch(0.72 0.18 25)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '0.875rem',
      }}>!</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 1 }}>Claude failed · dash-web</div>
        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--mono)' }}>
          ENOENT: no such file '/tmp/snap-3'
        </div>
      </div>
      <button style={{ ...pillBtn('ghost'), padding: '0.375rem 0.75rem', fontSize: '0.6875rem', background: 'rgba(255,255,255,0.08)', borderRadius: '0.375rem' }}>Open</button>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', cursor: 'pointer' }}>×</span>
    </div>
  );
}

// macOS Notification Center card (Live Activity style)
function NCCard({ agent, name, line1, meta, pct, tone, live }) {
  const toneColor = tone === 'wait' ? 'oklch(0.83 0.14 80)' : tone === 'err' ? 'oklch(0.72 0.18 25)' : tone === 'done' ? 'rgba(255,255,255,0.45)' : 'oklch(0.80 0.17 145)';
  return (
    <div style={{
      margin: '0 0 0.375rem', padding: '0.625rem 0.75rem',
      borderRadius: '0.625rem',
      background: 'rgba(50,50,55,0.6)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      color: '#fff',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', marginBottom: 3 }}>
        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: toneColor, boxShadow: live ? `0 0 8px ${toneColor}` : 'none' }} />
        <AgentGlyph agent={agent} size={11} color={toneColor} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>CodeHub</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>{meta && meta.split(' · ')[meta.split(' · ').length - 1]}</span>
      </div>
      <div style={{ fontSize: '0.75rem', marginBottom: 2 }}>{line1}</div>
      <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--mono)' }}>{name} · {meta}</div>
      {pct !== undefined && (
        <div style={{ marginTop: '0.5rem', height: 3, background: 'rgba(255,255,255,0.10)', borderRadius: '62.4375rem' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: toneColor, borderRadius: '62.4375rem' }} />
        </div>
      )}
    </div>
  );
}

window.LiveActivities = LiveActivities;
