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
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: s.color, padding: '3px 7px', borderRadius: 4,
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
      width: 26, height: 26, borderRadius: 6, border: 'none',
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
  settings: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4"/></svg>,
  bell: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M4 11V7a4 4 0 118 0v4l1.5 1.5h-11L4 11zM6.5 13a1.5 1.5 0 003 0"/></svg>,
  container: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11z"/><path d="M2.5 5L8 7.5M13.5 5L8 7.5M8 7.5v6"/></svg>,
  hub: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="2.5"/><circle cx="3" cy="3" r="1.2"/><circle cx="13" cy="3" r="1.2"/><circle cx="3" cy="13" r="1.2"/><circle cx="13" cy="13" r="1.2"/><path d="M4 4l2 2M12 4l-2 2M4 12l2-2M12 12l-2-2"/></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="0.5"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="0.5"/><rect x="9" y="9" width="4.5" height="4.5" rx="0.5"/></svg>,
  arrowR: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5"/></svg>,
  chevD: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l5 5 5-5"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  paw: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 12.5C3 11 4.5 9.5 8 9.5s5 1.5 5 3-2 2-5 2-5-1-5-2zM4 6a1.2 1.5 0 102.4 0 1.2 1.5 0 00-2.4 0zM9.6 6a1.2 1.5 0 102.4 0 1.2 1.5 0 00-2.4 0zM6.5 3.5a1 1.3 0 102 0 1 1.3 0 00-2 0z"/></svg>,
};

// ── APP CHROME (window frame) ─────────────────────────────────────────────
function AppChrome({ children, w = 1440, h = 900, title = 'CodeHub' }) {
  return (
    <div className="ch-root" style={{
      width: w, height: h,
      background: 'var(--bg-1)',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,.5)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* traffic lights bar */}
      <div style={{
        height: 32, background: 'var(--bg-0)', borderBottom: '1px solid var(--bd-soft)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3d3d3d' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3d3d3d' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3d3d3d' }} />
        </div>
        <div style={{
          flex: 1, textAlign: 'center', fontSize: 11.5, color: 'var(--fg-2)',
          fontFamily: 'var(--mono)', letterSpacing: 0.3,
        }}>{title}</div>
        <div style={{ width: 40 }} />
      </div>
      {children}
    </div>
  );
}

// ── LOGO ──────────────────────────────────────────────────────────────────
function Logo({ size = 18, withText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 20 20" aria-label="CodeHub">
        <rect x="1.5" y="1.5" width="17" height="17" rx="4" stroke="var(--fg-0)" strokeWidth="1.4" fill="none"/>
        <path d="M6 7l-2 3 2 3M14 7l2 3-2 3M11 6l-2 8" stroke="var(--fg-0)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {withText && <span style={{ fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>CodeHub</span>}
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '5px 0' }}>
      <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{k}</span>
      <span style={{ fontFamily: mono ? 'var(--mono)' : 'var(--sans)', fontSize: 12, color: 'var(--fg-0)' }}>{v}</span>
    </div>
  );
}

// ── TAG ──────────────────────────────────────────────────────────────────
function Tag({ children, color, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.03em',
      color: color || 'var(--fg-1)',
      background: color ? `color-mix(in oklab, ${color} 14%, transparent)` : 'var(--bg-3)',
      border: `1px solid ${color ? `color-mix(in oklab, ${color} 35%, transparent)` : 'var(--bd)'}`,
      padding: '2px 6px', borderRadius: 4, ...style,
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
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 18 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)' }}>{label}</span>
      <span style={{
        width, height: 6, borderRadius: 999,
        background: 'var(--bg-3)', overflow: 'hidden', position: 'relative',
      }}>
        <span style={{
          display: 'block', width: `${pct * 100}%`, height: '100%',
          background: color, borderRadius: 'inherit',
        }} />
      </span>
      <span className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-0)', fontWeight: 500 }}>
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
      display: 'inline-flex', alignItems: 'baseline', gap: 6,
      height: 18, lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 11,
        color: 'var(--fg-3)', fontWeight: 400,
      }}>{label}</span>
      <span className={mono ? 'mono tnum' : 'tnum'} style={{
        fontSize: 12.5, color: valueColor, fontWeight: 500,
      }}>{value}</span>
      {delta && (
        <span className="mono" style={{ fontSize: 10.5, color: dtone, marginLeft: -2 }}>{delta}</span>
      )}
    </span>
  );
}

Object.assign(window, {
  AgentGlyph, AGENT_META, STATUS, StatusDot, StatusBadge,
  IconBtn, Ico, AppChrome, Logo, Spark, KV, Tag,
  ACCOUNTS, AccountAvatar, ContextGauge, formatK, MetricStat,
});
