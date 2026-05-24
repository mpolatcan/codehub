// CodeHub — Workspace view. 3-pane layout demonstrating new pane types:
// file browser, agent terminal, and plain container shell.

function Workspace() {
  return (
    <AppChrome w={1440} h={900} title="codehub · workspace · aurora-api">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <window.AppSidebar active="hub" />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* session header */}
          <div style={{
            height: '2.375rem', display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid var(--bd-soft)', paddingLeft: '0.5rem',
          }}>
            <div title="Workspace: Auth refactor" style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0 0.875rem',
              background: 'var(--bg-2)', borderRight: '1px solid var(--bd-soft)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />
              <span className="tab-handle" title="Drag to reorder / dock" />
              <StatusDot status="live" pulse />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--fg-0)' }}>Auth refactor</span>
                <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ display: 'inline-flex', width: '0.5625rem', height: '0.5625rem' }}>{Ico.container}</span>aurora-api
                </span>
              </div>
              <span className="mono" title="3 panes in this workspace" style={{
                fontSize: '0.625rem', color: 'var(--fg-3)', padding: '1px 0.3125rem',
                background: 'var(--bg-3)', borderRadius: 3, marginLeft: 2,
              }}>3▣</span>
            </div>
            <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: '0.375rem' }} title="New workspace tab">{Ico.plus}</button>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.75rem', fontSize: '0.6875rem', color: 'var(--fg-2)' }}>
              <span title="Total turn time">turn <span className="mono" style={{ color: 'var(--fg-0)' }}>04:12</span></span>
              <span title="Total cost this workspace">$ <span className="mono" style={{ color: 'var(--fg-0)' }}>2.31</span></span>
              <button className="btn ghost sm" title="Search (⌘K)">{Ico.search}<span className="kbd">⌘K</span></button>
              <IconBtn title="Activity"><span style={{ position: 'relative', display: 'inline-flex' }}>{Ico.bell}<span style={{ position: 'absolute', top: -1, right: -1, width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--wait)' }} /></span></IconBtn>
            </div>
          </div>

          {/* Groups bar — consistent across all hub screens */}
          <div style={{
            height: '2rem', flexShrink: 0,
            display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid var(--bd-soft)',
            background: 'var(--bg-1)',
            paddingLeft: '0.5rem',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5625rem',
              padding: '0 0.625rem 0 0.375rem', height: '100%',
              borderRight: '1px solid var(--bd-soft)',
              background: 'var(--bg-0)', color: 'var(--fg-0)',
              cursor: 'pointer', position: 'relative',
              fontSize: '0.75rem',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px var(--bd-soft)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--pri)' }} />
              <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: 'var(--pri)', border: '1px solid color-mix(in oklab, var(--pri) 60%, #000)' }} />
              <span style={{ fontWeight: 500 }}>Backend</span>
              <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>3</span>
              <IconBtn title="Close group" style={{ width: '1.125rem', height: '1.125rem', marginLeft: '0.25rem' }}>{Ico.close}</IconBtn>
            </div>
            <button className="btn ghost xs" title="Add group" style={{ alignSelf: 'center', marginLeft: 6, padding: '4px 6px' }}>{Ico.plus}</button>
            <div style={{ flex: 1 }} />
            <span className="mono" style={{ alignSelf: 'center', fontSize: '0.625rem', color: 'var(--fg-3)', padding: '0 0.625rem' }}>
              1 group · drag tab to reorder
            </span>
          </div>

          {/* 3-pane workspace */}
          <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
            <FilesPane />
            <AgentWorkPane />
            <ShellPane />
          </div>

          {/* PANE ACTIONS BAR */}
          <div style={{
            height: '2.25rem', flexShrink: 0,
            background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.375rem',
          }}>
            <PaneAddBtn kind="files" kbd="⌘E" />
            <PaneAddBtn kind="shell" kbd="⌘⇧B" />
            <PaneAddBtn kind="diff" kbd="⌘D" />
            <span style={{ flex: 1 }} />
            <SpawnSplitBtn />
          </div>

          {/* status */}
          <div style={{
            height: '1.625rem', flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.875rem',
            fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
          }}>
            <span><StatusDot status="live" /> aurora-cc-3a8f · 2 agents attached</span>
            <span>files · 1842 in /workspace · 14 modified</span>
            <div style={{ flex: 1 }} />
            <span>⌘E files</span><span>⌘\ split</span><span>⌘⇧B shell</span>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

// ── FILES PANE ─────────────────────────────────────────────────────────
function FilesPane() {
  return (
    <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)', minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
      }}>
        {Ico.files}
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)', fontWeight: 500 }}>files</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Search files" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.search}</IconBtn>
        <IconBtn title="Show modified" style={{ width: '1.375rem', height: '1.375rem' }} active>{Ico.diff}</IconBtn>
        <IconBtn title="More" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
      </div>

      {/* breadcrumb */}
      <div style={{
        padding: '0.5rem 0.75rem', fontSize: '0.6875rem', color: 'var(--fg-2)',
        fontFamily: 'var(--mono)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        <span>/</span><span style={{ color: 'var(--fg-1)' }}>workspace</span>
        <span style={{ color: 'var(--fg-3)' }}>/</span><span style={{ color: 'var(--fg-1)' }}>src</span>
        <span style={{ color: 'var(--fg-3)' }}>/</span><span style={{ color: 'var(--fg-0)' }}>auth</span>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '0.5rem 0.375rem', fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
        <FileNode kind="dir" name=".github" depth={0} />
        <FileNode kind="dir" name="migrations" depth={0} mod={1} open>
          <FileNode kind="file" name="0001_init.sql" depth={1} />
          <FileNode kind="file" name="0007_users_idx.sql" depth={1} />
          <FileNode kind="file" name="0008_audit_log.sql" depth={1} mark="A" />
        </FileNode>
        <FileNode kind="dir" name="src" depth={0} mod={9} open>
          <FileNode kind="dir" name="auth" depth={1} mod={3} open active>
            <FileNode kind="file" name="verifier.ts" depth={2} mark="A" />
            <FileNode kind="file" name="verifier.spec.ts" depth={2} mark="A" />
            <FileNode kind="file" name="index.ts" depth={2} />
          </FileNode>
          <FileNode kind="dir" name="middleware" depth={1} mod={2} open>
            <FileNode kind="file" name="auth.ts" depth={2} mark="M" sel />
            <FileNode kind="file" name="cors.ts" depth={2} />
            <FileNode kind="file" name="rate-limit.ts" depth={2} />
          </FileNode>
          <FileNode kind="dir" name="routes" depth={1} />
          <FileNode kind="dir" name="types" depth={1} mod={1}>
            <FileNode kind="file" name="jwt.ts" depth={2} mark="A" />
          </FileNode>
          <FileNode kind="file" name="server.ts" depth={1} />
        </FileNode>
        <FileNode kind="dir" name="tests" depth={0} mod={1} />
        <FileNode kind="file" name="package.json" depth={0} mark="M" />
        <FileNode kind="file" name="tsconfig.json" depth={0} />
        <FileNode kind="file" name=".env" depth={0} dim />
      </div>

      <div style={{
        padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)',
        background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontFamily: 'var(--mono)', fontSize: '0.6875rem', color: 'var(--fg-2)',
      }}>
        <span style={{ color: 'var(--live)' }}>+113</span>
        <span style={{ color: 'var(--err)' }}>−28</span>
        <span style={{ flex: 1 }} />
        <span>1842 files</span>
      </div>
    </div>
  );
}

function FileNode({ kind, name, depth, open, mod, mark, sel, active, dim, children }) {
  const markColor = mark === 'A' ? 'var(--live)' : mark === 'M' ? 'var(--wait)' : 'var(--fg-2)';
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 0.5rem', borderRadius: 4,
        paddingLeft: '0.5rem' + depth * 14,
        background: sel ? 'var(--bg-3)' : active ? 'color-mix(in oklab, var(--bg-3) 60%, transparent)' : 'transparent',
        color: sel ? 'var(--fg-0)' : 'var(--fg-1)',
        opacity: dim ? 0.5 : 1,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}>
        {kind === 'dir' ? (
          <>
            <span style={{ width: '0.625rem', color: 'var(--fg-3)', display: 'inline-flex', transform: open ? 'none' : 'rotate(-90deg)' }}>{Ico.chevD}</span>
            <span style={{ color: 'var(--fg-2)' }}>▸</span>
          </>
        ) : (
          <>
            <span style={{ width: '0.625rem' }} />
            <span style={{ color: 'var(--fg-3)' }}>·</span>
          </>
        )}
        <span style={{ flex: 1, color: sel ? 'var(--fg-0)' : kind === 'dir' ? 'var(--fg-0)' : 'var(--fg-1)' }}>{name}</span>
        {mod && <span style={{ fontSize: '0.625rem', color: 'var(--wait)' }}>{mod}</span>}
        {mark && <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: 2, background: `color-mix(in oklab, ${markColor} 22%, transparent)`, color: markColor, fontSize: '0.625rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{mark}</span>}
      </div>
      {open && children}
    </>
  );
}

// ── AGENT WORK PANE ────────────────────────────────────────────────────
function AgentWorkPane() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', minWidth: 0 }}>
      {/* head — identity + controls only. Metrics live at the bottom. */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.4375rem 0.75rem' }}>
        <PaneTypeChip kind="agent" active />
        <StatusDot status="live" pulse />
        <AgentGlyph agent="claude" size={13} color="var(--a-claude)" />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)' }}>Claude Code</span>
        <AccountAvatar id="cm" size={13} />
        <span style={{ flex: 1 }} />
        <IconBtn title="Maximize pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
        <IconBtn title="More actions — split, copy, fullscreen…" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
        <IconBtn title="Close pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>

      <TermBlock lines={[
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
        [['added', '   + import { jwtVerify, errors } from \'jose\';']],
        [['added', '   + export type VerifyResult ={ ok: true | false; ... };']],
        [['added', '   + export async function verifyToken(token, secret) {...}']],
        [],
        [['prompt', '⏺ '], ['user', 'Bash '], ['dim', 'pnpm test src/auth']],
        [['ok', '   ✓ '], ['user', 'verifier.spec.ts'], ['meta', ' (4 tests) 142ms']],
        [['ok', '   ✓ '], ['user', '218 passed'], ['meta', ' · 4.21s']],
        [],
        [['prompt blink', '▍']],
      ]} />

      {/* metrics strip at the bottom */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.3125rem 0.75rem',
        background: 'var(--bg-1)', borderTop: '1px solid var(--bd-soft)',
      }}>
        <ContextGauge used={184200} max={1000000} label="ctx" width={80} />
        <div className="vr" style={{ height: '0.875rem' }} />
        <MetricStat label="turn" value="04:12" />
        <MetricStat label="tok" value="184.2k" />
        <MetricStat label="$" value="2.31" />
        <MetricStat label="edits" value="14" />
      </div>

      <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="mono" style={{ color: 'var(--live)', fontSize: '0.75rem' }}>▸</span>
        <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: '0.75rem' }}>Try "review the verifier for edge cases"</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>auto · shift+tab</span>
      </div>
    </div>
  );
}

// ── SHELL PANE ─────────────────────────────────────────────────────────
function ShellPane() {
  return (
    <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.4375rem 0.75rem',
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
      }}>
        <PaneTypeChip kind="shell" active />
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--fg-0)' }}>bash</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-3)' }}>tmux sh.0</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Clear scrollback (⌘K)" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
        <IconBtn title="Maximize pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.expand}</IconBtn>
        <IconBtn title="More actions — split, copy, fullscreen…" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.more}</IconBtn>
        <IconBtn title="Close pane" style={{ width: '1.375rem', height: '1.375rem' }}>{Ico.close}</IconBtn>
      </div>

      <TermBlock lines={[
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['user', 'pwd']],
        [['user', '/workspace']],
        [],
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['user', 'ls src/auth']],
        [['info', 'index.ts  '], ['ok', 'verifier.spec.ts  '], ['ok', 'verifier.ts']],
        [],
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['user', 'git status -sb']],
        [['meta', '## feat/auth-rewrite']],
        [['ok', 'A  '], ['meta', 'src/auth/verifier.ts']],
        [['ok', 'A  '], ['meta', 'src/auth/verifier.spec.ts']],
        [['ok', 'A  '], ['meta', 'src/types/jwt.ts']],
        [['warn', ' M '], ['meta', 'src/middleware/auth.ts']],
        [['warn', ' M '], ['meta', 'package.json']],
        [['ok', 'A  '], ['meta', 'migrations/0008_audit_log.sql']],
        [],
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['user', 'node --version']],
        [['user', 'v20.18.0']],
        [],
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['user', 'cat src/auth/verifier.ts | head -8']],
        [['info', "import { jwtVerify, errors } from 'jose';"]],
        [['info', "import { JWTPayload } from '../types/jwt';"]],
        [],
        [['info', 'export type VerifyResult =']],
        [['info', "  | { ok: true; payload: JWTPayload }"]],
        [['info', "  | { ok: false; reason: 'expired' | 'malformed' | 'wrong-iss' };"]],
        [],
        [['ok', 'node@aurora-cc-3a8f'], ['meta', ':'], ['path', '/workspace'], ['meta', '$ '], ['prompt blink', '▍']],
      ]} />

      <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="mono" style={{ color: 'var(--fg-2)', fontSize: '0.75rem' }}>$</span>
        <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: '0.75rem' }}>Type a command (no agent — runs in the container)</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>history ↑</span>
      </div>
    </div>
  );
}

function PaneTypeChip({ kind, active }) {
  const map = {
    agent: { label: 'AGENT', color: 'var(--a-claude)' },
    shell: { label: 'SHELL', color: 'var(--live)' },
    files: { label: 'FILES', color: 'var(--idle)' },
  };
  const m = map[kind] || map.agent;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3125rem',
      padding: '2px 0.4375rem', borderRadius: 4,
      background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
      color: m.color,
      fontFamily: 'var(--mono)', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em',
      border: `1px solid color-mix(in oklab, ${m.color} 25%, transparent)`,
    }}>
      {m.label}
      <span style={{ color: 'var(--fg-3)', fontSize: '0.625rem' }}>{Ico.chevD}</span>
    </span>
  );
}

window.Workspace = Workspace;

// IDE-style “add a pane of type X” button. Color-coded so the pane types stay
// recognizable across the chrome (toolbar, splash, palette).
function PaneAddBtn({ kind, kbd, active }) {
  const map = {
    agent: { label: 'Agent', color: 'var(--a-claude)', icon: window.Ico.agentPane },
    files: { label: 'Files', color: 'var(--idle)',      icon: window.Ico.files },
    shell: { label: 'Shell', color: 'var(--live)',      icon: window.Ico.terminal },
    diff:  { label: 'Diff',  color: 'var(--wait)',      icon: window.Ico.diff },
  };
  const m = map[kind] || map.agent;
  // Agent is a spawn action (one-shot, opens config). Files/Shell/Diff are
  // workspace-level toggle panes — at most one of each visible at a time.
  // `active` only applies to toggles; the agent button ignores it.
  const isToggle = kind !== 'agent';
  const titlePrefix = isToggle
    ? (active ? 'Hide' : 'Show')
    : 'New';
  return (
    <button className={`pane-add-btn ${isToggle && active ? 'active' : ''}`}
      title={`${titlePrefix} ${m.label}${isToggle ? ' pane' : ''} · ${kbd}`}
      aria-pressed={isToggle ? !!active : undefined}
      style={{ ['--pa-c']: m.color }}>
      <span className="pane-add-ico">{m.icon}</span>
      <span className="pane-add-lbl">{m.label}</span>
    </button>
  );
}
window.PaneAddBtn = PaneAddBtn;
