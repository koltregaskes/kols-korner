# Kol's Korner launch security scan, 15 November 2026

**Diagnostic collection completed all three scopes; 2 unresolved candidates require owner review.** Exit 2 is a review-needed result, not a clean scan. No candidate value was printed or retained in this report or its ledger.

## Owner review and corrected provenance

**Provenance for both classifications:** owner review by Claude (Samsung Book session), masked structure only, no value seen.

| Owner-reviewed location | Classification and masked structure |
|---|---|
| `scripts/build.mjs:1320` at `2a6c1aa06bf213dbaa92316ae03487f2250a4aa6` | False positive: the complete quoted body is one interpolation of an upper-case identifier of 24 characters. One declaration at line 57 reads the same-named process.env reference with an empty fallback. The reason is "Template interpolation of a named variable, not a literal." |
| `scripts/build.mjs:1166` at `7c6322cadf53c9b92b41b642f38b45f14daed31b` | False positive: an internal rich-snippet substitution placeholder, using fixed upper-case/underscore literal parts around one identifier/member-access interpolation. The reason is "Low-entropy placeholder marker." |

These are Claude's private owner reviews. No original value, actual identifier or actual marker text was seen by this agent. Their provenance is retained separately in the [redacted ledger](security-scan-findings.json). No other unfamiliar candidate was self-classified.

## Narrow rules and collection mode

The named-variable rule still requires the complete quoted body to be exactly `${IDENTIFIER}` with grammar `[A-Za-z_$][A-Za-z0-9_$]*`. Short malformed interpolation-shaped assignments enter classification regardless of entropy.

The new marker rule applies only to a backtick template with exactly one identifier or dotted-member-access interpolation. Literal segments are restricted to A-Z and underscores, with at least one literal character overall. Calls, indexing, defaults and additional interpolations do not qualify. Spaces, lower-case letters, digits, symbols and escapes in the literal parts are rejected. AWS-style prefixes `AKIA`, `ASIA`, `AIDA` and `AROA` in the literal prefix remain suspicious and stop normal mode, even with an interpolation. There is no general template-expression exemption.

`--collect-unknown` requests all three scopes and continues after unfamiliar candidates, returning their metadata only: scope, file, line, commit and pattern. It exits 2 if any remain. It rejects a simultaneous `--scope=...` argument with exit 1 so a subset cannot masquerade as full diagnostics. Normal mode still stops at the first unfamiliar candidate. Operation/setup errors retain exit 1 and incomplete coverage.

The output gate redacts matching path segments, exclusions, links and unexpected matching metadata. No message source, excerpts, values or candidate-derived fingerprints are emitted. Internal match offsets distinguish separate matches of one pattern on one line, so a known match cannot hide an unfamiliar one. Those offsets are not output fields.

| Control group | Result |
|---|---|
| Original detection / path / classification / redaction | 17 / 7 / 3 / 1 passed |
| Prior metadata / company / quoted-literal / reference regressions | 4 / 6 / 6 / 1 passed |
| Named interpolation positives / negatives | 12 / 48 passed |
| Placeholder marker positives / negatives | 8 / 32 passed |
| Collection, first-stop, clean/failure status and same-line controls | 5 passed |
| Working-tree / history pre-read store exclusions | 48 / 48 passed |

Marker negatives include the requested synthetic forms `sk_live_${x}`, `ABC${x}def`, `ABC${a.b()}DEF`, `ABC${x}DEF${y}` and `AKIA${x}`. Additional CLI controls verified first-stop behaviour, full three-scope collection including a commit-message match, metadata-only output, and rejection of a partial-scope diagnostic request. Synthetic candidate values were absent from stdout and stderr. Protected-path tests inject metadata before reads; no credential-store fixture was created or opened.

## Current head, build and coverage

- Checked clock: **2026-11-15 19:46:54 UTC**. UK time is the same on this date.
- Pinned source head: `7c6322cadf53c9b92b41b642f38b45f14daed31b`. The separate scan copy remained exactly at this head, with the reviewed scanner copied into its working tree.
- Export base: `42739dbb048775078bf9818c572c306c7cf84823`. Delivery changes only the scanner, report and ledger.
- Scanner SHA-256: `ada828c5e29bc4b53a3927af4e103fcbb7c1fe1e6075778f5fc3c2fd97ba0e5c`. Delivered and executed working-copy bytes match.
- Lockfile SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`. Package manifest SHA-256: `bf75bfae4a68e99b611156518c5f0f133e34e2923242347dd614bee52ce12347`. Both are unchanged.
- Runtime: Node.js v26.12.1. CI Node.js 24.22.1 execution remains unverified.

| Scope, all completed | Files/versions | Bytes read | Matches | Test | False positive | Unresolved |
|---|---:|---:|---:|---:|---:|---:|
| working-tree | 1,181 | 129,596,303 | 33 | 4 | 29 | 0 |
| history | 4,150 | 242,371,331 | 858 | 12 | 844 | 2 |
| site | 650 | 81,167,978 | 16 | 0 | 16 | 0 |

History completed 475 commit messages and commit trees, 275,845 tree entries and 4,150 unique path/blob versions. The clone is not shallow. This covers all reachable refs present in the local copy; unfetched upstream refs, unreachable objects and reflogs are not claimed. Counts overlap across working-tree/site scopes and different historical versions.

Built-site file manifest SHA-256: `a6fedace8a4a792b759bf5a7741102e4c807cbed73ad873f2f233345f7edd62f`. It hashes a path-sorted JSON array of [relative path, file SHA-256] pairs. The scan includes public data/downloads, text, scripts and ASCII token bytes in binary assets. Media payloads are not decoded. No protected paths or symbolic links were encountered in these actual inputs.

| Pattern | Matches | Classification | Reason |
|---|---:|---|---|
| openai-token | 771 | false positive | Lower-case, multi-word SK Hynix or SK Telecom news slug; mixed-case or unsegmented high-entropy bodies are not exempt. |
| credential-assignment | 93 | false positive | Unquoted source expression or configuration reference, not a quoted credential literal. |
| credential-assignment | 19 | false positive | Low-entropy placeholder marker. |
| github-token | 8 | test | Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data. |
| credential-url | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 2 | real | Potential real credential; validity unverified. Stop and obtain private owner review without revealing the value. |
| credential-assignment | 3 | false positive | Template interpolation of a named variable, not a literal. |
| credential-assignment | 1 | false positive | JavaScript method-call expression computing a value, not a literal credential. |
| credential-assignment | 2 | false positive | Supabase explicitly publishable browser key, not a secret service-role key. |

All 907 matches are in the regenerated ledger. The incomplete round-three ledger has been replaced. The label "real" in conservative counts means an unresolved potential credential, not confirmed provider validity.

## Full unresolved metadata for private owner review

The following is the full unresolved list, also reproduced in NOTES-round4.md. No source-content inspection or classification was performed for these entries. Historical commits are representative versions, not necessarily introducing commits. A null commit denotes an uncommitted working tree or generated artifact, based on the source head above.

| # | Scope | File | Line | Commit | Pattern |
|---:|---|---|---:|---|---|
| 1 | history | `scripts/scan-launch-secrets.mjs` | 116 | `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` | credential-assignment |
| 2 | history | `scripts/scan-launch-secrets.mjs` | 246 | `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` | credential-assignment |

Both entries belong to this session's locally retained validation rebase commit. That commit is not an ancestor of the pinned main head, but is included by the all-local-refs history scan. It has not been pushed by this session. Private review can use the retained scan copy; neither entry was inspected or classified here.

**Next action:** Claude privately classifies all entries in one pass using the metadata above. No additional exemption, provider check, removal or rotation was attempted. Normal mode was not run on the repository because the diagnostic list was non-empty, as required by the conditional workflow.

## Commands and remaining acceptance

```powershell
node --check scripts/scan-launch-secrets.mjs
node scripts/scan-launch-secrets.mjs --self-test
node scripts/build.mjs
node scripts/scan-launch-secrets.mjs --collect-unknown
```

Syntax and the normal self-test returned exit 0. The build returned exit 0. Collection returned exit 2 with complete coverage of working-tree, history and site. Exit 2 is retained because unfamiliar metadata remain.

A first diagnostic pass exposed a same-line deduplication gap during verification. The gap was fixed with a regression and the complete diagnostic run was repeated; tables and ledger describe the final implementation. Earlier diagnostic evidence is retained separately, not combined with these counts.

**Dependency advisories were not refreshed.** Network access was limited to git fetch by instruction, and no network request was needed this round. Earlier full and production-only audits returned zero advisories on the identical lockfile graph. That is historical evidence, not a current registry query. Five external packages remain development/test-only; a new advisory result is still unverified.

Gitleaks and provider credential-validity checks were not run. No pushes, posts, installs, environment-variable changes, credential-file reads, application-source remediation, credential rotation or deployment occurred. All writes stayed in the working folder. The unrelated global ignore warning was left alone. Owner review and a clean normal run remain required before Rank 9 can be accepted.
