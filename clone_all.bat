@echo off
setlocal enabledelayedexpansion
REM Script to clone, initialize, and install dependencies for all Automa Submodules on Windows

echo ----------------------------------------
echo 1. Initializing and updating Git submodules...
git submodule update --init --recursive

echo ----------------------------------------
echo 2. Installing dependencies for all packages...
set "REPOS=automa-ex automa-be automa-vault automa-cli automa-dashboard"

for %%R in (%REPOS%) do (
  echo ----------------------------------------
  if exist "%%R\package.json" (
    echo Installing dependencies for '%%R'...
    cd "%%R"
    call pnpm install --ignore-scripts
    cd ..
  ) else (
    echo No package.json found in '%%R', skipping.
  )
)

echo ----------------------------------------
echo All submodules processed successfully!
pause
