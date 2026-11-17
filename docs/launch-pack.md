# Launch pack

## Pages

Part 3 of [hub #2020](https://github.com/koltregaskes/rooms-os-hub/issues/2020), supporting the privacy, accessibility and newsletter/support items on [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907).

These are templates for Kol to check, not legal advice. Each rendered page keeps that note visible and lists its outstanding fields. Do not treat a passing build as permission to publish or as a legal review.

### Files and routes

Copy `scripts/launch-pages.mjs`, `launch/pages.json` and `site/assets/launch-pages.css`. Keep `tests/privacy.spec.mjs` and the existing launch accessibility/link checks, adapting their site origin and storage expectations. Copy the method for gathering evidence, not another site's observations in `launch/privacy-observations.json`.

The renderer writes `/privacy.html`, `/terms/`, `/cookies/`, `/accessibility/` and `/contact/`. The existing privacy URL stays intact. Pages link to one another; existing Contact links lead to the pack. The build runs the renderer before SEO and sitemap generation, so all five pages get canonical metadata, security metadata and sitemap entries. It uses the site's shared head, header and footer helpers and `site.js` for theme/navigation.

In another generator, call `writeLaunchPages({head, header, footer, siteUrl, siteName, owner})` before its SEO/sitemap pass. Helpers must supply that site's styles, skip link, navigation and footer. Preserve the relative asset paths or adapt the route map. Update the renderer's references to news, posts, RSS, theme, planned hosting and newsletter behaviour for the destination site. Reusing the layout does not verify those claims.

### Fields to fill in

Edit `launch/pages.json`: site name, owner, canonical URL, actual host, review date, contact@ address, working fallback, font services/origins, analytics state, storage key names/purposes and every per-page confirmation list. Site identity must agree with the build or it fails. Dates record a real review, not an automatic build timestamp.

Kol must confirm:

- Privacy: owner/contact details, final host, provider logging/retention/transfers, email provider, message retention and lawful basis; enabled analytics, collector fields, bot filtering, retention and Cloudflare comparison.
- Terms: ownership, third-party permissions, reuse/licensing, and any jurisdiction/liability wording.
- Cookies: final-host cookies including HttpOnly cookies, storage purposes and whether consent is needed, plus any new embeds or counter.
- Accessibility: manual keyboard/screen-reader results, contrast/all-route coverage, known barriers and realistic responses.
- Contact/support: contact@ forwarding and an authorised outside receipt, hello@ fallback, support scope/response expectations, and newsletter/financial-support decisions under #1495/#1502.

Do not invent a provider, retention period, legal basis or compliance claim to fill a gap. Replace the open wording only after the facts and Kol's decisions are recorded. The current templates describe no enabled collector, no signup/contact form and an unlaunched email newsletter. The shared cookieless counter remains with #1498/#367. Do not enable it here. Its notice needs a fresh review before activation.

The current contact@ address is a proposed route, not a verified mailbox. Keep hello@ until Kol has approved forwarding and an outside receipt confirms delivery. No new accounts or test messages are authorised by these steps. RSS does not prove newsletter email delivery. Financial support and newsletter launch remain separate decisions.

### Verification and reuse

1. Read the destination site's checklist, generator and browser code. Confirm what it actually loads, stores and sends before changing the prose.
2. Use a fresh browser context on the approved live/preview URL. Record only network origins, paths/methods, cookie counts/names, storage key names and observed actions. Check home, news, privacy, contact and representative content. Exercise theme, save and flag where available. Do not retain cookie values, storage values, queries or message contents.
3. Distinguish local artifact checks, real provider responses and final-host acceptance. Resource Timing alone cannot prove HTTP methods, HttpOnly cookies, host logs or retention. Inspect response metadata and the browser cookie store when available. State missing coverage.
4. Run `npm run build`, `python scripts/check-seo.py` and `node scripts/check-internal-links.mjs`. The normal build rewrites generated files; preserve existing work before running it and inspect unrelated content/feed changes before committing.
5. Run `npx playwright test tests/privacy.spec.mjs`, then `npx playwright test tests/launch.spec.mjs --grep 'privacy.html|terms/index.html|cookies/index.html|accessibility/index.html|contact/index.html'`. This checks the five pages at 320/390/1280px, headings, keyboard focus, overflow, internal targets and serious/critical axe findings. External font requests are recorded and blocked in these artifact tests. They do not prove final-host behaviour or full accessibility compliance.
6. Run `node scripts/check-external-links.mjs` and record blocked/unverified destinations separately. Perform manual keyboard, screen-reader and contrast review on the exact final artifact, then repeat relevant checks on the final host.
7. Apply the repo's writing rules. Use plain UK English, concrete statements, no filler and no em dashes. The hub path `skills/humaniser/SKILL.md` returned 404 in this run; `writing-style.txt` supplied the house rules.
8. Open a PR linked to #2020 and the site's checklist, retaining the visible template note and open fields. Request independent review. Kol owns the factual/legal confirmation and any publication decision. Do not merge your own PR.

Reference checks: the [ICO transparency checklist](https://ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies/are-you-transparent-about-how-you-use-peoples-data/) covers the information to establish before completing a notice; its [storage and access guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-comply-with-the-pecr-rules/) also covers local storage. These sources inform the open review fields; this pack does not decide a site's legal position.

### This implementation's evidence

The review date is 17 November 2026. `launch/privacy-observations.json` records the live incognito privacy/news visits: own-origin resources and Google Fonts, no observed collector request, empty initial local/session storage and zero JavaScript-visible cookies. Theme and save produced `kk-theme` and `news-favorites`. The live Report action was not exercised. Source review also found `news-flags`; local browser tests allow only the three documented keys. No claim is made about HttpOnly cookies, provider logs, retention, the future Cloudflare host or all live routes.

Verified locally: build passed; after unrelated news output was archived and the original news artifacts restored, SEO passed (195 pages/sitemap URLs) and the internal target/download/fragment/redirect check passed (373 HTML pages, 179 downloads/manifests, maximum one redirect hop). All 22 focused Playwright checks passed on that page-only artifact, comprising 15 page/viewport accessibility checks and seven privacy boundary checks. The news privacy check exercises theme, Save and Report, checks all three documented storage keys and records before/after key names. All observed local artifact requests were GETs and the browser context had no cookies. The 36 existing security, SEO, language, route coverage and owned-link contracts also passed. The mobile privacy render was inspected at 390px. Automated accessibility checks are limited to the existing suite's assertions; manual screen-reader and final-host acceptance remain open. The T3 preview snapshot failed because the browser was not producing screenshot frames; live DOM/network timing evaluation worked.

The build's unrelated news/feed/tag changes were preserved under ignored `.local/unrelated-build-output` and excluded from this PR. The normal build will regenerate them from the current content inputs. `git diff --check` passed. The evidence commit is `ae6cd2c`, followed by template commit `3e86bcb`. A transient standard shell logon error occurred; the approved elevated runner completed the later verification and commits.

The external crawl checked 2,446 destinations: 2,403 returned HTTP success, none were broken or unsafe, and 43 remain unverified because of upstream restrictions. It followed 989 redirects, up to three hops. Unverified links are not counted as working. `launch/page-checks.json` retains the summary and host dispositions without response bodies or cookie data.

Codex, Gaming-Laptop, via T3 Code Chief of Staff
