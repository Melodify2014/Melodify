param(
  [switch]$NoOpen,
  [int]$Port = 8787,
  [string]$ReadyFile = "",
  [switch]$Quiet,
  [switch]$BrowserMode,
  [switch]$FixedPort
)

$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$serverScript = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
$listener = $null
$prefix = $null
$existingServer = $false
$restartRequested = $false
$preferredPorts = if ($FixedPort) { @($Port) } else { @($Port) + ((8787..8799) | Where-Object { $_ -ne $Port }) }

function Test-ExistingMelodifyServer {
  param([int]$Port)

  try {
    $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/__melodify/health")
    $request.Method = "GET"
    $request.Timeout = 500
    $request.ReadWriteTimeout = 500
    $response = $request.GetResponse()
    try {
      $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
      try {
        return ($reader.ReadToEnd() -match "Melodify OK")
      } finally {
        $reader.Close()
      }
    } finally {
      $response.Close()
    }
  } catch {
    return $false
  }
}

foreach ($port in $preferredPorts) {
  $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
  try {
    $candidate.Start()
    $listener = $candidate
    $prefix = "http://127.0.0.1:$port/"
    break
  } catch {
    $candidate.Stop()
    if ($FixedPort -and (Test-ExistingMelodifyServer -Port $port)) {
      $existingServer = $true
      $prefix = "http://127.0.0.1:$port/"
      break
    }
  }
}

if (-not $listener -and -not $existingServer) {
  if ($FixedPort) {
    throw "Melodify could not start on http://127.0.0.1:$Port/. Another app is already using that port."
  }
  throw "Melodify could not start an app address on ports 8787-8799."
}

if (-not [string]::IsNullOrWhiteSpace($ReadyFile)) {
  $readyDirectory = Split-Path -Parent $ReadyFile
  if (-not [string]::IsNullOrWhiteSpace($readyDirectory)) {
    New-Item -ItemType Directory -Force -Path $readyDirectory | Out-Null
  }
  Set-Content -LiteralPath $ReadyFile -Value $prefix -Encoding UTF8
}

function Get-MimeType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".webmanifest" { "application/manifest+json; charset=utf-8"; break }
    ".svg" { "image/svg+xml"; break }
    ".png" { "image/png"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".webp" { "image/webp"; break }
    default { "application/octet-stream" }
  }
}

function Resolve-RequestPath {
  param([string]$Path)

  $cleanPath = ($Path -split "\?")[0]
  $relative = [Uri]::UnescapeDataString($cleanPath.TrimStart("/")).Replace("/", [System.IO.Path]::DirectorySeparatorChar)
  if ([string]::IsNullOrWhiteSpace($relative)) {
    $relative = "index.html"
  }

  $target = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  if ($target -ne $root -and -not $target.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  if ([System.IO.Directory]::Exists($target)) {
    $target = Join-Path $target "index.html"
  }

  return $target
}

function Get-QueryValue {
  param(
    [string]$Path,
    [string]$Name
  )

  $parts = $Path -split "\?", 2
  if ($parts.Length -lt 2) {
    return ""
  }

  foreach ($pair in ($parts[1] -split "&")) {
    if ([string]::IsNullOrWhiteSpace($pair)) {
      continue
    }
    $keyValue = $pair -split "=", 2
    $key = [Uri]::UnescapeDataString($keyValue[0].Replace("+", " "))
    if ($key -ne $Name) {
      continue
    }
    $value = if ($keyValue.Length -gt 1) { $keyValue[1] } else { "" }
    return [Uri]::UnescapeDataString($value.Replace("+", " "))
  }

  return ""
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$HeadOnly
  )

  $headers = @(
    "HTTP/1.1 $StatusCode $StatusText",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    "Cache-Control: no-store",
    "Access-Control-Allow-Origin: *",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Send-Text {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$Text,
    [bool]$HeadOnly
  )

  $body = [System.Text.Encoding]::UTF8.GetBytes($Text)
  Send-Response -Stream $Stream -StatusCode $StatusCode -StatusText $StatusText -ContentType "text/plain; charset=utf-8" -Body $body -HeadOnly $HeadOnly
}

function Send-Json {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [object]$Data,
    [bool]$HeadOnly
  )

  $json = $Data | ConvertTo-Json -Compress
  $body = [System.Text.Encoding]::UTF8.GetBytes($json)
  Send-Response -Stream $Stream -StatusCode $StatusCode -StatusText $StatusText -ContentType "application/json; charset=utf-8" -Body $body -HeadOnly $HeadOnly
}

function Get-MelodifyVersionFiles {
  $paths = @(
    "index.html",
    "styles.css",
    "app.js",
    "sw.js",
    "manifest.webmanifest",
    "tools/melodify-server.ps1"
  )

  $iconsRoot = Join-Path $root "icons"
  if (Test-Path -LiteralPath $iconsRoot) {
    $paths += Get-ChildItem -LiteralPath $iconsRoot -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
      $_.FullName.Substring($rootPrefix.Length).Replace([System.IO.Path]::DirectorySeparatorChar, "/")
    }
  }

  return $paths | Sort-Object -Unique
}

function Get-MelodifySignature {
  param([string[]]$RelativePaths)

  $parts = New-Object "System.Collections.Generic.List[string]"
  foreach ($relativePath in ($RelativePaths | Sort-Object -Unique)) {
    $localRelative = $relativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $path = Join-Path $root $localRelative
    if (Test-Path -LiteralPath $path -PathType Leaf) {
      $item = Get-Item -LiteralPath $path
      [void]$parts.Add("$relativePath|$($item.Length)|$($item.LastWriteTimeUtc.Ticks)")
    } else {
      [void]$parts.Add("$relativePath|missing")
    }
  }

  $text = [string]::Join("`n", $parts)
  $hash = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    return [BitConverter]::ToString($hash.ComputeHash($bytes)).Replace("-", "").ToLowerInvariant()
  } finally {
    $hash.Dispose()
  }
}

function Send-MelodifyVersion {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [bool]$HeadOnly
  )

  $appFiles = Get-MelodifyVersionFiles
  $serverFile = "tools/melodify-server.ps1"
  $data = [ordered]@{
    signature = Get-MelodifySignature -RelativePaths $appFiles
    serverSignature = Get-MelodifySignature -RelativePaths @($serverFile)
    files = $appFiles.Count
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  }

  Send-Json -Stream $Stream -StatusCode 200 -StatusText "OK" -Data $data -HeadOnly $HeadOnly
}

function Start-MelodifyReplacementServer {
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $serverScript,
    "-Port",
    $Port,
    "-FixedPort",
    "-NoOpen"
  )

  Start-Process -FilePath "powershell" -ArgumentList $arguments -WindowStyle Hidden -WorkingDirectory $root
}

function Send-MelodifyRestart {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [bool]$HeadOnly
  )

  Send-Text -Stream $Stream -StatusCode 200 -StatusText "OK" -Text "Melodify restart requested." -HeadOnly $HeadOnly
  if (-not $HeadOnly) {
    $script:restartRequested = $true
  }
}

function Send-YoutubeFeed {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$Path,
    [bool]$HeadOnly
  )

  $channelId = Get-QueryValue -Path $Path -Name "channelId"
  if ($channelId -notmatch "^UC[A-Za-z0-9_-]{22}$") {
    Send-Text -Stream $Stream -StatusCode 400 -StatusText "Bad Request" -Text "Invalid channel ID." -HeadOnly $HeadOnly
    return
  }

  $feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=$([Uri]::EscapeDataString($channelId))"
  try {
    $request = [System.Net.HttpWebRequest]::Create($feedUrl)
    $request.Method = "GET"
    $request.UserAgent = "Melodify RSS Launcher"
    $request.Timeout = 6000
    $request.ReadWriteTimeout = 6000

    $response = $request.GetResponse()
    try {
      $responseStream = $response.GetResponseStream()
      $memory = [System.IO.MemoryStream]::new()
      $responseStream.CopyTo($memory)
      Send-Response -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "application/xml; charset=utf-8" -Body $memory.ToArray() -HeadOnly $HeadOnly
    } finally {
      if ($responseStream) {
        $responseStream.Close()
      }
      $response.Close()
    }
  } catch {
    Send-Text -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "Feed unavailable." -HeadOnly $HeadOnly
  }
}

function Test-YoutubeUrl {
  param([string]$Url)

  try {
    $uri = [Uri]$Url
  } catch {
    return $false
  }
  if (-not $uri.IsAbsoluteUri) {
    return $false
  }

  $hostName = $uri.Host.ToLowerInvariant()
  return (
    ($uri.Scheme -eq "http" -or $uri.Scheme -eq "https") -and
    ($hostName -eq "youtu.be" -or $hostName -eq "youtube.com" -or $hostName.EndsWith(".youtube.com"))
  )
}

function Send-YoutubeOEmbed {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$Path,
    [bool]$HeadOnly
  )

  $videoUrl = Get-QueryValue -Path $Path -Name "url"
  if (-not (Test-YoutubeUrl -Url $videoUrl)) {
    Send-Text -Stream $Stream -StatusCode 400 -StatusText "Bad Request" -Text "{""error"":""Invalid YouTube URL.""}" -HeadOnly $HeadOnly
    return
  }

  $metadataUrl = "https://www.youtube.com/oembed?url=$([Uri]::EscapeDataString($videoUrl))&format=json"
  try {
    $request = [System.Net.HttpWebRequest]::Create($metadataUrl)
    $request.Method = "GET"
    $request.UserAgent = "Melodify RSS Launcher"
    $request.Timeout = 6000
    $request.ReadWriteTimeout = 6000

    $response = $request.GetResponse()
    try {
      $responseStream = $response.GetResponseStream()
      $memory = [System.IO.MemoryStream]::new()
      $responseStream.CopyTo($memory)
      Send-Response -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "application/json; charset=utf-8" -Body $memory.ToArray() -HeadOnly $HeadOnly
    } finally {
      if ($responseStream) {
        $responseStream.Close()
      }
      $response.Close()
    }
  } catch {
    Send-Text -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "{""error"":""Metadata unavailable.""}" -HeadOnly $HeadOnly
  }
}

function Get-RemoteText {
  param(
    [string]$Url,
    [int]$Timeout = 3500,
    [string]$Accept = "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7"
  )

  try {
    $request = [System.Net.HttpWebRequest]::Create($Url)
    $request.Method = "GET"
    $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Melodify Launcher"
    $request.Accept = $Accept
    $request.Timeout = $Timeout
    $request.ReadWriteTimeout = $Timeout

    $response = $request.GetResponse()
    try {
      $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
      try {
        return $reader.ReadToEnd()
      } finally {
        $reader.Close()
      }
    } finally {
      $response.Close()
    }
  } catch {
    return $null
  }
}

function Add-VideoLinksFromText {
  param(
    [System.Text.StringBuilder]$Builder,
    [string]$Text,
    [string]$Source
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return 0
  }

  $ids = New-Object "System.Collections.Generic.HashSet[string]"
  $patterns = @(
    '"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"',
    '"url"\s*:\s*"(?:/watch\?v=|https?:\/\/(?:www\.)?youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})',
    '"url"\s*:\s*"(?:/shorts\/|https?:\/\/(?:www\.)?youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})',
    '(?:watch\?v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})'
  )

  foreach ($pattern in $patterns) {
    foreach ($match in [regex]::Matches($Text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
      [void]$ids.Add($match.Groups[1].Value)
    }
  }

  foreach ($id in $ids) {
    [void]$Builder.AppendLine("<a data-source=""$Source"" href=""https://www.youtube.com/watch?v=$id"">YouTube video $id</a>")
  }

  return $ids.Count
}

function Get-InvidiousApiBases {
  return @(
    "https://inv.thepixora.com",
    "https://yewtu.be",
    "https://vid.puffyan.us"
  )
}

function Add-NoKeyVideoSearchResults {
  param(
    [System.Text.StringBuilder]$Builder,
    [string]$Query,
    [string]$Type
  )

  if ($Type -eq "channels") {
    return 0
  }

  $count = 0
  $targetCount = if ($Type -eq "channel-videos") { 80 } elseif ($Type -eq "shorts") { 60 } else { 30 }
  $searchPhrase = if ($Type -eq "shorts") { "$Query music shorts" } elseif ($Type -eq "channel-videos") { "$Query music videos" } else { "$Query music video" }
  $encodedQuery = [Uri]::EscapeDataString($searchPhrase)
  $pages = if ($Type -eq "channel-videos" -or $Type -eq "shorts") { 1, 2, 3 } else { 1, 2 }
  $pipedUrls = @()
  foreach ($page in $pages) {
    $pipedUrls += @(
      "https://pipedapi.kavin.rocks/search?q=$encodedQuery&filter=videos&page=$page",
      "https://pipedapi.adminforge.de/search?q=$encodedQuery&filter=videos&page=$page"
    )
  }
  $pipedUrls += @(
    "https://pipedapi.kavin.rocks/search?q=$encodedQuery&filter=videos",
    "https://pipedapi.adminforge.de/search?q=$encodedQuery&filter=videos"
  )

  foreach ($url in $pipedUrls) {
    $text = Get-RemoteText -Url $url -Timeout 3000 -Accept "application/json"
    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }
    [void]$Builder.AppendLine("<!-- Melodify no-key source: $url -->")
    [void]$Builder.AppendLine($text)
    $count += Add-VideoLinksFromText -Builder $Builder -Text $text -Source "piped"
    if ($count -ge $targetCount) {
      return $count
    }
  }

  $duration = if ($Type -eq "shorts") { "&duration=short" } else { "" }
  foreach ($base in Get-InvidiousApiBases) {
    foreach ($page in $pages) {
      $url = "$base/api/v1/search?q=$encodedQuery&type=video$duration&page=$page"
      $text = Get-RemoteText -Url $url -Timeout 3000 -Accept "application/json"
      if ([string]::IsNullOrWhiteSpace($text)) {
        continue
      }
      [void]$Builder.AppendLine("<!-- Melodify no-key source: $url -->")
      [void]$Builder.AppendLine($text)
      $count += Add-VideoLinksFromText -Builder $Builder -Text $text -Source "invidious"
      if ($count -ge $targetCount) {
        return $count
      }
    }
  }

  return $count
}

function Send-YoutubeDiscovery {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$Path,
    [bool]$HeadOnly
  )

  $query = (Get-QueryValue -Path $Path -Name "q").Trim()
  $type = (Get-QueryValue -Path $Path -Name "type").Trim().ToLowerInvariant()
  if ([string]::IsNullOrWhiteSpace($query) -or $query.Length -gt 120) {
    Send-Text -Stream $Stream -StatusCode 400 -StatusText "Bad Request" -Text "Invalid search query." -HeadOnly $HeadOnly
    return
  }

  $searchQueries = @()
  if ($type -eq "channels") {
    $searchQueries += "(site:youtube.com/channel/UC OR site:youtube.com/@) $query YouTube channel"
    $searchQueries += "$query music YouTube channel"
    $searchQueries += "$query artist YouTube channel"
  } elseif ($type -eq "shorts") {
    $searchQueries += "site:youtube.com/shorts $query music"
    $searchQueries += "$query YouTube shorts"
  } elseif ($type -eq "channel-videos") {
    $searchQueries += "site:youtube.com/watch $query music"
    $searchQueries += "$query YouTube music videos"
    $searchQueries += "$query official music videos"
  } else {
    $searchQueries += "site:youtube.com/watch $query music"
    $searchQueries += "site:youtu.be $query music"
    $searchQueries += "site:youtube.com/watch $query music video"
    $searchQueries += "$query song YouTube"
    $searchQueries += "$query music video YouTube"
    $searchQueries += "$query official music video"
    $searchQueries += "$query lyrics"
    $searchQueries += "$query official audio"
  }

  $resultCount = if ($type -eq "channel-videos" -or $type -eq "shorts") { 100 } else { 50 }
  $combined = New-Object System.Text.StringBuilder
  $successCount = 0
  $videoLinkCount = 0
  $frontEndCount = Add-NoKeyVideoSearchResults -Builder $combined -Query $query -Type $type

  foreach ($searchQuery in ($searchQueries | Select-Object -First 3)) {
    if ($frontEndCount -ge 24 -and $type -ne "channels") {
      break
    }
    $encodedQuery = [Uri]::EscapeDataString($searchQuery)
    $searchUrls = @(
      "https://www.bing.com/search?count=$resultCount&q=$encodedQuery",
      "https://duckduckgo.com/html/?q=$encodedQuery",
      "https://www.google.com/search?num=$resultCount&hl=en&q=$encodedQuery"
    )

    foreach ($searchUrl in $searchUrls) {
      try {
        $request = [System.Net.HttpWebRequest]::Create($searchUrl)
        $request.Method = "GET"
        $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Melodify Launcher"
        $request.Timeout = 3000
        $request.ReadWriteTimeout = 3000

        $response = $request.GetResponse()
        try {
          $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
          try {
            [void]$combined.AppendLine("<!-- Melodify source: $searchUrl -->")
            $text = $reader.ReadToEnd()
            [void]$combined.AppendLine($text)
            $successCount += 1
            $videoLinkCount += Add-VideoLinksFromText -Builder $combined -Text $text -Source "web"
          } finally {
            $reader.Close()
          }
        } finally {
          $response.Close()
        }
      } catch {
        continue
      }

      if ($videoLinkCount + $frontEndCount -ge 60) {
        break
      }
    }

    if ($videoLinkCount + $frontEndCount -ge 60) {
      break
    }
  }

  if ($successCount -gt 0 -or $frontEndCount -gt 0) {
    $body = [System.Text.Encoding]::UTF8.GetBytes($combined.ToString())
    Send-Response -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "text/html; charset=utf-8" -Body $body -HeadOnly $HeadOnly
  } else {
    Send-Text -Stream $Stream -StatusCode 502 -StatusText "Bad Gateway" -Text "Discovery unavailable." -HeadOnly $HeadOnly
  }
}

function Open-MelodifyBrowser {
  param(
    [string]$Url,
    [bool]$UseBrowserMode
  )

  $browserCandidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($browser) {
    $argument = if ($UseBrowserMode) { $Url } else { "--app=$Url" }
    Start-Process -FilePath $browser -ArgumentList $argument
  } else {
    Start-Process $Url
  }
}

try {
  if (-not $Quiet) {
    if ($existingServer) {
      Write-Host "Melodify is already running at $prefix"
    } else {
      Write-Host "Melodify is open at $prefix"
      Write-Host "Close this window to stop Melodify."
    }
  }

  if (-not $NoOpen) {
    Open-MelodifyBrowser -Url $prefix -UseBrowserMode:$BrowserMode
  }

  if ($existingServer) {
    return
  }

  while (-not $script:restartRequested) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $buffer = New-Object byte[] 8192
      $count = $stream.Read($buffer, 0, $buffer.Length)
      if ($count -le 0) {
        continue
      }

      $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $count)
      $requestLine = ($request -split "`r?`n")[0]
      if ($requestLine -notmatch "^(GET|HEAD) ([^ ]+) HTTP/") {
        Send-Text -Stream $stream -StatusCode 400 -StatusText "Bad Request" -Text "Bad request" -HeadOnly $false
        continue
      }

      $method = $matches[1]
      $path = $matches[2]
      $headOnly = $method -eq "HEAD"

      if ($path -match "^/__melodify/health(?:\?|$)") {
        Send-Text -Stream $stream -StatusCode 200 -StatusText "OK" -Text "Melodify OK" -HeadOnly $headOnly
        continue
      }

      if ($path -match "^/__melodify/version(?:\?|$)") {
        Send-MelodifyVersion -Stream $stream -HeadOnly $headOnly
        continue
      }

      if ($path -match "^/__melodify/restart(?:\?|$)") {
        Send-MelodifyRestart -Stream $stream -HeadOnly $headOnly
        continue
      }

      if ($path -match "^/yt/feed(?:\?|$)") {
        Send-YoutubeFeed -Stream $stream -Path $path -HeadOnly $headOnly
        continue
      }

      if ($path -match "^/yt/oembed(?:\?|$)") {
        Send-YoutubeOEmbed -Stream $stream -Path $path -HeadOnly $headOnly
        continue
      }

      if ($path -match "^/yt/discover(?:\?|$)") {
        Send-YoutubeDiscovery -Stream $stream -Path $path -HeadOnly $headOnly
        continue
      }

      $target = Resolve-RequestPath -Path $path

      if (-not $target) {
        Send-Text -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Text "Forbidden" -HeadOnly $headOnly
      } elseif (-not [System.IO.File]::Exists($target)) {
        Send-Text -Stream $stream -StatusCode 404 -StatusText "Not Found" -Text "Not found" -HeadOnly $headOnly
      } else {
        $body = [System.IO.File]::ReadAllBytes($target)
        Send-Response -Stream $stream -StatusCode 200 -StatusText "OK" -ContentType (Get-MimeType -Path $target) -Body $body -HeadOnly $headOnly
      }
    } catch {
      if ($stream) {
        Send-Text -Stream $stream -StatusCode 500 -StatusText "Internal Server Error" -Text "Melodify could not serve this file." -HeadOnly $false
      }
    } finally {
      if ($stream) {
        $stream.Close()
      }
      $client.Close()
    }
  }
} finally {
  if ($listener) {
    $listener.Stop()
  }
  if ($script:restartRequested) {
    Start-MelodifyReplacementServer
  }
}
