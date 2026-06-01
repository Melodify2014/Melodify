param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$serverScript = Join-Path $PSScriptRoot "melodify-server.ps1"
$launcherScript = Join-Path $root "Open Melodify.vbs"
$startupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$startupFile = Join-Path $startupDir "Melodify Server.cmd"
$programsDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$startMenuShortcut = Join-Path $programsDir "Melodify.lnk"
$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Melodify.lnk"
$appUrl = "http://127.0.0.1:8788/"

function Stop-MelodifyServerProcesses {
  $stopped = 0
  try {
    $servers = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe' OR Name = 'pwsh.exe'" -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.CommandLine -match "melodify-server\.ps1" }
  } catch {
    Write-Host "Could not check for old Melodify helper processes. Continuing with this folder."
    return 0
  }

  foreach ($server in $servers) {
    try {
      Stop-Process -Id $server.ProcessId -Force -ErrorAction Stop
      $stopped += 1
    } catch {
      Write-Host "Could not stop an old Melodify helper process. Restart Windows if Melodify still opens an old copy."
    }
  }

  return $stopped
}

function Start-MelodifyServer {
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $serverScript,
    "-Port",
    "8788",
    "-FixedPort",
    "-NoOpen"
  )

  Start-Process -FilePath "powershell" -ArgumentList $arguments -WindowStyle Hidden -WorkingDirectory $root
}

function Set-MelodifyShortcut {
  param([string]$ShortcutPath)

  try {
    $directory = Split-Path -Parent $ShortcutPath
    if (-not [string]::IsNullOrWhiteSpace($directory)) {
      New-Item -ItemType Directory -Force -Path $directory -ErrorAction Stop | Out-Null
    }

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = Join-Path $env:WINDIR "System32\wscript.exe"
    $shortcut.Arguments = "`"$launcherScript`""
    $shortcut.WorkingDirectory = $root
    $shortcut.Description = "Open Melodify from the synced OneDrive folder"
    $shortcut.Save()
    return $true
  } catch {
    Write-Host "Could not create shortcut at $ShortcutPath"
    return $false
  }
}

if (-not (Test-Path -LiteralPath $serverScript)) {
  throw "Melodify could not find its local helper at $serverScript."
}

if (-not (Test-Path -LiteralPath $launcherScript)) {
  throw "Melodify could not find its hidden launcher at $launcherScript."
}

Write-Host "Connecting this laptop to the Melodify folder:"
Write-Host $root
Write-Host ""

if ($root -notmatch "\\OneDrive(\\|$)") {
  Write-Host "Heads up: this folder does not look like it is inside OneDrive."
  Write-Host "For automatic laptop-to-laptop updates, use the Melodify folder inside OneDrive on both laptops."
  Write-Host ""
}

$startupConnected = $true
try {
  New-Item -ItemType Directory -Force -Path $startupDir -ErrorAction Stop | Out-Null

  $startupLines = @(
    "@echo off",
    "cd /d ""$root""",
    "start ""Melodify Server"" /min powershell -NoProfile -ExecutionPolicy Bypass -File ""$serverScript"" -Port 8788 -FixedPort -NoOpen"
  )
  Set-Content -LiteralPath $startupFile -Value $startupLines -Encoding ASCII -ErrorAction Stop
} catch {
  $startupConnected = $false
  Write-Host "Could not update Windows Startup automatically."
  Write-Host "Melodify can still run from this folder when you use the Melodify shortcut or Open Melodify.bat."
  Write-Host ""
}

$stopped = Stop-MelodifyServerProcesses
if ($stopped -gt 0) {
  Write-Host "Stopped $stopped old Melodify helper process(es)."
}

$shortcutCount = 0
if (Set-MelodifyShortcut -ShortcutPath $startMenuShortcut) {
  $shortcutCount += 1
}
if (Set-MelodifyShortcut -ShortcutPath $desktopShortcut) {
  $shortcutCount += 1
}
if ($shortcutCount -gt 0) {
  Write-Host "Created Melodify shortcut(s) that start the helper before opening the app."
}

Start-MelodifyServer
if ($startupConnected) {
  Write-Host "Melodify will now use this synced folder when you sign in."
} else {
  Write-Host "Melodify is starting from this synced folder now."
}

if (-not $NoOpen) {
  Start-Sleep -Milliseconds 800
  Start-Process $appUrl
  Write-Host "Opening Melodify from the synced folder..."
}

Write-Host ""
if ($shortcutCount -gt 0) {
  Write-Host "Use the Melodify shortcut on the Desktop or Start Menu instead of opening index.html."
} else {
  Write-Host "If the shortcuts were not created, double-click Connect This Laptop.bat normally from Windows."
}
Write-Host "Run this same file once on the other laptop from its OneDrive Melodify folder."
Write-Host "After that, OneDrive handles code updates between the laptops."
