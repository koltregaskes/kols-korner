# SEO validation, 12 November 2026

Before and after use the same local Node build and committed markdown inputs.
These are offline output checks, not claims about live indexing.

| Check | Before | After |
| --- | ---: | ---: |
| Indexable built pages | 188 | 188 |
| Missing canonical | 0 | 0 |
| Missing Open Graph image | 188 | 0 |
| Missing Open Graph URL | 188 | 0 |
| Missing Twitter image | 188 | 0 |
| Missing JSON-LD | 186 | 0 |
| Sitemap URLs | 187 | 188 |
| RSS items | 20 | 20 |

The omitted sitemap page was `/contact/`. Discovery now follows actual output
and excludes redirect and noindex pages. The standalone sitemap command honours
the root CNAME and shares discovery with the main build. XML values are escaped;
lastmod uses content dates where available rather than the sitemap build time.

Social cards use a real 1200x630 PNG on every indexable page. Feed discovery is
present throughout, including the preserved broadsheet homepage, news archive and
privacy page. Articles and digest posts receive BlogPosting JSON-LD with author,
headline, page URL, image and publication date. Existing homepage identity schema
is preserved. RSS retains stable GUIDs, correctly dated items and its unchanged
content timestamp behaviour; XML escaping and canonical output paths are explicit.

Commands run successfully:

```powershell
node scripts/build.mjs
python scripts/check-seo.py
node scripts/check-news-freshness.mjs --required-date 2026-06-03
```

The existing freshness check found the required 3 June digest with 15 articles.
The full build generated 180 content items and 188 indexable pages. The SEO gate
parses sitemap and RSS XML, validates JSON-LD and PNG dimensions, checks exact
sitemap coverage and verifies local RSS targets. Both validation and Pages CI
run this gate. Local builds used the machine's installed ffmpeg via FFMPEG_PATH.

Isolated corruption checks confirmed that the gate rejects a missing canonical,
missing social image, invalid JSON-LD, missing sitemap URL, invalid RSS date,
malformed RSS XML and wrong PNG dimensions. No remote crawler or ranking check
was performed. Existing raw archive files are retained; the generated post output
reflects already committed markdown inputs.

Protocol reference: [Sitemaps](https://www.sitemaps.org/protocol.html).

Codex (12 Nov burn day, launched by Claude CoS)
