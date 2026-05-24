// CodeHub — Empty state / onboarding. First-run with no sessions yet.
// Centered, instructive. Three big agent cards and a path to set up missing keys.

function EmptyState() {
  return (
    <AppChrome w={1440} h={900} title="codehub · welcome">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 240, flexShrink: 0,
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--bd-soft)' }}>
            <Logo />
          </div>
          <div style={{ padding: '10px 10px 6px' }}>
            <button className="btn primary" style={{ justifyContent: 'space-between', width: '100%' }} disabled>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{Ico.plus}New agent</span>
              <span style={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                <span className="kbd" style={{ background: 'rgba(0,0,0,.1)', color: 'inherit', borderColor: 'rgba(0,0,0,.15)' }}>⌘</span>
                <span className="kbd" style={{ background: 'rgba(0,0,0,.1)', color: 'inherit', borderColor: 'rgba(0,0,0,.15)' }}>N</span>
              </span>
            </button>
          </div>

          <div style={{ padding: '10px 10px 4px' }}>
            <div className="lbl" style={{ padding: '0 4px 6px' }}>Views</div>
            <div className="side-item active">{Ico.hub}<span style={{ flex: 1 }}>Hub</span></div>
            <div className="side-item" style={{ opacity: 0.4 }}>{Ico.grid}<span style={{ flex: 1 }}>Dashboard</span></div>
            <div className="side-item" style={{ opacity: 0.4 }}>{Ico.container}<span style={{ flex: 1 }}>Containers</span></div>
            <div className="side-item">{Ico.settings}<span style={{ flex: 1 }}>Settings</span></div>
          </div>

          <div style={{ flex: 1, padding: '14px 10px 4px' }}>
            <div className="lbl" style={{ padding: '0 4px 6px' }}>Sessions · 0</div>
            <div style={{
              padding: '20px 12px', textAlign: 'center',
              border: '1px dashed var(--bd)', borderRadius: 8,
              fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.55,
            }}>
              No sessions yet.<br/>
              <span className="mono" style={{ color: 'var(--fg-3)' }}>⌘N</span> to start one.
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg, oklch(0.7 0.13 30), oklch(0.6 0.13 280))' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>m.kim</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>first run · 2 keys missing</div>
            </div>
          </div>
        </aside>

        {/* hero */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)', position: 'relative' }}>
          {/* faint terminal grid bg */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `
                repeating-linear-gradient(0deg, transparent 0 19px, var(--bd-soft) 19px 20px),
                radial-gradient(ellipse at 50% 30%, var(--bg-2), var(--bg-1) 70%)
              `,
            }} />
          </div>

          <div className="scroll" style={{
            flex: 1, overflow: 'auto', padding: '60px 60px 30px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative',
          }}>
            <div style={{ maxWidth: 880, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', border: '1px solid var(--bd)', borderRadius: 999, fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--mono)', marginBottom: 22 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--live)' }} />
                  docker daemon connected · 8 cores, 16 GiB free
                </div>
                <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg-0)' }}>
                  Run coding agents,<br/>
                  <span style={{ color: 'var(--fg-2)' }}>side by side, in containers.</span>
                </h1>
                <p style={{ margin: '14px auto 0', maxWidth: 520, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.55 }}>
                  Each session spawns a fresh tmux on its own Docker container — your repo is mounted,
                  your secrets stay in the keychain, and you can compare agents in split panes.
                </p>
              </div>

              {/* 3 agent cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                <BigAgentCard agent="claude" name="Claude Code" desc="Long-context refactors, planned edits, deep code reading." version="v2.1.147" keySet />
                <BigAgentCard agent="codex" name="Codex" desc="Snappy iteration, safe shell tools, focused diffs." version="v0.7.4" keySet />
                <BigAgentCard agent="antigravity" name="Antigravity" desc="Multi-step automations, profiling, longer-running analyses." version="v0.3.0" />
              </div>

              {/* setup checklist */}
              <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span className="lbl">Setup · 3 of 4</span>
                  <div className="bar thin" style={{ flex: 1, maxWidth: 220 }}><i style={{ width: '75%', background: 'var(--live)' }} /></div>
                </div>
                <ChecklistItem done label="Docker daemon connected" sub="docker 25.0 · /var/run/docker.sock" />
                <ChecklistItem done label="Claude Code key" sub="sk-ant-***" />
                <ChecklistItem done label="OpenAI key" sub="sk-proj-***" />
                <ChecklistItem todo label="Google API key for Antigravity"
                  sub="Required to enable the Antigravity agent."
                  action="Add key" />
              </div>

              <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'var(--fg-2)' }}>
                <span style={{ marginRight: 14 }}>Press <span className="kbd">⌘</span><span className="kbd" style={{ marginLeft: 2 }}>N</span> to start your first agent.</span>
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
      padding: 20, borderRadius: 12,
      background: 'var(--bg-2)',
      border: '1px solid var(--bd)',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative', minHeight: 200,
      cursor: keySet ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `color-mix(in oklab, ${meta.accent} 16%, var(--bg-1))`,
        border: `1px solid color-mix(in oklab, ${meta.accent} 35%, var(--bd))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.accent,
      }}>
        <span style={{ transform: 'scale(1.6)' }}><AgentGlyph agent={agent} size={14} color={meta.accent} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{version}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.5 }}>{desc}</p>
      <div style={{ flex: 1 }} />
      {keySet ? (
        <button className="btn sm" style={{ alignSelf: 'flex-start' }}>Start with {name} <span style={{ marginLeft: 4 }}>{Ico.arrowR}</span></button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--wait)', fontSize: 11.5 }}>
          <StatusDot status="wait" /> Add API key to enable
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ done, todo, label, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: '1px solid var(--bd-soft)' }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${done ? 'var(--live)' : 'var(--bd-strong)'}`,
        background: done ? 'var(--live)' : 'transparent',
        color: done ? 'var(--bg-0)' : 'var(--fg-3)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, flexShrink: 0,
      }}>
        {done && Ico.check}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: done ? 'var(--fg-1)' : 'var(--fg-0)' }}>{label}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{sub}</div>
      </div>
      {todo && action && <button className="btn xs">{action}</button>}
    </div>
  );
}

window.EmptyState = EmptyState;
