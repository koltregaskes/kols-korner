# SEO build acceptance — 16 November 2026

Execution home: [hub checklist #1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907), SEO item; launch #1505.

Codex, T3 gaming laptop thread. Base: `a5ff697890eb8cf40e6388bb0e08d2b6f48d425e`.

The offline gate previously skipped every redirect and did not check HTML titles.
It now rejects missing, blank or duplicate titles on indexable pages, and checks
each redirect before applying noindex exclusions. Redirects must be immediate,
stay on the canonical site, agree with their canonical tag and land directly on
an existing indexable canonical page. Missing targets, chains, loops and noindex
destinations fail. This is a reversible validation change; it changes no routes
or editorial content. Existing Validate and Pages workflows already run this gate;
Validate also runs its regression tests.

Verified locally:

- `node scripts/build.mjs`: passed, 183 content items.
- `python scripts/check-seo.py`: passed, 192 indexable pages, 192 sitemap URLs,
  20 RSS items, 176 redirects.
- `node --test tests/seo-contract.test.mjs`: 15 passed, including corrupt PNG,
  blocked robots, duplicate JSON-LD, titles and redirect failure fixtures.

The build's time-dependent homepage freshness output is not included in this
validation-only change. The dated feed was stale at build time; this is not a
freshness or publishing acceptance receipt.

## Remaining acceptance and resume

The SEO checklist stays open. Review this PR and record the exact accepted head
and CI result. Merge/publication needs Kol's approval. After approved deployment,
use the actual Pages artifact and the final host to perform the byte comparison
in [OPERATIONS.md](OPERATIONS.md), then verify public canonical URLs, redirects,
RSS, sitemap, robots, llms and the real social image on that same release.
No deployment, public readback or webmaster account action was performed here.
Launch content and the owned links page retain their existing owners and gates.
