[CmdletBinding()]
param(
  [string]$TargetDate = '',
  [string]$SourceDigestDirectory = '',
  [string]$RepositoryUrl = '',
  [string]$BaseBranch = 'main',
  [switch]$Publish
)

$ErrorActionPreference = 'Stop'

function Invoke-NativeStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$ArgumentList = @(),
    [Parameter(Mandatory = $true)]
    [string]$FailureLabel,
    [switch]$HideArguments
  )

  if ($HideArguments) {
    Write-Host ">> $FilePath [arguments hidden]"
  } else {
    Write-Host ">> $FilePath $($ArgumentList -join ' ')"
  }
  & $FilePath @ArgumentList
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$FailureLabel failed with exit code $exitCode"
  }
}

function Get-NativeOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [string[]]$ArgumentList = @(),
    [Parameter(Mandatory = $true)]
    [string]$FailureLabel
  )

  $output = @(& $FilePath @ArgumentList)
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$FailureLabel failed with exit code $exitCode"
  }

  return $output
}

function Get-GitStatusPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$StatusLine
  )

  if ($StatusLine.Length -lt 4) {
    return ''
  }

  $pathText = $StatusLine.Substring(3).Trim()
  if ($pathText -like '* -> *') {
    $pathText = ($pathText -split ' -> ', 2)[1]
  }

  return $pathText.Trim('"').Replace('\', '/')
}

function Test-AllowedSourcePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$DigestFileName,
    [Parameter(Mandatory = $true)]
    [string]$DateKey
  )

  return (
    $Path -eq "news-digests/$DigestFileName" -or
    $Path -eq "content/daily-digest-$DateKey.md"
  )
}

$repoRoot = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($TargetDate)) {
  $TargetDate = [DateTime]::Today.ToString('yyyy-MM-dd')
}

$parsedDate = [DateTime]::MinValue
if (-not [DateTime]::TryParseExact(
  $TargetDate,
  'yyyy-MM-dd',
  [Globalization.CultureInfo]::InvariantCulture,
  [Globalization.DateTimeStyles]::None,
  [ref]$parsedDate
)) {
  throw "TargetDate must use YYYY-MM-DD: $TargetDate"
}

if ([string]::IsNullOrWhiteSpace($SourceDigestDirectory)) {
  $SourceDigestDirectory = Join-Path $repoRoot 'news-digests'
}
$SourceDigestDirectory = [IO.Path]::GetFullPath($SourceDigestDirectory)
if (-not (Test-Path -LiteralPath $SourceDigestDirectory -PathType Container)) {
  throw "Source digest directory not found: $SourceDigestDirectory"
}

$sourceCandidates = @(
  (Join-Path $SourceDigestDirectory "$TargetDate-digest.md"),
  (Join-Path $SourceDigestDirectory "digest-$TargetDate.md")
)
$sourceDigest = $sourceCandidates |
  Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
  Select-Object -First 1

if (-not $sourceDigest) {
  throw "No routed source digest found for $TargetDate in $SourceDigestDirectory"
}

if ([string]::IsNullOrWhiteSpace($RepositoryUrl)) {
  Push-Location $repoRoot
  try {
    $RepositoryUrl = (
      Get-NativeOutput -FilePath 'git' -ArgumentList @('remote', 'get-url', 'origin') -FailureLabel 'git remote lookup'
    )[0]
  }
  finally {
    Pop-Location
  }
}

if ([string]::IsNullOrWhiteSpace($RepositoryUrl)) {
  throw 'RepositoryUrl could not be resolved.'
}
if ([string]::IsNullOrWhiteSpace($BaseBranch)) {
  throw 'BaseBranch must not be empty.'
}

$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
$clonePath = Join-Path $tempRoot ("kols-korner-routed-news-{0}-{1}" -f $TargetDate, [Guid]::NewGuid().ToString('N'))
$clonePath = [IO.Path]::GetFullPath($clonePath)
if (-not $clonePath.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing unsafe temporary clone path: $clonePath"
}

$pushedLocation = $false

try {
  Invoke-NativeStep -FilePath 'git' -ArgumentList @(
    'clone',
    '--branch',
    $BaseBranch,
    '--single-branch',
    '--',
    $RepositoryUrl,
    $clonePath
  ) -FailureLabel 'git clone' -HideArguments

  Push-Location $clonePath
  $pushedLocation = $true

  # The shared classifier writes digest-YYYY-MM-DD.md, which is a local-only
  # ignored filename in this repo. Normalise it into the tracked site contract.
  $digestFileName = "$TargetDate-digest.md"
  Copy-Item -LiteralPath $sourceDigest -Destination (Join-Path $clonePath "news-digests\$digestFileName") -Force

  Invoke-NativeStep -FilePath 'node' -ArgumentList @(
    'scripts/generate-daily-digest.mjs',
    '--date',
    $TargetDate,
    '--force'
  ) -FailureLabel 'digest generation'

  Invoke-NativeStep -FilePath 'node' -ArgumentList @('scripts/build.mjs') -FailureLabel 'site build'
  Invoke-NativeStep -FilePath 'node' -ArgumentList @(
    'scripts/check-news-freshness.mjs',
    '--required-date',
    $TargetDate
  ) -FailureLabel 'target-date freshness verification'

  $statusLines = @(
    Get-NativeOutput -FilePath 'git' -ArgumentList @('status', '--porcelain=v1') -FailureLabel 'git status'
  )
  $sourceStatusLines = @(
    $statusLines | Where-Object {
      $statusPath = Get-GitStatusPath -StatusLine $_
      $statusPath -and $statusPath -notlike 'site/*'
    }
  )

  if ($sourceStatusLines.Count -eq 0) {
    Write-Host "No publishable changes were produced for $TargetDate."
    return
  }

  $unexpectedPaths = @(
    $sourceStatusLines |
      ForEach-Object { Get-GitStatusPath -StatusLine $_ } |
      Where-Object {
        $_ -and -not (Test-AllowedSourcePath -Path $_ -DigestFileName $digestFileName -DateKey $TargetDate)
      }
  )

  if ($unexpectedPaths.Count -gt 0) {
    throw "Publisher produced out-of-scope path changes: $($unexpectedPaths -join ', ')"
  }

  Write-Host 'Verified source change scope:'
  $sourceStatusLines | ForEach-Object { Write-Host "  $_" }
  $generatedSiteChangeCount = @(
    $statusLines | Where-Object { (Get-GitStatusPath -StatusLine $_) -like 'site/*' }
  ).Count
  Write-Host "Build verification produced $generatedSiteChangeCount temporary site-file changes. They will not be staged; GitHub Pages rebuilds from committed source."

  if (-not $Publish) {
    Write-Host 'Validation-only run complete. Nothing was committed or pushed; use -Publish only after the live publishing gate is approved.'
    return
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @(
    'add',
    '--all',
    '--',
    "news-digests/$digestFileName",
    "content/daily-digest-$TargetDate.md"
  ) -FailureLabel 'git add'

  & git diff --cached --quiet --
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'No staged changes remain after verification.'
    return
  }
  if ($LASTEXITCODE -ne 1) {
    throw "git diff --cached failed with exit code $LASTEXITCODE"
  }

  Invoke-NativeStep -FilePath 'git' -ArgumentList @(
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--no-verify',
    '-m',
    "chore: publish routed news for $TargetDate"
  ) -FailureLabel 'git commit'

  Invoke-NativeStep -FilePath 'git' -ArgumentList @(
    'push',
    'origin',
    'HEAD:main'
  ) -FailureLabel 'git push'

  $pushedCommit = (
    Get-NativeOutput -FilePath 'git' -ArgumentList @('rev-parse', 'HEAD') -FailureLabel 'published commit readback'
  )[0]
  $remoteLine = (
    Get-NativeOutput -FilePath 'git' -ArgumentList @(
      'ls-remote',
      'origin',
      'refs/heads/main'
    ) -FailureLabel 'remote main readback'
  )[0]
  $remoteCommit = ($remoteLine -split '\s+')[0]
  if ($remoteCommit -ne $pushedCommit) {
    throw "Remote main readback mismatch: expected $pushedCommit, found $remoteCommit"
  }

  Write-Host "Pushed routed news for $TargetDate at commit $pushedCommit. GitHub Pages deployment and public readback remain separate verification steps."
}
finally {
  if ($pushedLocation) {
    Pop-Location -ErrorAction SilentlyContinue
  }

  if (Test-Path -LiteralPath $clonePath) {
    $resolvedCleanupPath = [IO.Path]::GetFullPath($clonePath)
    if (-not $resolvedCleanupPath.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing unsafe cleanup path: $resolvedCleanupPath"
    }
    Remove-Item -LiteralPath $resolvedCleanupPath -Recurse -Force
  }
}
