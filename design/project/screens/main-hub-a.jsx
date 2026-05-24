// CodeHub — Main Hub (variation A: sidebar + 2-pane vertical split)
// The home view: session list on the left, active session as terminals on the right.

function MainHubA() {
  return (
    <AppChrome w={1440} h={900} title="codehub · ~/work/aurora-api">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* SIDEBAR ----------------------------------------------------- */}
        <aside style={{
          width: 264, flexShrink: 0,
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* sidebar head */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--bd-soft)' }}>
            <Logo />
          </div>

          {/* quick actions */}
          <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button className="btn" style={{ justifyContent: 'space-between', width: '100%', background: 'var(--bg-3)', borderColor: 'var(--bd)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{Ico.plus}New agent</span>
              <span style={{ display: 'flex', gap: 2 }}><span className="kbd">⌘</span><span className="kbd">N</span></span>
            </button>
            <button className="btn ghost" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{Ico.search}Search sessions</span>
              <span style={{ display: 'flex', gap: 2 }}><span className="kbd">⌘</span><span className="kbd">K</span></span>
            </button>
          </div>

          {/* views */}
          <div style={{ padding: '10px 10px 4px' }}>
            <div className="lbl" style={{ padding: '0 4px 6px' }}>Views</div>
            <div className="side-item active">{Ico.hub}<span style={{ flex: 1 }}>Hub</span></div>
            <div className="side-item">{Ico.grid}<span style={{ flex: 1 }}>Dashboard</span><span className="mono" style={{ color: 'var(--fg-2)', fontSize: 11 }}>5</span></div>
            <div className="side-item">{Ico.container}<span style={{ flex: 1 }}>Containers</span></div>
            <div className="side-item">{Ico.settings}<span style={{ flex: 1 }}>Settings</span></div>
          </div>

          {/* sessions grouped by container */}
          <div style={{ flex: 1, padding: '12px 10px 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
              <span className="lbl">Containers · 3</span>
              <IconBtn title="New container">{Ico.plus}</IconBtn>
            </div>
            <div className="scroll" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ContainerGroup id="aurora-cc-3a8f" repo="aurora-api" branch="feat/auth-rewrite" cpu={47} mem={28}>
                <SessionRow agent="claude" name="Claude" task="Refactoring auth middleware" status="live" active account="cm" />
                <SessionRow agent="codex" name="Codex" task="Writing migration for 2024_q4" status="wait" badge="1" account="cx" />
              </ContainerGroup>
              <ContainerGroup id="dash-cc-7e1a" repo="dash-web" branch="main" cpu={31} mem={16}>
                <SessionRow agent="claude" name="Claude" task="Fix lint errors across components/" status="live" account="cw" />
              </ContainerGroup>
              <ContainerGroup id="ml-ag-12fd" repo="ml-pipeline" branch="perf/batching" cpu={2} mem={5}>
                <SessionRow agent="antigravity" name="Antigravity" task="Profiling slow batch jobs" status="idle" account="ag" />
              </ContainerGroup>
              <ContainerGroup id="aurora-cx-bd2c" repo="aurora-api" branch="feat/audit-log" cpu={0} mem={0} dim>
                <SessionRow agent="codex" name="Codex" task="Done · 14 files changed" status="done" dim account="cxa" />
              </ContainerGroup>
            </div>
          </div>

          {/* user */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'linear-gradient(135deg, oklch(0.7 0.13 30), oklch(0.6 0.13 280))', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-0)' }}>m.kim</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>Free · 12% used</div>
            </div>
            <IconBtn title="Settings">{Ico.settings}</IconBtn>
          </div>
        </aside>

        {/* MAIN ─────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)' }}>
          {/* workspace tabs */}
          <div style={{
            height: 40, display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            paddingLeft: 8,
          }}>
            <WorkspaceTab repo="aurora-api" branch="feat/auth-rewrite" container="aurora-cc-3a8f"
              panes={[{ agent: 'claude', status: 'live' }, { agent: 'codex', status: 'wait', badge: 1 }]} active />
            <WorkspaceTab repo="dash-web" branch="main" container="dash-cc-7e1a"
              panes={[{ agent: 'claude', status: 'live' }]} />
            <WorkspaceTab repo="ml-pipeline" branch="perf/batching" container="ml-ag-12fd"
              panes={[{ agent: 'antigravity', status: 'idle' }]} />
            <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px' }}>
              <IconBtn title="Split horizontal" active>{Ico.splitV}</IconBtn>
              <IconBtn title="Split vertical">{Ico.splitH}</IconBtn>
              <div className="vr" style={{ margin: '0 4px', height: 20 }} />
              <IconBtn title="Files">{Ico.files}</IconBtn>
              <IconBtn title="Diff">{Ico.diff}</IconBtn>
              <IconBtn title="Bell" active><span style={{ position: 'relative', display: 'inline-flex' }}>{Ico.bell}<span style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: 'var(--wait)' }} /></span></IconBtn>
            </div>
          </div>

          {/* workspace bar — container-level info (per-pane metrics live inside each pane head) */}
          <div style={{
            height: 32, display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 14px', borderBottom: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)', flexShrink: 0,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-1)' }}>
              {Ico.container}<span>aurora-cc-3a8f</span>
            </span>
            <span>aurora-api</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Ico.branch}<span>feat/auth-rewrite</span>
              <span style={{ color: 'var(--wait)' }}>·7</span>
            </span>
            <div className="vr" style={{ height: 14 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="CI status">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--live)' }} />
              <span style={{ color: 'var(--fg-1)' }}>CI passing</span>
              <span style={{ color: 'var(--fg-3)' }}>3/3</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Tests">
              <span style={{ color: 'var(--fg-1)' }}>tests</span>
              <span style={{ color: 'var(--live)' }}>218</span>
              <span style={{ color: 'var(--fg-3)' }}>/ 218</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title="Lint">
              <span style={{ color: 'var(--fg-1)' }}>lint</span>
              <span style={{ color: 'var(--wait)' }}>4</span>
            </span>
            <span style={{ flex: 1 }} />
            <span>2 agents attached · turns 04:26 total</span>
            <div className="vr" style={{ height: 14 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Spark data={[12, 18, 24, 22, 38, 45, 30, 28, 42, 52, 47]} w={36} h={10} color="var(--live)" />
              <span style={{ color: 'var(--fg-1)' }}>cpu 47%</span>
            </span>
            <span style={{ color: 'var(--fg-1)' }}>mem 1.2/4 GiB</span>
            <span style={{ color: 'var(--fg-1)' }}>$ 2.62 total</span>
          </div>

          {/* TERMINAL TILE GRID */}
          <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
            <TerminalPaneClaude active />
            <TerminalPaneCodex />
          </div>

          {/* status bar */}
          <div style={{
            height: 26, flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 14,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><StatusDot status="live" /> aurora-api · cc</span>
            <span>cpu 47%</span>
            <span>mem 1.2/4 GiB</span>
            <span>net ↓ 14 KB/s</span>
            <div style={{ flex: 1 }} />
            <span>⌘K palette</span>
            <span>⌘\ split</span>
            <span>⌘1–9 jump</span>
          </div>
        </main>

        {/* RIGHT PEEK (notifications) -------------------------------- */}
        <aside style={{
          width: 280, flexShrink: 0,
          background: 'var(--bg-1)',
          borderLeft: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="lbl">Activity</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>live</span>
          </div>

          {/* awaiting input toast */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{
              border: '1px solid color-mix(in oklab, var(--wait) 35%, transparent)',
              background: 'color-mix(in oklab, var(--wait) 10%, var(--bg-2))',
              borderRadius: 8, padding: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <StatusBadge status="wait">Needs input</StatusBadge>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', marginLeft: 'auto' }}>just now</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AgentGlyph agent="codex" size={12} color="var(--a-codex)" />
                <span style={{ fontSize: 12, fontWeight: 500 }}>aurora-api · codex</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--fg-1)', margin: '4px 0 12px', lineHeight: 1.5 }}>
                Allow Codex to run <span className="mono" style={{ color: 'var(--fg-0)' }}>pnpm migrate:up</span>?
                <span style={{ display: 'block', color: 'var(--fg-3)', fontSize: 10.5, marginTop: 4 }}>Modifies database — irreversible.</span>
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn ok solid sm" style={{ flex: 1 }}>Approve<span className="kbd">A</span></button>
                <button className="btn sm">Deny<span className="kbd">D</span></button>
              </div>
            </div>
          </div>

          {/* feed */}
          <div className="scroll" style={{ flex: 1, padding: 10, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ActivityRow agent="claude" name="dash-web" text="Edited components/Nav.tsx +24 −12" time="2m" />
            <ActivityRow agent="claude" name="aurora-api" text="Started turn: refactor auth middleware" time="4m" />
            <ActivityRow agent="antigravity" name="ml-pipeline" text="Finished profiling — 3 hotspots" time="9m" dot="done" />
            <ActivityRow agent="codex" name="aurora-api" text="Wrote 0008_audit_log.sql" time="11m" />
            <ActivityRow agent="claude" name="aurora-api" text="Ran pnpm test — 218 pass" time="14m" dot="done" />
            <ActivityRow agent="codex" name="aurora-api" text="Spawned — opus mini, 200k ctx" time="22m" />
            <ActivityRow agent="claude" name="dash-web" text="Failed: ENOENT on /tmp/snap-3" time="34m" dot="err" />
            <ActivityRow agent="antigravity" name="ml-pipeline" text="Container restarted" time="1h" />
          </div>
        </aside>
      </div>
    </AppChrome>
  );
}

// ── pieces ──────────────────────────────────────────────────────────────
function ContainerGroup({ id, repo, branch, cpu, mem, dim, children }) {
  return (
    <div style={{
      borderRadius: 7, padding: 4,
      background: dim ? 'transparent' : 'color-mix(in oklab, var(--bg-2) 60%, transparent)',
      border: `1px solid ${dim ? 'transparent' : 'var(--bd-soft)'}`,
      opacity: dim ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 6px 6px', cursor: 'pointer',
        borderBottom: '1px solid var(--bd-soft)', marginBottom: 4,
      }}>
        <span style={{ display: 'inline-flex', color: 'var(--fg-2)' }}>{Ico.container}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
          {repo}
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{cpu}%</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', padding: '0 6px 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {Ico.branch}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branch}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function SessionRow({ agent, name, task, status, active, dim, badge, account }) {
  return (
    <div className={`side-item ${active ? 'active' : ''}`} style={{ alignItems: 'flex-start', padding: '8px 10px', opacity: dim ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 1 }}>
        <StatusDot status={status} pulse />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <AgentGlyph agent={agent} size={11} color={AGENT_META[agent].accent} />
          <span className="mono" style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--fg-0)' }}>{name}</span>
          {account && <AccountAvatar id={account} size={12} />}
          {badge && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 5px', background: 'var(--wait)', color: 'var(--bg-0)', borderRadius: 8, fontWeight: 600 }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</div>
      </div>
    </div>
  );
}

function WorkspaceTab({ repo, branch, container, panes, active }) {
  const liveCount = panes.filter(p => p.status === 'live').length;
  const waitCount = panes.filter(p => p.status === 'wait').length;
  const status = waitCount ? 'wait' : liveCount ? 'live' : 'idle';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '0 12px', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer', position: 'relative',
      whiteSpace: 'nowrap', minWidth: 0,
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />}
      <StatusDot status={status} pulse={status === 'live'} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 500, color: active ? 'var(--fg-0)' : 'var(--fg-1)' }}>{repo}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch}</span>
      </div>
      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
        {panes.map((p, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center',
            color: AGENT_META[p.agent].accent,
            opacity: p.status === 'live' || p.status === 'wait' ? 1 : 0.6,
            position: 'relative',
          }}>
            <AgentGlyph agent={p.agent} size={11} color={AGENT_META[p.agent].accent} />
            {p.badge && (
              <span style={{
                position: 'absolute', top: -3, right: -5,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--wait)',
                border: '1.5px solid ' + (active ? 'var(--bg-2)' : 'var(--bg-1)'),
              }} />
            )}
          </span>
        ))}
      </span>
      <IconBtn title="Close" style={{ width: 18, height: 18, marginLeft: 4 }}>{Ico.close}</IconBtn>
    </div>
  );
}

function SessionTab({ agent, name, status, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 10px', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer', position: 'relative',
      minWidth: 0, width: 168, flexShrink: 1,
      whiteSpace: 'nowrap',
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />}
      <StatusDot status={status} pulse />
      <AgentGlyph agent={agent} size={12} color={AGENT_META[agent].accent} />
      <span className="mono" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <span style={{ fontSize: 10.5, color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>· {AGENT_META[agent].short}</span>
      <span style={{ flex: 1 }} />
      <IconBtn title="Close" style={{ width: 18, height: 18 }}>{Ico.close}</IconBtn>
    </div>
  );
}

function ActivityRow({ agent, name, text, time, dot }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 6px', borderRadius: 6 }}>
      <div style={{ paddingTop: 3 }}>
        <AgentGlyph agent={agent} size={11} color={AGENT_META[agent].accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)' }}>{name}</span>
          {dot && <StatusDot status={dot} />}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{time}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-1)', lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
}

// ── TERMINAL CONTENT ────────────────────────────────────────────────────
// Render a line from an array of [className, text] segments.
function TermLine({ segs }) {
  return (
    <div>
      {segs.map(([cls, txt], i) => (
        <span key={i} className={cls || undefined}>{txt}</span>
      ))}
      {segs.length === 0 ? '\u00a0' : null}
    </div>
  );
}

function TermBlock({ lines }) {
  return (
    <div className="term" style={{ flex: 1, padding: '12px 14px', overflow: 'hidden' }}>
      {lines.map((segs, i) => <TermLine key={i} segs={segs} />)}
    </div>
  );
}

const CC_LINES = [
  [['user', '> Refactor src/middleware/auth.ts to extract JWT verify into']],
  [['user', '  a separate verifier.ts module. Add tests.']],
  [],
  [['ok', '● '], ['user', 'Plan']],
  [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Read src/middleware/auth.ts (218 lines)']],
  [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Extract verifyToken → src/auth/verifier.ts']],
  [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Update middleware to import verifier']],
  [['dim', '  └ '], ['warn', '● '], ['user', 'Write 4 tests for verifier']],
  [],
  [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/auth/verifier.ts']],
  [['added', '   + import { jwtVerify } from \'jose\';']],
  [['added', '   + export async function verifyToken(token: string)']],
  [['dim', '     …']],
  [],
  [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm test src/auth']],
  [['ok', '   ✓ '], ['user', 'verifier.spec.ts'], ['meta', ' (4 tests) 142ms']],
  [['dim', '     PASS']],
  [],
  [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/middleware/auth.ts']],
  [['removed', '   - async function verifyToken(t: string) {']],
  [['removed', '   -   /* ... 28 lines removed ... */']],
  [['added', '   + import { verifyToken } from \'../auth/verifier\';']],
  [],
  [['meta', '→ Running pnpm test in container aurora-cc-3a8f']],
  [['info', '  Tests:  '], ['ok', '218 passed'], ['user', ', 0 failed']],
  [['info', '  Time:   '], ['user', '4.21s']],
  [],
  [['prompt blink', '▍']],
];

const CODEX_LINES = [
  [['user', '> Write a migration to add audit_log table with FK to users.']],
  [],
  [['prompt', '⏺ '], ['user', 'Write '], ['path', 'migrations/0008_audit_log.sql']],
  [['added', '   + CREATE TABLE audit_log (']],
  [['added', '   +   id BIGSERIAL PRIMARY KEY,']],
  [['added', '   +   user_id BIGINT REFERENCES users(id),']],
  [['added', '   +   event TEXT NOT NULL,']],
  [['added', '   +   payload JSONB,']],
  [['added', '   +   created_at TIMESTAMPTZ DEFAULT now()']],
  [['added', '   + );']],
  [['added', '   + CREATE INDEX idx_audit_user ON audit_log(user_id);']],
  [],
  [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm migrate:up']],
  [['warn', '   ⚠ Permission required: this command modifies the database.']],
  [],
  [['meta', '─────────────────────────────────────────────────']],
  [['warn', '  Allow Codex to run pnpm migrate:up?']],
  [['meta', '  '], ['ok', '[a] approve'], ['meta', '   '], ['err', '[d] deny'], ['meta', '   '], ['dim', '[e] edit command']],
  [['meta', '─────────────────────────────────────────────────']],
  [],
  [['prompt blink', '▍']],
];

function TerminalPaneClaude({ active }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* pane header — 2 rows: identity + metrics */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px 5px' }}>
          <StatusDot status="live" pulse />
          <AgentGlyph agent="claude" size={13} color="var(--a-claude)" />
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-0)', fontWeight: 500 }}>Claude Code</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>opus-4.7</span>
          <AccountAvatar id="cm" size={14} />
          <span style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>m.kim · Max</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>· tmux cc.0</span>
          <span style={{ flex: 1 }} />
          <IconBtn title="Split" style={{ width: 20, height: 20 }}>{Ico.splitV}</IconBtn>
          <IconBtn title="Maximize" style={{ width: 20, height: 20 }}>{Ico.expand}</IconBtn>
          <IconBtn title="More" style={{ width: 20, height: 20 }}>{Ico.more}</IconBtn>
          <IconBtn title="Close" style={{ width: 20, height: 20 }}>{Ico.close}</IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px 7px' }}>
          <ContextGauge used={184200} max={1000000} label="ctx" width={90} />
          <div className="vr" style={{ height: 16 }} />
          <MetricStat label="turn" value="04:12" />
          <MetricStat label="tokens" value="184.2k" />
          <MetricStat label="cost" value="$2.31" />
          <MetricStat label="edits" value="14" delta="+3" deltaTone="up" />
          <span style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--live)' }}>
            {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--live)' }} />}
            active
          </span>
        </div>
      </div>
      <TermBlock lines={CC_LINES} />
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ color: 'var(--live)', fontSize: 12 }}>▸</span>
        <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: 12 }}>Try "review the verifier for edge cases"</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>auto · shift+tab</span>
      </div>
    </div>
  );
}

function TerminalPaneCodex() {
  return (
    <div style={{ flex: 1, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px 5px' }}>
          <StatusDot status="wait" />
          <AgentGlyph agent="codex" size={13} color="var(--a-codex)" />
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-0)', fontWeight: 500 }}>Codex</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>o4-mini</span>
          <AccountAvatar id="cx" size={14} />
          <span style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>m.kim · Plus</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>· tmux cx.0</span>
          <span style={{ flex: 1 }} />
          <StatusBadge status="wait">Awaiting</StatusBadge>
          <IconBtn title="Split" style={{ width: 20, height: 20 }}>{Ico.splitV}</IconBtn>
          <IconBtn title="Maximize" style={{ width: 20, height: 20 }}>{Ico.expand}</IconBtn>
          <IconBtn title="More" style={{ width: 20, height: 20 }}>{Ico.more}</IconBtn>
          <IconBtn title="Close" style={{ width: 20, height: 20 }}>{Ico.close}</IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px 7px' }}>
          <ContextGauge used={22600} max={200000} label="ctx" width={90} />
          <div className="vr" style={{ height: 16 }} />
          <MetricStat label="turn" value="00:14" />
          <MetricStat label="tokens" value="22.6k" />
          <MetricStat label="cost" value="$0.31" />
          <MetricStat label="edits" value="1" />
          <span style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--wait)' }}>
            blocked 00:14
          </span>
        </div>
      </div>
      <TermBlock lines={CODEX_LINES} />
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', flex: 1 }}>
          Run <span style={{ color: 'var(--fg-0)' }}>pnpm migrate:up</span>?
        </span>
        <button className="btn sm">Deny<span className="kbd">D</span></button>
        <button className="btn ok solid sm">Approve<span className="kbd">A</span></button>
      </div>
    </div>
  );
}

window.TermLine = TermLine;
window.TermBlock = TermBlock;

window.MainHubA = MainHubA;
