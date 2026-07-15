#!/bin/bash
# Script to clone, initialize, and install dependencies for all Automa Submodules on Linux/Mac

# Khắc phục lỗi "unsafe repository" khi mount folder từ Windows vào Dev Container
git config --global --add safe.directory '*'

echo "----------------------------------------"
echo "1. Initializing and updating Git submodules..."
git submodule update --init --recursive

echo "----------------------------------------"
echo "2. Installing dependencies for all packages..."
REPOS=("automa-ex" "automa-be" "automa-vault" "automa-cli" "automa-dashboard")

for REPO in "${REPOS[@]}"; do
  echo "----------------------------------------"
  if [ -f "$REPO/package.json" ]; then
    echo "Installing dependencies for '$REPO'..."
    cd "$REPO" || exit
    pnpm install --ignore-scripts
    cd ..
  else
    echo "No package.json found in '$REPO', skipping."
  fi
done

echo "----------------------------------------"
echo "All submodules processed successfully!"
