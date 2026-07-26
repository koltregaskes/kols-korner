# Architecture

Technical overview of how Kol's Korner is built and deployed.

## System Overview

Kol's Korner is a custom static site generator.

```text
content/*.md + content/pages/*.md + news-digests/*.md
                    |
                    v
             scripts/build.mjs
                    |
                    v
                 site/
                    |
                    v
            GitHub Pages deployment
```

## Source of Truth

- `content/` stores published posts as markdown with YAML frontmatter
- `content/pages/` stores static page content such as the about page
- `news-digests/` stores raw daily digest markdown
- `site/` is generated output and is committed for deployment

The news-gatherer itself is separate infrastructure. The shared Rooms OS website-news cycle and routing classifier write per-site digest files. This repo consumes those routed files and has a separate, fail-closed publisher for turning one verified date into a static-site commit.

## Build Pipeline

[`scripts/build.mjs`](/W:/Websites/sites/kols-korner/scripts/build.mjs) is responsible for:

1. Reading markdown content from `content/`
2. Parsing frontmatter and skipping unpublished posts
3. Converting markdown to HTML with the custom renderer
4. Generating article pages, digest pages, the homepage, posts index, tags page, about page, and newsletter page
5. Copying digest files into `site/news-digests/`
6. Writing `site/data/news-articles.json`, `site/feed.xml`, `site/sitemap.xml`, `site/robots.txt`, and `site/CNAME`
7. Cleaning old generated output first so stale pages from previous builds are not deployed

## Deployment

GitHub Actions runs the build on pushes to `main`.

- [`.github/workflows/pages.yml`](/W:/Websites/sites/kols-korner/.github/workflows/pages.yml) builds and deploys the site
- [`.github/workflows/daily-digest.yml`](/W:/Websites/sites/kols-korner/.github/workflows/daily-digest.yml) is a manual build-check workflow
- [`scripts/publish-routed-news.ps1`](/W:/Websites/sites/kols-korner/scripts/publish-routed-news.ps1) clones current `main` into a temporary directory, normalises one routed `digest-YYYY-MM-DD.md` input into the tracked `YYYY-MM-DD-digest.md` contract, builds, verifies and rejects out-of-scope source changes. It stages only the routed digest and digest post, leaving temporary `site/` build drift out of the commit. It does not commit or push unless `-Publish` is explicitly supplied.

The build can derive its canonical URL from:

- `CUSTOM_DOMAIN`
- or the current GitHub owner/repo in Actions

The committed [`CNAME`](/W:/Websites/sites/kols-korner/CNAME) file is copied into the published output, but canonical URLs only switch to the custom domain when `CUSTOM_DOMAIN` is set in the environment.

## Generated Output

Common generated paths:

- `site/index.html`
- `site/posts/`
- `site/tags/`
- `site/about/`
- `site/subscribe/`
- `site/data/news-articles.json`
- `site/feed.xml`
- `site/sitemap.xml`
- `site/robots.txt`
- `site/news-digests/`
- `site/CNAME`

Static assets that are maintained directly in `site/` include:

- `site/styles.css`
- `site/news/`

## Frontmatter

Supported fields:

- `title`
- `kind`
- `date`
- `tags`
- `summary`
- `image`
- `url`
- `publish`

If `kind` is omitted, the build treats the file as an `article`.

## Important Conventions

- UK English
- `site/` is committed on purpose
- Internal/local agent files are not part of the published project
- The repo is markdown-first, not Notion-backed
