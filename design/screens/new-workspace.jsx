// CodeHub — New Workspace wizard.
// 3 steps: pick repos → configure container → name & launch.
// Modal floating over the welcome list with the wizard centered, content
// blurred behind. Step 2 is "checked" in this snapshot to show inputs filled.

function NewWorkspace() {
  return (
    <AppChrome w={1440} h={900} title="codehub · new workspace">
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxWelcomeBg />
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

        {/* wizard card */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '52rem', maxHeight: '46rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: '0.875rem',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* head */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>New workspace</h2>
            <span style={{ flex: 1 }} />
            <span className="kbd">esc</span>
          </div>

          {/* stepper */}
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Step n={1} label="Repositories" done />
              <Bar done />
              <Step n={2} label="Container" current />
              <Bar />
              <Step n={3} label="Name & launch" />
            </div>
          </div>

          {/* body — step 2 */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Container size</h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>one container holds all 2 repos</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <SizeCard size="xs" cpu="1 vCPU" mem="1 GiB" cost="$0.04/h" />
                <SizeCard size="s"  cpu="1 vCPU" mem="2 GiB" cost="$0.08/h" />
                <SizeCard size="m"  cpu="2 vCPU" mem="4 GiB" cost="$0.16/h" selected />
                <SizeCard size="l"  cpu="4 vCPU" mem="8 GiB" cost="$0.32/h" />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Base image</h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>
                  the standard CodeHub image — bundles every agent's runtime
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: 'var(--bg-1)',
                border: '1px solid var(--bd-soft)',
                borderRadius: 6,
              }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: 6,
                  background: 'var(--bg-3)', border: '1px solid var(--bd-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--fg-1)',
                }}>{Ico.container}</div>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)' }}>codehub:latest</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', marginTop: 2 }}>
                    Node 20 · Python 3.12 · Rust 1.75 · Go 1.22 · git · gh CLI · pnpm · uv
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--live)',
                  padding: '2px 0.5rem', borderRadius: 999,
                  background: 'color-mix(in oklab, var(--live) 12%, transparent)',
                }}>
                  <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />
                  pinned
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Mount & secrets</h3>
              <div style={{
                background: 'var(--bg-1)', border: '1px solid var(--bd-soft)',
                borderRadius: 6, padding: '0.75rem 0.875rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <MountRow icon={Ico.branch} label="Repos mounted at" value="/workspace/{repo-name}" mono />
                <MountRow icon={Ico.container} label="Keychain secrets" value="GITHUB_TOKEN · OPENAI_API_KEY · ANTHROPIC_API_KEY" />
                <MountRow icon={Ico.settings} label="Lifecycle" value="Sleep after 30 min idle · auto-resume on attach" />
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>
              Estimated start: <span style={{ color: 'var(--fg-0)' }}>~2.4s</span> · idle cost <span style={{ color: 'var(--fg-0)' }}>$0.16/h</span>
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn sm ghost">Back</button>
            <button className="btn sm pri solid" title="Continue (Enter)"
              onClick={() => {
                const id = window.Store.createWorkspace({
                  name: `workspace-${Date.now().toString(36).slice(-4)}`,
                  repos: [{ name: 'new-repo', branch: 'main', dirty: 0 }],
                  container: 'cc-' + Math.random().toString(16).slice(2, 8),
                  containerSize: 'm',
                });
              }}>Continue<span className="kbd">⏎</span></button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function Step({ n, label, done, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{
        width: '1.5rem', height: '1.5rem', borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 600,
        background: done || current ? 'var(--pri)' : 'var(--bg-3)',
        color: done || current ? 'var(--bg-0)' : 'var(--fg-2)',
        border: '1px solid ' + (done || current ? 'var(--pri)' : 'var(--bd-soft)'),
      }}>
        {done ? Ico.check : n}
      </span>
      <span style={{
        fontSize: '0.75rem', fontWeight: current ? 600 : 400,
        color: current ? 'var(--fg-0)' : done ? 'var(--fg-1)' : 'var(--fg-2)',
      }}>{label}</span>
    </div>
  );
}

function Bar({ done }) {
  return (
    <div style={{ flex: 1, height: 2, background: done ? 'var(--pri)' : 'var(--bd-soft)', borderRadius: 1 }} />
  );
}

function SizeCard({ size, cpu, mem, cost, selected }) {
  return (
    <div style={{
      padding: '0.75rem',
      borderRadius: 6,
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd)'),
      cursor: 'pointer', position: 'relative',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
      {selected && (
        <span style={{
          position: 'absolute', top: '0.375rem', right: '0.375rem',
          width: '1rem', height: '1rem', borderRadius: '50%',
          background: 'var(--pri)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.check}</span>
      )}
      <span style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--fg-0)' }}>{size}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)' }}>{cpu}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)' }}>{mem}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)', marginTop: '0.25rem' }}>{cost}</span>
    </div>
  );
}

function ImageRow({ id, name, summary, selected }) {
  return (
    <div style={{
      padding: '0.5rem 0.75rem',
      borderRadius: 6,
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd-soft)'),
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '0.625rem',
    }}>
      <span style={{
        width: '1rem', height: '1rem', borderRadius: '50%',
        background: selected ? 'var(--pri)' : 'transparent',
        border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--bg-0)' }} />}
      </span>
      <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', minWidth: '11rem' }}>{name}</span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', flex: 1 }}>{summary}</span>
    </div>
  );
}

function MountRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ color: 'var(--fg-3)', display: 'inline-flex' }}>{icon}</span>
      <span style={{ color: 'var(--fg-2)', minWidth: '8rem' }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ color: 'var(--fg-1)', fontSize: mono ? '0.6875rem' : '0.75rem' }}>{value}</span>
    </div>
  );
}

// Faux welcome screen behind the wizard.
function FauxWelcomeBg() {
  const W = window.Welcome;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {W ? <W /> : <div className="ch-root" style={{ position: 'absolute', inset: 0, background: 'var(--bg-1)' }} />}
    </div>
  );
}

window.NewWorkspace = NewWorkspace;
