@echo off
setlocal
echo This opens Melodify in normal Edge so the app install menu is visible.
echo.
echo In Edge, choose:
echo Settings and more ^> Apps ^> Install this site as an app
echo.
echo After installing, pin the installed Melodify app to the taskbar.
echo Then run "Start Melodify on Login.bat" once so searches work without opening this folder.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\melodify-server.ps1" -Port 8788 -FixedPort -BrowserMode
