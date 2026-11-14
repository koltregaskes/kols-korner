# Kol's Korner

Personal website and publishing system for Kol Tregaskes.

## Deployment and rollback rehearsal

Record the current known-good commit, successful deployment run and rehearsal evidence on the [launch issue](https://github.com/koltregaskes/rooms-os-hub/issues/1505), rather than keeping a dated baseline in this README.

This site deploys through the existing Actions Pages workflow. For a live rollback, rerun the known-good Pages deployment through that pipeline, then verify every public artifact file over HTTPS. Restore the latest reviewed release through its deployment run and repeat the byte readback. Do not force-push main, alter hosting/DNS, restart a legacy writer, or treat a green job as destination proof. If the historical run cannot be rerun, prepare a narrowly scoped revert PR, obtain review and green checks, then use the normal pipeline.

Keep fresh news data and source timestamps under the existing writer; reverting the site is not permission to roll back data blindly. Record run URLs, exact commits, observed public hashes, failures and recovery on the launch issue. Confirm the named operational owner and distinguish an offline artifact-restoration exercise from an actual production rollback or data-recovery test.

## Deployment State

- Live production site: https://koltregaskes.com/ (custom domain on GitHub Pages)
- GitHub Pages origin URL: https://koltregaskes.github.io/kols-korner/
- The custom-domain cutover is complete; treat the live site and current Pages configuration as the source of truth

## What This Repo Is

- A custom Node.js static site generator
- Markdown content in `content/`
- Daily digests in `news-digests/`
- Generated, deployable output committed in `site/`
- GitHub Actions deployment to GitHub Pages on push to `main`
- Shared Rooms OS news routing plus a collision-safe, isolated publish helper

The shared news-gathering pipeline runs outside this repo. This repo consumes the generated digest inputs, publishes digest posts, builds the site, and deploys the finished static output.

## Build

```bash
node scripts/build.mjs
python scripts/check-seo.py
```

## Daily News

The build applies canonical URLs, Open Graph and Twitter cards, feed discovery
and page-specific JSON-LD to every indexable HTML page, including the preserved
broadsheet homepage, news archive and privacy page. Article and digest pages use
BlogPosting metadata with source publication dates. Social previews use the
checked-in 1200x630 PNG at `site/media/social-default.png`.

The sitemap discovers real public HTML rather than a hand-kept page list, omits
redirects and noindex pages, and escapes XML values. The standalone sitemap
script uses the same discovery and `CNAME` handling. RSS retains its stable GUIDs
and publication dates and links to the generated canonical post paths.

The offline Python gate checks every canonical and social image, parses JSON-LD,
parses sitemap and RSS XML, checks exact sitemap coverage, and verifies local
feed targets. Both validation and Pages builds run it before deployment.

```bash
node scripts/fetch-news.mjs --date YYYY-MM-DD
node scripts/generate-daily-digest.mjs --date YYYY-MM-DD --allow-empty --force
node scripts/backfill-digests.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/publish-routed-news.ps1 `
  -TargetDate YYYY-MM-DD `
  -SourceDigestDirectory W:\websites\sites\kols-korner\news-digests
```

- Raw digest files live in `news-digests/`
- Published digest posts live in `content/daily-digest-YYYY-MM-DD.md`
- `scripts/backfill-digests.mjs` publishes any raw digests that do not yet have a matching post
- The shared Rooms OS website-news cycle and routing classifier own source ingestion and per-site digest generation
- `scripts/publish-routed-news.ps1` validates one routed date in a fresh temporary clone, normalises the shared local-only `digest-YYYY-MM-DD.md` filename into the tracked `YYYY-MM-DD-digest.md` contract, and prevents unrelated worktree changes leaking into a news commit
- The publisher stages only the routed digest and generated digest post. GitHub Pages rebuilds the deployment from those committed sources, so unrelated historical `site/` drift cannot leak into the news commit
- The publisher is validation-only by default. `-Publish` is an explicit live gate that commits and fast-forward pushes the verified date to `main`
- The retired dirty-checkout task must stay disabled until its replacement schedule is approved and proven
- `.github/workflows/daily-digest.yml` is a manual build-check workflow only
- `site/data/news-articles.json` is generated during build so the news page can load from one prebuilt payload instead of fetching every raw digest separately

Optional environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-key
CUSTOM_DOMAIN=koltregaskes.com
```

## Preview Locally

```bash
node scripts/build.mjs
cd site
npx http-server -p 8080
```

Visit `http://localhost:8080/`.

## Deploy

Push to `main`. GitHub Actions will:

1. Run `node scripts/build.mjs`
2. Upload `site/`
3. Deploy to GitHub Pages

The repo already includes a root `CNAME` file for `koltregaskes.com`, but the build only switches canonical URLs to the custom domain when `CUSTOM_DOMAIN` is set in the environment. Until then, the generated feed, sitemap, and robots file stay aligned with the working GitHub Pages URL.

## Content Model

Articles and digests use markdown with YAML frontmatter:

```yaml
---
title: My Post Title
kind: article
date: 2026-03-15
tags: [ai, tech]
summary: Short description for listings and previews
publish: true
image: my-image.png
---
```

Supported fields:

- `title`
- `kind`
- `date`
- `tags`
- `summary`
- `image`
- `url`
- `publish`

Posts with `publish: false` are excluded from the build.

## Key Paths

- `scripts/build.mjs` - Main build script
- `scripts/run-daily-news.ps1` - Retired dirty-checkout runner retained for history and manual diagnosis
- `scripts/publish-routed-news.ps1` - Isolated, one-date shared-news publisher; validation-only unless `-Publish` is supplied
- `content/` - Source articles and static page markdown
- `news-digests/` - Raw digest markdown used by the news section
- `site/` - Generated output that GitHub Pages deploys
- `site/data/news-digests.json` - Generated manifest for the news browser
- `site/data/news-articles.json` - Prebuilt article payload for the news browser
- `.github/workflows/pages.yml` - Main Pages deploy workflow
- `.github/workflows/daily-digest.yml` - Manual digest build-check workflow

## Notes

- UK English throughout
- Dark mode only; do not reintroduce the old theme toggle without a clear product decision
- No Notion content pipeline in the current architecture
- `site/` is intentionally committed
- Internal agent files such as `AGENTS.md`, `CLAUDE.md`, and local Claude settings are ignored and not part of the published project

## Verify public deployment bytes

Download the github-pages artifact from the successful deployment run for the expected main commit, extract artifact.tar into an ignored local directory, then run:

```text
node scripts/check-live.mjs <extracted-directory> <https-site-base-url/>
```

Record the run URL and its head SHA alongside the result. This compares every public artifact file with the live HTTPS response, including downloads and discovery files. Mismatches, missing files, blocked responses, network errors and the four-minute crawl deadline prevent a passing result. It prints paths and counts, never response bodies. A passing crawl proves those deployed bytes at the time checked, not freshness, source truth or launch acceptance.

### Daily freshness evidence

The existing Routed feed freshness workflow keeps its 06:30 UTC schedule and failed-run notification route. In addition to checking the committed generation/source age, it fetches the existing HTTPS public feed and requires an exact SHA-256 payload match. Future timestamps (over five minutes ahead), feeds at least 24 hours old, redirects, HTTP/network failures and mismatched payloads cannot produce a passing readback. A fresh empty feed is labelled empty with no invented source date.

Each run retains a public-feed-proof artifact for 30 days, including the run/head, destination, check time, generation time and newest source-declared date. The source dates are feed metadata, not independently authenticated publication evidence. Run locally with node scripts/check-public-feed-proof.mjs, or dispatch the existing workflow for a bounded readback. The script reads only the public feed and never generates or publishes articles.

For launch acceptance, link each day's actual run and artifact on rooms-os-hub#1505 during the planned seven-day window. The code does not prove seven consecutive days, failure-notification recipient delivery, production recovery or post-launch-owner acceptance. Those require separate readbacks with the existing owners.

## Launch security boundary

launch/security-profile.json records the current static Pages boundary. CI inventories the built output and fails if a form, collection/auth field, external script, mutation API or telemetry appears without a deliberate review. The current contact journey is mailto using site-config.json; no newsletter sending, payment processing, application Worker/API or analytics collector is implemented. This is a verified code inventory, not an owner decision that those launch checklist items are accepted. The existing owners retain newsletter/monetisation decisions and the analytics contract.

Repository HTML can supply CSP/referrer metadata; it cannot configure Pages response headers. HSTS, framing, MIME policy and a response CSP require the hosting owner. PR #34 tracks full meta coverage; frame-ancestors and X-Frame-Options are never claimed from meta tags. The current header mitigation remains unapproved in the contract until the existing owner records a decision. Check final HTTPS/redirect/header behaviour after the hosting move using the existing live verifier and GitHub Pages HTTPS guidance linked in the profile. No DNS or account change is made by these checks.
