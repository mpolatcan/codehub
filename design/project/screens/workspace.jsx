// CodeHub — Workspace view. 3-pane layout demonstrating new pane types:
// file browser, agent terminal, and plain container shell.

function Workspace() {
  return (
    <AppChrome w={1440} h={900} title="codehub · workspace · aurora-api">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* sidebar — collapsed for room */}
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
          {/* session header */}
          <div style={{
            height: 38, display: 'flex', alignItems: 'stretch',
            borderBottom: '1px solid var(--bd-soft)', paddingLeft: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
              background: 'var(--bg-2)', borderRight: '1px solid var(--bd-soft)',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--fg-0)' }} />
              {Ico.container}
              <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>aurora-cc-3a8f</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>aurora-api · feat/auth-rewrite</span>
            </div>
            <button className="btn ghost xs" style={{ alignSelf: 'center', marginLeft: 6 }}>{Ico.plus}</button>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', fontSize: 11, color: 'var(--fg-2)' }}>
              <span>cpu <span className="mono" style={{ color: 'var(--fg-0)' }}>47%</span></span>
              <span>mem <span className="mono" style={{ color: 'var(--fg-0)' }}>1.2/4 GiB</span></span>
              <span className="vr" style={{ height: 14 }} />
              <span>Cost <span className="mono" style={{ color: 'var(--fg-0)' }}>$2.31</span></span>
            </div>
          </div>

          {/* 3-pane workspace */}
          <div style={{ flex: 1, display: 'flex', gap: 1, background: 'var(--bd-soft)', minHeight: 0 }}>
            <FilesPane />
            <AgentWorkPane />
            <ShellPane />
          </div>

          {/* status */}
          <div style={{
            height: 26, flexShrink: 0, background: 'var(--bg-0)',
            borderTop: '1px solid var(--bd-soft)',
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 14,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
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
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
      }}>
        {Ico.files}
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)', fontWeight: 500 }}>files</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Search files" style={{ width: 22, height: 22 }}>{Ico.search}</IconBtn>
        <IconBtn title="Show modified" style={{ width: 22, height: 22 }} active>{Ico.diff}</IconBtn>
        <IconBtn title="More" style={{ width: 22, height: 22 }}>{Ico.more}</IconBtn>
      </div>

      {/* breadcrumb */}
      <div style={{
        padding: '8px 12px', fontSize: 11, color: 'var(--fg-2)',
        fontFamily: 'var(--mono)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        <span>/</span><span style={{ color: 'var(--fg-1)' }}>workspace</span>
        <span style={{ color: 'var(--fg-3)' }}>/</span><span style={{ color: 'var(--fg-1)' }}>src</span>
        <span style={{ color: 'var(--fg-3)' }}>/</span><span style={{ color: 'var(--fg-0)' }}>auth</span>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '8px 6px', fontFamily: 'var(--mono)', fontSize: 12 }}>
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
        padding: '8px 12px', borderTop: '1px solid var(--bd-soft)',
        background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--fg-2)',
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
        padding: '3px 8px', borderRadius: 4,
        paddingLeft: 8 + depth * 14,
        background: sel ? 'var(--bg-3)' : active ? 'color-mix(in oklab, var(--bg-3) 60%, transparent)' : 'transparent',
        color: sel ? 'var(--fg-0)' : 'var(--fg-1)',
        opacity: dim ? 0.5 : 1,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}>
        {kind === 'dir' ? (
          <>
            <span style={{ width: 10, color: 'var(--fg-3)', display: 'inline-flex', transform: open ? 'none' : 'rotate(-90deg)' }}>{Ico.chevD}</span>
            <span style={{ color: 'var(--fg-2)' }}>▸</span>
          </>
        ) : (
          <>
            <span style={{ width: 10 }} />
            <span style={{ color: 'var(--fg-3)' }}>·</span>
          </>
        )}
        <span style={{ flex: 1, color: sel ? 'var(--fg-0)' : kind === 'dir' ? 'var(--fg-0)' : 'var(--fg-1)' }}>{name}</span>
        {mod && <span style={{ fontSize: 10, color: 'var(--wait)' }}>{mod}</span>}
        {mark && <span style={{ width: 12, height: 12, borderRadius: 2, background: `color-mix(in oklab, ${markColor} 22%, transparent)`, color: markColor, fontSize: 9, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{mark}</span>}
      </div>
      {open && children}
    </>
  );
}

// ── AGENT WORK PANE ────────────────────────────────────────────────────
function AgentWorkPane() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', minWidth: 0 }}>
      {/* pane head with type selector + per-pane metrics */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 4px' }}>
          <PaneTypeChip kind="agent" active />
          <StatusDot status="live" pulse />
          <AgentGlyph agent="claude" size={12} color="var(--a-claude)" />
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg-0)' }}>Claude Code</span>
          <AccountAvatar id="cm" size={13} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>m.kim · Max · tmux cc.0</span>
          <span style={{ flex: 1 }} />
          <IconBtn title="Split" style={{ width: 20, height: 20 }}>{Ico.splitV}</IconBtn>
          <IconBtn title="Maximize" style={{ width: 20, height: 20 }}>{Ico.expand}</IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 6px' }}>
          <ContextGauge used={184200} max={1000000} label="ctx" width={80} />
          <span style={{ flex: 1 }} />
          <MetricStat label="turn" value="04:12" />
          <MetricStat label="tok" value="184.2k" />
          <MetricStat label="$" value="$2.31" />
          <MetricStat label="edits" value="14" />
        </div>
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

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ color: 'var(--live)', fontSize: 12 }}>▸</span>
        <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: 12 }}>Try "review the verifier for edge cases"</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>auto · shift+tab</span>
      </div>
    </div>
  );
}

// ── SHELL PANE ─────────────────────────────────────────────────────────
function ShellPane() {
  return (
    <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', background: 'var(--bg-0)', minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 12px',
        background: 'var(--bg-1)', borderBottom: '1px solid var(--bd-soft)',
      }}>
        <PaneTypeChip kind="shell" active />
        <span className="mono" style={{ fontSize: 12, color: 'var(--fg-0)' }}>bash</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>· tmux sh.0</span>
        <span style={{ flex: 1 }} />
        <IconBtn title="Clear">{Ico.close}</IconBtn>
        <IconBtn title="Split">{Ico.splitV}</IconBtn>
        <IconBtn title="Maximize">{Ico.expand}</IconBtn>
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

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--bd-soft)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ color: 'var(--fg-2)', fontSize: 11.5 }}>$</span>
        <span className="mono" style={{ flex: 1, color: 'var(--fg-3)', fontSize: 11.5 }}>Type a command (no agent — runs in the container)</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)' }}>history ↑</span>
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
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 7px', borderRadius: 4,
      background: `color-mix(in oklab, ${m.color} 14%, transparent)`,
      color: m.color,
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
      border: `1px solid color-mix(in oklab, ${m.color} 25%, transparent)`,
    }}>
      {m.label}
      <span style={{ color: 'var(--fg-3)', fontSize: 10 }}>{Ico.chevD}</span>
    </span>
  );
}

window.Workspace = Workspace;
