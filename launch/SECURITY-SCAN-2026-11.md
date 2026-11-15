# Kol's Korner launch security scan, 15 November 2026

**STOP: unresolved potential credential. Rank 9 is not ready for acceptance.** The corrected scanner stopped with exit 2 on a historical credential assignment. No value was displayed or retained in the findings ledger.

| Blocking finding | Metadata |
|---|---|
| File | `scripts/build.mjs` |
| Line | 1320 |
| Historical commit | `2a6c1aa06bf213dbaa92316ae03487f2250a4aa6` |
| Pattern | `credential-assignment` |
| Classification | Potential real credential, unverified. No provider validity check was attempted. |

Syntax-only triage establishes a quoted assignment beginning with interpolation syntax. It does not establish that this is an actual template expression rather than a literal. The finding remains unresolved; no exception was added to suppress it. No value, excerpt or candidate-derived fingerprint is included here. No removal or rotation was attempted.

**Smallest unblocker:** private owner review of that exact historical assignment. If it is proven to be source interpolation, add a narrowly justified classification and regression. If it is a credential, Kol handles remediation. Resume a fresh full scan only after the finding is resolved. The built-site scan did not start after this stop.

## Current source and evidence

- Checked clock: **2026-11-15 19:00:35 UTC**. UK time is the same on this date.
- Current source head: `7c6322cadf53c9b92b41b642f38b45f14daed31b` (`origin/main`), fetched successfully from the existing repository during this round.
- The scan ran with HEAD exactly at that main commit, plus the corrected scanner copied into the working tree. It did not use the old `34d51b7` snapshot or treat the PR head as current main.
- PR under review: [Kol's Korner #56](https://github.com/koltregaskes/kols-korner/pull/56), original head `b1fd774fd1196b5fad98cd9cc5f99536a809d559`.
- A separate validation branch was rebased onto current main, producing `cf7abee7ab87d2455be9c8b168a86b54a616d8f4`. The scope run used the exact main head above rather than that rebased PR commit.
- Lockfile SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`. Manifest SHA-256: `bf75bfae4a68e99b611156518c5f0f133e34e2923242347dd614bee52ce12347`. Both match the earlier dependency graph.
- Corrected scanner SHA-256: `d7056d4abd82a701cb0753ae60b392fb109d07c7b719d00e2c7433224faead9e`. Runtime: Node.js 26.12.1. Execution on the CI Node.js 24.22.1 runtime remains unverified.

## Four review fixes and regression evidence

| Finding | Change | Verification |
|---|---|---|
| Candidate-bearing filenames | Every output object crosses one redaction boundary. Matching path segments become `[redacted-segment]`; spanning matches become `[redacted-path]`. This includes finding, exclusion and link paths; unexpected matching metadata is withheld. Commit-message contents and child-process errors are never emitted. Internal deduplication uses the original path before redaction. | Four built-in metadata regressions, plus filename CLI controls in working-tree and history modes, passed without candidate values in either output stream. |
| Broad SK company-prefix exception | Require a lower-case, multi-word company news slug with bounded word segments. Mixed-case or unsegmented high-entropy bodies are blocking candidates. An unrelated URL elsewhere on the line does not justify suppression. | Six built-in company controls passed; both company prefixes also stopped with exit 2 in working-tree and history CLI fixtures. |
| Quoted literals treated as expressions | Preserve quote context. Only unquoted configuration/method expressions or actual backtick interpolation receive expression classification. Quoted `process.` and `https://` prefixes are insufficient. | Six quoted-literal controls, including combined URL/SK cases, and two genuine-expression controls passed. Quoted process, URL and combined URL/company CLI fixtures stopped with exit 2 in both scopes. |
| Credential stores read before exclusion | Expanded protected paths include `.pypirc`, npm/netrc/Git stores, Docker, AWS, Azure, Kubernetes, SSH `id_*` keys, PKCS/key stores, `.htpasswd`, database client files and common cloud/package-manager stores. Tree selection uses the same exclusion function before selecting any blob for cat-file. | 48 working-tree and 48 history metadata-only pre-read controls passed. No protected file was created or opened for these probes. |

The original 17 detection, seven path, three classification and one redaction controls also passed. Additional CLI evidence covers six synthetic cases across two scopes, 12 runs total. Every expected stop was exit 2, with no synthetic candidate value in stdout or stderr. All fixtures were deliberately synthetic and isolated from the current-main checkout.

## Current scan counts and ledger

The [redacted findings ledger](security-scan-findings.json) has been regenerated for current main. Its status is stopped and its coverage is partial. The previous snapshot ledger and the old PR-base recheck section have been replaced.

| Scope | State | Files/versions read | Bytes read | Matches | Test | False positive | Potential real |
|---|---|---:|---:|---:|---:|---:|---:|
| working-tree | completed | 1,181 | 129,590,275 | 33 | 4 | 29 | 0 |
| history | STOPPED, partial | 3,354 | 202,067,428 | 395 | 12 | 382 | 1 |
| site | NOT STARTED after stop | unknown | unknown | unknown | unknown | unknown | unknown |

Before reading blobs, history metadata enumerated 475 reachable commits, 275,845 tree entries and 4,150 unique path/blob versions. All 475 commit messages were checked. Only 3,354 file versions were read before exit 2. The clone is not shallow. These figures describe this local reference set; they do not establish that omitted upstream references, unreachable objects or reflogs were scanned.

Working-tree counts describe current main after a successful build, with the corrected scanner, before the regenerated report and ledger were added. Scope counts overlap. Historical rows identify a representative commit containing that version, not necessarily the introducing commit. Masked paths may be indistinguishable in output; internal counting does not collapse them.

| Pattern | Matches so far | Classification | Reason |
|---|---:|---|---|
| openai-token | 314 | false positive | Lower-case, multi-word SK Hynix or SK Telecom news slug; mixed-case or unsegmented high-entropy bodies are not exempt. |
| credential-assignment | 78 | false positive | Unquoted source expression or configuration reference, not a quoted credential literal. |
| credential-assignment | 19 | false positive | JavaScript template expression constructing a value, not a literal credential. |
| github-token | 8 | test | Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data. |
| credential-url | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 1 | real | Potential real credential; validity unverified. Stop and obtain private owner review without revealing the value. |

No protected files or symbolic links were encountered among the enumerated scan inputs before the stop. Environment/key/store exclusions remain mandatory for all future runs, including history. UTF-8 text and ASCII bytes in binary files are screened; media content is not decoded. Gitleaks was not run. A stopped or failed run never constitutes a zero finding.

## Build and dependency status

`node scripts/build.mjs` completed with exit 0 on current main. That establishes a successful local build. It does not establish a completed secret scan of that output: the scanner stopped in history before reaching the site scope. No built-artifact secret-scan manifest is claimed for this round.

**Current dependency advisory status: not rechecked.** This round permits network access only for git fetch, so no npm audit request was made. The previous full and production-only audits on `34d51b7` returned zero advisories on 15 November, against the identical lockfile hash recorded above. That is historical evidence for an unchanged graph, not a newly queried advisory result.

The unchanged lockfile contains five development/test packages: @axe-core/playwright 4.14.0, @playwright/test 1.65.0, axe-core 4.14.0, playwright 1.65.0 and playwright-core 1.65.0. There are no external production dependencies in that graph. No install, dependency bump or lockfile edit was performed. A fresh advisory query still needs an authorised registry request before freeze acceptance.

## Commands, exit states and resumption

This round used a local isolated copy, `git fetch origin main chore/launch-security-scan`, and `git rebase origin/main` for validation. The exact-main copy was checked out at `7c6322cadf53c9b92b41b642f38b45f14daed31b`. Commands run there were:

```powershell
node --check scripts/scan-launch-secrets.mjs
node scripts/scan-launch-secrets.mjs --self-test
node scripts/build.mjs
node scripts/scan-launch-secrets.mjs
```

The last command requests working-tree, history and site in that order. It returned exit 2 and stopped before site. No separate site scan was run after discovering the unresolved candidate. Controls and build returned exit 0. CLI regressions were run separately using synthetic ordinary files and metadata-only protected-path probes.

After private classification/remediation, fetch the required refs, check out the exact intended freeze head, rebuild, and rerun all three scopes with the reviewed scanner. Keep JSON and logs in a sibling evidence folder. Inspect status, exit code, completed scopes, exclusions, counts and every finding; do not rely on process completion alone. Exit 0 means requested scopes completed without an unresolved finding, exit 1 means setup/operation/control failure, and exit 2 means stop for private review. Do not resume this run or append its partial totals as if it completed.

The current-main source changes and build output are retained in the isolated working folder. Delivery contains only the scanner, this report and its metadata ledger. No application source, dependency manifest, lockfile or workflow was changed by the security correction. No values, raw source excerpts or direct candidate hashes are published in the ledger.

No pushes, posts, installs, environment-variable changes, provider credential checks, rotations or deployments were performed. Network use was limited to the authorised git fetch. The unrelated global Git ignore permission warning was left alone. The F: drive was unavailable on this round; the rules read earlier in the same session remained available. Freeze acceptance remains blocked by the unresolved finding, incomplete scope coverage and the unrefreshed dependency advisory check.
