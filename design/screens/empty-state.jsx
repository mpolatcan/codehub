// CodeHub — Empty state / onboarding. First-run with no sessions yet.
// Centered, instructive. Three big agent cards and a path to set up missing keys.

function EmptyState() {
  return (
    <AppChrome w={1440} h={900} title="codehub · welcome">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" empty />

        {/* hero */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)', position: 'relative' }}>
          {/* subtle ambient backdrop — radial soft glow only */}
          <div style={{ position: 'absolute', inset: 0, opacity: 1, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 30%, var(--bg-2), var(--bg-1) 70%)',
            }} />
          </div>

          <div className="scroll" style={{
            flex: 1, overflow: 'auto', padding: '3.75rem 3.75rem 1.875rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative',
          }}>
            <div style={{ maxWidth: '55rem', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3125rem 0.625rem', border: '1px solid var(--bd)', borderRadius: '62.4375rem', fontSize: '0.6875rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)', marginBottom: '1.375rem' }}>
                  <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />
                  docker daemon connected · 8 cores, 16 GiB free
                </div>
                <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg-0)' }}>
                  Run coding agents,<br/>
                  <span style={{ color: 'var(--fg-2)' }}>side by side, in containers.</span>
                </h1>
                <p style={{ margin: '0.875rem auto 0', maxWidth: '32.5rem', fontSize: '0.875rem', color: 'var(--fg-2)', lineHeight: 1.55 }}>
                  Each session spawns a fresh tmux on its own Docker container — your repo is mounted,
                  your secrets stay in the keychain, and you can compare agents in split panes.
                </p>
              </div>

              {/* 3 agent cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <BigAgentCard agent="claude" name="Claude Code" desc="Long-context refactors, planned edits, deep code reading." version="v2.1.147" keySet />
                <BigAgentCard agent="codex" name="Codex" desc="Snappy iteration, safe shell tools, focused diffs." version="v0.7.4" keySet />
                <BigAgentCard agent="antigravity" name="Antigravity" desc="Multi-step automations, profiling, longer-running analyses." version="v0.3.0" />
              </div>

              {/* setup checklist */}
              <div className="card" style={{ padding: '1.125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
                  <span className="lbl">Setup · 3 of 4</span>
                  <div className="bar thin" style={{ flex: 1, maxWidth: '13.75rem' }}><i style={{ width: '75%', background: 'var(--live)' }} /></div>
                </div>
                <ChecklistItem done label="Docker daemon connected" sub="docker 25.0 · /var/run/docker.sock" />
                <ChecklistItem done label="Claude Code key" sub="sk-ant-***" />
                <ChecklistItem done label="OpenAI key" sub="sk-proj-***" />
                <ChecklistItem todo label="Google API key for Antigravity"
                  sub="Required to enable the Antigravity agent."
                  action="Add key" />
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.75rem', color: 'var(--fg-2)' }}>
                <span style={{ marginRight: '0.875rem' }}>Press <span className="kbd">⌘</span><span className="kbd" style={{ marginLeft: 2 }}>N</span> to start your first agent.</span>
                <span>Or <a style={{ color: 'var(--fg-1)', textDecoration: 'underline', textUnderlineOffset: 3 }}>read the docs</a>.</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function BigAgentCard({ agent, name, desc, version, keySet }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      padding: '1.25rem', borderRadius: '0.75rem',
      background: 'var(--bg-2)',
      border: '1px solid var(--bd)',
      display: 'flex', flexDirection: 'column', gap: '0.625rem',
      position: 'relative', minHeight: '12.5rem',
      cursor: keySet ? 'pointer' : 'default',
    }}>
      <div style={{
        width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem',
        background: `color-mix(in oklab, ${meta.accent} 16%, var(--bg-1))`,
        border: `1px solid color-mix(in oklab, ${meta.accent} 35%, var(--bd))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.accent,
      }}>
        <span style={{ transform: 'scale(1.6)' }}><AgentGlyph agent={agent} size={13} color={meta.accent} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{name}</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{version}</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--fg-2)', lineHeight: 1.5 }}>{desc}</p>
      <div style={{ flex: 1 }} />
      {keySet ? (
        <button className="btn sm" style={{ alignSelf: 'flex-start' }}>Start with {name} <span style={{ marginLeft: 4 }}>{Ico.arrowR}</span></button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--wait)', fontSize: '0.75rem' }}>
          <StatusDot status="wait" /> Add API key to enable
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ done, todo, label, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderTop: '1px solid var(--bd-soft)' }}>
      <span style={{
        width: '1.125rem', height: '1.125rem', borderRadius: '50%',
        border: `1.5px solid ${done ? 'var(--live)' : 'var(--bd-strong)'}`,
        background: done ? 'var(--live)' : 'transparent',
        color: done ? 'var(--bg-0)' : 'var(--fg-3)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.625rem', flexShrink: 0,
      }}>
        {done && Ico.check}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8125rem', color: done ? 'var(--fg-1)' : 'var(--fg-0)' }}>{label}</div>
        <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{sub}</div>
      </div>
      {todo && action && <button className="btn xs">{action}</button>}
    </div>
  );
}

window.EmptyState = EmptyState;
