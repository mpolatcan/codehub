// CodeHub — Main Hub (variation A: sidebar + 2-pane vertical split)
// The home view: session list on the left, active session as terminals on the right.

function MainHubA() {
  return (
    <AppChrome w={1440} h={900} title="codehub · ~/work/aurora-api">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-1)' }}>
          {/* workspace tabs — right-click for workspace actions */}
          <window.HubWorkspaceTabBar />

          {/* TERMINAL TILE GRID — wrapped in WorkspaceArea (groups + group grid) */}
          <WorkspaceArea />

          {/* WORKSPACE META STRIP — bottom-of-main, collapsed multi-repo summary */}
          <div style={{
            height: '1.625rem', flexShrink: 0,
            background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.875rem', gap: '0.875rem',
            fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', color: 'var(--fg-1)' }} title="aurora-api +1 — click to expand">
              {Ico.branch}
              <span>2 repos</span>
              <span style={{ color: 'var(--wait)' }}>+9 uncommitted</span>
            </span>
            <div className="vr" style={{ height: '0.875rem' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem' }} title="CI passing across all repos · 218 tests · 4 lint warnings">
              <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--live)' }} />
              <span style={{ color: 'var(--fg-1)' }}>CI ✓</span>
              <span style={{ color: 'var(--fg-3)' }}>218 · lint 4</span>
            </span>
            <span style={{ flex: 1 }} />
            <span>2 agents · 04:26</span>
            <span style={{ color: 'var(--fg-1)' }}>$2.62</span>
          </div>

          {/* PANE ACTIONS BAR — add pane + split controls live here, at the bottom */}
          <div style={{
            height: '2.25rem', flexShrink: 0,
            background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.375rem',
          }}>
            <window.PaneAddBtn kind="files" kbd="⌘E" />
            <window.PaneAddBtn kind="shell" kbd="⌘⇧B" />
            <window.PaneAddBtn kind="diff" kbd="⌘D" />
            <span style={{ flex: 1 }} />
            <button className="btn ghost xs" title="Resume a past session in this workspace (⌘R)" style={{ padding: '4px 0.5rem' }}>
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }} title="Container ID"><StatusDot status="live" />{Ico.container}<span>aurora-cc-3a8f</span></span>
            <span title="Container CPU">cpu 47%</span>
            <span title="Container memory">mem 1.2/4 GiB</span>
            <span title="Network IO">net ↓ 14 KB/s</span>
            <span title="Spend rate (rolling 5 min)" style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem', color: 'var(--fg-1)' }}>
              <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--pri)', boxShadow: '0 0 6px var(--pri)' }} />
              <span>burn $0.62/h</span>
            </span>
            <div style={{ flex: 1 }} />
            <span title="Command palette">⌘K palette</span>
            <span title="Split active pane">⌘\ split</span>
            <span title="Jump to pane by index">⌘1–9 jump</span>
          </div>
        </main>

        {/* RIGHT PEEK (notifications) -------------------------------- */}
        {/* When activity rail is hidden, the reveal button takes its place. */}
        <button
          className="ch-activity-rail-reveal"
          title="Show activity panel (⌘⇧A)"
          onClick={() => window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { activityRail: 'visible' } }, '*')}
          style={{
            display: 'none',
            width: '2rem', alignSelf: 'stretch', flexShrink: 0,
            border: 'none', background: 'var(--bg-1)',
            borderLeft: '1px solid var(--bd-soft)',
            color: 'var(--fg-2)', cursor: 'pointer',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            padding: '0.75rem 0', gap: '0.75rem',
          }}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            {Ico.bell}
            <span style={{
              position: 'absolute', top: -3, right: -5,
              fontFamily: 'var(--mono)', fontSize: '0.625rem', fontWeight: 600,
              padding: '1px 4px', borderRadius: '62.4375rem',
              color: 'var(--bg-0)', background: 'var(--wait)',
              lineHeight: 1, minWidth: '0.75rem', textAlign: 'center',
            }}>1</span>
          </span>
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>{Ico.sidebarR}</span>
        </button>
        <aside className="ch-activity-rail" style={{
          width: '17.5rem', flexShrink: 0,
          background: 'var(--bg-1)',
          borderLeft: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="lbl">Activity</span>
            <span title="Live updates" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--live)',
              padding: '1px 0.375rem', borderRadius: '62.4375rem',
              background: 'color-mix(in oklab, var(--live) 12%, transparent)',
            }}><span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />live</span>
            <span style={{ flex: 1 }} />
            <IconBtn title="Filter activity" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.search}</IconBtn>
            <IconBtn title="Collapse activity panel (⌘⇧A)" style={{ width: '1.375rem', height: '1.375rem' }}
              onClick={() => window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { activityRail: 'hidden' } }, '*')}>
              {Ico.sidebarR}
            </IconBtn>
          </div>

          {/* awaiting input toast */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--bd-soft)' }}>
            <div style={{
              border: '1px solid color-mix(in oklab, var(--wait) 35%, transparent)',
              background: 'color-mix(in oklab, var(--wait) 10%, var(--bg-2))',
              borderRadius: '0.5rem', padding: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <StatusBadge status="wait">Needs input</StatusBadge>
                <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', marginLeft: 'auto' }}>just now</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 4 }}>
                <AgentGlyph agent="codex" size={13} color="var(--a-codex)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>aurora-api · codex</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--fg-1)', margin: '4px 0 0.75rem', lineHeight: 1.5 }}>
                Allow Codex to run <span className="mono" style={{ color: 'var(--fg-0)' }}>pnpm migrate:up</span>?
                <span style={{ display: 'block', color: 'var(--fg-3)', fontSize: '0.6875rem', marginTop: 4 }}>Modifies database — irreversible.</span>
              </p>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button className="btn ok solid sm" style={{ flex: 1 }}>Approve<span className="kbd">A</span></button>
                <button className="btn sm">Deny<span className="kbd">D</span></button>
              </div>
            </div>
          </div>

          {/* feed */}
          <div className="scroll" style={{ flex: 1, padding: '0.625rem', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      borderRadius: '0.4375rem', padding: 4,
      background: dim ? 'transparent' : 'color-mix(in oklab, var(--bg-2) 60%, transparent)',
      border: `1px solid ${dim ? 'transparent' : 'var(--bd-soft)'}`,
      opacity: dim ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '4px 0.375rem 0.375rem', cursor: 'pointer',
        borderBottom: '1px solid var(--bd-soft)', marginBottom: 4,
      }}>
        <span style={{ display: 'inline-flex', color: 'var(--fg-2)' }}>{Ico.container}</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
          {repo}
        </span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{cpu}%</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)', padding: '0 0.375rem 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {Ico.branch}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branch}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function SessionRow({ agent, name, task, status, active, dim, badge, account, pinned }) {
  return (
    <div className={`side-item ${active ? 'active' : ''}`} style={{ alignItems: 'flex-start', padding: '0.5rem 0.625rem', opacity: dim ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingTop: 1 }}>
        <StatusDot status={status} pulse />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem', marginBottom: 2 }}>
          <AgentGlyph agent={agent} size={11} color={AGENT_META[agent].accent} />
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--fg-0)' }}>{name}</span>
          {account && <AccountAvatar id={account} size={12} />}
          {pinned && (
            <span title="Pinned" style={{ color: 'var(--wait)', display: 'inline-flex' }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M9 1l1.2 1.2L8 4.5l3.5 3.5 2.3-2.3L15 6.9l-3 3 2 5-2-1-3-3-3.5 3.5L4 13l3.5-3.5-3-3-1 1-1.2-1.2 2.4-2.3L1 1.7 2.2 0.5 6 4.3 9 1z"/></svg>
            </span>
          )}
          {badge && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '0.625rem', padding: '1px 0.3125rem', background: 'var(--wait)', color: 'var(--bg-0)', borderRadius: '0.5rem', fontWeight: 600 }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</div>
      </div>
    </div>
  );
}

// ── COLOR DOT PICKER ────────────────────────────────────────────────────────
// Reusable dot + popover palette. Used on workspace tabs, group tabs, and
// agent pane titles so users can colorize any of those for fast visual ID.
function ColorDot({ color, onChange, size = 10, title = 'Click to change color' }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const off = () => setOpen(false);
    window.addEventListener('click', off, true);
    return () => window.removeEventListener('click', off, true);
  }, [open]);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <button title={title} onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} style={{
        width: `${size / 16}rem`, height: `${size / 16}rem`,
        borderRadius: '50%', padding: 0,
        background: color,
        border: '1px solid color-mix(in oklab, ' + color + ' 60%, #000)',
        cursor: 'pointer', flexShrink: 0,
      }} />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
          background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 'var(--r-1)',
          padding: 6, display: 'flex', gap: 4, boxShadow: 'var(--shadow-2)',
        }} onClick={(e) => e.stopPropagation()}>
          {['var(--a-claude)', 'var(--a-codex)', 'var(--a-antigravity)', 'var(--live)', 'var(--wait)', 'var(--idle)', 'var(--pri)', 'var(--fg-1)'].map((c) => (
            <button key={c} title={c} onClick={() => { onChange(c); setOpen(false); }} style={{
              width: '0.875rem', height: '0.875rem', padding: 0, borderRadius: '50%',
              background: c, border: '1px solid color-mix(in oklab, ' + c + ' 50%, #000)',
              cursor: 'pointer',
              outline: c === color ? '2px solid var(--fg-0)' : 'none',
              outlineOffset: 1,
            }} />
          ))}
        </div>
      )}
    </span>
  );
}
Object.assign(window, { ColorDot });

function WorkspaceTab({ workspaceId, active, agentCount, waitCount }) {
  const w = window.Store.workspace(workspaceId);
  if (!w) return null;
  // ── Consolidated indicators ────────────────────────────────────────────
  // Previously this tab carried 5 overlapping signals (top stripe, ColorDot,
  // StatusDot, wait pill, agent count). Now: ColorDot = identity, one chip
  // on the right = state+count. Active background is the focus signal — no
  // top stripe needed because the ColorDot already shows workspace color.
  const state = waitCount > 0 ? 'wait' : agentCount > 0 ? 'live' : 'idle';
  const chipBg = state === 'wait' ? 'var(--wait)'
    : state === 'live' ? 'color-mix(in oklab, var(--live) 18%, transparent)'
    : 'transparent';
  const chipFg = state === 'wait' ? 'var(--bg-0)'
    : state === 'live' ? 'var(--live)'
    : 'var(--fg-3)';
  const chipLabel = state === 'wait' ? `${waitCount} wait`
    : agentCount > 0 ? `${agentCount}`
    : '—';
  return (
    <div
      onClick={() => window.Store.openWorkspace(workspaceId)}
      className={`ch-tab ${active ? 'active' : ''}`}
      title={`Workspace: ${w.name} · ${agentCount} agent${agentCount === 1 ? '' : 's'}${waitCount > 0 ? ` · ${waitCount} awaiting input` : ''}`}
      style={{
      display: 'flex', alignItems: 'center', gap: '0.5625rem',
      padding: '0 0.625rem 0 0.375rem', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer', position: 'relative',
      whiteSpace: 'nowrap', minWidth: 0,
    }}>
      <span className="tab-handle" title="Drag to reorder / dock" />
      <ColorDot color={w.color} onChange={(c) => window.Store.setWorkspaceColor(w.id, c)} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: active ? 'var(--fg-0)' : 'var(--fg-1)' }}>{w.name}</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {w.repos.length === 1 ? w.repos[0].name : `${w.repos.length} repos`}
        </span>
      </div>
      <span className="mono" style={{
        fontSize: '0.625rem', fontWeight: state === 'wait' ? 600 : 500,
        color: chipFg, background: chipBg,
        padding: '1px 0.3125rem', borderRadius: '62.4375rem', lineHeight: 1,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        {state === 'live' && <span style={{ width: '0.3125rem', height: '0.3125rem', borderRadius: '50%', background: 'var(--live)' }} />}
        {chipLabel}
      </span>
      <IconBtn title="Close workspace" onClick={(e) => { e.stopPropagation(); window.Store.closeWorkspace(workspaceId); }} style={{ width: '1.125rem', height: '1.125rem', marginLeft: 4 }}>{Ico.close}</IconBtn>
    </div>
  );
}

// ── HUB CHROME: WORKSPACE TAB BAR ───────────────────────────────────────────
// Shared across hub-a, resume, session-detail. Renders the workspace tab strip
// + new-workspace + search. Pass `pseudoTab={{ icon, label, count, color }}` to
// add a non-workspace active tab (e.g. "Resume" library, "Inspect" view).
// When pseudoTab is set, no workspace appears active.
function HubWorkspaceTabBar({ pseudoTab }) {
  const s = window.useStore();
  const menu = [
    { icon: Ico.plus,   label: 'New workspace',     kbd: '⌘T' },
    { icon: Ico.search, label: 'Search workspaces', kbd: '⌘P' },
    { divider: true },
    { icon: Ico.bell,   label: 'Pin current workspace' },
    { icon: Ico.files,  label: 'Duplicate workspace' },
    { divider: true },
    { icon: Ico.close,  label: 'Close other workspaces', danger: true },
  ];
  return (
    <window.PaneFrame noFlex menu={menu}>
      <div style={{
        height: '2.5rem', display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--bd-soft)',
        background: 'var(--bg-1)',
        paddingLeft: '0.5rem',
        width: '100%',
      }}>
        {s.openTabs.map((wid) => {
          const w = window.Store.workspace(wid);
          if (!w) return null;
          const agentCount = w.groups.reduce((n, g) => n + g.panes.filter((p) => p.kind === 'agent').length, 0);
          const wait = w.groups.reduce((n, g) => n + g.panes.filter((p) => p.status === 'wait').length, 0);
          // Suppress workspace-active state when a pseudo tab is shown.
          const active = !pseudoTab && wid === s.activeWorkspaceId;
          return (
            <WorkspaceTab key={wid} workspaceId={wid} active={active} agentCount={agentCount} waitCount={wait} />
          );
        })}
        {pseudoTab && <HubPseudoTab {...pseudoTab} />}
        <button className="btn ghost xs" title="New workspace (⌘⇧N)" style={{ alignSelf: 'center', marginLeft: '0.375rem', padding: '4px 0.375rem' }}>{Ico.plus}</button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0.5rem' }}>
          <button className="btn ghost sm" title="Search (⌘K)">{Ico.search}<span className="kbd">⌘K</span></button>
        </div>
      </div>
    </window.PaneFrame>
  );
}

function HubPseudoTab({ icon, label, count, color = 'var(--fg-1)', onClose }) {
  return (
    <div className="ch-tab active" title={label} style={{
      display: 'flex', alignItems: 'center', gap: '0.5625rem',
      padding: '0 0.625rem', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      borderLeft: '1px solid var(--bd-soft)',
      background: 'var(--bg-2)', color: 'var(--fg-0)',
      position: 'relative', whiteSpace: 'nowrap', cursor: 'default',
    }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
      {icon && <span style={{ color, display: 'inline-flex' }}>{icon}</span>}
      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{label}</span>
      {count !== undefined && count !== null && (
        <span className="mono" style={{
          fontSize: '0.625rem', color: 'var(--fg-3)', padding: '1px 0.3125rem',
          background: 'var(--bg-3)', borderRadius: '62.4375rem', lineHeight: 1,
        }}>{count}</span>
      )}
      <IconBtn title="Close" onClick={onClose} style={{ width: '1.125rem', height: '1.125rem', marginLeft: 4 }}>{Ico.close}</IconBtn>
    </div>
  );
}

Object.assign(window, { WorkspaceTab, HubWorkspaceTabBar, HubPseudoTab });

function SessionTab({ agent, name, status, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0 0.625rem', height: '100%',
      borderRight: '1px solid var(--bd-soft)',
      background: active ? 'var(--bg-2)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-1)',
      cursor: 'pointer', position: 'relative',
      minWidth: 0, width: '10.5rem', flexShrink: 1,
      whiteSpace: 'nowrap',
    }}>
      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />}
      <StatusDot status={status} pulse />
      <AgentGlyph agent={agent} size={13} color={AGENT_META[agent].accent} />
      <span className="mono" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <span style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', fontFamily: 'var(--mono)' }}>· {AGENT_META[agent].short}</span>
      <span style={{ flex: 1 }} />
      <IconBtn title="Close" style={{ width: '1.125rem', height: '1.125rem' }}>{Ico.close}</IconBtn>
    </div>
  );
}

function ActivityRow({ agent, name, text, time, dot }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4375rem 0.375rem', borderRadius: '0.375rem' }}>
      <div style={{ paddingTop: 3 }}>
        <AgentGlyph agent={agent} size={11} color={AGENT_META[agent].accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem', marginBottom: 1 }}>
          <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)' }}>{name}</span>
          {dot && <StatusDot status={dot} />}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{time}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--fg-1)', lineHeight: 1.4 }}>{text}</div>
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
    <div className="term" style={{ flex: 1, padding: '0.75rem 0.875rem', overflow: 'hidden' }}>
      {lines.map((item, i) => {
        if (React.isValidElement(item)) return React.cloneElement(item, { key: i });
        return <TermLine key={i} segs={item} />;
      })}
    </div>
  );
}

// Inline mini-diff that appears under an agent `Edit` line in the terminal.
// Compact, +/- prefixed; click to expand to full hunk in the inspector.
function LiveDiff({ lines, collapsedTo }) {
  return (
    <div className="live-diff">
      {lines.map(([k, t], i) => (
        <div key={i} className={k === '+' ? 'ld-add' : k === '-' ? 'ld-rem' : 'ld-ctx'}>
          <span style={{ width: '0.75rem', display: 'inline-block', color: 'inherit' }}>{k === ' ' ? ' ' : k}</span>
          <span style={{ whiteSpace: 'pre' }}>{t}</span>
        </div>
      ))}
      {collapsedTo && (
        <div className="ld-ctx" style={{ fontSize: '0.625rem', opacity: 0.6 }}>… {collapsedTo} more lines  <span style={{ textDecoration: 'underline' }}>open in Diff</span></div>
      )}
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
  <LiveDiff lines={[
    ['+', "import { jwtVerify } from 'jose';"],
    ['+', 'export async function verifyToken('],
    ['+', '  token: string, secret: Uint8Array,'],
    ['+', '): Promise<VerifyResult> {'],
  ]} collapsedTo={28} />,
  [],
  [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm test src/auth']],
  [['ok', '   ✓ '], ['user', 'verifier.spec.ts'], ['meta', ' (4 tests) 142ms']],
  [['dim', '     PASS']],
  [],
  [['prompt', '⏺ '], ['user', 'Edit '], ['path', 'src/middleware/auth.ts']],
  <LiveDiff lines={[
    ['-', 'async function verifyToken(t: string) {'],
    ['-', '  /* … 28 lines removed … */'],
    ['+', "import { verifyToken } from '../auth/verifier';"],
  ]} />,
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
        {/* pane header — minimal: index + colored name + model + controls */}
        <div className="ch-pane-head" style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.75rem' }}>
          <PaneIndex n={1} active />
          <PaneTitle name="Claude Code" defaultColor="var(--a-claude)" status="live" pulse />
          <ModelSelector agent="claude" model="opus-4.7" />
          <span style={{ flex: 1 }} />
          <IconBtn title="Maximize pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
          <IconBtn title="More actions — split, copy, fullscreen…" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
          <IconBtn title="Close pane (⌘W)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
        </div>

        {/* terminal output (goal banner removed — user opted for cleaner pane) */}
        <TermBlock lines={CC_LINES} />
        {/* compact metrics strip — ctx · turn · tok · $ · edits */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.25rem 0.625rem',
          background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
          fontSize: '0.625rem',
        }}>
          <ContextGauge used={184200} max={1000000} label="ctx" width={64} />
          <MetricStat label="turn" value="04:12" />
          <MetricStat label="tok" value="184.2k" />
          <MetricStat label="$" value="2.31" />
          <MetricStat label="edits" value="14" delta="+3" deltaTone="up" />
          <span style={{ flex: 1 }} />
          <span style={{ display: 'none' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--live)' }} />
            active
          </span>
        </div>
        <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'none' }}>
          <span className="mono" style={{ color: 'var(--live)', fontSize: '0.75rem' }}>▸</span>
          <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: '0.75rem' }}>Try "review the verifier for edge cases"</span>
          <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-2)' }}>auto · shift+tab</span>
        </div>
      </div>
  );
}

function TerminalPaneCodex() {
  return (
    <div style={{ flex: 1, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="ch-pane-head" style={{
          background: 'color-mix(in oklab, var(--a-codex) 22%, var(--bg-1))',
          borderBottom: '1px solid color-mix(in oklab, var(--a-codex) 40%, var(--bd-soft))',
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.75rem',
        }}>
          <PaneIndex n={2} />
          <PaneTitle name="Codex" defaultColor="var(--a-codex)" status="wait" />
          <ModelSelector agent="codex" model="o4-mini" />
          <StatusBadge status="wait">Awaiting</StatusBadge>
          <span style={{ flex: 1 }} />
          <IconBtn title="Maximize pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
          <IconBtn title="More actions — split, copy, fullscreen…" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
          <IconBtn title="Close pane (⌘W)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
        </div>
        {/* metrics strip at bottom */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.25rem 0.625rem',
          background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
          fontSize: '0.625rem',
        }}>
          <ContextGauge used={22600} max={200000} label="ctx" width={64} />
          <MetricStat label="turn" value="00:14" />
          <MetricStat label="tok" value="22.6k" />
          <MetricStat label="$" value="0.31" />
          <MetricStat label="edits" value="1" />
          <span style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3125rem', fontSize: '0.625rem', color: 'var(--wait)' }}>blocked 00:14</span>
        </div>
        <div style={{ padding: '0.625rem 0.75rem', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', flex: 1 }}>
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

// ── WORKSPACE MODEL ─────────────────────────────────────────────────────────
// A workspace is the user's environment (1 container, N repos). Inside live
// "groups" — labeled sets of panes. Inside each group lives a flat list of
// panes (agents + utility panes) laid out as flex row or column. Splits
// mutate the focused group's pane list.
//
// This component owns the state for the active workspace's groups.

const REPOS = [
  { id: 'aurora-api', name: 'aurora-api', branch: 'feat/auth-rewrite', dirty: 7 },
  { id: 'dash-web',   name: 'dash-web',   branch: 'main',              dirty: 0 },
  { id: 'shared',     name: 'shared',     branch: 'main',              dirty: 2 },
];

let GROUP_ID = 100;
function mkGroup(name, panes) {
  return { id: ++GROUP_ID, name, panes: panes || [], dir: 'row', focusId: panes?.[0]?.id };
}

function WorkspaceArea() {
  const s = window.useStore();
  const w = window.Store.activeWorkspace();
  if (!w) return null;
  const active = w.groups.find((g) => g.id === w.activeGroupId) || w.groups[0];
  return (
    <>
      <GroupsBar
        groups={w.groups}
        activeId={w.activeGroupId}
        onSelect={(id) => window.Store.setActiveGroup(w.id, id)}
        onAdd={() => window.Store.addGroup(w.id)}
        onClose={(id) => window.Store.closeGroup(w.id, id)}
        onRename={(id, name) => window.Store.renameGroup(w.id, id, name)}
        onColor={(id, color) => window.Store.setGroupColor(w.id, id, color)}
      />
      <GroupGrid
        key={active.id}
        workspaceId={w.id}
        group={active}
      />
    </>
  );
}
function GroupsBar({ groups, activeId, onSelect, onAdd, onClose, onRename, onColor }) {
  const menu = (g) => [
    { icon: Ico.plus, label: 'Add group',         onClick: onAdd },
    { divider: true },
    { icon: Ico.files, label: 'Duplicate group' },
    { icon: Ico.bell,  label: 'Pin group' },
    { divider: true },
    { icon: Ico.close, label: 'Close group', danger: true, onClick: () => onClose(g.id) },
  ];
  return (
    <div style={{
      height: '2rem', flexShrink: 0,
      display: 'flex', alignItems: 'stretch',
      borderBottom: '1px solid var(--bd-soft)',
      background: 'var(--bg-1)',
      paddingLeft: '0.5rem',
    }}>
      {groups.map((g) => (
        <GroupTab key={g.id} group={g} active={g.id === activeId}
          menu={menu(g)} onSelect={onSelect} onClose={onClose} />
      ))}
      <button className="btn ghost xs" onClick={onAdd} title="Add group" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
      <div style={{ flex: 1 }} />
      <span className="mono" style={{ alignSelf: 'center', fontSize: '0.625rem', color: 'var(--fg-3)', padding: '0 0.625rem' }}>
        {groups.length} group{groups.length === 1 ? '' : 's'} 
      </span>
    </div>
  );
}

function GroupTab({ group, active, menu, onSelect, onClose }) {
  const [color, setColor] = React.useState('var(--pri)');
  return (
    <window.PaneFrame noFlex menu={menu}>
      <div
        onClick={() => onSelect(group.id)}
        className={`ch-tab ${active ? 'active' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5625rem',
          padding: '0 0.625rem 0 0.375rem', height: '100%',
          borderRight: '1px solid var(--bd-soft)',
          background: active ? 'var(--bg-2)' : 'transparent',
          color: active ? 'var(--fg-0)' : 'var(--fg-2)',
          cursor: 'pointer', position: 'relative',
          fontSize: '0.75rem',
          // carved feel — inset shadow when active so the tab reads as pressed-in
          boxShadow: active
            ? 'inset 0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px var(--bd-soft)'
            : 'none',
        }}>
        {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />}
        <ColorDot color={color} onChange={setColor} size={10} />
        <span style={{ fontWeight: active ? 500 : 400 }}>{group.name}</span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{group.panes.length}</span>
        <IconBtn title="Close group" onClick={(e) => { e.stopPropagation(); onClose(group.id); }} style={{ width: '1.125rem', height: '1.125rem', marginLeft: '0.25rem' }}>{Ico.close}</IconBtn>
      </div>
    </window.PaneFrame>
  );
}

function GroupGrid({ workspaceId, group }) {
  const dirFor = (template) => template === 'shell' ? 'down' : 'right';
  const split = (which, template = 'claude', repo) => {
    window.Store.addPane(workspaceId, group.id, template, repo, which || dirFor(template));
  };
  const closePane = (id) => window.Store.closePane(workspaceId, group.id, id);
  const setFocus = (id) => window.Store.setPaneFocus(workspaceId, group.id, id);
  const closeAll = () => group.panes.forEach((p) => window.Store.closePane(workspaceId, group.id, p.id));

  const repoSubmenu = (template) => REPOS.map((r) => ({
    icon: Ico.branch, label: r.name + ' · ' + r.branch,
    onClick: () => split('right', template, r.id),
  }));

  const gridMenu = [
    { icon: Ico.splitV, label: 'Add Claude agent', kbd: '⌘1', onClick: () => split('right', 'claude') },
    { icon: Ico.splitV, label: 'Add Codex agent',  kbd: '⌘2', onClick: () => split('right', 'codex') },
    { icon: Ico.splitV, label: 'Add Antigravity agent', kbd: '⌘3', onClick: () => split('right', 'antigravity') },
    { divider: true },
    { icon: Ico.files,    label: 'Add Files pane',  kbd: '⌘E', onClick: () => split('right', 'files') },
    { icon: Ico.terminal, label: 'Add Shell pane',  kbd: '⌘⇧B', onClick: () => split('right', 'shell') },
    { icon: Ico.diff,     label: 'Add Diff pane',              onClick: () => split('right', 'diff') },
    { divider: true },
    { icon: Ico.expand, label: 'Equalize panes' },
    { icon: Ico.close,  label: 'Close all panes', danger: true, onClick: closeAll },
  ];

  // Empty group → instructive empty state with quick-spawn buttons.
  if (group.panes.length === 0) {
    return (
      <window.PaneFrame menu={gridMenu}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1rem', background: 'var(--bg-0)', minHeight: 0, width: '100%',
          padding: '2rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              border: '1.5px dashed var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--fg-3)',
            }}>{Ico.plus}</div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--fg-0)', fontWeight: 500 }}>Empty group</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-2)', textAlign: 'center', maxWidth: '24rem' }}>
              Add an agent or utility pane. Right-click anywhere to see all options.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn sm pri" onClick={() => split('right', 'claude')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-claude)' }} />
              Claude<span className="kbd">⌘1</span>
            </button>
            <button className="btn sm pri" onClick={() => split('right', 'codex')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-codex)' }} />
              Codex<span className="kbd">⌘2</span>
            </button>
            <button className="btn sm pri" onClick={() => split('right', 'antigravity')}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--a-antigravity)' }} />
              Antigravity<span className="kbd">⌘3</span>
            </button>
            <div className="vr" style={{ height: '1.5rem', alignSelf: 'center' }} />
            <button className="btn sm" onClick={() => split('right', 'files')}>{Ico.files}Files</button>
            <button className="btn sm" onClick={() => split('right', 'shell')}>{Ico.terminal}Shell</button>
            <button className="btn sm" onClick={() => split('right', 'diff')}>{Ico.diff}Diff</button>
          </div>
        </div>
      </window.PaneFrame>
    );
  }

  return (
    <window.PaneFrame menu={gridMenu}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: group.dir, gap: 1,
        background: 'var(--bd-soft)', minHeight: 0, minWidth: 0,
        width: '100%',
      }} onClick={(e) => {
        const t = e.target.closest('[data-pane-id]');
        if (t) setFocus(+t.getAttribute('data-pane-id'));
      }}>
        {group.panes.map((p, i) => (
          <RuntimePane key={p.id} pane={p} idx={i + 1} active={p.id === group.focusId}
            onSplit={(which, template, repo) => { setFocus(p.id); split(which, template, repo || p.repo); }}
            onClose={() => closePane(p.id)} />
        ))}
      </div>
    </window.PaneFrame>
  );
}

// ── PANE GRID (legacy — kept for backward compat) ───────────────────────────
// Stateful container for the terminal panes. Right-click anywhere in the grid
// (or inside a pane) actually mutates state: Split right appends a new pane to
// the right and switches layout to row; Split down switches to column and adds
// below. Close pane removes by id. Equalize resets sizing.
//
// Pane records are { id, kind, name, color, model, status, ... }. The grid
// renders them as a flex row/column. This is a deliberate simplification of
// the full recursive split tree — flat list + single direction is enough for
// the prototype's "feel the action" purpose without forcing the user to read
// a tree-of-trees data model.
let PANE_ID = 100;
const SPAWN_TEMPLATES = {
  claude:  { kind: 'agent', agent: 'claude',     name: 'Claude Code',  color: 'var(--a-claude)',     model: 'opus-4.7',       status: 'live' },
  codex:   { kind: 'agent', agent: 'codex',      name: 'Codex',        color: 'var(--a-codex)',      model: 'o4-mini',        status: 'wait' },
  antigravity: { kind: 'agent', agent: 'antigravity', name: 'Antigravity', color: 'var(--a-antigravity)', model: 'gemini-2.5-pro', status: 'idle' },
  shell:   { kind: 'shell', name: 'bash',        color: 'var(--live)' },
  files:   { kind: 'files', name: 'Files',       color: 'var(--idle)' },
  diff:    { kind: 'diff',  name: 'Diff',        color: 'var(--wait)' },
};
function mkPane(template, repo) {
  const t = SPAWN_TEMPLATES[template] || SPAWN_TEMPLATES.claude;
  return { id: ++PANE_ID, ...t, ...(repo && { repo }) };
}

function PaneGrid() {
  // Seed with the original 2 panes so the design opens looking the same.
  const [panes, setPanes] = React.useState([
    { id: 1, kind: 'agent', agent: 'claude', name: 'Claude Code', color: 'var(--a-claude)', model: 'opus-4.7', status: 'live',  variant: 'claude' },
    { id: 2, kind: 'agent', agent: 'codex',  name: 'Codex',        color: 'var(--a-codex)',  model: 'o4-mini',  status: 'wait', variant: 'codex' },
  ]);
  const [dir, setDir] = React.useState('row');
  const [focusId, setFocusId] = React.useState(1);

  const split = (which, template = 'claude') => {
    const idx = panes.findIndex((p) => p.id === focusId);
    const np = mkPane(template);
    const newDir = which === 'down' ? 'column' : 'row';
    setDir(newDir);
    setPanes((ps) => {
      const at = idx < 0 ? ps.length : idx + 1;
      return [...ps.slice(0, at), np, ...ps.slice(at)];
    });
    setFocusId(np.id);
  };
  const closePane = (id) => {
    setPanes((ps) => ps.filter((p) => p.id !== id));
    if (focusId === id) setFocusId(panes[0]?.id);
  };
  const closeAll = () => { setPanes([]); };

  const gridMenu = [
    { icon: Ico.splitV, label: 'Split right — Claude', kbd: '⌘\\',  onClick: () => split('right', 'claude') },
    { icon: Ico.splitH, label: 'Split down — Claude',  kbd: '⌘⇧\\', onClick: () => split('down',  'claude') },
    { divider: true },
    { icon: Ico.splitV, label: 'Split right — Codex',           onClick: () => split('right', 'codex') },
    { icon: Ico.splitV, label: 'Split right — Antigravity',     onClick: () => split('right', 'antigravity') },
    { divider: true },
    { icon: Ico.files,    label: 'Add Files pane',  kbd: '⌘E',  onClick: () => split('right', 'files') },
    { icon: Ico.terminal, label: 'Add Shell pane',  kbd: '⌘⇧B', onClick: () => split('right', 'shell') },
    { icon: Ico.diff,     label: 'Add Diff pane',               onClick: () => split('right', 'diff') },
    { divider: true },
    { icon: Ico.close,    label: 'Close all panes', danger: true, onClick: closeAll },
  ];

  return (
    <window.PaneFrame menu={gridMenu}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: dir, gap: 1,
        background: 'var(--bd-soft)', minHeight: 0, minWidth: 0,
        width: '100%',
      }} onClick={(e) => {
        // Click on a pane focuses it (helps the next split land where you mean).
        const t = e.target.closest('[data-pane-id]');
        if (t) setFocusId(+t.getAttribute('data-pane-id'));
      }}>
        {panes.map((p, i) => (
          <RuntimePane key={p.id} pane={p} idx={i + 1} active={p.id === focusId}
            onSplit={(which, template) => { setFocusId(p.id); split(which, template); }}
            onClose={() => closePane(p.id)} />
        ))}
        {panes.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg-3)', fontSize: '0.75rem',
            background: 'var(--bg-0)',
          }}>
            All panes closed — right-click to add one.
          </div>
        )}
      </div>
    </window.PaneFrame>
  );
}

// Renders a pane based on its kind. Agent panes show the original rich
// Claude/Codex content; shell/files/diff panes are simpler placeholders that
// communicate intent without re-implementing each surface end-to-end.
function RuntimePane({ pane, idx, active, onSplit, onClose }) {
  const paneMenu = [
    { icon: Ico.splitV, label: 'Split horizontal', kbd: '⌘D',  onClick: () => onSplit('right', pane.agent || 'claude') },
    { icon: Ico.splitH, label: 'Split vertical',   kbd: '⌘⇧D', onClick: () => onSplit('down',  pane.agent || 'claude') },
    { divider: true },
    { icon: Ico.close,  label: 'Close pane',   kbd: '⌘W', danger: true, onClick: onClose },
  ];
  return (
    <window.PaneFrame menu={paneMenu}>
      <div data-pane-id={pane.id}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {pane.variant === 'claude' && <TerminalPaneClaude active={active} />}
        {pane.variant === 'codex'  && <TerminalPaneCodex />}
        {!pane.variant && <GenericPane pane={pane} idx={idx} active={active} onClose={onClose} />}
      </div>
    </window.PaneFrame>
  );
}

function GenericPane({ pane, idx, active, onClose }) {
  const repoChoices = ['workspace root', 'aurora-api', 'shared'];
  const modeChoices = pane.kind === 'shell' ? ['bash', 'zsh', 'fish']
    : pane.kind === 'files' ? ['tree', 'flat', 'recent']
    : pane.kind === 'diff' ? ['unified', 'split', 'staged only']
    : ['default'];
  return (
    <div style={{ flex: 1, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="ch-pane-head" style={{
        background: `color-mix(in oklab, ${pane.color} 22%, var(--bg-1))`,
        borderBottom: `1px solid color-mix(in oklab, ${pane.color} 40%, var(--bd-soft))`,
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4375rem 0.75rem',
      }}>
        <window.PaneIndex n={idx} active={active} />
        <span style={{
          width: '0.75rem', height: '0.75rem', borderRadius: '50%',
          background: pane.color,
          border: '1px solid color-mix(in oklab, ' + pane.color + ' 60%, #000)',
        }} />
        {pane.kind === 'agent' ? (
          <>
            <SelectorChip value={pane.name} title="Agent" />
            <SelectorChip value={pane.model || 'opus-4.7'} title="Model" />
            <SelectorChip value={pane.repo || 'workspace root'} title="Repo binding" />
          </>
        ) : (
          <>
            <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500, textTransform: 'capitalize' }}>{pane.kind}</span>
            <SelectorChip value={modeChoices[0]} title="Mode" />
            <SelectorChip value={repoChoices[0]} title="Repo binding" />
          </>
        )}
        <span style={{ flex: 1 }} />
        <IconBtn title="Maximize pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
        <IconBtn title="More actions" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
        <IconBtn title="Close pane (⌘W)" onClick={onClose} style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.5rem', color: 'var(--fg-3)',
        fontSize: '0.75rem', fontFamily: 'var(--mono)',
      }}>
        <span style={{ fontSize: '1.375rem', color: pane.color, opacity: 0.8 }}>
          {pane.kind === 'shell' && '$_'}
          {pane.kind === 'files' && '▤'}
          {pane.kind === 'diff'  && '±'}
          {pane.kind === 'agent' && '◉'}
        </span>
        <span>{pane.kind} pane · {pane.name}</span>
        <span style={{ fontSize: '0.625rem' }}>(prototype placeholder)</span>
      </div>
    </div>
  );
}

// Compact chip with a small caret — used in pane heads for agent/model/repo/mode pickers.
function SelectorChip({ value, title }) {
  return (
    <button title={`Change ${title.toLowerCase()}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontFamily: 'var(--mono)', fontSize: '0.6875rem',
      color: 'var(--fg-1)', background: 'var(--bg-1)',
      border: '1px solid var(--bd-soft)',
      borderRadius: 4, padding: '2px 0.4375rem', cursor: 'pointer',
    }}>
      <span>{value}</span>
      {Ico.chevD}
    </button>
  );
}

Object.assign(window, { PaneGrid, RuntimePane, GenericPane, mkPane });

// ── PANE ATOMS ───────────────────────────────────────────────────────────────
function PaneIndex({ n, active }) {
  return (
    <span title={`Jump to pane ${n} (⌘${n})`} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '1.125rem', height: '1.125rem',
      borderRadius: 4,
      fontFamily: 'var(--mono)', fontSize: '0.625rem', fontWeight: 600, lineHeight: 1,
      background: active ? 'var(--pri)' : 'var(--bg-3)',
      color: active ? 'var(--bg-0)' : 'var(--fg-2)',
      border: '1px solid ' + (active ? 'var(--pri)' : 'var(--bd-soft)'),
      flexShrink: 0,
    }}>{n}</span>
  );
}

function SessionGoalBanner({ agent, goal, progress }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      padding: '0.4375rem 0.75rem',
      background: 'color-mix(in oklab, ' + meta.accent + ' 8%, var(--bg-0))',
      borderBottom: '1px solid var(--bd-soft)',
      fontSize: '0.6875rem', color: 'var(--fg-1)',
    }}>
      <span title="Session goal" style={{
        fontFamily: 'var(--mono)', fontSize: '0.625rem',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--fg-3)',
      }}>GOAL</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal}</span>
      <div title={`${Math.round(progress * 100)}% through plan`} style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
      }}>
        <div style={{ width: '3.75rem', height: 3, background: 'var(--bg-3)', borderRadius: 999 }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: meta.accent, borderRadius: 999 }} />
        </div>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-2)' }}>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
Object.assign(window, { PaneIndex, SessionGoalBanner });

// ── PANE FRAME ──────────────────────────────────────────────────────────────
// Wraps a region and attaches a right-click context menu. The menu prop is an
// array of { icon, label, kbd, danger, divider } items rendered as a floating
// popover at the cursor position. Dismisses on outside-click or Escape.
//
// Default menu (when no `menu` prop) is the standard pane-actions list:
// Split right, Split down, Maximize, Copy, Pin, Close.
function PaneFrame({ children, menu, noFlex }) {
  const [pos, setPos] = React.useState(null);
  const onCtx = (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable=true]')) return;
    e.preventDefault();
    e.stopPropagation(); // don't let outer PaneFrames double-fire
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  React.useEffect(() => {
    if (!pos) return;
    const off = () => setPos(null);
    const onKey = (e) => e.key === 'Escape' && setPos(null);
    window.addEventListener('click', off, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', off, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [pos]);
  const items = menu || [
    { icon: Ico.splitV, label: 'Split right',  kbd: '⌘\\' },
    { icon: Ico.splitH, label: 'Split down',   kbd: '⌘⇧\\' },
    { divider: true },
    { icon: Ico.expand, label: 'Maximize pane', kbd: '⌘\\' },
    { icon: Ico.files,  label: 'Copy pane' },
    { icon: Ico.bell,   label: 'Pin pane' },
    { divider: true },
    { icon: Ico.close,  label: 'Close pane',   kbd: '⌘W', danger: true },
  ];
  const baseStyle = noFlex
    ? { position: 'relative', minWidth: 0 }
    : { position: 'relative', display: 'flex', flex: 1, minWidth: 0, minHeight: 0 };
  return (
    <div onContextMenu={onCtx} style={baseStyle}>
      {children}
      {pos && <PaneContextMenu x={pos.x} y={pos.y} items={items} onClose={() => setPos(null)} />}
    </div>
  );
}

function PaneContextMenu({ x, y, items, onClose }) {
  return (
    <div style={{
      position: 'absolute', top: y, left: x,
      minWidth: '13rem',
      background: 'var(--bg-2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-2)',
      boxShadow: 'var(--shadow-3)',
      padding: 4,
      zIndex: 50,
      fontSize: '0.75rem',
    }} onClick={(e) => e.stopPropagation()}>
      {items.map((it, i) => it.divider
        ? <div key={i} style={{ height: 1, background: 'var(--bd-soft)', margin: '4px 2px' }} />
        : (
          <div key={i} className="pane-add-item"
            onClick={() => { if (it.onClick) it.onClick(); onClose(); }}
            style={it.danger ? { color: 'var(--err)' } : null}>
            {it.icon}<span style={{ flex: 1 }}>{it.label}</span>
            {it.kbd && <span className="kbd">{it.kbd}</span>}
          </div>
        ))}
    </div>
  );
}

// ── PANE TITLE ──────────────────────────────────────────────────────────────
// Status dot + name + optional color picker. The dot's color comes from a small
// curated palette the user can pick from on click (saves to local state).
const PANE_COLORS = [
  'var(--a-claude)', 'var(--a-codex)', 'var(--a-antigravity)',
  'var(--live)', 'var(--wait)', 'var(--idle)', 'var(--pri)',
  'var(--fg-1)',
];
function PaneTitle({ name, defaultColor, status, pulse }) {
  const [color, setColor] = React.useState(defaultColor);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const off = () => setOpen(false);
    window.addEventListener('click', off, true);
    return () => window.removeEventListener('click', off, true);
  }, [open]);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4375rem', position: 'relative' }}>
      <button title="Click to recolor pane" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} style={{
        width: '0.75rem', height: '0.75rem', borderRadius: '50%',
        background: color,
        border: '1px solid color-mix(in oklab, ' + color + ' 60%, #000)',
        cursor: 'pointer', padding: 0,
        boxShadow: pulse ? `0 0 0 3px color-mix(in oklab, ${color} 22%, transparent)` : 'none',
        animation: pulse && status === 'live' ? 'ch-pulse 2s ease-in-out infinite' : 'none',
      }} />
      <span className="mono" style={{ fontSize: '0.8125rem', color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
          background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 'var(--r-1)',
          padding: 6, display: 'flex', gap: 4, boxShadow: 'var(--shadow-2)',
        }} onClick={(e) => e.stopPropagation()}>
          {PANE_COLORS.map((c) => (
            <button key={c} title={c} onClick={() => { setColor(c); setOpen(false); }} style={{
              width: '0.875rem', height: '0.875rem', padding: 0, borderRadius: '50%',
              background: c, border: '1px solid color-mix(in oklab, ' + c + ' 50%, #000)',
              cursor: 'pointer',
              outline: c === color ? '2px solid var(--fg-0)' : 'none',
              outlineOffset: 1,
            }} />
          ))}
        </div>
      )}
    </span>
  );
}

// ── MODEL SELECTOR ──────────────────────────────────────────────────────────
// Chip that doubles as a dropdown to swap the agent's active model. The chip
// shows the current model in compact mono and a small caret; the popover lists
// available models for the agent, with cost-per-million-token estimates.
const MODELS = {
  claude: [
    { id: 'opus-4.7',     name: 'Opus 4.7',     cost: '$15/M in · $75/M out',  ctx: '1M ctx' },
    { id: 'sonnet-4',     name: 'Sonnet 4',     cost: '$3/M · $15/M',           ctx: '200k ctx' },
    { id: 'haiku-4.5',    name: 'Haiku 4.5',    cost: '$0.80/M · $4/M',         ctx: '200k ctx' },
  ],
  codex: [
    { id: 'o4-mini',      name: 'o4-mini',      cost: '$1.10/M · $4.40/M',      ctx: '200k ctx' },
    { id: 'gpt-4.1',      name: 'GPT-4.1',      cost: '$2/M · $8/M',            ctx: '1M ctx' },
    { id: 'o3',           name: 'o3',           cost: '$60/M · $240/M',         ctx: '200k ctx' },
  ],
  antigravity: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', cost: '$1.25/M · $5/M',     ctx: '2M ctx' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', cost: '$0.10/M · $0.40/M', ctx: '1M ctx' },
  ],
};
function ModelSelector({ agent, model }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const off = () => setOpen(false);
    window.addEventListener('click', off, true);
    return () => window.removeEventListener('click', off, true);
  }, [open]);
  return (
    <span style={{ position: 'relative' }}>
      <button title="Change model" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontFamily: 'var(--mono)', fontSize: '0.6875rem',
        color: 'var(--fg-2)', background: 'transparent',
        border: '1px solid transparent',
        borderRadius: 4, padding: '2px 5px', cursor: 'pointer',
      }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--fg-0)'; }}
         onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-2)'; }}>
        <span>{model}</span>
        {Ico.chevD}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 30,
          background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 'var(--r-2)',
          minWidth: '14rem', boxShadow: 'var(--shadow-2)',
          padding: 4,
        }} onClick={(e) => e.stopPropagation()}>
          {(MODELS[agent] || []).map((m) => {
            const active = m.id === model;
            return (
              <div key={m.id} className="pane-add-item" onClick={() => setOpen(false)} style={{
                background: active ? 'var(--bg-3)' : 'transparent',
              }}>
                <span style={{ display: 'flex', flexDirection: 'column', flex: 1, lineHeight: 1.2 }}>
                  <span className="mono" style={{ color: 'var(--fg-0)', fontSize: '0.75rem' }}>{m.name}</span>
                  <span className="mono" style={{ color: 'var(--fg-3)', fontSize: '0.625rem' }}>{m.ctx} · {m.cost}</span>
                </span>
                {active && <span style={{ color: 'var(--pri)' }}>{Ico.check}</span>}
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}

Object.assign(window, { PaneFrame, PaneContextMenu, PaneTitle, ModelSelector });
