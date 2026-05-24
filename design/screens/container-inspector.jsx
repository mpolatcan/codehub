// CodeHub — Container / Runtime Inspector. List of running workspace
// containers on the left, focused container detail on the right (specs, env,
// mounts, logs, network, attached agents). Each container belongs to one
// workspace and holds 1–N mounted repos.

function ContainerInspector() {
  return (
    <AppChrome w={1440} h={900} title="codehub · workspaces · runtime">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="workspaces" />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          <div style={{ padding: '1.25rem 1.75rem 0.875rem', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Workspaces</h1>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>4 running · 1 stopped · 1 container per workspace · docker 25.0</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm">Prune stopped</button>
              <button className="btn sm pri solid" title="Create a new workspace">{Ico.plus}New workspace</button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* list */}
            <div style={{ flex: '0 0 380px', borderRight: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.625rem 0.875rem', display: 'flex', gap: '0.375rem', borderBottom: '1px solid var(--bd-soft)' }}>
                <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All</button>
                <button className="btn xs ghost">Running</button>
                <button className="btn xs ghost">Stopped</button>
              </div>
              <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                <ContainerRow id="aurora-cc-3a8f" image="codehub:latest" workspace="aurora-api" repos={['aurora-api','shared']} sessions={[['claude','live'],['codex','wait']]} cpu={47} mem={28} status="live" active />
                <ContainerRow id="dash-cc-7e1a" image="codehub:latest" workspace="dash-web" repos={['dash-web']} sessions={[['claude','live']]} cpu={31} mem={16} status="live" />
                <ContainerRow id="ml-ag-12fd" image="codehub:latest" workspace="ml-pipeline · perf" repos={['ml-pipeline']} sessions={[['antigravity','idle']]} cpu={2} mem={5} status="idle" />
                <ContainerRow id="aurora-cx-bd2c" image="codehub:latest" workspace="audit log spike" repos={['aurora-api']} sessions={[['codex','done']]} cpu={0} mem={0} status="off" dim />
              </div>
            </div>

            {/* detail */}
            <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.375rem' }}>
              {/* hero */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '1.125rem' }}>
                <div style={{
                  width: '2.75rem', height: '2.75rem', borderRadius: '0.5rem',
                  background: 'var(--bg-3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--live)',
                }}>
                  <span style={{ transform: 'scale(1.6)' }}>{Ico.container}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <h2 className="mono" style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>aurora-cc-3a8f</h2>
                    <StatusBadge status="live" />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--fg-2)' }}>
                    node:20-alpine · sha256:8a2b1c…3f8e · up 14m 32s · pid 1184
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button className="btn sm">Exec shell</button>
                  <button className="btn sm">Restart</button>
                  <button className="btn sm danger">Stop</button>
                </div>
              </div>

              {/* metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.125rem' }}>
                <GaugeCard label="CPU" value="47%" max="2 cores" spark={[12, 18, 24, 22, 38, 45, 30, 28, 42, 52, 47]} color="var(--live)" />
                <GaugeCard label="Memory" value="1.2 GiB" max="of 4 GiB" spark={[800, 900, 1100, 1050, 1180, 1240, 1200, 1180, 1190, 1220, 1230]} color="var(--idle)" />
                <GaugeCard label="Net I/O" value="14 KB/s" max="↓ in" spark={[5, 8, 4, 12, 18, 9, 14, 22, 11, 14, 14]} color="var(--fg-1)" />
                <GaugeCard label="Disk" value="284 MB" max="of 10 GB" spark={[100, 150, 180, 200, 230, 260, 270, 274, 278, 281, 284]} color="var(--a-codex)" />
              </div>

              {/* meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.125rem' }}>
                <div className="card" style={{ padding: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <span className="lbl" style={{ whiteSpace: 'nowrap' }}>Attached agents · 2</span>
                    <span style={{ flex: 1 }} />
                    <button className="btn xs" style={{ whiteSpace: 'nowrap' }}>{Ico.plus}Attach agent</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.5rem', background: 'var(--bg-3)', borderRadius: '0.375rem', marginBottom: 4 }}>
                    <StatusDot status="live" pulse />
                    <AgentGlyph agent="claude" size={13} color="var(--a-claude)" />
                    <span className="mono" style={{ fontSize: '0.75rem' }}>Claude Code</span>
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>tmux:cc.0 · turn 04:12</span>
                    <IconBtn title="Open">{Ico.arrowR}</IconBtn>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.5rem', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
                    <StatusDot status="wait" />
                    <AgentGlyph agent="codex" size={13} color="var(--a-codex)" />
                    <span className="mono" style={{ fontSize: '0.75rem' }}>Codex</span>
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>tmux:cx.0 · awaiting</span>
                    <IconBtn title="Open">{Ico.arrowR}</IconBtn>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 0.5rem', borderTop: '1px solid var(--bd-soft)', paddingTop: '0.625rem' }}>
                    <span className="lbl" style={{ fontSize: '0.625rem' }}>Image</span>
                    <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)' }}>node:20-alpine</span>
                    <span style={{ flex: 1 }} />
                    <Tag>148 MB</Tag>
                  </div>
                </div>
                <div className="card" style={{ padding: '0.875rem' }}>
                  <div className="lbl" style={{ marginBottom: '0.5rem' }}>Mounts</div>
                  <Mount host="~/work/aurora-api" container="/workspace" mode="rw" />
                  <Mount host="~/.codehub/cache" container="/root/.cache" mode="ro" />
                  <Mount host="~/.codehub/sock" container="/var/run/codehub.sock" mode="rw" />
                </div>
              </div>

              {/* env */}
              <div className="card" style={{ padding: 0, marginBottom: '1.125rem' }}>
                <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="lbl">Environment</span>
                  <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>14 vars</span>
                  <span style={{ flex: 1 }} />
                  <button className="btn xs ghost">Reveal secrets</button>
                </div>
                <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                  <EnvVar k="NODE_ENV" v="development" />
                  <EnvVar k="DATABASE_URL" v="postgres://*****@db:5432/aurora" secret />
                  <EnvVar k="ANTHROPIC_API_KEY" v="sk-ant-***" secret />
                  <EnvVar k="OPENAI_API_KEY" v="sk-proj-***" secret />
                  <EnvVar k="LOG_LEVEL" v="info" />
                  <EnvVar k="PORT" v="3000" />
                  <EnvVar k="TZ" v="UTC" />
                  <EnvVar k="REDIS_URL" v="redis://cache:6379" />
                </div>
              </div>

              {/* logs */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="lbl">Container log</span>
                  <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>tail -f · docker logs aurora-cc-3a8f</span>
                  <span style={{ flex: 1 }} />
                  <StatusDot status="live" pulse />
                  <button className="btn xs ghost">Pause</button>
                </div>
                <TermBlock lines={[
                  [['meta', '[20:34:18] '], ['info', 'codehub-shim'], ['user', ': starting tmux session cc.0']],
                  [['meta', '[20:34:18] '], ['info', 'codehub-shim'], ['user', ': mounting ~/work/aurora-api at /workspace (rw)']],
                  [['meta', '[20:34:19] '], ['ok', 'ready'], ['meta', '  pid 1184 attached to tty pts/0']],
                  [['meta', '[20:34:24] '], ['user', '$ pnpm install --frozen-lockfile']],
                  [['meta', '[20:34:36] '], ['ok', '✓ '], ['meta', '982 packages, +0 −0 in 11.8s']],
                  [['meta', '[20:36:02] '], ['user', '$ pnpm test src/auth']],
                  [['meta', '[20:36:06] '], ['ok', '✓ '], ['user', '218 passed'], ['meta', ' · 4.21s']],
                  [['meta', '[20:38:42] '], ['warn', '⚠ '], ['user', 'high cpu (47%) · last 10s']],
                  [['meta', '[20:39:11] '], ['user', '$ node --inspect=0.0.0.0:9229']],
                  [['prompt blink', '▍']],
                ]} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function ContainerRow({ id, image, workspace, repos, sessions, cpu, mem, status, active, dim }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '0.4375rem',
      background: active ? 'var(--bg-3)' : 'var(--bg-1)',
      border: '1px solid ' + (active ? 'var(--bd-strong)' : 'var(--bd-soft)'),
      marginBottom: '0.375rem',
      cursor: 'pointer',
      opacity: dim ? 0.55 : 1,
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 2 }}>
        <StatusDot status={status} pulse={status === 'live'} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>{workspace}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{id.slice(-6)}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-1)' }}>
        {(repos || []).map((r, i) => (
          <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {Ico.branch}{r}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {sessions.map(([agent, st], i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '1px 5px', borderRadius: 3,
              background: 'color-mix(in oklab, ' + AGENT_META[agent].accent + ' 12%, transparent)',
              border: '1px solid color-mix(in oklab, ' + AGENT_META[agent].accent + ' 30%, transparent)',
            }}>
              <AgentGlyph agent={agent} size={11} color={AGENT_META[agent].accent} />
              <StatusDot status={st} />
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-2)' }}>
          <span>cpu {cpu}%</span>
          <span>mem {mem}%</span>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.5938rem', color: 'var(--fg-3)', marginTop: 2 }}>{image}</div>
    </div>
  );
}

function GaugeCard({ label, value, max, spark, color }) {
  return (
    <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="lbl" style={{ fontSize: '0.625rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="mono tnum" style={{ fontSize: '1.125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{value}</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{max}</span>
      </div>
      <Spark data={spark} w={140} h={20} color={color} fill />
    </div>
  );
}

function Mount({ host, container, mode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '4px 0', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
      <span style={{ color: 'var(--fg-1)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{host}</span>
      <span style={{ color: 'var(--fg-3)' }}>→</span>
      <span style={{ color: 'var(--fg-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{container}</span>
      <Tag color={mode === 'rw' ? 'var(--live)' : 'var(--fg-2)'}>{mode}</Tag>
    </div>
  );
}

function EnvVar({ k, v, secret }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', padding: '4px 0.375rem', borderRadius: 4 }}>
      <span style={{ color: 'var(--fg-2)', minWidth: '8.125rem' }}>{k}</span>
      <span style={{ color: secret ? 'var(--fg-3)' : 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
      {secret && <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>•</span>}
    </div>
  );
}

window.ContainerInspector = ContainerInspector;
