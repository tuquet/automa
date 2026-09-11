#!/usr/bin/env bash
set -e

# ==============================================================================
# Automa Ecosystem - Workspace Initialization Script (Bash / POSIX)
# Initializes Git submodules and installs monorepo dependencies.
# ==============================================================================

echo "🚀 [Automa Ecosystem] Initializing Workspace..."

# Ensure git safe.directory for containerized / cross-platform environments
git config --global --add safe.directory '*' 2>/dev/null || true

echo "📦 [1/2] Initializing and updating Git Submodules..."
git submodule update --init --recursive

echo "⚡ [2/2] Installing Monorepo dependencies via pnpm..."
pnpm install

echo "✨ Automa Ecosystem workspace initialized successfully!"
