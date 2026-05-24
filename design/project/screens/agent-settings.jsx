// CodeHub — Agent Settings detail. Tabs for Claude Code / Codex / Antigravity,
// with Claude Code expanded showing the custom model provider system.

function AgentSettings() {
  return (
    <AppChrome w={1440} h={900} title="codehub · settings · agents">
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 52, background: 'var(--bg-0)', borderRight: '1px solid var(--bd-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0',
        }}>
          <div style={{ paddingBottom: 14, marginBottom: 12, borderBottom: '1px solid var(--bd-soft)', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo size={20} withText={false} />
          </div>
          <RailIcon>{Ico.hub}</RailIcon>
          <RailIcon badge="5">{Ico.grid}</RailIcon>
          <RailIcon>{Ico.container}</RailIcon>
          <div style={{ flex: 1 }} />
          <RailIcon active>{Ico.settings}</RailIcon>
        </aside>

        <main style={{ flex: 1, display: 'flex', background: 'var(--bg-1)', minWidth: 0 }}>
          {/* settings nav */}
          <nav style={{
            width: 220, flexShrink: 0,
            background: 'var(--bg-1)',
            borderRight: '1px solid var(--bd-soft)',
            padding: '20px 12px',
          }}>
            <h2 style={{ margin: '0 6px 14px', fontSize: 17, fontWeight: 600 }}>Settings</h2>
            <NavGroup label="Workspace">
              <NavItem>General</NavItem>
              <NavItem active>Agents</NavItem>
              <NavItem>Container runtime</NavItem>
              <NavItem>Repositories</NavItem>
            </NavGroup>
            <NavGroup label="Experience">
              <NavItem>Keyboard shortcuts</NavItem>
              <NavItem>Notifications</NavItem>
              <NavItem>Appearance</NavItem>
            </NavGroup>
            <NavGroup label="Account">
              <NavItem>Usage & billing</NavItem>
              <NavItem>Team</NavItem>
            </NavGroup>
          </nav>

          {/* content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* agent tab bar */}
            <div style={{
              display: 'flex', alignItems: 'stretch',
              padding: '0 24px',
              borderBottom: '1px solid var(--bd-soft)',
              height: 50, flexShrink: 0,
            }}>
              <AgentTab agent="claude" name="Claude Code" providers="4 providers" active />
              <AgentTab agent="codex" name="Codex" providers="OpenAI" />
              <AgentTab agent="antigravity" name="Antigravity" providers="Google" />
              <div style={{ flex: 1 }} />
              <button className="btn ghost sm" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>{Ico.plus}Custom agent</button>
            </div>

            <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
              <div style={{ maxWidth: 820 }}>
                {/* hero */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'color-mix(in oklab, var(--a-claude) 16%, var(--bg-1))',
                    border: '1px solid color-mix(in oklab, var(--a-claude) 35%, var(--bd))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    <span style={{ transform: 'scale(1.7)' }}><AgentGlyph agent="claude" size={14} color="var(--a-claude)" /></span>
                    <span style={{
                      position: 'absolute', bottom: -6, right: -6,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--bg-2)', border: '1px solid var(--bd)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--fg-2)', cursor: 'pointer',
                    }} title="Replace with custom logo PNG">{Ico.plus}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Claude Code</h1>
                      <Tag>v2.1.147</Tag>
                      <StatusBadge status="live">Connected</StatusBadge>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
                      Default agent · supports Anthropic + OpenAI-compatible providers (MiniMax, GLM, Qwen, custom). Click the avatar to upload a custom logo PNG — falls back to the built-in glyph.
                    </div>
                  </div>
                  <button className="btn sm">{Ico.search}Check for update</button>
                </div>

                {/* ACCOUNTS */}
                <SectionHead label="Accounts · 3" />
                <AccountSettingRow id="cm" sessions={2} cost="$4.81" tokens="892k" def />
                <AccountSettingRow id="cw" sessions={0} cost="$0.00" tokens="324k" note="work" />
                <AccountSettingRow id="ca" sessions={1} cost="$8.42" tokens="64k" budget="$200" />
                <div style={{ display: 'flex', gap: 8, margin: '10px 0 28px' }}>
                  <button className="btn sm">{Ico.plus}Sign in with Claude</button>
                  <button className="btn sm ghost">Add API key</button>
                </div>

                {/* PROVIDERS */}
                <SectionHead label="Model providers · 4" />
                <ProviderRow
                  badge="anthropic" name="Anthropic" sub="Native · keychain"
                  models={['opus-4.7', 'sonnet-4.7', 'haiku-4.5']} active def
                />
                <ProviderRow
                  badge="minimax" name="MiniMax" sub="OpenAI-compatible · api.minimaxi.com"
                  models={['minimax-m1', 'minimax-text-01']} active
                />
                <ProviderRow
                  badge="glm" name="Zhipu GLM" sub="OpenAI-compatible · open.bigmodel.cn"
                  models={['glm-4.5', 'glm-4.5-air', 'glm-4-plus']} active
                />
                <ProviderRow
                  badge="qwen" name="Alibaba Qwen" sub="OpenAI-compatible · dashscope.aliyuncs.com"
                  models={['qwen3-coder-plus', 'qwen3-max', 'qwen3-32b']} active
                />

                <div style={{ display: 'flex', gap: 8, margin: '10px 0 28px' }}>
                  <button className="btn sm" style={{ whiteSpace: 'nowrap' }}>{Ico.plus}Add provider</button>
                  <div style={{
                    display: 'flex', gap: 4, padding: '4px 6px', borderRadius: 6,
                    background: 'var(--bg-2)', border: '1px solid var(--bd)',
                  }}>
                    <ProviderTemplate badge="openai" label="OpenAI-compatible" />
                    <ProviderTemplate badge="bedrock" label="AWS Bedrock" />
                    <ProviderTemplate badge="vertex" label="Vertex AI" />
                    <ProviderTemplate badge="ollama" label="Ollama" />
                  </div>
                </div>

                {/* active model picker */}
                <div className="card" style={{ padding: 16, marginBottom: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Active model</span>
                    <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>used by new sessions; per-session override available</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      background: 'var(--bg-1)', border: '1px solid var(--bd)', borderRadius: 7,
                    }}>
                      <ProviderBadge kind="anthropic" />
                      <span className="mono" style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>opus-4.7</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>1M ctx · $15 / Mtok</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ color: 'var(--fg-2)' }}>{Ico.chevD}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="lbl" style={{ fontSize: 10.5, marginRight: 4, alignSelf: 'center' }}>quick switch</span>
                    <ModelChip provider="minimax" model="minimax-m1" ctx="1M" />
                    <ModelChip provider="glm" model="glm-4.5" ctx="128k" />
                    <ModelChip provider="qwen" model="qwen3-coder-plus" ctx="1M" />
                    <ModelChip provider="anthropic" model="sonnet-4.7" ctx="200k" />
                  </div>
                </div>

                {/* tools + MCP */}
                <SectionHead label="MCP servers" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <ToolCard kind="mcp" name="postgres-mcp" desc="Query DB during sessions" on />
                  <ToolCard kind="mcp" name="playwright-mcp" desc="Headless browser automation" />
                  <ToolCard kind="mcp" name="linear-mcp" desc="Read & comment on tickets" on />
                  <ToolCard kind="mcp" name="github-mcp" desc="Issues, PRs, reviews · official" on />
                  <ToolCard kind="mcp" name="filesystem-mcp" desc="Access paths outside /workspace" />
                  <ToolCard kind="add" name="Add MCP server" desc="stdio · SSE · HTTP endpoint" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>3 connected · 14 tools exposed · scope: this agent</span>
                  <span style={{ flex: 1 }} />
                  <button className="btn xs ghost">Browse marketplace</button>
                </div>

                {/* SUB-AGENTS */}
                <SectionHead label="Sub-agents · 4" badge="Claude Code · Codex" />
                <p style={{ fontSize: 11.5, color: 'var(--fg-2)', margin: '-4px 0 12px', maxWidth: 580 }}>
                  Specialized agents Claude Code can delegate to inside a turn — each with its own system prompt, tools allow-list, and model. Sessions can spawn them on demand or you can pre-attach them to specific repos.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <SubAgentCard name="code-reviewer" desc="Reviews diffs for security, style, and edge cases" model="sonnet-4.7" tools={['Read', 'Grep', 'Bash']} on def />
                  <SubAgentCard name="test-writer"   desc="Generates unit + integration tests for changed files" model="haiku-4.5" tools={['Read', 'Edit', 'Bash']} on />
                  <SubAgentCard name="migration-author" desc="Drafts SQL migrations + rollback scripts" model="opus-4.7" tools={['Read', 'Edit', 'Postgres']} on />
                  <SubAgentCard name="ui-implementer" desc="Implements UI from Figma frames or screenshots" model="opus-4.7" tools={['Read', 'Edit', 'Bash', 'Web']} />
                  <SubAgentCard kind="add" name="New sub-agent" desc="Write a system prompt, pick model & tools" />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
                  <button className="btn sm" style={{ whiteSpace: 'nowrap' }}>{Ico.plus}Add sub-agent</button>
                  <button className="btn sm ghost">Import from .claude/agents/</button>
                </div>

                {/* SKILLS */}
                <SectionHead label="Skills · 6" badge="Claude Code only" />
                <p style={{ fontSize: 11.5, color: 'var(--fg-2)', margin: '-4px 0 12px', maxWidth: 580 }}>
                  Reusable capability packs (a SKILL.md + supporting scripts). Claude loads them lazily when the task description matches their trigger. Live in <span className="mono">.claude/skills/</span>.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <SkillCard name="write-commit" trigger="git commit" on />
                  <SkillCard name="read-pdf" trigger="PDF / paper" on />
                  <SkillCard name="tailwind-v4" trigger="tailwind, css migration" />
                  <SkillCard name="postgres-perf" trigger="slow query, explain" on />
                  <SkillCard name="ts-strict" trigger="typescript strict" on />
                  <SkillCard name="sql-review" trigger="schema change, migration" on />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
                  <button className="btn sm" style={{ whiteSpace: 'nowrap' }}>{Ico.plus}Add skill</button>
                  <button className="btn sm ghost">Open skills folder</button>
                  <button className="btn sm ghost">Browse community skills</button>
                </div>

                {/* PLUGINS */}
                <SectionHead label="Plugins · 5 installed" badge="Claude Code · Antigravity" />
                <p style={{ fontSize: 11.5, color: 'var(--fg-2)', margin: '-4px 0 12px', maxWidth: 580 }}>
                  Plugins extend the agent shell itself — slash commands, status-line readers, ambient tools that run alongside the session.
                </p>
                <div className="card" style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
                  <PluginRow name="eslint-integration" version="2.4.1" desc="Stream lint diagnostics into Claude as it edits" status="on" tags={['linter', 'official']} />
                  <PluginRow name="prettier-auto" version="0.9.0" desc="Auto-format on save inside the container" status="on" tags={['formatter']} />
                  <PluginRow name="vitest-watcher" version="1.2.0" desc="Re-run affected tests after every edit" status="on" tags={['testing']} />
                  <PluginRow name="sentry-capture" version="0.3.4" desc="Pipe runtime errors back to Claude for triage" status="on" tags={['observability']} />
                  <PluginRow name="storybook-companion" version="0.5.2" desc="Read story files; render via headless browser" status="off" tags={['ui']} last />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
                  <button className="btn sm" style={{ whiteSpace: 'nowrap' }}>{Ico.search}Browse marketplace</button>
                  <button className="btn sm ghost">Install from URL</button>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', alignSelf: 'center' }}>updates every 24h · last sync 2h ago</span>
                </div>

                {/* permission rules */}
                <SectionHead label="Permission rules" />
                <div className="card" style={{ padding: 0, marginBottom: 26 }}>
                  <PermRule action="Read files inside /workspace" mode="allow" />
                  <PermRule action="Edit files inside /workspace" mode="allow" />
                  <PermRule action="Run shell commands" mode="ask" />
                  <PermRule action="Network requests outside container" mode="ask" />
                  <PermRule action="Modify database via psql / migrate" mode="ask" sticky />
                  <PermRule action="Git push / branch ops" mode="deny" last />
                </div>

                <SectionHead label="Auto behaviors" />
                <SettingRow label="Auto mode at start" desc="Enable Claude Code's auto mode by default for new sessions." control={<Toggle on />} />
                <SettingRow label="Plan before edit" desc="Always draft a plan before writing files." control={<Toggle on />} />
                <SettingRow label="Self-review diff" desc="Have the model critique its own diff before committing." control={<Toggle />} last />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppChrome>
  );
}

function AgentTab({ agent, name, providers, active }) {
  const meta = AGENT_META[agent];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 18px', height: '100%',
      borderBottom: active ? '2px solid var(--fg-0)' : '2px solid transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer',
    }}>
      <AgentGlyph agent={agent} size={14} color={meta.accent} />
      <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{name}</span>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>· {providers}</span>
    </div>
  );
}

// Provider square (logo placeholder — neutral, NOT brand reproductions)
function ProviderBadge({ kind, size = 24 }) {
  const palette = {
    anthropic: ['var(--a-claude)', 'A'],
    minimax: ['oklch(0.74 0.13 25)', 'M'],
    glm: ['oklch(0.74 0.13 220)', 'G'],
    qwen: ['oklch(0.78 0.14 260)', 'Q'],
    openai: ['oklch(0.78 0.12 165)', 'O'],
    bedrock: ['oklch(0.78 0.13 60)', 'B'],
    vertex: ['oklch(0.78 0.13 245)', 'V'],
    ollama: ['oklch(0.78 0.10 200)', 'O'],
  };
  const [color, letter] = palette[kind] || ['var(--fg-1)', '?'];
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 4.5,
      background: `color-mix(in oklab, ${color} 16%, var(--bg-1))`,
      border: `1px solid color-mix(in oklab, ${color} 35%, var(--bd))`,
      color, fontFamily: 'var(--mono)', fontSize: size * 0.46, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{letter}</div>
  );
}

function ProviderRow({ badge, name, sub, models, active, def }) {
  return (
    <div className="card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
      <ProviderBadge kind={badge} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
          {def && <Tag>default</Tag>}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 320, justifyContent: 'flex-end' }}>
        {models.map((m, i) => (
          <span key={i} className="mono" style={{
            fontSize: 10.5, padding: '2px 6px',
            background: 'var(--bg-1)', border: '1px solid var(--bd)',
            borderRadius: 4, color: 'var(--fg-1)',
          }}>{m}</span>
        ))}
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: active ? 'var(--live)' : 'var(--fg-2)', whiteSpace: 'nowrap', minWidth: 90, justifyContent: 'flex-end' }}>
        <StatusDot status={active ? 'live' : 'off'} /> {active ? 'Connected' : 'Disabled'}
      </span>
      <IconBtn title="More">{Ico.more}</IconBtn>
    </div>
  );
}

function ProviderTemplate({ badge, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 4,
      cursor: 'pointer', fontSize: 11.5, color: 'var(--fg-1)',
    }}>
      <ProviderBadge kind={badge} size={16} />
      {label}
    </div>
  );
}

function ModelChip({ provider, model, ctx }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 5,
      background: 'var(--bg-1)', border: '1px solid var(--bd)',
      fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)',
      cursor: 'pointer',
    }}>
      <ProviderBadge kind={provider} size={14} />
      {model}
      <span style={{ color: 'var(--fg-3)' }}>· {ctx}</span>
    </span>
  );
}

function ToolCard({ kind, name, desc, on }) {
  if (kind === 'add') {
    return (
      <div style={{
        padding: 12, borderRadius: 7,
        border: '1px dashed var(--bd-strong)',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', color: 'var(--fg-2)',
      }}>
        {Ico.plus}
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{desc}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 26, height: 26, borderRadius: 5,
        background: kind === 'mcp' ? 'color-mix(in oklab, var(--a-codex) 16%, var(--bg-1))' : 'var(--bg-3)',
        border: `1px solid ${kind === 'mcp' ? 'color-mix(in oklab, var(--a-codex) 35%, var(--bd))' : 'var(--bd)'}`,
        color: kind === 'mcp' ? 'var(--a-codex)' : 'var(--fg-1)',
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{kind === 'mcp' ? 'MCP' : '⚙'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      <Toggle on={on} />
    </div>
  );
}

function PermRule({ action, mode, sticky, last }) {
  const c = mode === 'allow' ? 'var(--live)' : mode === 'deny' ? 'var(--err)' : 'var(--wait)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 16px',
      borderBottom: last ? 'none' : '1px solid var(--bd-soft)',
    }}>
      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--fg-0)' }}>{action}</span>
      {sticky && <Tag color="var(--wait)">sticky</Tag>}
      <div style={{ display: 'flex', background: 'var(--bg-1)', border: '1px solid var(--bd)', borderRadius: 5, padding: 2 }}>
        {['allow', 'ask', 'deny'].map(m => (
          <span key={m} style={{
            padding: '3px 10px', fontSize: 11, borderRadius: 3,
            background: mode === m ? `color-mix(in oklab, ${c} 22%, var(--bg-3))` : 'transparent',
            color: mode === m ? c : 'var(--fg-2)',
            cursor: 'pointer', textTransform: 'capitalize',
          }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

window.AgentSettings = AgentSettings;

// ── SUB-AGENT CARD ────────────────────────────────────────────────────────
function SubAgentCard({ kind, name, desc, model, tools, on, def }) {
  if (kind === 'add') {
    return (
      <div style={{
        padding: 12, borderRadius: 7,
        border: '1px dashed var(--bd-strong)',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', color: 'var(--fg-2)',
        background: 'var(--bg-2)',
      }}>
        {Ico.plus}
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-0)' }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-2)' }}>{desc}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 5,
          background: 'color-mix(in oklab, var(--a-claude) 18%, var(--bg-3))',
          border: '1px solid color-mix(in oklab, var(--a-claude) 38%, var(--bd))',
          color: 'var(--a-claude)',
          fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>SA</span>
        <span className="mono" style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
        {def && <Tag>default reviewer</Tag>}
        <span style={{ flex: 1 }} />
        <Toggle on={on} />
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-2)', lineHeight: 1.4 }}>{desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{model}</span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        {tools.map(t => (
          <span key={t} style={{
            fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 5px',
            background: 'var(--bg-1)', border: '1px solid var(--bd)',
            borderRadius: 3, color: 'var(--fg-1)',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── SKILL CARD ────────────────────────────────────────────────────────────
function SkillCard({ name, trigger, on }) {
  return (
    <div className="card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 22, height: 22, borderRadius: 4,
        background: 'color-mix(in oklab, var(--a-antigravity) 16%, var(--bg-3))',
        border: '1px solid color-mix(in oklab, var(--a-antigravity) 35%, var(--bd))',
        color: 'var(--a-antigravity)',
        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>S</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 10.5, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--fg-2)' }}>trigger:</span> {trigger}
        </div>
      </div>
      <Toggle on={on} />
    </div>
  );
}

// ── PLUGIN ROW (table-like) ──────────────────────────────────────────────
function PluginRow({ name, version, desc, status, tags, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid var(--bd-soft)',
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 6,
        background: 'var(--bg-3)', border: '1px solid var(--bd)',
        color: 'var(--fg-1)',
        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>P</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--fg-0)', fontWeight: 500 }}>{name}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{version}</span>
          {tags && tags.map(t => (
            <span key={t} style={{
              fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.05em',
              padding: '1px 5px', borderRadius: 3,
              background: t === 'official' ? 'color-mix(in oklab, var(--live) 14%, transparent)' : 'var(--bg-1)',
              color: t === 'official' ? 'var(--live)' : 'var(--fg-2)',
              border: '1px solid var(--bd)',
            }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{desc}</div>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: status === 'on' ? 'var(--live)' : 'var(--fg-2)', whiteSpace: 'nowrap' }}>
        <StatusDot status={status === 'on' ? 'live' : 'off'} /> {status === 'on' ? 'Enabled' : 'Disabled'}
      </span>
      <Toggle on={status === 'on'} />
      <IconBtn title="More">{Ico.more}</IconBtn>
    </div>
  );
}

function AccountSettingRow({ id, sessions, cost, tokens, def, note, budget }) {
  const a = ACCOUNTS[id];
  return (
    <div className="card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
      <AccountAvatar id={id} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{a.tier}</span>
          {def && <Tag>default</Tag>}
          {note && <Tag color="var(--idle)">{note}</Tag>}
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>
          {sessions > 0 ? `${sessions} active session${sessions > 1 ? 's' : ''} · ` : 'no active sessions · '}
          {a.plan === 'api' ? 'pay-as-you-go' : a.plan === 'work' ? 'team seat' : 'subscription'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)' }}>
        <span><span style={{ color: 'var(--fg-3)' }}>tok </span>{tokens}</span>
        <span style={{ color: cost === '$0.00' ? 'var(--fg-2)' : 'var(--fg-0)' }}>{cost}{budget && <span style={{ color: 'var(--fg-3)' }}>/{budget}</span>}</span>
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--live)', whiteSpace: 'nowrap' }}>
        <StatusDot status="live" /> Active
      </span>
      <button className="btn sm">Manage</button>
    </div>
  );
}
