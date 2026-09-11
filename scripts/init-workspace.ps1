# Automa Ecosystem - Workspace Initialization Script (PowerShell for Windows)
# Initializes Git submodules and installs monorepo dependencies.

$ErrorActionPreference = 'Stop'

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Automa Ecosystem Workspace Initializer" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Initialize and update submodules
Write-Host "`n[1/2] Initializing and updating Git Submodules..." -ForegroundColor Yellow
& git submodule update --init --recursive
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to update git submodules."
    exit $LASTEXITCODE
}

# 2. Install pnpm dependencies
Write-Host "`n[2/2] Installing Monorepo dependencies via pnpm..." -ForegroundColor Yellow
& pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install pnpm dependencies."
    exit $LASTEXITCODE
}

Write-Host "`n[SUCCESS] Automa Ecosystem workspace initialized successfully!`n" -ForegroundColor Green
