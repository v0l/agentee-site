$ErrorActionPreference = "Stop"

$repo = "v0l/agentee"
$target = "x86_64-pc-windows-msvc"
$asset = "agentee-$target.zip"
$version = if ($env:AGENTEE_VERSION) { $env:AGENTEE_VERSION } else { "latest" }
$dir = if ($env:AGENTEE_INSTALL_DIR) { $env:AGENTEE_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA "agentee\bin" }

if ($version -eq "latest") {
  $url = "https://github.com/$repo/releases/latest/download/$asset"
} else {
  $url = "https://github.com/$repo/releases/download/$version/$asset"
}

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("agentee-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
  Write-Host "agentee: downloading $asset ($version)"
  $zip = Join-Path $tmp $asset
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

  try {
    $want = ((Invoke-WebRequest -Uri "$url.sha256" -UseBasicParsing).Content -split '\s+')[0]
    $have = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    if ($want -and ($want.ToLower() -ne $have)) { throw "agentee: checksum mismatch for $asset" }
  } catch [System.Net.WebException] { }

  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  Copy-Item (Join-Path $tmp "agentee-$target\agentee.exe") (Join-Path $dir "agentee.exe") -Force

  $path = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not ($path -split ";" | Where-Object { $_ -eq $dir })) {
    [Environment]::SetEnvironmentVariable("Path", "$path;$dir", "User")
    Write-Host "agentee: added $dir to your user PATH; open a new terminal"
  }
  Write-Host "agentee: installed $(& (Join-Path $dir 'agentee.exe') --version) to $dir"
  Write-Host "agentee: give your agent the skill with: npx skills add https://agentee.sh"
} finally {
  Remove-Item -Recurse -Force $tmp
}
