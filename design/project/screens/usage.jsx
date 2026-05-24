// CodeHub — Usage. Per-account subscription + quota breakdown across Claude,
// Codex, and Gemini accounts. Shows what's remaining, what's renewing when,
// and forecasts depletion at the current rate.

function Usage() {
  return (
    <AppChrome w={1440} h={900} title="codehub · usage">
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
          <RailIcon>{Ico.container}</RailIcon>
          <RailIcon active>{Ico.cpu}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* header */}
          <div style={{ padding: '20px 28px 14px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Usage</h1>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>6 accounts · $192.17 / $400 monthly budget · cycle ends in 9 days</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm ghost">Export CSV</button>
              <button className="btn sm">{Ico.plus}Add account</button>
            </div>

            {/* aggregate strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              <SummaryCell label="this month" value="$192.17" delta="+18%" deltaTone="up" subtle="48% of $400 budget" gauge={0.48} gaugeColor="var(--live)" />
              <SummaryCell label="approaching limit" value="1 account" subtle="aurora-bot API · 92%" tone="warn" />
              <SummaryCell label="renews in" value="9 days" subtle="2 plans renew Jun 1" />
              <SummaryCell label="tokens · 30d" value="14.8M" subtle="+22% vs last month" />
              <SummaryCell label="turns · 30d" value="847" subtle="$0.23 avg / turn" />
            </div>
          </div>

          {/* filter row */}
          <div style={{
            padding: '10px 28px', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-1)',
          }}>
            <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All · 6</button>
            <button className="btn xs ghost">Claude · 3</button>
            <button className="btn xs ghost">Codex · 2</button>
            <button className="btn xs ghost">Gemini · 1</button>
            <div className="vr" style={{ height: 18, margin: '0 6px' }} />
            <button className="btn xs ghost">Subscriptions</button>
            <button className="btn xs ghost">API · pay-as-go</button>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>updated 4s ago</span>
          </div>

          {/* cards */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Claude Max — subscription with rate windows */}
            <UsageCard
              id="cm"
              agent="claude"
              planName="Claude Max"
              planPrice="$200 / mo"
              renew="renews May 31 · 9 days"
              status="active"
              meters={[
                { label: '5-hour window', used: 142, max: 240, unit: 'messages', sub: 'resets in 02:14 · ~24 turns / hour avg' },
                { label: 'weekly hours', used: 18.4, max: 40, unit: 'h', sub: 'resets Mon · ~3.7h / day at this pace' },
                { label: 'opus 4.7 monthly', used: 0.62, max: 1.0, unit: '', sub: 'soft cap · ≈ 5× Pro' },
              ]}
              spark={[12,18,24,22,38,45,30,28,42,52,47,38,42]}
              forecast={{ tone: 'ok', text: '≈ 18 hours until 5-hour window resets at current pace' }}
            />

            {/* Claude Team — work seat */}
            <UsageCard
              id="cw"
              agent="claude"
              planName="Claude Team"
              planPrice="seat · $30 / mo"
              renew="org-billed · renews Jun 1"
              status="active"
              meters={[
                { label: '5-hour window', used: 38, max: 200, unit: 'messages', sub: 'shared pool · 200/seat' },
                { label: 'team-wide seats', used: 14, max: 25, unit: '', sub: 'aurora-corp · admin: ops@aurora' },
              ]}
              spark={[4,6,8,5,9,11,7,8,10,9,12,9,8]}
              forecast={{ tone: 'ok', text: 'comfortably under limit · team seat pool sufficient' }}
            />

            {/* Claude API — pay-as-you-go with budget alert */}
            <UsageCard
              id="ca"
              agent="claude"
              planName="API · Anthropic"
              planPrice="pay-as-you-go"
              renew="cycle ends May 31 · 9 days"
              status="warn"
              alert="92% of monthly budget — auto-pause at 100%"
              meters={[
                { label: 'monthly spend', used: 184.20, max: 200.00, unit: '$', sub: 'auto-pause at $200 · cap raises by 50% next cycle if utilization > 80%' },
                { label: 'requests per minute', used: 28, max: 60, unit: 'rpm', sub: 'org-wide RPM (tier 4)' },
                { label: 'output tokens / day', used: 2.4, max: 5.0, unit: 'M', sub: 'tier 4 daily output cap' },
              ]}
              spark={[8,10,12,18,22,28,32,30,28,25,32,28,30]}
              forecast={{ tone: 'over', text: 'depletes budget in ~38 hours at current rate. Pause or raise cap.' }}
            />

            {/* OpenAI Plus — Codex */}
            <UsageCard
              id="cx"
              agent="codex"
              planName="ChatGPT Plus"
              planPrice="$20 / mo"
              renew="renews Jun 4 · 13 days"
              status="active"
              meters={[
                { label: 'codex messages (3h)', used: 42, max: 150, unit: '', sub: 'rolling window · resets continuously' },
                { label: 'gpt-5 monthly', used: 0.31, max: 1.0, unit: '', sub: 'tier limit · ~10× free' },
                { label: 'o4-mini (3h)', used: 18, max: 100, unit: '', sub: 'fast model · separate pool' },
              ]}
              spark={[6,4,8,10,5,9,12,8,11,7,9,8,10]}
              forecast={{ tone: 'ok', text: 'low utilization · plenty of headroom' }}
            />

            {/* OpenAI API */}
            <UsageCard
              id="cxa"
              agent="codex"
              planName="API · OpenAI"
              planPrice="pay-as-you-go"
              renew="cycle ends Jun 1 · 10 days"
              status="active"
              meters={[
                { label: 'monthly spend', used: 12.84, max: 100.00, unit: '$', sub: 'soft cap $100 / hard $250' },
                { label: 'requests / min', used: 12, max: 500, unit: 'rpm', sub: 'tier 2' },
              ]}
              spark={[2,3,2,4,3,5,4,6,5,4,5,6,5]}
              forecast={{ tone: 'ok', text: 'tracking at $42/mo run rate · well under cap' }}
            />

            {/* Google AI — Gemini / Antigravity */}
            <UsageCard
              id="ag"
              agent="antigravity"
              planName="Google AI · free"
              planPrice="$0"
              renew="rolling · no renewal"
              status="active"
              meters={[
                { label: 'requests / day', used: 38, max: 1500, unit: 'req', sub: 'gemini-2.5-pro · free tier daily quota' },
                { label: 'requests / min', used: 4, max: 15, unit: 'rpm', sub: 'free tier rate limit' },
              ]}
              spark={[2,3,4,2,5,3,6,4,5,3,4,5,4]}
              forecast={{ tone: 'ok', text: 'free tier · upgrade to AI Ultra for higher caps' }}
              upgradeHint="Upgrade to AI Ultra · $20/mo"
            />
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

// ── SUMMARY CELL ─────────────────────────────────────────────────────────
function SummaryCell({ label, value, delta, deltaTone, subtle, tone, gauge, gaugeColor }) {
  const toneCol = tone === 'warn' ? 'var(--wait)' : tone === 'over' ? 'var(--err)' : 'var(--fg-0)';
  const dtone = deltaTone === 'up' ? 'var(--live)' : deltaTone === 'down' ? 'var(--err)' : 'var(--fg-2)';
  return (
    <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="lbl">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="mono tnum" style={{ fontSize: 22, color: toneCol, fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</span>
        {delta && <span className="mono" style={{ fontSize: 11, color: dtone }}>{delta}</span>}
      </div>
      {gauge !== undefined && (
        <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${gauge * 100}%`, height: '100%', background: gaugeColor || 'var(--fg-1)' }} />
        </div>
      )}
      <div className="mono" style={{ fontSize: 11, color: tone === 'warn' ? 'var(--wait)' : tone === 'over' ? 'var(--err)' : 'var(--fg-2)' }}>{subtle}</div>
    </div>
  );
}

// ── USAGE CARD ───────────────────────────────────────────────────────────
function UsageCard({ id, agent, planName, planPrice, renew, status, alert, meters, spark, forecast, upgradeHint }) {
  const a = ACCOUNTS[id];
  const accentBd =
    status === 'warn' ? 'color-mix(in oklab, var(--wait) 35%, var(--bd))' :
    status === 'over' ? 'color-mix(in oklab, var(--err) 35%, var(--bd))' :
    'var(--bd)';
  const accentBg = status === 'warn' ? 'color-mix(in oklab, var(--wait) 4%, var(--bg-2))' :
                   status === 'over' ? 'color-mix(in oklab, var(--err) 4%, var(--bg-2))' :
                   'var(--bg-2)';
  return (
    <div className="card" style={{
      padding: 0, display: 'flex', overflow: 'hidden',
      borderColor: accentBd, background: accentBg,
    }}>
      {/* LEFT — account identity */}
      <div style={{ flex: '0 0 280px', padding: '16px 18px', borderRight: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <AccountAvatar id={id} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <AgentGlyph agent={agent} size={12} color={AGENT_META[agent].accent} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg-0)' }}>{a.name}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{planName}</div>
          </div>
          {status === 'warn' && <Tag color="var(--wait)">warn</Tag>}
          {status === 'over' && <Tag color="var(--err)">over</Tag>}
          {status === 'active' && <StatusBadge status="live">Active</StatusBadge>}
        </div>

        {/* sparkline */}
        <div style={{ marginTop: 'auto' }}>
          <div className="lbl-soft" style={{ marginBottom: 4 }}>last 13 days</div>
          <Spark data={spark} w={244} h={28} color="var(--fg-1)" fill />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>
          <div><span style={{ color: 'var(--fg-3)' }}>plan</span> <span style={{ color: 'var(--fg-1)' }}>{planPrice}</span></div>
          <div><span style={{ color: 'var(--fg-3)' }}>renewal</span> <span style={{ color: 'var(--fg-1)' }}>{renew}</span></div>
        </div>
      </div>

      {/* CENTER — meters */}
      <div style={{ flex: 1, padding: '16px 22px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {alert && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            background: 'color-mix(in oklab, var(--wait) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--wait) 35%, transparent)',
            color: 'var(--wait)',
            fontSize: 11.5, fontFamily: 'var(--mono)',
          }}>
            <span style={{ fontSize: 12 }}>⚠</span>
            <span>{alert}</span>
          </div>
        )}

        {meters.map((m, i) => <UsageMeter key={i} {...m} />)}

        {/* forecast */}
        <div style={{
          marginTop: 'auto',
          padding: '8px 0 0',
          borderTop: '1px dashed var(--bd-soft)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11.5, color: forecast.tone === 'over' ? 'var(--err)' : forecast.tone === 'warn' ? 'var(--wait)' : 'var(--fg-2)',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>forecast</span>
          <span>{forecast.text}</span>
        </div>
      </div>

      {/* RIGHT — actions */}
      <div style={{ flex: '0 0 170px', padding: '16px 18px', borderLeft: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {status === 'warn' && <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>Raise cap</button>}
        {upgradeHint && <button className="btn sm primary" style={{ width: '100%', justifyContent: 'center', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2, padding: '8px 10px' }}>{upgradeHint}</button>}
        <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>Manage plan</button>
        <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'center' }}>Set budget alert</button>
        <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'center' }}>Billing history</button>
        <span style={{ flex: 1 }} />
        <button className="btn sm ghost danger" style={{ width: '100%', justifyContent: 'center' }}>Remove</button>
      </div>
    </div>
  );
}

// ── METER (single quota line) ────────────────────────────────────────────
function UsageMeter({ label, used, max, unit, sub }) {
  const pct = Math.min(1, used / max);
  const color = pct > 0.85 ? 'var(--err)' : pct > 0.7 ? 'var(--wait)' : 'var(--live)';
  const fmt = (v) => {
    if (unit === '$') return '$' + v.toFixed(2);
    if (unit === 'M') return v.toFixed(2) + 'M';
    if (unit === '') return Math.round(v * 100) + '%';
    return v + (unit ? ' ' + unit : '');
  };
  const fmtMax = (v) => {
    if (unit === '$') return '$' + v.toFixed(2);
    if (unit === 'M') return v.toFixed(1) + 'M';
    if (unit === '') return '100%';
    return v + (unit ? ' ' + unit : '');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-1)' }}>{label}</span>
        <span style={{ flex: 1 }} />
        <span className="mono tnum" style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>
          {fmt(used)}
          <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}> / {fmtMax(max)}</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color }} />
      </div>
      {sub && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{sub}</div>}
    </div>
  );
}

window.Usage = Usage;
