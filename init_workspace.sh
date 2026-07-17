#!/bin/bash
# Universal Script to initialize Ecosystem workspace using Git Submodules

# Fix "unsafe repository" error when mounting Windows folders to Dev Container
git config --global --add safe.directory '*'

echo "Initializing and updating Git Submodules..."
git submodule update --init --recursive

echo "Running pnpm install for submodules..."
# Find all directories in the root that have a package.json
for DIR in */; do
  if [ -f "${DIR}package.json" ]; then
    echo "----------------------------------------"
    echo "Installing dependencies for '${DIR%/}'..."
    (cd "$DIR" && pnpm install --ignore-scripts)
  fi
done

echo "----------------------------------------"
echo "Restoring local profiles (application-local.properties) if devops/local-profiles exists..."
if [ -d "devops/local-profiles" ]; then
  for profile in devops/local-profiles/*; do
    if [ -d "$profile" ]; then
      service_name=$(basename "$profile")
      if [ -d "$service_name/src/main/resources" ]; then
        cp "$profile/application-local.properties" "$service_name/src/main/resources/" 2>/dev/null || true
        echo "Restored properties for $service_name"
      fi
    fi
  done
fi

echo "Workspace initialized and configured successfully!"
