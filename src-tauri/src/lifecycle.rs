use crate::config::ConfigStore;
use crate::docker::DockerClient;
use bollard::container::{
    Config, CreateContainerOptions, InspectContainerOptions, ListContainersOptions,
    RemoveContainerOptions, StartContainerOptions, StopContainerOptions,
};
use bollard::image::CreateImageOptions;
use bollard::models::{HostConfig, Mount, MountTypeEnum, PortBinding};
use bollard::Docker;
use futures_util::StreamExt;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum LifecycleError {
    #[error("bollard: {0}")]
    Bollard(#[from] bollard::errors::Error),
    #[error("docker daemon unreachable — is Docker Desktop running?")]
    DaemonDown,
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContainerState {
    Missing,
    Stopped,
    Starting,
    Running,
    Unreachable,
}

#[derive(Debug, Serialize, Clone)]
pub struct ContainerStatus {
    pub state: ContainerState,
    pub id: Option<String>,
    pub image: String,
    pub name: String,
}

// Host auth env vars each CLI can authenticate from, in priority order. Keys are
// read from the host environment and forwarded into the runtime container —
// CodeHub never stores them (see BACKEND_PLAN.md). The empty-state / settings
// "key status" reports presence only and must NEVER surface the value.
const CLAUDE_VARS: &[&str] = &["CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY"];
const CODEX_VARS: &[&str] = &["OPENAI_API_KEY"];
const ANTIGRAVITY_VARS: &[&str] = &["GOOGLE_API_KEY", "GEMINI_API_KEY"];

fn all_auth_vars() -> impl Iterator<Item = &'static str> {
    CLAUDE_VARS
        .iter()
        .chain(CODEX_VARS)
        .chain(ANTIGRAVITY_VARS)
        .copied()
}

/// `KEY=value` pairs for every known auth var present on the host, forwarded
/// verbatim into the container so each CLI reads the name it expects. Values are
/// never logged.
pub fn auth_env() -> Vec<String> {
    auth_env_with(&[])
}

/// Like [`auth_env`] but also forwards any `extra` env var NAMES present on the
/// host — used to carry custom-named account-profile credentials (e.g.
/// `CLAUDE_TOKEN_WORK`) into the container so a session can remap the CLI's
/// canonical var to one of them by NAME, without the value ever appearing on a
/// command line. Names are deduped against the built-in set. Values never logged.
pub fn auth_env_with(extra: &[String]) -> Vec<String> {
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut out = Vec::new();
    let builtin = all_auth_vars().map(|s| s.to_string());
    for v in builtin.chain(extra.iter().cloned()) {
        if !seen.insert(v.clone()) {
            continue;
        }
        // Presence probe binds the value only to forward it; never logged.
        if let Ok(val) = std::env::var(&v) {
            out.push(format!("{v}={val}"));
        }
    }
    out
}

/// Presence-only auth status for one CLI. Carries which env var satisfied it by
/// NAME only — never the value. Serialized to the frontend as-is.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeyStatus {
    pub present: bool,
    /// Always "env": keys come from the host environment, not a keychain.
    pub source: &'static str,
    /// Name of the env var that satisfied the check, if any. Name only.
    pub var_name: Option<String>,
}

fn key_status_for(vars: &[&str]) -> KeyStatus {
    for v in vars {
        // Presence probe only — `is_ok()` never binds the secret value.
        if std::env::var(v).is_ok() {
            return KeyStatus {
                present: true,
                source: "env",
                var_name: Some((*v).to_string()),
            };
        }
    }
    KeyStatus {
        present: false,
        source: "env",
        var_name: None,
    }
}

/// Per-CLI presence of a host auth key. Reports booleans + var names only.
pub fn agent_key_status() -> HashMap<String, KeyStatus> {
    HashMap::from([
        ("claude".to_string(), key_status_for(CLAUDE_VARS)),
        ("codex".to_string(), key_status_for(CODEX_VARS)),
        ("antigravity".to_string(), key_status_for(ANTIGRAVITY_VARS)),
    ])
}

/// Docker daemon reachability + version, for the empty-state pill and Settings.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DockerInfo {
    pub reachable: bool,
    pub version: Option<String>,
    pub api_version: Option<String>,
}

/// Build + host platform identity for the Settings "About" pane. Every field is
/// a compile-time crate constant or a `std::env::consts` value — nothing is
/// fabricated and there is no network/update check.
#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    /// Target OS, e.g. "macos", "linux", "windows".
    pub os: String,
    /// Target architecture, e.g. "aarch64", "x86_64".
    pub arch: String,
    /// OS family, e.g. "unix", "windows".
    pub family: String,
}

/// App + platform identity from build-time constants (no I/O, never fails).
pub fn app_info() -> AppInfo {
    AppInfo {
        name: env!("CARGO_PKG_NAME").to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        family: std::env::consts::FAMILY.to_string(),
    }
}

/// Where `/workspace` mounts from, and whether the container needs recreating to
/// pick up a changed choice. `mounted` is the host path the *running* container
/// actually has bound (from `docker inspect`); `effective` is what config selects
/// now. They differ after the user changes the workspace dir but before the
/// runtime is recreated — `needs_recreate` flags exactly that.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceInfo {
    /// Host dir config currently selects for `/workspace`.
    pub effective: String,
    /// Host dir the running container actually has bound, if any.
    pub mounted: Option<String>,
    /// True when a container exists and its bound dir differs from `effective`.
    pub needs_recreate: bool,
}

pub struct Lifecycle {
    pub docker: Docker,
    pub container_name: String,
    pub image: String,
    pub config_dir: PathBuf,
    /// Built-in per-user workspace dir, used when config selects none.
    pub default_workspace_dir: PathBuf,
    /// UI/config store; the effective workspace dir + account profiles are read
    /// from here at container-create time (Tier-2 / Tier-3).
    pub config: Arc<ConfigStore>,
}

impl Lifecycle {
    pub fn new(
        container_name: String,
        image: String,
        config_dir: PathBuf,
        default_workspace_dir: PathBuf,
        config: Arc<ConfigStore>,
    ) -> Result<Self, LifecycleError> {
        let docker = Docker::connect_with_local_defaults()?;
        Ok(Self {
            docker,
            container_name,
            image,
            config_dir,
            default_workspace_dir,
            config,
        })
    }

    /// Host directory to bind at `/workspace`: the config's `workspace_dir` when
    /// set and still an existing directory, otherwise the built-in default. A
    /// configured-but-missing dir falls back rather than failing the container
    /// create (the dir may live on an unmounted volume).
    pub fn workspace_dir(&self) -> PathBuf {
        match self.config.get().workspace_dir {
            Some(d) if std::path::Path::new(&d).is_dir() => PathBuf::from(d),
            _ => self.default_workspace_dir.clone(),
        }
    }

    /// Env var NAMES referenced by stored account profiles (Tier-3), so they get
    /// forwarded into the container at create-time. Names only — never values.
    fn profile_env_vars(&self) -> Vec<String> {
        self.config
            .get()
            .account_profiles
            .into_iter()
            .map(|p| p.var_name)
            .collect()
    }

    /// Single source of truth: returns the current state of the runtime container.
    pub async fn status(&self) -> ContainerStatus {
        let mut status = ContainerStatus {
            state: ContainerState::Missing,
            id: None,
            image: self.image.clone(),
            name: self.container_name.clone(),
        };

        // probe daemon
        if self.docker.version().await.is_err() {
            status.state = ContainerState::Unreachable;
            return status;
        }

        let mut filters = HashMap::new();
        filters.insert("name".to_string(), vec![self.container_name.clone()]);
        let containers = self
            .docker
            .list_containers(Some(ListContainersOptions::<String> {
                all: true,
                filters,
                ..Default::default()
            }))
            .await
            .unwrap_or_default();

        if let Some(c) = containers.first() {
            status.id = c.id.clone();
            status.state = match c.state.as_deref() {
                Some("running") => ContainerState::Running,
                Some("created") | Some("exited") | Some("paused") | Some("dead") => {
                    ContainerState::Stopped
                },
                Some("restarting") => ContainerState::Starting,
                _ => ContainerState::Stopped,
            };
        }

        status
    }

    pub async fn ensure_image(&self) -> Result<(), LifecycleError> {
        // already present?
        if self.docker.inspect_image(&self.image).await.is_ok() {
            return Ok(());
        }

        let mut pull = self.docker.create_image(
            Some(CreateImageOptions {
                from_image: self.image.clone(),
                ..Default::default()
            }),
            None,
            None,
        );

        while let Some(info) = pull.next().await {
            let info = info?;
            tracing::debug!(?info, "image pull progress");
        }
        Ok(())
    }

    pub async fn ensure_container(&self) -> Result<String, LifecycleError> {
        let status = self.status().await;

        if let Some(id) = status.id {
            if status.state == ContainerState::Running {
                return Ok(id);
            }
            // exists but stopped — start it
            self.docker
                .start_container(&id, None::<StartContainerOptions<String>>)
                .await?;
            return Ok(id);
        }

        // create new
        std::fs::create_dir_all(&self.config_dir)?;
        let workspace_dir = self.workspace_dir();
        std::fs::create_dir_all(&workspace_dir)?;

        let mounts = vec![
            Mount {
                target: Some("/config".into()),
                source: Some(self.config_dir.to_string_lossy().to_string()),
                typ: Some(MountTypeEnum::BIND),
                ..Default::default()
            },
            Mount {
                target: Some("/workspace".into()),
                source: Some(workspace_dir.to_string_lossy().to_string()),
                typ: Some(MountTypeEnum::BIND),
                ..Default::default()
            },
        ];

        let host_config = HostConfig {
            mounts: Some(mounts),
            network_mode: Some(host_network_mode()),
            restart_policy: Some(bollard::models::RestartPolicy {
                name: Some(bollard::models::RestartPolicyNameEnum::UNLESS_STOPPED),
                maximum_retry_count: None,
            }),
            // Empty map keeps Docker happy when network_mode = host
            port_bindings: Some(HashMap::<String, Option<Vec<PortBinding>>>::new()),
            ..Default::default()
        };

        // Forward every host auth key the CLIs may need (Claude / Codex /
        // Antigravity) plus any custom-named account-profile vars, so a session
        // can remap its CLI's canonical var by NAME. Values never touch the logs.
        let mut env = vec!["TMUX_TMPDIR=/tmp/codehub".to_string()];
        env.extend(auth_env_with(&self.profile_env_vars()));

        let config = Config {
            image: Some(self.image.clone()),
            env: Some(env),
            host_config: Some(host_config),
            working_dir: Some("/workspace".into()),
            tty: Some(true),
            open_stdin: Some(true),
            ..Default::default()
        };

        let created = self
            .docker
            .create_container(
                Some(CreateContainerOptions {
                    name: self.container_name.clone(),
                    platform: None,
                }),
                config,
            )
            .await?;

        self.docker
            .start_container(&created.id, None::<StartContainerOptions<String>>)
            .await?;

        Ok(created.id)
    }

    pub async fn ensure_runtime(&self) -> Result<ContainerStatus, LifecycleError> {
        self.ensure_image().await?;
        self.ensure_container().await?;
        Ok(self.status().await)
    }

    pub async fn start(&self) -> Result<(), LifecycleError> {
        self.ensure_container().await?;
        Ok(())
    }

    pub async fn stop(&self) -> Result<(), LifecycleError> {
        let status = self.status().await;
        if let Some(id) = status.id {
            self.docker
                .stop_container(&id, Some(StopContainerOptions { t: 10 }))
                .await?;
        }
        Ok(())
    }

    pub async fn restart(&self) -> Result<(), LifecycleError> {
        self.stop().await.ok();
        self.start().await
    }

    pub async fn remove(&self) -> Result<(), LifecycleError> {
        let status = self.status().await;
        if let Some(id) = status.id {
            self.docker
                .remove_container(
                    &id,
                    Some(RemoveContainerOptions {
                        force: true,
                        v: false,
                        link: false,
                    }),
                )
                .await?;
        }
        Ok(())
    }

    /// Remove the container and recreate it from scratch, so a changed bind-mount
    /// source (the workspace dir) or a newly-added account-profile env var takes
    /// effect. Destructive to running tmux sessions — the caller confirms first.
    pub async fn recreate(&self) -> Result<(), LifecycleError> {
        self.remove().await?;
        self.ensure_container().await?;
        Ok(())
    }

    /// The configured-vs-mounted workspace dir + whether a recreate is needed to
    /// reconcile them. `mounted` is read from the running container's actual bind
    /// mount (`docker inspect`); when no container exists, `needs_recreate` is
    /// false (the next create will use `effective`).
    pub async fn workspace_info(&self) -> WorkspaceInfo {
        let effective = self.workspace_dir().to_string_lossy().to_string();
        let mounted = self.mounted_workspace_source().await;
        let needs_recreate = match &mounted {
            Some(m) => m != &effective,
            None => false,
        };
        WorkspaceInfo {
            effective,
            mounted,
            needs_recreate,
        }
    }

    /// Host path the running container has bound at `/workspace`, if any. `None`
    /// when the container is missing or the daemon is unreachable.
    async fn mounted_workspace_source(&self) -> Option<String> {
        let info = self
            .docker
            .inspect_container(&self.container_name, None::<InspectContainerOptions>)
            .await
            .ok()?;
        info.mounts?.into_iter().find_map(|m| {
            if m.destination.as_deref() == Some("/workspace") {
                m.source
            } else {
                None
            }
        })
    }

    /// Daemon reachability + version. Best-effort: an unreachable daemon yields
    /// `reachable: false` with empty version fields rather than an error.
    pub async fn docker_info(&self) -> DockerInfo {
        match self.docker.version().await {
            Ok(v) => DockerInfo {
                reachable: true,
                version: v.version,
                api_version: v.api_version,
            },
            Err(_) => DockerInfo {
                reachable: false,
                version: None,
                api_version: None,
            },
        }
    }

    pub fn docker_client(&self) -> DockerClient {
        DockerClient::from_docker(self.docker.clone(), self.container_name.clone())
    }
}

fn host_network_mode() -> String {
    // macOS Docker Desktop supports host network behind a feature flag.
    // Default to `bridge` to maximize compatibility; users can override.
    std::env::var("CODEHUB_NETWORK_MODE")
        .or_else(|_| std::env::var("AVIARY_NETWORK_MODE"))
        .unwrap_or_else(|_| "bridge".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    // The single most important property of `agent_key_status`: it must report
    // presence only and never let a secret value reach the serialized payload.
    #[test]
    fn key_status_reports_presence_without_leaking_value() {
        let secret = "sk-codehub-test-DO-NOT-LEAK-9f3a2b";
        // SAFETY: process-global env mutation; no other test reads this var.
        unsafe {
            std::env::set_var("OPENAI_API_KEY", secret);
        }

        let status = agent_key_status();
        let codex = status.get("codex").expect("codex entry present");
        assert!(codex.present, "codex key should read as present");
        assert_eq!(codex.var_name.as_deref(), Some("OPENAI_API_KEY"));
        assert_eq!(codex.source, "env");

        let json = serde_json::to_string(&status).expect("serializes");
        assert!(
            !json.contains(secret),
            "secret value leaked into serialized key status: {json}"
        );

        unsafe {
            std::env::remove_var("OPENAI_API_KEY");
        }
    }

    #[test]
    fn auth_env_forwards_present_vars_only() {
        unsafe {
            std::env::set_var("GOOGLE_API_KEY", "g-test-token");
            std::env::remove_var("GEMINI_API_KEY");
        }
        let env = auth_env();
        assert!(env.iter().any(|e| e.starts_with("GOOGLE_API_KEY=")));
        assert!(!env.iter().any(|e| e.starts_with("GEMINI_API_KEY=")));
        unsafe {
            std::env::remove_var("GOOGLE_API_KEY");
        }
    }

    // A custom-named account-profile var present on the host is forwarded into
    // the container so a session can remap onto it by NAME; absent extras are not.
    #[test]
    fn auth_env_with_forwards_present_extras_and_dedups() {
        unsafe {
            std::env::set_var("CLAUDE_TOKEN_WORK", "tok-work-present");
            std::env::remove_var("CLAUDE_TOKEN_ABSENT");
        }
        let extra = vec![
            "CLAUDE_TOKEN_WORK".to_string(),
            "CLAUDE_TOKEN_ABSENT".to_string(),
            // duplicate of a built-in name must not produce two entries
            "CLAUDE_CODE_OAUTH_TOKEN".to_string(),
        ];
        let env = auth_env_with(&extra);
        assert!(
            env.iter().any(|e| e.starts_with("CLAUDE_TOKEN_WORK=")),
            "present custom var should be forwarded"
        );
        assert!(
            !env.iter().any(|e| e.starts_with("CLAUDE_TOKEN_ABSENT=")),
            "absent custom var must not be forwarded"
        );
        let canon = env
            .iter()
            .filter(|e| e.starts_with("CLAUDE_CODE_OAUTH_TOKEN="))
            .count();
        assert!(
            canon <= 1,
            "canonical var must not be duplicated by an extra"
        );
        unsafe {
            std::env::remove_var("CLAUDE_TOKEN_WORK");
        }
    }
}
