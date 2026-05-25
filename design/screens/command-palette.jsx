// CodeHub — Command Palette (Cmd+K).
// Centered modal with grouped results: Sessions / Spawn / Commands.

function CommandPalette() {
  return (
    <AppChrome w={1440} h={900} title="codehub · ⌘K">
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxHubBg />
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(6,7,9,0.55)',
            backdropFilter: 'blur(14px) saturate(120%)',
            WebkitBackdropFilter: 'blur(14px) saturate(120%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)',
            pointerEvents: 'none',
          }} />
        </>

        {/* palette */}
        <div style={{
          position: 'absolute', top: '5.625rem', left: '50%',
          transform: 'translateX(-50%)',
          width: '42.5rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: '0.75rem',
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}>
          {/* input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--bd-soft)',
          }}>
            <span style={{ color: 'var(--fg-2)' }}>{Ico.search}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.875rem', color: 'var(--fg-0)', flex: 1 }}>
              audit<span className="blink">▍</span>
            </span>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>aurora · cmd · agent · diff</span>
            <span className="kbd">esc</span>
          </div>

          {/* results */}
          <div style={{ maxHeight: '32.5rem', overflow: 'auto' }}>
            <PGroup label="Agents · 2">
              <PRow icon={<><StatusDot status="wait" /><AgentGlyph agent="codex" size={13} color="var(--a-codex)" /></>}
                title={<><span className="mono">aurora-api</span> <span style={{ color: 'var(--fg-2)' }}>· writing migration for </span><Hi>audit</Hi><span style={{ color: 'var(--fg-2)' }}>_log</span></>}
                meta="codex · awaiting approval" hot />
              <PRow icon={<><StatusDot status="done" /><AgentGlyph agent="codex" size={13} color="var(--a-codex)" /></>}
                title={<><span className="mono">aurora-api</span> <span style={{ color: 'var(--fg-2)' }}>· </span><Hi>audit</Hi><span style={{ color: 'var(--fg-2)' }}> log feature complete</span></>}
                meta="codex · 2h ago" />
            </PGroup>

            <PGroup label="Spawn new agent · 3">
              <PRow icon={<AgentGlyph agent="claude" size={13} color="var(--a-claude)" />}
                title={<><span style={{ color: 'var(--fg-2)' }}>Claude Code in </span><span className="mono">aurora-api</span></>}
                meta="opus-4.7 · spawns in ≈2.4s" />
              <PRow icon={<AgentGlyph agent="codex" size={13} color="var(--a-codex)" />}
                title={<><span style={{ color: 'var(--fg-2)' }}>Codex in </span><span className="mono">aurora-api</span></>}
                meta="o4-mini · spawns in ≈1.8s" />
              <PRow icon={<AgentGlyph agent="antigravity" size={13} color="var(--a-antigravity)" />}
                title={<><span style={{ color: 'var(--fg-2)' }}>Antigravity in </span><span className="mono">aurora-api</span></>}
                meta="gemini-2.5-pro · spawns in ≈3.1s" />
            </PGroup>

            <PGroup label="Commands · 4">
              <PRow icon={Ico.diff} title={<><Hi>Audit</Hi> diff across all sessions</>} meta="show changes from running agents" shortcut="⌘⇧D" />
              <PRow icon={Ico.container} title={<>Restart container for <Hi>audit</Hi>-log session</>} meta="aurora-cx-bd2c" />
              <PRow icon={Ico.bell} title={<>Mute notifications for <Hi>audit</Hi>-log</>} meta="codex · aurora-api" />
              <PRow icon={Ico.search} title={<>Search transcripts for "<Hi>audit</Hi>"</>} meta="across 5 sessions · ~120 turns" shortcut="⌘⇧F" />
            </PGroup>

            <PGroup label="Repos · 1">
              <PRow icon={Ico.files}
                title={<><span className="mono"><Hi>audit</Hi>-service</span></>}
                meta="~/work/audit-service · 4 branches" />
            </PGroup>
          </div>

          {/* footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.5rem 0.875rem', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            fontSize: '0.6875rem', color: 'var(--fg-2)',
          }}>
            <span><span className="kbd">↑</span><span className="kbd" style={{ marginLeft: 2 }}>↓</span> navigate</span>
            <span><span className="kbd">⏎</span> open</span>
            <span><span className="kbd">⌘</span><span className="kbd" style={{ marginLeft: 2 }}>⏎</span> open in new pane</span>
            <span><span className="kbd">⌥</span><span className="kbd" style={{ marginLeft: 2 }}>⏎</span> spawn here</span>
            <span style={{ flex: 1 }} />
            <span className="mono">11 results · 14ms</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function PGroup({ label, children }) {
  return (
    <div>
      <div style={{
        padding: '0.625rem 1rem 4px',
        fontFamily: 'var(--mono)', fontSize: '0.625rem', letterSpacing: '0.1em',
        color: 'var(--fg-3)', textTransform: 'uppercase',
      }}>{label}</div>
      {children}
    </div>
  );
}

function PRow({ icon, title, meta, hot, shortcut }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.5625rem 1rem',
      background: hot ? 'var(--bg-3)' : 'transparent',
      borderLeft: hot ? '2px solid var(--fg-0)' : '2px solid transparent',
      cursor: 'pointer',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: hot ? 'var(--fg-0)' : 'var(--fg-1)' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: '0.8125rem', color: hot ? 'var(--fg-0)' : 'var(--fg-1)' }}>{title}</span>
      <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>{meta}</span>
      {shortcut && <span className="kbd">{shortcut}</span>}
      {hot && <span style={{ color: 'var(--fg-1)' }}>{Ico.arrowR}</span>}
    </div>
  );
}

function Hi({ children }) {
  return <span style={{ color: 'var(--wait)', fontWeight: 600, background: 'color-mix(in oklab, var(--wait) 14%, transparent)', padding: '0 2px', borderRadius: 2 }}>{children}</span>;
}

window.CommandPalette = CommandPalette;
