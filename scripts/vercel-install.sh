#!/usr/bin/env bash
set -e

# Always change to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export CI=1

echo "================================================================"
echo "🚀 [Vercel Monorepo] Starting Environment Setup for Automa Studio"
echo "📂 Working directory: $(pwd)"
echo "Node runtime: $(node --version 2>/dev/null || echo 'Unknown')"
echo "================================================================"

# 1. Resolve GitHub Token for Private Submodules
TOKEN="${GH_PAT:-${GITHUB_TOKEN:-${VERCEL_GIT_TOKEN:-${GITHUB_ACCESS_TOKEN}}}}"

if [ -n "$TOKEN" ]; then
  echo "🔑 Setting up Git authentication using GitHub Token..."
  git config --global url."https://${TOKEN}@github.com/".insteadOf "https://github.com/"
  echo "✔ GitHub credentials configured successfully."
else
  echo "⚠️ Notice: No GH_PAT or GITHUB_TOKEN environment variable detected."
  echo "   If submodule cloning fails with authentication error, please set"
  echo "   'GH_PAT' in Vercel Project Settings -> Environment Variables."
fi

# 2. Initialize and update ONLY the automa-webe submodule (Cache-resilient)
echo "📦 Initializing & updating submodule: automa-webe..."

# If automa-webe exists but lacks .git (e.g. from partial cache restoration), clean it first
if [ -d "automa-webe" ] && [ ! -e "automa-webe/.git" ]; then
  echo "⚠️ Detected non-git automa-webe directory from build cache, resetting..."
  rm -rf automa-webe
fi

# Try submodule update with force; if it fails due to directory conflict, remove and retry
if ! git submodule update --init --recursive --force automa-webe 2>/dev/null; then
  echo "⚠️ Submodule update failed, attempting fresh clean clone..."
  rm -rf automa-webe
  git submodule update --init --recursive --force automa-webe
fi

echo "✔ Submodule 'automa-webe' ready at commit $(git -C automa-webe rev-parse --short HEAD)"

# 3. Ensure pnpm is ready via Corepack or npm fallback
echo "⚡ Preparing package manager (pnpm)..."
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
fi

# Test if pnpm runs cleanly; if not, install pnpm globally
if ! pnpm --version >/dev/null 2>&1; then
  echo "⚠️ Corepack pnpm not responding or missing. Installing pnpm globally..."
  npm install -g pnpm@9
fi

echo "✔ Using pnpm version: $(pnpm --version)"

# 4. Install Monorepo Dependencies
echo "📦 Installing Monorepo dependencies via pnpm..."
pnpm install --frozen-lockfile=false

echo "================================================================"
echo "✔ [Vercel Monorepo] Setup completed successfully!"
echo "================================================================"
