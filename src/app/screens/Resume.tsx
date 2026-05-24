/**
 * Resume — library of past agent conversations read from their on-disk session
 * transcripts. Two real sources, merged + grouped by recency:
 *   - Claude Code: claude_sessions, from the on-disk .claude project jsonl files.
 *   - Codex: codex_sessions, from the on-disk .codex rollout jsonl files.
 * Each row is a REAL transcript: its title is the conversation's own first user
 * prompt / ai-title, its branch / turn-count / timestamps are recorded facts,
 * never guessed. Antigravity persists no readable history, so it is omitted.
 *
 * The list shape (ClaudeSession / CodexSession) carries turns + model + branch +
 * timing only — NOT cost or edit counts (those live in the per-id session-usage
 * reads and would cost one docker exec per row to fetch). So this list shows
 * what each row factually carries; cost/edits are surfaced in SessionDetail, not
 * fabricated here.
 *
 * Resume action wires only to what the backend supports (docker.rs:710):
 *   - Claude reopens the exact conversation via newPlate's resume arg (true
 *     restore: the backend runs claude with its --resume flag).
 *   - Codex's createSession has no --resume path, so we honestly spawn a FRESH
 *     Codex session (labelled "New Codex") rather than pretend to restore it.
 *     See the F-DATA-B report for the flagged store/backend gap.
 */
import { useEffect, useMemo, useState } from "react";
import { AgentGlyph } from "../components/primitives/AgentGlyph";
import { Ico } from "../components/primitives/icons";
import type { AgentCli, ClaudeSession, CodexSession } from "../lib/ipc";
import { ipc } from "../lib/ipc";
import { useStore } from "../lib/store";
import { Button } from "../ui/button";

// A merged, agent-tagged session row. Both source shapes share these fields, so
// the row renderer is agent-agnostic; only the resume action branches on `agent`.
interface ResumeRow {
  agent: Extract<AgentCli, "claude" | "codex">;
  id: string;
  title: string;
  branch: string | null;
  lastActive: string;
  turns: number;
  model: string | null;
}

type AgentFilter = "all" | "claude" | "codex";

export function Resume() {
  const status = useStore((s) => s.status);
  const newPlate = useStore((s) => s.newPlate);
  const setView = useStore((s) => s.setView);
  const state = status?.state ?? "missing";
  const running = state === "running";

  // Both readers polled together (~12s): transcripts appear/grow as agents work.
  // Alive-guarded; a failed read resolves that source to [] (honest — "none"),
  // null only while the first read is still in flight.
  const [claude, setClaude] = useState<ClaudeSession[] | null>(null);
  const [codex, setCodex] = useState<CodexSession[] | null>(null);
  const [resuming, setResuming] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");

  useEffect(() => {
    if (!running) {
      setClaude(null);
      setCodex(null);
      return;
    }
    let alive = true;
    const tick = () => {
      ipc
        .claudeSessions()
        .then((s) => alive && setClaude(s))
        .catch(() => alive && setClaude([]));
      ipc
        .codexSessions()
        .then((s) => alive && setCodex(s))
        .catch(() => alive && setCodex([]));
    };
    tick();
    const h = setInterval(tick, 12000);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running]);

  // Merge + sort newest-first once either source resolves. Counts per agent are
  // computed from the full (unfiltered) merge so the filter chips read true.
  const loading = claude === null || codex === null;
  const all: ResumeRow[] = useMemo(() => {
    const rows: ResumeRow[] = [];
    for (const s of claude ?? []) rows.push({ agent: "claude", ...pick(s) });
    for (const s of codex ?? []) rows.push({ agent: "codex", ...pick(s) });
    rows.sort((a, b) => Date.parse(b.lastActive) - Date.parse(a.lastActive));
    return rows;
  }, [claude, codex]);

  const counts = useMemo(
    () => ({
      all: all.length,
      claude: all.filter((r) => r.agent === "claude").length,
      codex: all.filter((r) => r.agent === "codex").length,
    }),
    [all],
  );

  const rows = agentFilter === "all" ? all : all.filter((r) => r.agent === agentFilter);
  const groups = useMemo(() => groupByRecency(rows), [rows]);

  // Claude → true restore via `--resume`. Codex → no backend resume path, so spawn
  // a fresh Codex session honestly (not a restore). Both jump to the Hub after.
  const resume = (row: ResumeRow) => {
    setResuming(row.id);
    const spawn =
      row.agent === "claude"
        ? newPlate("claude", "standard", row.id)
        : newPlate("codex", "standard");
    spawn
      .then(() => setView("hub"))
      .catch(console.warn)
      .finally(() => setResuming(null));
  };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        minWidth: 0,
        color: "var(--fg-1)",
      }}
    >
      {/* header */}
      <div style={{ padding: "20px 28px 14px", borderBottom: "1px solid var(--bd-soft)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Resume
          </h1>
          <span className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {loading
              ? `runtime ${state}`
              : `${counts.all} past session${counts.all === 1 ? "" : "s"}`}
          </span>
        </div>
        <p className="mono" style={{ margin: "6px 0 0", fontSize: 11, color: "var(--fg-3)" }}>
          Past Claude Code &amp; Codex conversations from on-disk transcripts. Resume reopens a
          Claude conversation with its full history; Codex has no on-disk resume, so it starts
          fresh.
        </p>

        {/* agent filter — real per-agent counts from the merged list */}
        {!loading && counts.all > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <FilterChip
              active={agentFilter === "all"}
              onClick={() => setAgentFilter("all")}
              label={`All · ${counts.all}`}
            />
            {counts.claude > 0 && (
              <FilterChip
                active={agentFilter === "claude"}
                onClick={() => setAgentFilter("claude")}
                agent="claude"
                label={`Claude · ${counts.claude}`}
              />
            )}
            {counts.codex > 0 && (
              <FilterChip
                active={agentFilter === "codex"}
                onClick={() => setAgentFilter("codex")}
                agent="codex"
                label={`Codex · ${counts.codex}`}
              />
            )}
          </div>
        )}
      </div>

      {/* list */}
      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {!running ? (
          <Note>Runtime not running — no transcripts to read.</Note>
        ) : loading ? (
          <Note>Reading session transcripts…</Note>
        ) : counts.all === 0 ? (
          <Note>
            No past Claude or Codex conversations yet. Sessions appear here once an agent has run.
          </Note>
        ) : rows.length === 0 ? (
          <Note>No sessions match this filter.</Note>
        ) : (
          groups.map((g) => (
            <DateGroup key={g.label} label={g.label}>
              {g.rows.map((row) => (
                <SessionRow
                  key={`${row.agent}-${row.id}`}
                  row={row}
                  busy={resuming === row.id}
                  disabled={resuming !== null}
                  onResume={() => resume(row)}
                />
              ))}
            </DateGroup>
          ))
        )}
      </div>
    </main>
  );
}

// Normalize either source shape into the shared row fields.
function pick(s: ClaudeSession | CodexSession) {
  return {
    id: s.id,
    title: s.title,
    branch: s.branch,
    lastActive: s.lastActive,
    turns: s.turns,
    model: s.model,
  };
}

function FilterChip({
  active,
  onClick,
  label,
  agent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  agent?: "claude" | "codex";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 5,
        border: "1px solid var(--bd-soft)",
        background: active ? "var(--bg-3)" : "transparent",
        color: active ? "var(--fg-0)" : "var(--fg-2)",
        cursor: "pointer",
        fontSize: 11,
      }}
    >
      {agent && <AgentGlyph agent={agent} size={10} color={`var(--a-${agent})`} />}
      {label}
    </button>
  );
}

function DateGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span className="lbl" style={{ fontSize: 10.5 }}>
          {label}
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--bd-soft)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function SessionRow({
  row,
  busy,
  disabled,
  onResume,
}: {
  row: ResumeRow;
  busy: boolean;
  disabled: boolean;
  onResume: () => void;
}) {
  const age = fmtAge(row.lastActive);
  const accent = `var(--a-${row.agent})`;
  // Codex can't truly restore (no backend `--resume`), so the action is honestly
  // labelled "New Codex" — it spawns a fresh session, it does not reopen this one.
  const action = row.agent === "claude" ? "Resume" : "New Codex";
  return (
    <div className="ch-card" style={{ padding: 0, display: "flex", overflow: "hidden" }}>
      <span style={{ width: 3, background: accent, flexShrink: 0 }} />

      {/* identity */}
      <div
        style={{
          flex: "0 0 220px",
          padding: "12px 14px",
          borderRight: "1px solid var(--bd-soft)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AgentGlyph agent={row.agent} size={13} color={accent} />
          <span className="mono" style={{ fontSize: 12, color: "var(--fg-0)", fontWeight: 500 }}>
            {row.agent === "claude" ? "Claude Code" : "Codex"}
          </span>
        </div>
        {row.branch && (
          <div
            className="mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10.5,
              color: "var(--fg-2)",
              minWidth: 0,
            }}
          >
            <span style={{ display: "inline-flex", color: "var(--fg-3)" }}>{Ico.branch}</span>
            <span
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={row.branch}
            >
              {row.branch}
            </span>
          </div>
        )}
        <div
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10.5,
            color: "var(--fg-3)",
          }}
        >
          {age && <span>{age}</span>}
          <span
            className="tnum"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={row.id}
          >
            · {row.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* content */}
      <div
        style={{
          flex: 1,
          padding: "12px 16px",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--fg-0)",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={row.title}
        >
          {row.title}
        </div>
        <div
          className="mono tnum"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 11,
            color: "var(--fg-2)",
          }}
        >
          <span>
            turns <span style={{ color: "var(--fg-1)" }}>{row.turns}</span>
          </span>
          {row.model && (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--fg-2)",
              }}
              title={row.model}
            >
              {row.model}
            </span>
          )}
        </div>
      </div>

      {/* action */}
      <div
        style={{
          flex: "0 0 150px",
          padding: "12px 14px",
          borderLeft: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          size="sm"
          variant={row.agent === "claude" ? "default" : "outline"}
          onClick={onResume}
          disabled={disabled}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {busy ? "Opening…" : action}
        </Button>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{ padding: "40px 16px", textAlign: "center", fontSize: 12, color: "var(--fg-3)" }}
    >
      {children}
    </div>
  );
}

// Bucket rows into recency groups, preserving the newest-first order within each.
// Buckets are derived from the row's own lastActive timestamp — no fake dates.
function groupByRecency(rows: ResumeRow[]): { label: string; rows: ResumeRow[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 7 * 86_400_000;

  const buckets: { label: string; rows: ResumeRow[] }[] = [
    { label: "Today", rows: [] },
    { label: "Yesterday", rows: [] },
    { label: "Earlier this week", rows: [] },
    { label: "Older", rows: [] },
  ];
  for (const r of rows) {
    const t = Date.parse(r.lastActive);
    if (Number.isNaN(t)) {
      buckets[3].rows.push(r);
    } else if (t >= startOfToday) {
      buckets[0].rows.push(r);
    } else if (t >= startOfYesterday) {
      buckets[1].rows.push(r);
    } else if (t >= startOfWeek) {
      buckets[2].rows.push(r);
    } else {
      buckets[3].rows.push(r);
    }
  }
  return buckets.filter((b) => b.rows.length > 0);
}

// Compact relative age from an RFC3339 timestamp: "just now" / "12m ago" / "3h
// ago" / "2d ago". Returns null when the timestamp is missing or unparseable, so
// the row simply omits the age rather than showing a bogus one.
function fmtAge(iso: string): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const secs = Math.floor((Date.now() - t) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}
