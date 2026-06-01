@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\melodify-connect-laptop.ps1"
echo.
pause
