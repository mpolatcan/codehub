# Aviary Runtime Image

Container image bundling AI coding CLIs that Aviary multiplexes via tmux.

## CLIs included

- **Claude Code** (Anthropic) — native binary, `/root/.local/bin/claude`
- **Codex** (OpenAI) — npm global, `codex`
- **Antigravity** (Google) — installer script, `antigravity`

## How it runs

The container does not run any CLI as PID 1. It idles on `tail -f /dev/null`. Aviary spawns tmux sessions inside it on demand via `docker exec -it aviary-runtime tmux ...`. The tmux server persists across exec invocations because they all attach to the same `TMUX_TMPDIR=/tmp/aviary` socket.

## Volume layout

| Host path (macOS) | Container path | Purpose |
|---|---|---|
| `~/Library/Application Support/aviary/config` | `/config` | Auth state for each CLI (`claude`, `codex`, `antigravity` subdirs) |
| `~/Library/Application Support/aviary/workspace` | `/workspace` | Project files visible to all CLIs |

## Building manually (dev)

```bash
docker build -t aviary-runtime:dev .
```

## Publishing release image

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t mutlupolatcan/aviary-runtime:0.1.0 \
  -t mutlupolatcan/aviary-runtime:latest \
  --push .
```

Aviary's `lifecycle.rs` pulls `mutlupolatcan/aviary-runtime:<aviary-version>` on first launch.
