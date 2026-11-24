# Reuse the launch pack

Built on Kol's Korner for [hub #2020](https://github.com/koltregaskes/rooms-os-hub/issues/2020), checklist [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907). Axy Lusion is the first reuse, through its existing owner after this pack is reviewed and merged. Launch order: Kol's Korner first, roughly one site a week, per Kol; exact dates remain with the Chief. No new release date is assigned here.

## Copy and fill

| Copy | Fill or adapt |
|---|---|
| launch/launch-pack.json | Site, repo, HTTPS origin, canonical origin, feed path, freshness hours, named operator, existing private alert issue, workflow names and representative routes (include article, news, links and error page) |
| scripts/monitor-launch.mjs and scripts/check-routed-feed-freshness.mjs | Adapt the feed assessor to the site's real schema; preserve source dates, check failed_sources and empty-feed semantics |
| scripts/accept-host.mjs and tests/overflow-check.mjs | Feed filename if not feed.xml; required header policy; route list; canonical origin stays final domain when checking preview |
| scripts/rehearse-backup.mjs, scripts/drill-rollback.mjs and tests/backup-restore.test.mjs | Explicit input allowlist, actual build command and public output directory; do not broaden to repository root or env files |
| scripts/prepare-cloudflare.mjs, launch/cloudflare.json and launch/security-profile.json | Public source directory, project name/confirmed hostname, build settings, site-specific CSP; review every allowed third-party origin |
| launch/RECOVERY.md and launch/CLOUDFLARE.md | Actual last-good artifact/run, backup owner/location/retention, host and DNS table, operator and existing escalation route |
| tests/launch-monitor.test.mjs and tests/accept-host.test.mjs | Run failure, empty, stale, corruption and recovery cases with site-specific fixtures |

Do not copy launch/evidence as evidence for another site. Do not copy credentials, local directories or provider bindings. Part 3 privacy/legal/support templates are supplied by the separate owner; this pack does not edit or certify those pages.

## Commands

Run in the target repo with its existing Node and Playwright installation (`npm ci` only in an authorised build environment). Acceptance uses headless Edge by default; set PLAYWRIGHT_CHANNEL=chromium where that browser is already installed. PLAYWRIGHT_MODULE may point to an existing playwright/index.mjs when this worktree has no node_modules. This does not install anything or start a server.

```powershell
node --test tests/launch-monitor.test.mjs tests/accept-host.test.mjs tests/backup-restore.test.mjs
node scripts/monitor-launch.mjs launch/launch-pack.json .local/monitor-UNIQUE.json
node scripts/accept-host.mjs https://YOUR-CURRENT-HOST/ .local/acceptance-UNIQUE.json
node scripts/rehearse-backup.mjs
node scripts/drill-rollback.mjs .local/backup-rehearsal-XXXX/restored
node scripts/prepare-cloudflare.mjs .local/cloudflare-UNIQUE
```

Use unique receipt/stage paths: scripts refuse overwrites. Retain the archive and manifest before rebuilding; copy sanitised small receipts to the PR. Run existing SEO, internal-link, public-boundary and digest checks on the isolated restored build. After authorised deployment, run `node scripts/check-live.mjs ARTIFACT https://FINAL-HOST/` for exact artifact parity as well as acceptance. Selected routes are a smoke check; full all-route accessibility/performance and seven proof days remain on the site checklist. Browser failures are failed/unverified, never silently skipped. Direct acceptance runs against public HTTPS and needs no local port.

The existing 06:30 freshness workflow now retains a launch-monitor artifact alongside its exact-byte public-feed proof, using the existing schedule. The Chief's existing check must collect the artifact and relay a failure/recovery to the configured private issue using its already authorised connector. **This PR does not supply or enable cross-repo credentials, auto-post to public issues, or prove automatic delivery.** The existing alerts migration #1886 owner must finish producer ingestion/rendered delivery; Claude must confirm receipt before monitoring acceptance is ticked. Keep one incident thread, link failed run/head and recovery; avoid repeating unchanged alerts. A missed monitor invocation itself is checked by the Chief's existing schedule, not a second laptop watchdog.

## Evidence and remaining acceptance

`launch/evidence/backup.json`: 1,177 committed files restored with no blob mismatches, retained locally. `rollback.json`: actual restored build changed and returned to the same homepage SHA-256. `accept-host.json`: current live HTTPS, metadata/feeds/PNG and selected 320px routes passed; required response headers failed on all selected routes and real 404. These receipts are scoped observations, not whole-checklist completion. No Cloudflare preview exists from this task and no first deployment is authorised. Independent backup retention, actual operator receipt/acceptance, seven daily proofs and provider rollback remain open.

`launch/evidence/monitor.json` records a real stale-public-feed failure despite successful workflow outcomes; it was relayed through the existing private operations issue [receipt](https://github.com/koltregaskes/rooms-os-hub/issues/517#issuecomment-6949471973). Comment persistence is verified separately from operator receipt. The isolated restored build passed internal links (372 HTML, zero failures), public boundary (372 HTML/10 JS), operations references (27), exact digest preservation (220 downloads), and SEO (193 canonical pages/sitemap URLs, 20 RSS items, 177 redirects).

## Kol-only steps, through the Chief

Cloudflare sign-in: open https://dash.cloudflare.com/ in Edge and sign in yourself to the existing account; inspect Workers & Pages and the site's zone; stop before Save and Deploy.

First deploy yes: approve the reviewed commit, exact host settings and first public Pages deployment, including any required Git authorisation you perform yourself.

DNS yes: after preview checks pass and the assigned Pages hostname is confirmed, approve and apply the site's reviewed DNS table, preserving mail and the captured old web targets.

The work was performed on Gaming-Laptop in this assigned worktree. The checks are portable to an authorised CI/Chief environment; no always-on laptop duty is introduced. Sign-in must happen in Kol's own Edge session; it is never agent work.

Codex, Gaming-Laptop, via T3 Code Chief of Staff
