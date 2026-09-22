# ==============================================================================
# Script: scripts/network/configure_git_proxy.ps1
# Purpose: Configures git repository to route traffic through local SOCKS5 proxy.
# Usage:   .\scripts\network\configure_git_proxy.ps1
# Encoding: Strict ASCII
# ==============================================================================

$proxyUrl = "socks5://127.0.0.1:1080"
Write-Host "[*] Configuring Repository Git Proxy settings ($proxyUrl)..." -ForegroundColor Yellow

git config --local http.proxy $proxyUrl
git config --local https.proxy $proxyUrl
git config --local core.sshCommand "ssh -o 'ProxyCommand=connect -S 127.0.0.1:1080 %h %p'"

Write-Host "[OK] Git proxy successfully configured for this repository." -ForegroundColor Green
