// CodeHub — Live Activities + System Notifications.
// Faux macOS desktop hero showing the dynamic-island metaphor in context,
// plus a "states" gallery and cross-OS toast variants.

function LiveActivities() {
  return (
    <AppChrome w={1440} h={900} title="codehub · live activities">
      <div className="ch-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        {/* ── HERO: faux macOS desktop with island ─────────────────────── */}
        <div style={{ position: 'relative', height: 380, flexShrink: 0, overflow: 'hidden' }}>
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

          {/* mac menu bar with notch */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 28,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', padding: '0 14px',
            fontSize: 12, color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--sans)',
          }}>
            <span style={{ fontWeight: 600, marginRight: 18 }}>CodeHub</span>
            <span style={{ marginRight: 14 }}>File</span>
            <span style={{ marginRight: 14 }}>Session</span>
            <span style={{ marginRight: 14 }}>Agent</span>
            <span style={{ marginRight: 14 }}>View</span>
            <span style={{ marginRight: 14 }}>Help</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ marginRight: 12, fontSize: 11 }}>21:36</span>
            <span style={{ fontSize: 11 }}>Wed 22 May</span>
          </div>

          {/* the notch + island STACK — multiple concurrent live activities */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5,
            gap: 8,
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

          {/* hint label */}
          <div style={{
            position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,0.85)', fontSize: 11.5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
            <span>3 concurrent activities · click any to jump · <span className="mono" style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: 3 }}>⌘⇧J</span> cycles focus</span>
          </div>
        </div>

        {/* ── STATES GALLERY ─────────────────────────────────────────── */}
        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>States</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>tap the island to expand; auto-collapses after 4s or on hover-out</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14, marginTop: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Cross-platform toasts</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>same event, native styling per OS</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
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
        width: 460,
        borderRadius: 22,
        boxShadow: '0 18px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        fontFamily: 'var(--sans)',
      }}>
        {/* header */}
        <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.80 0.17 145)', boxShadow: '0 0 10px oklch(0.80 0.17 145)' }} />
          <AgentGlyph agent="claude" size={14} color="oklch(0.78 0.13 35)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Claude · aurora-api</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>opus-4.7 · feat/auth-rewrite</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(255,255,255,0.65)' }}>turn 04:12</span>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, cursor: 'pointer', lineHeight: 1,
          }}>×</span>
        </div>

        {/* mini meta */}
        <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'rgba(255,255,255,0.7)' }}>
          {/* ctx bar */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9.5 }}>ctx</span>
            <span style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
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
          margin: '0 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '10px 12px',
          fontFamily: 'var(--mono)',
          fontSize: 11.5, lineHeight: 1.55,
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
          padding: '12px 14px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button style={{
            ...pillBtn('white'),
            padding: '9px 14px',
            fontSize: 12,
            flex: 1,
            justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13L13 3M13 3H6M13 3v7"/></svg>
              Jump to terminal
            </span>
            <span style={{ padding: '1px 5px', background: 'rgba(0,0,0,0.18)', borderRadius: 4, fontSize: 10, color: 'rgba(0,0,0,0.7)' }}>⌘O</span>
          </button>
          <button style={{ ...pillBtn('ghost'), padding: '9px 12px', fontSize: 12 }}>View diff</button>
          <button style={{ ...pillBtn('ghost'), padding: '9px 12px', fontSize: 12 }}>Dismiss<span style={{ marginLeft: 6, padding: '1px 5px', background: 'rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10, opacity: 0.7 }}>esc</span></button>
        </div>
      </div>
    );
  }

  if (state === 'split') {
    return (
      <div style={{ ...base, height: 38, padding: 0, borderRadius: 19, fontSize: 11.5, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', flex: 1 }}>
          <AgentGlyph agent="claude" size={12} color="oklch(0.78 0.13 35)" />
          <span style={{ color: '#fff' }}>refactor auth</span>
          <span className="tnum" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10.5 }}>04:12</span>
        </div>
        <span style={{ width: 1, background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', flex: 1 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.83 0.14 80)', boxShadow: '0 0 8px oklch(0.83 0.14 80)' }} />
          <AgentGlyph agent="codex" size={12} color="oklch(0.78 0.10 265)" />
          <span style={{ color: '#fff' }}>needs input</span>
        </div>
      </div>
    );
  }

  if (state === 'idle') {
    return (
      <div style={{ ...base, height: 28, padding: '0 14px', borderRadius: 999, gap: 9, fontSize: 11.5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.80 0.17 145)', boxShadow: '0 0 8px oklch(0.80 0.17 145)' }} />
        <span>2 agents</span>
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>·</span>
        <span className="tnum">04:12</span>
      </div>
    );
  }

  if (state === 'live') {
    return (
      <div style={{ ...base, height: 38, padding: '0 14px', borderRadius: 19, gap: 10, fontSize: 11.5, position: 'relative' }}>
        <AgentGlyph agent="claude" size={12} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, gap: 2 }}>
          <span style={{ fontSize: 11.5 }}>Claude · refactor auth</span>
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)' }}>turn 04:12 · 218/218 tests passing</span>
        </span>
        <span style={{ flex: 1, minWidth: 30 }} />
        {/* progress bar at bottom */}
        <span style={{ position: 'absolute', left: 14, right: 14, bottom: 4, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
          <span style={{ display: 'block', width: '62%', height: '100%', background: 'oklch(0.80 0.17 145)', borderRadius: 999 }} />
        </span>
      </div>
    );
  }

  if (state === 'approve') {
    return (
      <div style={{ ...base, height: 54, padding: '0 6px 0 16px', borderRadius: 27, gap: 12, fontSize: 12, color: '#fff' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.83 0.14 80)', boxShadow: '0 0 10px oklch(0.83 0.14 80)', flexShrink: 0 }} />
        <AgentGlyph agent="codex" size={14} color="oklch(0.78 0.10 265)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Codex needs permission</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>aurora-api · <span style={{ color: 'rgba(255,255,255,0.85)' }}>pnpm migrate:up</span></span>
        </span>
        <span style={{ flex: 1, minWidth: 6 }} />
        <button style={pillBtn('ghost')}>Deny</button>
        <button style={pillBtn('ok')}>Approve <span style={{ marginLeft: 4, padding: '1px 5px', background: 'rgba(0,0,0,0.25)', borderRadius: 4, fontSize: 9.5 }}>↵</span></button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div style={{ ...base, height: 50, padding: '0 6px 0 16px', borderRadius: 25, gap: 12, fontSize: 12 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.78 0.08 200)', flexShrink: 0 }} />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Claude finished refactor</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>aurora-api · 14 edits · 4:21 elapsed</span>
        </span>
        <span style={{ flex: 1, minWidth: 6 }} />
        <button style={pillBtn('ghost')}>Later</button>
        <button style={pillBtn('white')}>Review</button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ ...base, height: 50, padding: '0 6px 0 16px', borderRadius: 25, gap: 12, fontSize: 12,
        background: 'linear-gradient(to right, #2a0a0a, #000 60%)',
        boxShadow: '0 6px 22px rgba(120,30,30,0.45), 0 0 0 1px rgba(255,80,80,0.15)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.72 0.18 25)', boxShadow: '0 0 8px oklch(0.72 0.18 25)', flexShrink: 0 }} />
        <AgentGlyph agent="claude" size={13} color="oklch(0.78 0.13 35)" />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'oklch(0.85 0.12 25)' }}>Claude failed</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)' }}>dash-web · ENOENT on /tmp/snap-3</span>
        </span>
        <span style={{ flex: 1, minWidth: 6 }} />
        <button style={pillBtn('ghost')}>Mute</button>
        <button style={pillBtn('white')}>Open</button>
      </div>
    );
  }

  if (state === 'multi') {
    return (
      <div style={{ ...base, height: 32, padding: '0 8px 0 12px', borderRadius: 999, gap: 8, fontSize: 11.5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.80 0.17 145)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>2</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.83 0.14 80)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>1</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.08 200)' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>3</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 18, height: 18, borderRadius: 9,
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          fontSize: 10, fontWeight: 600,
          padding: '0 5px', marginLeft: 2,
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
    fontSize: 11.5, fontWeight: 500,
    padding: '8px 12px',
    borderRadius: 999,
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
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
      borderRadius: 10,
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #14171c, #0a0b0d)',
        borderRadius: 7, padding: 24,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 80,
        border: '1px solid var(--bd-soft)',
      }}>
        {children}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: toneColor }} />
          <span style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 500 }}>{caption}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{desc}</div>
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
      borderRadius: 10, padding: 18,
    }}>
      <div style={{
        background: 'linear-gradient(135deg, oklch(0.30 0.05 230), oklch(0.18 0.04 250))',
        borderRadius: 7, padding: '24px 18px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 130,
        border: '1px solid var(--bd-soft)',
        position: 'relative', overflow: 'hidden',
      }}>
        {children}
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="lbl" style={{ fontSize: 10.5 }}>{os}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>native APIs</span>
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
      borderRadius: 14, padding: '12px 14px',
      width: 320,
      color: '#fff', display: 'flex', gap: 12,
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: 'var(--bg-0)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Logo size={18} withText={false} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>CodeHub</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>now</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 1 }}>Codex needs permission</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
          aurora-api · run <span style={{ color: '#fff', fontFamily: 'var(--mono)' }}>pnpm migrate:up</span>?
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button style={{ ...pillBtn('ghost'), padding: '5px 12px', fontSize: 11, background: 'rgba(255,255,255,0.12)' }}>Deny</button>
          <button style={{ ...pillBtn('white'), padding: '5px 12px', fontSize: 11 }}>Approve</button>
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
      borderRadius: 8, padding: 14,
      width: 320,
      color: '#fff',
      boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
      border: '1px solid rgba(255,255,255,0.04)',
      fontFamily: 'var(--sans)',
      position: 'relative',
    }}>
      {/* Win 11 accent stripe top */}
      <span style={{ position: 'absolute', top: 0, left: 0, width: 3, bottom: 0, background: 'oklch(0.78 0.10 265)', borderRadius: '8px 0 0 8px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          background: 'var(--bg-0)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Logo size={12} withText={false} />
        </div>
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>CodeHub</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>1m ago</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>×</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Claude finished refactor</div>
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
        aurora-api · 14 edits, 218 tests pass · 4:21 elapsed
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button style={{ ...pillBtn('ghost'), padding: '6px 12px', fontSize: 11, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>Dismiss</button>
        <button style={{ ...pillBtn('white'), padding: '6px 12px', fontSize: 11, borderRadius: 4 }}>Review diff</button>
      </div>
    </div>
  );
}

// Linux / GNOME-style top banner
function LinuxToast() {
  return (
    <div style={{
      background: 'rgba(20,22,26,0.96)',
      borderRadius: 10, padding: '10px 14px',
      width: 360,
      color: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 10px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'oklch(0.72 0.18 25)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 14,
      }}>!</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 1 }}>Claude failed · dash-web</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--mono)' }}>
          ENOENT: no such file '/tmp/snap-3'
        </div>
      </div>
      <button style={{ ...pillBtn('ghost'), padding: '6px 12px', fontSize: 11, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }}>Open</button>
      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, cursor: 'pointer' }}>×</span>
    </div>
  );
}

window.LiveActivities = LiveActivities;
