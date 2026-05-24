import { useEffect, useState } from "react";
import { Spark } from "../../components/primitives/Spark";
import { Ico } from "../../components/primitives/icons";
import { useStore } from "../../lib/store";

// Container-level info bar, ported from design/screens/main-hub-a.jsx.
//
// REAL: container identity + runtime state + Docker version (Tier-1), and live
// cpu / mem from `container_stats` (polled ~2s while the runtime is up, same
// cadence as the Containers view). cpu also feeds a small sparkline of the last
// readings.
//
// HONEST EM-DASH: ci / tests / lint have NO data source in the backend, and cost
// is a per-workspace estimate we do not aggregate here (it lives on the Usage
// screen with its disclosure) — all shown as em-dashes, never fabricated.
// Keep a short rolling window of cpu readings for the sparkline.
const SPARK_LEN = 24;

// Memory as the design renders it — binary GiB with one decimal ("1.2/4 GiB").
// memLimit can be 0 when the daemon doesn't report a limit → omit the divisor.
function fmtGiB(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(1);
}

export function WorkspaceBar() {
  const status = useStore((s) => s.status);
  const dockerInfo = useStore((s) => s.dockerInfo);
  const live = status?.state === "running";

  // Live cpu/mem come from the single app-wide poll (useContainerStatsPoll) via
  // the store; the cpu sparkline accumulates a short rolling window locally.
  const stats = useStore((s) => s.containerStats);
  const [cpuHist, setCpuHist] = useState<number[]>([]);

  useEffect(() => {
    if (!live || !stats) {
      setCpuHist([]);
      return;
    }
    setCpuHist((h) => [...h, stats.cpuPct].slice(-SPARK_LEN));
  }, [live, stats]);

  const memText =
    stats && stats.memLimit > 0
      ? `${fmtGiB(stats.memUsed)}/${fmtGiB(stats.memLimit)} GiB`
      : stats
        ? `${fmtGiB(stats.memUsed)} GiB`
        : "—";

  return (
    <div
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 14px",
        borderBottom: "1px solid var(--bd-soft)",
        background: "var(--bg-1)",
        flexShrink: 0,
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--fg-2)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-1)" }}>
        {Ico.container}
        <span>{status?.name ?? "codehub-runtime"}</span>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }} title="Runtime state">
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: live ? "var(--live)" : "var(--fg-3)",
          }}
        />
        <span style={{ color: "var(--fg-1)" }}>{status?.state ?? "—"}</span>
      </span>
      {dockerInfo?.version && (
        <>
          <span className="vr" style={{ height: 14 }} />
          <span title="Docker daemon version">docker {dockerInfo.version}</span>
        </>
      )}

      <span className="vr" style={{ height: 14 }} />

      {/* ci / tests / lint — no backend source. Honest em-dash, never faked. */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }} title="CI — no source">
        <span style={{ color: "var(--fg-1)" }}>ci</span>
        <span style={{ color: "var(--fg-3)" }}>—</span>
      </span>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        title="Tests — no source"
      >
        <span style={{ color: "var(--fg-1)" }}>tests</span>
        <span style={{ color: "var(--fg-3)" }}>—</span>
      </span>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        title="Lint — no source"
      >
        <span style={{ color: "var(--fg-1)" }}>lint</span>
        <span style={{ color: "var(--fg-3)" }}>—</span>
      </span>

      <span style={{ flex: 1 }} />

      {/* live cpu (+ sparkline) / mem from container_stats */}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }} title="CPU">
        {cpuHist.length > 1 && (
          <Spark data={cpuHist} w={36} h={10} color={live ? "var(--live)" : "var(--fg-3)"} />
        )}
        <span className="tnum" style={{ color: "var(--fg-1)" }}>
          cpu {stats ? `${stats.cpuPct.toFixed(0)}%` : "—"}
        </span>
      </span>
      <span className="tnum" style={{ color: "var(--fg-1)" }} title="Memory">
        mem {memText}
      </span>
      {/* per-workspace cost is an estimate aggregated on the Usage screen, not here */}
      <span style={{ color: "var(--fg-3)" }} title="Cost — see Usage screen">
        $ —
      </span>
    </div>
  );
}
