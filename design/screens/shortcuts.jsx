// CodeHub — Keyboard shortcuts cheat sheet. Modal overlay listing every
// ⌘-binding grouped by surface. Press ? to open.

function Shortcuts() {
  return (
    <AppChrome w={1440} h={900} title="codehub · shortcuts">
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

        {/* modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70rem', maxHeight: '47.5rem',
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: '0.875rem',
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* head */}
          <div style={{
            padding: '0.875rem 1.375rem', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: '0.875rem',
          }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Keyboard shortcuts</h2>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>press <span className="kbd">?</span> anywhere to open · <span className="kbd">esc</span> to close</span>
            <span style={{ flex: 1 }} />
            <input
              type="text"
              placeholder="filter shortcuts…"
              style={{
                background: 'var(--bg-1)', border: '1px solid var(--bd)',
                borderRadius: '0.375rem', padding: '0.3125rem 0.625rem', fontSize: '0.75rem',
                color: 'var(--fg-1)', fontFamily: 'var(--mono)', width: '13.75rem',
              }}
            />
          </div>

          {/* body */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '1.375rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.375rem' }}>
              <Col title="Workspace">
                <Sc keys={['⌘', 'N']} desc="New agent session" />
                <Sc keys={['⌘', 'T']} desc="New workspace tab" />
                <Sc keys={['⌘', 'W']} desc="Close current pane" />
                <Sc keys={['⌘', '⇧', 'W']} desc="Close workspace tab" />
                <Sc keys={['⌘', '\\']} desc="Split pane vertically" />
                <Sc keys={['⌘', '⇧', '\\']} desc="Split pane horizontally" />
                <Sc keys={['⌘', 'E']} desc="Toggle files pane" />
                <Sc keys={['⌘', '⇧', 'B']} desc="Toggle shell pane" />
                <Sc keys={['⌘', 'D']} desc="Toggle diff inspector" />
              </Col>
              <Col title="Navigation">
                <Sc keys={['⌘', '1–9']} desc="Jump to workspace tab" />
                <Sc keys={['⌘', '[']} desc="Previous tab" />
                <Sc keys={['⌘', ']']} desc="Next tab" />
                <Sc keys={['⌘', 'K']} desc="Command palette" />
                <Sc keys={['⌘', '⇧', 'F']} desc="Search across sessions" />
                <Sc keys={['⌘', '⇧', 'J']} desc="Expand dynamic island" />
                <Sc keys={['⌥', 'tab']} desc="Cycle agent panes" />
                <Sc keys={['⌘', '⇧', 'P']} desc="Pin / docks sidebar" />
                <Sc keys={['⌘', '↑']} desc="Top of scrollback" />
              </Col>
              <Col title="Agent · turn">
                <Sc keys={['⏎']} desc="Send / approve" />
                <Sc keys={['⇧', '⏎']} desc="New line in prompt" />
                <Sc keys={['⌘', '⏎']} desc="Send to all visible agents" />
                <Sc keys={['esc']} desc="Cancel turn" />
                <Sc keys={['⌘', '.']} desc="Stop agent" />
                <Sc keys={['⌘', 'R']} desc="Restart turn from last prompt" />
                <Sc keys={['⌘', '⇧', 'R']} desc="Restart with same context" />
                <Sc keys={['⌘', 'Z']} desc="Undo last agent edit" />
                <Sc keys={['tab']} desc="Cycle auto-mode" />
              </Col>
              <Col title="System">
                <Sc keys={['⌘', ',']} desc="Open settings" />
                <Sc keys={['?']} desc="This help" />
                <Sc keys={['⌘', '⇧', 'L']} desc="Toggle light / dark theme" />
                <Sc keys={['⌘', '⇧', 'C']} desc="Toggle companion" />
                <Sc keys={['⌘', '⇧', 'N']} desc="Toggle notifications" />
                <Sc keys={['⌘', '⌥', 'I']} desc="Open dev tools" />
                <Sc keys={['⌘', 'Q']} desc="Quit CodeHub" />
              </Col>
            </div>

            {/* repeat row for diff inspector */}
            <div style={{ marginTop: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.375rem' }}>
              <Col title="Diff inspector">
                <Sc keys={['j', 'k']} desc="Next / previous hunk" />
                <Sc keys={['s']} desc="Stage hunk" />
                <Sc keys={['u']} desc="Unstage hunk" />
                <Sc keys={['⌘', 'P']} desc="Open PR…" />
                <Sc keys={['c']} desc="Commit staged" />
              </Col>
              <Col title="Container">
                <Sc keys={['⌘', '⇧', 'X']} desc="Exec shell in container" />
                <Sc keys={['⌘', '⌥', 'R']} desc="Restart container" />
                <Sc keys={['⌘', '⌥', '.']} desc="Stop container" />
                <Sc keys={['⌘', '⌥', 'L']} desc="Tail container logs" />
              </Col>
              <Col title="Selection / scroll">
                <Sc keys={['⌘', 'F']} desc="Find in pane" />
                <Sc keys={['⌘', 'A']} desc="Select all" />
                <Sc keys={['⌘', 'C']} desc="Copy" />
                <Sc keys={['⌘', '⇧', 'V']} desc="Paste as plain" />
                <Sc keys={['/']} desc="Search scrollback" />
              </Col>
              <Col title="Accounts">
                <Sc keys={['⌘', '⇧', 'A']} desc="Switch account on active pane" />
                <Sc keys={['⌘', '⌥', 'B']} desc="Open billing" />
              </Col>
            </div>
          </div>

          <div style={{
            padding: '0.625rem 1.375rem', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
          }}>
            <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>vim-style keys also work inside terminal panes (handled by tmux)</span>
            <span style={{ flex: 1 }} />
            <button className="btn sm ghost">Customize…</button>
            <button className="btn sm">Print</button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function Col({ title, children }) {
  return (
    <div>
      <div className="lbl" style={{ marginBottom: '0.625rem', color: 'var(--fg-1)', fontSize: '0.6875rem' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {children}
      </div>
    </div>
  );
}

function Sc({ keys, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '4px 0' }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {keys.map((k, i) => <span key={i} className="kbd">{k}</span>)}
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--fg-1)', textAlign: 'right' }}>{desc}</span>
    </div>
  );
}

window.Shortcuts = Shortcuts;
