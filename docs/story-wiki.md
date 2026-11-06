# Story wiki (design and prototype)

Status: prototype on a draft PR, 21 October 2026. Nothing here publishes to koltregaskes.com yet.

Kol wants Wikipedia-style background pages behind news stories, focused on AI and tech and tested first with world news. This repo serves koltregaskes.com (`CNAME`), which today shows daily headlines only.

## Why not the current Notion News Atlas

The Notion News Atlas pages (the Ukraine fixture and "Saudi Arabia attacks — News Atlas", 17 October) are careful but hand-built. They have no structured fields, no link to the news data, no refresh, and no route to a public page; Notion itself records that automated refresh and the Sites/Pages binding are unverified. Notion stays the place for editorial notes, not the source of truth.

## Data source: Neon, with git as the published copy

- **Neon (`rooms-os-cloud-postgres`, `neondb`)** already holds `public.news_articles` (72,399 rows) and `public.news_sources` (794). It is the right home for story records because stories need joins to articles, sources and dates. It has been stale since 30 July 2026 (KOL-6331), so that must be fixed first.
- **Notion**: a workspace search on 21 October found News Atlas pages and source-registry pages, but no structured news table. Use it for review notes only.
- **Git (this repo, `stories/*.md`)** is the published copy. A page only reaches the site through a reviewed commit, which gives an audit trail and an easy rollback.

Proposed Neon tables (Build to create; not created by this PR): `story_topics` (evergreen topic), `stories` (dated story, status, slug, topic), `story_claims` (claim text, section, source ids), `story_sources` (URL, publisher, date, links to `news_articles.id` where possible) and `story_reviews` (who approved, when, which revision).

## Page structure

Front matter: `title`, `slug`, `date`, `topic`, `category` (`ai-tech` or `world`), `status`, `summary`, `last_checked`, and `approved_by` plus `approved_at` once approved.

Sections, in order: Summary, Background, Timeline, Key players, Why it matters, What is not yet known (optional), Related stories, Sources. Every paragraph and list item outside Related stories and Sources must carry at least one `[n]` citation that matches a numbered source with a URL. `scripts/build-stories.mjs --check` enforces this in CI.

## Automatic generation

1. The news pipeline clusters articles in `news_articles`. A cluster above a volume threshold, or one Kol flags, becomes a story candidate.
2. A generator drafts the page from the clustered articles plus primary sources (official notices, filings, court records), writing claims and sources to Neon.
3. An exporter writes `stories/<yyyy>-<mm>-<slug>.md` with `status: draft` and opens a draft PR. Generated pages always start as drafts.

## Approval

- Default is unpublished. The builder never writes a draft into `site/`. Drafts render only into a CI artifact (`story-wiki-preview`) with a DRAFT banner and `noindex`.
- Kol approves by setting `status: approved`, `approved_by` and `approved_at` in the review PR and marking it ready. Merging stays a human step.
- Publishing approved pages into `site/` (`--write-site`) is not wired into the Pages build yet; that is a separate, deliberate change.

## Quality gates (before Kol sees a draft)

1. **Fact-check:** every claim cited; at least one primary source for the core facts; numbers checked against the source; a second model or agent re-checks each claim against its cited source.
2. **No bias:** attribute contested claims ("X says"), give each side's own stated position, avoid loaded words, and list what is not yet known.
3. **Humaniser:** run Content's humaniser step and a `writing-style.txt` pass, then re-run the citation check, since rewriting can drop citations.

## URL patterns

- Dated story: `/stories/<yyyy>/<mm>/<slug>/`. This is the link used in social posts. It never changes once published.
- Evergreen topic: `/wiki/<topic-slug>/`. Lists every dated story on the topic and carries the long-running background.
- Each story's canonical tag points at itself; each topic page's canonical points at itself. A story links up to its topic and the topic links down to its stories.
- Renames: GitHub Pages has no server redirects, so a moved page keeps a small HTML stub at the old path with `<meta http-equiv="refresh">` and a canonical tag to the new path (the same pattern as `writeLegacyRedirectPage` in `scripts/build.mjs`).
- Both patterns are plain folders with `index.html`, so they work on GitHub Pages without extra configuration.

## Prototype pages (drafts)

- `stories/2026-10-us-bars-deepseek-from-federal-civilian-systems.md` (AI and tech)
- `stories/2026-10-alberta-votes-to-remain-in-canada.md` (world)

Run `npm run stories:preview` to render them into `.story-preview/` locally.
