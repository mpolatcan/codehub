/**
 * Usage — real token analytics read from Claude Code's on-disk session
 * transcripts ($CLAUDE_CONFIG_DIR/projects/**\/*.jsonl, via claude_usage).
 *
 * Honesty contract: every TOKEN, TURN and SESSION count here is factual — summed
 * straight from the transcripts' `usage` blocks. The COST is the one estimate:
 * tokens × a published per-model rate table (surfaced in the footer, dated), not
 * a billed figure — it is always labelled "estimated". Tokens from models with
 * no rate entry are counted but excluded from the estimate and called out.
 *
 * Only Claude Code persists these transcripts today; Codex/Antigravity have no
 * comparable on-disk turn data, so this view is Claude-only (stated in the UI).
 */
import { Ico } from "@/app/components/primitives/icons";
import { type ClaudeUsage, ipc } from "@/app/lib/ipc";
import { useLauncher } from "@/app/lib/launcher";
import { useStore } from "@/app/lib/store";
import { Button } from "@/app/ui/button";
import { useEffect, useState } from "react";

export function Usage() {
  const status = useStore((s) => s.status);
  const openLaunch = useLauncher((s) => s.open);
  const state = status?.state ?? "missing";
  const running = state === "running";

  // One-shot poll (~10s); transcripts grow as agents work. Alive-guarded, same
  // contract as the other screens — a failed read clears to null (honest note).
  const [usage, setUsage] = useState<ClaudeUsage | null>(null);
  useEffect(() => {
    if (!running) {
      setUsage(null);
      return;
    }
    let alive = true;
    const tick = () => {
      ipc
        .claudeUsage()
        .then((u) => alive && setUsage(u))
        .catch(() => alive && setUsage(null));
    };
    tick();
    const h = setInterval(tick, 10000);
    return () => {
      alive = false;
      clearInterval(h);
    };
  }, [running]);

  const empty = usage !== null && usage.turns === 0;

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
      <div style={{ padding: "20px 28px 14px", borderBottom: "1px solid var(--bd-soft)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Usage
          </h1>
          <span className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
            {usage ? `${usage.sessions} sessions · ${usage.turns} turns` : `runtime ${state}`}
          </span>
          <span style={{ flex: 1 }} />
          <Button size="sm" onClick={() => openLaunch("newtab")}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {Ico.plus}New agent
            </span>
          </Button>
        </div>
        <p className="mono" style={{ margin: "8px 0 0", fontSize: 11, color: "var(--fg-3)" }}>
          Real token counts from Claude Code session transcripts. Cost is estimated, not billed.
        </p>
      </div>

      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {!running ? (
          <Note>Runtime not running — no transcripts to read.</Note>
        ) : usage === null ? (
          <Note>Reading session transcripts…</Note>
        ) : empty ? (
          <Note>
            No Claude turns recorded yet. Token usage appears here once an agent responds.
          </Note>
        ) : (
          <UsageBody usage={usage} />
        )}
      </div>
    </main>
  );
}

function UsageBody({ usage }: { usage: ClaudeUsage }) {
  const tokens = usage.totals.input + usage.totals.output;
  const cache = usage.totals.cacheRead + usage.totals.cacheCreation;
  return (
    <>
      {/* metric row — all factual */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Metric label="Sessions" value={String(usage.sessions)} />
        <Metric label="Turns (responses)" value={String(usage.turns)} />
        <Metric label="Tokens (in + out)" value={fmtNum(tokens)} />
        <Metric label="Cache (read + write)" value={fmtNum(cache)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
        {/* per-model rollup */}
        <Card title="By model" count={usage.byModel.length}>
          <div style={{ padding: "6px 8px" }}>
            <Row head>
              <span style={{ flex: 1 }}>Model</span>
              <Num head>turns</Num>
              <Num head>input</Num>
              <Num head>output</Num>
              <Num head>cache</Num>
              <Num head wide>
                est. cost
              </Num>
            </Row>
            {usage.byModel.map((m) => (
              <Row key={m.model}>
                <span
                  className="mono"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--fg-0)",
                  }}
                  title={m.model}
                >
                  {m.model}
                  {!m.priced && (
                    <span style={{ marginLeft: 6, fontSize: 9.5, color: "var(--fg-3)" }}>
                      unpriced
                    </span>
                  )}
                </span>
                <Num>{String(m.turns)}</Num>
                <Num>{fmtNum(m.totals.input)}</Num>
                <Num>{fmtNum(m.totals.output)}</Num>
                <Num>{fmtNum(m.totals.cacheRead + m.totals.cacheCreation)}</Num>
                <Num wide>{m.priced ? fmtUsd(m.estCostUsd) : "—"}</Num>
              </Row>
            ))}
          </div>
        </Card>

        {/* estimated cost — clearly marked as an estimate */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            className="ch-card"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div className="lbl">Estimated cost</div>
            <div
              className="mono tnum"
              style={{ fontSize: 28, fontWeight: 500, color: "var(--fg-0)" }}
            >
              ≈ {fmtUsd(usage.estCostUsd)}
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", lineHeight: 1.5 }}>
              estimate — not billed · rates as of {usage.ratesAsOf}
            </div>
            {usage.unpricedTokens > 0 && (
              <div className="mono" style={{ fontSize: 10.5, color: "var(--warn, var(--fg-3))" }}>
                {fmtNum(usage.unpricedTokens)} tokens from unpriced models excluded
              </div>
            )}
          </div>

          {/* full token breakdown */}
          <Card title="Tokens" count={null}>
            <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
              <Kv k="Input" v={fmtNum(usage.totals.input)} />
              <Kv k="Output" v={fmtNum(usage.totals.output)} />
              <Kv k="Cache read" v={fmtNum(usage.totals.cacheRead)} />
              <Kv k="Cache write" v={fmtNum(usage.totals.cacheCreation)} />
            </div>
          </Card>
        </div>
      </div>

      {/* per-day rollup (newest first) */}
      {usage.byDay.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Card title="By day" count={usage.byDay.length}>
            <div style={{ padding: "6px 8px" }}>
              <Row head>
                <span style={{ flex: 1 }}>Date</span>
                <Num head>input</Num>
                <Num head>output</Num>
                <Num head>cache</Num>
                <Num head wide>
                  est. cost
                </Num>
              </Row>
              {[...usage.byDay].reverse().map((d) => (
                <Row key={d.date}>
                  <span className="mono" style={{ flex: 1, color: "var(--fg-0)" }}>
                    {d.date}
                  </span>
                  <Num>{fmtNum(d.totals.input)}</Num>
                  <Num>{fmtNum(d.totals.output)}</Num>
                  <Num>{fmtNum(d.totals.cacheRead + d.totals.cacheCreation)}</Num>
                  <Num wide>{fmtUsd(d.estCostUsd)}</Num>
                </Row>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* rate transparency */}
      <div
        className="mono"
        style={{ marginTop: 14, fontSize: 10.5, color: "var(--fg-3)", lineHeight: 1.7 }}
      >
        Estimate rates (USD per million tokens, as of {usage.ratesAsOf}):{" "}
        {usage.rates.map((r, i) => (
          <span key={r.family}>
            {i > 0 && " · "}
            {r.family} {fmtRate(r.inputPerMtok)}/{fmtRate(r.outputPerMtok)} in/out
          </span>
        ))}
      </div>
    </>
  );
}

// ── small presentational helpers ──────────────────────────────────────────

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count: number | null;
  children: React.ReactNode;
}) {
  return (
    <div className="ch-card" style={{ padding: 0, minWidth: 0 }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--bd-soft)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-0)" }}>{title}</span>
        <span style={{ flex: 1 }} />
        {count !== null && (
          <span className="mono tnum" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="ch-card"
      style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div className="lbl">{label}</div>
      <span className="mono tnum" style={{ fontSize: 24, fontWeight: 500, color: "var(--fg-0)" }}>
        {value}
      </span>
    </div>
  );
}

function Row({ head, children }: { head?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={head ? undefined : "rail-file"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 8px",
        borderBottom: head ? "1px solid var(--bd-soft)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Num({
  children,
  head,
  wide,
}: {
  children: React.ReactNode;
  head?: boolean;
  wide?: boolean;
}) {
  return (
    <span
      className={head ? "lbl tnum" : "mono tnum"}
      style={{
        width: wide ? 84 : 64,
        textAlign: "right",
        flexShrink: 0,
        fontSize: head ? undefined : 12,
        color: head ? undefined : "var(--fg-1)",
      }}
    >
      {children}
    </span>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <span className="mono" style={{ flex: 1, fontSize: 11.5, color: "var(--fg-2)" }}>
        {k}
      </span>
      <span className="mono tnum" style={{ fontSize: 12, color: "var(--fg-0)" }}>
        {v}
      </span>
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

// ── formatters ─────────────────────────────────────────────────────────────

// Compact token count: 1_234_567 → "1.2M", 12_300 → "12.3K", 540 → "540".
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) {
    const decimals = n >= 10_000 ? 0 : 1;
    // Rounding can push a high-900Ks value to "1000K"; promote it to M instead.
    if (Number((n / 1_000).toFixed(decimals)) >= 1_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    return `${(n / 1_000).toFixed(decimals)}K`;
  }
  return String(n);
}

// USD with cents; sub-cent amounts get more precision so they don't read $0.00.
function fmtUsd(n: number): string {
  if (n > 0 && n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

// Rate like "$15" or "$3.75" (trailing-zero-trimmed).
function fmtRate(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
