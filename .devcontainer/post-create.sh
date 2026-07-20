#!/bin/bash

# Configure pnpm store directory
pnpm config set store-dir /home/node/.local/share/pnpm/store

# Git configurations
git config --global core.autocrlf input
git config --global --add safe.directory '*'

# Bootstrap repositories
bash init_workspace.sh
