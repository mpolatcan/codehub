// CodeHub — Hub state snapshots. Static visualizations of how the hub shell
// behaves under various conditions (empty, awaiting, saturated, etc.). Each
// state is independent — it does NOT subscribe to the live workspace store,
// so all 10 snapshots can coexist on the same design canvas.
//
// Building blocks:
//   HubFrame     — full hub chrome (sidebar + tab row + body + bottom bars)
//   StaticTab    — workspace tab driven by props, not store
//   MetaStrip / ActionBar / StatusBar — bottom-of-main strips
//
// Each Hub state passes JSX into HubFrame's `children` slot for the pane area.

// ── SHARED FRAME ────────────────────────────────────────────────────────────
function HubFrame({
  title = 'codehub',
  tabs = [], pseudoTab, tabsOverflow,
  meta, actionBar = true, status,
  drawer, rail, banner,
  // Workspace-level docked panes — single instances toggled on/off from the
  // bottom action bar. leftPanel sits between the sidebar and the pane grid;
  // bottomPanel slots below the pane grid and above the meta strip.
  leftPanel, bottomPanel,
  // Forwarded to ActionBar so state artboards can highlight which utility
  // toggles are currently on (the active visual on the bottom-bar buttons).
  resumeActive, filesOpen, shellOpen, diffOpen,
  children,
}) {
  return (
    <AppChrome w={1440} h={900} title={title}>
      {banner}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" />
        {leftPanel}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)' }}>
          <StaticTabBar tabs={tabs} pseudoTab={pseudoTab} overflow={tabsOverflow} />
          {children}
          {bottomPanel}
          {meta && <MetaStrip meta={meta} />}
          {actionBar && <ActionBar resumeActive={resumeActive} filesOpen={filesOpen} shellOpen={shellOpen} diffOpen={diffOpen} />}
          <StatusBar>{status}</StatusBar>
        </main>
        {drawer}
        {rail}
      </div>
    </AppChrome>
  );
}

function StaticTabBar({ tabs, pseudoTab, overflow }) {
  return (
    <div style={{
      height: '2.5rem', display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid var(--bd-soft)',
      background: 'var(--bg-1)', paddingLeft: '0.5rem', width: '100%',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', minWidth: 0, overflow: 'hidden' }}>
        {tabs.map((t, i) => <StaticTab key={i} {...t} />)}
      </div>
      {pseudoTab && <window.HubPseudoTab {...pseudoTab} />}
      {overflow && (
        <button className="btn ghost xs" title={`${overflow} more workspace${overflow === 1 ? '' : 's'}`} style={{
          alignSelf: 'center', marginLeft: '0.375rem', padding: '4px 0.5rem',
          fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-1)',
          background: 'var(--bg-3)',
        }}>
          +{overflow} {Ico.chevD}
        </button>
      )}
      <button className="btn ghost xs" title="New workspace (⌘⇧N)" style={{ alignSelf: 'center', marginLeft: '0.375rem', padding: '4px 0.375rem' }}>{Ico.plus}</button>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0.5rem' }}>
        <button className="btn ghost sm" title="Search (⌘K)">{Ico.search}<span className="kbd">⌘K</span></button>
      </div>
    </div>
  );
}

function StaticTab({ color = 'var(--pri)', name, repos = '1 repo', agentCount = 0, waitCount = 0, active }) {
  const state = waitCount > 0 ? 'wait' : agentCount > 0 ? 'live' : 'idle';
  const chipBg = state === 'wait' ? 'var(--wait)'
    : state === 'live' ? 'color-mix(in oklab, var(--live) 18%, transparent)'
    : 'transparent';
  const chipFg = state === 'wait' ? 'var(--bg-0)'
    : state === 'live' ? 'var(--live)'
    : 'var(--fg-3)';
  const chipLabel = state === 'wait' ? `${waitCount} wait`
    : agentCount > 0 ? `${agentCount}` : '—';
  return (
    <div className={`ch-tab ${active ? 'active' : ''}`} style={{
      display: 'flex', alignItems: 'center', gap: '0.5625rem',
      padding: '0 0.625rem 0 0.375rem', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap', minWidth: 0,
    }}>
      <span className="tab-handle" />
      <span style={{
        width: '0.625rem', height: '0.625rem', borderRadius: '50%',
        background: color, border: `1px solid color-mix(in oklab, ${color} 60%, #000)`,
        flexShrink: 0,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repos}</span>
      </div>
      <span className="mono" style={{
        fontSize: '0.625rem', fontWeight: state === 'wait' ? 600 : 500,
        color: chipFg, background: chipBg,
        padding: '1px 0.3125rem', borderRadius: '62.4375rem', lineHeight: 1,
        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        {state === 'live' && <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />}
        {chipLabel}
      </span>
      <IconBtn title="Close" style={{ width: '1.125rem', height: '1.125rem', marginLeft: 4 }}>{Ico.close}</IconBtn>
    </div>
  );
}

function MetaStrip({ meta }) {
  return (
    <div style={{
      height: '1.625rem', flexShrink: 0,
      background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
      display: 'flex', alignItems: 'center', padding: '0 0.875rem', gap: '0.875rem',
      fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
    }}>
      {meta.repos && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', color: 'var(--fg-1)' }}>
          {Ico.branch}<span>{meta.repos}</span>
          {meta.uncommitted && <span style={{ color: 'var(--wait)' }}>{meta.uncommitted}</span>}
        </span>
      )}
      {meta.ci && (
        <>
          {meta.repos && <div className="vr" style={{ height: '0.875rem' }} />}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem' }}>
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: meta.ci.color || 'var(--live)' }} />
            <span style={{ color: 'var(--fg-1)' }}>{meta.ci.label}</span>
            {meta.ci.detail && <span style={{ color: 'var(--fg-3)' }}>{meta.ci.detail}</span>}
          </span>
        </>
      )}
      {meta.extras && (
        <>
          <div className="vr" style={{ height: '0.875rem' }} />
          {meta.extras}
        </>
      )}
      <span style={{ flex: 1 }} />
      {meta.right}
      {meta.agents && <span>{meta.agents}</span>}
      {meta.cost !== undefined && <span style={{ color: 'var(--fg-1)' }}>{meta.cost}</span>}
    </div>
  );
}

function ActionBar({ resumeActive, filesOpen, shellOpen, diffOpen } = {}) {
  return (
    <div style={{
      height: '2.25rem', flexShrink: 0,
      background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
      display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.375rem',
    }}>
      <window.PaneAddBtn kind="files" kbd="⌘E"  active={filesOpen} />
      <window.PaneAddBtn kind="shell" kbd="⌘⇧B" active={shellOpen} />
      <window.PaneAddBtn kind="diff"  kbd="⌘D"  active={diffOpen} />
      <span style={{ flex: 1 }} />
      <button className="btn ghost xs"
        title={resumeActive ? 'Hide Resume drawer (⌘R)' : 'Resume drawer (⌘R)'}
        style={{
          padding: '4px 0.5rem',
          ...(resumeActive && { background: 'var(--bg-3)', color: 'var(--fg-0)', outline: '1px solid var(--bd-soft)', outlineOffset: -1 }),
        }}>
        {Ico.clock}Resume<span className="kbd">⌘R</span>
      </button>
      <SpawnSplitBtn />
    </div>
  );
}

function StatusBar({ children }) {
  return (
    <div style={{
      height: '1.625rem', flexShrink: 0, background: 'var(--bg-0)',
      borderTop: '1px solid var(--bd-soft)',
      display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.875rem',
      fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
    }}>
      {children}
    </div>
  );
}

// ── HEADER BANNER ───────────────────────────────────────────────────────────
function HubBanner({ tone = 'warn', icon, title, message, actions }) {
  const toneColor = tone === 'err' ? 'var(--err)'
    : tone === 'warn' ? 'var(--wait)'
    : tone === 'info' ? 'var(--pri)'
    : 'var(--live)';
  return (
    <div style={{
      flexShrink: 0,
      background: `color-mix(in oklab, ${toneColor} 14%, var(--bg-1))`,
      borderBottom: `1px solid color-mix(in oklab, ${toneColor} 35%, var(--bd-soft))`,
      padding: '0.5rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      fontSize: '0.8125rem',
    }}>
      <span style={{ color: toneColor, display: 'inline-flex' }}>{icon}</span>
      <span style={{ color: 'var(--fg-0)', fontWeight: 500 }}>{title}</span>
      {message && <span style={{ color: 'var(--fg-2)' }}>· {message}</span>}
      <span style={{ flex: 1 }} />
      {actions}
    </div>
  );
}

// ── REUSABLE STATIC TILE PRIMITIVES ─────────────────────────────────────────
// Lean alternative to TerminalPaneClaude for state mockups — we just need
// enough texture to show "an agent is running here", not the full transcript.
function StaticAgentPane({ agent, name, model, status, idx, focus, label, headerNote, footer, peek, compact }) {
  const meta = AGENT_META[agent] || AGENT_META.claude;
  return (
    <div data-pane-id={`mock-${idx}`} style={{
      flex: 1, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0,
      outline: focus ? '1px solid var(--fg-1)' : 'none',
      outlineOffset: focus ? -1 : 0,
    }}>
      <div className="ch-pane-head" style={{
        background: status === 'wait'
          ? `color-mix(in oklab, ${meta.accent} 22%, var(--bg-1))`
          : 'var(--bg-1)',
        borderBottom: status === 'wait'
          ? `1px solid color-mix(in oklab, ${meta.accent} 40%, var(--bd-soft))`
          : '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: compact ? '0.3125rem 0.5rem' : '0.4375rem 0.75rem',
        fontSize: compact ? '0.6875rem' : '0.75rem',
      }}>
        <window.PaneIndex n={idx} active={focus} />
        <window.PaneTitle name={name} defaultColor={meta.accent} status={status} pulse={status === 'live' || status === 'wait'} />
        {model && !compact && <window.ModelSelector agent={agent} model={model} />}
        {status === 'wait' && <StatusBadge status="wait">Awaiting</StatusBadge>}
        {label && (
          <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{label}</span>
        )}
        <span style={{ flex: 1 }} />
        {headerNote && <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{headerNote}</span>}
        <IconBtn title="Maximize" style={{ width: '1.25rem', height: '1.25rem' }}>{Ico.expand}</IconBtn>
        <IconBtn title="Close" style={{ width: '1.25rem', height: '1.25rem' }}>{Ico.close}</IconBtn>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {peek || <DefaultPeek agent={agent} status={status} />}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2.5rem',
          background: 'linear-gradient(to bottom, transparent, var(--bg-0))',
          pointerEvents: 'none',
        }} />
      </div>
      {footer}
    </div>
  );
}

function DefaultPeek({ agent, status }) {
  if (status === 'wait') {
    return (
      <window.TermBlock lines={[
        [['user', '> Run database migration?']],
        [],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm migrate:up']],
        [['warn', '   ⚠ Permission required — awaiting approval']],
        [],
        [['meta', '─────────────────────────────']],
        [['warn', '  Allow this command?']],
        [['meta', '  '], ['ok', '[a] approve'], ['meta', '  '], ['err', '[d] deny']],
        [['meta', '─────────────────────────────']],
      ]} />
    );
  }
  if (status === 'idle') {
    return (
      <window.TermBlock lines={[
        [['dim', '$ ']],
        [],
        [['meta', '(no agent attached)']],
      ]} />
    );
  }
  return (
    <window.TermBlock lines={[
      [['user', `> ${agent === 'codex' ? 'Scaffold audit_log table' : agent === 'antigravity' ? 'Profile slow batches' : 'Refactor auth middleware'}`]],
      [],
      [['ok', '● '], ['user', 'Plan'], ['dim', '  4 steps']],
      [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Read source files']],
      [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'Identify changes']],
      [['dim', '  └ '], ['warn', '● '], ['user', 'Apply edits']],
      [],
      [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/middleware/auth.ts']],
      [['added', '   + import { verifyToken } from \'../auth/verifier\';']],
      [['removed', '   - async function verifyToken(t: string) {']],
      [],
      [['prompt blink', '▍']],
    ]} />
  );
}

// Common metric strip used at the bottom of an agent pane.
function MiniMetrics({ ctxUsed, ctxMax, turn, tokens, cost, waiting }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.25rem 0.625rem',
      background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
      fontSize: '0.625rem',
    }}>
      {ctxUsed !== undefined && <window.ContextGauge used={ctxUsed} max={ctxMax} label="ctx" width={56} />}
      {turn && <window.MetricStat label="turn" value={turn} />}
      {tokens && <window.MetricStat label="tok" value={tokens} />}
      {cost && <window.MetricStat label="$" value={cost} />}
      <span style={{ flex: 1 }} />
      {waiting && <span style={{ color: 'var(--wait)' }}>blocked {waiting}</span>}
    </div>
  );
}

// Common tab sets ───────────────────────────────────────────────────────────
const TABS_BUSY = [
  { color: 'var(--pri)',     name: 'aurora-api',  repos: '2 repos',     agentCount: 2, waitCount: 0, active: true },
  { color: 'var(--a-codex)', name: 'dash-web',    repos: 'dash-web',    agentCount: 1, waitCount: 0 },
  { color: 'var(--a-antigravity)', name: 'ml-pipeline', repos: 'ml-pipeline', agentCount: 1, waitCount: 0 },
];

// ─────────────────────────────────────────────────────────────────────────
// STATE 1 — EMPTY WORKSPACE (freshly created, no panes yet)
// ─────────────────────────────────────────────────────────────────────────
function HubStateEmpty() {
  return (
    <HubFrame
      title="codehub · aurora-api · empty"
      tabs={[{ color: 'var(--pri)', name: 'aurora-api', repos: 'aurora-api', agentCount: 0, active: true }]}
      meta={{ repos: '1 repo', cost: '$0.00', agents: '0 agents · 00:00' }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="idle" />{Ico.container}<span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 4%</span>
        <span>mem 240 MiB</span>
        <span style={{ flex: 1 }} />
        <span>⌘A new agent</span>
        <span>⌘K palette</span>
      </>}
    >
      {/* Empty group row — mock of GroupGrid's empty state */}
      <div style={{
        height: '2rem', display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)',
        paddingLeft: '0.5rem',
      }}>
        <div className="ch-tab active" style={{
          display: 'flex', alignItems: 'center', gap: '0.5625rem',
          padding: '0 0.625rem 0 0.375rem', height: '100%',
          borderRight: '1px solid var(--bd-soft)',
          background: 'var(--bg-2)', color: 'var(--fg-0)',
          fontSize: '0.75rem', cursor: 'pointer', position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--pri)' }} />
          <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: 'var(--pri)' }} />
          <span style={{ fontWeight: 500 }}>Default</span>
          <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>0</span>
        </div>
        <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        background: 'var(--bg-0)', padding: '2rem', minHeight: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: '1rem',
            border: '1.5px dashed var(--bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-3)', fontSize: 22,
          }}>{Ico.plus}</div>
          <div style={{ fontSize: '1.125rem', color: 'var(--fg-0)', fontWeight: 500, letterSpacing: '-0.01em' }}>Workspace ready</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '30rem', lineHeight: 1.5 }}>
            Add an agent or utility pane to start. Right-click anywhere in this area for the full menu.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-claude)' }} />
            Claude Code<span className="kbd">⌘1</span>
          </button>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-codex)' }} />
            Codex<span className="kbd">⌘2</span>
          </button>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-antigravity)' }} />
            Antigravity<span className="kbd">⌘3</span>
          </button>
          <div className="vr" style={{ height: '1.5rem', alignSelf: 'center' }} />
          <button className="btn sm">{Ico.files}Files</button>
          <button className="btn sm">{Ico.terminal}Shell</button>
          <button className="btn sm">{Ico.diff}Diff</button>
        </div>
        <div style={{
          fontSize: '0.6875rem', color: 'var(--fg-3)', fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <span>tip:</span>
          <span>Resume a past session</span>
          <span className="kbd">⌘R</span>
          <span>·</span>
          <span>Command palette</span>
          <span className="kbd">⌘K</span>
        </div>
      </div>
    </HubFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 2 — AWAITING (3 agents blocked on approval)
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// STATE 1b — EMPTY GROUP (workspace has panes in other groups; active group is empty)
// ─────────────────────────────────────────────────────────────────────────
// User added a new group tab to an already-busy workspace. The new tab is now
// active and shows the same empty prompt as a fresh workspace, but a sibling
// group with running agents stays visible in the groups bar so the user knows
// where to switch back. Distinct from `hs-empty` (which is a fresh workspace
// with one empty default group).
function HubStateEmptyGroup() {
  return (
    <HubFrame
      title="codehub · empty group"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      meta={{ repos: '2 repos', uncommitted: '+9', agents: '2 agents · 04:26', cost: '$2.62' }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="idle" /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span>⌘N new agent · ⌘1–9 jump to group · ⌘K palette</span>
      </>}
    >
      {/* Groups bar — Auth has 2 panes, Migrations is the new empty active group */}
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} />
        <MockGroupTab name="Migrations"   color="var(--wait)" panes={0} active />
        <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
      </div>

      {/* Empty pane area — instructive but minimal. Matches the language and
          icon vocabulary of the workspace-level Empty state, just framed at
          the group level. */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1.25rem',
        background: 'var(--bg-0)', padding: '2rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '0.75rem',
            border: '1.5px dashed var(--bd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-3)',
          }}>{Ico.plus}</div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--fg-0)', fontWeight: 500 }}>Empty group</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '24rem', lineHeight: 1.5 }}>
            Add an agent or utility pane to <span style={{ color: 'var(--fg-1)' }}>Migrations</span>.
            Other groups in this workspace keep running.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-claude)' }} />
            Claude<span className="kbd">⌘1</span>
          </button>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-codex)' }} />
            Codex<span className="kbd">⌘2</span>
          </button>
          <button className="btn sm pri">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-antigravity)' }} />
            Antigravity<span className="kbd">⌘3</span>
          </button>
          <div className="vr" style={{ height: '1.5rem', alignSelf: 'center' }} />
          <button className="btn sm">{Ico.files}Files</button>
          <button className="btn sm">{Ico.terminal}Shell</button>
          <button className="btn sm">{Ico.diff}Diff</button>
        </div>
        <div style={{
          fontSize: '0.6875rem', color: 'var(--fg-3)', fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <span>tip:</span>
          <span>⌘1 jump to Auth + audit</span>
          <span>·</span>
          <span>⌘⇧W close empty group</span>
        </div>
      </div>
    </HubFrame>
  );
}

function HubStateAwaiting() {
  return (
    <HubFrame
      title="codehub · 3 agents awaiting"
      tabs={[
        { color: 'var(--pri)',     name: 'aurora-api', repos: '2 repos',  agentCount: 2, waitCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web',   repos: 'dash-web', agentCount: 1, waitCount: 1 },
      ]}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        ci: { color: 'var(--wait)', label: '3 awaiting', detail: 'across 2 workspaces' },
        agents: '3 agents · 04:26', cost: '$2.62',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="wait" pulse />
          <span style={{ color: 'var(--wait)' }}>3 need input</span>
        </span>
        <span>burn $0.62/h paused</span>
        <span style={{ flex: 1 }} />
        <span>A approve · D deny · ⏎ enter</span>
      </>}
      rail={<AwaitingQueue />}
    >
      {/* Group row */}
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Migrations" color="var(--wait)" panes={3} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait" focus
          footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22.6k" cost="0.31" waiting="00:14" />} />
        <StaticAgentPane idx={2} agent="claude" name="Claude · auth-rewrite" model="opus-4.7" status="wait"
          peek={<window.TermBlock lines={[
            [['user', '> Confirm: replace SECRET with rotating key?']],
            [],
            [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'kubectl rotate secret jwt-prod']],
            [['warn', '   ⚠ Permission required — production resource']],
            [],
            [['meta', '─────────────────────────────']],
            [['warn', '  Allow rotation in production?']],
            [['meta', '  '], ['ok', '[a] approve'], ['meta', '  '], ['err', '[d] deny'], ['meta', '  '], ['dim', '[e] edit']],
            [['meta', '─────────────────────────────']],
          ]} />}
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" waiting="01:02" />} />
        <StaticAgentPane idx={3} agent="antigravity" name="Antigravity · ml-pipe" model="gemini-2.5-pro" status="wait"
          peek={<window.TermBlock lines={[
            [['user', '> Write to /etc/hosts to add staging entry']],
            [],
            [['prompt', '⏺ '], ['user', 'Write '], ['path', '/etc/hosts']],
            [['warn', '   ⚠ Permission required — system file']],
            [],
            [['meta', '─────────────────────────────']],
            [['warn', '  Allow write to /etc/hosts?']],
            [['meta', '  '], ['ok', '[a] approve'], ['meta', '  '], ['err', '[d] deny']],
            [['meta', '─────────────────────────────']],
          ]} />}
          footer={<MiniMetrics ctxUsed={64000} ctxMax={1000000} turn="01:28" tokens="64k" cost="0.48" waiting="02:18" />} />
      </div>
    </HubFrame>
  );
}

function AwaitingQueue() {
  return (
    <aside style={{
      width: '17rem', flexShrink: 0,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span className="lbl">Approval queue</span>
        <span className="mono" style={{
          fontSize: '0.625rem', color: 'var(--bg-0)', background: 'var(--wait)',
          padding: '1px 0.3125rem', borderRadius: '62.4375rem', fontWeight: 600,
        }}>3</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Approve all" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.check}</IconBtn>
      </div>
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <ApprovalCard agent="codex" name="aurora-api · audit-log"
          command="pnpm migrate:up" detail="Modifies database — irreversible" age="2 min" />
        <ApprovalCard agent="claude" name="aurora-api · auth-rewrite"
          command="kubectl rotate secret jwt-prod" detail="Touches production" age="1 min" />
        <ApprovalCard agent="antigravity" name="ml-pipeline · perf-batching"
          command="echo '...' >> /etc/hosts" detail="System file" age="just now" />
      </div>
      <div style={{
        padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)',
        display: 'flex', gap: '0.375rem',
      }}>
        <button className="btn ok solid sm" style={{ flex: 1, justifyContent: 'center' }}>Approve all<span className="kbd">⌥A</span></button>
        <button className="btn sm">Review one</button>
      </div>
    </aside>
  );
}

function ApprovalCard({ agent, name, command, detail, age }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      border: '1px solid color-mix(in oklab, var(--wait) 35%, transparent)',
      background: 'color-mix(in oklab, var(--wait) 10%, var(--bg-2))',
      borderRadius: '0.5rem', padding: '0.625rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 4 }}>
        <AgentGlyph agent={agent} size={11} color={meta.accent} />
        <span className="mono" style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--fg-0)' }}>{name}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{age}</span>
      </div>
      <div className="mono" style={{
        fontSize: '0.6875rem', color: 'var(--fg-0)', padding: '0.25rem 0.4375rem',
        background: 'var(--bg-0)', border: '1px solid var(--bd-soft)', borderRadius: 4,
        marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{command}</div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', marginBottom: '0.4375rem' }}>{detail}</div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button className="btn ok solid xs" style={{ flex: 1, justifyContent: 'center' }}>Approve<span className="kbd">A</span></button>
        <button className="btn xs" style={{ flex: 1, justifyContent: 'center' }}>Deny<span className="kbd">D</span></button>
      </div>
    </div>
  );
}

function MockGroupTab({ name, color, panes, active }) {
  return (
    <div className={`ch-tab ${active ? 'active' : ''}`} style={{
      display: 'flex', alignItems: 'center', gap: '0.5625rem',
      padding: '0 0.625rem 0 0.375rem', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      fontSize: '0.75rem', cursor: 'pointer', position: 'relative',
      boxShadow: active ? 'inset 0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px var(--bd-soft)' : 'none',
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />}
      <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: color, border: `1px solid color-mix(in oklab, ${color} 60%, #000)` }} />
      <span style={{ fontWeight: active ? 500 : 400 }}>{name}</span>
      <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{panes}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 3 — SATURATED (6 panes, recursive splits)
// ─────────────────────────────────────────────────────────────────────────
function HubStateSaturated() {
  return (
    <HubFrame
      title="codehub · saturated · 6 panes"
      tabs={[
        { color: 'var(--pri)',     name: 'aurora-api', repos: '2 repos',  agentCount: 4, active: true },
        { color: 'var(--a-codex)', name: 'dash-web',   repos: 'dash-web', agentCount: 1 },
        { color: 'var(--a-antigravity)', name: 'ml-pipeline', repos: 'ml-pipeline', agentCount: 1 },
      ]}
      meta={{
        repos: '2 repos', uncommitted: '+14',
        ci: { label: 'CI ✓', detail: '218 · lint 4' },
        extras: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem' }}>
          <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--live)' }} />
          <span style={{ color: 'var(--fg-1)' }}>6 panes</span>
        </span>,
        agents: '6 agents · 12:48', cost: '$8.92',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span title="High container CPU" style={{ color: 'var(--wait)' }}>cpu 92%</span>
        <span>mem 3.7/4 GiB</span>
        <span title="Spend rate (rolling 5min)" style={{ color: 'var(--fg-1)' }}>burn $4.12/h</span>
        <span style={{ flex: 1 }} />
        <span>⌘1-9 jump · ⌘\ split</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={4} active />
        <MockGroupTab name="Migrations"   color="var(--wait)" panes={2} />
        <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
      </div>
      {/* recursive split — left column 3 stacked, right column 1 + 2 stacked */}
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <SatPane idx={1} agent="claude" name="auth-rewrite" status="live" focus />
          <SatPane idx={2} agent="codex" name="audit-log" status="wait" />
          <SatPane idx={3} agent="antigravity" name="ml-pipe" status="live" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <SatPane idx={4} agent="claude" name="dash-lint" status="live" />
          <div style={{ flex: 1, display: 'flex', gap: 1, minHeight: 0 }}>
            <SatPane idx={5} kind="files" name="files" />
            <SatPane idx={6} kind="shell" name="bash · root" />
          </div>
        </div>
      </div>
    </HubFrame>
  );
}

// Compact pane for saturated state — much less chrome than StaticAgentPane.
function SatPane({ idx, agent, name, status, focus, kind = 'agent' }) {
  const meta = agent ? AGENT_META[agent] : null;
  const accent = meta?.accent || (kind === 'files' ? 'var(--idle)' : kind === 'shell' ? 'var(--live)' : 'var(--pri)');
  return (
    <div style={{
      flex: 1, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0,
      outline: focus ? '1px solid var(--fg-1)' : 'none', outlineOffset: focus ? -1 : 0,
    }}>
      <div className="ch-pane-head" style={{
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '3px 0.4375rem',
        height: '1.5rem',
      }}>
        <span className="mono" style={{
          fontSize: '0.5625rem', color: 'var(--fg-3)',
          background: focus ? 'var(--bg-3)' : 'transparent',
          padding: '0 0.25rem', borderRadius: 3, minWidth: '0.875rem', textAlign: 'center',
        }}>{idx}</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{name}</span>
        {status && <window.StatusDot status={status} pulse={status === 'live'} />}
        <IconBtn title="Close" style={{ width: '1rem', height: '1rem' }}>{Ico.close}</IconBtn>
      </div>
      <div style={{ flex: 1, padding: '0.375rem 0.5rem', overflow: 'hidden', position: 'relative' }}>
        {agent ? <DefaultPeek agent={agent} status={status} /> : kind === 'files' ? <FilesPeekMini /> : <ShellPeekMini />}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5rem',
          background: 'linear-gradient(to bottom, transparent, var(--bg-0))',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

function FilesPeekMini() {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-1)', lineHeight: 1.5 }}>
      <div>📁 src/</div>
      <div style={{ paddingLeft: '0.875rem' }}>📁 auth/</div>
      <div style={{ paddingLeft: '1.625rem', color: 'var(--live)' }}>+ verifier.ts</div>
      <div style={{ paddingLeft: '1.625rem' }}>verifier.spec.ts</div>
      <div style={{ paddingLeft: '0.875rem' }}>📁 middleware/</div>
      <div style={{ paddingLeft: '1.625rem', color: 'var(--wait)' }}>~ auth.ts</div>
    </div>
  );
}
function ShellPeekMini() {
  return (
    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-1)', lineHeight: 1.5 }}>
      <div style={{ color: 'var(--fg-3)' }}>$ pnpm test --watch</div>
      <div style={{ color: 'var(--live)' }}> PASS  src/auth (218)</div>
      <div style={{ color: 'var(--live)' }}> PASS  src/api (412)</div>
      <div style={{ color: 'var(--fg-3)' }}>watching for changes...</div>
      <div>{'>'} _</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 4 — FOCUS MODE (one pane huge, others as edge strips)
// ─────────────────────────────────────────────────────────────────────────
function HubStateFocus() {
  return (
    <HubFrame
      title="codehub · focus · Claude"
      tabs={TABS_BUSY}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        extras: <span style={{ color: 'var(--fg-1)' }}>FOCUS · Claude</span>,
        agents: '4 agents · 04:26', cost: '$2.62',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span title="Exit focus mode">Esc exit focus</span>
        <span>⌘\ split</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={4} active />
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0, gap: 1, background: 'var(--bd-soft)' }}>
        {/* Focused pane — big */}
        <StaticAgentPane idx={1} agent="claude" name="Claude Code · aurora-api" model="opus-4.7" status="live" focus
          label="focus mode · Esc to exit"
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184.2k" cost="2.31" />} />
        {/* Mini strip — minimized panes */}
        <div style={{
          width: '13rem', flexShrink: 0, background: 'var(--bg-1)',
          display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--bd-soft)',
        }}>
          <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid var(--bd-soft)' }}>
            <span className="lbl">Minimized · 3</span>
          </div>
          <MiniPane idx={2} agent="codex" name="Codex · audit-log" status="wait" turn="00:14" cost="$0.31" />
          <MiniPane idx={3} agent="antigravity" name="Antigravity · ml-pipe" status="live" turn="01:28" cost="$0.48" />
          <MiniPane idx={4} agent="claude" name="Claude · dash-lint" status="live" turn="02:14" cost="$0.18" />
          <div style={{ flex: 1 }} />
          <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)' }}>
            <button className="btn xs ghost" style={{ width: '100%', justifyContent: 'center' }}>{Ico.expand}Show all panes<span className="kbd">Esc</span></button>
          </div>
        </div>
      </div>
    </HubFrame>
  );
}

function MiniPane({ idx, agent, name, status, turn, cost }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem' }}>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)', background: 'var(--bg-3)', padding: '0 0.25rem', borderRadius: 3, minWidth: '0.875rem', textAlign: 'center' }}>{idx}</span>
        <AgentGlyph agent={agent} size={11} color={meta.accent} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{name}</span>
        <window.StatusDot status={status} pulse={status === 'live'} />
      </div>
      <div style={{ display: 'flex', gap: '0.625rem', fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)' }}>
        <span>{turn}</span>
        <span>·</span>
        <span>{cost}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 5 — TAB OVERFLOW (9 workspaces, scrollable + overflow menu)
// ─────────────────────────────────────────────────────────────────────────
function HubStateTabOverflow() {
  const many = [
    { color: 'var(--pri)',           name: 'aurora-api',   repos: '2 repos',     agentCount: 2, waitCount: 1, active: true },
    { color: 'var(--a-codex)',       name: 'dash-web',     repos: 'dash-web',    agentCount: 1 },
    { color: 'var(--a-antigravity)', name: 'ml-pipeline',  repos: 'ml-pipeline', agentCount: 1 },
    { color: 'var(--live)',          name: 'docs-rewrite', repos: 'docs',        agentCount: 1 },
    { color: 'var(--wait)',          name: 'spike-grpc',   repos: '2 repos',     agentCount: 1, waitCount: 1 },
    { color: 'var(--idle)',          name: 'oncall',       repos: 'aurora-api',  agentCount: 0 },
  ];
  return (
    <HubFrame
      title="codehub · 9 workspaces · 4 active"
      tabs={many}
      tabsOverflow={3}
      meta={{
        repos: '6 repos across 9 workspaces',
        ci: { label: '2 failing', color: 'var(--err)', detail: 'aurora-api, dash-web' },
        agents: '6 agents · 18:42', cost: '$11.40',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>9 workspaces · 6 active</span>
        </span>
        <span style={{ flex: 1 }} />
        <span>⌘⇧[ prev tab · ⌘⇧] next tab · ⌘P search workspaces</span>
      </>}
    >
      {/* Overflow menu floating over canvas */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: '34rem', width: '17.5rem',
          background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: '0.5rem',
          boxShadow: 'var(--shadow-2)', zIndex: 10, padding: '0.375rem',
        }}>
          <div style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', borderBottom: '1px solid var(--bd-soft)', marginBottom: 4 }}>
            <span className="lbl" style={{ fontSize: '0.625rem' }}>Other workspaces · 3</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>⌘P</span>
          </div>
          <OverflowRow color="var(--pri)" name="payments-api" repos="payments-api" badge="2 active" />
          <OverflowRow color="var(--a-codex)" name="webhooks" repos="webhooks · main" badge="1 wait" badgeColor="var(--wait)" />
          <OverflowRow color="var(--fg-3)" name="archive" repos="archive · sandbox" badge="paused" badgeColor="var(--idle)" />
          <div style={{ borderTop: '1px solid var(--bd-soft)', marginTop: 4, paddingTop: 4 }}>
            <div className="ctx-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', padding: '0.3125rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--fg-1)' }}>
              {Ico.search}Search workspaces…<span className="kbd" style={{ marginLeft: 'auto' }}>⌘P</span>
            </div>
            <div className="ctx-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem', padding: '0.3125rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--fg-1)' }}>
              {Ico.grid}Open workspace switcher
            </div>
          </div>
        </div>
        {/* Workspace area underneath — show normal active workspace */}
        <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
          <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
          <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live" focus
            footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
          <StaticAgentPane idx={2} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait"
            footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22k" cost="0.31" waiting="00:14" />} />
        </div>
      </div>
    </HubFrame>
  );
}

function OverflowRow({ color, name, repos, badge, badgeColor = 'var(--live)' }) {
  return (
    <div className="ctx-row" style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4375rem 0.5rem', borderRadius: 4, cursor: 'pointer',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{repos}</span>
      </div>
      <span className="mono" style={{
        fontSize: '0.625rem', color: badgeColor === 'var(--idle)' ? 'var(--fg-3)' : 'var(--bg-0)',
        background: badgeColor === 'var(--idle)' ? 'var(--bg-3)' : badgeColor,
        padding: '1px 0.375rem', borderRadius: '62.4375rem',
      }}>{badge}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 6 — DRAG IN PROGRESS (drop zones visible)
// ─────────────────────────────────────────────────────────────────────────
function HubStateDragging() {
  return (
    <HubFrame
      title="codehub · dragging Codex pane"
      tabs={TABS_BUSY}
      meta={{ repos: '2 repos', uncommitted: '+9', agents: '4 agents · 04:26', cost: '$2.62' }}
      status={<>
        <span style={{ color: 'var(--pri)' }}>Hold ⇧ to swap panes · Esc to cancel</span>
        <span style={{ flex: 1 }} />
        <span>Drop a pane onto an edge to split, center to swap</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={3} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0, position: 'relative' }}>
        {/* Pane being dragged — ghost */}
        <DraggedGhost left={520} top={140} />
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live"
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        {/* Target pane — show drop quadrants */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--bg-0)', minWidth: 0 }}>
          <StaticAgentPane idx={2} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait" headerNote="drop target"
            footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22k" cost="0.31" />} />
          <DropQuadrants />
        </div>
      </div>
    </HubFrame>
  );
}

function DraggedGhost({ left, top }) {
  return (
    <div style={{
      position: 'absolute', left, top, zIndex: 20, pointerEvents: 'none',
      width: '13.75rem', height: '5rem',
      background: 'color-mix(in oklab, var(--a-codex) 35%, var(--bg-2))',
      border: '1px solid var(--a-codex)',
      borderRadius: '0.4375rem',
      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
      transform: 'rotate(-1.5deg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0.4375rem 0.625rem', borderBottom: '1px solid color-mix(in oklab, var(--a-codex) 45%, var(--bd))', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <AgentGlyph agent="codex" size={11} color="var(--a-codex)" />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>Codex · audit-log</span>
      </div>
      <div style={{ flex: 1, padding: '0.4375rem 0.625rem', fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-2)' }}>
        Dragging — hover an edge to split, or center to swap
      </div>
    </div>
  );
}

function DropQuadrants() {
  // 5-zone scheme: 4 thin edge strips (top/right/bottom/left) for "split this
  // side", plus a centered swap pill. Edge strips don't overlap — they're
  // anchored to one side via absolute positioning so the visual hierarchy is
  // unambiguous (the user reads each strip as exactly one drop intent).
  const strip = (side) => {
    const horizontal = side === 'top' || side === 'bottom';
    const accent = 'var(--pri)';
    return {
      position: 'absolute',
      [side]: 0,
      ...(horizontal
        ? { left: 0, right: 0, height: '16%' }
        : { top: 0, bottom: 0, width: '16%' }),
      background: `linear-gradient(to ${side}, transparent, color-mix(in oklab, ${accent} 28%, transparent))`,
      borderColor: accent,
      borderStyle: 'solid',
      borderWidth: 0,
      [`border${side[0].toUpperCase() + side.slice(1)}Width`]: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.3125rem',
      fontFamily: 'var(--mono)',
      fontSize: '0.6875rem',
      color: accent,
      letterSpacing: '0.02em',
    };
  };
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      <div style={strip('top')}>{Ico.splitH}<span>Split top</span></div>
      <div style={strip('right')}>{Ico.splitV}<span>Split right</span></div>
      <div style={strip('bottom')}>{Ico.splitH}<span>Split bottom</span></div>
      <div style={strip('left')}>{Ico.splitV}<span>Split left</span></div>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-2)', border: '1.5px solid var(--pri)', borderRadius: '0.5rem',
        padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.8125rem', color: 'var(--fg-0)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      }}>
        <span style={{ display: 'inline-flex', color: 'var(--pri)' }}>{Ico.expand}</span>
        Drop to swap
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 7 — GROUP FULL (prompt to split into new group)
// ─────────────────────────────────────────────────────────────────────────
function HubStateGroupFull() {
  return (
    <HubFrame
      title="codehub · group at capacity"
      tabs={TABS_BUSY}
      meta={{ repos: '2 repos', extras: <span style={{ color: 'var(--wait)' }}>Group "Auth" at capacity · 5/5 panes</span>, agents: '5 agents · 04:26', cost: '$2.62' }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="wait" /><span>group at capacity</span>
        </span>
        <span style={{ flex: 1 }} />
        <span>⌘G new group · ⌘W close pane</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth" color="var(--wait)" panes={5} active />
        <MockGroupTab name="Lint" color="var(--idle)" panes={1} />
        <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
        {/* Five tightly packed panes */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
          <SatPane idx={1} agent="claude" name="claude-1" status="live" focus />
          <SatPane idx={2} agent="codex" name="codex-1" status="wait" />
          <SatPane idx={3} agent="antigravity" name="antigravity-1" status="live" />
          <SatPane idx={4} agent="claude" name="claude-2" status="live" />
          <SatPane idx={5} agent="codex" name="codex-2" status="live" />
          <div style={{
            background: 'var(--bg-1)',
            border: '1.5px dashed var(--wait)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.625rem', padding: '1rem',
          }}>
            <span style={{ color: 'var(--wait)' }}>{Ico.plus}</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', textAlign: 'center', fontWeight: 500 }}>Group full</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '11rem', lineHeight: 1.4 }}>
              5/5 panes. Move this agent into a new group to keep adding.
            </span>
            <button className="btn xs pri">New group<span className="kbd">⌘G</span></button>
          </div>
        </div>
      </div>
    </HubFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 8 — CONTAINER DISCONNECTED
// ─────────────────────────────────────────────────────────────────────────
function HubStateDisconnected() {
  return (
    <HubFrame
      title="codehub · workspace offline"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      banner={<HubBanner tone="err" icon={Ico.plug}
        title="Workspace offline"
        message="container aurora-cc-3a8f stopped responding 42s ago — auto-reconnecting…"
        actions={<>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>retry 3/5</span>
          <button className="btn sm">Reconnect now<span className="kbd">⌘R</span></button>
          <button className="btn sm ghost">Open logs</button>
        </>} />}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        ci: { color: 'var(--err)', label: 'no signal', detail: 'last seen 04:24' },
        agents: 'paused', cost: '$2.62 (held)',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem', color: 'var(--err)' }}>
          <StatusDot status="err" pulse /><span>disconnected · auto-retry 4/5</span>
        </span>
        <span style={{ flex: 1 }} />
        <span>⌘R reconnect · ⌘⇧R hard reset</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <DisconnectedPane idx={1} agent="claude" name="Claude · aurora-api" status="err" />
        <DisconnectedPane idx={2} agent="codex" name="Codex · audit-log" status="err" />
      </div>
    </HubFrame>
  );
}

function DisconnectedPane({ idx, agent, name }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      flex: 1, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0,
      opacity: 0.85,
    }}>
      <div className="ch-pane-head" style={{
        background: 'color-mix(in oklab, var(--err) 14%, var(--bg-1))',
        borderBottom: '1px solid color-mix(in oklab, var(--err) 35%, var(--bd-soft))',
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.75rem',
      }}>
        <window.PaneIndex n={idx} />
        <AgentGlyph agent={agent} size={13} color={meta.accent} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: '0.625rem',
          color: 'var(--bg-0)', background: 'var(--err)',
          padding: '1px 0.3125rem', borderRadius: '62.4375rem', fontWeight: 600,
        }}>OFFLINE</span>
        <span style={{ flex: 1 }} />
        <IconBtn style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        padding: '1.25rem', color: 'var(--fg-2)',
      }}>
        <div style={{ position: 'relative', width: '2.75rem', height: '2.75rem' }}>
          <div className="ch-spin" style={{
            position: 'absolute', inset: 0,
            border: '2px solid var(--bd-soft)', borderTopColor: 'var(--err)',
            borderRadius: '50%',
          }} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--err)' }}>{Ico.plug}</span>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>Reconnecting…</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-3)', fontFamily: 'var(--mono)', textAlign: 'center', lineHeight: 1.5 }}>
          Session preserved · scrollback saved<br />
          Last command: <span style={{ color: 'var(--fg-1)' }}>pnpm test src/auth</span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn xs pri">Retry now<span className="kbd">⌘R</span></button>
          <button className="btn xs ghost">View logs</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 9 — NO ACTIVE WORKSPACE (all closed)
// ─────────────────────────────────────────────────────────────────────────
function HubStateNoWorkspace() {
  return (
    <HubFrame
      title="codehub · no workspace"
      tabs={[]}
      meta={null}
      actionBar={false}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="idle" /><span>no workspace</span>
        </span>
        <span style={{ flex: 1 }} />
        <span>⌘⇧N new workspace · ⌘P search · ⌘R resume</span>
      </>}
    >
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1.5rem',
        background: 'var(--bg-0)', minHeight: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'var(--bg-1)', border: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>
            <span style={{ display: 'inline-flex', transform: 'scale(1.6)' }}>{Ico.grid}</span>
          </div>
          <div style={{ fontSize: '1.25rem', color: 'var(--fg-0)', fontWeight: 600, letterSpacing: '-0.01em' }}>No workspace open</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '28rem', lineHeight: 1.5 }}>
            Open a recent workspace, start a fresh one, or pick up where an agent left off.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', width: '36rem' }}>
          <RecoveryCard icon={Ico.plus} title="New workspace" hint="⌘⇧N" body="Pick repo + branch + container" primary />
          <RecoveryCard icon={Ico.clock} title="Resume session" hint="⌘R" body="6 paused · 1 awaiting input" />
          <RecoveryCard icon={Ico.search} title="Search workspaces" hint="⌘P" body="Recent: aurora-api, dash-web" />
        </div>

        <div style={{ width: '36rem' }}>
          <div className="lbl" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem' }}>Recent</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--bd-soft)', borderRadius: '0.4375rem', overflow: 'hidden' }}>
            <RecentRow color="var(--pri)" name="aurora-api" repos="2 repos · feat/auth-rewrite" detail="2 agents paused · 20m ago" />
            <RecentRow color="var(--a-codex)" name="dash-web" repos="dash-web · main" detail="lint clean · 2h ago" />
            <RecentRow color="var(--a-antigravity)" name="ml-pipeline" repos="ml-pipeline · perf/batching" detail="profiling done · 1d ago" />
          </div>
        </div>
      </div>
    </HubFrame>
  );
}

function RecoveryCard({ icon, title, hint, body, primary }) {
  return (
    <div className="card" style={{
      padding: '0.875rem',
      background: primary ? 'color-mix(in oklab, var(--pri) 9%, var(--bg-1))' : 'var(--bg-1)',
      border: primary ? '1px solid color-mix(in oklab, var(--pri) 35%, var(--bd))' : '1px solid var(--bd-soft)',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', gap: '0.4375rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem' }}>
        <span style={{ color: primary ? 'var(--pri)' : 'var(--fg-1)', display: 'inline-flex' }}>{icon}</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{title}</span>
        <span style={{ flex: 1 }} />
        <span className="kbd">{hint}</span>
      </div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', lineHeight: 1.4 }}>{body}</div>
    </div>
  );
}

function RecentRow({ color, name, repos, detail }) {
  return (
    <div style={{
      padding: '0.5rem 0.75rem', background: 'var(--bg-1)',
      display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500, minWidth: '7rem' }}>{name}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', flex: 1 }}>{repos}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{detail}</span>
      <span style={{ color: 'var(--fg-3)', display: 'inline-flex' }}>{Ico.arrowR}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 10 — HEAVY LOAD (indexing, CI, builds, etc.)
// ─────────────────────────────────────────────────────────────────────────
function HubStateHeavyLoad() {
  return (
    <HubFrame
      title="codehub · heavy load"
      tabs={TABS_BUSY}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        ci: { color: 'var(--wait)', label: 'CI running', detail: 'build 142/250' },
        extras: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--wait)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wait)' }} />indexing 84%
          </span>
          <span style={{ color: 'var(--pri)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pri)' }} />2 docker builds
          </span>
          <span style={{ color: 'var(--live)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--live)' }} />218 tests
          </span>
        </span>,
        agents: '4 agents · 04:26', cost: '$8.94 (peak)',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span style={{ color: 'var(--wait)' }}>cpu 96%</span>
        <span style={{ color: 'var(--wait)' }}>mem 3.8/4 GiB</span>
        <span style={{ color: 'var(--wait)' }}>net ↓ 4.2 MB/s</span>
        <span style={{ color: 'var(--pri)' }}>burn $5.40/h</span>
        <span style={{ flex: 1 }} />
        <span>⌘⇧L logs · ⌘⇧J jobs</span>
      </>}
      rail={<JobsRail />}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live" focus
          peek={<window.TermBlock lines={[
            [['user', '> Run all tests + lint + typecheck before pushing']],
            [],
            [['ok', '● '], ['user', 'Plan'], ['dim', '  6 parallel jobs']],
            [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'eslint .                          1.2s']],
            [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'tsc --noEmit                      8.4s']],
            [['dim', '  ├ '], ['ok', '✓ '], ['meta', 'pnpm test:unit (218)              12.1s']],
            [['dim', '  ├ '], ['warn', '● '], ['meta', 'pnpm test:integration (142/180)']],
            [['dim', '  ├ '], ['warn', '● '], ['meta', 'docker build app                  04:22']],
            [['dim', '  └ '], ['warn', '● '], ['meta', 'docker build worker               03:48']],
            [],
            [['meta', '→ '], ['user', '4 jobs running · 2 done']],
            [['prompt blink', '▍']],
          ]} />}
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        <StaticAgentPane idx={2} agent="antigravity" name="Antigravity · ml-pipe" model="gemini-2.5-pro" status="live"
          footer={<MiniMetrics ctxUsed={92400} ctxMax={1000000} turn="01:28" tokens="92k" cost="1.10" />} />
      </div>
    </HubFrame>
  );
}

function JobsRail() {
  return (
    <aside style={{
      width: '17rem', flexShrink: 0,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span className="lbl">Background jobs</span>
        <span className="mono" style={{
          fontSize: '0.625rem', color: 'var(--live)',
          background: 'color-mix(in oklab, var(--live) 14%, transparent)',
          padding: '1px 0.375rem', borderRadius: '62.4375rem',
        }}>6 running</span>
      </div>
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4375rem' }}>
        <JobRow name="docker build · app" eta="01:42" progress={0.72} color="var(--pri)" />
        <JobRow name="docker build · worker" eta="02:14" progress={0.45} color="var(--pri)" />
        <JobRow name="pnpm test:integration" eta="00:18" progress={0.79} color="var(--live)" detail="142 / 180" />
        <JobRow name="tree-sitter index" eta="00:09" progress={0.84} color="var(--wait)" detail="84% · 1.2GB" />
        <JobRow name="CI · aurora-api #842" eta="01:08" progress={0.57} color="var(--wait)" detail="build 142/250" />
        <JobRow name="CI · dash-web #218" eta="—" progress={1.0} color="var(--live)" detail="passed · 14s ago" done />
      </div>
      <div style={{
        padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)',
        display: 'flex', gap: '0.375rem',
      }}>
        <button className="btn xs ghost" style={{ flex: 1, justifyContent: 'center' }}>{Ico.cpu}cpu/mem</button>
        <button className="btn xs ghost" style={{ flex: 1, justifyContent: 'center' }}>{Ico.terminal}logs</button>
      </div>
    </aside>
  );
}

function JobRow({ name, eta, progress, color, detail, done }) {
  return (
    <div style={{
      padding: '0.4375rem 0.5rem', borderRadius: 4,
      display: 'flex', flexDirection: 'column', gap: 4,
      background: 'var(--bg-2)', border: '1px solid var(--bd-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-0)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{name}</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: done ? 'var(--live)' : 'var(--fg-3)' }}>{done ? '✓' : eta}</span>
      </div>
      <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: color, transition: 'width .3s' }} />
      </div>
      {detail && <div style={{ fontFamily: 'var(--mono)', fontSize: '0.5625rem', color: 'var(--fg-3)' }}>{detail}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 11 — SPAWNING (new agent pane is configuring)
// ─────────────────────────────────────────────────────────────────────────
// The user just pressed ⌘A / "New agent". The pane is alive in the grid
// but instead of streaming a terminal it shows a focused configuration form.
// Agent + model + repo + container scope are all pickable inline. ⏎ spawns,
// Esc cancels. This is the "before content fills" state of agent creation.
// NOTE: Files / Shell / Diff are workspace-level toggle panes, NOT spawned
// agents — they have their own toggle states (hs-files-open, hs-shell-open,
// hs-diff-open).
function HubStateSpawning() {
  return (
    <HubFrame
      title="codehub · configuring new agent"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      meta={{
        repos: '2 repos', uncommitted: '+9',
        extras: <span style={{ color: 'var(--pri)' }}>configuring agent…</span>,
        agents: '1 agent · 04:26', cost: '$2.31',
      }}
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span>⏎ spawn · Esc cancel · Tab next · ⌘⇧1–3 agent</span>
      </>}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live"
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        <SpawningPane idx={2} />
      </div>
    </HubFrame>
  );
}

function SpawningPane({ idx }) {
  const color = 'var(--a-claude)';
  return (
    <div style={{
      flex: 1, background: 'var(--bg-0)',
      display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0,
      // dashed accent outline signals "this pane is not yet running"
      outline: `1.5px dashed ${color}`, outlineOffset: -1,
      position: 'relative',
    }}>
      <div className="ch-pane-head" style={{
        background: `color-mix(in oklab, ${color} 14%, var(--bg-1))`,
        borderBottom: `1px solid color-mix(in oklab, ${color} 35%, var(--bd-soft))`,
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.75rem',
      }}>
        <window.PaneIndex n={idx} active />
        <AgentGlyph agent="claude" size={13} color={color} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>New agent</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>· configuring</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Cancel (Esc)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>

      {/* Centered minimal form — visually mirrors HubStateEmpty's "Workspace ready"
          layout: dashed-border icon, title + hint, then a tight stack of
          dropdown fields (Agent / Model / Repo / Container), then a primary
          Spawn CTA and a keyboard-hint footer. */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1.25rem', padding: '2rem', overflow: 'auto', minHeight: 0,
      }}>
        <div style={{
          width: '4rem', height: '4rem', borderRadius: '1rem',
          border: `1.5px dashed ${color}`,
          background: `color-mix(in oklab, ${color} 10%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          <AgentGlyph agent="claude" size={22} color={color} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3125rem' }}>
          <div style={{ fontSize: '1.0625rem', color: 'var(--fg-0)', fontWeight: 500, letterSpacing: '-0.01em' }}>New agent</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '22rem', lineHeight: 1.5 }}>
            Pick the agent, model, and container. ⏎ to spawn.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4375rem', width: '22rem' }}>
          <DropdownField
            icon={<AgentGlyph agent="claude" size={13} color="var(--a-claude)" />}
            label="Agent" value="Claude Code"
            kbd="⌘⇧1"
          />
          <DropdownField
            icon={<span style={{ display: 'inline-flex', color: 'var(--fg-2)', fontSize: 12 }}>{Ico.cpu}</span>}
            label="Model" value="opus-4.7"
            hint="1M ctx"
          />
          <DropdownField
            icon={<span style={{ display: 'inline-flex', color: 'var(--fg-2)' }}>{Ico.branch}</span>}
            label="Repo"  value="aurora-api · feat/auth-rewrite"
          />
          <DropdownField
            icon={<span style={{ display: 'inline-flex', color: 'var(--fg-2)' }}>{Ico.container}</span>}
            label="Container" value="Inherit"
            hint="aurora-cc-3a8f"
          />
        </div>

        <button className="btn pri sm" style={{ minWidth: '14rem', justifyContent: 'center' }}>
          Spawn agent<span className="kbd">⏎</span>
        </button>

        <div style={{
          fontSize: '0.6875rem', color: 'var(--fg-3)', fontFamily: 'var(--mono)',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <span>tip:</span>
          <span>⌘⇧1–3 swap agent</span>
          <span>·</span>
          <span>Esc cancel</span>
          <span>·</span>
          <span>Tab next field</span>
        </div>
      </div>
    </div>
  );
}

// Compact dropdown row — left icon + label, right value + chevron + optional
// hint. Same visual shape across all spawn fields. Click target is the whole
// row. Designed to read at a glance: label on left tells you what's being
// chosen, value on right is the current pick.
function DropdownField({ icon, label, value, hint, kbd }) {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.5rem 0.75rem',
      background: 'var(--bg-1)', border: '1px solid var(--bd-soft)', borderRadius: 6,
      cursor: 'pointer', width: '100%',
      color: 'inherit', fontFamily: 'inherit',
    }}>
      <span style={{ flexShrink: 0, display: 'inline-flex', width: '0.875rem', justifyContent: 'center' }}>{icon}</span>
      <span className="lbl" style={{ fontSize: '0.6875rem', minWidth: '4.5rem', textAlign: 'left' }}>{label}</span>
      <span className="mono" style={{
        flex: 1, fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500,
        textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
      {hint && <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{hint}</span>}
      {kbd && <span className="kbd">{kbd}</span>}
      <span style={{ display: 'inline-flex', color: 'var(--fg-3)' }}>{Ico.chevD}</span>
    </button>
  );
}

// ── form atoms ──────────────────────────────────────────────────────────────
// Kept around for future spawn variants — current SpawningPane uses inline
// DropdownField rows instead.
function FormGroup({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4375rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span className="lbl" style={{ fontSize: '0.6875rem' }}>{label}</span>
        {hint && <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SegmentedPicker({ value, options }) {
  return (
    <div style={{
      display: 'inline-flex', border: '1px solid var(--bd-soft)', borderRadius: 6, padding: 2,
      background: 'var(--bg-1)', alignSelf: 'flex-start', flexWrap: 'wrap',
    }}>
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button key={o.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '4px 0.625rem', fontSize: '0.75rem',
            background: sel ? 'var(--bg-3)' : 'transparent',
            color: sel ? 'var(--fg-0)' : 'var(--fg-2)',
            border: 'none', borderRadius: 4, cursor: 'pointer',
            fontWeight: sel ? 500 : 400, fontFamily: 'inherit',
          }}>
            <span style={{ color: o.accent, display: 'inline-flex' }}>{o.icon}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function AgentCard({ agent, model, desc, kbd, selected }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      padding: '0.6875rem 0.75rem', borderRadius: 8,
      border: selected ? `1.5px solid ${meta.accent}` : '1px solid var(--bd-soft)',
      background: selected
        ? `color-mix(in oklab, ${meta.accent} 12%, var(--bg-1))`
        : 'var(--bg-1)',
      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.3125rem',
      position: 'relative', minHeight: '5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4375rem' }}>
        <AgentGlyph agent={agent} size={14} color={meta.accent} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{meta.name}</span>
        {selected && <span style={{ marginLeft: 'auto', color: meta.accent, display: 'inline-flex' }}>{Ico.check}</span>}
      </div>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)' }}>{model}</span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', lineHeight: 1.4 }}>{desc}</span>
      {kbd && <span className="kbd" style={{ position: 'absolute', top: '0.6875rem', right: '0.75rem' }}>{kbd}</span>}
    </div>
  );
}

function ChipOption({ children, selected, custom }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 0.5rem', fontSize: '0.6875rem',
      fontFamily: custom ? 'inherit' : 'var(--mono)',
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd-soft)'),
      background: selected
        ? 'color-mix(in oklab, var(--pri) 12%, transparent)'
        : 'var(--bg-1)',
      color: custom ? 'var(--fg-3)' : (selected ? 'var(--fg-0)' : 'var(--fg-1)'),
      borderRadius: 4, cursor: 'pointer',
      fontWeight: selected ? 500 : 400,
      fontStyle: custom ? 'italic' : 'normal',
    }}>{children}</button>
  );
}

function RadioRow({ label, detail, selected }) {
  return (
    <div style={{
      padding: '0.5rem 0.625rem', borderRadius: 6,
      border: '1px solid ' + (selected ? 'var(--pri)' : 'var(--bd-soft)'),
      background: selected
        ? 'color-mix(in oklab, var(--pri) 9%, var(--bg-1))'
        : 'var(--bg-1)',
      display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer',
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: '50%',
        border: '1.5px solid ' + (selected ? 'var(--pri)' : 'var(--fg-3)'),
        marginTop: 2, flexShrink: 0, position: 'relative',
      }}>
        {selected && <span style={{
          position: 'absolute', inset: 2, borderRadius: '50%', background: 'var(--pri)',
        }} />}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', lineHeight: 1.4 }}>{detail}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATE 12–14 — UTILITY TOGGLES (Files / Shell / Diff)
// ─────────────────────────────────────────────────────────────────────────
// Files / Shell / Diff aren't spawnable panes like agents — they're single
// workspace-level docked panels you toggle from the bottom action bar.
// At most one of each is visible per workspace at a time. Their button in
// the action bar shows an active (filled) state while the panel is open.
function HubStateFilesOpen() {
  return (
    <HubFrame
      title="codehub · files docked"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      meta={{ repos: '2 repos', uncommitted: '+9', agents: '2 agents · 04:26', cost: '$2.62' }}
      filesOpen
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span>⌘E hide files · ⌘P quick open</span>
      </>}
      leftPanel={<FilesPanel />}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live" focus
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        <StaticAgentPane idx={2} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait"
          footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22k" cost="0.31" waiting="00:14" />} />
      </div>
    </HubFrame>
  );
}

function FilesPanel() {
  return (
    <aside style={{
      width: '16rem', flexShrink: 0,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.4375rem',
      }}>
        <span style={{ color: 'var(--idle)', display: 'inline-flex' }}>{Ico.files}</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>Files</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>3 repos</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Filter" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.search}</IconBtn>
        <IconBtn title="Hide files panel (⌘E)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>
      {/* Multi-repo file tree — each repo is a top-level node showing its
          branch + dirty count next to the name. One is open with its tree
          expanded; the others are collapsed so the panel doesn't crowd. */}
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.4375rem 0.5rem 0.5rem 0.625rem', fontFamily: 'var(--mono)', fontSize: '0.75rem', lineHeight: 1.55 }}>
        <RepoNode name="aurora-api" branch="feat/auth-rewrite" dirty={7} open>
          <FileNode level={1} kind="folder" open name="src" />
          <FileNode level={2} kind="folder" open name="auth" />
          <FileNode level={3} kind="file" name="verifier.ts"      status="add" />
          <FileNode level={3} kind="file" name="verifier.spec.ts" status="add" />
          <FileNode level={2} kind="folder" open name="middleware" />
          <FileNode level={3} kind="file" name="auth.ts"          status="mod" selected />
          <FileNode level={3} kind="file" name="cors.ts" />
          <FileNode level={3} kind="file" name="logger.ts" />
          <FileNode level={2} kind="folder" name="api" />
          <FileNode level={2} kind="folder" name="db" />
          <FileNode level={2} kind="folder" name="types" />
          <FileNode level={2} kind="file" name="index.ts" />
          <FileNode level={1} kind="folder" open name="migrations" />
          <FileNode level={2} kind="file" name="0008_audit_log.sql" status="add" />
          <FileNode level={2} kind="file" name="0007_users.sql" />
          <FileNode level={1} kind="file" name="package.json"   status="mod" />
          <FileNode level={1} kind="file" name="tsconfig.json" />
        </RepoNode>
        <RepoNode name="shared" branch="main" dirty={2} />
        <RepoNode name="scripts" branch="main" dirty={0} />
      </div>
      <div style={{
        padding: '0.4375rem 0.625rem', borderTop: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.4375rem',
        fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)',
      }}>
        <span style={{ color: 'var(--live)' }}>● live</span>
        <span>3 repos · 132 files</span>
        <span style={{ color: 'var(--wait)' }}>9 changed</span>
      </div>
    </aside>
  );
}

// Repo-level node — slightly different chrome than FileNode (branch + dirty
// count instead of file status mark). Renders its children when open.
function RepoNode({ name, branch, dirty, open, children }) {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3125rem',
        paddingLeft: 0, paddingRight: '0.25rem',
        marginTop: '0.1875rem',
        borderRadius: 3, cursor: 'pointer',
      }}>
        <span style={{ width: '0.625rem', display: 'inline-flex', color: 'var(--fg-3)', transform: open ? 'none' : 'rotate(-90deg)' }}>{Ico.chevD}</span>
        <span style={{ color: open ? 'var(--pri)' : 'var(--fg-2)', display: 'inline-flex' }}>{Ico.container}</span>
        <span style={{ fontWeight: 500, color: 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
        {dirty > 0 && <span style={{ color: 'var(--wait)' }}>+{dirty}</span>}
      </div>
      <div style={{
        paddingLeft: '0.625rem', marginLeft: '0.5rem',
        fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)',
        display: 'flex', alignItems: 'center', gap: 3,
        marginBottom: open ? '0.1875rem' : 0,
      }}>
        {Ico.branch}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branch}</span>
      </div>
      {open && children}
    </>
  );
}

function FileNode({ level, kind, open, name, status, selected }) {
  const ind = level * 0.875;
  const statusColor = status === 'add' ? 'var(--live)' : status === 'mod' ? 'var(--wait)' : status === 'del' ? 'var(--err)' : 'var(--fg-3)';
  const statusMark = status === 'add' ? '+' : status === 'mod' ? '~' : status === 'del' ? '−' : '';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3125rem',
      paddingLeft: `${ind}rem`, paddingRight: '0.25rem',
      borderRadius: 3,
      background: selected ? 'var(--bg-3)' : 'transparent',
      color: selected ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer',
    }}>
      {kind === 'folder' && <span style={{ width: '0.625rem', display: 'inline-flex', color: 'var(--fg-3)', transform: open ? 'none' : 'rotate(-90deg)' }}>{Ico.chevD}</span>}
      {kind !== 'folder' && <span style={{ width: '0.625rem' }} />}
      <span style={{ color: kind === 'folder' ? 'var(--fg-2)' : 'inherit' }}>
        {kind === 'folder' ? (open ? '▾' : '▸') : ' '}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {statusMark && (
        <span className="mono" style={{ color: statusColor, fontWeight: 600 }}>{statusMark}</span>
      )}
    </div>
  );
}

function HubStateShellOpen() {
  return (
    <HubFrame
      title="codehub · shell docked"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      meta={{ repos: '2 repos', uncommitted: '+9', agents: '2 agents · 04:26', cost: '$2.62' }}
      shellOpen
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span>mem 1.2/4 GiB</span>
        <span style={{ flex: 1 }} />
        <span>⌘⇧B hide shell · ⌃` focus shell</span>
      </>}
      bottomPanel={<ShellPanel />}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live" focus
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        <StaticAgentPane idx={2} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait"
          footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22k" cost="0.31" waiting="00:14" />} />
      </div>
    </HubFrame>
  );
}

function ShellPanel() {
  return (
    <div style={{
      flexShrink: 0, height: '14rem',
      background: 'var(--bg-0)',
      borderTop: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        height: '2rem', flexShrink: 0,
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.4375rem',
        padding: '0 0.625rem',
      }}>
        <span style={{ color: 'var(--live)', display: 'inline-flex' }}>{Ico.terminal}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>Shell</span>
        {/* shell session tabs — small chips. only one is the focused one */}
        <div style={{ display: 'flex', gap: 2, marginLeft: '0.4375rem' }}>
          <ShellTab name="bash · aurora-api" active />
          <ShellTab name="pnpm test --watch" running />
          <button className="btn ghost xs" style={{ padding: '2px 4px' }} title="New shell">{Ico.plus}</button>
        </div>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>aurora-cc-3a8f</span>
        <IconBtn title="Detach to pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
        <IconBtn title="Hide shell (⌘⇧B)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <window.TermBlock lines={[
          [['user', '$ git status']],
          [['meta', 'On branch '], ['user', 'feat/auth-rewrite']],
          [['meta', 'Your branch is up to date with '], ['user', 'origin/feat/auth-rewrite']],
          [['meta', 'Changes not staged for commit:']],
          [['removed', '  modified: src/middleware/auth.ts']],
          [['added',   '  new file: src/auth/verifier.ts']],
          [['added',   '  new file: src/auth/verifier.spec.ts']],
          [['added',   '  new file: migrations/0008_audit_log.sql']],
          [],
          [['user', '$ pnpm test src/auth']],
          [['ok', '   ✓ '], ['user', 'verifier.spec.ts'], ['meta', ' (4 tests) 142ms']],
          [['dim', '     PASS · 218 tests total']],
          [],
          [['user', '$ ']], [['prompt blink', '▍']],
        ]} />
      </div>
    </div>
  );
}

function ShellTab({ name, active, running }) {
  return (
    <span title={name} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
      padding: '2px 0.5rem', borderRadius: 4,
      fontFamily: 'var(--mono)', fontSize: '0.6875rem',
      background: active ? 'var(--bg-3)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      border: active ? '1px solid var(--bd-soft)' : '1px solid transparent',
      cursor: 'pointer',
    }}>
      {running && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--live)' }} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10rem' }}>{name}</span>
    </span>
  );
}

function HubStateDiffOpen() {
  return (
    <HubFrame
      title="codehub · diff docked"
      tabs={[
        { color: 'var(--pri)', name: 'aurora-api', repos: '2 repos', agentCount: 2, active: true },
        { color: 'var(--a-codex)', name: 'dash-web', repos: 'dash-web', agentCount: 1 },
      ]}
      meta={{ repos: '2 repos', uncommitted: '+9', agents: '2 agents · 04:26', cost: '$2.62' }}
      diffOpen
      status={<>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
          <StatusDot status="live" pulse /><span>aurora-cc-3a8f</span>
        </span>
        <span>cpu 47%</span>
        <span style={{ flex: 1 }} />
        <span>⌘D hide diff · ⌘⇧K stage hunk · ⌘⏎ commit</span>
      </>}
      rail={<DiffPanel />}
    >
      <div style={{ height: '2rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', background: 'var(--bg-1)', paddingLeft: '0.5rem' }}>
        <MockGroupTab name="Auth + audit" color="var(--pri)" panes={2} active />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
        <StaticAgentPane idx={1} agent="claude" name="Claude · aurora-api" model="opus-4.7" status="live" focus
          footer={<MiniMetrics ctxUsed={184200} ctxMax={1000000} turn="04:12" tokens="184k" cost="2.31" />} />
        <StaticAgentPane idx={2} agent="codex" name="Codex · audit-log" model="o4-mini" status="wait"
          footer={<MiniMetrics ctxUsed={22600} ctxMax={200000} turn="00:14" tokens="22k" cost="0.31" waiting="00:14" />} />
      </div>
    </HubFrame>
  );
}

function DiffPanel() {
  return (
    <aside style={{
      width: '22rem', flexShrink: 0,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{
        padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.4375rem',
      }}>
        <span style={{ color: 'var(--wait)', display: 'inline-flex' }}>{Ico.diff}</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>Diff</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--live)' }}>+113</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--err)' }}>−28</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>3 files</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Hide diff panel (⌘D)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>
      {/* file list */}
      <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--bd-soft)' }}>
        <DiffFileRow path="src/auth/verifier.ts" added={42} removed={0} active />
        <DiffFileRow path="src/middleware/auth.ts" added={3} removed={28} />
        <DiffFileRow path="src/auth/verifier.spec.ts" added={68} removed={0} />
      </div>
      {/* hunk preview */}
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.5rem 0', fontFamily: 'var(--mono)', fontSize: '0.6875rem', background: 'var(--bg-0)' }}>
        <DiffHunkLine n={1}  kind="ctx" text="import type { Middleware } from 'koa';" />
        <DiffHunkLine n={2}  kind="rem" text="import { jwtVerify } from 'jose';" />
        <DiffHunkLine n={3}  kind="add" text="import { verifyToken } from '../auth/verifier';" />
        <DiffHunkLine n={4}  kind="ctx" text="" />
        <DiffHunkLine n={5}  kind="ctx" text="export const requireAuth: Middleware = async (ctx, next) => {" />
        <DiffHunkLine n={6}  kind="rem" text="  try {" />
        <DiffHunkLine n={7}  kind="rem" text="    const token = ctx.headers.authorization?.replace(/^Bearer /, '');" />
        <DiffHunkLine n={8}  kind="rem" text="    if (!token) ctx.throw(401);" />
        <DiffHunkLine n={9}  kind="add" text="  const token = ctx.headers.authorization?.replace(/^Bearer /, '');" />
        <DiffHunkLine n={10} kind="add" text="  const r = token && await verifyToken(token, SECRET);" />
        <DiffHunkLine n={11} kind="add" text="  if (!r || !r.ok) ctx.throw(401, r?.reason ?? 'no-token');" />
        <DiffHunkLine n={12} kind="ctx" text="  await next();" />
        <DiffHunkLine n={13} kind="ctx" text="};" />
      </div>
      <div style={{
        padding: '0.5rem 0.625rem', borderTop: '1px solid var(--bd-soft)',
        display: 'flex', gap: '0.375rem',
      }}>
        <button className="btn xs" style={{ flex: 1, justifyContent: 'center' }}>Stage all</button>
        <button className="btn xs pri" style={{ flex: 1, justifyContent: 'center' }}>Commit…<span className="kbd">⌘⏎</span></button>
      </div>
    </aside>
  );
}

function DiffFileRow({ path, added, removed, active }) {
  return (
    <div style={{
      padding: '0.4375rem 0.625rem',
      background: active ? 'var(--bg-2)' : 'var(--bg-1)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '0.4375rem',
      fontFamily: 'var(--mono)', fontSize: '0.6875rem',
      borderBottom: '1px solid var(--bd-soft)',
    }}>
      <span style={{ color: active ? 'var(--fg-0)' : 'var(--fg-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{path}</span>
      {added > 0 && <span style={{ color: 'var(--live)' }}>+{added}</span>}
      {removed > 0 && <span style={{ color: 'var(--err)' }}>−{removed}</span>}
    </div>
  );
}

function DiffHunkLine({ n, kind, text }) {
  const bg = kind === 'add' ? 'color-mix(in oklab, var(--live) 9%, transparent)'
    : kind === 'rem' ? 'color-mix(in oklab, var(--err) 9%, transparent)' : 'transparent';
  const fg = kind === 'add' ? 'var(--live)' : kind === 'rem' ? 'var(--err)' : 'var(--fg-1)';
  const marker = kind === 'add' ? '+' : kind === 'rem' ? '−' : ' ';
  return (
    <div style={{ display: 'flex', background: bg, padding: '1px 0' }}>
      <span style={{ width: '1.875rem', color: 'var(--fg-3)', textAlign: 'right', paddingRight: '0.4375rem', flexShrink: 0 }}>{n}</span>
      <span style={{ width: '1rem', color: fg, flexShrink: 0 }}>{marker}</span>
      <span style={{ color: kind === 'ctx' ? 'var(--fg-1)' : fg, whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
    </div>
  );
}

// ── Exports ─────────────────────────────────────────────────────────────────
Object.assign(window, {
  HubFrame, StaticTab, StaticTabBar, MetaStrip, ActionBar, StatusBar, HubBanner,
  HubStateEmpty, HubStateEmptyGroup, HubStateAwaiting, HubStateSaturated, HubStateFocus,
  HubStateTabOverflow, HubStateDragging, HubStateGroupFull, HubStateDisconnected,
  HubStateNoWorkspace, HubStateHeavyLoad,
  HubStateSpawning,
  HubStateFilesOpen, HubStateShellOpen, HubStateDiffOpen,
});
