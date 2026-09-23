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

# 1. Pure Monorepo: All code is already checked out natively by Vercel
echo "✔ Monorepo source directories present: apps/webe, packages/types, packages/ui."

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
