param(
  [string]$TargetDate = '',
  [switch]$SkipPush,
  [switch]$SkipCommit
)

$ErrorActionPreference = 'Stop'

function Get-GitStatusLines {
  param(
    [string[]]$Paths
  )

  $statusArgs = @('status', '--porcelain', '--')
  if ($Paths) {
    $statusArgs += $Paths
  }

  $lines = @(& git @statusArgs)
  if ($LASTEXITCODE -ne 0) { throw "git status failed with exit code $LASTEXITCODE" }

  return $lines
}

function Get-GitStatusPath {
  param(
    [string]$StatusLine
  )

  if ([string]::IsNullOrWhiteSpace($StatusLine) -or $StatusLine.Length -lt 4) {
    return ''
  }

  $pathText = $StatusLine.Substring(3).Trim()

  if ($pathText.StartsWith('"') -and $pathText.EndsWith('"')) {
    $pathText = $pathText.Substring(1, $pathText.Length - 2)
  }

  if ($pathText -like '* -> *') {
    $pathText = ($pathText -split ' -> ', 2)[1]
  }

  return $pathText.Replace('\', '/')
}

function Test-IsGeneratedDigestArtifact {
  param(
    [string]$Path
  )

  return (
    $Path -like 'news-digests/*' -or
    $Path -like 'site/*' -or
    $Path -like 'content/daily-digest-*.md'
  )
}

function Test-IsAllowedUnpublishedDraft {
  param(
    [string]$Path
  )

  if ($Path -notlike 'content/*.md' -or $Path -like 'content/daily-digest-*.md') {
    return $false
  }

  $absolutePath = Join-Path $repoRoot $Path
  if (-not (Test-Path -LiteralPath $absolutePath)) {
    return $false
  }

  $head = (Get-Content -LiteralPath $absolutePath -TotalCount 40 -ErrorAction Stop) -join "`n"
  return $head -match '(?ms)^---\s+.*?^publish:\s*false\s*$.*?^---\s*$'
}

function Test-IsPipelineScript {
  param(
    [string]$Path
  )

  return @(
    'scripts/build.mjs',
    'scripts/fetch-news.mjs',
    'scripts/generate-daily-digest.mjs',
    'scripts/run-daily-news.ps1',
    'scripts/run-local-news-refresh.ps1'
  ) -contains $Path
}

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

function Invoke-LocalRefreshFallback {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TargetDate
  )

  Write-Warning 'Repository has non-generated changes. Falling back to local-only news refresh without git pull, commit, or push.'
  $powerShellHost = (Get-Process -Id $PID).Path
  Invoke-NativeStep -FilePath $powerShellHost -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    (Join-Path $PSScriptRoot 'run-local-news-refresh.ps1'),
    '-TargetDate',
    $TargetDate
  ) -FailureLabel 'local-news-refresh'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $repoRoot 'logs'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logsDir "daily-news-$timestamp.log"

if ([string]::IsNullOrWhiteSpace($TargetDate)) {
  $TargetDate = Get-Date -Format 'yyyy-MM-dd'
}

New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
Start-Transcript -Path $logPath -Force | Out-Null

try {
  Push-Location $repoRoot

  $preExistingChanges = @(Get-GitStatusLines)
  $preExistingManualChanges = @(
    $preExistingChanges | Where-Object {
      $statusPath = Get-GitStatusPath -StatusLine $_
      -not (Test-IsGeneratedDigestArtifact -Path $statusPath) -and
      -not (Test-IsAllowedUnpublishedDraft -Path $statusPath)
    }
  )

  if ($preExistingManualChanges.Count -gt 0) {
    Write-Warning 'Refusing to run while the repository has uncommitted non-generated changes.'
    $preExistingManualChanges | ForEach-Object { Write-Warning $_ }
    $dirtyPipelineScripts = @(
      $preExistingManualChanges | Where-Object {
        Test-IsPipelineScript -Path (Get-GitStatusPath -StatusLine $_)
      }
    )
    if ($dirtyPipelineScripts.Count -gt 0) {
      $dirtyPipelineScripts | ForEach-Object { Write-Warning "Dirty pipeline script blocks fallback: $_" }
      throw 'Production digest publish and local fallback are blocked by uncommitted pipeline script changes.'
    }
    Invoke-LocalRefreshFallback -TargetDate $TargetDate
    throw 'Local-only refresh completed, but production digest publish is blocked by uncommitted non-generated changes.'
  }

  $preExistingGeneratedChanges = @(
    $preExistingChanges | Where-Object {
      Test-IsGeneratedDigestArtifact -Path (Get-GitStatusPath -StatusLine $_)
    }
  )

  if ($preExistingGeneratedChanges.Count -gt 0) {
    Write-Warning 'Existing generated digest artifacts detected. Continuing because this job regenerates them.'
    $preExistingGeneratedChanges | ForEach-Object { Write-Warning $_ }
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @('pull', '--ff-only', 'origin', 'main') -FailureLabel 'git pull'

  Write-Host "Running shared news pipeline for $TargetDate"

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/fetch-news.mjs', '--date', $TargetDate) -FailureLabel 'fetch-news'

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/generate-daily-digest.mjs', '--date', $TargetDate, '--allow-empty', '--force') -FailureLabel 'generate-daily-digest'

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/build.mjs') -FailureLabel 'build'

  $generatedChanges = @(
    Get-GitStatusLines -Paths @('news-digests', ':(glob)content/daily-digest-*.md', 'site') | Where-Object {
      Test-IsGeneratedDigestArtifact -Path (Get-GitStatusPath -StatusLine $_)
    }
  )

  if ($generatedChanges.Count -eq 0) {
    Write-Host 'No digest changes detected.'
    return
  }

  $pathsToStage = @('news-digests', 'site', ':(glob)content/daily-digest-*.md')
  Invoke-NativeStep -FilePath 'git' -ArgumentList (@('add', '--all', '--') + $pathsToStage) -FailureLabel 'git add'

  & git diff --cached --quiet --
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No staged digest changes remain after refresh.'
    return
  }

  if ($SkipCommit) {
    Write-Host 'Skipping commit and push because -SkipCommit was provided.'
    return
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @('-c', 'commit.gpgsign=false', 'commit', '--no-verify', '-m', "chore: refresh daily digest for $TargetDate") -FailureLabel 'git commit'

  if (-not $SkipPush) {
    Invoke-NativeStep -FilePath 'git' -ArgumentList @('push', 'origin', 'main') -FailureLabel 'git push'
  }
}
finally {
  Pop-Location -ErrorAction SilentlyContinue
  Stop-Transcript | Out-Null
}
