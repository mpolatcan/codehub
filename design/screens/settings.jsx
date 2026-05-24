// CodeHub — Settings. Sectioned left-nav + right pane. Agents/API, runtime,
// keybindings, notifications, appearance, billing.

function Settings() {
  return (
    <AppChrome w={1440} h={900} title="codehub · settings">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="settings" />

        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* settings nav */}
          <nav style={{
            width: '13.75rem', flexShrink: 0,
            background: 'var(--bg-1)',
            borderRight: '1px solid var(--bd-soft)',
            padding: '1.25rem 0.75rem',
          }}>
            <h2 style={{ margin: '0 0.375rem 0.875rem', fontSize: '1rem', fontWeight: 600 }}>Settings</h2>
            <NavGroup label="Workspace">
              <NavItem active>General</NavItem>
              <NavItem>Agents & API keys</NavItem>
              <NavItem>Container runtime</NavItem>
              <NavItem>Repositories</NavItem>
            </NavGroup>
            <NavGroup label="Experience">
              <NavItem>Keyboard shortcuts</NavItem>
              <NavItem>Notifications</NavItem>
              <NavItem>Appearance</NavItem>
            </NavGroup>
            <NavGroup label="Account">
              <NavItem>Usage & billing</NavItem>
              <NavItem>Team</NavItem>
            </NavGroup>
          </nav>

          {/* pane */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
            <div style={{ maxWidth: '45rem' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Agents & API keys</h1>
              <p style={{ margin: '0 0 1.75rem', color: 'var(--fg-2)', fontSize: '0.8125rem' }}>
                Configure the coding agents available when spawning a new agent. Keys are stored encrypted
                in your OS keychain and only injected into running containers.
              </p>

              {/* AGENTS */}
              <SectionHead label="Agents" />
              <AgentRow agent="claude" name="Claude Code" defaultModel="opus-4.7" keyState="set" auth="Claude Max" version="v2.1.147" />
              <AgentRow agent="codex" name="Codex" defaultModel="o4-mini" keyState="set" auth="OpenAI · Plus" version="v0.7.4" />
              <AgentRow agent="antigravity" name="Antigravity" defaultModel="gemini-2.5-pro" keyState="missing" auth="—" version="v0.3.0" />

              <div style={{ display: 'flex', gap: '0.5rem', margin: '0.875rem 0 2rem' }}>
                <button className="btn sm">{Ico.plus}Add custom agent</button>
                <button className="btn sm ghost">Refresh versions</button>
              </div>

              {/* DEFAULTS */}
              <SectionHead label="Defaults for new sessions" />
              <SettingRow
                label="Default agent"
                desc="Pre-selected in the agent spawn (⌘N)."
                control={<Select value="Claude Code" />}
              />
              <SettingRow
                label="Auto-approve safe commands"
                desc="Read-only operations (ls, cat, git status) run without prompting."
                control={<Toggle on />}
              />
              <SettingRow
                label="Approve writes"
                desc="Always ask before edits, branch ops, or shell execution."
                control={<Toggle on />}
              />
              <SettingRow
                label="Cost budget per turn"
                desc="Auto-pause when a turn exceeds this. 0 disables."
                control={<Input value="$1.00" suffix="USD" />}
              />
              <SettingRow
                label="Context budget"
                desc="Stop loading more context once this fills."
                control={<Input value="800k" suffix="tokens" />}
                last
              />

              {/* DANGER */}
              <SectionHead label="Danger zone" tone="err" />
              <div className="card" style={{
                padding: '0.875rem', borderColor: 'color-mix(in oklab, var(--err) 30%, var(--bd))',
                background: 'color-mix(in oklab, var(--err) 4%, var(--bg-2))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: 2 }}>Stop all running agents</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>Will SIGTERM 3 sessions and persist their tmux scrollback.</div>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button className="btn sm danger">Stop all</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function NavGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div className="lbl" style={{ padding: '0 0.375rem 4px' }}>{label}</div>
      {children}
    </div>
  );
}

function NavItem({ active, children }) {
  return (
    <div style={{
      padding: '0.4375rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.8125rem',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      background: active ? 'var(--bg-3)' : 'transparent',
      cursor: 'pointer', marginBottom: 1,
    }}>{children}</div>
  );
}

function SectionHead({ label, tone, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', margin: '1.5rem 0 0.75rem' }}>
      <span className="lbl" style={{ color: tone === 'err' ? 'var(--err)' : 'var(--fg-1)', fontSize: '0.6875rem' }}>{label}</span>
      {badge && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '0.625rem', letterSpacing: '0.06em',
          textTransform: 'uppercase', fontWeight: 500,
          padding: '2px 0.375rem', borderRadius: 4,
          background: 'var(--bg-3)', color: 'var(--fg-2)',
          border: '1px solid var(--bd)',
        }}>{badge}</span>
      )}
      <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
    </div>
  );
}

function AgentRow({ agent, name, defaultModel, keyState, auth, version }) {
  const meta = AGENT_META[agent];
  return (
    <div className="card" style={{ padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
      <div style={{
        width: '2.375rem', height: '2.375rem', borderRadius: '0.5rem',
        background: `color-mix(in oklab, ${meta.accent} 14%, var(--bg-1))`,
        border: `1px solid color-mix(in oklab, ${meta.accent} 30%, var(--bd))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.accent,
      }}>
        <span style={{ transform: 'scale(1.4)' }}><AgentGlyph agent={agent} size={13} color={meta.accent} /></span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{name}</span>
          <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{version}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>{defaultModel} · {auth}</div>
      </div>
      {keyState === 'set' ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', fontSize: '0.75rem', color: 'var(--live)', whiteSpace: 'nowrap' }}>
          <StatusDot status="live" /> Connected
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', fontSize: '0.75rem', color: 'var(--wait)', whiteSpace: 'nowrap' }}>
          <StatusDot status="wait" /> Key needed
        </span>
      )}
      <button className="btn sm">{keyState === 'set' ? 'Edit' : 'Add key'}</button>
    </div>
  );
}

function SettingRow({ label, desc, control, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1.25rem',
      padding: '0.875rem 0',
      borderBottom: last ? 'none' : '1px solid var(--bd-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      <div>{control}</div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span style={{
      width: '2rem', height: '1.125rem', borderRadius: '62.4375rem',
      background: on ? 'var(--fg-0)' : 'var(--bg-3)',
      border: `1px solid ${on ? 'var(--fg-0)' : 'var(--bd-strong)'}`,
      display: 'inline-flex', alignItems: 'center',
      padding: '0 2px', cursor: 'pointer',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: 1, left: on ? 16 : 1,
        width: '0.875rem', height: '0.875rem', borderRadius: '50%',
        background: on ? 'var(--bg-0)' : 'var(--fg-1)',
        transition: 'left .15s',
      }} />
    </span>
  );
}

function Select({ value }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.375rem 0.625rem', border: '1px solid var(--bd)',
      borderRadius: '0.375rem', background: 'var(--bg-1)',
      fontSize: '0.75rem', color: 'var(--fg-0)', cursor: 'pointer',
      minWidth: '10rem', justifyContent: 'space-between',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <AgentGlyph agent="claude" size={11} color="var(--a-claude)" />
        {value}
      </span>
      <span style={{ color: 'var(--fg-2)' }}>{Ico.chevD}</span>
    </div>
  );
}

function Input({ value, suffix }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.375rem 0.625rem', border: '1px solid var(--bd)',
      borderRadius: '0.375rem', background: 'var(--bg-1)',
      fontFamily: 'var(--mono)', fontSize: '0.75rem', minWidth: '8.75rem',
    }}>
      <span style={{ color: 'var(--fg-0)' }}>{value}</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--fg-3)', fontSize: '0.6875rem' }}>{suffix}</span>
    </div>
  );
}

window.Settings = Settings;
window.Toggle = Toggle;
