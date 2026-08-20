$ErrorActionPreference = "Stop"

Write-Host "🚀 TỰ ĐỘNG BUILD PRODUCTION CHO AUTOMA ECOSYSTEM 🚀" -ForegroundColor Cyan
Write-Host "----------------------------------------------------"

# 1. Build automa-core (Rust Daemon)
Write-Host "`n[1/4] Building Rust Core Engine (automa-core)..." -ForegroundColor Yellow
Push-Location automa-core
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) { throw "Build automa-core thất bại!" }
} finally {
    Pop-Location
}

# 2. Build automa-cli (Node Wrapper)
Write-Host "`n[2/4] Building CLI Wrapper (automa-cli)..." -ForegroundColor Yellow
Push-Location automa-cli
try {
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Build automa-cli thất bại!" }
} finally {
    Pop-Location
}

# 3. Build automa-ext (Browser Extension)
Write-Host "`n[3/4] Building Browser Extensions (automa-ext)..." -ForegroundColor Yellow
Push-Location automa-ext
try {
    Write-Host "      > Building Full UI (.zip)..." -ForegroundColor Gray
    pnpm run build:prod-chrome
    if ($LASTEXITCODE -ne 0) { throw "Build automa-ext Full thất bại!" }

    Write-Host "      > Building Silent Runner (.zip)..." -ForegroundColor Gray
    pnpm run build:runner
    if ($LASTEXITCODE -ne 0) { throw "Build automa-ext Runner thất bại!" }
    
    # Nén riêng bản Runner thành runner.zip
    if (!(Test-Path "build-zip")) { New-Item -ItemType Directory -Path "build-zip" | Out-Null }
    if (Test-Path "build-zip\runner.zip") { Remove-Item "build-zip\runner.zip" -Force }
    Compress-Archive -Path "dist\cli-runner\*" -DestinationPath "build-zip\runner.zip" -Force
} finally {
    Pop-Location
}

# 4. Build automa-vscode (VS Code Extension)
Write-Host "`n[4/4] Building VS Code Extension (automa-vscode)..." -ForegroundColor Yellow
Push-Location automa-vscode
try {
    # Chạy build trước (tsc / webpack của extension nếu có script build)
    if (Test-Path "package.json") {
        $pkg = Get-Content package.json | ConvertFrom-Json
        if ($null -ne $pkg.scripts.build) {
            pnpm run build
            if ($LASTEXITCODE -ne 0) { throw "Biên dịch mã nguồn VS Code extension thất bại!" }
        }
    }
    
    # Đóng gói VSIX (Bỏ qua check dependencies vì là monorepo)
    npx @vscode/vsce package --no-dependencies
    if ($LASTEXITCODE -ne 0) { throw "Build automa-vscode thất bại!" }
} finally {
    Pop-Location
}

# 5. Phân phối file tới Môi trường Dev (Vault Sandbox)
Write-Host "`n[5/5] Deploying artifacts to Dev Sandbox (~/.automa/core-dev/bin)..." -ForegroundColor Yellow
$DEV_BIN = "$env:USERPROFILE\.automa\core-dev\bin"
if (!(Test-Path $DEV_BIN)) { New-Item -ItemType Directory -Path $DEV_BIN | Out-Null }

try {
    # Copy Rust Daemon
    Copy-Item -Path "automa-core\target\release\automa-core.exe" -Destination "$DEV_BIN\automa-core.exe" -Force
    # Copy CLI
    Copy-Item -Path "automa-cli\dist\cli.js" -Destination "$DEV_BIN\cli.js" -Force
    # Copy Runner Zip
    Copy-Item -Path "automa-ext\build-zip\runner.zip" -Destination "$DEV_BIN\runner.zip" -Force
    # Copy VS Code VSIX
    $vsixFile = Get-ChildItem -Path "automa-vscode\*.vsix" | Select-Object -First 1
    if ($vsixFile) {
        Copy-Item -Path $vsixFile.FullName -Destination "$DEV_BIN\$($vsixFile.Name)" -Force
    }
} catch {
    Write-Error "Lỗi khi sao chép file sang Dev Sandbox: $_"
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "✅ HOÀN TẤT BUILD & DEPLOY PRODUCTION!" -ForegroundColor Green
Write-Host "Danh sách các file đã được nạp sẵn vào Dev Sandbox:" -ForegroundColor White
Write-Host "📂 $DEV_BIN"
Write-Host "  ├─ automa-core.exe"
Write-Host "  ├─ cli.js"
Write-Host "  ├─ runner.zip"
Write-Host "  └─ *.vsix"
Write-Host "====================================================" -ForegroundColor Cyan
