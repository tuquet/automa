# ==============================================================================
# Script: scripts/network/test_network.ps1
# Purpose: Tests Cloudflare Bridge (2222) and SSH SOCKS5 Proxy (1080) ports.
# Usage:   .\scripts\network\test_network.ps1
# Encoding: Strict ASCII
# ==============================================================================

function Test-Port([string]$ip, [int]$port) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect($ip, $port, $null, $null)
        if (-not $asyncResult.AsyncWaitHandle.WaitOne(500, $false)) {
            $tcpClient.Close()
            return $false
        }
        $tcpClient.EndConnect($asyncResult)
        $tcpClient.Close()
        return $true
    } catch {
        return $false
    }
}

$port2222 = Test-Port "127.0.0.1" 2222
$port1080 = Test-Port "127.0.0.1" 1080

Write-Host "Cloudflare Bridge (2222): " -NoNewline
if ($port2222) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }

Write-Host "SSH SOCKS5 Proxy (1080):  " -NoNewline
if ($port1080) { Write-Host "ONLINE" -ForegroundColor Green } else { Write-Host "OFFLINE" -ForegroundColor Red }
