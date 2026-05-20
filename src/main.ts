import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { type Pane, activatePane, createPane, deactivatePane, destroyPane } from "./terminal";

type Cli = "claude" | "codex" | "antigravity";

type ContainerState = "missing" | "stopped" | "starting" | "running" | "unreachable";

interface ContainerStatus {
  state: ContainerState;
  id: string | null;
  image: string;
  name: string;
}

interface SessionInfo {
  name: string;
  windows: number;
  attached: boolean;
}

interface CliSpec {
  id: Cli;
  common: string;
  binomial: string;
  order: string;
  bird: string;
}

const CLIS: CliSpec[] = [
  {
    id: "claude",
    common: "Eagle Owl",
    binomial: "Bubo bubo",
    order: "Strigiformes",
    bird: "#bird-owl",
  },
  {
    id: "codex",
    common: "Common Raven",
    binomial: "Corvus corax",
    order: "Passeriformes",
    bird: "#bird-raven",
  },
  {
    id: "antigravity",
    common: "Peregrine Falcon",
    binomial: "Falco peregrinus",
    order: "Falconiformes",
    bird: "#bird-falcon",
  },
];

const SPEC_BY_CLI: Record<Cli, CliSpec> = Object.fromEntries(CLIS.map((c) => [c.id, c])) as Record<
  Cli,
  CliSpec
>;

const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
  "XXII",
  "XXIII",
  "XXIV",
  "XXV",
  "XXVI",
  "XXVII",
  "XXVIII",
  "XXIX",
  "XXX",
];
function toRoman(n: number): string {
  return ROMAN[n] ?? String(n);
}

const host = document.getElementById("terminal-host") as HTMLElement;
const tabsEl = document.getElementById("tabs") as HTMLElement;
const newBtn = document.getElementById("new-session") as HTMLButtonElement;
const statusCellEl = document.getElementById("status-cell") as HTMLElement;
const statusContainerEl = document.getElementById("status-container") as HTMLElement;
const statusRuntimeEl = document.getElementById("status-runtime") as HTMLElement;
const statusSessionEl = document.getElementById("status-session") as HTMLElement;
const statusSessionNameEl = document.getElementById("status-session-name") as HTMLElement;
const statusPlateEl = document.getElementById("status-plate") as HTMLElement;
const mastheadDate = document.getElementById("masthead-date") as HTMLElement;
const emptyState = document.getElementById("empty-state") as HTMLElement;

interface SessionMeta {
  cli: Cli;
  plate: number;
}

const panes = new Map<string, Pane>();
const sessionMeta = new Map<string, SessionMeta>();
let activeName: string | null = null;
let lastStatus: ContainerStatus | null = null;
let bootstrapped = false;
let plateCounter = 0;

// -----------------------------------------------------------------------
// Masthead date
// -----------------------------------------------------------------------

(function setMastheadDate() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  mastheadDate.textContent = fmt;
})();

// -----------------------------------------------------------------------
// Status — runtime state appears in both masthead pill and footer
// -----------------------------------------------------------------------

function renderStatus(status: ContainerStatus) {
  lastStatus = status;
  const cls = `state-${status.state}`;
  statusCellEl.className = `mast-center ${cls}`;
  statusContainerEl.className = `status-foot ${cls}`;
  const dot = statusCellEl.querySelector(".status-dot");
  const text = statusCellEl.querySelector(".status-text");
  if (dot) dot.className = "status-dot";
  if (text) text.textContent = status.state;
  statusRuntimeEl.textContent = status.state;

  if (status.state === "running" && !bootstrapped) {
    bootstrapped = true;
    void bootstrapExistingSessions();
  }
}

function updateActivePlate() {
  if (!activeName) {
    statusSessionNameEl.textContent = "—";
    statusPlateEl.textContent = "—";
    return;
  }
  const meta = sessionMeta.get(activeName);
  const cli = meta?.cli;
  const spec = cli ? SPEC_BY_CLI[cli] : null;
  statusSessionNameEl.textContent = spec?.common ?? activeName;
  statusPlateEl.textContent = meta ? toRoman(meta.plate) : "—";
}

// -----------------------------------------------------------------------
// Empty state
// -----------------------------------------------------------------------

function refreshEmptyState() {
  if (panes.size === 0) emptyState.classList.remove("hidden");
  else emptyState.classList.add("hidden");
}

// -----------------------------------------------------------------------
// Tabs — specimen ledger row
// -----------------------------------------------------------------------

function renderTabs() {
  tabsEl.innerHTML = "";
  for (const [name] of panes) {
    const meta = sessionMeta.get(name);
    const spec = meta ? SPEC_BY_CLI[meta.cli] : null;
    const tab = document.createElement("div");
    tab.className = `tab${name === activeName ? " active" : ""}`;
    tab.innerHTML = `
      <span class="plate-num">${meta ? toRoman(meta.plate) : "—"}</span>
      <svg class="bird" aria-hidden="true"><use href="${spec?.bird ?? "#bird-owl"}"/></svg>
      <span class="tab-text">
        <span class="latin">${spec?.binomial ?? name}</span>
        <span class="common">${spec?.common ?? "Specimen"}</span>
      </span>
      <span class="close" aria-label="close">×</span>
    `;
    tab.onclick = () => activateTab(name);
    const closeEl = tab.querySelector(".close") as HTMLElement;
    closeEl.onclick = (ev) => {
      ev.stopPropagation();
      void closeTab(name);
    };
    tabsEl.appendChild(tab);
  }
}

function activateTab(name: string) {
  if (activeName === name) return;
  if (activeName) {
    const prev = panes.get(activeName);
    if (prev) deactivatePane(prev);
  }
  activeName = name;
  const pane = panes.get(name);
  if (pane) activatePane(pane);
  updateActivePlate();
  renderTabs();
}

async function closeTab(name: string) {
  const pane = panes.get(name);
  if (!pane) return;

  try {
    await invoke("kill_session", { name });
  } catch (e) {
    console.warn(`kill_session(${name}) failed:`, e);
  }
  await destroyPane(pane);

  panes.delete(name);
  sessionMeta.delete(name);
  if (activeName === name) {
    activeName = null;
    const next = panes.keys().next().value;
    if (next) activateTab(next);
    else updateActivePlate();
  }
  renderTabs();
  refreshEmptyState();
}

// -----------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------

async function openSession(name: string, cli: Cli) {
  if (panes.has(name)) {
    activateTab(name);
    return;
  }
  plateCounter += 1;
  sessionMeta.set(name, { cli, plate: plateCounter });

  const spec = SPEC_BY_CLI[cli];
  const pane = await createPane(host, name, {
    plateLabel: `Plate ${toRoman(plateCounter)} — ${spec.common}`,
    binomial: spec.binomial,
    watermark: `№ ${toRoman(plateCounter)}`,
  });
  panes.set(name, pane);
  activateTab(name);
  refreshEmptyState();
}

// -----------------------------------------------------------------------
// Modal
// -----------------------------------------------------------------------

function pickCli(): Promise<Cli | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <span class="frame-fleuron tl"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron tr"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron bl"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron br"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>

        <header class="modal-header">
          <span class="kicker">Tom. I &middot; Pl. ${toRoman(plateCounter + 1)}</span>
          <h2>Release a specimen</h2>
          <span class="header-meta">Choose a species to admit into the aviary</span>
        </header>
        <div class="cli-grid">
          ${CLIS.map(
            (c, i) => `
              <button class="cli-card" data-cli="${c.id}" aria-label="${c.common}">
                <span class="order">${toRoman(i + 1)}.</span>
                <span class="order-caps">${c.order}</span>
                <svg class="bird" aria-hidden="true"><use href="${c.bird}"/></svg>
                <span class="common">${c.common}</span>
                <span class="binomial">${c.binomial}</span>
                <span class="cli-name">${c.id}</span>
              </button>
            `,
          ).join("")}
        </div>
        <footer class="modal-footer">
          <span class="esc"><kbd>Esc</kbd> to dismiss</span>
          <button class="cancel" type="button">Return to journal</button>
        </footer>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        resolve(null);
      }
    };
    document.addEventListener("keydown", onKey);

    for (const btn of overlay.querySelectorAll<HTMLButtonElement>(".cli-card")) {
      btn.onclick = () => {
        cleanup();
        resolve(btn.dataset.cli as Cli);
      };
    }
    overlay.querySelector<HTMLButtonElement>(".cancel")!.onclick = () => {
      cleanup();
      resolve(null);
    };
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    };
  });
}

async function newSession() {
  if (lastStatus?.state !== "running") {
    statusCellEl.className = "mast-center state-error";
    const text = statusCellEl.querySelector(".status-text");
    if (text) text.textContent = `${lastStatus?.state ?? "unknown"} · cannot release`;
    return;
  }
  const cli = await pickCli();
  if (!cli) return;
  const name = `${cli}-${Date.now().toString(36)}`;
  await invoke("create_session", { name, cli });
  await openSession(name, cli);
}

// -----------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------

async function bootstrapExistingSessions() {
  try {
    const sessions: SessionInfo[] = await invoke("list_sessions");
    for (const s of sessions) {
      const guessed = (CLIS.find((c) => s.name.startsWith(c.id))?.id ?? "claude") as Cli;
      await openSession(s.name, guessed);
    }
  } catch (e) {
    console.error("list_sessions failed", e);
  }
  refreshEmptyState();
}

// -----------------------------------------------------------------------
// Event wiring
// -----------------------------------------------------------------------

newBtn.onclick = () => void newSession();

window.addEventListener("resize", () => {
  if (!activeName) return;
  panes.get(activeName)?.fit.fit();
});

(async function init() {
  refreshEmptyState();

  await listen<ContainerStatus>("aviary://lifecycle", (e) => {
    renderStatus(e.payload);
  });
  await listen<string>("aviary://lifecycle-error", (e) => {
    statusCellEl.className = "mast-center state-error";
    const text = statusCellEl.querySelector(".status-text");
    if (text) text.textContent = `error · ${e.payload}`;
    statusContainerEl.className = "status-foot state-error";
    statusRuntimeEl.textContent = "error";
  });

  try {
    const status: ContainerStatus = await invoke("container_status");
    renderStatus(status);
  } catch (e) {
    console.error(e);
  }
})();

// Make sessions visible elsewhere if needed (debugging)
void statusSessionEl;
