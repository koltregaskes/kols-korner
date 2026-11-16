# Kol's Korner operations

## Owner and escalation

Post-launch owner: **agent:claude**, through the existing [Kol's Korner project](https://github.com/koltregaskes/rooms-os-hub/issues/67).
Claude owns daily run review, incident triage, recovery and evidence on the [launch issue](https://github.com/koltregaskes/rooms-os-hub/issues/1505), reusing the existing operations work (#517, #535, #543 and #542).
Kol makes decisions through Claude, including first public launch, social announcements, spending, accounts, DNS and security changes. This document names the owner; it does not prove their acceptance or a staffed overnight rota.

At 3am: inspect the failing run and its head, preserve the last good site and feed, then follow the matching recovery below. Record the error, affected URL, run/head, last good run and next action on the launch issue. Do not retry a permission refusal by another route. Escalate missing access or decisions to Claude for Kol. Do not revive a retired Windows publisher.

## Deployment today

[pages.yml](../.github/workflows/pages.yml) is the single Pages deployment workflow: a push to main or manual dispatch builds committed Markdown with [build.mjs](../scripts/build.mjs), checks committed digest downloads and SEO, archives [site/](../site/) including its security contact, uploads `github-pages`, then deploys through the `github-pages` environment. Its concurrency group cancels an older in-progress Pages run. It does not run all validation/security tests itself.

The build uses [content/](../content/), [news-digests/](../news-digests/), tracked static assets and configuration. [CNAME](../CNAME) selects the custom domain when no build override is set. The configured destination is <https://koltregaskes.com/>; repository configuration is not live DNS/TLS proof.

| Workflow | Trigger and action | Mini PC dependency |
|---|---|---|
| [refresh-routed-feed.yml](../.github/workflows/refresh-routed-feed.yml) | Daily 05:15 UTC; fetches using shared configuration from `koltregaskes/ai-resource-hub`, commits the routed feed and dispatches Pages when changed | GitHub-hosted Ubuntu; external repo access and sources still required |
| [routed-feed-freshness.yml](../.github/workflows/routed-feed-freshness.yml) | Daily 06:30 UTC; checks committed age and exact public feed bytes; retains `public-feed-proof` for 30 days | GitHub-hosted Ubuntu; public HTTPS required |
| [publish-routed-digest.yml](../.github/workflows/publish-routed-digest.yml) | Daily 06:45 UTC or manual date; [publish-routed-news.mjs](../scripts/publish-routed-news.mjs) keeps existing dates, otherwise uses date-keyed input or committed feed, commits raw digest/post and explicitly dispatches Pages | GitHub-hosted Ubuntu; no Windows classifier file required for fallback |
| [validate.yml](../.github/workflows/validate.yml) | PR, main push or manual; build, offline checks/tests and browser checks | GitHub-hosted Ubuntu |
| [security.yml](../.github/workflows/security.yml) | PR, main push or manual; dependency audit, redacted history scan, internal/external links and static public boundary | GitHub-hosted Ubuntu; **no schedule** |
| [daily-digest.yml](../.github/workflows/daily-digest.yml) | Manual build check only; does not publish | GitHub-hosted Ubuntu |

These cron times are UTC: the same UK times in winter, one hour later during British Summer Time. Schedules can be delayed or missed. Feed proof runs before digest publication, so it does not prove that day's post. Bot commits explicitly dispatch Pages rather than relying on a bot push triggering another workflow. A dispatch succeeding does not prove a deployment succeeded.

## Rollback without force-pushing

**Procedure only, not a rehearsal receipt.** Use the existing authorised publication route. First select a known-good Pages run whose head and public bytes were verified, and identify the faulty change. Preserve current source data and coordinate with Claude while scheduled writers may advance main. Do not restore an entire old tree or blindly revert fresh news. No force-push, DNS change or Pages settings change is needed.

Run from a clean, already authenticated checkout using PowerShell and installed Git/GitHub CLI. Replace uppercase placeholders with reviewed values; do not enter credentials. Inspect before mutation:

```powershell
git status --short
gh run view GOOD_RUN_ID --repo koltregaskes/kols-korner --json headSha,conclusion,url,workflowName
git fetch origin main
git show --stat BAD_COMMIT_SHA
```

Preferred durable rollback: revert only the faulty change on current main, review the diff (especially news inputs), and open one revert PR:

```powershell
git switch -c ops/revert-fault origin/main
git revert BAD_COMMIT_SHA
git diff origin/main...HEAD --stat
node scripts/build.mjs
node scripts/check-operations.mjs
node scripts/check-digest-preservation.mjs
python scripts/check-seo.py
git add --update -- site
git diff --cached --stat
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m "build: regenerate site after rollback" }
git push -u origin ops/revert-fault
gh pr create --repo koltregaskes/kols-korner --base main --title "Revert faulty site change" --body "Targeted rollback; record faulty and known-good heads, checks and preserved news data in this PR."
```

For a merge commit use `git revert -m 1 BAD_MERGE_SHA` after confirming parent 1 is main. For several faulty commits, review and revert each explicitly, newest first. Stop on conflicts for review. Obtain the required review and green checks, then merge through the normal route. That main push triggers Pages. Select the resulting Pages run, verify its head equals the intended merged main, and use the byte readback below. If Pages did not start, an authorised operator can dispatch it explicitly:

```powershell
gh workflow run pages.yml --repo koltregaskes/kols-korner --ref main
gh run list --repo koltregaskes/kols-korner --workflow pages.yml --limit 5
gh run view DEPLOY_RUN_ID --repo koltregaskes/kols-korner --json headSha,conclusion,url
```

Emergency alternative: rerun **all jobs** of a known-good Pages run, rebuilding its original commit before deployment. Do not rerun only the deploy job against an expired artifact. Historical rerun availability and permissions must be checked at use time; if unavailable, use the revert PR route. This only changes the served release temporarily: main remains faulty and a later Pages run can replace it. Fix/revert main promptly and account for any newer news lost from that temporary release.

```powershell
gh run rerun GOOD_RUN_ID --repo koltregaskes/kols-korner
gh run view GOOD_RUN_ID --repo koltregaskes/kols-korner --json headSha,conclusion,url,attempt
```

For each successful deployment, download its `github-pages` artifact promptly: retention is **one day**. In a fresh checkout, use a new, empty local receipt directory for each run/attempt (the paths below are runtime outputs, not tracked repository files). Keep the downloaded tar outside its extracted directory:

```powershell
New-Item -ItemType Directory -Path .local/receipt-download, .local/receipt-site
gh run download DEPLOY_RUN_ID --repo koltregaskes/kols-korner --name github-pages --dir .local/receipt-download
tar -xf .local/receipt-download/artifact.tar -C .local/receipt-site
node scripts/check-live.mjs .local/receipt-site https://koltregaskes.com/
```

Require a non-zero file count, every file matched, zero mismatched and zero unverified. Record run URL, attempt, head and counts. A green Actions job alone is insufficient. Verify the homepage, approved essay, dated news, `/links/` and contact journey too. To return after rehearsal, revert the rollback commit through another reviewed PR or redeploy the selected reviewed release, then repeat the same readback.

## Backup and recovery

| Held material | Existing copy and recovery boundary |
|---|---|
| Code, workflows, content and raw digests | Committed Git history in this repository on GitHub; local clones are additional copies only. No independent scheduled mirror, NAS backup, retention policy or tested off-site recovery is evidenced here. GitHub loss requires an existing trusted clone/archive. |
| Routed input | [news-digests/news-feed-latest.json](../news-digests/news-feed-latest.json) is versioned when refresh commits. History retains earlier feeds; future refetching cannot reconstruct identical historical source bytes. Shared routing configuration lives in another repo and is not backed up here. |
| Generated output and static assets | [site/](../site/) is tracked, including downloads; [site/data/](../site/data/) is rebuilt from inputs. A successful Pages artifact is the exact deployment copy, retained one day. Tracked output is useful recovery input but is not necessarily identical to a later Actions build. |
| Proof and provider settings | Freshness artifacts last 30 days. Domain, DNS, TLS, Actions notification settings, repository variables and access settings are not restored by cloning. No server database, newsletter subscriber store or analytics collector is implemented, as recorded in [security-profile.json](security-profile.json). Reader favourites/flags live only in the reader's browser and have no server backup. |

Restore a lost checkout into a new directory from the repository, select a reviewed recovery point, and build offline before any publication. These commands are for a later authorised recovery, not executed by this documentation change:

```powershell
git clone https://github.com/koltregaskes/kols-korner.git kk-recovery
Set-Location kk-recovery
git switch --detach GOOD_COMMIT_SHA
node scripts/build.mjs
node scripts/check-digest-preservation.mjs
node scripts/check-internal-links.mjs
node scripts/check-public-boundary.mjs
python scripts/check-seo.py
```

If GitHub is unavailable, clone an existing trusted local mirror/archive instead. If no such copy exists, recovery is blocked; report that gap to Claude. Preserve any surviving checkout before changing it. For one damaged tracked file, start a recovery branch from current main, inspect history, then restore the chosen file; this example deliberately uses the real feed path:

```powershell
git switch -c ops/recover-feed origin/main
git log --oneline -- news-digests/news-feed-latest.json
git restore --source=GOOD_COMMIT_SHA -- news-digests/news-feed-latest.json
node scripts/check-routed-feed-freshness.mjs
```

A historical feed may correctly fail freshness: do not alter its timestamps to pass. Refresh through the existing owner/workflow or recover a genuinely fresh input, review differences, rebuild and run checks before a recovery PR. Preserve original essay and digest dates. Do not publish the detached historical checkout or overwrite current content wholesale. For exact artifact recovery, extract into a separate directory and compare all file hashes/counts with the saved artifact; after an approved redeploy, run [check-live.mjs](../scripts/check-live.mjs). Record actual restore results; no repository/data restoration or production rollback is claimed here.

## Failure alerts and response

**Configured visibility:** failed jobs appear in GitHub Actions with logs/annotations and checks on applicable commits/PRs. GitHub's ordinary failed-run notifications depend on the recipient's Actions/watch/email settings. No custom email, issue creation, webhook, pager or guaranteed named recipient is defined in these workflows. Claude is responsible for review; there is no evidence here that Claude or Kol receives a failure notification. The proof script's `failureAlert` text explicitly says recipient delivery is unverified.

| Failure | What the repository exposes today | First response |
|---|---|---|
| `publish-routed-digest` | Missing/stale fallback feed throws and fails; fresh empty feed explicitly says no matching items and skips deployment. An existing committed date is kept. Push/dispatch errors fail the job; no custom alert step. | Inspect source decision and date, upstream refresh, main commit and separately the Pages run. A publisher success is not a delivered post. |
| `routed-feed-freshness` | [check-routed-feed-freshness.mjs](../scripts/check-routed-feed-freshness.mjs) fails on invalid/future or at least 24-hour-old generation/source data. [check-public-feed-proof.mjs](../scripts/check-public-feed-proof.mjs) runs even after failure, fails mismatches/HTTP errors and writes the proof artifact; artifact absence also fails upload. | Inspect proof/head and 05:15 refresh; verify committed and live bytes before retrying. An early missing-file read can prevent a proof file, so retain the failed job URL too. |
| `security` | **Not scheduled.** Audit, scanner and link/boundary jobs fail for detected errors. Some blocked/rate-limited external links are warnings/unverified and can leave a green job. | Inspect the exact failing job and head; retain redacted summaries only. Never open secrets. A green run is not comprehensive security acceptance. |
| Refresh or Pages | Refresh fails on half-or-more source failures, preserving the feed; minority failures warn and can commit partial results. Pages build/deploy errors fail their run. | Preserve last good data/site, fix the specific error, then verify a fresh run and public output. |
| A schedule never starts | No run means no failed-run notification. Freshness can catch an old feed only if its own schedule runs. No independent heartbeat or end-to-end digest delivery alert is configured. | Claude checks expected run presence daily and records missing execution as failed/unverified, not healthy. |

Read-only triage from an already authenticated checkout:

```powershell
gh run list --repo koltregaskes/kols-korner --workflow publish-routed-digest.yml --limit 5
gh run list --repo koltregaskes/kols-korner --workflow routed-feed-freshness.yml --limit 5
gh run list --repo koltregaskes/kols-korner --workflow security.yml --limit 5
gh run view FAILED_RUN_ID --repo koltregaskes/kols-korner --json headSha,conclusion,url,jobs
```

Do not assume a failed run reached a person. Before acceptance, use the existing owner's authorised route for one controlled failure, confirm a named recipient's actual receipt and recovery, and record both links privately where needed. Do not change notification/account/security settings or generate an alert as part of this offline work.

## Pre-launch rehearsal

**Production rehearsal not run. All results below are unverified.** The current calendar on [checklist #1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907) supersedes the former 14 December launch and 11 December freeze. Kol's Korner is first in the **21–23 December 2026 window**, with its exact day D still unassigned. Complete readiness by **D minus 14**, collect seven consecutive proof days **D minus 20 through D minus 14**, then BAU only through launch. Warn the existing owner at **D minus 19** if readiness is at risk. For D = 21/22/23 December, readiness is 7/8/9 December respectively; do not invent a slot. Use the existing owner and approved publication route; no checklist tick grants that approval.

- [ ] Claude accepts post-launch duties and records the daily reviewer, escalation route and any coverage gaps on the launch issue.
- [ ] Record current main, known-good run/attempt, artifact hashes/count and exact HTTPS readback. Confirm no overlapping Pages deployment or scheduled writer will invalidate the rehearsal.
- [ ] Choose one harmless, reversible visible change with the writing owner, open/review its PR, run checks and deploy through Pages. Record the resulting merged head/run and exact public bytes.
- [ ] Exercise the rollback above for that change, leaving newer content and feed intact. Confirm the intended rollback head/run and repeat every-file HTTPS comparison. Verify the harmless change is gone.
- [ ] Restore the selected reviewed release if required; verify again. Visit approved essay, dated news, `/links/` and contact on final hosting; give Claude the observed line and screenshot/link. Do not send test mail without authorisation.
- [ ] Recover one committed content or input file and generated output into a separate offline copy, compare hashes/counts with the selected source/artifact, and record what was restored and any stale data. Do not overwrite production.
- [ ] Through the existing approved failure-test route, demonstrate one failure reaching a named recipient, recover it, and record delivery evidence. A fixture test or a red Actions badge does not satisfy this.
- [ ] Link results on the launch issue. Keep missing evidence open, including the separate seven-day run/source/public-byte/alert window. Claude routes any slip and Kol's final launch and social decision.

| Step | UK date/time and operator | Head, run/attempt and source | Actual readback/receipt and counts | Result / next action |
|---|---|---|---|---|
| Owner acceptance / coverage | To fill | To fill | To fill | Unverified |
| Baseline | To fill | To fill | To fill | Unverified |
| Harmless deploy | To fill | To fill | To fill | Unverified |
| Rollback | To fill | To fill | To fill | Unverified |
| Release restored / journey | To fill | To fill | To fill | Unverified |
| Offline backup restore | To fill | To fill | To fill | Unverified |
| Failure delivery / recovery | To fill | To fill | To fill | Unverified |

## Offline runbook check

### Retained local release restore

Run `node scripts/rehearse-backup.mjs` in this gaming laptop checkout (or another authorised clone). It creates a new, unique directory under `.local`, retains a release-input tar, extracts into a separate empty directory, and compares every restored file against its committed Git blob ID. A SHA-256 archive receipt records the exact head, counts and mismatches. Unsafe env/key paths and symlinks are refused using tree metadata before archiving; no credential contents are read. It never overwrites a prior receipt or deletes anything. Run `node --test tests/backup-restore.test.mjs` for corruption/refusal coverage.

From the receipt's restored directory, run the build, digest-preservation, internal-link, public-boundary and operations checks, then SEO. Preserve the archive and receipt before rebuilding generated output. This snapshot covers code/workflows, content, news, media and non-secret deployment configuration; it does not contain Git history, external shared routing configuration or provider settings. It remains on the same machine: an independently retained off-site copy, retention/location decision, named operator acceptance and production rollback are still open. No unattended laptop task is introduced. Use the existing owner to select an approved independent backup destination; no upload or new service is implied.

Run `node scripts/check-operations.mjs` and `node --test tests/operations.test.mjs` from the repo root. The guard checks required sections and repository references, including commands; it does not execute them, contact a service, prove command availability/permissions or establish operational acceptance. Local receipt directories in examples are runtime outputs and are excluded from repository-reference checks.
