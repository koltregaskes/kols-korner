# Kol's Korner launch security scan, 15 November 2026

**STOP: a new unfamiliar assignment blocks completion.** The owner-approved narrow rule and synthetic regressions pass, and the build succeeds. The corrected scan on `7c6322cadf53c9b92b41b642f38b45f14daed31b` stopped in the working tree with exit 2. History and built-site scanning did not start. No complete run or freeze acceptance is claimed.

| New blocking finding | Metadata only |
|---|---|
| File | `scripts/build.mjs` |
| Line | 1166 |
| Source head | `7c6322cadf53c9b92b41b642f38b45f14daed31b` |
| Pattern | `credential-assignment` |
| Classification | Unfamiliar potential credential; unverified. No content inspection or self-classification followed this stop. |

**Smallest unblocker:** private owner classification of that assignment at the exact source head above. No value, excerpt or direct candidate fingerprint was printed. No provider check, rotation or removal was attempted. Resume with a fresh full run only after owner resolution.

## Owner classification of the previous stop

Claude privately classified `scripts/build.mjs:1320` at `2a6c1aa06bf213dbaa92316ae03487f2250a4aa6` as **false positive**. Kol relayed the classification in round three. This agent received **metadata and masked structure only, with no value or actual identifier seen**.

The owner-established structure is exactly one `${IDENTIFIER}` interpolation occupying the entire quoted body. The masked identifier is an upper-case name of 24 characters. It is declared once at line 57 through `const <identifier> = process.env.<same name> || '';`. The owner confirmed that no literal credential value exists in that source assignment.

That classification is recorded separately in the [redacted ledger](security-scan-findings.json) with owner provenance. The current run stopped earlier in the working tree, so it did **not** independently reach or rescan the historical line. Owner review must not be represented as completed scan coverage.

## Narrow classification and controls

The new false-positive reason is: **Template interpolation of a named variable, not a literal.** It applies only to a quoted assignment whose complete captured body is `${IDENTIFIER}`, where the name follows `[A-Za-z_$][A-Za-z0-9_$]*`. Full-body equality is checked, including the closing brace and quote. The actual identifier is not emitted.

The quoted-body parser now retains closing braces and complete literal boundaries. Short interpolation-shaped assignments enter classification regardless of entropy, so `'${X}abc'` and `'${a.b}'` cannot evade checks through length thresholds. There is no broad backtick-interpolation fallback. Prefixes, suffixes, spaces inside the braces, member/index access, calls, defaults, several interpolations, escaped expressions and trailing characters remain blocking. This restriction applies before placeholder exemptions.

| Synthetic control group | Result |
|---|---|
| Provider detection | 17 passed |
| Original path/classification/redaction | 7 / 3 / 1 passed |
| Metadata redaction / company context / quoted literals | 4 / 6 / 6 passed |
| Unquoted source reference | 1 passed |
| Exact named interpolation | 12 passed: four synthetic names, including `X`, across single, double and backtick quotes |
| Invalid or extended interpolation | 48 passed: 16 bodies across all three quote types; every case stopped with exit 2 |
| Working-tree / history protected-path probes | 48 / 48 passed, metadata-only before-read controls |

Explicit negatives include `${X}abc`, `${a.b}`, a high-entropy literal containing `${` mid-string, whitespace/defaults/member access, and a final Unicode line separator. `${X}` is a positive case. Synthetic fixtures are assembled in memory; no credential-store files are created or opened. Internal deduplication variables were renamed to describe IDs, with no counting logic change.

## Current run and ledger

- Checked clock: **2026-11-15 19:19:05 UTC**. UK time is the same on this date.
- Source head: `7c6322cadf53c9b92b41b642f38b45f14daed31b`, verified locally before execution. No fetch was needed to change the explicitly pinned target.
- Export base: `34aad11582fe30865d3a66de6344c61ba12f5dae`. Only the scanner, this report and its ledger change.
- Scanner SHA-256: `16df9c0fe423c05c864a565177c6f2aabf264b24a7ab8b51b7e886f5a8051b3f`. The delivered and scanned working-copy bytes match.
- Lockfile SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`. The lockfile and package manifest are unchanged from the earlier dependency graph.
- Runtime: Node.js v26.12.1. The CI Node.js 24.22.1 runtime was not exercised.

| Scope | State | Files read | Bytes read | Matches | Test | False positive | Potential real |
|---|---|---:|---:|---:|---:|---:|---:|
| working-tree | STOPPED, partial | 472 | 48,133,629 | 11 | 0 | 10 | 1 |
| history | NOT STARTED after stop | unknown | unknown | unknown | unknown | unknown | unknown |
| site | NOT STARTED after stop | unknown | unknown | unknown | unknown | unknown | unknown |

All 11 encountered matches are in the regenerated ledger. The earlier partial ledger has been replaced rather than appended. A zero count is not supplied for an unstarted scope. No file/artifact manifest is claimed for a scope that did not complete.

| Pattern | Matches so far | Classification | Reason |
|---|---:|---|---|
| openai-token | 8 | false positive | Lower-case, multi-word SK Hynix or SK Telecom news slug; mixed-case or unsegmented high-entropy bodies are not exempt. |
| credential-assignment | 2 | false positive | Unquoted source expression or configuration reference, not a quoted credential literal. |
| credential-assignment | 1 | real | Potential real credential; validity unverified. Stop and obtain private owner review without revealing the value. |

The source copy is not shallow. The scanner is configured to enumerate all reachable local refs and historical path/blob versions when it reaches history; that operation was not started this round. Exclusions and path redaction from round two remain in place. No protected files or links were encountered in the partial working-tree prefix read before the stop.

## Commands, build and dependency status

Commands were run with HEAD exactly at the pinned main commit and the corrected scanner copied into its working tree:

```powershell
node --check scripts/scan-launch-secrets.mjs
node scripts/scan-launch-secrets.mjs --self-test
node scripts/build.mjs
node scripts/scan-launch-secrets.mjs
```

Syntax and controls passed; the build returned exit 0. The final command requests working-tree, history and site in that order. It returned exit 2 in working-tree, so no separate history or site scan was run afterwards. No further unfamiliar-finding triage was performed, as instructed. The built output is retained but unscanned by this round.

**Dependency advisory status is historical, not refreshed.** Registry requests are prohibited in this round. Earlier full and production-only audits on `34d51b7` returned zero advisories against the identical lockfile hash. There are five locked development/test packages and no external production dependencies in that graph. No install or dependency change was made. A fresh advisory query remains unverified.

After private resolution of the new stop, rebuild the exact target and rerun all three scopes from the beginning. Keep output outside the repository. Check JSON status, completed scopes, exclusions, counts and every finding. Exit 0 requires all requested scopes to complete; exit 1 is setup/operation/control failure; exit 2 is a stop for private review. Provider validity and Gitleaks execution remain outside this local pattern scan.

No pushes, posts, installs, environment-variable changes, credential-file reads, application-source remediation, credential rotations or deployments were performed. No network request was made this round. Writes stayed inside the working folder. The unrelated global ignore permission warning was left alone. Freeze acceptance remains blocked by the new unfamiliar assignment, incomplete scope coverage and the unrefreshed advisory result.
