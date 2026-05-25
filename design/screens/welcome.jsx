// CodeHub — Welcome / Workspace launcher.
// First screen users see when no workspace is open. Lists workspaces (recent +
// pinned), with a prominent "New workspace" CTA. Selecting a workspace opens
// it as a tab in the main hub.

function Welcome() {
  return (
    <AppChrome w={1440} h={900} title="codehub · welcome">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" />

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          minWidth: 0, background: 'var(--bg-1)', overflow: 'hidden',
        }}>
          {/* hero band */}
          <div style={{
            padding: '2.5rem 3rem 1.5rem',
            borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'flex-end', gap: '1.5rem',
          }}>
            <div style={{ flex: 1 }}>
              <div className="lbl" style={{ marginBottom: '0.625rem' }}>Workspaces</div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                Pick up where you left off,
                <span style={{ color: 'var(--fg-2)' }}> or start fresh.</span>
              </h1>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--fg-2)', fontSize: '0.8125rem', maxWidth: '32rem', lineHeight: 1.55 }}>
                A workspace bundles repos and a container together. Open one to
                spawn agents inside it.
              </p>
            </div>
            <button className="btn pri solid" style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem' }}
              title="Create a new workspace (⌘⇧N)">
              {Ico.plus}New workspace<span className="kbd">⌘⇧N</span>
            </button>
          </div>

          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.5rem 3rem 2rem' }}>
            {/* Pinned */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="lbl">Pinned</span>
                <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>2</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '0.75rem' }}>
                {window.useStore().workspaces.map((w) => {
                  const agents = w.groups.flatMap((g) => g.panes.filter((p) => p.kind === 'agent').map((p) => ({
                    agent: p.agent, status: p.status,
                  })));
                  return (
                    <WorkspaceCard key={w.id}
                      workspaceId={w.id}
                      name={w.name}
                      repos={w.repos.map((r) => r.name)}
                      container={w.containerSize === 'l' ? 'l · 4 vCPU · 8 GiB' : w.containerSize === 'm' ? 'm · 2 vCPU · 4 GiB' : 's · 1 vCPU · 2 GiB'}
                      lastOpened={w.lastOpened}
                      agents={agents}
                      pinned={w.pinned}
                      active={w.id === window.useStore().activeWorkspaceId} />
                  );
                })}
              </div>
            </div>

            {/* Recent — removed, all workspaces are listed above (driven by Store). */}

            {/* New */}
            <div>
              <div className="lbl" style={{ marginBottom: '0.75rem' }}>Start a new workspace</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '0.75rem' }}>
                <TemplateCard
                  title="Blank workspace"
                  desc="Pick repos and container size yourself."
                  icon={Ico.plus}
                  cta="Start" />
                <TemplateCard
                  title="From GitHub"
                  desc="Clone a repo URL, auto-detect language, pre-configure container."
                  icon={Ico.search}
                  cta="Clone repo" />
                <TemplateCard
                  title="Resume session"
                  desc="Reattach to a recent agent session and continue."
                  icon={Ico.bell}
                  cta="Browse sessions"
                  dim />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function WorkspaceCard({ workspaceId, name, repos, container, lastOpened, agents, pinned, active, onOpen }) {
  return (
    <div onClick={() => workspaceId && window.Store.openWorkspace(workspaceId)} className="card interactive" style={{
      padding: '0.875rem 1rem',
      cursor: 'pointer',
      borderColor: active ? 'var(--pri)' : 'var(--bd)',
      position: 'relative',
    }} role="button">
      {active && (
        <span title="Currently open" style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--pri)',
          padding: '2px 6px', borderRadius: 999,
          background: 'color-mix(in oklab, var(--pri) 12%, transparent)',
        }}>
          <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--pri)' }} />
          open
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {pinned && (
          <span title="Pinned" style={{ color: 'var(--wait)', display: 'inline-flex' }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M9 1l1.2 1.2L8 4.5l3.5 3.5 2.3-2.3L15 6.9l-3 3 2 5-2-1-3-3-3.5 3.5L4 13l3.5-3.5-3-3-1 1-1.2-1.2 2.4-2.3L1 1.7 2.2 0.5 6 4.3 9 1z"/></svg>
          </span>
        )}
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--fg-0)' }}>{name}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.625rem' }}>
        {repos.map((r) => (
          <span key={r} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            padding: '2px 0.5rem', borderRadius: 4,
            background: 'var(--bg-3)', border: '1px solid var(--bd-soft)',
            fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-1)',
          }}>{Ico.branch}{r}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{Ico.container}{container}</span>
        <span style={{ flex: 1 }} />
        <span>{lastOpened}</span>
      </div>
      {agents.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid var(--bd-soft)' }}>
          <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{agents.length} agent{agents.length === 1 ? '' : 's'}</span>
          <span style={{ flex: 1 }} />
          {agents.map((a, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <AgentGlyph agent={a.agent} size={11} color={AGENT_META[a.agent].accent} />
              <StatusDot status={a.status} pulse={a.status === 'live'} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ title, desc, icon, cta, dim }) {
  return (
    <div className="card interactive" style={{
      padding: '1rem',
      cursor: 'pointer',
      opacity: dim ? 0.65 : 1,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }} role="button">
      <div style={{
        width: '2rem', height: '2rem', borderRadius: 6,
        background: 'var(--bg-3)', border: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg-1)',
      }}>{icon}</div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>{title}</div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <button className="btn xs" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>{cta}</button>
    </div>
  );
}

window.Welcome = Welcome;
