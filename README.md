# Aviary

A home for your AI coding agents.

Tauri desktop app that runs **Claude Code**, **Codex**, and **Antigravity** CLIs inside a single sandboxed Docker container, multiplexed via tmux. Each tab in the window = one tmux session = one agent. Aviary spawns and manages the container itself — no `docker compose` step.

## Why

Running multiple agent CLIs locally is messy: separate terminals, separate auth, no unified view, no isolation. Aviary cages each agent in its own tmux session inside one container, and gives you a single window to switch between them.

## Architecture

```
+-----------------------------------+
|  Tauri webview (xterm.js, vite)   |
|    tabs <-> panes <-> terminals   |
+----------------+------------------+
                 | IPC (invoke / event)
+----------------v------------------+
|  Rust backend (tokio)             |
|    Lifecycle   -- image + ctr     |
|    DockerClient -- exec / streams |
|    PtyRegistry  -- pane_id map    |
+----------------+------------------+
                 | unix:///var/run/docker.sock
+----------------v------------------+
|  aviary-runtime container         |
|    claude / codex / antigravity   |
|    tmux server (idle)             |
+-----------------------------------+
```

Boot sequence:
1. App launch -> `Lifecycle::ensure_runtime` spawned in background.
2. Pull `mutlupolatcan/aviary-runtime:<version>` if missing (~10-20s first run).
3. Create container with volume mounts under `~/Library/Application Support/aviary/`.
4. Frontend listens on `aviary://lifecycle` events for state transitions.
5. Once `running`, frontend calls `list_sessions` and restores existing tmux tabs.

Per-session lifecycle (when user clicks **+**):
1. CLI picker modal (Claude / Codex / Antigravity).
2. `create_session(name, cli)` -> `docker exec aviary-runtime tmux new-session -d -s <name> <cli>`.
3. `attach_session(name, cols, rows)` -> bollard `exec` with `tty=true` running `tmux attach -t <name>`, returns `pane_id`.
4. Output streamed to webview via `pty://data/<pane_id>` events.
5. Webview keystrokes flow back via `pty_write`. Resize via `pty_resize`.

## Runtime image

Lives in `runtime/`. See `runtime/README.md` for build and publish instructions.

## Prerequisites

- Rust toolchain (`rustup`, stable)
- Node 20+
- Docker Desktop running
- macOS / Linux (Windows untested)

## Setup

```bash
cd /Users/mutlu.polatcan/aviary
npm install

# Build runtime image locally (or wait for app to pull from registry)
docker build -t mutlupolatcan/aviary-runtime:0.1.0 runtime/

# Dev mode (hot reload frontend, rebuild Rust on change)
npm run tauri dev
```

Override defaults:

| Env var | Purpose | Default |
|---|---|---|
| `AVIARY_CONTAINER` | Container name | `aviary-runtime` |
| `AVIARY_IMAGE` | Image tag to use | `mutlupolatcan/aviary-runtime:0.1.0` |
| `AVIARY_NETWORK_MODE` | Docker network mode | `bridge` |
| `CLAUDE_CODE_OAUTH_TOKEN` | Skip `/login` in Claude Code | unset |

## Production build

```bash
npm run tauri build
```

Bundles a `.dmg` on macOS, `.AppImage`/`.deb` on Linux. Output at `src-tauri/target/release/bundle/`.

## Volume layout

Aviary stores all state under the OS app-data dir.

| Host path (macOS) | Container path | Purpose |
|---|---|---|
| `~/Library/Application Support/com.mutlupolatcan.aviary/config` | `/config` | Per-CLI auth state |
| `~/Library/Application Support/com.mutlupolatcan.aviary/workspace` | `/workspace` | Project files |

## Roadmap

- macOS Keychain for OAuth token storage (`security-framework` crate).
- Bell-character detection -> native notification when an agent finishes.
- Split panes (tmux split-window), copy mode keybindings, session rename.
- Multiple workspaces (one container per workspace dir).
- Auto-update via Tauri updater plugin.
- Icon set (cage grid + bird silhouette).
