// CodeHub — shared component library
// Exports to window: AgentGlyph, StatusDot, StatusBadge, AppChrome, Sidebar,
// TerminalPane, AgentTile, Toolbar, IconBtn, Tag, Spark, MiniDiff, Notification.

const { useState, useMemo, useEffect, useRef } = React;

// ── AGENT GLYPHS ──────────────────────────────────────────────────────────
// Original geometric marks per agent. Neutral chrome — color only shows on
// hover/focus or in the agent's own session card.
function AgentGlyph({ agent, size = 14, color, style }) {
  const s = size;
  const stroke = color || 'currentColor';
  if (agent === 'claude') {
    // Concentric square with offset inner notch
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={style} aria-label="Claude Code">
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke={stroke} strokeWidth="1.3" fill="none"/>
        <path d="M6 5.5 L10 8 L6 10.5 Z" fill={stroke}/>
      </svg>
    );
  }
  if (agent === 'codex') {
    // Stacked layered diamond
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={style} aria-label="Codex">
        <path d="M8 2 L13 8 L8 14 L3 8 Z" stroke={stroke} strokeWidth="1.3" fill="none"/>
        <path d="M8 5.5 L10.5 8 L8 10.5 L5.5 8 Z" fill={stroke}/>
      </svg>
    );
  }
  if (agent === 'antigravity') {
    // Up-chevron with orbit ring (anti-gravity = lifting)
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={style} aria-label="Antigravity">
        <circle cx="8" cy="9" r="5.5" stroke={stroke} strokeWidth="1.3" fill="none" opacity="0.55"/>
        <path d="M4.5 9 L8 5 L11.5 9" stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="9" r="1.1" fill={stroke}/>
      </svg>
    );
  }
  if (agent === 'cursor') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" style={style}>
        <path d="M3 3 L13 8 L8 9 L7 13 Z" stroke={stroke} strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" style={style}>
      <circle cx="8" cy="8" r="5" stroke={stroke} strokeWidth="1.3" fill="none"/>
    </svg>
  );
}

const AGENT_META = {
  claude: { name: 'Claude Code', short: 'CC', accent: 'var(--a-claude)' },
  codex: { name: 'Codex', short: 'CX', accent: 'var(--a-codex)' },
  antigravity: { name: 'Antigravity', short: 'AG', accent: 'var(--a-antigravity)' },
};

// ── STATUS ────────────────────────────────────────────────────────────────
const STATUS = {
  live: { label: 'Running', color: 'var(--live)', cls: 'live' },
  wait: { label: 'Awaiting input', color: 'var(--wait)', cls: 'wait' },
  idle: { label: 'Idle', color: 'var(--idle)', cls: 'idle' },
  done: { label: 'Done', color: 'var(--done)', cls: 'done' },
  err: { label: 'Failed', color: 'var(--err)', cls: 'err' },
  off: { label: 'Stopped', color: 'var(--fg-3)', cls: 'off' },
};

function StatusDot({ status = 'idle', pulse = false }) {
  return <span className={`dot ${status} ${pulse && status === 'live' ? 'pulse' : ''}`} />;
}

function StatusBadge({ status = 'idle', children }) {
  const s = STATUS[status] || STATUS.idle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
      fontFamily: 'var(--mono)', fontSize: '0.6875rem', letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: s.color, padding: '3px 0.4375rem', borderRadius: 4,
      background: `color-mix(in oklab, ${s.color} 12%, transparent)`,
    }}>
      <StatusDot status={status} pulse={status === 'live'} />
      {children || s.label}
    </span>
  );
}

// ── ICON BUTTON ───────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title, active, danger, style }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: '1.625rem', height: '1.625rem', borderRadius: '0.375rem', border: 'none',
      background: active ? 'var(--bg-active)' : 'transparent',
      color: danger ? 'var(--err)' : active ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .12s, color .12s', padding: 0, ...style,
    }} onMouseEnter={(e)=>{ if(!active) { e.currentTarget.style.background='var(--bg-3)'; e.currentTarget.style.color='var(--fg-0)'; }}}
       onMouseLeave={(e)=>{ if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=danger?'var(--err)':'var(--fg-2)'; }}}
    >{children}</button>
  );
}

// ── ICONS (inline 14px stroke) ────────────────────────────────────────────
const Ico = {
  splitH: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 8h11"/></svg>,
  splitV: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M8 2.5v11"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  more: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9"/></svg>,
  expand: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h4v4M7 13H3V9M13 3l-5 5M3 13l5-5"/></svg>,
  diff: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 3v6M5 13a1 1 0 100-2 1 1 0 000 2zM5 5a1 1 0 100-2 1 1 0 000 2zM11 13V7M11 5a1 1 0 100-2 1 1 0 000 2z"/></svg>,
  files: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M3 4h4l1.5 1.5H13V12a1 1 0 01-1 1H3z"/></svg>,
  cpu: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4.5" y="4.5" width="7" height="7" rx="1"/><path d="M6.5 6.5h3v3h-3z" fill="currentColor" stroke="none"/><path d="M6 1v2M10 1v2M6 13v2M10 13v2M1 6h2M1 10h2M13 6h2M13 10h2"/></svg>,
  branch: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 3v10M11 3v3a3 3 0 01-3 3H5"/><circle cx="5" cy="2.5" r="1.3"/><circle cx="11" cy="2.5" r="1.3"/><circle cx="5" cy="13.5" r="1.3"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="7" cy="7" r="4"/><path d="M10 10l3 3"/></svg>,
  // Proper gear with teeth — previous version had a center circle + radial rays
  // that read as a sun/brightness icon, not settings.
  settings: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M8 1.8l1 1.5 1.8-.3.4 1.8 1.6.9-.6 1.7.9 1.6-1.4 1.2.2 1.8-1.8.4-.9 1.6-1.7-.6-1.5.9-1.2-1.4-1.8.2-.4-1.8-1.6-.9.6-1.7-.9-1.6L2.1 6l-.2-1.8 1.8-.4.9-1.6 1.7.6L7.8 2z"/><circle cx="8" cy="8" r="2.1"/></svg>,
  // Sun icon used for the actual theme switcher
  sun: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="2.6"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z"/></svg>,
  // Sidebar collapse / expand
  sidebarL: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10M10 6l-2 2 2 2"/></svg>,
  sidebarR: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10M8 6l2 2-2 2"/></svg>,
  // Terminal / shell glyph
  terminal: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 7l2 1.5L5 10M9 10.5h2.5"/></svg>,
  // Robot / agent pane glyph
  agentPane: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="3" y="5" width="10" height="8" rx="1.5"/><circle cx="6.5" cy="9" r="0.9" fill="currentColor"/><circle cx="9.5" cy="9" r="0.9" fill="currentColor"/><path d="M8 5V3M6.5 13v1.5M9.5 13v1.5"/></svg>,
  bell: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M4 11V7a4 4 0 118 0v4l1.5 1.5h-11L4 11zM6.5 13a1.5 1.5 0 003 0"/></svg>,
  container: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11z"/><path d="M2.5 5L8 7.5M13.5 5L8 7.5M8 7.5v6"/></svg>,
  hub: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="2.5"/><circle cx="3" cy="3" r="1.2"/><circle cx="13" cy="3" r="1.2"/><circle cx="3" cy="13" r="1.2"/><circle cx="13" cy="13" r="1.2"/><path d="M4 4l2 2M12 4l-2 2M4 12l2-2M12 12l-2-2"/></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="0.5"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="0.5"/><rect x="9" y="9" width="4.5" height="4.5" rx="0.5"/></svg>,
  arrowR: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5"/></svg>,
  chevD: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l5 5 5-5"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  plug: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"><path d="M6 3v3M10 3v3M4.5 6h7v3a3.5 3.5 0 11-7 0V6zM8 12.5v2"/></svg>,
  paw: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 12.5C3 11 4.5 9.5 8 9.5s5 1.5 5 3-2 2-5 2-5-1-5-2zM4 6a1.2 1.5 0 102.4 0 1.2 1.5 0 00-2.4 0zM9.6 6a1.2 1.5 0 102.4 0 1.2 1.5 0 00-2.4 0zM6.5 3.5a1 1.3 0 102 0 1 1.3 0 00-2 0z"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>,
  inspect: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"><circle cx="7" cy="7" r="3.5"/><path d="M9.6 9.6L13 13M3.5 7H10M6.5 4.5L4 7l2.5 2.5"/></svg>,
};

// ── APP CHROME (window frame) ─────────────────────────────────────────────
function AppChrome({ children, w = 1440, h = 900, title = 'CodeHub' }) {
  return (
    <div className="ch-root" style={{
      width: w, height: h,
      background: 'var(--bg-1)',
      borderRadius: '0.625rem',
      overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,.5)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* traffic lights bar */}
      <div style={{
        height: '2rem', background: 'var(--bg-0)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', padding: '0 0.75rem', gap: '0.625rem', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: '#3d3d3d' }} />
          <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: '#3d3d3d' }} />
          <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '50%', background: '#3d3d3d' }} />
        </div>
        <div style={{
          flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--fg-2)',
          fontFamily: 'var(--mono)', letterSpacing: 0.3,
        }}>{title}</div>
        <div style={{ width: '2.5rem' }} />
      </div>
      {children}
    </div>
  );
}

// ── LOGO ──────────────────────────────────────────────────────────────────
function Logo({ size = 18, withText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} viewBox="0 0 20 20" aria-label="CodeHub">
        <rect x="1.5" y="1.5" width="17" height="17" rx="4" stroke="var(--fg-0)" strokeWidth="1.4" fill="none"/>
        <path d="M6 7l-2 3 2 3M14 7l2 3-2 3M11 6l-2 8" stroke="var(--fg-0)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {withText && <span style={{ fontFamily: 'var(--sans)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.01em' }}>CodeHub</span>}
    </div>
  );
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────
function Spark({ data, w = 60, h = 16, color = 'var(--fg-1)', fill = false }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return [x, y];
  });
  const path = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} opacity="0.15" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── KEY-VALUE ROW ─────────────────────────────────────────────────────────
function KV({ k, v, mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', padding: '0.3125rem 0' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--fg-2)' }}>{k}</span>
      <span style={{ fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: '0.75rem', color: 'var(--fg-0)' }}>{v}</span>
    </div>
  );
}

// ── TAG ──────────────────────────────────────────────────────────────────
function Tag({ children, color, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--mono)', fontSize: '0.6875rem', letterSpacing: '0.03em',
      color: color || 'var(--fg-1)',
      background: color ? `color-mix(in oklab, ${color} 14%, transparent)` : 'var(--bg-3)',
      border: `1px solid ${color ? `color-mix(in oklab, ${color} 35%, transparent)` : 'var(--bd)'}`,
      padding: '2px 0.375rem', borderRadius: 4, ...style,
    }}>{children}</span>
  );
}

// ── ACCOUNTS ──────────────────────────────────────────────────────────────
// Mock accounts across the 3 agents. Used in spawn dialog, sidebar, settings.
const ACCOUNTS = {
  cm:  { name: 'm.kim',        short: 'MK', tier: 'Claude Max',     agent: 'claude', usage: 0.58, limit: '5× Pro',  plan: 'personal' },
  cw:  { name: 'm.kim · work', short: 'WK', tier: 'Claude Team',    agent: 'claude', usage: 0.21, limit: 'shared',  plan: 'work' },
  ca:  { name: 'aurora-bot',   short: 'AB', tier: 'API · Anthropic', agent: 'claude', usage: 0.04, limit: '$200/mo', plan: 'api' },
  cx:  { name: 'm.kim',        short: 'MK', tier: 'OpenAI Plus',    agent: 'codex',  usage: 0.31, limit: '10× free',plan: 'personal' },
  cxa: { name: 'aurora-bot',   short: 'AB', tier: 'API · OpenAI',   agent: 'codex',  usage: 0.12, limit: '$100/mo', plan: 'api' },
  ag:  { name: 'm.kim',        short: 'MK', tier: 'Google AI',      agent: 'antigravity', usage: 0.18, limit: 'free tier', plan: 'personal' },
};

function AccountAvatar({ id, size = 18, ring }) {
  const a = ACCOUNTS[id] || ACCOUNTS.cm;
  // Hash the id deterministically to a hue so any two accounts get different colors,
  // unless the account explicitly defines `tone` (override).
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const tone = a.tone || `oklch(0.72 0.13 ${hue})`;
  return (
    <span style={{
      width: size, height: size, borderRadius: size / 3.5,
      background: `linear-gradient(135deg, ${tone}, color-mix(in oklab, ${tone} 55%, var(--bg-0)))`,
      color: 'var(--bg-0)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--mono)', fontSize: size * 0.42, fontWeight: 600,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 1.5px var(--bg-2), 0 0 0 2.5px ${tone}` : 'none',
      letterSpacing: '-0.02em',
    }}>{a.short}</span>
  );
}

// ── CONTEXT GAUGE ─────────────────────────────────────────────────────────
// Inline label + horizontal bar + tabular values.
function ContextGauge({ used, max, label = 'ctx', width = 110 }) {
  const pct = Math.min(1, used / max);
  const color = pct > 0.85 ? 'var(--err)' : pct > 0.7 ? 'var(--wait)' : 'var(--fg-1)';
  // Structure mirrors MetricStat exactly so the label + value share a baseline
  // with sibling stats. The bar wrapper is height: 0 so it contributes nothing
  // to baseline calculation — the visible bar is absolute-positioned inside,
  // offset upward so its center lands near the x-height of the adjacent text.
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: '0.375rem',
      height: '1.125rem', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <span className="mono" style={{ fontSize: '0.5rem', color: 'var(--fg-3)', fontWeight: 400 }}>{label}</span>
      <span style={{
        display: 'inline-block', position: 'relative',
        width, height: 0,
      }}>
        <span style={{
          position: 'absolute', left: 0, right: 0,
          bottom: '1.5px',
          height: '0.25rem', borderRadius: '62.4375rem',
          background: 'var(--bg-3)', overflow: 'hidden',
        }}>
          <span style={{
            display: 'block', width: `${pct * 100}%`, height: '100%',
            background: color, borderRadius: 'inherit',
          }} />
        </span>
      </span>
      <span className="mono tnum" style={{ fontSize: '0.5625rem', color: 'var(--fg-1)', fontWeight: 500 }}>
        {formatK(used)}<span style={{ color: 'var(--fg-3)', fontWeight: 400 }}> / {formatK(max)}</span>
      </span>
    </span>
  );
}

function formatK(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// ── METRIC STAT ──────────────────────────────────────────────────────────
// Inline: `<dim label>  <value>` on a single baseline. Tabular nums keep
// rows aligned in dense meta strips.
function MetricStat({ label, value, delta, deltaTone, mono = true, spend }) {
  let valueColor = 'var(--fg-0)';
  if (spend === 'warn') valueColor = 'var(--spend-warn)';
  else if (spend === 'over') valueColor = 'var(--spend-over)';

  const dtone = deltaTone === 'up' ? 'var(--live)' : deltaTone === 'down' ? 'var(--err)' : 'var(--fg-2)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: '0.375rem',
      height: '1.125rem', lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: '0.5rem',
        color: 'var(--fg-3)', fontWeight: 400,
      }}>{label}</span>
      <span className={mono ? 'mono tnum' : 'tnum'} style={{
        fontSize: '0.5625rem', color: valueColor, fontWeight: 500,
      }}>{value}</span>
      {delta && (
        <span className="mono" style={{ fontSize: '0.5rem', color: dtone, marginLeft: -2 }}>{delta}</span>
      )}
    </span>
  );
}

// ── SIDEBAR ATOMS ──────────────────────────────────────────────────────
function RailIcon({ children, active, badge, title }) {
  return (
    <div title={title} style={{
      width: '2rem', height: '2rem', borderRadius: '0.4375rem', marginBottom: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--bg-3)' : 'transparent',
      color: active ? 'var(--fg-0)' : 'var(--fg-2)',
      cursor: 'pointer', position: 'relative',
    }}>
      {children}
      {badge && (
        <span style={{
          position: 'absolute', top: -2, right: -2,
          fontFamily: 'var(--mono)', fontSize: '0.625rem', fontWeight: 600,
          background: 'var(--fg-0)', color: 'var(--bg-0)',
          borderRadius: '0.4375rem', padding: '1px 4px', minWidth: '0.875rem', textAlign: 'center',
          border: '1.5px solid var(--bg-0)',
        }}>{badge}</span>
      )}
    </div>
  );
}

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
      }} title={`Container ${id}`}>
        <span style={{ display: 'inline-flex', color: 'var(--fg-2)' }}>{Ico.container}</span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
          {repo}
        </span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }} title={`${cpu}% CPU`}>{cpu}%</span>
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
    <div className={`side-item ${active ? 'active' : ''}`} title={`${name} — ${task}`} style={{ alignItems: 'flex-start', padding: '0.5rem 0.625rem', opacity: dim ? 0.55 : 1 }}>
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
            <span title="Awaiting input" style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '0.625rem', padding: '1px 0.3125rem', background: 'var(--wait)', color: 'var(--bg-0)', borderRadius: '0.5rem', fontWeight: 600 }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</div>
      </div>
    </div>
  );
}

// ── APP SIDEBAR ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'hub',          label: 'Hub',          icon: 'hub' },
  { id: 'dashboard',    label: 'Dashboard',    icon: 'grid', badge: '5' },
  { id: 'workspaces',   label: 'Workspaces',   icon: 'container' },
  { id: 'usage',        label: 'Usage',        icon: 'cpu' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
];
const NAV_BOTTOM = [
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'settings',      label: 'Settings',      icon: 'settings' },
];

function SidebarNavItem({ item, active }) {
  return (
    <div className={`side-item ${active ? 'active' : ''}`} title={item.label}>
      {Ico[item.icon] || Ico.hub}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && <span className="mono" style={{ color: 'var(--fg-2)', fontSize: '0.6875rem' }}>{item.badge}</span>}
    </div>
  );
}

// ── WORKSPACE SIDE ROW ──────────────────────────────────────────────────────
// Compact workspace card in the sidebar. Header (name + repos + container
// size) plus, when open, agents grouped by their Group name so the sidebar
// mirrors the hub's groups bar.
function WorkspaceSideRow({ workspaceId, name, repos, container, agents, open, idle }) {
  const onOpen = () => workspaceId && window.Store.openWorkspace(workspaceId);
  const byGroup = (agents || []).reduce((acc, a) => {
    (acc[a.group || 'Default'] = acc[a.group || 'Default'] || []).push(a);
    return acc;
  }, {});
  const groupNames = Object.keys(byGroup);
  return (
    <div style={{
      borderRadius: '0.4375rem', padding: 4,
      background: open ? 'color-mix(in oklab, var(--bg-2) 60%, transparent)' : 'transparent',
      border: `1px solid ${open ? 'var(--bd-soft)' : 'transparent'}`,
      opacity: idle ? 0.55 : 1,
    }}>
      <div onClick={onOpen} style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.25rem 0.375rem 0.375rem', cursor: 'pointer',
        borderBottom: open ? '1px solid var(--bd-soft)' : 'none',
        marginBottom: open ? 4 : 0,
      }} title={`${repos.length} repo${repos.length === 1 ? '' : 's'} · ${container} container`}>
        <span style={{ display: 'inline-flex', color: open ? 'var(--pri)' : 'var(--fg-2)' }}>
          {open ? Ico.hub : Ico.container}
        </span>
        <span className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
          {name}
        </span>
        <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{container}</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.625rem', color: 'var(--fg-3)', padding: '0 0.375rem 4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        {repos.map((r, i) => (
          <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {i === 0 && Ico.branch}{r}{i < repos.length - 1 && <span style={{ color: 'var(--fg-4)' }}>·</span>}
          </span>
        ))}
      </div>
      {open && groupNames.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {groupNames.map((g) => (
            <div key={g}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '0.25rem 0.5rem 0.125rem',
                fontFamily: 'var(--mono)', fontSize: '0.5938rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--fg-3)',
              }}>
                <span>{g}</span>
                <span style={{ color: 'var(--fg-4)' }}>· {byGroup[g].length}</span>
              </div>
              {byGroup[g].map((a, i) => (
                <SessionRow key={i} agent={a.agent}
                  name={a.agent === 'claude' ? 'Claude' : a.agent === 'codex' ? 'Codex' : 'Antigravity'}
                  task={a.task} status={a.status} active={a.active}
                  badge={a.badge} account={a.account} pinned={a.pinned} />
              ))}
            </div>
          ))}
        </div>
      )}
      {open && groupNames.length === 0 && (
        <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.625rem', color: 'var(--fg-3)', fontFamily: 'var(--mono)' }}>
          no agents yet
        </div>
      )}
    </div>
  );
}

function AppSidebar({ active = 'hub', empty = false }) {
  return (
    <>
      {/* Expanded sidebar — 264px */}
      <aside className="ch-sidebar-expanded" style={{
        width: '16.5rem', flexShrink: 0,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--bd-soft)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '0.75rem 0.875rem 0.625rem', borderBottom: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center' }}>
          <Logo />
          <span style={{ flex: 1 }} />
          <IconBtn title="Collapse sidebar (⌘B)">{Ico.sidebarL}</IconBtn>
        </div>

        <div style={{
          padding: '0.625rem 0.625rem 0.375rem', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <button className="btn ghost" title="Search agents (⌘K)" style={{ justifyContent: 'space-between', width: '100%', display: 'none' }} disabled={empty}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{Ico.search}Search agents</span>
            <span style={{ display: 'flex', gap: 2 }}><span className="kbd">⌘</span><span className="kbd">K</span></span>
          </button>
        </div>

        <div style={{ padding: '0.625rem 0.625rem 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 0.375rem' }}>
            <span className="lbl">Views</span>
            <span className="mono" title="Top-level views in the app" style={{ fontSize: '0.625rem', color: 'var(--fg-3)' }}>{NAV_ITEMS.length + NAV_BOTTOM.length}</span>
          </div>
          {NAV_ITEMS.map((n) => <SidebarNavItem key={n.id} item={n} active={active === n.id} />)}
        </div>

        <div style={{ flex: 1, padding: '0.75rem 0.625rem 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 0.5rem' }}>
            <span className="lbl">Workspaces · {empty ? 0 : 4}</span>
            {!empty && <IconBtn title="New workspace (⌘⇧N)">{Ico.plus}</IconBtn>}
          </div>
          {empty ? (
            <div style={{
              padding: '1.25rem 0.75rem', textAlign: 'center',
              border: '1px dashed var(--bd)', borderRadius: '0.5rem',
              fontSize: '0.75rem', color: 'var(--fg-2)', lineHeight: 1.55,
            }}>
              No workspaces yet.<br/>
              <span className="mono" style={{ color: 'var(--fg-3)' }}>⌘⇧N</span> to create one.
            </div>
          ) : (
            <div className="scroll" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {window.useStore().workspaces.map((ws) => (
                <WorkspaceSideRow key={ws.id} workspaceId={ws.id} name={ws.name}
                  repos={ws.repos.map((r) => r.name)} container={ws.containerSize}
                  agents={ws.groups.flatMap((g) => g.panes.filter((p) => p.kind === 'agent').map((p) => ({
                    agent: p.agent, group: g.name,
                    task: p.repo || 'workspace root',
                    status: p.status, account: 'cm',
                    active: ws.id === window.useStore().activeWorkspaceId,
                  })))}
                  open={ws.id === window.useStore().activeWorkspaceId} />
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '0.625rem 0.75rem', borderTop: '1px solid var(--bd-soft)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '1.375rem', height: '1.375rem', borderRadius: '0.3125rem', background: 'linear-gradient(135deg, oklch(0.7 0.13 30), oklch(0.6 0.13 280))', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--fg-0)' }}>m.kim</div>
            <div className="mono" style={{ fontSize: '0.6875rem', color: 'var(--fg-2)' }}>{empty ? 'first run · 2 keys missing' : 'Free · 12% used'}</div>
          </div>
          <IconBtn title="Account settings">{Ico.settings}</IconBtn>
        </div>
      </aside>

      {/* Collapsed rail — 52px */}
      <aside className="ch-sidebar-rail-fallback" style={{
        width: '3.25rem', flexShrink: 0,
        background: 'var(--bg-0)',
        borderRight: '1px solid var(--bd-soft)',
        flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0 0.625rem',
      }}>
        <div style={{ paddingBottom: '0.625rem', marginBottom: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Logo size={20} withText={false} />
        </div>
        <RailIcon title="Expand sidebar (⌘B)">{Ico.sidebarR}</RailIcon>
        <div style={{ height: '0.5rem' }} />
        {NAV_ITEMS.map((n) => (
          <RailIcon key={n.id} active={active === n.id} badge={n.badge} title={n.label}>{Ico[n.icon] || Ico.hub}</RailIcon>
        ))}
        <div style={{ flex: 1 }} />
        {NAV_BOTTOM.map((n) => (
          <RailIcon key={n.id} active={active === n.id} title={n.label}>{Ico[n.icon] || Ico.bell}</RailIcon>
        ))}
      </aside>
    </>
  );
}

// Canonical "New agent" CTA. The single source of truth for this button so
// every toolbar and sidebar shows it identically. variant="toolbar" (default)
// is a tinted pri button; variant="block" stretches full-width and adds the
// kbd hint on the right; variant="solid" is the strongest fill (empty state).
function NewAgentBtn({ variant = 'toolbar', kbd = true, label = 'New agent', className = '' }) {
  if (variant === 'block') {
    return (
      <button className={`btn pri solid sm ${className}`}
        title="Start a new agent session (⌘N)"
        style={{ justifyContent: 'space-between', width: '100%' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{Ico.plus}{label}</span>
        {kbd && <span style={{ display: 'flex', gap: 2 }}><span className="kbd">⌘</span><span className="kbd">N</span></span>}
      </button>
    );
  }
  if (variant === 'solid') {
    return (
      <button className={`btn pri solid sm ${className}`}
        title="Start a new agent session (⌘N)">
        {Ico.plus}{label}{kbd && <span className="kbd">⌘N</span>}
      </button>
    );
  }
  // toolbar — tinted button suitable for crowded headers
  return (
    <button className={`btn pri sm ${className}`}
      title="Start a new agent session (⌘N)">
      {Ico.plus}{label}{kbd && <span className="kbd">⌘N</span>}
    </button>
  );
}

// ── SPAWN SPLIT BUTTON ──────────────────────────────────────────────────────
// One button that replaces the trio "Split right + Split down + New agent" in
// the bottom action bar. Two halves:
//   ▸ left half  — primary CTA, spawns a new agent into the focused pane's
//                  default split direction (right). ⌘N also fires this.
//   ▸ right half — chevron that opens a tiny menu of placement options
//                  (Split right ⌘\, Split down ⌘⇧\, In new group, In new tab).
// This collapses three confusing buttons (where does my new agent go?) into
// one prominent CTA with explicit placement when the user wants control.
function SpawnSplitBtn({ open }) {
  return (
    <div style={{
      position: 'relative', display: 'inline-flex',
      borderRadius: 4, overflow: 'visible',
    }}>
      <button className="btn pri solid sm"
        title="New agent — split right (⌘N)"
        style={{
          borderTopRightRadius: 0, borderBottomRightRadius: 0,
          paddingRight: '0.5rem',
        }}>
        {Ico.plus}New agent
        <span className="kbd">⌘N</span>
      </button>
      <button className="btn pri solid sm"
        title="Placement options"
        aria-expanded={!!open}
        style={{
          borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
          padding: '0 0.375rem', minWidth: 0,
          borderLeft: '1px solid color-mix(in oklab, var(--bg-0) 22%, transparent)',
          ...(open && { background: 'color-mix(in oklab, var(--bg-0) 14%, var(--pri))' }),
        }}>
        {Ico.chevD}
      </button>
      {open && <SpawnPlacementMenu />}
    </div>
  );
}

// Tiny popover anchored to the SpawnSplitBtn chevron. Renders inline so
// state artboards can show the "open" affordance; pass `open` to <SpawnSplitBtn>.
function SpawnPlacementMenu() {
  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 0.4375rem)', right: 0,
      minWidth: '15rem', zIndex: 30,
      background: 'var(--bg-2)', border: '1px solid var(--bd)', borderRadius: 6,
      boxShadow: '0 8px 24px rgba(0,0,0,0.45)', padding: '0.3125rem',
      fontSize: '0.8125rem', color: 'var(--fg-1)',
    }}>
      <div style={{ padding: '0.25rem 0.5rem', display: 'flex', borderBottom: '1px solid var(--bd-soft)', marginBottom: 4 }}>
        <span className="lbl" style={{ fontSize: '0.625rem' }}>Placement</span>
      </div>
      <SpawnMenuRow icon={Ico.splitV} label="Split right"    kbd="⌘\" def />
      <SpawnMenuRow icon={Ico.splitH} label="Split down"     kbd="⌘⇧\" />
      <div style={{ height: 1, background: 'var(--bd-soft)', margin: '4px 0' }} />
      <SpawnMenuRow icon={Ico.plus}   label="Open in new group" kbd="⌘G" />
      <SpawnMenuRow icon={Ico.plus}   label="Open in new tab"   kbd="⌘⇧T" />
    </div>
  );
}

function SpawnMenuRow({ icon, label, kbd, def }) {
  return (
    <div className="ctx-row" style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.3125rem 0.5rem', borderRadius: 4, cursor: 'pointer',
    }}>
      <span style={{ display: 'inline-flex', color: 'var(--fg-2)', width: 14 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {def && <span className="mono" style={{ fontSize: '0.625rem', color: 'var(--pri)' }}>default</span>}
      <span className="kbd">{kbd}</span>
    </div>
  );
}

Object.assign(window, {
  AgentGlyph, AGENT_META, STATUS, StatusDot, StatusBadge,
  IconBtn, Ico, AppChrome, Logo, Spark, KV, Tag,
  ACCOUNTS, AccountAvatar, ContextGauge, formatK, MetricStat,
  RailIcon, ContainerGroup, SessionRow, WorkspaceSideRow, AppSidebar, NewAgentBtn,
  SpawnSplitBtn, SpawnPlacementMenu,
});
