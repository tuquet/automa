@echo off
setlocal enabledelayedexpansion
REM Script to clone or update all Automa Ecosystem repositories on Windows

set "REPOS=automa automa-be automa-cli"
set "ORG=tuquet"

echo Cloning or updating Automa Ecosystem repositories...

for %%R in (%REPOS%) do (
  echo ----------------------------------------
  if exist "%%R\" (
    echo Directory '%%R' already exists. Pulling latest changes...
    cd "%%R"
    git pull
  ) else (
    echo Cloning '%%R'...
    gh repo clone "%ORG%/%%R" "%%R"
    cd "%%R"
  )
  
  if exist "package.json" (
    echo Installing dependencies for '%%R'...
    call pnpm install --ignore-scripts
  ) else (
    echo No package.json found in '%%R', skipping pnpm install.
  )
  cd ..
)

echo ----------------------------------------
echo All repositories processed successfully!
pause
