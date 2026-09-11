# Automa Ecosystem - Production Build & Dev Sandbox Deployment Script
# Builds canonical components and deploys to ~/.automa/core-dev/bin

$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Automa Ecosystem Production Build & Deploy" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot

# 1. Build automa-core (Rust Daemon Engine)
Write-Host "`n[1/4] Building Rust Core Engine (automa-core)..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "automa-core")
try {
    & cargo build --release
    if ($LASTEXITCODE -ne 0) { throw "Build automa-core failed!" }
} finally {
    Pop-Location
}

# 2. Build automa-webe (Browser Extension & Headless Runner)
Write-Host "`n[2/4] Building Browser Extensions & Runner (automa-webe)..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "automa-webe")
try {
    Write-Host "      > Building Standalone Web Studio..." -ForegroundColor Gray
    & pnpm run build:studio
    if ($LASTEXITCODE -ne 0) { throw "Build automa-webe Studio failed!" }

    Write-Host "      > Building Headless CLI Runner..." -ForegroundColor Gray
    & pnpm run build:runner
    if ($LASTEXITCODE -ne 0) { throw "Build automa-webe Runner failed!" }

    # Package runner zip
    $zipDir = Join-Path (Get-Location) "build-zip"
    if (!(Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir | Out-Null }
    $runnerZip = Join-Path $zipDir "runner.zip"
    if (Test-Path $runnerZip) { Remove-Item $runnerZip -Force }
    Compress-Archive -Path "dist\cli-runner\*" -DestinationPath $runnerZip -Force
} finally {
    Pop-Location
}

# 3. Build automa-vsce (VS Code Extension)
Write-Host "`n[3/4] Building VS Code Extension (automa-vsce)..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "automa-vsce")
try {
    & pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Build automa-vsce failed!" }

    # Package VSIX
    & npx @vscode/vsce package --no-dependencies
    if ($LASTEXITCODE -ne 0) { throw "VSIX package creation failed!" }
} finally {
    Pop-Location
}

# 4. Build automa-desk (Desktop App)
Write-Host "`n[4/4] Building Desktop App (automa-desk)..." -ForegroundColor Yellow
Push-Location (Join-Path $rootDir "automa-desk")
try {
    & pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Build automa-desk failed!" }
} finally {
    Pop-Location
}

# 5. Deploy artifacts to Dev Sandbox (~/.automa/core-dev/bin)
Write-Host "`n[5/5] Deploying artifacts to Dev Sandbox (~/.automa/core-dev/bin)..." -ForegroundColor Yellow
$DEV_BIN = Join-Path $env:USERPROFILE ".automa\core-dev\bin"
if (!(Test-Path $DEV_BIN)) { New-Item -ItemType Directory -Path $DEV_BIN -Force | Out-Null }

try {
    # Copy Rust Daemon
    $coreExe = Join-Path $rootDir "automa-core\target\release\automa-core.exe"
    if (Test-Path $coreExe) {
        Copy-Item -Path $coreExe -Destination (Join-Path $DEV_BIN "automa-core.exe") -Force
    }

    # Copy Runner Zip
    $runnerZipSource = Join-Path $rootDir "automa-webe\build-zip\runner.zip"
    if (Test-Path $runnerZipSource) {
        Copy-Item -Path $runnerZipSource -Destination (Join-Path $DEV_BIN "runner.zip") -Force
    }

    # Copy VS Code VSIX
    $vsixFile = Get-ChildItem -Path (Join-Path $rootDir "automa-vsce\*.vsix") -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($vsixFile) {
        Copy-Item -Path $vsixFile.FullName -Destination (Join-Path $DEV_BIN $vsixFile.Name) -Force
    }
} catch {
    Write-Error "Error copying files to Dev Sandbox: $_"
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " SUCCESS: Production Build & Deploy Finished!" -ForegroundColor Green
Write-Host " Artifacts available in Dev Sandbox:" -ForegroundColor White
Write-Host " Directory: $DEV_BIN"
Write-Host "====================================================`n" -ForegroundColor Cyan
