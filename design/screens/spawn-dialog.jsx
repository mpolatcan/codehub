// CodeHub — Add Agent dialog.
// Modal over the active workspace's hub. Spawns a new agent inside the
// current workspace and group. Picks agent type, account, model, optional
// repo binding, and an initial prompt.

function SpawnDialog() {
  return (
    <AppChrome w={1440} h={900} title="codehub · add agent">
      {/* dimmed bg: faux hub */}
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

        {/* modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '45rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: '0.75rem',
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}>
          {/* head */}
          <div style={{
            padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Add agent to workspace</span>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>aurora-api</span>
            <span style={{ flex: 1 }} />
            <span className="kbd">esc</span>
          </div>

          {/* form */}
          <div style={{ padding: '1.125rem 1.125rem 0.375rem' }}>
            <FormRow label="Agent">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <AgentCard agent="claude" selected />
                <AgentCard agent="codex" />
                <AgentCard agent="antigravity" />
              </div>
            </FormRow>

            <FormRow label="Account">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <AccountCard id="cm" sessions={2} selected />
                <AccountCard id="cw" sessions={0} />
                <AccountCard id="ca" sessions={1} />
              </div>
            </FormRow>

            <FormRow label="Repo binding" optional>
              <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', marginBottom: '0.375rem' }}>
                Set the agent's working directory inside the workspace. Leave on
                Workspace root to let the agent see all repos.
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <BindingChip label="Workspace root" path="/workspace" selected />
                <BindingChip label="aurora-api" path="/workspace/aurora-api" />
                <BindingChip label="shared" path="/workspace/shared" />
              </div>
            </FormRow>

            <FormRow label="Group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                <GroupChip name="Backend" count={2} selected />
                <GroupChip name="Frontend" count={1} />
                <GroupChip name="Exploration" count={0} />
                <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)', marginLeft: '0.375rem' }}>
                  or <span style={{ color: 'var(--fg-1)' }}>+ new group</span>
                </span>
              </div>
            </FormRow>

            <FormRow label="Initial prompt" optional>
              <div style={{
                background: 'var(--bg-0)', border: '1px solid var(--bd)',
                borderRadius: '0.5rem', padding: '0.625rem 0.75rem', minHeight: '4.75rem',
                fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--fg-1)',
                lineHeight: 1.5,
              }}>
                <span style={{ color: 'var(--live)' }}>▸ </span>
                Refactor src/middleware/auth.ts to extract JWT verify into a separate verifier.ts module. Add tests for happy path, expired, malformed, and wrong-issuer cases.
                <span className="blink" style={{ color: 'var(--fg-0)' }}>▍</span>
              </div>
              <div style={{ marginTop: '0.375rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                <Tag style={{ cursor: 'pointer' }}>Fix lint errors</Tag>
                <Tag style={{ cursor: 'pointer' }}>Write tests for…</Tag>
                <Tag style={{ cursor: 'pointer' }}>Review recent diff</Tag>
                <Tag style={{ cursor: 'pointer' }}>+ Templates</Tag>
              </div>
            </FormRow>
          </div>

          {/* foot */}
          <div style={{
            padding: '0.75rem 1.125rem', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>
              attaches to workspace container · spawn ≈ 0.4s · est. cost $0.05–0.20/turn
            </span>
            <span style={{ flex: 1 }} />
            <button className="btn sm">Cancel</button>
            <button className="btn sm pri solid" style={{ padding: '0.375rem 0.875rem' }} title="Add agent (Enter)">
              Add agent <span className="kbd" style={{ marginLeft: '0.375rem' }}>⏎</span>
            </button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function FormRow({ label, optional, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span className="lbl" style={{ color: 'var(--fg-1)' }}>{label}</span>
        {optional && <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>optional</span>}
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
      padding: '0.75rem 0.875rem',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: '0.5rem', cursor: 'pointer',
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: '0.375rem',
    }}>
      {selected && (
        <span style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          width: '1rem', height: '1rem', borderRadius: '50%',
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.check}</span>
      )}
      <AgentGlyph agent={agent} size={18} color={meta.accent} />
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)', marginTop: 2 }}>{meta.name}</div>
      <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{versions[agent]}</div>
    </div>
  );
}

function ContainerOpt({ name, desc, selected }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: '0.5rem', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        {Ico.container}
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{name}</span>
      </div>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{desc}</span>
    </div>
  );
}

function Check({ checked }) {
  return (
    <span style={{
      width: '0.875rem', height: '0.875rem', borderRadius: 3,
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
// Real hub behind the modal — uses the actual MainHubA so the blur shows
// recognizable UI shapes rather than a sketchy placeholder.
function FauxHubBg() {
  const M = window.MainHubA;
  if (!M) {
    return (
      <div className="ch-root" style={{ position: 'absolute', inset: 0, display: 'flex', minHeight: 0 }}>
        <div style={{ width: '16.5rem', background: 'var(--bg-1)', borderRight: '1px solid var(--bd-soft)' }} />
        <div style={{ flex: 1, background: 'var(--bg-1)' }} />
      </div>
    );
  }
  // The real hub is itself an AppChrome at 1440x900; render it but neutralize
  // the outer chrome margins so it fills the dialog backdrop edge-to-edge.
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <M />
    </div>
  );
}

window.FauxHubBg = FauxHubBg;

function BindingChip({ label, path, selected }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
      padding: '4px 0.5625rem', borderRadius: '0.3125rem',
      background: selected ? 'var(--bg-3)' : 'transparent',
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd)'),
      fontSize: '0.75rem',
      color: selected ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer',
    }} title={path}>
      {Ico.branch}<span>{label}</span>
    </span>
  );
}

function GroupChip({ name, count, selected }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      padding: '4px 0.5625rem', borderRadius: '0.3125rem',
      background: selected ? 'var(--bg-3)' : 'transparent',
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd)'),
      fontSize: '0.75rem',
      color: selected ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer',
    }}>
      <span>{name}</span>
      <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>· {count}</span>
    </span>
  );
}

window.SpawnDialog = SpawnDialog;

function AccountCard({ id, sessions, selected }) {
  const a = ACCOUNTS[id];
  const pct = a.usage;
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      background: selected ? 'var(--bg-3)' : 'var(--bg-1)',
      border: `1px solid ${selected ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: '0.5rem', cursor: 'pointer', position: 'relative',
      display: 'flex', flexDirection: 'column', gap: '0.375rem',
    }}>
      {selected && (
        <span style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          width: '1rem', height: '1rem', borderRadius: '50%',
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ico.check}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AccountAvatar id={id} size={22} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
          <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{a.tier}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: '62.4375rem', overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: pct > 0.85 ? 'var(--err)' : pct > 0.7 ? 'var(--wait)' : 'var(--live)' }} />
        </div>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-2)' }}>{Math.round(pct * 100)}%</span>
      </div>
      <div className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>
        {sessions > 0 ? `${sessions} active` : 'idle'} · {a.limit}
      </div>
    </div>
  );
}
