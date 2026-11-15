# Kol's Korner launch security scan, 15 November 2026

**Complete normal run, exit 0.** Working-tree, full recorded history and built-site scopes completed on `7c6322cadf53c9b92b41b642f38b45f14daed31b` using the reviewed round-six scanner. All 947 matches are classified: 931 false positives, 16 synthetic test matches and **zero unresolved candidates**. No diagnostic fallback was needed.

## Source identity and normal-run evidence

The run used the same fresh clone of the supplied input repository as round five, after its authorised origin fetch. HEAD stayed detached at `7c6322cadf53c9b92b41b642f38b45f14daed31b`. The exact 47 refs and their tips were required to match the previous snapshot before running and were verified unchanged afterwards. No export or local validation checkout supplied the history.

Only the round-six scanner was copied into that source working tree; no scan commit or validation branch was created there. The application source head remained pinned. The scanner's delivered and executed bytes match.

- Checked clock: **2026-11-15 20:29:12 UTC**. UK time is the same on this date.
- Scanner SHA-256: `719cdb376e440a37b3911ac28eaf8327618159fe2d9373009ffd49ef33393215`.
- Lockfile SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`. Package manifest SHA-256: `bf75bfae4a68e99b611156518c5f0f133e34e2923242347dd614bee52ce12347`. Both are unchanged.
- Runtime used: Node.js v26.12.1. CI execution was not performed in this local exercise.
- Export base: `d13aa4da6dba5edfdd249ff86b7fc58594c0f6a4`. The patch changes only the scanner, report and ledger.

| Completed normal scope | Files/versions | Bytes read | Matches | Test | False positive | Unresolved |
|---|---:|---:|---:|---:|---:|---:|
| working-tree | 1,181 | 129,599,380 | 33 | 4 | 29 | 0 |
| history | 4,354 | 249,945,715 | 898 | 12 | 886 | 0 |
| site | 650 | 81,167,976 | 16 | 0 | 16 | 0 |

History checked all 502 reachable commit messages and 502 commit trees, 300,109 tree entries and 4,354 unique path/blob versions. The source clone is not shallow. Scope counts overlap between source/build inputs and different historical versions.

Built-site manifest SHA-256: `7768ffe9337b9822ff7d66fcf0b262780daaeefb3490a7ea4ae55ac546bf6afb`. It hashes a path-sorted JSON array of [relative path, file SHA-256] pairs. Public data/downloads, scripts and ASCII credential bytes in binary assets were included. Media payloads were not decoded. No protected paths or symbolic links were encountered in the actual inputs.

## One new value-safe classification

The new reason is **Punctuation-joined interpolation.** It applies only to a backtick template with one or more interpolations, each exactly an identifier or dotted member access. Literal segments may contain ASCII punctuation and ordinary spaces, with no letters or digits. Calls, indexing, defaults, nested templates, escapes and malformed additional interpolations fail the rule. No expression is evaluated.

The parser rejects unmatched interpolation starts and disallows backslashes/backticks in literal segments. The earlier approved named-variable and upper-case placeholder-marker rules remain separate. This new exception does not absorb alphanumeric marker literals. Provider-format detection still runs independently.

The required positives `${a}:${b}`, `${x.y}/${z}` and `${a}-${b}-${c}` pass. The required negatives `${a}:abc`, `sk_${a}`, `${a}:${b()}`, `${a}:${b[0]}`, `AKIA${a}` and `${a}:1` stop with exit 2.

| Control group | Result |
|---|---|
| New punctuation-only positives / negatives | 12 / 42 passed |
| Original provider / protected-path / classification / redaction | 17 / 7 / 3 / 1 passed |
| Prior metadata / company / quoted-literal / reference regressions | 4 / 6 / 6 / 1 passed |
| Named interpolation positives / retained negatives | 12 / 45 passed |
| Earlier backtick cases newly covered by the authorised rule | 3 passed |
| Upper-case marker positives / negatives | 8 / 32 passed |
| Collection-mode controls | 5 passed |
| Working-tree / history pre-read credential-store probes | 48 / 48 passed |

Three earlier backtick negatives now meet the new no-literal-material grammar: a bare member interpolation, adjacent identifier interpolations and an identifier followed by a space. Their single/double-quoted forms remain negative. This change is explicit in the regression matrix; all remaining earlier negative cases still stop. Synthetic fixtures are created in memory. No credential-store file is created or opened for the probes.

## Owner-reviewed findings and provenance

**Provenance for all reviewed locations:** owner review by Claude (Samsung Book session), masked structure only, no value seen.

| Covered location | Reviewed commit | Owner classification | Implemented reason |
|---|---|---|---|
| `scripts/build.mjs:1320` | `2a6c1aa06bf213dbaa92316ae03487f2250a4aa6` | false positive | Template interpolation of a named variable, not a literal. |
| `scripts/build.mjs:1166` | `7c6322cadf53c9b92b41b642f38b45f14daed31b` | false positive | Low-entropy placeholder marker. |
| `scripts/scan-launch-secrets.mjs:116` | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | false positive | Punctuation-joined interpolation. |
| `scripts/scan-launch-secrets.mjs:246` | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | false positive | Punctuation-joined interpolation. |

The first review established a complete upper-case identifier interpolation, length 24, with one environment-reference declaration and empty fallback. The second established a fixed upper-case/underscore rich-snippet placeholder. The two scanner-key reviews established internal deduplication keys joined by a colon, with no literal credential material. No original value or actual identifier was seen by this agent.

The two scanner-key findings also retain their earlier owner-reviewed aliases at `cf7abee7ab87d2455be9c8b168a86b54a616d8f4`, lines 116 and 246. That local-only validation commit remains outside final coverage; it is not a ref or reachable commit in the fresh input copy. The actual PR locations at `b1fd774fd1196b5fad98cd9cc5f99536a809d559` are within coverage and now receive the approved punctuation-joined classification automatically. The ledger preserves all four logical reviews and all six reviewed commit locations.

## Exact 47-ref history snapshot

History used `git rev-list --all` with the following exact refs, plus detached HEAD `7c6322cadf53c9b92b41b642f38b45f14daed31b`. Symbolic aliases are explicit. The snapshot is identical to round five; there was no new fetch, ref pruning or root substitution this round.

| Ref | Resolved commit | Ref kind / symbolic target |
|---|---|---|
| `refs/heads/chore/launch-security-scan` | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | direct ref |
| `refs/remotes/origin/agent/kols-korner-isolated-news-publisher` | `4cee1870dc56d9d3f211521cf8ad0dc175196c3b` | direct ref |
| `refs/remotes/origin/alerts/workflow-failure-alert` | `a6b320db292baf0ce25a13defafcb53049d7aaef` | direct ref |
| `refs/remotes/origin/backup/nas-local-2026-08-19` | `8b9487c02ab49e510e5d4e718baf187b3f51d2f5` | direct ref |
| `refs/remotes/origin/chore/launch-security-scan` | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | direct ref |
| `refs/remotes/origin/claude/gitattributes-lf` | `bf23cdc593978f224a2ed22fbe899476d46ccbdd` | direct ref |
| `refs/remotes/origin/claude/kk-a11y-seo` | `1379c111cd762555aa350c9dbd599f100ce24857` | direct ref |
| `refs/remotes/origin/claude/links-page` | `c026c1d391015b7904eb6ab7a4281b831850318c` | direct ref |
| `refs/remotes/origin/codex/1613-humanise-agent-trust` | `916459df4167c254348f2684e725eca1731197d0` | direct ref |
| `refs/remotes/origin/codex/digest-preservation` | `75176bc19bd37e1fe6814ee00d8ad5564c3a94fb` | direct ref |
| `refs/remotes/origin/codex/kk-egress-signatures` | `01f41ed272474d438342a530d0b725fdcfe7c5d2` | direct ref |
| `refs/remotes/origin/codex/kk-handler-guard` | `b44af3f98a72d4a2f1100834ef0b1af678e2ef96` | direct ref |
| `refs/remotes/origin/codex/kk-html-case` | `b380b211ced16fc0cddc1f64f1e1a3bbb99ff914` | direct ref |
| `refs/remotes/origin/codex/kk-launch-discovery` | `203a7cccc443e9fe58985c24ded1ac155843eb75` | direct ref |
| `refs/remotes/origin/codex/kk-launch-freshness-proof` | `315e38e13f3bd5d688ce4afc9a2bab7f168633f2` | direct ref |
| `refs/remotes/origin/codex/kk-launch-links` | `bacabb078936415da663c2332c843d24ff17881d` | direct ref |
| `refs/remotes/origin/codex/kk-launch-news-honesty` | `cd90ab9a80ede1186ae81b0eb86ac4aaad149a96` | direct ref |
| `refs/remotes/origin/codex/kk-launch-owned-links` | `963d54ac76f9938bfaeea1c61aace0617a9e4915` | direct ref |
| `refs/remotes/origin/codex/kk-launch-phone` | `be0b6e9ad4d279c7911287738e47e4335137d12a` | direct ref |
| `refs/remotes/origin/codex/kk-launch-security-boundary` | `a52d152591dd099d3833a62f305ef8ea2ec642ed` | direct ref |
| `refs/remotes/origin/codex/kk-optional-url-guard` | `c21c0dd1928b9c5069ae3445a6159fa600ada039` | direct ref |
| `refs/remotes/origin/codex/launch-cleanup` | `8f4fd622eb3c0beffef73f8c7d9430aa3ad4d139` | direct ref |
| `refs/remotes/origin/codex/launch-contact` | `2cd5dc817b56d1a185c1545867132e0998454891` | direct ref |
| `refs/remotes/origin/codex/launch-kk-remaining` | `4733fc7ffa0469c184bda351e5fb734680bf67b3` | direct ref |
| `refs/remotes/origin/codex/launch-kk-rollback` | `55919bcdd7712f5ee3c212e262de447d206be1e4` | direct ref |
| `refs/remotes/origin/codex/launch-kk-security` | `75a54f2c2dd055337065f3ee998b50ceb2c7f252` | direct ref |
| `refs/remotes/origin/codex/launch-language-navigation` | `54051006a2eb2a48498919bf4118fac5092e63ef` | direct ref |
| `refs/remotes/origin/codex/launch-security` | `edbf8fbdeb1523a0c02484d92fb7102f1808d6a5` | direct ref |
| `refs/remotes/origin/codex/launch-tests` | `2b6d9eee87a48f4f5d5604e44f6269b3d2ef09e5` | direct ref |
| `refs/remotes/origin/codex/seo-build-output` | `a66990d5613f1f3c2033cb92b69dac06690db45d` | direct ref |
| `refs/remotes/origin/cursor/kols-korner-routed-feed-6fc8` | `dcd70c99903d434304e3af17ca363ce65ae340fa` | direct ref |
| `refs/remotes/origin/cursor/publish-security-txt-402e` | `f0beb58960d6872ecdd0b2fc8bdf89394179ba80` | direct ref |
| `refs/remotes/origin/cursor/schedule-digest-publish-4f8b` | `b3a04cea5d7d59d2ffa7baa46c46571fec486cc4` | direct ref |
| `refs/remotes/origin/cursor/workflow-failure-alerts-e617` | `09a560abbd739e318e7b26492de466164ccd937e` | direct ref |
| `refs/remotes/origin/cursor/x-cards-ai-2026-timeline-402e` | `2f3bc2e62afde341a929418e9d5846fbf1f06051` | direct ref |
| `refs/remotes/origin/docs/launch-operations-runbook` | `8ee06e0c71391b0b2dd3386ed5df72f0340a3e61` | direct ref |
| `refs/remotes/origin/fix/archive-dead-techcrunch-links` | `2b999b2c99bacca671bc04bd0a224c51b5ef9eef` | direct ref |
| `refs/remotes/origin/fix/launch-accessibility` | `fd420e60966c0f5a029761512d46245e73513942` | direct ref |
| `refs/remotes/origin/fix/launch-meta-security` | `a7ac7606cb03d2bd2836f56c9cadaff20cc35114` | direct ref |
| `refs/remotes/origin/fix/news-freshness-by-digest-date-kol-3800` | `983ebe23033198e188379ed5e014673a273e0227` | direct ref |
| `refs/remotes/origin/fix/remove-mockup-image-labels` | `a79b195c55881cfae8871e3960594c34f5f82e4b` | direct ref |
| `refs/remotes/origin/fix/stale-feed-fails-loudly` | `007e78738f4034785656fbd6ec496195724ed38d` | direct ref |
| `refs/remotes/origin/grok/story-wiki-prototype` | `dadd58c0f2cc34f4c0b2a84d7769b73f62e7b81c` | direct ref |
| `refs/remotes/origin/HEAD` | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | `refs/remotes/origin/chore/launch-security-scan` |
| `refs/remotes/origin/main` | `7c6322cadf53c9b92b41b642f38b45f14daed31b` | direct ref |
| `refs/remotes/origin/preserve/local-main-20261009` | `7d1d957c009ccabc66be287c69f802b36dc0e4ad` | direct ref |
| `refs/remotes/origin/sec/cve-2026-111497-node-patched` | `712463b1c011ef53a33255b57860b4ce7512a823` | direct ref |

Ref-set manifest SHA-256: `551816f08f91f3248d3d826ebbf3ae5f47eee7439def8951f1925100f15d9e21`. The manifest hashes the JSON-encoded head/detached/ref snapshot retained with the evidence. Unreachable objects, reflogs, unfetched refs and later remote changes are outside this coverage claim.

## Complete findings ledger

| Pattern | Matches | Classification | Reason |
|---|---:|---|---|
| openai-token | 785 | false positive | Lower-case, multi-word SK Hynix or SK Telecom news slug; mixed-case or unsegmented high-entropy bodies are not exempt. |
| credential-assignment | 106 | false positive | Unquoted source expression or configuration reference, not a quoted credential literal. |
| credential-assignment | 20 | false positive | Low-entropy placeholder marker. |
| github-token | 8 | test | Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data. |
| credential-url | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 2 | false positive | Punctuation-joined interpolation. |
| jwt | 12 | false positive | GitHub public-image signed URL; JWT issuer/audience bind it to raw image delivery, not an account API credential. |
| credential-assignment | 3 | false positive | Template interpolation of a named variable, not a literal. |
| credential-assignment | 1 | false positive | JavaScript method-call expression computing a value, not a literal credential. |
| credential-assignment | 2 | false positive | Supabase explicitly publishable browser key, not a secret service-role key. |

All 947 records are in the [updated metadata-only ledger](security-scan-findings.json). Its primary status is the complete **normal** run, exit 0, and its unresolved list is empty. Previous diagnostic flags are not carried forward as current unresolved findings. Candidate values, source excerpts and direct candidate fingerprints are absent. Matching path segments and unexpected matching metadata remain redacted.

## Commands and acceptance boundary

```powershell
git rev-parse HEAD
git for-each-ref --format="%(refname) %(objectname) %(symref)"
node scripts/scan-launch-secrets.mjs --self-test
node scripts/build.mjs
node scripts/scan-launch-secrets.mjs
```

Commands ran in the same fresh scan-copy root with the new scanner copied into its working tree. Self-test, build and normal scan each returned exit 0. Completion was verified through the JSON mode, complete/completedScopes/historyComplete fields, non-empty per-scope counts, zero unresolved candidates and unchanged ref tips. No collection fallback was required.

This verifies the authorised pattern scan for this exact application head, reviewed scanner and local built artifact. It does not certify a future 11 December freeze commit or live deployed bytes. Gitleaks and provider credential-validity checks were not run.

**Dependency advisories were not queried this round.** Registry requests remain prohibited. Earlier full and production-only audits returned zero advisories on the unchanged five-package development-only graph and lockfile hash. That historical evidence remains available; no fresh registry result is claimed.

No pushes, posts, installs, environment-variable changes, credential-file reads, provider checks, application-source remediation, credential rotations or deployments were performed. No network request was made this round. Writes stayed within the working folder, and the unrelated global Git ignore warning was left alone.
