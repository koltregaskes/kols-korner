# Kol's Korner — Agent Readiness

**Status:** DRAFT — awaiting Kol's sign-off. Not yet committed.
**Last updated:** 2026-05-16
**Estate-wide policy:** `W:\Websites\AGENT-READINESS-ESTATE.md`
**Repo:** `W:\Websites\sites\kols-korner`
**Domain:** koltregaskes.com
**Stack:** Custom Node SSG (`scripts/build.mjs`, output in `site/`)

---

## 1. Schema strategy

### 1.1 Home page (`site/index.html`)

**`Person`** (Kol himself — this is his personal site, so the home page is the canonical entity):

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://koltregaskes.com/#person-kol",
  "name": "Kol Tregaskes",
  "url": "https://koltregaskes.com",
  "image": "https://koltregaskes.com/site/media/kol.jpg",
  "description": "<KOL'S CANONICAL BIO — placeholder>",
  "knowsAbout": ["AI", "AI agents", "AI art", "cryptocurrency", "photography"],
  "sameAs": [
    "https://github.com/koltregaskes",
    "https://x.com/<PERSONAL_HANDLE>"
  ]
}
```

**`Organization`** (the publication / brand):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://koltregaskes.com/#organization",
  "name": "Kol's Korner",
  "url": "https://koltregaskes.com",
  "logo": "https://koltregaskes.com/site/favicon.svg",
  "founder": { "@id": "https://koltregaskes.com/#person-kol" }
}
```

**`WebSite`** with site-search action:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://koltregaskes.com/#website",
  "name": "Kol's Korner",
  "url": "https://koltregaskes.com",
  "publisher": { "@id": "https://koltregaskes.com/#organization" },
  "inLanguage": "en-GB"
}
```

### 1.2 Essay / post pages (`site/posts/*.html`)

`Article` per essay:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "<title>",
  "description": "<dek>",
  "datePublished": "<YYYY-MM-DD>",
  "dateModified": "<YYYY-MM-DD>",
  "author": { "@id": "https://koltregaskes.com/#person-kol" },
  "publisher": { "@id": "https://koltregaskes.com/#organization" },
  "inLanguage": "en-GB",
  "image": "<og-image url>",
  "mainEntityOfPage": "<canonical url>"
}
```

Plus `BreadcrumbList`.

### 1.3 News digest pages (`site/news/*.html`, `site/news-digests/*.html`)

Daily AI news digests are a different content type — they aggregate signals rather than push an argument. Use `NewsArticle` or `Article` with a clarifying `articleSection: "Daily Digest"`:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "articleSection": "Daily Digest",
  "headline": "AI Daily — <date>",
  "description": "<top-line summary>",
  "datePublished": "<YYYY-MM-DD>",
  "author": { "@id": "https://koltregaskes.com/#person-kol" },
  "publisher": { "@id": "https://koltregaskes.com/#organization" },
  "isPartOf": {
    "@type": "Periodical",
    "name": "Kol's Korner Daily Digest",
    "url": "https://koltregaskes.com/news/"
  }
}
```

Note: digests are largely AI-curated (per the `news:digest` script). Codex needs to confirm the byline. If they're sourced from many external articles + Kol's commentary, the author can still be Kol; if they're purely automated, mark as `author: <organisation>` rather than person.

### 1.4 About page (`site/about/index.html`)

Single `Person` block (the same one as home, with the @id reference) plus an `AboutPage` wrapper:

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Kol Tregaskes",
  "mainEntity": { "@id": "https://koltregaskes.com/#person-kol" }
}
```

### 1.5 Contact page (`site/contact/index.html`)

```json
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://koltregaskes.com/#person-kol",
    "email": "kol@koltregaskes.com"
  }
}
```

### 1.6 Implementation pattern (for Codex)

This site has a custom build (`scripts/build.mjs`). Cleanest pattern:

- Add a `scripts/schema/` directory with one JS module per schema type (`person.js`, `organization.js`, `website.js`, `article.js`, `breadcrumb.js`).
- Each post's frontmatter (in `content/posts/*.md` if Markdown, or wherever post metadata lives) gets parsed → JSON-LD generated → injected into the template at build time.
- One canonical `Person` and `Organization` block lives in the home template (`site/index.html`) and is referenced by `@id` from every other page. Don't duplicate the full block per page.

Codex's task to verify the existing build pipeline and wire in schema emission. **Do not migrate to a different SSG**.

---

## 2. Robots.txt and sitemap

### Robots.txt (currently)

```
User-agent: *
Allow: /

Sitemap: https://koltregaskes.com/sitemap.xml
```

Replace with estate baseline (explicit allow blocks for known AI bots — purely documentary).

### Sitemap.xml

Codex must verify:
- All posts + digests + chrome pages listed
- `lastmod` is current
- News digest pages are listed (they're the freshest content, important for AI freshness signals)

Build script (`scripts/build.mjs`) should regenerate sitemap at every build. Codex confirms.

---

## 3. Browser-agent UX audit (web.dev spec)

**Unaudited at draft time.** Codex needs to:

- Grep `site/*.html` and `site/**/*.html` for `<div onclick=...>`, `<span class="btn">`, etc.
- Verify CSS for `cursor: pointer` on actionables
- Confirm forms (search box on home? Contact form?) have `<label for=...>` or `aria-label`
- Test CLS with `cross-site-nav.js` injecting at end of body

Note: the site's home + post styles are split into `home-styles.css` + `post-styles.css` + `styles.css` per `site/`. Codex should grep all three for `.btn`, `cursor`, etc.

---

## 4. Content cadence — editorial guardrails

Kol's Korner is Kol-authored (with AI-curation help on digests). Google's "non-commodity" requirement should be easier to satisfy than for the AI-authored Synthetic Dispatch.

Watch-outs Codex should flag (not fix — content is Kol's editorial domain):

- Daily digests can read as "AI summary of the day's AI news" — exactly the commodity content Google warns about. The differentiator must be Kol's commentary / curation angle. If a digest is purely a list of headlines, schema should mark it `articleSection: "News Roundup"` rather than `Article`.
- Essays vs digests should be clearly distinguishable in schema (different types) and in URL structure (already are — `/posts/` vs `/news/`).

### Editorial gate (recommendation)

In `scripts/check-news-freshness.mjs`, add a check that flags digests where Kol's commentary section is < N words. Don't auto-publish unless Kol has added a take.

---

## 5. Crawl budget

The repo has 100+ daily news digests plus essays. Likely 500+ indexed pages. Codex should:

- Verify the news index page (`site/news/index.html`) is paginated reasonably (not one giant page with 500 entries inline)
- Run a `lastmod`-based freshness sort in `sitemap.xml` so Google prioritises the latest content

---

## 6. Open items and dependencies

- **News digest schema decision**: if digests are AI-curated with low Kol involvement, the schema should reflect that. Decision pending.
- **Build the contact form's `<label for=...>`** if a form exists at `site/contact/`. Codex confirms during audit.
- **News index pagination** — verify scale.

---

## 7. Definition of done for Codex

- [ ] `Person` + `Organization` + `WebSite` JSON-LD on home
- [ ] `Article` JSON-LD on every post in `site/posts/`
- [ ] `Article` (or `NewsArticle`) on every digest in `site/news/`, `site/news-digests/`
- [ ] `AboutPage` on `site/about/`
- [ ] `ContactPage` on `site/contact/`
- [ ] `BreadcrumbList` on all deep pages
- [ ] `robots.txt` matches estate baseline
- [ ] Sitemap regenerated with all pages + current `lastmod`
- [ ] `scripts/build.mjs` extended to emit JSON-LD per page from frontmatter
- [ ] `audit-agent-ready.py` passes
