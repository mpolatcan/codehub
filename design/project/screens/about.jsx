// CodeHub — About. Version, update status, environment summary, changelog
// peek, license, credits.

function About() {
  return (
    <AppChrome w={1440} h={900} title="codehub · about">
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxHubBg />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,7,9,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 640,
          background: 'var(--bg-2)', border: '1px solid var(--bd-strong)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
        }}>
          {/* hero */}
          <div style={{
            padding: '28px 28px 22px',
            background: 'linear-gradient(135deg, oklch(0.25 0.06 250), var(--bg-2))',
            display: 'flex', alignItems: 'center', gap: 18,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--bg-0)', border: '1px solid var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Logo size={32} withText={false} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>CodeHub</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>v0.42.1 · build 4a8c2f · macOS-arm64</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, background: 'color-mix(in oklab, var(--live) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--live) 30%, transparent)', color: 'var(--live)', fontSize: 10.5, letterSpacing: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--live)' }} />
                  desktop
                </span>
              </div>
            </div>
            <div style={{
              padding: '6px 10px', borderRadius: 6,
              background: 'color-mix(in oklab, var(--live) 12%, transparent)',
              border: '1px solid color-mix(in oklab, var(--live) 35%, transparent)',
              color: 'var(--live)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>update available</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>v0.43.0</div>
            </div>
          </div>

          {/* env */}
          <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div className="lbl-soft" style={{ fontSize: 11, marginBottom: 10 }}>Environment</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontFamily: 'var(--mono)', fontSize: 11.5 }}>
              <Kv k="Docker"  v="25.0.3 · /var/run/docker.sock" />
              <Kv k="Runtime" v="darwin-arm64 · 14.5" />
              <Kv k="Node"    v="v20.18.0" />
              <Kv k="Memory"  v="16 GiB · 4.8 used" />
              <Kv k="Storage" v="148 GB free of 512 GB" />
              <Kv k="Tmux"    v="3.4 · bundled" />
            </div>
          </div>

          {/* changelog peek */}
          <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <div className="lbl-soft" style={{ fontSize: 11 }}>What's new in v0.43.0</div>
              <span style={{ flex: 1 }} />
              <button className="btn xs ghost">Full changelog</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--fg-1)' }}>
              <Cl tone="add">Broadcast — fan a prompt to N agents and pick the winner</Cl>
              <Cl tone="add">Account picker in the spawn dialog</Cl>
              <Cl tone="add">Cyan agent accent for Antigravity (no more collision with the live color)</Cl>
              <Cl tone="fix">Container OOM now persists scrollback before SIGKILL</Cl>
              <Cl tone="fix">Light mode contrast bumps · live accent darkens to L 0.58</Cl>
            </ul>
          </div>

          {/* credits */}
          <div style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'var(--fg-2)' }}>
            <span>MIT licensed</span><span>·</span>
            <span>built on tmux, Docker, and JetBrains Mono</span>
            <span style={{ flex: 1 }} />
            <button className="btn xs ghost">Credits</button>
            <button className="btn xs ghost">License</button>
          </div>

          {/* footer actions */}
          <div style={{
            padding: '12px 22px', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>last update check 4 min ago · auto-update <span style={{ color: 'var(--live)' }}>on</span></span>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'var(--fg-3)' }}>{k}</span>
      <span style={{ color: 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
}

function Cl({ tone, children }) {
  const color = tone === 'add' ? 'var(--live)' : tone === 'fix' ? 'var(--wait)' : 'var(--idle)';
  const label = tone === 'add' ? '+' : tone === 'fix' ? '·' : '·';
  return (
    <li style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, minWidth: 28, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label} {tone}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </li>
  );
}

window.About = About;
