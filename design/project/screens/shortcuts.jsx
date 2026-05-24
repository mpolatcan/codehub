// CodeHub — Keyboard shortcuts cheat sheet. Modal overlay listing every
// ⌘-binding grouped by surface. Press ? to open.

function Shortcuts() {
  return (
    <AppChrome w={1440} h={900} title="codehub · shortcuts">
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        <FauxHubBg />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(6,7,9,0.72)',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        }} />

        {/* modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1120, maxHeight: 760,
          background: 'var(--bg-2)',
          border: '1px solid var(--bd-strong)',
          borderRadius: 14,
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* head */}
          <div style={{
            padding: '14px 22px', borderBottom: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Keyboard shortcuts</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>press <span className="kbd">?</span> anywhere to open · <span className="kbd">esc</span> to close</span>
            <span style={{ flex: 1 }} />
            <input
              type="text"
              placeholder="filter shortcuts…"
              style={{
                background: 'var(--bg-1)', border: '1px solid var(--bd)',
                borderRadius: 6, padding: '5px 10px', fontSize: 12,
                color: 'var(--fg-1)', fontFamily: 'var(--mono)', width: 220,
              }}
            />
          </div>

          {/* body */}
          <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
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
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
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
            padding: '10px 22px', borderTop: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>vim-style keys also work inside terminal panes (handled by tmux)</span>
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
      <div className="lbl" style={{ marginBottom: 10, color: 'var(--fg-1)', fontSize: 11 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function Sc({ keys, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {keys.map((k, i) => <span key={i} className="kbd">{k}</span>)}
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: 'var(--fg-1)', textAlign: 'right' }}>{desc}</span>
    </div>
  );
}

window.Shortcuts = Shortcuts;
