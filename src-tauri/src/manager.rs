//! Per-workspace container manager (per-workspace-container architecture).
//!
//! Historically CodeHub ran ONE shared runtime container (`codehub-runtime`)
//! with N tmux sessions = N workspaces. That made per-workspace resource data
//! (cpu/mem/net/disk/state) impossible to report honestly — every workspace
//! shared one cgroup. The manager moves us toward one container PER workspace
//! (`codehub-ws-<key>`), so the hub's fleet view becomes REAL data rather than a
//! fabrication.
//!
//! Gated by the `CODEHUB_PER_WORKSPACE_CONTAINER` flag, now **default ON**: the
//! IPC commands + frontend resolve per-workspace lifecycles and the close/restart
//! lifecycle scenarios are verified end-to-end. Set the flag to an off-value
//! (`0`/`false`/`off`/`no`) to fall back to the single shared runtime.
//!
//! The manager connects to the daemon ONCE and shares that `Docker` handle
//! across every `Lifecycle` it produces (cheap clones), caching one `Lifecycle`
//! per resolved container name.

use crate::config::ConfigStore;
use crate::docker::{DockerClient, SessionInfo};
use crate::lifecycle::{ContainerState, ContainerStatus, Lifecycle, LifecycleError};
use bollard::container::ListContainersOptions;
use bollard::Docker;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Docker label keys that mark a container as a CodeHub-managed per-workspace
/// container and record its original workspace key. Written at create-time in
/// `Lifecycle::ensure_container`; read back by `list_workspace_containers`.
const LABEL_MANAGED: &str = "codehub.managed";
const LABEL_WORKSPACE: &str = "codehub.workspace";

/// One CodeHub-managed per-workspace container: its workspace key plus a
/// `ContainerStatus` derived from the SINGLE `list_containers` sweep (no extra
/// per-container `status()` round-trips). Backs the fleet/Workspaces inspector.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceContainer {
    /// Original workspace key (the `codehub.workspace` label).
    pub key: String,
    /// State + id + image + name, same shape every other container surface uses.
    pub status: ContainerStatus,
}

/// Map a docker `state` string (from `list_containers`) to our `ContainerState`,
/// mirroring `Lifecycle::status`. A listed container always exists, so `Missing`
/// / `Unreachable` never apply here.
fn map_list_state(s: Option<&str>) -> ContainerState {
    match s {
        Some("running") => ContainerState::Running,
        Some("restarting") => ContainerState::Starting,
        _ => ContainerState::Stopped,
    }
}

/// Prefix for per-workspace container names: `codehub-ws-<sanitized-key>`.
pub const WS_CONTAINER_PREFIX: &str = "codehub-ws-";

/// Reads the `CODEHUB_PER_WORKSPACE_CONTAINER` flag. Default ON now that the full
/// per-workspace path (commands + frontend + lifecycle scenarios) is wired and
/// verified; the falsey spellings let users opt back into the single shared
/// runtime. Unset or empty == default (ON); only an explicit off-value disables.
pub fn per_workspace_enabled() -> bool {
    match std::env::var("CODEHUB_PER_WORKSPACE_CONTAINER") {
        Ok(v) => !matches!(
            v.trim().to_ascii_lowercase().as_str(),
            "0" | "false" | "off" | "no"
        ),
        Err(_) => true,
    }
}

/// FNV-1a 64-bit hash. A FIXED algorithm (implemented inline, no dependency) so
/// the value is stable across process runs AND Rust/toolchain versions —
/// container identity must survive app upgrades, which rules out `DefaultHasher`
/// (its algorithm is explicitly allowed to change between releases, which would
/// orphan every existing per-workspace container after an upgrade).
fn fnv1a_64(s: &str) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in s.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

/// Coerce an arbitrary workspace key into a UNIQUE, valid Docker container-name
/// segment. Docker names must match `[a-zA-Z0-9][a-zA-Z0-9_.-]*`.
///
/// The readable slug (lowercase, non-alphanumerics collapsed to single `-`,
/// trimmed, capped) is LOSSY — `hello_world`, `hello-world` and `Hello World!`
/// all slug to `hello-world`, and empty/separator-only keys slug to nothing — so
/// the slug alone cannot be the identity without colliding distinct workspaces
/// onto one container (shared mount + tmux sessions). We therefore append a hash
/// of the FULL ORIGINAL key: `<slug>-<fnv1a_hex>` (or just the hash when the slug
/// is empty). Distinct keys get distinct names; the slug is human-facing garnish.
pub fn sanitize_key(key: &str) -> String {
    let mut slug = String::with_capacity(key.len());
    let mut prev_dash = false;
    for ch in key.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
            prev_dash = false;
        } else if !prev_dash {
            // collapse any run of separators / invalid bytes to a single `-`
            slug.push('-');
            prev_dash = true;
        }
    }
    // Cap the readable part, then trim separators the cap or scan may have left
    // at either end so the segment still starts/ends on an alphanumeric.
    let slug: String = slug.chars().take(32).collect();
    let slug = slug.trim_matches('-');
    let hash = fnv1a_64(key);
    if slug.is_empty() {
        format!("{hash:016x}")
    } else {
        format!("{slug}-{hash:016x}")
    }
}

pub struct LifecycleManager {
    docker: Docker,
    image: String,
    config_dir: PathBuf,
    default_workspace_dir: PathBuf,
    config: Arc<ConfigStore>,
    /// Shared-runtime container name (`codehub-runtime`), used for the default
    /// lifecycle and whenever per-workspace mode is off.
    default_container: String,
    /// Cache keyed by resolved container name → its `Lifecycle`.
    cache: Mutex<HashMap<String, Arc<Lifecycle>>>,
}

impl LifecycleManager {
    /// Connect to the daemon once and build the manager. Mirrors the args the
    /// old single `Lifecycle::new` took, plus owns the shared `Docker` handle.
    pub fn new(
        default_container: String,
        image: String,
        config_dir: PathBuf,
        default_workspace_dir: PathBuf,
        config: Arc<ConfigStore>,
    ) -> Result<Self, LifecycleError> {
        let docker = Docker::connect_with_local_defaults()?;
        Ok(Self {
            docker,
            image,
            config_dir,
            default_workspace_dir,
            config,
            default_container,
            cache: Mutex::new(HashMap::new()),
        })
    }

    /// Container name for a per-workspace key: `codehub-ws-<sanitized-key>`.
    pub fn container_name_for(&self, key: &str) -> String {
        format!("{WS_CONTAINER_PREFIX}{}", sanitize_key(key))
    }

    /// The shared-runtime lifecycle (`codehub-runtime`, config-driven mount). This
    /// is what every existing IPC command targets today; it is cached under its
    /// container name so repeated lookups share one `Lifecycle`.
    pub fn default(&self) -> Arc<Lifecycle> {
        self.get_or_build(self.default_container.clone(), None, None, false)
    }

    /// Resolve the lifecycle for a workspace `key`, applying the SESSION-routing
    /// flag fallback: when per-workspace mode is off this returns the shared
    /// default (so a session keyed `ws-x` lives in `codehub-runtime` unchanged).
    /// When on, it returns/caches a dedicated `codehub-ws-<key>` lifecycle.
    pub fn for_workspace(&self, key: &str, workspace_dir: Option<PathBuf>) -> Arc<Lifecycle> {
        if !per_workspace_enabled() {
            return self.default();
        }
        self.build_workspace(key, workspace_dir)
    }

    /// Build/cache a per-workspace container lifecycle BY NAME, with NO flag
    /// fallback — the shared runtime is never returned. Used by the fleet /
    /// inspector commands (status/start/stop/restart/stats/.../remove) that act on
    /// ONE named container: falling back to the shared runtime would, e.g., stop
    /// `codehub-runtime` when the user clicks Stop on a workspace card, or when a
    /// stale per-workspace card lingers after the flag is turned off.
    pub fn workspace_container(&self, key: &str) -> Arc<Lifecycle> {
        self.build_workspace(key, None)
    }

    /// Shared construction for `for_workspace` / `workspace_container`. With NO
    /// explicit dir the container mounts the SAME effective workspace dir the
    /// shared runtime uses (`config.workspace_dir`, else the built-in default) —
    /// NOT a blank per-key subdir — so flag-on sessions see the user's actual
    /// repo. `override = None` lets `Lifecycle::workspace_dir()` resolve that
    /// config-driven path; `enforce = false` so passive resolves never recreate.
    /// An EXPLICIT per-tab dir (`Some`) is a deliberate mount choice → pinned and
    /// enforced (recreate a container bound elsewhere).
    fn build_workspace(&self, key: &str, workspace_dir: Option<PathBuf>) -> Arc<Lifecycle> {
        let name = self.container_name_for(key);
        let (dir, enforce) = match workspace_dir {
            Some(d) => (Some(d), true),
            None => (None, false),
        };
        self.get_or_build(name, dir, Some(key.to_string()), enforce)
    }

    /// Resolve by optional key WITH the session-routing flag fallback: `None` →
    /// shared default; `Some(key)` → `for_workspace`. For session commands
    /// (create/attach/kill/rename) where a key means the shared runtime when the
    /// flag is off.
    pub fn resolve(&self, key: Option<&str>, workspace_dir: Option<PathBuf>) -> Arc<Lifecycle> {
        match key {
            Some(k) => self.for_workspace(k, workspace_dir),
            None => self.default(),
        }
    }

    /// Resolve by optional key with NO flag fallback: `None` → shared default;
    /// `Some(key)` → that workspace's container BY NAME (see
    /// `workspace_container`). For inspector / lifecycle commands that must never
    /// act on the shared runtime by accident.
    pub fn resolve_container(&self, key: Option<&str>) -> Arc<Lifecycle> {
        match key {
            Some(k) => self.workspace_container(k),
            None => self.default(),
        }
    }

    fn get_or_build(
        &self,
        container_name: String,
        dir: Option<PathBuf>,
        label: Option<String>,
        enforce_mount: bool,
    ) -> Arc<Lifecycle> {
        let mut cache = self.cache.lock().expect("lifecycle cache poisoned");
        if let Some(existing) = cache.get(&container_name) {
            // A cache hit is only valid when BOTH the requested mount AND the
            // enforce-mount intent match the cached entry. Mount is part of a
            // lifecycle's identity (re-pointing at a new dir must rebuild, else
            // `workspace_dir()`/`recreate()` target the old mount). `enforce_mount`
            // must ALSO match: an EXPLICIT re-point (`enforce=true`) whose dir
            // happens to equal a cached entry left non-enforcing by a prior
            // passive resolve (start/restart, `enforce=false`) would otherwise be
            // served that entry and silently NOT recreate — dropping the explicit
            // mount request. Rebuild on either mismatch; identical requests (incl.
            // the always-`(None,false)` shared default) share the cached entry.
            if existing.workspace_dir_override == dir && existing.enforce_mount == enforce_mount {
                return existing.clone();
            }
        }
        let lifecycle = Arc::new(Lifecycle::from_parts(
            self.docker.clone(),
            container_name.clone(),
            self.image.clone(),
            self.config_dir.clone(),
            self.default_workspace_dir.clone(),
            self.config.clone(),
            dir,
            label,
            enforce_mount,
        ));
        cache.insert(container_name, lifecycle.clone());
        lifecycle
    }

    /// Enumerate every CodeHub-managed per-workspace container (label
    /// `codehub.managed=true`) with its workspace key + status. The key is the
    /// `codehub.workspace` label (the ORIGINAL workspace key); the container name
    /// alone can't yield it because `sanitize_key` is one-way. Includes stopped
    /// containers (`all: true`) so a closed-but-kept workspace is still listed
    /// (the Prune affordance removes them). Status is built from this one sweep —
    /// no extra per-container round-trips. Containers missing the workspace label
    /// are skipped.
    pub async fn list_workspace_containers(
        &self,
    ) -> Result<Vec<WorkspaceContainer>, LifecycleError> {
        // Flag off → no fleet. Returning leftovers would let the inspector show
        // per-workspace cards whose lifecycle controls fall back to the shared
        // runtime (for_workspace), so a Stop click could stop `codehub-runtime`.
        if !per_workspace_enabled() {
            return Ok(Vec::new());
        }
        let mut filters = HashMap::new();
        filters.insert("label".to_string(), vec![format!("{LABEL_MANAGED}=true")]);
        let containers = self
            .docker
            .list_containers(Some(ListContainersOptions::<String> {
                all: true,
                filters,
                ..Default::default()
            }))
            .await?;

        let mut out = Vec::new();
        for c in containers {
            let key = c
                .labels
                .as_ref()
                .and_then(|l| l.get(LABEL_WORKSPACE).cloned());
            let name = c
                .names
                .as_ref()
                .and_then(|n| n.first())
                .map(|s| s.trim_start_matches('/').to_string());
            let (Some(name), Some(key)) = (name, key) else {
                continue;
            };
            out.push(WorkspaceContainer {
                key,
                status: ContainerStatus {
                    state: map_list_state(c.state.as_deref()),
                    id: c.id.clone(),
                    image: c.image.clone().unwrap_or_else(|| self.image.clone()),
                    name,
                },
            });
        }
        Ok(out)
    }

    /// All tmux sessions across the shared runtime AND every per-workspace
    /// container, each tagged with the workspace key it belongs to (`None` for
    /// the shared runtime). When per-workspace mode is OFF, only the shared
    /// runtime is queried, so cost and behaviour are unchanged. A container that
    /// is down or has no sessions contributes nothing rather than failing the
    /// whole listing. This is what lets startup restore reconstruct each
    /// workspace's tab and re-tie its sessions to the right container.
    pub async fn list_all_sessions(&self) -> Result<Vec<SessionInfo>, LifecycleError> {
        let mut all = self
            .default()
            .docker_client()
            .list_tmux_sessions()
            .await
            .unwrap_or_default();

        if per_workspace_enabled() {
            // Resilient like the shared sweep above: a transient listing error
            // (daemon hiccup) must not throw away the sessions already collected
            // — restore what we can rather than failing the whole listing.
            for wc in self.list_workspace_containers().await.unwrap_or_default() {
                // Only running containers host a live tmux server; skip stopped
                // ones (they'd just error in require_running).
                if wc.status.state != ContainerState::Running {
                    continue;
                }
                let dc = DockerClient::from_docker(self.docker.clone(), wc.status.name);
                let mut sessions = dc.list_tmux_sessions().await.unwrap_or_default();
                for s in &mut sessions {
                    s.workspace = Some(wc.key.clone());
                }
                all.extend(sessions);
            }
        }
        Ok(all)
    }

    /// Remove a per-workspace container by key (Prune / explicit delete); a no-op
    /// when the container is already gone. Builds the lifecycle for the per-ws
    /// container NAME explicitly rather than via `for_workspace` — that one
    /// falls back to the SHARED runtime when the flag is off, so removing through
    /// it could nuke `codehub-runtime`. By name we always target `codehub-ws-…`.
    pub async fn remove_workspace(&self, key: &str) -> Result<(), LifecycleError> {
        // By NAME (no flag fallback) so removing never targets `codehub-runtime`.
        // `remove()` only reads status + force-removes — never ensures/creates.
        self.workspace_container(key).remove().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::ConfigStore;
    use std::sync::Arc;

    fn manager() -> LifecycleManager {
        // ConfigStore::load on a non-existent path yields defaults; the daemon
        // connection is lazy enough that construction succeeds without Docker.
        let config = Arc::new(ConfigStore::load(
            std::env::temp_dir().join("codehub-manager-test-settings.json"),
        ));
        LifecycleManager::new(
            "codehub-runtime".into(),
            "img:test".into(),
            std::env::temp_dir().join("codehub-test-config"),
            std::env::temp_dir().join("codehub-test-workspace"),
            config,
        )
        .expect("manager builds")
    }

    /// A sanitized key must be a valid Docker name segment: first char
    /// alphanumeric, rest from `[a-z0-9-]`, length within bounds.
    fn assert_valid_segment(s: &str) {
        assert!(!s.is_empty(), "segment must not be empty");
        assert!(s.len() <= 64, "segment too long: {s} ({})", s.len());
        let first = s.chars().next().unwrap();
        assert!(
            first.is_ascii_alphanumeric(),
            "must start alphanumeric: {s}"
        );
        assert!(
            s.chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-'),
            "invalid chars in segment: {s}"
        );
    }

    #[test]
    fn sanitize_key_produces_valid_docker_segments() {
        for k in [
            "ws-aurora-lq3k9",
            "Hello World!",
            "///",
            "",
            &"x".repeat(200),
        ] {
            assert_valid_segment(&sanitize_key(k));
        }
        // human-readable slug is preserved as a prefix
        assert!(sanitize_key("ws-aurora-lq3k9").starts_with("ws-aurora-lq3k9-"));
        // deterministic across calls (stable container identity)
        assert_eq!(sanitize_key("aurora"), sanitize_key("aurora"));
    }

    // The slug is lossy, so identity rests on the appended hash of the full key:
    // distinct keys that slug identically must STILL produce distinct names, or
    // two workspaces would collide onto one container (shared mount + sessions).
    #[test]
    fn sanitize_key_never_collides_distinct_keys() {
        let colliding = ["hello_world", "hello-world", "hello.world", "Hello World!"];
        let names: std::collections::HashSet<_> =
            colliding.iter().map(|k| sanitize_key(k)).collect();
        assert_eq!(
            names.len(),
            colliding.len(),
            "lossy slugs collided: {names:?}"
        );
        // empty/separator-only keys must not collide with each other or a real key
        assert_ne!(sanitize_key(""), sanitize_key("///"));
        assert_ne!(sanitize_key(""), sanitize_key("ws"));
    }

    #[test]
    fn container_name_uses_ws_prefix() {
        let m = manager();
        let name = m.container_name_for("aurora");
        assert!(name.starts_with("codehub-ws-aurora-"), "got {name}");
        assert!(name.len() <= 255);
    }

    #[test]
    fn default_lifecycle_is_cached_and_shared() {
        let m = manager();
        let a = m.default();
        let b = m.default();
        assert!(Arc::ptr_eq(&a, &b), "default lifecycle should be cached");
        assert_eq!(a.container_name, "codehub-runtime");
        assert!(a.workspace_dir_override.is_none());
        // the shared runtime carries no workspace label (no single identity)
        assert!(a.workspace_label.is_none());
    }

    // Both flag states are asserted in ONE test: the flag is a process-global
    // env var, so splitting off/on across two tests would race under the
    // parallel harness.
    #[test]
    fn for_workspace_honours_the_per_workspace_flag() {
        // flag explicitly OFF → shared default container. (Default is now ON, so
        // we set an off-value rather than unset to exercise the disabled path.)
        // SAFETY: process-global env mutation; serialized within this test.
        unsafe {
            std::env::set_var("CODEHUB_PER_WORKSPACE_CONTAINER", "off");
        }
        let m = manager();
        assert_eq!(
            m.for_workspace("aurora", None).container_name,
            "codehub-runtime",
            "flag off → shared default container"
        );

        // flag ON → dedicated codehub-ws-<key> container
        unsafe {
            std::env::set_var("CODEHUB_PER_WORKSPACE_CONTAINER", "1");
        }
        let ws = m.for_workspace("aurora", None);
        assert_eq!(ws.container_name, m.container_name_for("aurora"));
        assert!(ws.container_name.starts_with("codehub-ws-aurora-"));
        // the ORIGINAL key is preserved as the workspace label (→ container
        // label → recoverable by restore, unlike the one-way container name)
        assert_eq!(ws.workspace_label.as_deref(), Some("aurora"));
        // No explicit dir → no override: the container mounts the SAME effective
        // workspace dir the shared runtime uses (config-driven), NOT a per-key
        // subdir, so flag-on sessions see the user's actual repo. Not enforced.
        assert!(ws.workspace_dir_override.is_none());
        assert!(!ws.enforce_mount);
        // cached: a second resolve returns the same Arc
        assert!(Arc::ptr_eq(&ws, &m.for_workspace("aurora", None)));
        // workspace_container resolves the SAME entry by name (no flag fallback)
        assert!(Arc::ptr_eq(&ws, &m.workspace_container("aurora")));

        // re-pointing the SAME workspace at a different dir must NOT return the
        // stale lifecycle — the mount is part of identity, so the cache rebuilds
        // (else workspace_dir()/recreate() would target the old mount).
        let a = m.for_workspace("borealis", Some(PathBuf::from("/tmp/a")));
        assert_eq!(
            a.workspace_dir_override.as_deref(),
            Some(PathBuf::from("/tmp/a").as_path())
        );
        let b = m.for_workspace("borealis", Some(PathBuf::from("/tmp/b")));
        assert!(
            !Arc::ptr_eq(&a, &b),
            "changed mount must rebuild the lifecycle"
        );
        assert_eq!(
            b.workspace_dir_override.as_deref(),
            Some(PathBuf::from("/tmp/b").as_path())
        );
        // identical re-request shares the (now-current) cached entry
        assert!(Arc::ptr_eq(
            &b,
            &m.for_workspace("borealis", Some(PathBuf::from("/tmp/b")))
        ));

        // An EXPLICIT re-point must not be served a cached NON-enforcing entry.
        // A passive resolve (None → config-driven dir, override None,
        // enforce=false) then an explicit resolve (Some dir, enforce=true) must
        // REBUILD — otherwise the explicit mount request is silently dropped and
        // ensure_container would skip the recreate.
        let passive = m.for_workspace("cobalt", None);
        assert!(!passive.enforce_mount, "defaulted dir → not enforced");
        assert!(passive.workspace_dir_override.is_none());
        let explicit_dir = PathBuf::from("/tmp/cobalt-explicit");
        let explicit = m.for_workspace("cobalt", Some(explicit_dir.clone()));
        assert!(explicit.enforce_mount, "explicit dir → enforced");
        assert!(
            !Arc::ptr_eq(&passive, &explicit),
            "explicit re-point must rebuild, not reuse the non-enforcing cache entry"
        );
        assert_eq!(
            explicit.workspace_dir_override.as_deref(),
            Some(explicit_dir.as_path())
        );

        unsafe {
            std::env::remove_var("CODEHUB_PER_WORKSPACE_CONTAINER");
        }
    }
}
