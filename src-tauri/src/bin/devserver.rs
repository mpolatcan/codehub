//! Dev-only entrypoint: runs the HTTP + WS bridge so the frontend can be driven
//! from a browser against a live backend. Built only with `--features devserver`
//! (see Cargo.toml `[[bin]]` required-features). Use `make dev-web`.

#[tokio::main]
async fn main() {
    aviary_lib::devserver::serve().await;
}
