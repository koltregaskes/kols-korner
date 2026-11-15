# Kol's Korner launch security scan, 15 November 2026

**Fresh-repository normal run returned exit 2.** Diagnostic collection then completed all three scopes and retained 2 scanner-unresolved historical entries. The working tree and built site have no unresolved candidates. No clean normal run is claimed.

## Fresh clone and unchanged scanner

The final input was a fresh clone of the supplied repository, with hardlinks disabled. It was not cloned from any validation or delivery checkout. After the initial local-input fetch, this copy's origin was set to the existing `https://github.com/koltregaskes/kols-korner.git` repository and `git fetch origin` succeeded. HEAD remained detached at `7c6322cadf53c9b92b41b642f38b45f14daed31b`.

The round-four scanner was copied into the working tree only. Its bytes were checked against round four before execution; no rule, exception or code change was added for the deduplication templates. No scan commit or local validation branch was created in the fresh input copy. The ref set was verified unchanged after both runs.

- Checked clock: **2026-11-15 20:07:46 UTC**. UK time is the same on this date.
- Scanner SHA-256: `ada828c5e29bc4b53a3927af4e103fcbb7c1fe1e6075778f5fc3c2fd97ba0e5c`.
- Lockfile SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`. Package manifest SHA-256: `bf75bfae4a68e99b611156518c5f0f133e34e2923242347dd614bee52ce12347`. Both are unchanged.
- Runtime: Node.js v26.12.1. CI Node.js 24.22.1 execution remains unverified.
- Export base: `dbb1c19da0d0603a31ab33e351d6287f57afdd9d`. This delivery changes only the report and ledger.

## Exact history roots

History used `git rev-list --all` in the fresh clone. The exact 47 refs below were present for the run, together with detached HEAD `7c6322cadf53c9b92b41b642f38b45f14daed31b`. Symbolic aliases are shown explicitly. The reachable set contained 502 commits; `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` was not reachable. No refs were filtered out or deleted to obtain that result.

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

Ref-set manifest SHA-256: `551816f08f91f3248d3d826ebbf3ae5f47eee7439def8951f1925100f15d9e21`. This is the SHA-256 of the JSON-encoded head/detached/ref snapshot retained with the evidence. Unreachable objects, reflogs, unfetched refs and remote changes after the fetch are outside this coverage claim.

## Four owner-reviewed classifications

**Provenance for all four:** owner review by Claude (Samsung Book session), masked structure only, no value seen.

| Location | Reviewed commit | Owner classification | Reviewed commit in final coverage? | Reason |
|---|---|---|---|---|
| `scripts/build.mjs:1320` | `2a6c1aa06bf213dbaa92316ae03487f2250a4aa6` | false positive | yes | Template interpolation of a named variable, not a literal. |
| `scripts/build.mjs:1166` | `7c6322cadf53c9b92b41b642f38b45f14daed31b` | false positive | yes | Low-entropy placeholder marker. |
| `scripts/scan-launch-secrets.mjs:116` | `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` | false positive | no | Owner-reviewed scanner-internal deduplication map key, not credentials. |
| `scripts/scan-launch-secrets.mjs:246` | `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` | false positive | no | Owner-reviewed scanner-internal deduplication map key, not credentials. |

The line-1320 review established one complete identifier interpolation and one same-named environment-reference declaration with an empty fallback. The line-1166 review established an upper-case/underscore placeholder around one identifier/member-access interpolation. The two scanner-line reviews established internal deduplication map keys with exactly two identifier interpolations separated by a colon, assigned to a variable named key. No actual identifier, marker text or value was seen by this agent.

The two `cf7abee7` rows came from a local-only validation rebase commit. They were owner-reviewed as false positives and that commit is outside the fresh clone's final coverage. No scanner rule was added for them.

A separate metadata-only Git object lookup explains why the fresh scan can still flag the corresponding PR version: the scanner file at real PR head `b1fd774fd1196b5fad98cd9cc5f99536a809d559` and at reviewed local commit `cf7abee7ab87d2455be9c8b168a86b54a616d8f4` has the identical whole-file Git blob ID `145d4615e1e53dd8c4ee9432306e1bd0482bc489`. No source body was displayed or inspected for this comparison. This identity evidence is recorded separately and was not used to suppress or relabel scanner findings.

## Results and final counts

`--self-test` returned exit 0 and the build returned exit 0. Normal mode was run first, as requested. Its exit was 2 and completed-scope status was `false`. It stopped in history; the diagnostic fallback returned exit 2 with all three scopes complete.

| Complete diagnostic scope | Files/versions | Bytes read | Matches | Test | False positive | Scanner-unresolved |
|---|---:|---:|---:|---:|---:|---:|
| working-tree | 1,181 | 129,596,300 | 33 | 4 | 29 | 0 |
| history | 4,354 | 249,945,715 | 898 | 12 | 884 | 2 |
| site | 650 | 81,167,975 | 16 | 0 | 16 | 0 |

History completed 502 commit messages and 502 commit trees, 300,109 tree entries and 4,354 unique path/blob versions. The clone was verified non-shallow. Counts overlap across working-tree/site scopes and historical versions.

Built-site manifest SHA-256: `e210bb2c8375ea71a2028039f0ceb8519ebca458c98001f2caa69227c092b4af`. It hashes a path-sorted JSON array of [relative path, file SHA-256] pairs. All public data/downloads and ASCII token bytes in binary assets were covered; media payloads were not decoded. No protected paths or symbolic links were encountered.

| Pattern | Matches | Raw scanner classification | Reason |
|---|---:|---|---|
| openai-token | 785 | false positive | Lower-case, multi-word SK Hynix or SK Telecom news slug; mixed-case or unsegmented high-entropy bodies are not exempt. |
| credential-assignment | 106 | false positive | Unquoted source expression or configuration reference, not a quoted credential literal. |
| credential-assignment | 20 | false positive | Low-entropy placeholder marker. |
| github-token | 8 | test | Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data. |
| credential-url | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 4 | test | Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token. |
| credential-assignment | 2 | real | Potential real credential; validity unverified. Stop and obtain private owner review without revealing the value. |
| jwt | 12 | false positive | GitHub public-image signed URL; JWT issuer/audience bind it to raw image delivery, not an account API credential. |
| credential-assignment | 3 | false positive | Template interpolation of a named variable, not a literal. |
| credential-assignment | 1 | false positive | JavaScript method-call expression computing a value, not a literal credential. |
| credential-assignment | 2 | false positive | Supabase explicitly publishable browser key, not a secret service-role key. |

The [regenerated ledger](security-scan-findings.json) retains all 947 matches, the four owner reviews, exact refs, raw normal-run status and final diagnostic coverage. Its raw label "real" means scanner-unresolved potential credential, not confirmed provider validity. Owner review provenance is recorded separately from the automated result.

## Remaining scanner metadata

This is the complete fallback list. No new classification was made for these entries. Historical commits identify representative versions, not necessarily introducing commits.

| # | Scope | File | Line | Commit | Pattern |
|---:|---|---|---:|---|---|
| 1 | history | `scripts/scan-launch-secrets.mjs` | 116 | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | credential-assignment |
| 2 | history | `scripts/scan-launch-secrets.mjs` | 246 | `b1fd774fd1196b5fad98cd9cc5f99536a809d559` | credential-assignment |

These entries are now in the real `chore/launch-security-scan` PR branch at `b1fd774`, which is explicitly present in the fresh ref set. Removing the local-only `cf7abee7` commit did not remove the identical historical file from that real branch. The scanner remains unchanged, and its non-zero result is preserved for owner reconciliation.

## Commands, checks and boundaries

```powershell
git clone --no-hardlinks <supplied-input-repository> <fresh-scan-copy>
git -C <fresh-scan-copy> remote set-url origin https://github.com/koltregaskes/kols-korner.git
git -C <fresh-scan-copy> fetch origin
git -C <fresh-scan-copy> switch --detach 7c6322cadf53c9b92b41b642f38b45f14daed31b
git -C <fresh-scan-copy> for-each-ref --format="%(refname) %(objectname) %(symref)"
Copy-Item <round-four-scanner> <fresh-scan-copy>/scripts/scan-launch-secrets.mjs
node scripts/scan-launch-secrets.mjs --self-test
node scripts/build.mjs
node scripts/scan-launch-secrets.mjs
node scripts/scan-launch-secrets.mjs --collect-unknown
```

Node commands were run from the fresh scan-copy root, with output saved in a sibling evidence folder. Source head, refs, scalar statuses and scope counts were checked rather than inferred from a command finishing. The scanner's provider, redaction, named-interpolation, placeholder-marker, collection and protected-store controls all passed unchanged.

**Dependency advisory evidence remains historical:** registry requests were prohibited in this round. Earlier full and production-only audits returned zero advisories against the identical five-package development-only graph. No fresh registry result or Gitleaks run is claimed.

No pushes, posts, installs, environment-variable changes, credential-file reads, new scanner exceptions, provider credential checks, source remediation, credential rotations or deployments were performed. Network use was limited to the authorised git fetch. Writes stayed inside the working folder. The unrelated global ignore permission warning was left alone. A future freeze head and any owner acceptance remain separate from these exact results.
