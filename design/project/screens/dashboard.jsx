// CodeHub — Agent Dashboard. At-a-glance state of every session, aggregate
// usage charts, and a queue of things needing attention. Read-mostly.

function Dashboard() {
  return (
    <AppChrome w={1440} h={900} title="codehub · dashboard">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* COLLAPSED RAIL */}
        <aside style={{
          width: 52, background: 'var(--bg-0)', borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0',
        }}>
          <div style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--bd-soft)', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon>{Ico.hub}</RailIcon>
          <RailIcon active badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <RailIcon>{Ico.search}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.bell}</RailIcon>
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* header */}
          <div style={{ padding: '20px 28px 14px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Dashboard</h1>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>5 sessions · 3 containers · $4.42 today</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm">{Ico.plus}New agent</button>
            </div>
          </div>

          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {/* TOP METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
              <Metric label="Running" value="3" sub="of 5 sessions" accent="live" spark={[2,3,2,3,4,3,3,3]} />
              <Metric label="Awaiting input" value="1" sub="codex · aurora-api" accent="wait" />
              <Metric label="Tokens · 24h" value="1.84M" sub="+12% vs yesterday" delta="up" spark={[12,14,18,22,30,28,42,52,47]} />
              <Metric label="Cost · 24h" value="$8.74" sub="$0.18 / turn avg" spark={[6,8,9,11,14,12,18,22,20]} />
              <Metric label="Context · avg" value="42%" sub="148k / 350k" gauge={0.42} />
            </div>

            {/* SESSIONS TABLE + ATTENTION QUEUE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
              {/* table */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--bd-soft)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Sessions</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All</button>
                    <button className="btn xs ghost">Running</button>
                    <button className="btn xs ghost">Mine</button>
                  </div>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>updated 2s ago</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-1)' }}>
                      <Th>Session</Th>
                      <Th>Status</Th>
                      <Th>Task</Th>
                      <Th>Branch</Th>
                      <Th align="right">Turn</Th>
                      <Th align="right">Tokens</Th>
                      <Th align="right">CPU</Th>
                      <Th align="right">$</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    <Row agent="claude" name="aurora-api" status="live" task="Refactoring auth middleware" branch="feat/auth-rewrite" turn="04:12" tokens="184.2k" cpu={47} cost="2.31" />
                    <Row agent="codex" name="aurora-api" status="wait" task="Migration awaiting approval" branch="feat/audit-log" turn="00:14" tokens="22.6k" cpu={3} cost="0.31" badge />
                    <Row agent="claude" name="dash-web" status="live" task="Fix lint errors across components/" branch="main" turn="02:48" tokens="64.0k" cpu={31} cost="0.81" />
                    <Row agent="antigravity" name="ml-pipeline" status="idle" task="Profiling complete · 3 hotspots" branch="perf/batching" turn="—" tokens="92.4k" cpu={2} cost="1.10" />
                    <Row agent="codex" name="aurora-api" status="done" task="Done · 14 files changed" branch="feat/audit-log" turn="—" tokens="58.0k" cpu={0} cost="0.41" dim />
                  </tbody>
                </table>
              </div>

              {/* attention queue */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wait)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Needs attention</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>2</span>
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AttentionItem agent="codex" name="aurora-api"
                    title="Approve pnpm migrate:up?"
                    sub="Modifies database — irreversible"
                    age="just now" tone="wait" />
                  <AttentionItem agent="claude" name="dash-web"
                    title="Container restart needed"
                    sub="ENOENT on /tmp/snap-3"
                    age="34m" tone="err" />
                </div>

                <div style={{ padding: 12, borderTop: '1px solid var(--bd-soft)', marginTop: 'auto' }}>
                  <div className="lbl" style={{ marginBottom: 8 }}>Containers</div>
                  <ContainerBar name="aurora-cc-3a8f" cpu={47} mem={28} />
                  <ContainerBar name="aurora-cx-bd2c" cpu={3} mem={6} />
                  <ContainerBar name="dash-cc-7e1a" cpu={31} mem={16} />
                  <ContainerBar name="ml-ag-12fd" cpu={2} mem={5} />
                </div>
              </div>
            </div>

            {/* BOTTOM: usage chart + account usage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Activity · last 24h</span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>turns / hour</span>
                  <span style={{ flex: 1 }} />
                  <Legend color="var(--a-claude)" label="Claude" />
                  <Legend color="var(--a-codex)" label="Codex" />
                  <Legend color="var(--a-antigravity)" label="Antigravity" />
                </div>
                <ActivityChart />
              </div>

              {/* Account usage card */}
              <div className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Accounts · this month</span>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>4 active across 3 agents</span>
                  <span style={{ flex: 1 }} />
                  <button className="btn xs ghost">{Ico.plus}Add account</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <AccountUsageRow id="cm" tokens="892k" cost="$4.81" turns={142} pct={0.58} />
                  <AccountUsageRow id="cw" tokens="324k" cost="$0.00" turns={56}  pct={0.21} note="seat" />
                  <AccountUsageRow id="ca" tokens="3.4M" cost="$184.20" turns={420} pct={0.92} budget="$200" />
                  <AccountUsageRow id="cx" tokens="412k" cost="$2.16" turns={88}  pct={0.31} />
                  <AccountUsageRow id="ag" tokens="148k" cost="$0.00" turns={18}  pct={0.18} note="free" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function AccountUsageRow({ id, tokens, cost, turns, pct, note, budget }) {
  const a = ACCOUNTS[id];
  const barColor = pct > 0.85 ? 'var(--err)' : pct > 0.7 ? 'var(--wait)' : 'var(--live)';
  const costColor = pct > 0.85 ? 'var(--spend-over)' : pct > 0.7 ? 'var(--spend-warn)' : cost === '$0.00' ? 'var(--fg-2)' : 'var(--fg-0)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <AccountAvatar id={id} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{a.name}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AgentGlyph agent={a.agent} size={10} color={AGENT_META[a.agent].accent} />
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>{a.tier}</span>
          </span>
          {note && <Tag>{note}</Tag>}
        </div>
        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: barColor }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)', whiteSpace: 'nowrap' }}>
        <span><span style={{ color: 'var(--fg-3)' }}>tok </span>{tokens}</span>
        <span><span style={{ color: 'var(--fg-3)' }}>turns </span>{turns}</span>
        <span style={{ color: costColor }}>{cost}{budget && <span style={{ color: 'var(--fg-3)' }}>/{budget}</span>}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, spark, accent, gauge, delta }) {
  const accentColor = accent === 'live' ? 'var(--live)' : accent === 'wait' ? 'var(--wait)' : 'var(--fg-1)';
  const deltaColor = delta === 'up' ? 'var(--live)' : delta === 'down' ? 'var(--err)' : 'var(--fg-2)';
  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="lbl">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="mono tnum" style={{ fontSize: 26, color: 'var(--fg-0)', fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</span>
        {spark && <Spark data={spark} w={70} h={20} color={accentColor} fill />}
      </div>
      {gauge !== undefined && (
        <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', marginTop: 2 }}>
          <div style={{ width: `${gauge * 100}%`, height: '100%', background: gauge > 0.85 ? 'var(--err)' : gauge > 0.7 ? 'var(--wait)' : 'var(--live)' }} />
        </div>
      )}
      <div className="mono" style={{ fontSize: 11, color: accent ? accentColor : deltaColor }}>{sub}</div>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th style={{
      textAlign: align || 'left', padding: '8px 14px',
      fontWeight: 500, color: 'var(--fg-2)',
      fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase',
      borderBottom: '1px solid var(--bd-soft)',
    }}>{children}</th>
  );
}

function Row({ agent, name, status, task, branch, turn, tokens, cpu, cost, badge, dim }) {
  return (
    <tr style={{ opacity: dim ? 0.55 : 1, borderBottom: '1px solid var(--bd-soft)' }}>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AgentGlyph agent={agent} size={13} color={AGENT_META[agent].accent} />
          <span className="mono" style={{ color: 'var(--fg-0)' }}>{name}</span>
        </div>
      </Td>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={status} />
          {badge && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--wait)', boxShadow: '0 0 0 2px color-mix(in oklab, var(--wait) 30%, transparent)' }} />}
        </div>
      </Td>
      <Td><span style={{ color: 'var(--fg-1)' }}>{task}</span></Td>
      <Td><span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{branch}</span></Td>
      <Td align="right"><span className="mono tnum">{turn}</span></Td>
      <Td align="right"><span className="mono tnum">{tokens}</span></Td>
      <Td align="right">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <div className="bar thin" style={{ width: 36 }}><i style={{ width: `${cpu}%`, background: cpu > 60 ? 'var(--wait)' : 'var(--fg-1)' }} /></div>
          <span className="mono tnum" style={{ minWidth: 26 }}>{cpu}%</span>
        </div>
      </Td>
      <Td align="right"><span className="mono tnum">${cost}</span></Td>
      <Td align="right"><IconBtn title="Open">{Ico.arrowR}</IconBtn></Td>
    </tr>
  );
}
function Td({ children, align }) {
  return <td style={{ padding: '10px 14px', textAlign: align || 'left', verticalAlign: 'middle' }}>{children}</td>;
}

function AttentionItem({ agent, name, title, sub, age, tone }) {
  const c = tone === 'wait' ? 'var(--wait)' : tone === 'err' ? 'var(--err)' : 'var(--fg-1)';
  return (
    <div style={{
      padding: 12,
      border: `1px solid color-mix(in oklab, ${c} 30%, var(--bd))`,
      borderRadius: 7,
      background: `color-mix(in oklab, ${c} 6%, transparent)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <AgentGlyph agent={agent} size={12} color={AGENT_META[agent].accent} />
        <span className="mono" style={{ fontSize: 11.5 }}>{name}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{age}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--fg-0)', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-2)', marginBottom: 10 }}>{sub}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {tone === 'wait' ? (
          <button className="btn ok solid sm" style={{ flex: 1 }}>Approve<span className="kbd">⏎</span></button>
        ) : (
          <button className="btn sm" style={{ flex: 1 }}>Open session</button>
        )}
        <button className="btn ghost sm">Dismiss</button>
      </div>
    </div>
  );
}

function ContainerBar({ name, cpu, mem }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-1)', marginBottom: 4 }}>
        <span>{name}</span>
        <span style={{ color: 'var(--fg-2)' }}>cpu {cpu}% · mem {mem}%</span>
      </div>
      <div style={{ display: 'flex', gap: 3, height: 4 }}>
        <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${cpu}%`, height: '100%', background: cpu > 60 ? 'var(--wait)' : 'var(--live)' }} />
        </div>
        <div style={{ flex: 1, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${mem}%`, height: '100%', background: 'var(--idle)' }} />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-1)' }}>
      <span style={{ width: 9, height: 2, background: color, borderRadius: 2 }} />
      {label}
    </span>
  );
}

function ActivityChart() {
  // 24 hour stacked bars; each hour has 3 segments
  const hours = Array.from({ length: 24 }, (_, h) => ({
    h,
    claude: Math.max(0, Math.round(8 + Math.sin(h / 3) * 6 + (h > 9 && h < 19 ? 4 : 0))),
    codex: Math.max(0, Math.round(3 + Math.cos(h / 2) * 2 + (h > 14 && h < 20 ? 3 : 0))),
    ag: Math.max(0, Math.round(2 + Math.sin(h / 4 + 1) * 2)),
  }));
  const max = Math.max(...hours.map(d => d.claude + d.codex + d.ag));
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {hours.map((d, i) => {
          const total = d.claude + d.codex + d.ag;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1 }}>
              <div style={{ height: `${(d.ag / max) * 100}%`, background: 'var(--a-antigravity)', minHeight: d.ag > 0 ? 2 : 0, borderRadius: '2px 2px 0 0' }} />
              <div style={{ height: `${(d.codex / max) * 100}%`, background: 'var(--a-codex)', minHeight: d.codex > 0 ? 2 : 0 }} />
              <div style={{ height: `${(d.claude / max) * 100}%`, background: 'var(--a-claude)', minHeight: d.claude > 0 ? 2 : 0 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
        {hours.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>{i % 4 === 0 ? `${String(i).padStart(2, '0')}:00` : '·'}</div>
        ))}
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
