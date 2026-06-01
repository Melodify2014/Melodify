@echo off
setlocal
set "STARTUP_FILE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Melodify Server.cmd"

if exist "%STARTUP_FILE%" (
  del "%STARTUP_FILE%"
  echo Melodify will no longer start its local helper when you sign in.
) else (
  echo Melodify was not set to start on login.
)

echo.
echo To stop the helper that is already running, close the Melodify Server window or restart Windows.
pause
