// CodeHub — Companion. A floating draggable always-on-top avatar per agent.
// Lives outside the main window. Drag anywhere. Click to jump to terminal.
// On macOS uses NSWindow level NSStatusWindowLevel + click-through holes.

function Companion() {
  return (
    <AppChrome w={1440} h={900} title="codehub · companion">
      <div className="ch-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minHeight: 0, overflow: 'hidden' }}>
        {/* ── HERO: faux macOS desktop with floating avatars on top ──── */}
        <div style={{ position: 'relative', height: 460, flexShrink: 0, overflow: 'hidden' }}>
          {/* wallpaper */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 70% 30%, oklch(0.32 0.06 280), oklch(0.16 0.04 230) 60%, oklch(0.10 0.03 240) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '3px 3px', mixBlendMode: 'overlay', opacity: 0.5,
          }} />

          {/* macOS menu bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 28,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', padding: '0 14px',
            fontSize: 12, color: 'rgba(255,255,255,0.85)',
          }}>
            <span style={{ fontWeight: 600, marginRight: 18 }}>Code</span>
            <span style={{ marginRight: 14 }}>File</span>
            <span style={{ marginRight: 14 }}>Edit</span>
            <span style={{ marginRight: 14 }}>View</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ marginRight: 12, fontSize: 11 }}>21:36</span>
            <span style={{ fontSize: 11 }}>Wed 22 May</span>
          </div>

          {/* faux editor window (the "thing the user is working in") */}
          <FauxEditorWindow />

          {/* dock at bottom */}
          <Dock />

          {/* THE FLOATING COMPANIONS — always on top */}
          <div style={{
            position: 'absolute', top: 90, right: 100,
            display: 'flex', flexDirection: 'column', gap: 14, zIndex: 50,
          }}>
            <CompanionAvatar agent="codex" status="wait" bubble="needs your approval" expanded />
          </div>
          <div style={{
            position: 'absolute', top: 230, right: 200, zIndex: 50,
          }}>
            <CompanionAvatar agent="claude" status="live" />
          </div>
          <div style={{
            position: 'absolute', top: 320, left: 180, zIndex: 50,
          }}>
            <CompanionAvatar agent="antigravity" status="idle" />
          </div>

          {/* hint */}
          <div style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
            color: 'rgba(255,255,255,0.9)', fontSize: 11.5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
            <span>3 companions floating · drag anywhere · always on top · NSStatusWindowLevel · click to jump</span>
          </div>
        </div>

        {/* ── GALLERY ─────────────────────────────────────────────────── */}
        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>States</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>size 56px · pulses with state · right-click for menu · ⌥-drag to clone</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
            <CompCard caption="Idle" desc="Gentle float. Status ring at rest.">
              <CompanionAvatar agent="claude" status="idle" />
            </CompCard>
            <CompCard caption="Thinking" desc="Orbiting dots around the rim.">
              <CompanionAvatar agent="claude" status="live" thinking />
            </CompCard>
            <CompCard caption="Awaiting input" desc="Amber glow + tap-target ring." tone="wait">
              <CompanionAvatar agent="codex" status="wait" />
            </CompCard>
            <CompCard caption="Done" desc="Green check pop, 3s." tone="done">
              <CompanionAvatar agent="claude" status="done" />
            </CompCard>
            <CompCard caption="Failed" desc="Red shake, lingers." tone="err">
              <CompanionAvatar agent="claude" status="err" />
            </CompCard>
            <CompCard caption="Bubble · live status" desc="Hover or click to show context.">
              <CompanionAvatar agent="claude" status="live" bubble="refactoring auth · 184k ctx" expanded />
            </CompCard>
            <CompCard caption="Dragging" desc="Scales up. Casts ghost trail.">
              <CompanionAvatar agent="codex" status="live" dragging />
            </CompCard>
            <CompCard caption="Docked · edge peek" desc="Half-hidden against screen edge.">
              <CompanionAvatar agent="antigravity" status="idle" docked />
            </CompCard>
          </div>

          {/* radial action menu */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14, marginTop: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Right-click menu</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>radial actions around the avatar — keeps the screen unblocked</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 22 }}>
            <CompCard caption="Radial · 6 actions" desc="Right-click or long-press. Tap to act, swipe out to confirm. Esc closes.">
              <CompanionRadial />
            </CompCard>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="lbl">Companion preferences</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 6px', borderRadius: 4,
                  fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.06em',
                  textTransform: 'uppercase', fontWeight: 500,
                  background: 'color-mix(in oklab, var(--idle) 12%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--idle) 30%, transparent)',
                  color: 'var(--idle)',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--idle)' }} />
                  desktop only
                </span>
              </div>
              <PrefRow label="Show companion" control={<Toggle on />} />
              <PrefRow label="Hide while CodeHub window is focused" control={<Toggle />} />
              <PrefRow label="Click-through when no events" sub="Mouse passes to apps underneath" control={<Toggle on />} />
              <PrefRow label="Snap to screen edges" control={<Toggle on />} />
              <PrefRow label="Show bubble on hover" control={<Toggle on />} />
              <PrefRow label="Character" sub="Each agent can use a different style"
                control={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', background: 'var(--bg-3)', borderRadius: 6, border: '1px solid var(--bd)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0a0b0d', border: '1.5px solid var(--live)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AgentGlyph agent="claude" size={9} color="var(--a-claude)" />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--fg-0)' }}>Glyph</span>
                    <span style={{ color: 'var(--fg-2)', fontSize: 10 }}>▾</span>
                  </div>
                } />
              <PrefRow label="Size" control={
                <div style={{ display: 'flex', gap: 4 }}>
                  {['S', 'M', 'L'].map(s => (
                    <span key={s} style={{
                      width: 24, height: 22, borderRadius: 4,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 11,
                      background: s === 'M' ? 'var(--bg-3)' : 'transparent',
                      color: s === 'M' ? 'var(--fg-0)' : 'var(--fg-2)',
                      border: '1px solid var(--bd)',
                      cursor: 'pointer',
                    }}>{s}</span>
                  ))}
                </div>
              } last />
            </div>
          </div>

          {/* CHARACTERS — picker + expression variants ────────────────── */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Characters</h2>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>6 built-in styles · custom upload supported · per-agent override</span>
            <span style={{ flex: 1 }} />
            <button className="btn xs ghost">{Ico.plus}Upload sprite sheet</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <CharacterCard kind="glyph" name="Glyph" desc="The default. Each agent's geometric mark inside a black puck." active />
            <CharacterCard kind="sprite" name="8-bit Sprite" desc="Pixel-art face with idle bobbing, eye blinks, and mouth shapes." />
            <CharacterCard kind="face" name="Face" desc="Minimal emoji vocabulary — eyes + mouth arc. Expressive but neutral." />
            <CharacterCard kind="orb" name="Orb" desc="No face, pure energy. Pulse rate and color encode state." />
            <CharacterCard kind="ascii" name="ASCII" desc="Monospace face e.g. (o_o) (>_<) (^_^). Terminal-native vibe." />
            <CharacterCard kind="robot" name="Robot" desc="Angular faceplate with rectangular eyes. Tilts toward cursor." />
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── COMPANION AVATAR ──────────────────────────────────────────────────────
function CompanionAvatar({ agent, status, bubble, expanded, thinking, dragging, docked }) {
  const meta = AGENT_META[agent];
  const ringColor =
    status === 'live' ? 'var(--live)' :
    status === 'wait' ? 'var(--wait)' :
    status === 'done' ? 'var(--done)' :
    status === 'err' ? 'var(--err)' : 'rgba(255,255,255,0.3)';

  const size = dragging ? 64 : 56;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      transform: docked ? 'translateX(20px)' : 'none',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* ghost trail when dragging */}
        {dragging && (
          <>
            <div style={{
              position: 'absolute', top: 8, left: -16, width: size, height: size,
              borderRadius: '50%', background: meta.accent, opacity: 0.15,
            }} />
            <div style={{
              position: 'absolute', top: 4, left: -8, width: size, height: size,
              borderRadius: '50%', background: meta.accent, opacity: 0.30,
            }} />
          </>
        )}

        {/* the avatar */}
        <div style={{
          width: size, height: size,
          borderRadius: '50%',
          background: '#0a0b0d',
          border: `2px solid ${ringColor}`,
          boxShadow: `
            0 ${dragging ? 18 : 10}px ${dragging ? 40 : 26}px rgba(0,0,0,0.55),
            0 0 0 1px rgba(255,255,255,0.06),
            0 0 ${status === 'wait' ? 24 : status === 'err' ? 24 : 14}px ${status === 'wait' || status === 'err' ? ringColor : 'transparent'}
          `,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transform: docked ? 'translateX(20px)' : 'none',
        }}>
          <div style={{ transform: 'scale(2.2)' }}>
            <AgentGlyph agent={agent} size={14} color={meta.accent} />
          </div>

          {/* thinking dots — orbital */}
          {thinking && (
            <>
              <span style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'var(--live)' }} />
              <span style={{ position: 'absolute', top: '50%', right: -2, transform: 'translateY(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--live)', opacity: 0.6 }} />
              <span style={{ position: 'absolute', bottom: -2, left: '40%', width: 3, height: 3, borderRadius: '50%', background: 'var(--live)', opacity: 0.35 }} />
            </>
          )}

          {/* status badge bottom-right */}
          {(status === 'wait' || status === 'err' || status === 'done') && (
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: ringColor, color: '#0a0a0a',
              border: '2px solid #0a0b0d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              boxShadow: `0 0 8px ${ringColor}`,
            }}>
              {status === 'wait' && '!'}
              {status === 'err' && '×'}
              {status === 'done' && (
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>
              )}
            </span>
          )}

          {/* edge-dock peek arrow */}
          {docked && (
            <span style={{
              position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)', fontSize: 14,
            }}>‹</span>
          )}
        </div>
      </div>

      {/* speech bubble */}
      {bubble && expanded && (
        <div style={{
          position: 'relative',
          background: '#000',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 10,
          fontSize: 12,
          fontFamily: 'var(--sans)',
          maxWidth: 220,
          marginTop: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        }}>
          {/* tail */}
          <span style={{
            position: 'absolute', left: -6, top: 14,
            width: 0, height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '7px solid #000',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{meta.name}</span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)' }}>aurora-api</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {bubble}
          </div>
          {status === 'wait' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button style={{
                background: 'rgba(255,255,255,0.10)', color: '#fff', border: 'none',
                borderRadius: 999, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
              }}>Deny</button>
              <button style={{
                background: 'oklch(0.80 0.17 145)', color: '#0a0a0a', border: 'none',
                borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>Approve ↵</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── RADIAL ACTION MENU ───────────────────────────────────────────────────
function CompanionRadial() {
  const r = 70;
  const actions = [
    { label: 'Jump', icon: '↗', angle: -90, primary: true },
    { label: 'Approve', icon: '✓', angle: -30 },
    { label: 'Mute', icon: '◖', angle: 30 },
    { label: 'Dock', icon: '⇤', angle: 90 },
    { label: 'Settings', icon: '⚙', angle: 150 },
    { label: 'Hide', icon: '×', angle: 210 },
  ];
  return (
    <div style={{ position: 'relative', width: 220, height: 220 }}>
      {/* center avatar */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <CompanionAvatar agent="claude" status="live" />
      </div>
      {actions.map((a, i) => {
        const x = Math.cos(a.angle * Math.PI / 180) * r;
        const y = Math.sin(a.angle * Math.PI / 180) * r;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: a.primary ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.7)',
              color: a.primary ? '#0a0a0a' : '#fff',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
              boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
            }}>{a.icon}</div>
            <span style={{
              fontSize: 9.5,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--mono)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}>{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── CARD WRAPPER ─────────────────────────────────────────────────────────
function CompCard({ caption, desc, tone, children }) {
  const toneColor = tone === 'wait' ? 'var(--wait)' : tone === 'done' ? 'var(--idle)' : tone === 'err' ? 'var(--err)' : 'var(--live)';
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--bd)',
      borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.25 0.05 250), #0a0b0d)',
        borderRadius: 7, padding: 18, minHeight: 110,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        border: '1px solid var(--bd-soft)',
      }}>
        {children}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: toneColor }} />
          <span style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>{caption}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{desc}</div>
      </div>
    </div>
  );
}

// ── PREFS ROW ────────────────────────────────────────────────────────────
function PrefRow({ label, sub, control, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--bd-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
}

// ── FAUX EDITOR WINDOW (background context) ──────────────────────────────
function FauxEditorWindow() {
  return (
    <div style={{
      position: 'absolute', top: 50, left: 50, right: 50, bottom: 70,
      background: 'rgba(20,22,28,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      opacity: 0.92,
    }}>
      <div style={{
        height: 28, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--mono)' }}>auth.ts — aurora-api</span>
      </div>
      <div style={{ flex: 1, display: 'flex', fontFamily: 'var(--mono)', fontSize: 11, padding: 12, gap: 10, color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ width: 30, textAlign: 'right', lineHeight: 1.6 }}>
          {Array.from({ length: 14 }, (_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <div style={{ flex: 1, lineHeight: 1.6 }}>
          <div><span style={{ color: 'oklch(0.78 0.10 265)' }}>import</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>{'{ Middleware }'}</span> <span style={{ color: 'oklch(0.78 0.10 265)' }}>from</span> <span style={{ color: 'oklch(0.78 0.13 35)' }}>'koa'</span>;</div>
          <div><span style={{ color: 'oklch(0.78 0.10 265)' }}>import</span> <span style={{ color: 'rgba(255,255,255,0.7)' }}>{'{ verifyToken }'}</span> <span style={{ color: 'oklch(0.78 0.10 265)' }}>from</span> <span style={{ color: 'oklch(0.78 0.13 35)' }}>'../auth/verifier'</span>;</div>
          <div>&nbsp;</div>
          <div><span style={{ color: 'oklch(0.78 0.10 265)' }}>export const</span> <span style={{ color: 'oklch(0.78 0.13 145)' }}>requireAuth</span>: Middleware <span style={{ color: 'rgba(255,255,255,0.7)' }}>=</span> <span style={{ color: 'oklch(0.78 0.10 265)' }}>async</span> (ctx, next) =&gt; {'{'}</div>
          <div>&nbsp;&nbsp;<span style={{ color: 'oklch(0.78 0.10 265)' }}>const</span> token = ctx.headers.authorization?.replace(/^Bearer /, <span style={{ color: 'oklch(0.78 0.13 35)' }}>''</span>);</div>
          <div>&nbsp;&nbsp;<span style={{ color: 'oklch(0.78 0.10 265)' }}>const</span> r = token <span style={{ color: 'rgba(255,255,255,0.7)' }}>&amp;&amp;</span> <span style={{ color: 'oklch(0.78 0.10 265)' }}>await</span> verifyToken(token, SECRET);</div>
          <div>&nbsp;&nbsp;<span style={{ color: 'oklch(0.78 0.10 265)' }}>if</span> (!r <span style={{ color: 'rgba(255,255,255,0.7)' }}>||</span> !r.ok) ctx.throw(<span style={{ color: 'oklch(0.78 0.13 145)' }}>401</span>);</div>
          <div>&nbsp;&nbsp;ctx.state.user = r.payload;</div>
          <div>&nbsp;&nbsp;<span style={{ color: 'oklch(0.78 0.10 265)' }}>await</span> next();</div>
          <div>{'}'};</div>
        </div>
      </div>
    </div>
  );
}

// ── DOCK ─────────────────────────────────────────────────────────────────
function Dock() {
  const apps = [
    ['#FF6B6B', 'C'], // Code
    ['#4ECDC4', 'T'], // Terminal
    ['#FFD93D', 'B'], // Browser
    ['#A78BFA', 'F'], // Figma
    [null, 'CH'],     // CodeHub (highlighted)
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
      borderRadius: 16, padding: '6px 8px',
      display: 'flex', alignItems: 'center', gap: 8,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
    }}>
      {apps.map(([color, letter], i) => (
        <div key={i} style={{
          width: 42, height: 42, borderRadius: 10,
          background: color || 'linear-gradient(135deg, oklch(0.50 0.10 230), oklch(0.30 0.08 250))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          {letter}
          {/* running indicator under CodeHub */}
          {i === 4 && <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />}
        </div>
      ))}
    </div>
  );
}

// ── CHARACTER STYLES ──────────────────────────────────────────────────────
// Each agent can pick a character style. The same status is conveyed
// across all 4 expressions: idle · thinking · awaiting · done.

const EXPRESSIONS = ['idle', 'thinking', 'awaiting', 'done'];

function CharacterCard({ kind, name, desc, active }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: `1px solid ${active ? 'var(--fg-2)' : 'var(--bd)'}`,
      borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}>
      {active && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: 9.5, padding: '2px 6px', borderRadius: 4,
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          fontFamily: 'var(--mono)', fontWeight: 600,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>active</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-0)' }}>{name}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-2)', minHeight: 32, lineHeight: 1.4 }}>{desc}</div>

      {/* expression strip */}
      <div style={{
        background: 'linear-gradient(180deg, oklch(0.20 0.05 250), #0a0b0d)',
        borderRadius: 8, padding: '14px 10px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
        border: '1px solid var(--bd-soft)',
      }}>
        {EXPRESSIONS.map(exp => (
          <div key={exp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Character kind={kind} expression={exp} />
            <span style={{
              fontSize: 9, fontFamily: 'var(--mono)',
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{exp}</span>
          </div>
        ))}
      </div>

      {!active && (
        <button className="btn xs ghost" style={{ alignSelf: 'flex-start' }}>Use {name}</button>
      )}
    </div>
  );
}

function Character({ kind, expression, size = 44 }) {
  // Ring color per expression
  const ring =
    expression === 'awaiting' ? 'var(--wait)' :
    expression === 'done' ? 'var(--live)' :
    expression === 'thinking' ? 'var(--live)' :
    'rgba(255,255,255,0.25)';

  const glow =
    expression === 'awaiting' ? '0 0 18px var(--wait)' :
    expression === 'done' ? '0 0 14px var(--live)' :
    'none';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#0a0b0d',
      border: `2px solid ${ring}`,
      boxShadow: `0 6px 16px rgba(0,0,0,.5), ${glow}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {kind === 'glyph' && <GlyphFace expression={expression} />}
      {kind === 'sprite' && <SpriteFace expression={expression} />}
      {kind === 'face' && <SimpleFace expression={expression} />}
      {kind === 'orb' && <OrbFace expression={expression} />}
      {kind === 'ascii' && <AsciiFace expression={expression} />}
      {kind === 'robot' && <RobotFace expression={expression} />}

      {/* thinking orbital dot */}
      {expression === 'thinking' && (
        <span style={{
          position: 'absolute', top: -1, left: '50%',
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--live)', transform: 'translateX(-50%)',
        }} />
      )}
      {expression === 'awaiting' && (
        <span style={{
          position: 'absolute', bottom: -3, right: -3,
          width: 14, height: 14, borderRadius: '50%',
          background: 'var(--wait)', color: '#0a0a0a',
          border: '2px solid #0a0b0d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700,
        }}>!</span>
      )}
    </div>
  );
}

// 1. Glyph — agent mark + colored undercoat
function GlyphFace({ expression }) {
  return <div style={{ transform: 'scale(1.7)' }}><AgentGlyph agent="claude" size={12} color="var(--a-claude)" /></div>;
}

// 2. Sprite — pixel art face (8x8 grid)
function SpriteFace({ expression }) {
  // 8x8 pixel grid; 1 = on, 2 = mouth-accent
  const patterns = {
    idle:     [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,0,1,1,1,1,0,1, 1,1,1,1,1,1,1,1, 1,0,1,1,1,1,0,1, 1,1,0,2,2,0,1,1, 0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0],
    thinking: [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,0,1,0,0,1,0,1, 1,1,1,1,1,1,1,1, 1,0,1,0,0,1,0,1, 1,1,2,2,2,2,1,1, 0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0],
    awaiting: [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,2,1,1,1,1,2,1, 1,1,2,2,2,2,1,1, 1,0,1,1,1,1,0,1, 1,1,0,2,2,0,1,1, 0,1,2,2,2,2,1,0, 0,0,1,1,1,1,0,0],
    done:     [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,1,1,2,2,1,1,1, 1,2,1,1,1,1,2,1, 1,0,1,1,1,1,0,1, 1,1,0,1,1,0,1,1, 0,1,1,2,2,1,1,0, 0,0,1,1,1,1,0,0],
  };
  const grid = patterns[expression] || patterns.idle;
  const px = 2.8;
  const color = expression === 'awaiting' ? 'var(--wait)' : expression === 'done' ? 'var(--live)' : 'rgba(255,255,255,0.85)';
  const accent = expression === 'awaiting' ? 'var(--err)' : expression === 'done' ? '#fff' : 'var(--a-claude)';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(8, ${px}px)`, gap: 0.5,
      imageRendering: 'pixelated',
    }}>
      {grid.map((v, i) => (
        <span key={i} style={{
          width: px, height: px,
          background: v === 1 ? color : v === 2 ? accent : 'transparent',
        }} />
      ))}
    </div>
  );
}

// 3. Simple emoji-like face — circle, 2 eye dots, an arc mouth
function SimpleFace({ expression }) {
  const eye = (cx) => <circle cx={cx} cy="13" r="1.8" fill="#fff" />;
  let mouth;
  if (expression === 'idle') mouth = <path d="M11 22 Q16 24 21 22" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
  else if (expression === 'thinking') mouth = <line x1="12" y1="22" x2="20" y2="22" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />;
  else if (expression === 'awaiting') mouth = <circle cx="16" cy="22" r="1.6" fill="#fff" />;
  else mouth = <path d="M10 21 Q16 26 22 21" stroke="var(--live)" strokeWidth="1.8" fill="none" strokeLinecap="round" />;

  // worried eyebrows for awaiting
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      {expression === 'awaiting' && (
        <>
          <line x1="8" y1="10" x2="13" y2="8" stroke="var(--wait)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="24" y1="10" x2="19" y2="8" stroke="var(--wait)" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {eye(11)}
      {eye(21)}
      {mouth}
    </svg>
  );
}

// 4. Orb — radial gradient sphere
function OrbFace({ expression }) {
  const colorMap = {
    idle: 'oklch(0.78 0.06 240)',
    thinking: 'oklch(0.80 0.17 145)',
    awaiting: 'oklch(0.83 0.14 80)',
    done: 'oklch(0.80 0.17 145)',
  };
  const c = colorMap[expression];
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${c} 90%, white), ${c} 50%, color-mix(in oklab, ${c} 50%, black) 100%)`,
      boxShadow: `0 0 ${expression === 'idle' ? 8 : 16}px ${c}`,
    }} />
  );
}

// 5. ASCII face — terminal text
function AsciiFace({ expression }) {
  const map = {
    idle: '(o_o)',
    thinking: '(•_•)',
    awaiting: '(@_@)',
    done: '(^_^)',
  };
  const color = expression === 'awaiting' ? 'var(--wait)' : expression === 'done' ? 'var(--live)' : 'rgba(255,255,255,0.9)';
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
      color, letterSpacing: '0.02em',
    }}>{map[expression]}</span>
  );
}

// 6. Robot — angular faceplate with rectangular eyes
function RobotFace({ expression }) {
  const eyeColor = expression === 'awaiting' ? 'var(--wait)' : expression === 'done' ? 'var(--live)' : 'rgba(255,255,255,0.9)';
  const eyeH = expression === 'thinking' ? 1.5 : expression === 'done' ? 2.5 : 4;
  const eyeY = expression === 'thinking' ? 14 : expression === 'done' ? 13 : 12;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      {/* faceplate */}
      <rect x="6" y="7" width="20" height="18" rx="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" fill="rgba(255,255,255,0.03)" />
      {/* antenna */}
      <line x1="16" y1="7" x2="16" y2="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1.2" fill={expression === 'thinking' ? 'var(--live)' : 'rgba(255,255,255,0.4)'} />
      {/* eyes (rectangles) */}
      <rect x="10" y={eyeY} width="4" height={eyeH} rx="0.5" fill={eyeColor} />
      <rect x="18" y={eyeY} width="4" height={eyeH} rx="0.5" fill={eyeColor} />
      {/* mouth (line) */}
      {expression === 'done' ? (
        <path d="M11 21 Q16 24 21 21" stroke={eyeColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : expression === 'awaiting' ? (
        <line x1="13" y1="22" x2="19" y2="22" stroke="var(--wait)" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <line x1="12" y1="22" x2="20" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}

window.Companion = Companion;
