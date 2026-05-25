// CodeHub — About. Version, update status, environment summary, changelog
// peek, license, credits.

function About() {
  return (
    <AppChrome w={1440} h={900} title="codehub · about">
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxHubBg />
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(6,7,9,0.55)',
            backdropFilter: 'blur(14px) saturate(120%)',
            WebkitBackdropFilter: 'blur(14px) saturate(120%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }} />
        </>

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40rem',
          background: 'var(--bg-2)', border: '1px solid var(--bd-strong)',
          borderRadius: '0.875rem', overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
        }}>
          {/* hero */}
          <div style={{
            padding: '1.75rem 1.75rem 1.375rem',
            background: 'linear-gradient(135deg, oklch(0.25 0.06 250), var(--bg-2))',
            display: 'flex', alignItems: 'center', gap: '1.125rem',
          }}>
            <div style={{
              width: '3.5rem', height: '3.5rem', borderRadius: '0.875rem',
              background: 'var(--bg-0)', border: '1px solid var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Logo size={32} withText={false} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>CodeHub</div>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>v0.42.1 · build 4a8c2f · macOS-arm64</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', padding: '2px 0.5rem', borderRadius: '62.4375rem', background: 'color-mix(in oklab, var(--live) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--live) 30%, transparent)', color: 'var(--live)', fontSize: '0.6875rem', letterSpacing: 0 }}>
                  <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />
                  desktop
                </span>
              </div>
            </div>
            <div style={{
              padding: '0.375rem 0.625rem', borderRadius: '0.375rem',
              background: 'color-mix(in oklab, var(--live) 12%, transparent)',
              border: '1px solid color-mix(in oklab, var(--live) 35%, transparent)',
              color: 'var(--live)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            }}>
              <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--mono)' }}>update available</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>v0.43.0</div>
            </div>
          </div>

          {/* env */}
          <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid var(--bd-soft)' }}>
            <div className="lbl-soft" style={{ fontSize: '0.6875rem', marginBottom: '0.625rem' }}>Environment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem 1.5rem', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
              <Kv k="Docker"  v="25.0.3 · /var/run/docker.sock" />
              <Kv k="Runtime" v="darwin-arm64 · 14.5" />
              <Kv k="Node"    v="v20.18.0" />
              <Kv k="Memory"  v="16 GiB · 4.8 used" />
              <Kv k="Storage" v="148 GB free of 512 GB" />
              <Kv k="Tmux"    v="3.4 · bundled" />
            </div>
          </div>

          {/* changelog peek */}
          <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', marginBottom: '0.625rem' }}>
              <div className="lbl-soft" style={{ fontSize: '0.6875rem' }}>What's new in v0.43.0</div>
              <span style={{ flex: 1 }} />
              <button className="btn xs ghost">Full changelog</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3125rem', fontSize: '0.75rem', color: 'var(--fg-1)' }}>
              <Cl tone="add">Pane spawn config — agent, model, repo, container inline before the pane runs</Cl>
              <Cl tone="add">Account picker in the spawn dialog</Cl>
              <Cl tone="add">Cyan agent accent for Antigravity (no more collision with the live color)</Cl>
              <Cl tone="fix">Container OOM now persists scrollback before SIGKILL</Cl>
              <Cl tone="fix">Light mode contrast bumps · live accent darkens to L 0.58</Cl>
            </ul>
          </div>

          {/* credits */}
          <div style={{ padding: '0.875rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--fg-2)' }}>
            <span>MIT licensed</span><span>·</span>
            <span>built on tmux, Docker, and JetBrains Mono</span>
            <span style={{ flex: 1 }} />
            <button className="btn xs ghost">Credits</button>
            <button className="btn xs ghost">License</button>
          </div>

          {/* footer actions */}
          <div style={{
            padding: '0.75rem 1.375rem', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>last update check 4 min ago · auto-update <span style={{ color: 'var(--live)' }}>on</span></span>
            <span style={{ flex: 1 }} />
            <button className="btn sm ghost">Check now</button>
            <button className="btn ok solid sm">Install v0.43.0 & restart</button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function Kv({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
      <span style={{ color: 'var(--fg-3)' }}>{k}</span>
      <span style={{ color: 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
}

function Cl({ tone, children }) {
  const color = tone === 'add' ? 'var(--live)' : tone === 'fix' ? 'var(--wait)' : 'var(--idle)';
  const label = tone === 'add' ? '+' : tone === 'fix' ? '·' : '·';
  return (
    <li style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color, minWidth: '1.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label} {tone}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </li>
  );
}

window.About = About;
