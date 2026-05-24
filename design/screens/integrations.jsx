// CodeHub — Integrations. Connect GitHub (and other code hosts) so agents
// can clone repos, push branches, open PRs, comment on issues. Token-based
// connection with explicit scope grants.

function Integrations() {
  return (
    <AppChrome w={1440} h={900} title="codehub · integrations">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="integrations" />

        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-1)', minWidth: 0 }}>
          <nav style={{
            width: '13.75rem', flexShrink: 0, background: 'var(--bg-1)',
            borderRight: '1px solid var(--bd-soft)', padding: '1.25rem 0.75rem',
          }}>
            <h2 style={{ margin: '0 0.375rem 0.875rem', fontSize: '1rem', fontWeight: 600 }}>Settings</h2>
            <NavGroup label="Workspace">
              <NavItem>General</NavItem>
              <NavItem>Agents</NavItem>
              <NavItem>Container runtime</NavItem>
              <NavItem active>Integrations</NavItem>
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

          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
            <div style={{ maxWidth: '51.25rem' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Integrations</h1>
              <p style={{ margin: '0 0 1.75rem', color: 'var(--fg-2)', fontSize: '0.8125rem' }}>
                Connect external services so agents can read context and act on your behalf. Tokens are stored in the OS keychain and injected only into the containers that need them.
              </p>

              {/* GitHub featured */}
              <SectionHead label="Source control" />
              <GitHubCard />

              {/* Other code hosts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1.625rem' }}>
                <IntegrationRow name="GitLab"  desc="Self-hosted or saas.gitlab.com" connected={false} />
                <IntegrationRow name="Bitbucket" desc="Cloud + Data Center" connected={false} />
                <IntegrationRow name="Gitea"   desc="Self-hosted" connected={false} />
                <IntegrationRow name="Sourcehut" desc="git.sr.ht" connected={false} />
              </div>

              <SectionHead label="Project trackers" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.625rem' }}>
                <IntegrationRow name="Linear" desc="Read issues, comment, transition status" connected />
                <IntegrationRow name="Jira" desc="Atlassian cloud + server" connected={false} />
                <IntegrationRow name="Notion" desc="Read docs, append to pages" connected={false} />
                <IntegrationRow name="Asana" desc="Tasks & projects" connected={false} />
              </div>

              <SectionHead label="Observability" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.625rem' }}>
                <IntegrationRow name="Sentry" desc="Pipe runtime errors back to the agent for triage" connected />
                <IntegrationRow name="Datadog" desc="Logs, traces, metrics" connected={false} />
                <IntegrationRow name="Honeycomb" desc="Distributed traces" connected={false} />
                <IntegrationRow name="Grafana" desc="Read panels, query Prometheus" connected={false} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function GitHubCard() {
  return (
    <div className="card" style={{ padding: 0, marginBottom: '0.875rem', overflow: 'hidden' }}>
      {/* header — connection status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--bd-soft)',
      }}>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
          background: 'var(--bg-0)',
          border: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1rem',
        }}>gh</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>GitHub</span>
            <StatusBadge status="live">Connected</StatusBadge>
            <Tag>fine-grained PAT</Tag>
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>
            m-kim · 4 repos · token expires Aug 14
          </div>
        </div>
        <button className="btn sm">Rotate token</button>
        <button className="btn sm ghost danger">Disconnect</button>
      </div>

      {/* scopes granted */}
      <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--bd-soft)' }}>
        <div className="lbl-soft" style={{ marginBottom: '0.5rem', fontSize: '0.6875rem' }}>Scopes granted</div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <ScopeChip label="contents: read+write" granted />
          <ScopeChip label="pull_requests: write" granted />
          <ScopeChip label="issues: write" granted />
          <ScopeChip label="actions: read" granted />
          <ScopeChip label="metadata: read" granted />
          <ScopeChip label="workflow" />
          <ScopeChip label="admin: org" />
        </div>
        <div className="mono" style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--fg-3)' }}>
          Edit scopes on the token at github.com/settings/tokens · changes reflect within ~30s
        </div>
      </div>

      {/* repos */}
      <div style={{ padding: '0.75rem 1.125rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="lbl-soft" style={{ fontSize: '0.6875rem' }}>Available repositories · 4</span>
          <span style={{ flex: 1 }} />
          <button className="btn xs ghost">{Ico.plus}Add repo</button>
          <button className="btn xs ghost">Sync</button>
        </div>
        <RepoRow owner="m-kim" name="aurora-api" desc="Koa-based REST API · TS · pnpm" branches={4} prs={2} attached />
        <RepoRow owner="m-kim" name="dash-web" desc="Next.js · TS · 14k LOC" branches={2} prs={1} attached />
        <RepoRow owner="aurora-corp" name="ml-pipeline" desc="Python · 3.12 · poetry · 23k LOC" branches={5} prs={0} attached />
        <RepoRow owner="m-kim" name="infra" desc="Terraform + Kubernetes" branches={1} prs={0} />
      </div>

      {/* what agents can do */}
      <div style={{
        padding: '0.75rem 1.125rem', borderTop: '1px solid var(--bd-soft)',
        background: 'var(--bg-1)',
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        fontSize: '0.75rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)',
      }}>
        <span className="lbl-soft" style={{ fontSize: '0.6875rem' }}>agents can</span>
        <span style={{ color: 'var(--fg-1)' }}>clone</span>
        <span style={{ color: 'var(--fg-1)' }}>fetch</span>
        <span style={{ color: 'var(--fg-1)' }}>push</span>
        <span style={{ color: 'var(--fg-1)' }}>open PR</span>
        <span style={{ color: 'var(--fg-1)' }}>comment</span>
        <span style={{ color: 'var(--fg-1)' }}>read issues</span>
        <span style={{ color: 'var(--fg-3)' }}>can't:</span>
        <span style={{ color: 'var(--fg-3)' }}>force-push</span>
        <span style={{ color: 'var(--fg-3)' }}>delete branch</span>
        <span style={{ color: 'var(--fg-3)' }}>merge</span>
        <span style={{ flex: 1 }} />
        <button className="btn xs ghost">Edit permissions</button>
      </div>
    </div>
  );
}

function ScopeChip({ label, granted }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
      padding: '3px 0.5rem', borderRadius: 4,
      fontFamily: 'var(--mono)', fontSize: '0.6875rem',
      color: granted ? 'var(--live)' : 'var(--fg-3)',
      background: granted ? 'color-mix(in oklab, var(--live) 10%, transparent)' : 'var(--bg-3)',
      border: `1px solid ${granted ? 'color-mix(in oklab, var(--live) 30%, transparent)' : 'var(--bd)'}`,
    }}>
      <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: granted ? 'var(--live)' : 'var(--fg-3)' }} />
      {label}
    </span>
  );
}

function RepoRow({ owner, name, desc, branches, prs, attached }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.625rem 0.5rem',
      borderBottom: '1px solid var(--bd-soft)',
    }}>
      <span style={{
        width: '1.375rem', height: '1.375rem', borderRadius: 4,
        background: 'var(--bg-3)', color: 'var(--fg-1)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{Ico.files}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>{owner}/</span>
          <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
          {attached && <Tag color="var(--live)">cloned</Tag>}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {Ico.branch}<span>{branches}</span>
      </span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{prs} PRs open</span>
      <button className="btn xs">{attached ? 'Open' : 'Clone'}</button>
    </div>
  );
}

function IntegrationRow({ name, desc, connected }) {
  const letter = name[0];
  return (
    <div className="card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{
        width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
        background: 'var(--bg-3)',
        border: '1px solid var(--bd)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '0.8125rem',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{letter}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      {connected ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', fontSize: '0.75rem', color: 'var(--live)', whiteSpace: 'nowrap' }}>
          <StatusDot status="live" /> Connected
        </span>
      ) : (
        <button className="btn xs">Connect</button>
      )}
    </div>
  );
}

window.Integrations = Integrations;
