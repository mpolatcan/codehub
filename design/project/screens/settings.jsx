// CodeHub — Settings. Sectioned left-nav + right pane. Agents/API, runtime,
// keybindings, notifications, appearance, billing.

function Settings() {
  return (
    <AppChrome w={1440} h={900} title="codehub · settings">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 52, background: 'var(--bg-0)', borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0',
        }}>
          <div style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--bd-soft)', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon>{Ico.hub}</RailIcon>
          <RailIcon badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon active>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* settings nav */}
          <nav style={{
            width: 220, flexShrink: 0,
            background: 'var(--bg-1)',
            borderRight: '1px solid var(--bd-soft)',
            padding: '20px 12px',
          }}>
            <h2 style={{ margin: '0 6px 14px', fontSize: 17, fontWeight: 600 }}>Settings</h2>
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
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
            <div style={{ maxWidth: 720 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Agents & API keys</h1>
              <p style={{ margin: '0 0 28px', color: 'var(--fg-2)', fontSize: 13 }}>
                Configure the coding agents available in the spawn dialog. Keys are stored encrypted
                in your OS keychain and only injected into running containers.
              </p>

              {/* AGENTS */}
              <SectionHead label="Agents" />
              <AgentRow agent="claude" name="Claude Code" defaultModel="opus-4.7" keyState="set" auth="Claude Max" version="v2.1.147" />
              <AgentRow agent="codex" name="Codex" defaultModel="o4-mini" keyState="set" auth="OpenAI · Plus" version="v0.7.4" />
              <AgentRow agent="antigravity" name="Antigravity" defaultModel="gemini-2.5-pro" keyState="missing" auth="—" version="v0.3.0" />

              <div style={{ display: 'flex', gap: 8, margin: '14px 0 32px' }}>
                <button className="btn sm">{Ico.plus}Add custom agent</button>
                <button className="btn sm ghost">Refresh versions</button>
              </div>

              {/* DEFAULTS */}
              <SectionHead label="Defaults for new sessions" />
              <SettingRow
                label="Default agent"
                desc="Pre-selected in the spawn dialog (⌘N)."
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
                padding: 14, borderColor: 'color-mix(in oklab, var(--err) 30%, var(--bd))',
                background: 'color-mix(in oklab, var(--err) 4%, var(--bg-2))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Stop all running agents</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>Will SIGTERM 3 sessions and persist their tmux scrollback.</div>
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
    <div style={{ marginBottom: 14 }}>
      <div className="lbl" style={{ padding: '0 6px 4px' }}>{label}</div>
      {children}
    </div>
  );
}

function NavItem({ active, children }) {
  return (
    <div style={{
      padding: '7px 10px', borderRadius: 6, fontSize: 12.5,
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      background: active ? 'var(--bg-3)' : 'transparent',
      cursor: 'pointer', marginBottom: 1,
    }}>{children}</div>
  );
}

function SectionHead({ label, tone, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 12px' }}>
      <span className="lbl" style={{ color: tone === 'err' ? 'var(--err)' : 'var(--fg-1)', fontSize: 11 }}>{label}</span>
      {badge && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontWeight: 500,
          padding: '2px 6px', borderRadius: 4,
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
    <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: `color-mix(in oklab, ${meta.accent} 14%, var(--bg-1))`,
        border: `1px solid color-mix(in oklab, ${meta.accent} 30%, var(--bd))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.accent,
      }}>
        <span style={{ transform: 'scale(1.4)' }}><AgentGlyph agent={agent} size={14} color={meta.accent} /></span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{name}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{version}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>{defaultModel} · {auth}</div>
      </div>
      {keyState === 'set' ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--live)', whiteSpace: 'nowrap' }}>
          <StatusDot status="live" /> Connected
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--wait)', whiteSpace: 'nowrap' }}>
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
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid var(--bd-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--fg-0)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      <div>{control}</div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <span style={{
      width: 32, height: 18, borderRadius: 999,
      background: on ? 'var(--fg-0)' : 'var(--bg-3)',
      border: `1px solid ${on ? 'var(--fg-0)' : 'var(--bd-strong)'}`,
      display: 'inline-flex', alignItems: 'center',
      padding: '0 2px', cursor: 'pointer',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: 1, left: on ? 16 : 1,
        width: 14, height: 14, borderRadius: '50%',
        background: on ? 'var(--bg-0)' : 'var(--fg-1)',
        transition: 'left .15s',
      }} />
    </span>
  );
}

function Select({ value }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', border: '1px solid var(--bd)',
      borderRadius: 6, background: 'var(--bg-1)',
      fontSize: 12, color: 'var(--fg-0)', cursor: 'pointer',
      minWidth: 160, justifyContent: 'space-between',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px', border: '1px solid var(--bd)',
      borderRadius: 6, background: 'var(--bg-1)',
      fontFamily: 'var(--mono)', fontSize: 12, minWidth: 140,
    }}>
      <span style={{ color: 'var(--fg-0)' }}>{value}</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>{suffix}</span>
    </div>
  );
}

window.Settings = Settings;
window.Toggle = Toggle;
