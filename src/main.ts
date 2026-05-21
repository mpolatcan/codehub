import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { type Pane, createPane, destroyPane, fitPane, focusPane } from "./terminal";

type Cli = "claude" | "codex" | "antigravity";

// Permission posture a session launches with — maps to per-CLI flags backend-side.
type Mode = "standard" | "auto" | "yolo";

interface ModeSpec {
  id: Mode;
  label: string;
  // One-line gloss shown under the segmented control.
  hint: string;
  // Short tag rendered on panes/rows so a hot session is visible at a glance.
  badge: string;
}

const MODES: ModeSpec[] = [
  {
    id: "standard",
    label: "Standard",
    hint: "Agent asks before edits and commands.",
    badge: "",
  },
  {
    id: "auto",
    label: "Auto",
    hint: "Auto-accepts edits in the workspace, still sandboxed.",
    badge: "AUTO",
  },
  {
    id: "yolo",
    label: "YOLO",
    hint: "Skips all approvals & sandbox — the container is the boundary.",
    badge: "YOLO",
  },
];

const MODE_BY_ID: Record<Mode, ModeSpec> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
) as Record<Mode, ModeSpec>;

// Antigravity's launch flags are unverified, so it offers Standard only.
const MODE_SUPPORT: Record<Cli, Mode[]> = {
  claude: ["standard", "auto", "yolo"],
  codex: ["standard", "auto", "yolo"],
  antigravity: ["standard"],
};

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
  // Plain agent name shown to the user.
  label: string;
  // Short word the auto-alias is built from (e.g. "Owl 1").
  alias: string;
  // Bird species — used only as flavour caption + sprite icon, never as a label.
  species: string;
  bird: string;
}

const CLIS: CliSpec[] = [
  {
    id: "claude",
    label: "Claude Code",
    alias: "Owl",
    species: "Eagle Owl",
    bird: "#bird-owl",
  },
  {
    id: "codex",
    label: "Codex",
    alias: "Raven",
    species: "Common Raven",
    bird: "#bird-raven",
  },
  {
    id: "antigravity",
    label: "Antigravity",
    alias: "Falcon",
    species: "Peregrine Falcon",
    bird: "#bird-falcon",
  },
];

const SPEC_BY_CLI: Record<Cli, CliSpec> = Object.fromEntries(CLIS.map((c) => [c.id, c])) as Record<
  Cli,
  CliSpec
>;

// Control-button glyphs — drawn inline so they inherit `currentColor`.
const ICON_SPLIT_ROW =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="2.5" width="5.5" height="11" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="2.5" width="5.5" height="11" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const ICON_SPLIT_COL =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="1.5" width="11" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="2.5" y="9" width="11" height="5.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const ICON_CLOSE =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

// -----------------------------------------------------------------------
// Layout tree — a workspace (tab) owns a binary split tree of sessions.
// -----------------------------------------------------------------------

type SplitDir = "row" | "col";

interface LeafNode {
  kind: "leaf";
  id: number;
  session: string;
}

interface SplitNode {
  kind: "split";
  id: number;
  dir: SplitDir;
  ratio: number;
  a: LayoutNode;
  b: LayoutNode;
}

type LayoutNode = LeafNode | SplitNode;

interface Workspace {
  id: string;
  plate: number;
  root: LayoutNode | null;
  focused: string | null;
}

interface SessionMeta {
  cli: Cli;
  num: number;
  alias: string;
  mode: Mode;
  workspaceId: string;
}

// -----------------------------------------------------------------------
// DOM handles
// -----------------------------------------------------------------------

const gridRoot = document.getElementById("grid-root") as HTMLElement;
const tabsEl = document.getElementById("tabs") as HTMLElement;
const newBtn = document.getElementById("new-session") as HTMLButtonElement;
const railList = document.getElementById("rail-list") as HTMLElement;
const railToggle = document.getElementById("rail-toggle") as HTMLButtonElement;
const railNew = document.getElementById("rail-new") as HTMLButtonElement;
const sessionRail = document.getElementById("session-rail") as HTMLElement;
const statusCellEl = document.getElementById("status-cell") as HTMLElement;
const statusContainerEl = document.getElementById("status-container") as HTMLElement;
const statusRuntimeEl = document.getElementById("status-runtime") as HTMLElement;
const statusSessionNameEl = document.getElementById("status-session-name") as HTMLElement;
const statusPlateEl = document.getElementById("status-plate") as HTMLElement;
const mastheadDate = document.getElementById("masthead-date") as HTMLElement;
const emptyState = document.getElementById("empty-state") as HTMLElement;

// Off-screen parking lot for xterm surfaces not currently mounted in the tree.
const paneStash = document.createElement("div");
paneStash.className = "pane-stash";
document.body.appendChild(paneStash);

// -----------------------------------------------------------------------
// State
// -----------------------------------------------------------------------

const panes = new Map<string, Pane>();
const sessionMeta = new Map<string, SessionMeta>();
const workspaces: Workspace[] = [];
let activeWorkspaceId: string | null = null;
let lastStatus: ContainerStatus | null = null;
let bootstrapped = false;
let plateCounter = 0;
let specimenCounter = 0;
let nodeCounter = 0;

function nid(): number {
  nodeCounter += 1;
  return nodeCounter;
}
function leafNode(session: string): LeafNode {
  return { kind: "leaf", id: nid(), session };
}

// -----------------------------------------------------------------------
// Tree helpers
// -----------------------------------------------------------------------

function* leavesOf(node: LayoutNode): Generator<string> {
  if (node.kind === "leaf") {
    yield node.session;
  } else {
    yield* leavesOf(node.a);
    yield* leavesOf(node.b);
  }
}

function firstLeaf(node: LayoutNode): string {
  return leavesOf(node).next().value as string;
}

function replaceLeaf(
  node: LayoutNode,
  session: string,
  make: (leaf: LeafNode) => LayoutNode,
): LayoutNode {
  if (node.kind === "leaf") {
    return node.session === session ? make(node) : node;
  }
  return {
    ...node,
    a: replaceLeaf(node.a, session, make),
    b: replaceLeaf(node.b, session, make),
  };
}

function removeLeaf(node: LayoutNode, session: string): LayoutNode | null {
  if (node.kind === "leaf") {
    return node.session === session ? null : node;
  }
  const a = removeLeaf(node.a, session);
  const b = removeLeaf(node.b, session);
  if (a === null) return b;
  if (b === null) return a;
  return { ...node, a, b };
}

function activeWorkspace(): Workspace | undefined {
  return workspaces.find((w) => w.id === activeWorkspaceId);
}
function workspaceOf(session: string): Workspace | undefined {
  const meta = sessionMeta.get(session);
  return meta ? workspaces.find((w) => w.id === meta.workspaceId) : undefined;
}

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
// Status
// -----------------------------------------------------------------------

function renderStatus(status: ContainerStatus) {
  lastStatus = status;
  const cls = `state-${status.state}`;
  statusCellEl.className = `mast-center ${cls}`;
  statusContainerEl.className = `status-foot ${cls}`;
  const text = statusCellEl.querySelector(".status-text");
  const dot = statusCellEl.querySelector(".status-dot");
  if (dot) dot.className = "status-dot";
  if (text) text.textContent = status.state;
  statusRuntimeEl.textContent = status.state;

  if (status.state === "running" && !bootstrapped) {
    bootstrapped = true;
    void bootstrapExistingSessions();
  }
}

function updateActivePlate() {
  const ws = activeWorkspace();
  const name = ws?.focused ?? null;
  if (!ws || !name) {
    statusSessionNameEl.textContent = "—";
    statusPlateEl.textContent = "—";
    return;
  }
  statusSessionNameEl.textContent = aliasOf(name);
  statusPlateEl.textContent = String(ws.plate);
}

function aliasOf(session: string): string {
  return sessionMeta.get(session)?.alias ?? session;
}

// Small caps tag for non-standard launch modes (AUTO / YOLO); empty for standard.
function modeBadgeHtml(session: string): string {
  const m = sessionMeta.get(session)?.mode ?? "standard";
  const badge = MODE_BY_ID[m].badge;
  return badge ? `<span class="mode-badge badge-${m}">${badge}</span>` : "";
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function refreshEmptyState() {
  const ws = activeWorkspace();
  emptyState.classList.toggle("hidden", !!ws?.root);
}

// -----------------------------------------------------------------------
// Tabs — one per workspace (plate)
// -----------------------------------------------------------------------

function workspaceLeaves(ws: Workspace): string[] {
  return ws.root ? [...leavesOf(ws.root)] : [];
}

function renderTabs() {
  tabsEl.innerHTML = "";
  for (const ws of workspaces) {
    const sessions = workspaceLeaves(ws);
    const primary = ws.focused && sessions.includes(ws.focused) ? ws.focused : sessions[0];
    const spec = primary ? SPEC_BY_CLI[sessionMeta.get(primary)?.cli ?? "claude"] : null;
    const count = sessions.length;
    const countLabel = count === 1 ? "1 session" : `${count} sessions`;

    const tab = document.createElement("div");
    tab.className = `tab${ws.id === activeWorkspaceId ? " active" : ""}`;
    tab.innerHTML = `
      <span class="plate-num">${ws.plate}</span>
      <svg class="bird" aria-hidden="true"><use href="${spec?.bird ?? "#bird-owl"}"/></svg>
      <span class="tab-text">
        <span class="latin">Tab ${ws.plate}</span>
        <span class="common">${countLabel}</span>
      </span>
      <span class="close" aria-label="close">×</span>
    `;
    tab.onclick = () => switchWorkspace(ws.id);
    const closeEl = tab.querySelector(".close") as HTMLElement;
    closeEl.onclick = (ev) => {
      ev.stopPropagation();
      void closeWorkspaceFull(ws.id);
    };
    tabsEl.appendChild(tab);
  }
}

// -----------------------------------------------------------------------
// Catalogue rail — every session, grouped by plate
// -----------------------------------------------------------------------

function renderRail() {
  railList.innerHTML = "";
  for (const ws of workspaces) {
    const sessions = workspaceLeaves(ws);

    const head = document.createElement("div");
    head.className = `rail-group-head${ws.id === activeWorkspaceId ? " active" : ""}`;
    head.innerHTML = `
      <span class="rg-plate">${ws.plate}</span>
      <span class="rg-label">Tab</span>
      <span class="rg-count">${sessions.length}</span>
    `;
    head.onclick = () => switchWorkspace(ws.id);
    railList.appendChild(head);

    for (const session of sessions) {
      const meta = sessionMeta.get(session);
      const spec = meta ? SPEC_BY_CLI[meta.cli] : null;
      const isFocused = ws.id === activeWorkspaceId && ws.focused === session;

      const row = document.createElement("div");
      row.className = `rail-row${isFocused ? " focused" : ""}`;
      row.innerHTML = `
        <svg class="bird" aria-hidden="true"><use href="${spec?.bird ?? "#bird-owl"}"/></svg>
        <span class="rr-text">
          <span class="rr-common">${escapeHtml(aliasOf(session))}</span>
          <span class="rr-num">${spec?.label ?? ""}</span>
        </span>
        ${modeBadgeHtml(session)}
        <span class="rr-close" aria-label="close">×</span>
      `;
      row.onclick = () => focusSession(session);
      const closeEl = row.querySelector(".rr-close") as HTMLElement;
      closeEl.onclick = (ev) => {
        ev.stopPropagation();
        void closeSession(session);
      };
      railList.appendChild(row);
    }
  }
}

// -----------------------------------------------------------------------
// Split-tree rendering
// -----------------------------------------------------------------------

function buildPaneHead(session: string): HTMLElement {
  const meta = sessionMeta.get(session);
  const spec = meta ? SPEC_BY_CLI[meta.cli] : null;
  const head = document.createElement("div");
  head.className = "pane-head";
  head.innerHTML = `
    <svg class="bird" aria-hidden="true"><use href="${spec?.bird ?? "#bird-owl"}"/></svg>
    <span class="pane-name" title="Double-click to rename">${escapeHtml(aliasOf(session))}</span>
    <span class="pane-agent">${spec?.label ?? ""}</span>
    ${modeBadgeHtml(session)}
    <span class="pane-spacer"></span>
    <button class="pane-ctl split-col" type="button" title="Split below">${ICON_SPLIT_COL}</button>
    <button class="pane-ctl split-row" type="button" title="Split right">${ICON_SPLIT_ROW}</button>
    <button class="pane-ctl close" type="button" title="Close session">${ICON_CLOSE}</button>
  `;
  const nameEl = head.querySelector(".pane-name") as HTMLElement;
  nameEl.ondblclick = (e) => {
    e.stopPropagation();
    beginRename(session, nameEl);
  };
  (head.querySelector(".split-col") as HTMLButtonElement).onclick = (e) => {
    e.stopPropagation();
    void splitSession(session, "col");
  };
  (head.querySelector(".split-row") as HTMLButtonElement).onclick = (e) => {
    e.stopPropagation();
    void splitSession(session, "row");
  };
  (head.querySelector(".pane-ctl.close") as HTMLButtonElement).onclick = (e) => {
    e.stopPropagation();
    void closeSession(session);
  };
  return head;
}

// Inline rename — double-click the pane name to give a session a custom alias.
function beginRename(session: string, nameEl: HTMLElement) {
  const meta = sessionMeta.get(session);
  if (!meta) return;
  const input = document.createElement("input");
  input.className = "pane-name-input";
  input.value = meta.alias;
  input.maxLength = 32;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  const commit = (save: boolean) => {
    if (save) {
      const next = input.value.trim();
      meta.alias = next.length > 0 ? next : meta.alias;
    }
    renderTabs();
    renderRail();
    updateActivePlate();
    if (activeWorkspaceId === meta.workspaceId) renderGrid();
  };
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit(false);
    }
  };
  input.onblur = () => commit(true);
}

function renderNode(node: LayoutNode, ws: Workspace): HTMLElement {
  if (node.kind === "leaf") {
    const leaf = document.createElement("div");
    leaf.className = `pane-leaf${ws.focused === node.session ? " focused" : ""}`;
    leaf.dataset.session = node.session;
    leaf.appendChild(buildPaneHead(node.session));

    const body = document.createElement("div");
    body.className = "pane-body";
    const pane = panes.get(node.session);
    if (pane) body.appendChild(pane.el);
    leaf.appendChild(body);

    leaf.addEventListener("mousedown", () => focusSession(node.session));
    return leaf;
  }

  const wrap = document.createElement("div");
  wrap.className = `split ${node.dir}`;

  const a = document.createElement("div");
  a.className = "split-cell";
  a.style.flex = `${node.ratio} 1 0`;
  a.appendChild(renderNode(node.a, ws));

  const divider = document.createElement("div");
  divider.className = `divider ${node.dir}`;

  const b = document.createElement("div");
  b.className = "split-cell";
  b.style.flex = `${1 - node.ratio} 1 0`;
  b.appendChild(renderNode(node.b, ws));

  attachDrag(divider, node, a, b);
  wrap.append(a, divider, b);
  return wrap;
}

function attachDrag(divider: HTMLElement, node: SplitNode, a: HTMLElement, b: HTMLElement) {
  divider.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const container = divider.parentElement;
    if (!container) return;
    const horizontal = node.dir === "row";

    const onMove = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const total = horizontal ? rect.width : rect.height;
      if (total <= 0) return;
      const pos = horizontal ? ev.clientX - rect.left : ev.clientY - rect.top;
      const r = Math.min(0.85, Math.max(0.15, pos / total));
      node.ratio = r;
      a.style.flex = `${r} 1 0`;
      b.style.flex = `${1 - r} 1 0`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.classList.remove("dragging");
      fitWorkspace();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.classList.add("dragging");
  });
}

function renderGrid() {
  gridRoot.innerHTML = "";
  const ws = activeWorkspace();
  if (!ws || !ws.root) {
    refreshEmptyState();
    return;
  }
  emptyState.classList.add("hidden");
  gridRoot.appendChild(renderNode(ws.root, ws));
  fitWorkspace();
  if (ws.focused) {
    const pane = panes.get(ws.focused);
    if (pane) focusPane(pane);
  }
}

function fitWorkspace() {
  const ws = activeWorkspace();
  if (!ws || !ws.root) return;
  const root = ws.root;
  requestAnimationFrame(() => {
    for (const session of leavesOf(root)) {
      const pane = panes.get(session);
      if (pane) fitPane(pane);
    }
  });
}

// -----------------------------------------------------------------------
// Focus / switch
// -----------------------------------------------------------------------

function focusSession(name: string) {
  const ws = workspaceOf(name);
  if (!ws) return;
  ws.focused = name;
  if (ws.id !== activeWorkspaceId) {
    switchWorkspace(ws.id);
    return;
  }
  for (const el of gridRoot.querySelectorAll<HTMLElement>(".pane-leaf")) {
    el.classList.toggle("focused", el.dataset.session === name);
  }
  const pane = panes.get(name);
  if (pane) focusPane(pane);
  updateActivePlate();
  renderRail();
}

function switchWorkspace(id: string) {
  if (activeWorkspaceId === id) return;
  activeWorkspaceId = id;
  renderGrid();
  renderTabs();
  renderRail();
  updateActivePlate();
}

// -----------------------------------------------------------------------
// Session / workspace lifecycle
// -----------------------------------------------------------------------

function uniqueName(cli: Cli): string {
  specimenCounter += 1;
  return `${cli}-${Date.now().toString(36)}-${specimenCounter.toString(36)}`;
}

async function spawnPane(name: string, cli: Cli, mode: Mode, workspaceId: string): Promise<void> {
  const pane = await createPane(paneStash, name);
  panes.set(name, pane);
  const num = specimenCounter;
  sessionMeta.set(name, { cli, num, alias: `${SPEC_BY_CLI[cli].alias} ${num}`, mode, workspaceId });
}

async function openWorkspace(name: string, cli: Cli, mode: Mode) {
  plateCounter += 1;
  const ws: Workspace = {
    id: `ws-${plateCounter}-${Date.now().toString(36)}`,
    plate: plateCounter,
    root: leafNode(name),
    focused: name,
  };
  workspaces.push(ws);
  await spawnPane(name, cli, mode, ws.id);
  activeWorkspaceId = ws.id;
  renderGrid();
  renderTabs();
  renderRail();
  updateActivePlate();
}

async function splitSession(target: string, dir: SplitDir) {
  if (!ensureRunning()) return;
  const ws = workspaceOf(target);
  if (!ws || !ws.root) return;
  const choice = await pickSession();
  if (!choice) return;
  const { cli, mode } = choice;
  const name = uniqueName(cli);
  await invoke("create_session", { name, cli, mode });
  await spawnPane(name, cli, mode, ws.id);
  ws.root = replaceLeaf(ws.root, target, (lf) => ({
    kind: "split",
    id: nid(),
    dir,
    ratio: 0.5,
    a: lf,
    b: leafNode(name),
  }));
  ws.focused = name;
  if (ws.id === activeWorkspaceId) renderGrid();
  renderTabs();
  renderRail();
  updateActivePlate();
}

async function closeSession(name: string) {
  const ws = workspaceOf(name);
  const pane = panes.get(name);
  try {
    await invoke("kill_session", { name });
  } catch (e) {
    console.warn(`kill_session(${name}) failed:`, e);
  }
  if (pane) await destroyPane(pane);
  panes.delete(name);
  sessionMeta.delete(name);

  if (ws) {
    ws.root = ws.root ? removeLeaf(ws.root, name) : null;
    if (!ws.root) {
      removeWorkspace(ws.id);
      return;
    }
    if (ws.focused === name) ws.focused = firstLeaf(ws.root);
    if (ws.id === activeWorkspaceId) renderGrid();
  }
  renderTabs();
  renderRail();
  updateActivePlate();
}

async function closeWorkspaceFull(id: string) {
  const ws = workspaces.find((w) => w.id === id);
  if (!ws) return;
  const sessions = workspaceLeaves(ws);
  for (const session of sessions) {
    const pane = panes.get(session);
    try {
      await invoke("kill_session", { name: session });
    } catch (e) {
      console.warn(`kill_session(${session}) failed:`, e);
    }
    if (pane) await destroyPane(pane);
    panes.delete(session);
    sessionMeta.delete(session);
  }
  ws.root = null;
  removeWorkspace(id);
}

function removeWorkspace(id: string) {
  const idx = workspaces.findIndex((w) => w.id === id);
  if (idx === -1) return;
  workspaces.splice(idx, 1);
  if (activeWorkspaceId === id) {
    const next = workspaces[idx] ?? workspaces[idx - 1] ?? null;
    activeWorkspaceId = next?.id ?? null;
    renderGrid();
  }
  renderTabs();
  renderRail();
  updateActivePlate();
}

// -----------------------------------------------------------------------
// Modal
// -----------------------------------------------------------------------

interface SessionChoice {
  cli: Cli;
  mode: Mode;
}

// One-screen launcher: pick an agent (left), pick a permission mode (right),
// hit Start. Enter launches, Esc/Cancel/backdrop dismisses. Defaults to the
// first agent in Standard so Start works on open.
function pickSession(): Promise<SessionChoice | null> {
  return new Promise((resolve) => {
    let cli: Cli = CLIS[0].id;
    let mode: Mode = "standard";

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal launcher" role="dialog" aria-modal="true">
        <span class="frame-fleuron tl"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron tr"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron bl"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>
        <span class="frame-fleuron br"><svg viewBox="0 0 24 24"><use href="#fleuron"/></svg></span>

        <header class="modal-header">
          <span class="kicker">Tab ${plateCounter + 1}</span>
          <h2>New session</h2>
        </header>

        <div class="launch-body">
          <section class="launch-col agents">
            <span class="col-label">Agent</span>
            <div class="agent-list">
              ${CLIS.map(
                (c) => `
                  <button class="agent-row" data-cli="${c.id}" aria-label="${c.label}">
                    <svg class="bird" aria-hidden="true"><use href="${c.bird}"/></svg>
                    <span class="ar-text">
                      <span class="ar-name">${c.label}</span>
                      <span class="ar-species">${c.species}</span>
                    </span>
                    <span class="ar-tick" aria-hidden="true">●</span>
                  </button>
                `,
              ).join("")}
            </div>
          </section>

          <section class="launch-col modes">
            <span class="col-label">Permission mode</span>
            <div class="mode-seg" role="radiogroup">
              ${MODES.map(
                (m) => `
                  <button class="mode-opt mode-${m.id}" data-mode="${m.id}" role="radio">
                    ${m.label}
                  </button>
                `,
              ).join("")}
            </div>
            <p class="mode-hint"></p>
            <p class="mode-warn">⚠ Bypasses the agent's own guardrails. Safe because the runtime container is isolated.</p>
          </section>
        </div>

        <footer class="modal-footer">
          <span class="esc"><kbd>Esc</kbd> dismiss &nbsp;·&nbsp; <kbd>↵</kbd> start</span>
          <span class="footer-actions">
            <button class="cancel" type="button">Cancel</button>
            <button class="start" type="button">Start session</button>
          </span>
        </footer>
      </div>
    `;
    document.body.appendChild(overlay);

    const modeSeg = overlay.querySelector(".mode-seg") as HTMLElement;
    const hintEl = overlay.querySelector(".mode-hint") as HTMLElement;
    const modalEl = overlay.querySelector(".modal") as HTMLElement;

    const syncModes = () => {
      const allowed = MODE_SUPPORT[cli];
      if (!allowed.includes(mode)) mode = "standard";
      for (const opt of modeSeg.querySelectorAll<HTMLButtonElement>(".mode-opt")) {
        const id = opt.dataset.mode as Mode;
        const ok = allowed.includes(id);
        opt.disabled = !ok;
        opt.classList.toggle("disabled", !ok);
        opt.classList.toggle("selected", ok && id === mode);
      }
      hintEl.textContent = MODE_BY_ID[mode].hint;
      modalEl.classList.toggle("yolo-armed", mode === "yolo");
    };

    const syncAgents = () => {
      for (const row of overlay.querySelectorAll<HTMLButtonElement>(".agent-row")) {
        row.classList.toggle("selected", row.dataset.cli === cli);
      }
    };

    const cleanup = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const dismiss = () => {
      cleanup();
      resolve(null);
    };
    const start = () => {
      cleanup();
      resolve({ cli, mode });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else if (e.key === "Enter") start();
    };
    document.addEventListener("keydown", onKey);

    for (const row of overlay.querySelectorAll<HTMLButtonElement>(".agent-row")) {
      row.onclick = () => {
        cli = row.dataset.cli as Cli;
        syncAgents();
        syncModes();
      };
    }
    for (const opt of modeSeg.querySelectorAll<HTMLButtonElement>(".mode-opt")) {
      opt.onclick = () => {
        if (opt.disabled) return;
        mode = opt.dataset.mode as Mode;
        syncModes();
      };
    }
    (overlay.querySelector(".start") as HTMLButtonElement).onclick = start;
    (overlay.querySelector(".cancel") as HTMLButtonElement).onclick = dismiss;
    overlay.onclick = (e) => {
      if (e.target === overlay) dismiss();
    };

    syncAgents();
    syncModes();
  });
}

function ensureRunning(): boolean {
  if (lastStatus?.state === "running") return true;
  statusCellEl.className = "mast-center state-error";
  const text = statusCellEl.querySelector(".status-text");
  if (text) text.textContent = `${lastStatus?.state ?? "unknown"} · cannot release`;
  return false;
}

async function newPlate() {
  if (!ensureRunning()) return;
  const choice = await pickSession();
  if (!choice) return;
  const { cli, mode } = choice;
  const name = uniqueName(cli);
  await invoke("create_session", { name, cli, mode });
  await openWorkspace(name, cli, mode);
}

// Rail "+" — add a session to the current tab by splitting its focused pane.
// Falls back to opening a new tab when nothing is open yet. Split direction is
// chosen so the focused pane is halved along its longer axis.
async function newSessionHere() {
  const ws = activeWorkspace();
  if (!ws || !ws.focused) {
    await newPlate();
    return;
  }
  const el = panes.get(ws.focused)?.el.closest(".pane-leaf") as HTMLElement | null;
  const dir: SplitDir = el && el.clientWidth >= el.clientHeight ? "row" : "col";
  await splitSession(ws.focused, dir);
}

// -----------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------

async function bootstrapExistingSessions() {
  try {
    const sessions: SessionInfo[] = await invoke("list_sessions");
    for (const s of sessions) {
      const guessed = (CLIS.find((c) => s.name.startsWith(c.id))?.id ?? "claude") as Cli;
      specimenCounter += 1;
      // Mode of a pre-existing tmux session is unknown; show it as Standard.
      await openWorkspace(s.name, guessed, "standard");
    }
  } catch (e) {
    console.error("list_sessions failed", e);
  }
  refreshEmptyState();
}

// -----------------------------------------------------------------------
// Event wiring
// -----------------------------------------------------------------------

newBtn.onclick = () => void newPlate();
railNew.onclick = () => void newSessionHere();

railToggle.onclick = () => {
  sessionRail.classList.toggle("collapsed");
  fitWorkspace();
  setTimeout(fitWorkspace, 320);
};

window.addEventListener("resize", () => fitWorkspace());

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
