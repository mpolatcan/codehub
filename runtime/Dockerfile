FROM node:20-slim

SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    tmux \
    ripgrep \
    ca-certificates \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Claude Code (native binary)
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"

# OpenAI Codex
RUN npm install -g @openai/codex

# Google Antigravity — install URL unverified; toggle on once confirmed.
# RUN curl -fsSL https://antigravity.google/cli/install.sh | bash

# Persistent tmux socket location
ENV TMUX_TMPDIR=/tmp/aviary
RUN mkdir -p /tmp/aviary && chmod 700 /tmp/aviary

# Aviary writes config + workspace via volume mounts
ENV CLAUDE_CONFIG_DIR=/config/claude
ENV CODEX_CONFIG_DIR=/config/codex
ENV ANTIGRAVITY_CONFIG_DIR=/config/antigravity

WORKDIR /workspace

# Idle entrypoint — Aviary spawns tmux sessions via docker exec
ENTRYPOINT ["tail", "-f", "/dev/null"]
