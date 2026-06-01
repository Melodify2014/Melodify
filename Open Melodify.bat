@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\melodify-server.ps1" -Port 8788 -FixedPort
