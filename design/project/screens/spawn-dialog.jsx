// CodeHub — Spawn Agent dialog.
// Modal over a dimmed Hub. 3 steps: agent · repo · runtime — but shown
// all together on one screen with smart defaults so it's one-click usually.

function SpawnDialog() {
  return (
    <AppChrome w={1440} h={900} title="codehub · new agent">
      {/* dimmed bg: faux hub */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxHubBg />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(6,7,9,0.72)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }} />

        {/* modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 720,
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: 12,
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}>
          {/* head */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>New agent session</span>
            <span style={{ flex: 1 }} />
            <span className="kbd">esc</span>
          </div>

          {/* form */}
          <div style={{ padding: '18px 18px 6px' }}>
            <FormRow label="Agent">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <AgentCard agent="claude" selected />
                <AgentCard agent="codex" />
                <AgentCard agent="antigravity" />
              </div>
            </FormRow>

            <FormRow label="Account">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <AccountCard id="cm" sessions={2} selected />
                <AccountCard id="cw" sessions={0} />
                <AccountCard id="ca" sessions={1} />
              </div>
            </FormRow>

            <FormRow label="Repository">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 5,
                  background: 'var(--bg-3)', border: '1px solid var(--bd-strong)',
                  fontSize: 11.5, color: 'var(--fg-0)', cursor: 'pointer',
                }}>
                  {Ico.files}<span>Local path</span>
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 5,
                  background: 'transparent', border: '1px solid var(--bd)',
                  fontSize: 11.5, color: 'var(--fg-2)', cursor: 'pointer',
                }}>
                  {Ico.branch}<span>Git URL</span>
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginLeft: 8 }}>
                  Local path needs desktop · web uses Git URL
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--bg-1)', border: '1px solid var(--bd)',
                borderRadius: 8, padding: '9px 12px',
              }}>
                {Ico.files}
                <span className="mono" style={{ fontSize: 12.5 }}>~/work/aurora-api</span>
                <span style={{ fontSize: 11, color: 'var(--fg-2)' }}>· feat/auth-rewrite</span>
                <span style={{ flex: 1 }} />
                <button className="btn xs">Change</button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Tag>~/work/dash-web</Tag>
                <Tag>~/work/ml-pipeline</Tag>
                <Tag>~/work/infra</Tag>
                <Tag>+ Open path…</Tag>
              </div>
            </FormRow>

            <FormRow label="Container">
              <div style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14,
                background: 'color-mix(in oklab, var(--live) 8%, var(--bg-1))',
                border: '1px solid color-mix(in oklab, var(--live) 40%, var(--bd))',
                borderRadius: 8, marginBottom: 8, cursor: 'pointer', position: 'relative',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--fg-0)', color: 'var(--bg-0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{Ico.check}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500 }}>Attach to existing</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>aurora-cc-3a8f</span>
                    <StatusBadge status="live">Running 14m</StatusBadge>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-2)' }}>
                    <span>shared with</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <AgentGlyph agent="claude" size={10} color="var(--a-claude)" />Claude Code
                    </span>
                    <span>·</span>
                    <span>node:20-alpine · 47% cpu · 1.2 GiB</span>
                  </div>
                </div>
                <Tag color="var(--live)">~instant</Tag>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px 8px' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
                <span className="lbl" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>or new container</span>
                <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ContainerOpt name="Default" desc="node:20 · 2 CPU · 4 GiB · ≈2.4s" />
                <ContainerOpt name="Heavy" desc="node:20 · 4 CPU · 8 GiB · ≈3.1s" />
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 14, alignItems: 'center', fontSize: 11.5, color: 'var(--fg-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Check checked /> Mount workspace read-write
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Check checked /> Forward .env from host
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <Check /> Network: isolated
                </label>
              </div>
            </FormRow>

            <FormRow label="Initial prompt" optional>
              <div style={{
                background: 'var(--bg-0)', border: '1px solid var(--bd)',
                borderRadius: 8, padding: '10px 12px', minHeight: 76,
                fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-1)',
                lineHeight: 1.5,
              }}>
                <span style={{ color: 'var(--live)' }}>▸ </span>
                Refactor src/middleware/auth.ts to extract JWT verify into a separate verifier.ts module. Add tests for happy path, expired, malformed, and wrong-issuer cases.
                <span className="blink" style={{ color: 'var(--fg-0)' }}>▍</span>
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag style={{ cursor: 'pointer' }}>Fix lint errors</Tag>
                <Tag style={{ cursor: 'pointer' }}>Write tests for…</Tag>
                <Tag style={{ cursor: 'pointer' }}>Review recent diff</Tag>
                <Tag style={{ cursor: 'pointer' }}>+ Templates</Tag>
              </div>
            </FormRow>
          </div>

          {/* foot */}
          <div style={{
            padding: '12px 18px', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>spawn-time ≈ 2.4s · est. cost $0.05–0.20/turn</span>
            <span style={{ flex: 1 }} />
            <button className="btn sm">Cancel</button>
            <button className="btn primary sm" style={{ padding: '6px 14px' }}>
              Launch agent <span className="kbd" style={{ marginLeft: 6, background: 'rgba(0,0,0,.1)', color: 'inherit', borderColor: 'rgba(0,0,0,.15)' }}>⏎</span>
            </button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function FormRow({ label, optional, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span className="lbl" style={{ color: 'var(--fg-1)' }}>{label}</span>
        {optional && <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>optional</span>}
      </div>
      {children}
    </div>
  );
}

function AgentCard({ agent, selected }) {
  const meta = AGENT_META[agent];
  const versions = {
    claude: 'opus-4.7 · 1M',
    codex: 'o4-mini · 200k',
    antigravity: 'g-2.5 · 1M',
  };
  return (
    <div style={{
      padding: '12px 14px',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: 8, cursor: 'pointer',
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {selected && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.check}</span>
      )}
      <AgentGlyph agent={agent} size={18} color={meta.accent} />
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-0)', marginTop: 2 }}>{meta.name}</div>
      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{versions[agent]}</div>
    </div>
  );
}

function ContainerOpt({ name, desc, selected }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: 8, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Ico.container}
        <span style={{ fontSize: 12.5, fontWeight: 500 }}>{name}</span>
      </div>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{desc}</span>
    </div>
  );
}

function Check({ checked }) {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: 3,
      border: `1px solid ${checked ? 'var(--fg-0)' : 'var(--bd-strong)'}`,
      background: checked ? 'var(--fg-0)' : 'transparent',
      color: 'var(--bg-0)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && Ico.check}
    </span>
  );
}

// Faux hub-bg behind modal
function FauxHubBg() {
  return (
    <div className="ch-root" style={{ position: 'absolute', inset: 0, display: 'flex', minHeight: 0 }}>
      <div style={{ width: 264, background: 'var(--bg-1)', borderRight: '1px solid var(--bd-soft)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)' }}>
        <div style={{ height: 74, borderBottom: '1px solid var(--bd-soft)' }} />
        <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)' }}>
          <div style={{ flex: 1, background: 'var(--bg-0)' }} />
          <div style={{ flex: 1, background: 'var(--bg-0)' }} />
        </div>
      </div>
    </div>
  );
}

window.SpawnDialog = SpawnDialog;

function AccountCard({ id, sessions, selected }) {
  const a = ACCOUNTS[id];
  const pct = a.usage;
  return (
    <div style={{
      padding: '10px 12px',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: 8, cursor: 'pointer', position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {selected && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.check}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AccountAvatar id={id} size={22} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{a.tier}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: pct > 0.85 ? 'var(--err)' : pct > 0.7 ? 'var(--wait)' : 'var(--live)' }} />
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-2)' }}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>
        {sessions > 0 ? `${sessions} active` : 'idle'} · {a.limit}
      </div>
    </div>
  );
}
