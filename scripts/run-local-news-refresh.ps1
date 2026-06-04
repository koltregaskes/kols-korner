[CmdletBinding()]
param(
  [string]$TargetDate = ''
)

$ErrorActionPreference = 'Stop'

function Invoke-NativeStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$ArgumentList = @(),
    [Parameter(Mandatory = $true)]
    [string]$FailureLabel
  )

  Write-Host ">> $FilePath $($ArgumentList -join ' ')"
  & $FilePath @ArgumentList
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$FailureLabel failed with exit code $exitCode"
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $repoRoot 'logs'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logsDir "local-news-refresh-$timestamp.log"
$artifactPath = Join-Path $logsDir "local-news-refresh-$timestamp-output"
$worktreePath = Join-Path ([System.IO.Path]::GetTempPath()) "kols-korner-local-news-refresh-$timestamp"
$pushedLocation = $false
$worktreeCreated = $false

function Copy-RefreshArtifact {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  $source = Join-Path $worktreePath $RelativePath
  if (-not (Test-Path -LiteralPath $source)) {
    return
  }

  $destination = Join-Path $artifactPath $RelativePath
  $destinationParent = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

function Remove-OldRefreshArtifacts {
  Get-ChildItem -LiteralPath $logsDir -Directory -Filter 'local-news-refresh-*-output' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 4 |
    Remove-Item -Recurse -Force
}

if ([string]::IsNullOrWhiteSpace($TargetDate)) {
  $TargetDate = Get-Date -Format 'yyyy-MM-dd'
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
Start-Transcript -Path $logPath -Force | Out-Null

try {
  Push-Location $repoRoot
  $pushedLocation = $true

  Write-Warning 'Dirty-tree fallback mode: skipping git pull, commit, and push.'
  Write-Host "Running local-only news pipeline for $TargetDate in temporary worktree: $worktreePath"

  Invoke-NativeStep -FilePath 'git' -ArgumentList @('worktree', 'add', '--detach', $worktreePath, 'HEAD') -FailureLabel 'git worktree add'
  $worktreeCreated = $true

  Pop-Location
  $pushedLocation = $false
  Push-Location $worktreePath
  $pushedLocation = $true

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/fetch-news.mjs', '--date', $TargetDate) -FailureLabel 'fetch-news'
  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/generate-daily-digest.mjs', '--date', $TargetDate, '--allow-empty', '--force') -FailureLabel 'generate-daily-digest'
  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/build.mjs') -FailureLabel 'build'

  New-Item -ItemType Directory -Path $artifactPath -Force | Out-Null
  Copy-RefreshArtifact -RelativePath "news-digests/$TargetDate-articles.json"
  Copy-RefreshArtifact -RelativePath "news-digests/$TargetDate-digest.md"
  Copy-RefreshArtifact -RelativePath "content/daily-digest-$TargetDate.md"
  Copy-RefreshArtifact -RelativePath "site/news-digests/$TargetDate-digest.md"
  Copy-RefreshArtifact -RelativePath "site/posts/$TargetDate"
  Copy-RefreshArtifact -RelativePath 'site/data/news-articles.json'
  Copy-RefreshArtifact -RelativePath 'site/data/news-digests.json'
  Copy-RefreshArtifact -RelativePath 'site/feed.xml'
  Copy-RefreshArtifact -RelativePath 'site/sitemap.xml'
  Remove-OldRefreshArtifacts
  Write-Host "Local refresh artifacts preserved under ignored logs folder: $artifactPath"
}
finally {
  if ($pushedLocation) {
    Pop-Location -ErrorAction SilentlyContinue
  }
  if ($worktreeCreated) {
    Push-Location $repoRoot
    & git worktree remove --force $worktreePath
    Pop-Location -ErrorAction SilentlyContinue
  }
  Stop-Transcript | Out-Null
}
