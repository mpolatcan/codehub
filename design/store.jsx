// CodeHub — shared interactive store.
// Single source of truth that hub-a, hub-b, workspace, welcome and sidebar all
// subscribe to. Holds the list of workspaces, which one is "open" in each
// hub variant, and lets any component mutate the tree.
//
// Implemented as a tiny pub/sub via window event so different <script> scopes
// can share without React Context (each script file is its own scope here).
// Components useStore() to subscribe and re-render on changes.

(function () {
  const KEY = 'codehub.store';

  function defaultState() {
    return {
      // active workspace id per hub view
      activeWorkspaceId: 'aurora-api',
      // workspaces — environment (repos + container) holding groups
      workspaces: [
        {
          id: 'aurora-api',
          name: 'aurora-api',
          color: 'var(--a-claude)',
          container: 'aurora-cc-3a8f',
          containerSize: 'm',
          repos: [
            { name: 'aurora-api', branch: 'feat/auth-rewrite', dirty: 7 },
            { name: 'shared',     branch: 'main',              dirty: 2 },
          ],
          pinned: true,
          lastOpened: 'just now',
          groups: [
            {
              id: 'g1', name: 'Backend', color: 'var(--pri)', dir: 'row',
              panes: [
                { id: 1, kind: 'agent', agent: 'claude', name: 'Claude Code', color: 'var(--a-claude)', model: 'opus-4.7', status: 'live',  variant: 'claude', repo: 'aurora-api' },
                { id: 2, kind: 'agent', agent: 'codex',  name: 'Codex',        color: 'var(--a-codex)',  model: 'o4-mini',  status: 'wait', variant: 'codex',  repo: 'aurora-api' },
              ],
              focusId: 1,
            },
            { id: 'g2', name: 'Frontend',    color: 'var(--a-codex)', dir: 'row', panes: [
              { id: 3, kind: 'agent', agent: 'claude', name: 'Claude (dash)', color: 'var(--a-claude)', model: 'sonnet-4', status: 'idle', repo: 'shared' },
            ], focusId: 3 },
            { id: 'g3', name: 'Exploration', color: 'var(--idle)', dir: 'row', panes: [], focusId: null },
          ],
          activeGroupId: 'g1',
        },
        {
          id: 'ml-pipeline-perf',
          name: 'ml-pipeline · perf',
          color: 'var(--a-antigravity)',
          container: 'ml-ag-12fd',
          containerSize: 'l',
          repos: [{ name: 'ml-pipeline', branch: 'perf/batching', dirty: 0 }],
          pinned: true,
          lastOpened: '4h ago',
          groups: [{ id: 'g1', name: 'Profiling', color: 'var(--a-antigravity)', dir: 'row', panes: [], focusId: null }],
          activeGroupId: 'g1',
        },
        {
          id: 'dash-web',
          name: 'dash-web',
          color: 'var(--a-codex)',
          container: 'dash-cc-7e1a',
          containerSize: 's',
          repos: [{ name: 'dash-web', branch: 'main', dirty: 0 }],
          lastOpened: 'yesterday',
          groups: [{ id: 'g1', name: 'Default', color: 'var(--pri)', dir: 'row', panes: [], focusId: null }],
          activeGroupId: 'g1',
        },
      ],
      // open workspaces as tabs in the hub
      openTabs: ['aurora-api', 'dash-web'],
    };
  }

  let state = defaultState();
  const listeners = new Set();

  const Store = {
    get() { return state; },
    set(next) {
      state = typeof next === 'function' ? next(state) : { ...state, ...next };
      listeners.forEach((cb) => cb(state));
    },
    subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },

    // helpers
    activeWorkspace() { return state.workspaces.find((w) => w.id === state.activeWorkspaceId); },
    workspace(id) { return state.workspaces.find((w) => w.id === id); },

    openWorkspace(id) {
      Store.set((s) => ({
        ...s,
        activeWorkspaceId: id,
        openTabs: s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id],
      }));
    },
    closeWorkspace(id) {
      Store.set((s) => {
        const tabs = s.openTabs.filter((t) => t !== id);
        return {
          ...s,
          openTabs: tabs,
          activeWorkspaceId: s.activeWorkspaceId === id ? (tabs[0] || s.workspaces[0]?.id) : s.activeWorkspaceId,
        };
      });
    },
    setActiveGroup(workspaceId, groupId) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id === workspaceId ? { ...w, activeGroupId: groupId } : w),
      }));
    },
    addGroup(workspaceId) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => {
          if (w.id !== workspaceId) return w;
          const g = { id: `g${Date.now()}`, name: `Group ${w.groups.length + 1}`, color: 'var(--pri)', dir: 'row', panes: [], focusId: null };
          return { ...w, groups: [...w.groups, g], activeGroupId: g.id };
        }),
      }));
    },
    closeGroup(workspaceId, groupId) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => {
          if (w.id !== workspaceId) return w;
          let groups = w.groups.filter((g) => g.id !== groupId);
          if (groups.length === 0) groups = [{ id: 'g1', name: 'Group 1', color: 'var(--pri)', dir: 'row', panes: [], focusId: null }];
          return { ...w, groups, activeGroupId: w.activeGroupId === groupId ? groups[0].id : w.activeGroupId };
        }),
      }));
    },
    renameGroup(workspaceId, groupId, name) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id !== workspaceId ? w : {
          ...w, groups: w.groups.map((g) => g.id === groupId ? { ...g, name } : g),
        }),
      }));
    },
    setGroupColor(workspaceId, groupId, color) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id !== workspaceId ? w : {
          ...w, groups: w.groups.map((g) => g.id === groupId ? { ...g, color } : g),
        }),
      }));
    },
    setWorkspaceColor(workspaceId, color) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id === workspaceId ? { ...w, color } : w),
      }));
    },
    renameWorkspace(workspaceId, name) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id === workspaceId ? { ...w, name } : w),
      }));
    },
    addPane(workspaceId, groupId, template, repo, which) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => {
          if (w.id !== workspaceId) return w;
          return {
            ...w,
            groups: w.groups.map((g) => {
              if (g.id !== groupId) return g;
              const np = window.mkPane(template, repo);
              const idx = g.panes.findIndex((p) => p.id === g.focusId);
              const at = idx < 0 ? g.panes.length : idx + 1;
              const newDir = which === 'down' ? 'column' : which === 'right' ? 'row' : (template === 'shell' ? 'column' : 'row');
              return { ...g, dir: newDir, panes: [...g.panes.slice(0, at), np, ...g.panes.slice(at)], focusId: np.id };
            }),
          };
        }),
      }));
    },
    closePane(workspaceId, groupId, paneId) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => {
          if (w.id !== workspaceId) return w;
          return {
            ...w,
            groups: w.groups.map((g) => {
              if (g.id !== groupId) return g;
              const panes = g.panes.filter((p) => p.id !== paneId);
              return { ...g, panes, focusId: panes[0]?.id || null };
            }),
          };
        }),
      }));
    },
    setPaneFocus(workspaceId, groupId, paneId) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id !== workspaceId ? w : {
          ...w, groups: w.groups.map((g) => g.id !== groupId ? g : { ...g, focusId: paneId }),
        }),
      }));
    },
    setPaneColor(workspaceId, groupId, paneId, color) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id !== workspaceId ? w : {
          ...w, groups: w.groups.map((g) => g.id !== groupId ? g : {
            ...g, panes: g.panes.map((p) => p.id === paneId ? { ...p, color } : p),
          }),
        }),
      }));
    },
    setPaneModel(workspaceId, groupId, paneId, model) {
      Store.set((s) => ({
        ...s,
        workspaces: s.workspaces.map((w) => w.id !== workspaceId ? w : {
          ...w, groups: w.groups.map((g) => g.id !== groupId ? g : {
            ...g, panes: g.panes.map((p) => p.id === paneId ? { ...p, model } : p),
          }),
        }),
      }));
    },
    createWorkspace({ name, repos, container, containerSize }) {
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const w = {
        id, name,
        color: 'var(--a-claude)',
        container, containerSize,
        repos,
        lastOpened: 'just now',
        groups: [{ id: 'g1', name: 'Default', color: 'var(--pri)', dir: 'row', panes: [], focusId: null }],
        activeGroupId: 'g1',
      };
      Store.set((s) => ({
        ...s,
        workspaces: [...s.workspaces, w],
        activeWorkspaceId: id,
        openTabs: [...s.openTabs, id],
      }));
      return id;
    },
  };

  // useStore hook
  function useStore(selector) {
    const [, setTick] = React.useState(0);
    React.useEffect(() => Store.subscribe(() => setTick((t) => t + 1)), []);
    return selector ? selector(state) : state;
  }

  window.Store = Store;
  window.useStore = useStore;
})();
