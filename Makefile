# =============================================================================
# CodeHub — developer convenience targets.
#
# All paths are relative to repo root. Run `make help` for a quick reference.
# Variables (override on the command line, e.g. `make image IMAGE_TAG=0.2.0`):
#
#   IMAGE_TAG     Runtime image tag.  Default: parsed from src-tauri/src/lib.rs
#   IMAGE_REPO    Runtime image repo. Default: ghcr.io/mpolatcan/codehub-runtime
#   PLATFORMS     buildx platforms.   Default: linux/amd64,linux/arm64
#   CONTAINER     Runtime container name (debug helpers). Default: codehub-runtime
# =============================================================================

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

IMAGE_REPO ?= ghcr.io/mpolatcan/codehub-runtime
IMAGE_TAG  ?= $(shell grep -E 'DEFAULT_IMAGE' src-tauri/src/lib.rs | sed -E 's/.*:([0-9]+\.[0-9]+\.[0-9]+).*/\1/' | head -n1)
IMAGE      := $(IMAGE_REPO):$(IMAGE_TAG)
PLATFORMS  ?= linux/amd64,linux/arm64
CONTAINER  ?= codehub-runtime

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

.PHONY: install
install: ## Install npm dependencies (also fetches Rust deps lazily on first build)
	npm install

.PHONY: install-ci
install-ci: ## Install npm dependencies for CI (lockfile-strict)
	npm ci

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

.PHONY: dev
dev: ## Run Tauri dev (Vite + Rust, hot-reload frontend)
	npm run tauri dev

.PHONY: dev-server
dev-server: ## Run only the browser-mode backend bridge (HTTP/WS on :4555)
	cd src-tauri && cargo run -p codehub-devserver

.PHONY: dev-web
dev-web: ## Browser-mode dev: Vite (:1420) + backend bridge (:4555), no Tauri window
	@echo "Vite → http://localhost:1420  ·  bridge → /__bridge → :4555  (Ctrl-C to stop both)"
	@trap 'kill 0' EXIT; \
	  ( cd src-tauri && cargo run -p codehub-devserver ) & \
	  npm run dev & \
	  wait

# Stable self-signed identity for dev builds. macOS Keychain "Always Allow" binds to
# an app's code signature; the linker ad-hoc-signs each `cargo`/`tauri dev` rebuild
# with a NEW content hash, so the keychain re-prompts every rebuild. Signing with a
# stable self-signed cert (create once: Keychain Access → Certificate Assistant →
# Create a Certificate → type "Code Signing", self-signed) gives a constant
# designated requirement, so "Always Allow" persists. Override the identity name with
# `make dev-signed CODEHUB_DEV_IDENTITY=my-cert`.
CODEHUB_DEV_IDENTITY ?= codehub-dev

.PHONY: sign-dev
sign-dev: ## Codesign the debug binary with $(CODEHUB_DEV_IDENTITY) (stable Keychain identity)
	codesign --force --sign "$(CODEHUB_DEV_IDENTITY)" src-tauri/target/debug/codehub
	@echo "signed src-tauri/target/debug/codehub as $(CODEHUB_DEV_IDENTITY)"

.PHONY: dev-signed
dev-signed: ## Like `make dev` but codesigns the binary with a stable identity so Keychain stops re-prompting. Rerun to pick up Rust changes (no hot Rust reload).
	# --no-default-features drops `custom-protocol`, which is what `tauri dev` does.
	# WITH it (the default), Tauri embeds + serves the stale ../dist build and ignores
	# devUrl, so the launched binary shows an OLD frontend, not live Vite at :1420.
	cd src-tauri && cargo build -p codehub --no-default-features
	codesign --force --sign "$(CODEHUB_DEV_IDENTITY)" src-tauri/target/debug/codehub
	@echo "Vite → http://localhost:1420  ·  signed as $(CODEHUB_DEV_IDENTITY)  ·  Ctrl-C to stop"
	@trap 'kill 0' EXIT; \
	  npm run dev & \
	  sleep 2; \
	  src-tauri/target/debug/codehub & \
	  wait

.PHONY: build
build: ## Production build — Tauri bundle (DMG/AppImage/deb under src-tauri/target/release/bundle/)
	npm run tauri build
	# Embed the .accessory Dynamic-Island helper + a file://-loadable copy of the
	# frontend into the built .app. Done POST-bundle (not via Tauri `externalBin`,
	# which validates at build-script time and would break `cargo check`/CI). NOTE:
	# this runs after the DMG is cut, so only the installed .app carries the helper.
	cd src-tauri && cargo build --release -p codehub-island-helper
	cp src-tauri/target/release/codehub-island-helper src-tauri/target/release/bundle/macos/CodeHub.app/Contents/MacOS/codehub-island-helper
	rm -rf src-tauri/target/release/bundle/macos/CodeHub.app/Contents/Resources/dist
	cp -R dist src-tauri/target/release/bundle/macos/CodeHub.app/Contents/Resources/dist
	codesign --force --sign - src-tauri/target/release/bundle/macos/CodeHub.app/Contents/MacOS/codehub-island-helper
	codesign --force --sign - src-tauri/target/release/bundle/macos/CodeHub.app
	@echo "embedded island helper + dist → src-tauri/target/release/bundle/macos/CodeHub.app"

.PHONY: preview
preview: ## Preview the built frontend without Tauri (web only)
	npm run preview

# ---------------------------------------------------------------------------
# Lint, format, type-check
# ---------------------------------------------------------------------------

.PHONY: check
check: check-frontend check-backend ## Full sweep — Biome + tsc + rustfmt + clippy, no writes

.PHONY: check-frontend
check-frontend: ## Frontend: Biome check + tsc --noEmit
	npm run check
	npm run typecheck

.PHONY: check-backend
check-backend: ## Backend: rustfmt --check + clippy -D warnings
	cd src-tauri && cargo fmt --all -- --check
	cd src-tauri && cargo clippy --workspace --all-targets --all-features -- -D warnings

.PHONY: fix
fix: ## Apply all safe auto-fixes (Biome + rustfmt + clippy --fix), then re-check
	npm run check:fix
	cd src-tauri && cargo fmt --all
	cd src-tauri && cargo clippy --workspace --all-targets --all-features --fix --allow-dirty --allow-staged || true
	$(MAKE) check

.PHONY: typecheck
typecheck: ## TypeScript type-check only
	npm run typecheck

# ---------------------------------------------------------------------------
# Runtime image
# ---------------------------------------------------------------------------

.PHONY: image
image: ## Build runtime image locally (host arch only) — tag from lib.rs
	docker build -t $(IMAGE) runtime/
	@echo "built $(IMAGE)"

.PHONY: image-nocache
image-nocache: ## Build runtime image with --no-cache (clean rebuild)
	docker build --no-cache -t $(IMAGE) runtime/

.PHONY: image-verify
image-verify: ## Smoke-test installed CLIs inside the runtime image
	docker run --rm --entrypoint bash $(IMAGE) -c "\
	  which claude && \
	  which codex && \
	  which tmux && \
	  claude --version && \
	  codex --version && \
	  tmux -V"

.PHONY: image-push
image-push: ## Multi-arch build + push (release path — use the release-cut skill)
	docker buildx build \
	  --platform $(PLATFORMS) \
	  -t $(IMAGE) \
	  -t $(IMAGE_REPO):latest \
	  --push runtime/

.PHONY: image-tag
image-tag: ## Print the image tag currently expected by the backend
	@echo $(IMAGE)

# ---------------------------------------------------------------------------
# Runtime container debug helpers
# ---------------------------------------------------------------------------

.PHONY: shell
shell: ## Open an interactive shell inside the running runtime container
	docker exec -it $(CONTAINER) bash

.PHONY: tmux-ls
tmux-ls: ## List tmux sessions inside the runtime container
	docker exec $(CONTAINER) tmux -S /tmp/codehub/default ls 2>/dev/null || echo "no tmux server (no sessions yet)"

.PHONY: ctr-logs
ctr-logs: ## Tail runtime container logs
	docker logs -f $(CONTAINER)

.PHONY: ctr-status
ctr-status: ## Show runtime container state (running / stopped / missing)
	@docker ps -a --filter "name=^$(CONTAINER)$$" --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' || true

.PHONY: ctr-stop
ctr-stop: ## Stop the runtime container
	-docker stop $(CONTAINER)

.PHONY: ctr-rm
ctr-rm: ## Remove the runtime container (preserves bind-mounted volumes)
	-docker rm -f $(CONTAINER)

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

.PHONY: clean
clean: ## Remove build artifacts (target, dist, node_modules)
	rm -rf src-tauri/target dist node_modules

.PHONY: clean-image
clean-image: ## Remove the locally built runtime image
	-docker image rm $(IMAGE)

# ---------------------------------------------------------------------------
# Self-doc
# ---------------------------------------------------------------------------

.PHONY: help
help: ## Show this help (group + target + one-line description)
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
	  /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } \
	  /^## .*$$/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) }' $(MAKEFILE_LIST)
