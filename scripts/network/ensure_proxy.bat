@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ensure_proxy.ps1" %*
