# Kol's Korner link, download, redirect-hop, and disposition evidence (16 November 2026)

**Baseline inspected:** `origin/main` at `656365b` plus the link-check hardening changes on `gemini/1907-broken-links`.

This record documents internal links, local and external downloads, manual redirect-hop checks, and explicit dispositions for blocked external destinations. Blocked, paywalled, and rate-limited destinations are **never** counted as working (`ok`); they are recorded under `unverified` with explicit disposition codes.

## Summary of checks

| Scope | Command | Verified result | Unverified / caveats |
|---|---|---|---|
| Internal links, fragments, downloads & redirects | `node scripts/check-internal-links.mjs` | **Passed:** `370` HTML pages, `179` non-empty downloads/media/feeds/manifests verified (`size > 0`), max `1` internal meta-refresh redirect hop, `0` failures | None offline |
| Committed digest downloads | `node scripts/check-digest-preservation.mjs` | **Passed:** `220` committed digest files under `site/news-digests/` remain available | None offline |
| External links, downloads & manual redirect hops | `node scripts/check-external-links.mjs` | **Passed (`broken: 0`, `unsafe: 0`):** `2,443` unique external URLs checked (`2,404` `2xx` OK including `3` external `.pdf`/`.md` downloads; `988` redirected across `1–3` hops, max `3 <= 8` hops, `0` loops, `0` HTTPS downgrades) | `39` URLs across `12` hosts returned `401`/`403`/`429` (`unverified`, not counted as working; see dispositions below) |
| Unit tests (redirects, hops, collection, dispositions) | `node --test tests/external-links.test.mjs tests/redirect-safety.test.mjs` | **Passed:** `7/7` tests passed | Mocked HTTP transport in unit tests |

## What is checked (and what changed)

1. **Internal links, downloads, and same-site origin hygiene (`scripts/check-internal-links.mjs`)**
   - Scans all `370` built HTML pages (`href`, `src`, `srcset`, `poster`, `action`, and `<meta http-equiv="refresh">`), verifying fragments, non-empty file targets (`size > 0`), and internal redirect chains (`<= 8` hops, no loops, no HTTP downgrades).
   - Flags non-canonical same-site origins (`http://koltregaskes.com/...`, `https://www.koltregaskes.com/...`) instead of skipping them as external hosts.
   - Verifies non-empty presence of `site/data/news-digests.json` and every manifest-listed `.md` file in `site/news-digests/`, plus `feed.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `.well-known/security.txt`, `data/news-articles.json`, and `data/news-feed-latest.json`.
2. **External links, external downloads, and manual redirect hops (`scripts/check-external-links.mjs`)**
   - Collects unique external `http(s)` URLs across `site/**/*.html` (`<a href>`, non-preconnect `<link>`, media/script sources), `site/llms.txt`, `site/.well-known/security.txt`, and `site/data/news-articles.json` + `site/data/news-feed-latest.json` (excluding entries already marked `sourceUnavailable: true`). This adds `860+` client-rendered `/news/` article URLs that HTML-only scans missed.
   - Uses `redirect: 'manual'` to trace every hop (`301`/`302`/`303`/`307`/`308`), counting hops (observed max `3`, cap `8`), rejecting redirect loops and excessive chains as `broken`, and rejecting any intermediate or final HTTPS-to-HTTP downgrade as `unsafe`.
   - Assigns an explicit `disposition` string to every non-`2xx` outcome and supports `--report <path>` for machine-readable disposition auditing.

## Explicit dispositions for blocked / unverified external destinations (`39` URLs)

None of the `39` destinations below are counted as `ok` or working. Automated CI treats `404`/`410`/redirect-loops/excessive-hops/HTTPS-downgrades as hard failures (`exit 1`), while bot-blocked, paywalled, and rate-limited hosts remain `unverified` with explicit disposition tracking:

| Host | HTTP | Explicit disposition | Count | Where referenced | Sample URL | Launch disposition policy |
|---|---:|---|---:|---|---|---|
| `venturebeat.com` | `429` | `rate-limited-upstream` | `14` | `data/news-articles.json`, `html-a` | `https://venturebeat.com/infrastructure/perplexity-partners-with-nvidia-to-launch-portable-computer-a-fully-local-ai-agent-with-zero-token-costs` | Keep citation; upstream rate-limits automated link crawlers. Spot-check sample links in a normal browser before freeze; replace/archive if permanently removed. |
| `www.reuters.com` | `401` | `blocked-auth-or-paywall` | `10` | `data/news-articles.json` | `https://www.reuters.com/business/finance/palmer-luckey-backed-erebor-receives-us-national-banking-charter-wsj-reports-2026-02-06/` | Keep citation; Reuters blocks automated unauthenticated fetches with `401`. Do not count as verified; manual browser spot-check only. |
| `www.marktechpost.com` | `403` | `blocked-bot-challenge` | `3` | `data/news-articles.json`, `html-a` | `https://www.marktechpost.com/2026/08/22/the-developers-guide-to-nemo-guardrails-for-enterprise-ai-safety` | Keep citation; Cloudflare/WAF bot challenge (`403`). Verify in browser if reported broken; otherwise keep unverified status explicit. |
| `aimagazine.com` | `403` | `blocked-bot-challenge` | `2` | `data/news-articles.json` | `https://aimagazine.com/news/how-aws-and-nvidia-are-powering-agentic-and-physical-ai` | Keep citation; WAF bot challenge (`403`). Do not count as working. |
| `www.ft.com` | `403` | `blocked-bot-challenge` | `2` | `data/news-articles.json` | `https://www.ft.com/content/41bf5c6a-9735-4f1a-a8e3-2bcccad58ba0` | Keep citation; paywall/bot gate (`403`). Do not count as working. |
| `www.marketwatch.com` | `401` | `blocked-auth-or-paywall` | `2` | `html-a` | `https://www.marketwatch.com/story/coreweaves-stock-rises-as-investors-cheer-unique-financing-deal-e2d44c4e?mod=mw_rss_topstories` | Keep citation; paywall/anti-bot gate (`401`). Do not count as working. |
| `apnews.com` | `403` | `blocked-bot-challenge` | `1` | `data/news-articles.json` | `https://apnews.com/article/antitrust-lawsuit-ai-slowdown-anthropic-openai-spacexai-google-960af4308161eaf4ed13c383b0ce1c1b` | Keep citation; bot challenge (`403`). Do not count as working. |
| `investors.micron.com` | `403` | `blocked-bot-challenge` | `1` | `data/news-articles.json` | `https://investors.micron.com/news/press-release/2026/Micron-Unveils-Micron-Research-Labs-a-U-S--Based-Long-Horizon-Innovation-Hub-to-Shape-the-Future-of-Memory-and-AI/default.aspx` | Keep citation; corporate investor-relations WAF (`403`). Do not count as working. |
| `medium.com` | `403` | `blocked-bot-challenge` | `1` | `data/news-articles.json` | `https://medium.com/@thomasunise/this-open-source-cybersecurity-platform-uses-ai-agents-to-detect-threats-and-protect-businesses-762e65392b42` | Keep citation; Cloudflare challenge (`403`). Do not count as working. |
| `openai.com` | `403` | `blocked-bot-challenge` | `1` | `html-a` | `https://openai.com/index/us-department-of-energy-collaboration` | Keep citation; Cloudflare challenge (`403`). Do not count as working. |
| `www.gartner.com` | `403` | `blocked-bot-challenge` | `1` | `html-a` | `https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025` | Keep citation; WAF bot challenge (`403`). Do not count as working. |
| `www.phoronix.com` | `403` | `blocked-bot-challenge` | `1` | `data/news-articles.json` | `https://www.phoronix.com/news/Void-Linux-AI-Policy-Orphan` | Keep citation; bot challenge (`403`). Do not count as working. |

### Already-retired historical citations (`7` entries)

`site/data/news-articles.json` retains `7` historical `digg.com/ai/*` entries explicitly marked `"sourceUnavailable": true` (handled by `scripts/repair-archived-links.mjs` and rendered as non-clickable source citations by `site/news/news-app.js` without emitting dead outbound links).

## Remaining unverified boundaries

- **Blocked external hosts (`39` URLs above):** HTTP-client automation receives `401`/`403`/`429`. These remain explicitly `unverified` until spot-checked interactively or archived if permanently gone.
- **Historical markdown archive files (`site/news-digests/*.md`):** Committed raw digest `.md` files are preserved untouched by `scripts/check-digest-preservation.mjs`; `174` historical `digg.com/ai/` links inside older raw `.md` snapshots remain raw archival logs rather than rendered HTML pages.
- **Live post-deploy origin (`https://koltregaskes.com/`):** External DNS / custom-domain live checks (`scripts/check-live.mjs`) remain pending live launch.
