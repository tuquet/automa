#!/bin/bash
set -e
shopt -s nullglob

# Universal Script to initialize Ecosystem workspace using Git Submodules

# Fix "unsafe repository" error when mounting Windows folders to Dev Container
git config --global --add safe.directory '*'

echo "Initializing and updating Git Submodules..."
git submodule update --init --recursive

echo "Running pnpm install for workspace..."
# In a pnpm monorepo, we should run install at the root instead of each sub-directory
pnpm install --ignore-scripts

echo "----------------------------------------"
echo "Restoring local profiles (application-local.properties) if devops/local-profiles exists..."
if [ -d "devops/local-profiles" ]; then
  for profile in devops/local-profiles/*; do
    if [ -d "$profile" ]; then
      service_name=$(basename "$profile")
      prop_file="$profile/application-local.properties"
      if [ -d "$service_name/src/main/resources" ] && [ -f "$prop_file" ]; then
        cp "$prop_file" "$service_name/src/main/resources/"
        echo "Restored properties for $service_name"
      fi
    fi
  done
fi

echo "Workspace initialized and configured successfully!"
