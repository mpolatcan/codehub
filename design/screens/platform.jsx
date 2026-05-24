// CodeHub — Platform feature matrix. Maps every feature to where it works:
// Desktop (Electron-grade), Web (browser-only), or both. Lives in Settings
// so users + support know what to expect per build.

function Platform() {
  return (
    <AppChrome w={1440} h={900} title="codehub · platform">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="settings" />

        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-1)', minWidth: 0 }}>
          <nav style={{ width: '13.75rem', flexShrink: 0, borderRight: '1px solid var(--bd-soft)', padding: '1.25rem 0.75rem' }}>
            <h2 style={{ margin: '0 0.375rem 0.875rem', fontSize: '1rem', fontWeight: 600 }}>Settings</h2>
            <NavGroup label="Workspace">
              <NavItem>General</NavItem>
              <NavItem>Agents</NavItem>
              <NavItem>Container runtime</NavItem>
              <NavItem>Integrations</NavItem>
              <NavItem>Repositories</NavItem>
              <NavItem active>Platform</NavItem>
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

          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
            <div style={{ maxWidth: '55rem' }}>
              {/* hero */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.625rem' }}>
                <div>
                  <h1 style={{ margin: '0 0 0.375rem', fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Platform</h1>
                  <p style={{ margin: 0, color: 'var(--fg-2)', fontSize: '0.8125rem', maxWidth: '33.75rem', lineHeight: 1.5 }}>
                    CodeHub ships desktop-first. Web support is on the roadmap. This page maps every feature to where it works — so you (and your team) know what to expect per build.
                  </p>
                </div>
                <span style={{ flex: 1 }} />
                <PlatformPill active="desktop" />
              </div>

              {/* legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem', padding: '0.625rem 0.875rem', background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: '0.5rem' }}>
                <span className="lbl-soft" style={{ fontSize: '0.6875rem' }}>legend</span>
                <Legend tone="full"   label="full support" />
                <Legend tone="server" label="via server" />
                <Legend tone="degraded" label="degraded UX" />
                <Legend tone="none"   label="unavailable" />
              </div>

              {/* matrix */}
              <Matrix
                rows={[
                  { group: 'Core surfaces' },
                  { name: 'Main Hub (workspace tabs, panes, terminals)', d: 'full',     w: 'full',     note: 'xterm.js inside the browser tab' },
                  { name: 'Command palette · ⌘K',                       d: 'full',     w: 'full',     note: '' },
                  { name: 'Session detail · diff inspector',           d: 'full',     w: 'full',     note: '' },
                  { name: 'Resume library · past sessions',             d: 'full',     w: 'full',     note: '' },
                  { name: 'Dashboard · Usage · Settings',              d: 'full',     w: 'full',     note: '' },

                  { group: 'Container runtime' },
                  { name: 'Docker daemon access',                       d: 'full',     w: 'server',   note: 'Web requires a CodeHub server bridging to a remote daemon' },
                  { name: 'Workspace filesystem mount',                 d: 'full',     w: 'server',   note: 'Local path on desktop · git URL → server-side checkout on web' },
                  { name: 'Built-in container shell (tmux)',            d: 'full',     w: 'full',     note: 'WebSocket from server to xterm.js' },
                  { name: 'File browser pane',                          d: 'full',     w: 'server',   note: 'Reads container fs through the server proxy' },
                  { name: 'Container exec / restart / stop',            d: 'full',     w: 'server',   note: '' },

                  { group: 'Notifications & ambient' },
                  { name: 'In-app notifications (right rail)',          d: 'full',     w: 'full',     note: '' },
                  { name: 'Dynamic Island · live activity',             d: 'full',     w: 'degraded', note: 'Becomes a pinned top-center widget inside the tab' },
                  { name: 'OS-native toast (macOS / Win / GNOME)',      d: 'full',     w: 'degraded', note: 'Browser Notification API · plain title + body only' },
                  { name: 'Push notifications when app is closed',      d: 'full',     w: 'full',     note: 'Web Push API via the server' },
                  { name: 'Companion · floating draggable avatar',     d: 'full',     w: 'none',     note: 'Requires always-on-top window — not possible in browser' },
                  { name: 'Menu bar tray icon',                         d: 'full',     w: 'none',     note: '' },

                  { group: 'Shortcuts & interactions' },
                  { name: 'Per-tab keyboard shortcuts (when focused)',  d: 'full',     w: 'full',     note: '' },
                  { name: 'Global shortcuts (when not focused)',        d: 'full',     w: 'none',     note: 'e.g. ⌘⇧J to expand island from any app' },
                  { name: 'Drag-and-drop files into container',         d: 'full',     w: 'degraded', note: 'Browser drop area · no global drop targets' },

                  { group: 'Storage & security' },
                  { name: 'OS keychain for API keys',                   d: 'full',     w: 'server',   note: 'Web stores secrets server-side (HSM / Vault recommended)' },
                  { name: 'Multiple OS users / profiles',               d: 'full',     w: 'full',     note: 'Single-tenant desktop · multi-tenant server on web' },
                  { name: 'Offline mode',                               d: 'degraded', w: 'none',     note: 'Local container work still functions on desktop' },

                  { group: 'Integrations' },
                  { name: 'GitHub PAT · clone/push/PR',                d: 'full',     w: 'full',     note: '' },
                  { name: 'OAuth providers',                           d: 'full',     w: 'full',     note: '' },
                  { name: 'MCP servers (stdio)',                       d: 'full',     w: 'server',   note: 'Browser cannot spawn local processes' },
                  { name: 'MCP servers (SSE / HTTP)',                  d: 'full',     w: 'full',     note: '' },

                  { group: 'Auto-update & telemetry' },
                  { name: 'Self-update from About screen',             d: 'full',     w: 'none',     note: 'Web is always latest' },
                  { name: 'Update notification banner',                d: 'full',     w: 'full',     note: '' },
                ]}
              />
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

// Two-state pill showing which platform you're on
function PlatformPill({ active }) {
  return (
    <div style={{
      display: 'inline-flex', gap: 2, padding: 3,
      background: 'var(--bg-2)', border: '1px solid var(--bd)',
      borderRadius: '62.4375rem',
    }}>
      {['desktop', 'web'].map(p => (
        <span key={p} style={{
          padding: '0.375rem 0.875rem', borderRadius: '62.4375rem',
          fontSize: '0.75rem', fontFamily: 'var(--mono)',
          background: active === p ? 'var(--bg-0)' : 'transparent',
          color: active === p ? 'var(--fg-0)' : 'var(--fg-2)',
          border: active === p ? '1px solid var(--bd)' : '1px solid transparent',
          display: 'inline-flex', alignItems: 'center', gap: '0.4375rem',
          fontWeight: active === p ? 500 : 400,
        }}>
          <span style={{
            width: '0.4375rem', height: '0.4375rem', borderRadius: '50%',
            background: active === p ? 'var(--live)' : 'var(--fg-3)',
          }} />
          {p === 'desktop' ? 'Desktop · v0.42.1' : 'Web · planned'}
        </span>
      ))}
    </div>
  );
}

function Legend({ tone, label }) {
  const color =
    tone === 'full' ? 'var(--live)' :
    tone === 'server' ? 'var(--idle)' :
    tone === 'degraded' ? 'var(--wait)' :
    'var(--err)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--fg-1)' }}>
      <span style={{
        width: '0.625rem', height: '0.625rem', borderRadius: 3,
        background: `color-mix(in oklab, ${color} 25%, transparent)`,
        border: `1px solid ${color}`,
      }} />
      {label}
    </span>
  );
}

function Matrix({ rows }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 110px 110px 1fr',
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
        padding: '0.625rem 1rem', gap: '0.75rem',
        fontSize: '0.6875rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)',
        letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
      }}>
        <span>feature</span>
        <span style={{ textAlign: 'center' }}>desktop</span>
        <span style={{ textAlign: 'center' }}>web</span>
        <span>note</span>
      </div>
      {rows.map((r, i) => r.group ? (
        <div key={i} style={{
          padding: '0.875rem 1rem 0.375rem',
          fontFamily: 'var(--mono)', fontSize: '0.6875rem',
          color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em',
          background: 'var(--bg-1)',
          borderTop: i === 0 ? 'none' : '1px solid var(--bd-soft)',
        }}>{r.group}</div>
      ) : (
        <MatrixRow key={i} {...r} />
      ))}
    </div>
  );
}

function MatrixRow({ name, d, w, note }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 110px 110px 1fr', gap: '0.75rem',
      padding: '0.625rem 1rem',
      borderBottom: '1px solid var(--bd-soft)',
      alignItems: 'center',
      fontSize: '0.75rem',
    }}>
      <span style={{ color: 'var(--fg-0)' }}>{name}</span>
      <span style={{ textAlign: 'center' }}><Support tone={d} /></span>
      <span style={{ textAlign: 'center' }}><Support tone={w} /></span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>{note}</span>
    </div>
  );
}

function Support({ tone }) {
  const map = {
    full:     { color: 'var(--live)', icon: '✓', label: 'full' },
    server:   { color: 'var(--idle)', icon: '◐', label: 'server' },
    degraded: { color: 'var(--wait)', icon: '~', label: 'degraded' },
    none:     { color: 'var(--err)',  icon: '×', label: 'no' },
  };
  const m = map[tone] || map.none;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
      padding: '3px 0.5rem', borderRadius: 4,
      fontFamily: 'var(--mono)', fontSize: '0.6875rem', fontWeight: 500,
      color: m.color,
      background: `color-mix(in oklab, ${m.color} 12%, transparent)`,
      border: `1px solid color-mix(in oklab, ${m.color} 30%, transparent)`,
    }}>
      <span>{m.icon}</span>{m.label}
    </span>
  );
}

window.Platform = Platform;
