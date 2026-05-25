// CodeHub — Resume. NOT a workspace-level surface: resuming an agent
// session is per-agent, so this is a docked drawer that opens from the hub's
// bottom Pane Actions bar ("Resume" button). Sessions are grouped by agent
// (Claude Code, Codex, Antigravity). Click one and it spawns as a pane in
// the current workspace with tmux scrollback + agent context restored.

function Resume() {
  return (
    <AppChrome w={1440} h={900} title="codehub · aurora-api · resume drawer">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" />

        {/* Main hub column — same chrome as MainHubA */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)' }}>
          <window.HubWorkspaceTabBar />
          <window.WorkspaceArea />

          {/* workspace meta strip */}
          <div style={{
            height: '1.625rem', flexShrink: 0,
            background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.875rem', gap: '0.875rem',
            fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', color: 'var(--fg-1)' }}>
              {Ico.branch}<span>2 repos</span>
              <span style={{ color: 'var(--wait)' }}>+9 uncommitted</span>
            </span>
            <span style={{ flex: 1 }} />
            <span>2 agents · 04:26</span>
            <span style={{ color: 'var(--fg-1)' }}>$2.62</span>
          </div>

          {/* pane actions bar — Resume button is highlighted/active */}
          <div style={{
            height: '2.25rem', flexShrink: 0,
            background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.375rem',
          }}>
            <window.PaneAddBtn kind="files" kbd="⌘E" />
            <window.PaneAddBtn kind="shell" kbd="⌘⇧B" />
            <window.PaneAddBtn kind="diff" kbd="⌘D" />
            <span style={{ flex: 1 }} />
            {/* Resume button — highlighted because the drawer is open */}
            <button className="btn xs" title="Hide Resume drawer (⌘R)" style={{
              padding: '4px 0.5rem',
              background: 'var(--bg-3)', color: 'var(--fg-0)',
              outline: '1px solid var(--bd-soft)', outlineOffset: -1,
            }}>
              {Ico.clock}Resume<span className="kbd">⌘R</span>
            </button>
            <SpawnSplitBtn />
          </div>

          {/* status bar */}
          <div style={{
            height: '1.625rem', flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.875rem',
            fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
              <StatusDot status="live" />{Ico.container}<span>aurora-cc-3a8f</span>
            </span>
            <span>cpu 47%</span>
            <span>mem 1.2/4 GiB</span>
            <span style={{ flex: 1 }} />
            <span>⌘R drawer</span>
            <span>⏎ resume</span>
            <span>⌘K palette</span>
          </div>
        </main>

        {/* RESUME DRAWER — docked right, replaces the Activity rail slot.
            User can flip it to dock-left via the toggle in the drawer header. */}
        <ResumeDrawer />
      </div>
    </AppChrome>
  );
}

// ── DRAWER ─────────────────────────────────────────────────────────────────
function ResumeDrawer() {
  const [side, setSide] = React.useState('right');
  return (
    <aside style={{
      width: '21.875rem', flexShrink: 0,
      background: 'var(--bg-1)',
      borderLeft: '1px solid var(--bd-soft)',
      display: 'flex', flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* header */}
      <div style={{
        padding: '0.625rem 0.875rem',
        borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <span style={{ display: 'inline-flex', color: 'var(--fg-1)' }}>{Ico.clock}</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--fg-0)' }}>Resume session</span>
        <span className="mono" style={{
          fontSize: '0.625rem', color: 'var(--fg-3)',
          background: 'var(--bg-3)', padding: '1px 0.3125rem', borderRadius: '62.4375rem',
        }}>24</span>
        <span style={{ flex: 1 }} />
        {/* Dock side toggle */}
        <div style={{
          display: 'inline-flex', border: '1px solid var(--bd-soft)', borderRadius: 4, overflow: 'hidden',
        }}>
          <IconBtn title="Dock left" active={side === 'left'} onClick={() => setSide('left')}
            style={{ width: '1.375rem', height: '1.375rem', borderRadius: 0 }}>{Ico.sidebarL}</IconBtn>
          <IconBtn title="Dock right" active={side === 'right'} onClick={() => setSide('right')}
            style={{ width: '1.375rem', height: '1.375rem', borderRadius: 0 }}>{Ico.sidebarR}</IconBtn>
        </div>
        <IconBtn title="Close drawer (⌘R)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>

      {/* search + filter */}
      <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          background: 'var(--bg-2)', border: '1px solid var(--bd-soft)', borderRadius: 6,
          padding: '0.25rem 0.5rem',
        }}>
          <span style={{ color: 'var(--fg-3)', display: 'inline-flex' }}>{Ico.search}</span>
          <input type="text" placeholder="filter sessions…" style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontSize: '0.75rem', flex: 1,
          }} />
          <span className="kbd" style={{ fontSize: '0.5625rem' }}>/</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn xs" style={{ background: 'var(--bg-3)' }}>All · 24</button>
          <button className="btn xs ghost">Today · 6</button>
          <button className="btn xs ghost">Week · 18</button>
          <button className="btn xs ghost">Older</button>
        </div>
      </div>

      {/* body — sessions grouped by agent */}
      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.25rem 0 0.75rem' }}>
        <AgentSection agent="claude" total={14}>
          <DrawerRow agent="claude" name="aurora-api" branch="feat/auth-rewrite"
            title="Refactor src/middleware/auth.ts to extract JWT verify into a separate verifier module"
            age="20 min" status="paused" cost="$2.31" tokens="184k" containerLive />
          <DrawerRow agent="claude" name="dash-web" branch="main"
            title="Fix lint errors across components/"
            age="2 h" status="done" cost="$0.81" tokens="64k" />
          <DrawerRow agent="claude" name="aurora-api" branch="feat/rate-limit"
            title="Add per-IP rate limiting middleware"
            age="1 d" status="failed" cost="$0.48" tokens="38k" failure="OOM" />
        </AgentSection>

        <AgentSection agent="codex" total={7}>
          <DrawerRow agent="codex" name="aurora-api" branch="feat/audit-log"
            title="Write migration for audit_log table with FK to users"
            age="42 min" status="awaiting" cost="$0.31" tokens="22k" containerLive />
          <DrawerRow agent="codex" name="aurora-api" branch="feat/audit-log"
            title="Initial scaffolding for audit log feature"
            age="3 d" status="done" cost="$0.41" tokens="58k" />
        </AgentSection>

        <AgentSection agent="antigravity" total={3}>
          <DrawerRow agent="antigravity" name="ml-pipeline" branch="perf/batching"
            title="Profile slow batches in pipeline/run.py"
            age="1 d" status="done" cost="$1.10" tokens="92k" />
        </AgentSection>
      </div>
    </aside>
  );
}

function AgentSection({ agent, total, children }) {
  const meta = AGENT_META[agent];
  const count = React.Children.count(children);
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4375rem',
        padding: '0.375rem 0.875rem 0.3125rem',
      }}>
        <AgentGlyph agent={agent} size={12} color={meta.accent} />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-1)', fontWeight: 500 }}>{meta.short}</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>
          showing {count} / {total}
        </span>
        <span style={{ flex: 1 }} />
        <button className="btn ghost xs" style={{ padding: '2px 0.3125rem', fontSize: '0.6875rem' }}>see all</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function DrawerRow({ agent, name, branch, title, age, status, cost, tokens, containerLive, failure }) {
  const statusMap = {
    paused:    { color: 'var(--idle)', label: 'paused' },
    awaiting:  { color: 'var(--wait)', label: 'awaiting' },
    done:      { color: 'var(--live)', label: 'done' },
    failed:    { color: 'var(--err)', label: 'failed' },
    aborted:   { color: 'var(--fg-3)', label: 'aborted' },
  };
  const sc = statusMap[status] || statusMap.done;
  return (
    <div className="drawer-row" style={{
      padding: '0.5rem 0.875rem 0.5rem 0.625rem',
      display: 'flex', flexDirection: 'column', gap: 4,
      borderLeft: `2px solid ${sc.color}`,
      marginLeft: '0.5rem',
      cursor: 'pointer',
      borderBottom: '1px solid var(--bd-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
        <span className="mono" style={{
          fontSize: '0.625rem', color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0,
        }}>{Ico.branch}{branch}</span>
        <span style={{
          fontSize: '0.625rem', color: sc.color, fontFamily: 'var(--mono)',
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.color }} />
          {sc.label}
        </span>
      </div>
      <div style={{
        fontSize: '0.75rem', color: 'var(--fg-1)', lineHeight: 1.4,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>{title}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)',
      }}>
        <span>{age}</span>
        <span>·</span>
        <span>{tokens}</span>
        <span>·</span>
        <span>{cost}</span>
        {containerLive && (
          <span style={{ color: 'var(--live)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--live)' }} />live
          </span>
        )}
        {failure && <span style={{ color: 'var(--err)' }}>· {failure}</span>}
        <span style={{ flex: 1 }} />
        {status === 'awaiting' ? (
          <button className="btn xs ok solid" style={{ padding: '2px 0.5rem' }}>Resume<span className="kbd">⏎</span></button>
        ) : status === 'failed' ? (
          <button className="btn xs ghost" style={{ padding: '2px 0.5rem' }}>Retry</button>
        ) : status === 'done' ? (
          <button className="btn xs ghost" style={{ padding: '2px 0.5rem' }}>Open</button>
        ) : (
          <button className="btn xs pri" style={{ padding: '2px 0.5rem' }}>Resume<span className="kbd">⏎</span></button>
        )}
      </div>
    </div>
  );
}

window.Resume = Resume;
