//! macOS Dynamic Island — controller for the out-of-process `.accessory` helper.
//!
//! The island is NOT an in-process window anymore. A `.regular` Dock app (the
//! main CodeHub process) cannot float a window over ANOTHER app's full-screen
//! Space with public AppKit alone — activation policy is per-process, and the
//! flags (`CanJoinAllSpaces | Stationary | FullScreenAuxiliary`) are necessary
//! but not sufficient while the owning process is `.regular`. So the island is
//! hosted by a separate UIElement (`.accessory`) helper binary
//! (`codehub-island-helper`, a workspace member) whose own window CAN overlay
//! other apps' full-screen Spaces. The main app stays `.regular` (keeps its Dock
//! icon + normal window).
//!
//! This module owns the Rust side of that helper: spawn/stop the process, a
//! local-loopback TCP channel that streams the live activity feed to it and
//! receives row-click events back, and the same `present`/`dismiss`/`resize`/
//! `toggle`/`destroy` API the rest of the app already calls (so the command +
//! shortcut + setup call sites are unchanged).
//!
//! The helper renders the SAME `#/island` React route in a `WKWebView` — in dev
//! it loads the Vite URL, in a release bundle the `dist/` copied into the app's
//! Resources. Running outside Tauri, that webview takes the browser-mode bridge
//! transport; the helper injects a shim that feeds it the activity we stream and
//! routes clicks back over the socket. See `island-helper/src/main.rs`.
#![cfg(target_os = "macos")]

use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

use crate::lifecycle::ContainerState;
use crate::manager::LifecycleManager;
use crate::AppState;

/// The running helper process (killed on `destroy`/app exit).
static CHILD: Mutex<Option<Child>> = Mutex::new(None);
/// Sender for the loopback socket loop (drops when the helper stops).
static SENDER: Mutex<Option<tokio::sync::mpsc::UnboundedSender<IslandMessage>>> = Mutex::new(None);
/// Cross-thread mirror of whether the island is currently on screen.
static VISIBLE: AtomicBool = AtomicBool::new(false);

/// Messages streamed to the helper over the loopback socket (newline-JSON).
#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum IslandMessage {
    /// Live feed snapshot: `{ activity, prompts }`.
    Activity { payload: serde_json::Value },
    /// Show + raise at the notch.
    Present,
    /// Hide (orderOut) without killing the process.
    Dismiss,
    /// Resize to the React content size.
    Resize { width: f64, height: f64 },
}

/// Whether the island is on screen. Safe from any thread.
pub fn is_visible() -> bool {
    VISIBLE.load(Ordering::Relaxed)
}

/// Show + raise the island at the notch, spawning the helper if needed.
/// Idempotent: a second call just re-presents the live helper.
pub fn present(app: &AppHandle) {
    if let Err(e) = start(app) {
        tracing::warn!("island present failed: {e}");
    }
}

/// Hide the island without killing the helper — it keeps streaming so it can
/// re-present on the next event.
pub fn dismiss(_app: &AppHandle) {
    send(IslandMessage::Dismiss);
    VISIBLE.store(false, Ordering::Relaxed);
}

/// Resize to the React content size (re-anchoring the top at the notch).
pub fn resize(_app: &AppHandle, w: f64, h: f64) {
    send(IslandMessage::Resize {
        width: w,
        height: h,
    });
}

/// Tear the helper down (master disable). `present` respawns it on re-enable.
pub fn destroy(_app: &AppHandle) {
    stop();
}

/// Show when hidden, hide when visible. Backs the global ⌘⇧J shortcut.
pub fn toggle(app: &AppHandle) {
    if is_visible() {
        dismiss(app);
    } else {
        present(app);
    }
}

// ── Process + socket plumbing ───────────────────────────────────────────────

fn is_running() -> bool {
    CHILD.lock().map(|g| g.is_some()).unwrap_or(false)
}

fn send(msg: IslandMessage) {
    if let Ok(guard) = SENDER.lock() {
        if let Some(tx) = guard.as_ref() {
            let _ = tx.send(msg);
        }
    }
}

fn stop() {
    if let Ok(mut guard) = SENDER.lock() {
        if let Some(tx) = guard.take() {
            let _ = tx.send(IslandMessage::Dismiss);
        }
    }
    if let Ok(mut guard) = CHILD.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
    VISIBLE.store(false, Ordering::Relaxed);
}

/// Spawn the helper (if not already running) and present it. Binds an ephemeral
/// loopback port, hands it to the helper via env, and pumps the live feed over
/// the accepted connection.
fn start(app: &AppHandle) -> Result<(), String> {
    if is_running() {
        send(IslandMessage::Present);
        VISIBLE.store(true, Ordering::Relaxed);
        return Ok(());
    }

    let std_listener = std::net::TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = std_listener.local_addr().map_err(|e| e.to_string())?.port();
    std_listener
        .set_nonblocking(true)
        .map_err(|e| e.to_string())?;

    let helper = binary_path()?;
    let frontend = frontend_path(app);
    let child = Command::new(helper)
        .env("CODEHUB_ISLAND_PORT", port.to_string())
        .env("CODEHUB_ISLAND_FRONTEND", frontend)
        .env("CODEHUB_PARENT_PID", std::process::id().to_string())
        .spawn()
        .map_err(|e| e.to_string())?;

    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<IslandMessage>();
    *CHILD.lock().map_err(|e| e.to_string())? = Some(child);
    *SENDER.lock().map_err(|e| e.to_string())? = Some(tx.clone());

    let state = app.state::<AppState>();
    let registry = state.registry.clone();
    let events = state.events.clone();
    let manager = state.manager.clone();
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        // `from_std` must run INSIDE the tokio reactor (this task) — `start` is
        // called from the Tauri setup hook on the main thread, where no runtime is
        // entered, so doing it in the sync caller aborts ("no reactor running").
        let Ok(listener) = tokio::net::TcpListener::from_std(std_listener) else {
            return;
        };
        let Ok((stream, _addr)) = listener.accept().await else {
            return;
        };
        let (read, mut write) = stream.into_split();
        let mut reader = BufReader::new(read);
        let mut interval = tokio::time::interval(Duration::from_millis(700));
        // The activity snapshot can carry GHOSTS (closed panes, replayed event
        // files) until the backend prune catches up. The in-app island drops them
        // by intersecting with the live tmux list (`ipc.listSessions`); the helper
        // webview can't reach tmux, so we MUST stream the live set ourselves —
        // otherwise the helper's bridge shim fabricates the session list from the
        // activity feed and every ghost renders as a row (a notch full of stale
        // "Claude 1" duplicates). Refreshed on its own slow cadence (the tmux ls
        // fan-out costs the same as the prune loop; don't run it every 700ms).
        let mut live_interval = tokio::time::interval(Duration::from_secs(3));
        let mut live: Vec<String> = live_tmux_sessions(&manager).await;
        loop {
            let mut line = String::new();
            tokio::select! {
                _ = interval.tick() => {
                    let sessions: Vec<serde_json::Value> = live
                        .iter()
                        .map(|name| serde_json::json!({ "name": name }))
                        .collect();
                    let payload = serde_json::json!({
                        "activity": registry.activity().snapshot(),
                        "prompts": events.pending_prompts(),
                        "sessions": sessions,
                    });
                    if send_message(&mut write, &IslandMessage::Activity { payload }).await.is_err() {
                        break;
                    }
                },
                _ = live_interval.tick() => {
                    live = live_tmux_sessions(&manager).await;
                },
                message = rx.recv() => {
                    let Some(message) = message else { break; };
                    if send_message(&mut write, &message).await.is_err() {
                        break;
                    }
                },
                read = reader.read_line(&mut line) => {
                    match read {
                        Ok(0) => break,
                        Ok(_) => handle_line(&app, line.trim()),
                        Err(_) => break,
                    }
                },
            }
        }
    });

    let _ = tx.send(IslandMessage::Present);
    VISIBLE.store(true, Ordering::Relaxed);
    Ok(())
}

async fn send_message(
    write: &mut tokio::net::tcp::OwnedWriteHalf,
    message: &IslandMessage,
) -> Result<(), String> {
    let mut line = serde_json::to_string(message).map_err(|e| e.to_string())?;
    line.push('\n');
    write
        .write_all(line.as_bytes())
        .await
        .map_err(|e| e.to_string())
}

/// The live tmux session names across every RUNNING workspace container — the
/// same fan-out the prune loop uses (`prune_stale_activity_loop`). Streamed to the
/// helper so its island filters the activity feed to live sessions exactly like the
/// in-app island's `ipc.listSessions` intersect (drops replayed/ghost rows). A
/// daemon error yields an empty list for that cycle (the next refresh recovers).
async fn live_tmux_sessions(manager: &LifecycleManager) -> Vec<String> {
    let Ok(workspaces) = manager.list_workspace_containers().await else {
        return Vec::new();
    };
    let mut live = Vec::new();
    for wc in workspaces {
        if wc.status.state != ContainerState::Running {
            continue;
        }
        if let Ok(sessions) = manager
            .workspace_container(&wc.key)
            .docker_client()
            .list_tmux_sessions()
            .await
        {
            live.extend(sessions.into_iter().map(|s| s.name));
        }
    }
    live
}

/// A row-click from the helper: raise + focus the main window, then emit
/// `codehub://focus-session` so the app jumps to that session (mirrors the
/// companion's jump). Other line shapes are ignored.
fn handle_line(app: &AppHandle, line: &str) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
        return;
    };
    if value.get("type").and_then(|v| v.as_str()) != Some("session_click") {
        return;
    }
    if let Some(session) = value.get("session_name").and_then(|v| v.as_str()) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.unminimize();
            let _ = main.show();
            let _ = main.set_focus();
            let _ = main.emit("codehub://focus-session", session.to_string());
        }
    }
}

/// Locate the helper binary: next to the main executable (release bundle ships
/// it in `Contents/MacOS/` via `externalBin`; dev builds it into `target/<p>/`),
/// with a target-triple-suffixed fallback for the un-renamed sidecar name.
fn binary_path() -> Result<PathBuf, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "current executable has no parent directory".to_string())?;
    let bundled = dir.join("codehub-island-helper");
    if bundled.exists() {
        return Ok(bundled);
    }
    let triple = match std::env::consts::ARCH {
        "aarch64" => "aarch64-apple-darwin",
        "x86_64" => "x86_64-apple-darwin",
        _ => "",
    };
    if !triple.is_empty() {
        let sidecar = dir.join(format!("codehub-island-helper-{triple}"));
        if sidecar.exists() {
            return Ok(sidecar);
        }
    }
    Ok(bundled)
}

/// Where the helper should load the `#/island` route from. Dev → the live Vite
/// server; release → the `dist/` copied into the app's Resources (the helper
/// turns a filesystem path into a `file://…#/island` URL it can read).
fn frontend_path(app: &AppHandle) -> String {
    #[cfg(debug_assertions)]
    {
        let _ = app;
        "http://127.0.0.1:1420/".to_string()
    }
    #[cfg(not(debug_assertions))]
    {
        app.path()
            .resolve("dist/index.html", tauri::path::BaseDirectory::Resource)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default()
    }
}
