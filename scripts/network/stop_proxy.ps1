# ==============================================================================
# Script: scripts/network/stop_proxy.ps1
# Purpose: Stops local proxy processes (cloudflared & ssh socks).
# Usage:   .\scripts\network\stop_proxy.ps1
# Encoding: Strict ASCII
# ==============================================================================

Write-Host "[*] Stopping Cloudflare Bridge and SSH SOCKS5 Proxy..." -ForegroundColor Yellow

Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "ssh" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*1080*" } | Stop-Process -Force

Write-Host "[OK] Proxy processes stopped." -ForegroundColor Green
