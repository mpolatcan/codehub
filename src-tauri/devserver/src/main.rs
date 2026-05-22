//! Dev-only entrypoint: runs the HTTP + WS bridge so the frontend can be driven
//! from a browser against a live backend. This is its own workspace-member crate
//! (not a bin of the app package) so Tauri's bundler never tries to ship it.
//! Use `make dev-web`, or `cargo run -p codehub-devserver` from `src-tauri`.

#[tokio::main]
async fn main() {
    codehub_lib::devserver::serve().await;
}
