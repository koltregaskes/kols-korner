# Kol's Korner launch security scan, 15 November 2026

**Verified for the supplied source snapshot:** both npm dependency audits returned zero advisories. The authorised pattern scan completed on the working tree, all reachable supplied Git history and the rebuilt public site, with zero unresolved potential real credentials. All matches are classified below and individually in [the redacted findings ledger](security-scan-findings.json).

**Freeze acceptance remains unverified:** the actual 11 December freeze head has not been selected or scanned here. Re-run the commands below on that exact head and its rebuilt artifact. This local result does not certify a future head or the live deployment.

## Recheck on the PR base

Before this PR was opened, `main` had moved to `d55d4a4e209d66a202a60233fd4dad881c58e2a6` (the launch operations runbook, #54). The same scanner was re-run there on 15 November 2026: `--self-test` passed (17 detection, 7 exclusion, 3 classification, 1 redaction case), `--scope=working-tree` found 32 candidates (4 test, 28 false positive, 0 potential real) and `--scope=history` completed with full history coverage and 693 candidates (12 test, 681 false positive, 0 potential real). The ledger below still describes the original `34d51b7` snapshot; the extra history matches come from the newer commits. All but two fall into the existing classified categories; the two new `jwt` matches (historical `site/data/news-articles.json` and `site/news-digests/2026-07-19-digest.md` at `7d1d957`) are the scanner's built-in false-positive class for a GitHub public-image signed URL copied from a news item: a short-lived image-delivery token, not an account or API credential. The freeze-head rerun below is still required.

## Identity and evidence

- Recorded from a checked clock: **2026-11-15 18:08:49 UTC**. UK time is the same on this date.
- Source head: `34d51b7dd73fc3a46aa7db7001816615dca2eab9`, supplied `origin/main` (`34d51b7`). Local branch: `chore/launch-security-scan`.
- Lockfile: `package-lock.json`, lockfile version 3; SHA-256 `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`.
- Package manifest SHA-256: `bf75bfae4a68e99b611156518c5f0f133e34e2923242347dd614bee52ce12347`.
- Scanner SHA-256: `0df07e73d1a46369a7b989a3b628a736a4587bfe35a3a0f433780d0bedf7d257`.
- Runtime used: Node.js 26.12.1, npm 11.20.0. The existing security workflow specifies Node.js 24.22.1; execution on that CI runtime was not performed.
- The script and this report are additions to the source head. No application source, dependency manifest, lockfile or workflow was changed by the patch.
- Rebuilt `site/`: **650 files, 81,094,408 bytes**, including 370 HTML, 10 JS, three JSON and 220 Markdown files, plus XML, CSS, images, audio and video. Artifact manifest SHA-256: `cdb08186932f8d4241d99bb802f3bbaffc673b3fa99f18ce2c164972632e6809`. The manifest hashes the JSON-encoded, path-sorted array of [relative path, file SHA-256] pairs.

## Dependency audit

The existing `.github/workflows/security.yml` runs `npm ci`, `npm audit --audit-level=low` and a redacted Gitleaks history scan. This authorised local exercise used only the existing lockfile and no installation.

| Audit | Exit | Info | Low | Moderate | High | Critical | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| All locked dependencies | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Production only, omit dev | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The full audit returned an empty `vulnerabilities` object and five development packages. There are **zero external production dependencies**; npm's `prod: 1` metadata includes the root project. The static build imports Node built-ins and local modules. The locked packages support browser/accessibility tests and are not bundled into the shipped static site.

| Package | Locked version | Exposure | Returned advisories | Fix |
|---|---|---|---:|---|
| @axe-core/playwright | 4.14.0 | Development/test tooling only | 0 | No change proposed by the returned audit. |
| @playwright/test | 1.65.0 | Development/test tooling only | 0 | No change proposed by the returned audit. |
| axe-core | 4.14.0 | Development/test tooling only | 0 | No change proposed by the returned audit. |
| playwright | 1.65.0 | Development/test tooling only | 0 | No change proposed by the returned audit. |
| playwright-core | 1.65.0 | Development/test tooling only | 0 | No change proposed by the returned audit. |

There are no returned advisories to list by severity or remediate. No patch/minor update is justified by these results. Both package files retain their original hashes. This result covers npm advisories for the locked package graph, not Docker images, Actions dependencies, browser binaries or unknown vulnerabilities.

The first two full audit attempts in the restricted network sandbox failed to obtain an advisory payload. They were not counted as clean scans. The same explicitly authorised registry-only audit then succeeded with approved network access. No alternate service, login or token was used.

## Secret scan coverage and findings

The offline scanner checks AWS identifiers and high-entropy secret assignments, Azure storage keys, GitHub tokens, Slack tokens/webhooks, Stripe secret/restricted keys, OpenAI and Anthropic keys, Google API/OAuth tokens, private-key blocks, JWTs, credential-bearing URLs and high-entropy assignments/queries named key, secret, token or password.

| Scope | Files/file versions | Bytes examined | Matches | Test | False positive | Potential real |
|---|---:|---:|---:|---:|---:|---:|---:|
| working-tree | 1,174 | 129,460,717 | 32 | 4 | 28 | 0 |
| history | 3,684 | 233,448,611 | 648 | 12 | 636 | 0 |
| site | 650 | 81,094,408 | 16 | 0 | 16 | 0 |

History coverage is **469 reachable commits**, **269,002 enumerated tree entries**, **3,684 unique path/blob versions** and all 469 commit messages. The clone is not shallow. Every branch/tag reachable through the supplied local refs is included by `git rev-list --all`. Deleted historical files are included via their commit trees. Unreachable objects, reflogs, omitted upstream refs and remote changes after the snapshot are outside that claim.

Working-tree counts describe the post-build source and scanner before this report and its ledger were written. Counts are per scope: the site overlaps the working tree, and history counts different immutable file versions. The 696 matches therefore do not represent 696 distinct credentials. Each ledger row supplies file, line, scope, representative commit where applicable, pattern, classification and reason; no candidate value, source excerpt or credential-derived fingerprint is retained.

| Pattern | Matches | Classification | Reason |
|---|---:|---|---|
| openai-token | 566 | false positive | SK Hynix or SK Telecom company-name news slug; the generic legacy OpenAI prefix overlaps that name. |
| credential-assignment | 90 | false positive | URL, source expression or configuration reference rather than a literal credential. |
| credential-assignment | 21 | false positive | JavaScript template expression constructing a value, not a literal credential. |
| github-token | 8 | test | Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data. |
| credential-url | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 1 | false positive | JavaScript method-call expression computing a value, not a literal credential. |
| credential-assignment | 2 | false positive | Supabase explicitly publishable browser key, not a secret service-role key. |

No finding required removal, rotation or dependency remediation. An unfamiliar candidate stops scanning immediately with exit 2 and metadata only; it must receive private owner review before continuing. No credentials were tested against a service.

The scanner enumerates paths before opening blobs and skips environment files, key/certificate files and credential stores, including historical versions. No protected file paths or symbolic links were encountered among the enumerated scan inputs. Operational directories such as `.git` and `node_modules` are not walked; Git history is read through Git object commands instead. Exclusions appear in the JSON output if encountered. The existing `.gitleaksignore` does not suppress this scanner's findings.

Controls passed: **17 positive detection cases, seven protected-path cases, three classification cases and one output-redaction case**. An invalid-scope control returned explicit failure JSON and exit 1. The working-tree scan also examined the scanner itself. Unknown candidates are conservatively labelled potentially real; provider validity is deliberately unverified. Binary assets receive UTF-8 and ASCII-byte pattern checks, without decoding image/audio/video content. Gitleaks was not run locally.

## Commands and freeze rerun

Local preparation was `git clone --no-hardlinks <supplied-local-repository> ./kk`, then `git switch -c chore/launch-security-scan origin/main`. Hardlinks were disabled to isolate the copy. Source head and non-shallow status were checked with `git rev-parse`; history uses `git rev-list --all`, `git log --all`, `git ls-tree -rz` and `git cat-file --batch` internally. Raw blob output stays inside the scanner process.

Run from the reviewed checkout in PowerShell. Keep outputs/cache in a sibling evidence folder so they cannot become scan inputs:

```powershell
New-Item -ItemType Directory -Force ../kk-security-evidence | Out-Null
git rev-parse HEAD
Get-FileHash -Algorithm SHA256 package-lock.json
npm.cmd audit --json --registry=https://registry.npmjs.org --cache=../kk-security-evidence/npm-cache --logs-max=0 --update-notifier=false --fetch-retries=0 --fetch-timeout=30000 > ../kk-security-evidence/npm-all.json
$allAuditExit = $LASTEXITCODE
npm.cmd audit --omit=dev --json --registry=https://registry.npmjs.org --cache=../kk-security-evidence/npm-cache --logs-max=0 --update-notifier=false --fetch-retries=0 --fetch-timeout=30000 > ../kk-security-evidence/npm-production.json
$productionAuditExit = $LASTEXITCODE
node --check scripts/scan-launch-secrets.mjs
if ($LASTEXITCODE -ne 0) { throw 'Scanner syntax check failed' }
node scripts/scan-launch-secrets.mjs --self-test
if ($LASTEXITCODE -ne 0) { throw 'Scanner controls failed' }
node scripts/build.mjs
if ($LASTEXITCODE -ne 0) { throw 'Build failed; do not certify site scan' }
node scripts/scan-launch-secrets.mjs > ../kk-security-evidence/secrets.json
$secretScanExit = $LASTEXITCODE
if ($secretScanExit -ne 0) { throw 'Secret scan stopped or failed; review metadata only' }
if ($allAuditExit -ne 0 -or $productionAuditExit -ne 0) { throw 'Dependency audit needs review; inspect JSON and distinguish findings from request failure' }
```

Inspect all three JSON payloads, scope counts and hashes; a zero shell exit alone is not acceptance. Scanner exit 0 means all requested scopes completed without an unresolved candidate; exit 1 means an operation/control failed; exit 2 means stop for private review. Scope-specific diagnosis is available via `--scope=working-tree`, `--scope=history` or `--scope=site`; acceptance uses all three after a successful build. The audit request needs npm-registry access, and a failed/empty request must remain failed or unverified.

## Delivery boundary

The patch adds the scanner, this report and the redacted findings ledger. The local build changed 369 tracked generated site files and created 77 further generated files; these are retained in the working copy for inspection and are **excluded from the security patch**. Their output is the rebuilt artifact scanned above. This is not a site regeneration release.

Local raw npm JSON, build logs and complete scanner output remain in the working folder's sibling `evidence/` directory. Git repeatedly warned that the local user's global Git ignore file could not be read (permission denied); that unrelated file was left alone and no workaround was used. Git operations and the scan of supplied reachable history completed successfully.

No installs, lockfile changes, environment-variable changes, credential-file reads, pushes, posts, deployments, credential rotations or live-site requests were performed. Network use was limited to the authorised npm registry audits. Re-run this assessment for the final freeze head/artifact or any intervening source/dependency change before claiming Rank 9 accepted.
