#!/bin/bash
# Script to clone or update all Automa Ecosystem repositories on Linux/Mac

REPOS=("automa" "automa-be" "automa-cli")
ORG="tuquet"

echo "Cloning or updating Automa Ecosystem repositories..."

for REPO in "${REPOS[@]}"; do
  echo "----------------------------------------"
  if [ -d "$REPO" ]; then
    echo "Directory '$REPO' already exists. Pulling latest changes..."
    cd "$REPO" || exit
    git pull
  else
    echo "Cloning '$REPO'..."
    gh repo clone "$ORG/$REPO" "$REPO"
    cd "$REPO" || exit
  fi
  
  if [ -f "package.json" ]; then
    echo "Installing dependencies for '$REPO'..."
    pnpm install --ignore-scripts
  else
    echo "No package.json found in '$REPO', skipping pnpm install."
  fi
  cd ..
done

echo "----------------------------------------"
echo "All repositories processed successfully!"
