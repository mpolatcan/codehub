// CodeHub — States. Loading + error + empty states across the app, laid
// out as a single reference artboard so we can audit recoverable failures
// and quiet moments in one place.

function States() {
  return (
    <AppChrome w={1440} h={900} title="codehub · states">
      <div className="ch-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.125rem 1.75rem 0.875rem', borderBottom: '1px solid var(--bd-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>States</h1>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>loading · error · empty states across the app · reference</span>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.75rem' }}>
          {/* LOADING */}
          <SectionTitle label="Loading" caption="skeletons + spawn progress" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.375rem' }}>
            <StateCard caption="Container booting" desc="Pulling image · attaching tmux · mounting workspace. Real progress, not a generic spinner.">
              <ContainerBootingPane />
            </StateCard>
            <StateCard caption="Skeleton terminal" desc="First paint before agent metadata returns. Shimmer block, then content.">
              <SkeletonPane />
            </StateCard>
          </div>

          {/* ERRORS */}
          <SectionTitle label="Errors" caption="recoverable — each has a clear next action" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.375rem' }}>
            <StateCard caption="Container crashed (OOM)" desc="Mem cap hit during build. Restart with higher mem, or inspect logs.">
              <CrashPane />
            </StateCard>
            <StateCard caption="API key invalid" desc="Provider rejected token. Pause sessions, reauthorize, resume — no scrollback loss.">
              <ApiKeyError />
            </StateCard>
            <StateCard caption="Rate limited" desc="Live activity shows when next window opens. Switch account or wait.">
              <RateLimited />
            </StateCard>
            <StateCard caption="Network · offline" desc="App-wide banner with degraded-mode hint.">
              <OfflineBanner />
            </StateCard>
          </div>

          {/* EMPTY */}
          <SectionTitle label="Empty" caption="quiet states with a clear next step — not blank pages" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
            <StateCard caption="No workspaces" desc="Workspaces panel before any have been created.">
              <EmptyState1 icon={Ico.container} title="No workspaces yet" hint="A workspace is created when you spawn your first agent." cta="New workspace" />
            </StateCard>
            <StateCard caption="No resumable agents" desc="Resume library on day 1.">
              <EmptyState1 icon={Ico.hub} title="Nothing to resume" hint="Sessions you close (or that auto-pause) live here for 30 days." cta="Start a session" />
            </StateCard>
            <StateCard caption="No integrations" desc="Pre-GitHub connect.">
              <EmptyState1 icon={Ico.files} title="No integrations connected" hint="Connect GitHub to let agents clone, branch, and open PRs on your behalf." cta="Connect GitHub" />
            </StateCard>
            <StateCard caption="No usage data yet" desc="Brand-new account, before first turn.">
              <EmptyState1 icon={Ico.cpu} title="No usage yet" hint="Charts populate after your first agent turn." />
            </StateCard>
            <StateCard caption="Search · no results" desc="Filter inside command palette returned nothing.">
              <EmptyState1 small icon={Ico.search} title={`No matches for "audit-tracking"`} hint="Try a shorter query, or use ⌘N to spawn a new agent on this topic." />
            </StateCard>
            <StateCard caption="Account suspended" desc="Hard-stop banner inside Usage when a provider revokes.">
              <SuspendedBanner />
            </StateCard>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function SectionTitle({ label, caption }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem', marginTop: 4 }}>
      <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{label}</h2>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{caption}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
    </div>
  );
}

function StateCard({ caption, desc, children }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--bd)',
      borderRadius: '0.625rem', padding: '0.875rem',
      display: 'flex', flexDirection: 'column', gap: '0.625rem',
    }}>
      <div style={{
        background: 'var(--bg-0)', borderRadius: '0.4375rem',
        border: '1px solid var(--bd-soft)',
        minHeight: '10rem', overflow: 'hidden',
        display: 'flex', alignItems: 'stretch',
      }}>
        {children}
      </div>
      <div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500, marginBottom: 2 }}>{caption}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── LOADING PANES ────────────────────────────────────────────────────────
function ContainerBootingPane() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--live)', boxShadow: '0 0 12px var(--live)' }} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)' }}>aurora-cc-3a8f · booting</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>2.4s elapsed</span>
      </div>
      <BootStep done text="Pull image node:20-alpine" detail="148 MB · cached" />
      <BootStep done text="Create container" detail="aurora-cc-3a8f" />
      <BootStep done text="Mount /workspace" detail="~/work/aurora-api rw" />
      <BootStep active text="Start tmux session cc.0" detail="pid 1184 attaching to pts/0" />
      <BootStep text="Restore agent context" detail="opus-4.7 · 1M ctx" />
      <BootStep text="Hello prompt" />
      <div style={{ marginTop: 4, height: 2, background: 'var(--bg-3)', borderRadius: '62.4375rem', overflow: 'hidden' }}>
        <div style={{ width: '58%', height: '100%', background: 'var(--live)' }} />
      </div>
    </div>
  );
}

function BootStep({ done, active, text, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--mono)' }}>
      <span style={{
        width: '0.875rem', height: '0.875rem', borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--live)' : active ? 'transparent' : 'var(--bg-3)',
        border: active ? '1.5px solid var(--live)' : 'none',
        color: 'var(--bg-0)',
      }}>
        {done && <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>}
        {active && <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />}
      </span>
      <span style={{ color: done ? 'var(--fg-2)' : active ? 'var(--fg-0)' : 'var(--fg-3)' }}>{text}</span>
      {detail && <span style={{ color: 'var(--fg-3)', fontSize: '0.6875rem' }}>· {detail}</span>}
    </div>
  );
}

function SkeletonPane() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Sk w="65%" h={11} />
      <Sk w="40%" h={10} />
      <div style={{ height: '0.5rem' }} />
      <Sk w="80%" h={9} />
      <Sk w="92%" h={9} />
      <Sk w="55%" h={9} />
      <div style={{ height: 4 }} />
      <Sk w="74%" h={9} />
      <Sk w="60%" h={9} />
      <div style={{ marginTop: 'auto', fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-3)' }}>
        loading transcript… · 218 turns
      </div>
    </div>
  );
}
function Sk({ w, h }) {
  return (
    <span style={{
      display: 'block', width: w, height: h, borderRadius: 4,
      background: 'linear-gradient(90deg, var(--bg-3), var(--bg-hover), var(--bg-3))',
      backgroundSize: '200% 100%',
    }} />
  );
}

// ── ERROR PANES ──────────────────────────────────────────────────────────
function CrashPane() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--err)', boxShadow: '0 0 12px var(--err)' }} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--err)' }}>Container crashed</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>exit 137 · OOMKilled</span>
      </div>
      <div style={{
        padding: '0.625rem 0.75rem',
        background: 'color-mix(in oklab, var(--err) 8%, var(--bg-0))',
        border: '1px solid color-mix(in oklab, var(--err) 30%, var(--bd))',
        borderRadius: '0.375rem',
        fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--fg-1)',
        lineHeight: 1.55,
      }}>
        <div style={{ color: 'var(--err)' }}>⚠ Memory cap (4 GiB) exceeded during <span style={{ color: 'var(--fg-0)' }}>pnpm install</span></div>
        <div style={{ color: 'var(--fg-2)', marginTop: 4 }}>Scrollback persisted · agent context intact · 14 edits saved to feat/auth-rewrite</div>
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
        <button className="btn ok solid sm" style={{ flex: 1, justifyContent: 'center' }}>Restart with 8 GiB</button>
        <button className="btn sm">View logs</button>
        <button className="btn sm ghost">Open shell</button>
      </div>
    </div>
  );
}

function ApiKeyError() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--wait)', boxShadow: '0 0 12px var(--wait)' }} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--wait)' }}>Authentication failed</span>
        <span style={{ flex: 1 }} />
        <AccountAvatar id="ca" size={14} />
      </div>
      <div style={{
        padding: '0.625rem 0.75rem',
        background: 'color-mix(in oklab, var(--wait) 8%, var(--bg-0))',
        border: '1px solid color-mix(in oklab, var(--wait) 30%, var(--bd))',
        borderRadius: '0.375rem',
        fontSize: '0.75rem', color: 'var(--fg-1)', lineHeight: 1.55,
      }}>
        <div style={{ fontFamily: 'var(--mono)', color: 'var(--wait)' }}>401 · Invalid API key</div>
        <div style={{ color: 'var(--fg-2)', marginTop: 4 }}>
          Anthropic revoked <span className="mono" style={{ color: 'var(--fg-0)' }}>sk-ant-***-J9q3</span>. 2 sessions on this key are paused — their state is preserved.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
        <button className="btn primary sm" style={{ flex: 1, justifyContent: 'center' }}>Reauthorize</button>
        <button className="btn sm">Switch account</button>
      </div>
    </div>
  );
}

function RateLimited() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--wait)' }} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--wait)' }}>5-hour window full</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>m.kim · Claude Max</span>
      </div>
      <div style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-1)', border: '1px solid var(--bd)', borderRadius: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>resets in</span>
          <span className="mono tnum" style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--fg-0)' }}>01:42:08</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: '62.4375rem', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--wait)' }} />
        </div>
        <div className="mono" style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: 'var(--fg-3)' }}>240 / 240 messages</div>
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
        <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }}>Switch to work seat</button>
        <button className="btn sm ghost">Notify me</button>
      </div>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{
        padding: '0.625rem 0.875rem',
        background: 'color-mix(in oklab, var(--err) 10%, var(--bg-1))',
        border: '1px solid color-mix(in oklab, var(--err) 35%, var(--bd))',
        borderRadius: '0.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{
          width: '1.375rem', height: '1.375rem', borderRadius: '50%',
          background: 'var(--err)', color: 'var(--bg-0)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8125rem', fontWeight: 700,
        }}>!</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>You're offline</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>Running agents are paused. Local containers + shells still work.</div>
        </div>
        <button className="btn xs">Retry</button>
      </div>
      <div style={{
        marginTop: 'auto',
        padding: '0.5rem 0.625rem',
        background: 'var(--bg-1)', borderRadius: '0.375rem',
        fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-3)',
      }}>
        Reconnecting in 4s · last seen 18s ago
      </div>
    </div>
  );
}

function SuspendedBanner() {
  return (
    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AccountAvatar id="ca" size={20} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>aurora-bot</span>
        <span style={{ flex: 1 }} />
        <Tag color="var(--err)">suspended</Tag>
      </div>
      <div style={{
        padding: '0.625rem 0.75rem',
        background: 'color-mix(in oklab, var(--err) 8%, var(--bg-0))',
        border: '1px solid color-mix(in oklab, var(--err) 30%, var(--bd))',
        borderRadius: '0.375rem',
        fontSize: '0.75rem', color: 'var(--fg-1)', lineHeight: 1.55,
      }}>
        Anthropic suspended this API key for exceeding the abuse policy. 3 sessions paused. Contact support to appeal.
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', marginTop: 'auto' }}>
        <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }}>Contact support</button>
        <button className="btn sm ghost">Remove account</button>
      </div>
    </div>
  );
}

// ── EMPTY STATE TEMPLATE ─────────────────────────────────────────────────
function EmptyState1({ icon, title, hint, cta, small }) {
  return (
    <div style={{
      flex: 1, padding: small ? 14 : 22,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.625rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
        background: 'var(--bg-3)', color: 'var(--fg-2)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ transform: 'scale(1.4)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--fg-0)' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)', maxWidth: '17.5rem', lineHeight: 1.5 }}>{hint}</div>
      {cta && <button className="btn sm" style={{ marginTop: 4 }}>{Ico.plus}{cta}</button>}
    </div>
  );
}

window.States = States;
