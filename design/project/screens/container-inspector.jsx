// CodeHub — Container / Runtime Inspector. List of running containers
// on the left, focused container detail on the right (specs, env, mounts,
// logs, network, attached sessions).

function ContainerInspector() {
  return (
    <AppChrome w={1440} h={900} title="codehub · containers">
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
          <RailIcon active>{Ico.container}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          <div style={{ padding: '20px 28px 14px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Containers</h1>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>4 running · 1 stopped · docker 25.0 · /var/run/docker.sock</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm">Prune</button>
              <button className="btn sm primary">{Ico.plus}New container</button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* list */}
            <div style={{ flex: '0 0 380px', borderRight: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 6, borderBottom: '1px solid var(--bd-soft)' }}>
                <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All</button>
                <button className="btn xs ghost">Running</button>
                <button className="btn xs ghost">Stopped</button>
              </div>
              <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: 8 }}>
                <ContainerRow id="aurora-cc-3a8f" image="node:20-alpine" repo="aurora-api" branch="feat/auth-rewrite" sessions={[['claude','live'],['codex','wait']]} cpu={47} mem={28} status="live" active />
                <ContainerRow id="dash-cc-7e1a" image="node:20-alpine" repo="dash-web" branch="main" sessions={[['claude','live']]} cpu={31} mem={16} status="live" />
                <ContainerRow id="ml-ag-12fd" image="python:3.12-slim" repo="ml-pipeline" branch="perf/batching" sessions={[['antigravity','idle']]} cpu={2} mem={5} status="idle" />
                <ContainerRow id="aurora-cx-bd2c" image="node:20-alpine" repo="aurora-api" branch="feat/audit-log" sessions={[['codex','done']]} cpu={0} mem={0} status="off" dim />
              </div>
            </div>

            {/* detail */}
            <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: 22 }}>
              {/* hero */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: 'var(--bg-3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--live)',
                }}>
                  <span style={{ transform: 'scale(1.6)' }}>{Ico.container}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 className="mono" style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>aurora-cc-3a8f</h2>
                    <StatusBadge status="live" />
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--fg-2)' }}>
                    node:20-alpine · sha256:8a2b1c…3f8e · up 14m 32s · pid 1184
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm">Exec shell</button>
                  <button className="btn sm">Restart</button>
                  <button className="btn sm danger">Stop</button>
                </div>
              </div>

              {/* metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                <GaugeCard label="CPU" value="47%" max="2 cores" spark={[12, 18, 24, 22, 38, 45, 30, 28, 42, 52, 47]} color="var(--live)" />
                <GaugeCard label="Memory" value="1.2 GiB" max="of 4 GiB" spark={[800, 900, 1100, 1050, 1180, 1240, 1200, 1180, 1190, 1220, 1230]} color="var(--idle)" />
                <GaugeCard label="Net I/O" value="14 KB/s" max="↓ in" spark={[5, 8, 4, 12, 18, 9, 14, 22, 11, 14, 14]} color="var(--fg-1)" />
                <GaugeCard label="Disk" value="284 MB" max="of 10 GB" spark={[100, 150, 180, 200, 230, 260, 270, 274, 278, 281, 284]} color="var(--a-codex)" />
              </div>

              {/* meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <span className="lbl" style={{ whiteSpace: 'nowrap' }}>Attached sessions · 2</span>
                    <span style={{ flex: 1 }} />
                    <button className="btn xs" style={{ whiteSpace: 'nowrap' }}>{Ico.plus}Attach agent</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: 'var(--bg-3)', borderRadius: 6, marginBottom: 4 }}>
                    <StatusDot status="live" pulse />
                    <AgentGlyph agent="claude" size={13} color="var(--a-claude)" />
                    <span className="mono" style={{ fontSize: 12 }}>Claude Code</span>
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>tmux:cc.0 · turn 04:12</span>
                    <IconBtn title="Open">{Ico.arrowR}</IconBtn>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, marginBottom: 8 }}>
                    <StatusDot status="wait" />
                    <AgentGlyph agent="codex" size={13} color="var(--a-codex)" />
                    <span className="mono" style={{ fontSize: 12 }}>Codex</span>
                    <span style={{ flex: 1 }} />
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>tmux:cx.0 · awaiting</span>
                    <IconBtn title="Open">{Ico.arrowR}</IconBtn>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderTop: '1px solid var(--bd-soft)', paddingTop: 10 }}>
                    <span className="lbl" style={{ fontSize: 10 }}>Image</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)' }}>node:20-alpine</span>
                    <span style={{ flex: 1 }} />
                    <Tag>148 MB</Tag>
                  </div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div className="lbl" style={{ marginBottom: 8 }}>Mounts</div>
                  <Mount host="~/work/aurora-api" container="/workspace" mode="rw" />
                  <Mount host="~/.codehub/cache" container="/root/.cache" mode="ro" />
                  <Mount host="~/.codehub/sock" container="/var/run/codehub.sock" mode="rw" />
                </div>
              </div>

              {/* env */}
              <div className="card" style={{ padding: 0, marginBottom: 18 }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="lbl">Environment</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>14 vars</span>
                  <span style={{ flex: 1 }} />
                  <button className="btn xs ghost">Reveal secrets</button>
                </div>
                <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontFamily: 'var(--mono)', fontSize: 11.5 }}>
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
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="lbl">Container log</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>tail -f · docker logs aurora-cc-3a8f</span>
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

function ContainerRow({ id, image, repo, branch, sessions, cpu, mem, status, active, dim }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 7, marginBottom: 4,
      background: active ? 'var(--bg-3)' : 'transparent',
      border: active ? '1px solid var(--bd-strong)' : '1px solid transparent',
      cursor: 'pointer', opacity: dim ? 0.55 : 1,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <StatusDot status={status} pulse={status === 'live'} />
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)', fontWeight: 500 }}>{id}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{image.replace(':', ' ')}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)' }}>
        <span>{repo}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span style={{ color: 'var(--fg-2)' }}>{branch}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {sessions.map(([agent, st], i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 6px', borderRadius: 4,
              background: 'var(--bg-1)', border: '1px solid var(--bd-soft)',
            }}>
              <span className={`dot ${st}`} style={{ width: 5, height: 5 }} />
              <AgentGlyph agent={agent} size={10} color={AGENT_META[agent].accent} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-1)' }}>{AGENT_META[agent].short}</span>
            </span>
          ))}
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>cpu {cpu}% · {mem}%</span>
      </div>
    </div>
  );
}

function GaugeCard({ label, value, max, spark, color }) {
  return (
    <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="lbl" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="mono tnum" style={{ fontSize: 18, color: 'var(--fg-0)', fontWeight: 500 }}>{value}</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{max}</span>
      </div>
      <Spark data={spark} w={140} h={20} color={color} fill />
    </div>
  );
}

function Mount({ host, container, mode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontFamily: 'var(--mono)', fontSize: 11.5 }}>
      <span style={{ color: 'var(--fg-1)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{host}</span>
      <span style={{ color: 'var(--fg-3)' }}>→</span>
      <span style={{ color: 'var(--fg-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{container}</span>
      <Tag color={mode === 'rw' ? 'var(--live)' : 'var(--fg-2)'}>{mode}</Tag>
    </div>
  );
}

function EnvVar({ k, v, secret }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 6px', borderRadius: 4 }}>
      <span style={{ color: 'var(--fg-2)', minWidth: 130 }}>{k}</span>
      <span style={{ color: secret ? 'var(--fg-3)' : 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</span>
      {secret && <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>•</span>}
    </div>
  );
}

window.ContainerInspector = ContainerInspector;
