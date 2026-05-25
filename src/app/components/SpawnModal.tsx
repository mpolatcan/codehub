import type { Cli, Mode } from "../lib/ipc";
import { useLauncher } from "../lib/launcher";
import { useStore } from "../lib/store";
import { SpawnDialog } from "../screens/SpawnDialog";

// The single agent-creation modal, shared by every launch surface (sidebar
// "New agent", tab "+", pane split control, ⌘N / ⌘T). Driven entirely by the
// useLauncher store: any surface calls `open(key, ctx)`, and this host renders
// the full SpawnDialog over the whole window. The launch context decides the
// action — a split context (`ctx.session`) splits that pane; otherwise a fresh
// workspace tab is opened. Replaces the per-surface anchored popovers so the
// rich dialog (agent · mode · account · repo · container · prompt) is the one
// agent-creation UX everywhere.
export function SpawnModal() {
  const openKey = useLauncher((s) => s.openKey);
  const ctx = useLauncher((s) => s.ctx);
  const close = useLauncher((s) => s.close);
  const newPlate = useStore((s) => s.newPlate);
  const splitSession = useStore((s) => s.splitSession);
  const addPaneToGroup = useStore((s) => s.addPaneToGroup);
  const defaultCli = useStore((s) => s.config?.defaultAgent ?? "claude");

  if (openKey === null) return null;
  const splitting = Boolean(ctx?.session);

  const launch = (cli: Cli, mode: Mode, prompt: string, account?: string) => {
    close();
    if (ctx?.session) void splitSession(ctx.session, ctx.dir, cli, mode, prompt, account);
    else if (ctx?.groupId && ctx.workspaceId)
      void addPaneToGroup(ctx.workspaceId, ctx.groupId, cli, mode, prompt, account);
    else void newPlate(cli, mode, undefined, prompt, account);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50 }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
    >
      <SpawnDialog
        defaultCli={defaultCli}
        splitting={splitting}
        onLaunch={launch}
        onCancel={close}
      />
    </div>
  );
}
