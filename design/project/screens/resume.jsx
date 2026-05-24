// CodeHub — Resume. Library of past sessions you can pick up where you left
// off. Filterable, searchable. Pick one and it spawns in a pane with the
// original tmux scrollback + agent context restored.

function Resume() {
  return (
    <AppChrome w={1440} h={900} title="codehub · resume">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 52, background: 'var(--bg-0)', borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0',
        }}>
          <div style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--bd-soft)', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon active>{Ico.hub}</RailIcon>
          <RailIcon badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* header */}
          <div style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}>Resume</h1>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-2)' }}>past sessions · tmux scrollback + agent context restored on resume</span>
              <span style={{ flex: 1 }} />
              <button className="btn sm ghost">{Ico.plus}New agent</button>
              <button className="btn sm">{Ico.search}<input type="text" placeholder="search transcripts…" style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontSize: 12, width: 160 }} /></button>
            </div>

            {/* filter row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All · 24</button>
              <button className="btn xs ghost">Today · 6</button>
              <button className="btn xs ghost">This week · 18</button>
              <button className="btn xs ghost">Older</button>
              <div className="vr" style={{ height: 18, margin: '0 6px' }} />
              <button className="btn xs ghost">
                <AgentGlyph agent="claude" size={11} color="var(--a-claude)" /> Claude · 14
              </button>
              <button className="btn xs ghost">
                <AgentGlyph agent="codex" size={11} color="var(--a-codex)" /> Codex · 7
              </button>
              <button className="btn xs ghost">
                <AgentGlyph agent="antigravity" size={11} color="var(--a-antigravity)" /> Antigravity · 3
              </button>
              <div className="vr" style={{ height: 18, margin: '0 6px' }} />
              <button className="btn xs ghost">Done · 16</button>
              <button className="btn xs ghost">Aborted · 5</button>
              <button className="btn xs ghost">Failed · 3</button>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>sort: recent activity ▾</span>
            </div>
          </div>

          {/* list */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 28px' }}>
            <DateGroup label="Today">
              <SessionResumeRow
                agent="claude" name="aurora-api" branch="feat/auth-rewrite"
                title="Refactor src/middleware/auth.ts to extract JWT verify"
                lastTurn="…and the tests pass — 218/218. Want me to open a PR or keep iterating on edge cases?"
                turns={14} tokens="184.2k" cost="$2.31" edits={14}
                age="20 min ago" status="paused" account="cm"
                container="aurora-cc-3a8f" containerLive
                resumable
              />
              <SessionResumeRow
                agent="codex" name="aurora-api" branch="feat/audit-log"
                title="Write migration for audit_log table with FK to users"
                lastTurn="Awaiting approval to run pnpm migrate:up — should I proceed?"
                turns={6} tokens="22.6k" cost="$0.31" edits={1}
                age="42 min ago" status="awaiting" account="cx"
                container="aurora-cx-bd2c"
                resumable
              />
              <SessionResumeRow
                agent="claude" name="dash-web" branch="main"
                title="Fix lint errors across components/"
                lastTurn="All 47 errors resolved across 12 files. Should I run prettier next?"
                turns={9} tokens="64.0k" cost="$0.81" edits={12}
                age="2 hours ago" status="done" account="cw"
              />
            </DateGroup>

            <DateGroup label="Yesterday">
              <SessionResumeRow
                agent="antigravity" name="ml-pipeline" branch="perf/batching"
                title="Profile slow batches in pipeline/run.py"
                lastTurn="Done · 3 optimization candidates. Suggested: vectorize normalize() with numpy."
                turns={11} tokens="92.4k" cost="$1.10" edits={0}
                age="1 day ago" status="done" account="ag"
              />
              <SessionResumeRow
                agent="claude" name="aurora-api" branch="feat/rate-limit"
                title="Add per-IP rate limiting middleware"
                lastTurn="Failed: container ran out of memory while installing redis client."
                turns={4} tokens="38.2k" cost="$0.48" edits={2}
                age="1 day ago" status="failed" account="cm"
                failureReason="OOM · 4 GiB exceeded"
              />
              <SessionResumeRow
                agent="claude" name="dash-web" branch="ui/loading-states"
                title="Add skeleton loaders to dashboard cards"
                lastTurn="(stopped) — user closed without saving"
                turns={3} tokens="14.8k" cost="$0.18" edits={6}
                age="1 day ago" status="aborted" account="cw"
              />
            </DateGroup>

            <DateGroup label="May 19 — earlier this week">
              <SessionResumeRow
                agent="codex" name="aurora-api" branch="feat/audit-log"
                title="Initial scaffolding for audit log feature"
                lastTurn="Drafted schema, controller, and 4 tests. Ready for review."
                turns={18} tokens="58.0k" cost="$0.41" edits={14}
                age="3 days ago" status="done" account="cx"
              />
            </DateGroup>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function DateGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span className="lbl" style={{ fontSize: 10.5 }}>{label}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--bd-soft)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function SessionResumeRow({ agent, name, branch, title, lastTurn, turns, tokens, cost, edits, age, status, account, container, containerLive, resumable, failureReason }) {
  const meta = AGENT_META[agent];

  const statusMap = {
    paused:    { color: 'var(--idle)', label: 'Paused' },
    awaiting:  { color: 'var(--wait)', label: 'Awaiting' },
    done:      { color: 'var(--live)', label: 'Done' },
    failed:    { color: 'var(--err)', label: 'Failed' },
    aborted:   { color: 'var(--fg-3)', label: 'Aborted' },
  };
  const sc = statusMap[status] || statusMap.done;

  return (
    <div className="card" style={{ padding: 0, display: 'flex', overflow: 'hidden' }}>
      {/* status rail */}
      <span style={{ width: 3, background: sc.color, flexShrink: 0 }} />

      {/* identity */}
      <div style={{ flex: '0 0 230px', padding: '12px 14px', borderRight: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AgentGlyph agent={agent} size={13} color={meta.accent} />
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
          <AccountAvatar id={account} size={13} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-2)' }}>
          {Ico.branch}<span>{branch}</span>
        </div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
          <span style={{ color: sc.color }}>{sc.label}</span>
          <span>·</span>
          <span>{age}</span>
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, padding: '12px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, color: 'var(--fg-0)', fontWeight: 500 }}>{title}</div>
        <div style={{
          fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.5,
          padding: '6px 10px', background: 'var(--bg-1)',
          borderLeft: `2px solid ${sc.color}`,
          borderRadius: 4,
          fontFamily: 'var(--mono)',
        }}>
          <span style={{ color: 'var(--fg-3)', marginRight: 6 }}>{agent === 'claude' ? '⏺' : agent === 'codex' ? '◆' : '▲'}</span>
          {lastTurn}
        </div>
        {failureReason && (
          <div style={{
            fontSize: 11, color: 'var(--err)', fontFamily: 'var(--mono)',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>⚠ {failureReason}</div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginTop: 4,
          fontSize: 11, color: 'var(--fg-2)', fontFamily: 'var(--mono)',
        }}>
          <span>turns <span style={{ color: 'var(--fg-1)' }}>{turns}</span></span>
          <span>tok <span style={{ color: 'var(--fg-1)' }}>{tokens}</span></span>
          <span>$ <span style={{ color: 'var(--fg-1)' }}>{cost}</span></span>
          <span>edits <span style={{ color: 'var(--fg-1)' }}>{edits}</span></span>
          {container && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {Ico.container}
              <span style={{ color: 'var(--fg-1)' }}>{container}</span>
              {containerLive ? (
                <span style={{ color: 'var(--live)' }}>· live</span>
              ) : (
                <span style={{ color: 'var(--fg-3)' }}>· cold</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* actions */}
      <div style={{ flex: '0 0 200px', padding: '12px 14px', borderLeft: '1px solid var(--bd-soft)', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
        {status === 'awaiting' ? (
          <button className="btn ok solid sm" style={{ width: '100%', justifyContent: 'center' }}>Resume<span className="kbd">⏎</span></button>
        ) : status === 'failed' ? (
          <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>Retry from start</button>
        ) : status === 'done' ? (
          <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>Open transcript</button>
        ) : (
          <button className="btn primary sm" style={{ width: '100%', justifyContent: 'center' }}>Resume<span className="kbd">⏎</span></button>
        )}
        <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'center' }}>Branch from here</button>
        <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'center' }}>Open diff</button>
      </div>
    </div>
  );
}

window.Resume = Resume;
