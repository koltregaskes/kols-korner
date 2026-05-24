# Kol's Korner Hi-Fi Design

Last updated: 2026-05-17

## Direction

Kol's Korner uses a broadsheet editorial direction: dense enough to feel useful, sharp enough to feel personal, and deliberately not a generic hero-card landing page.

The homepage should answer the important questions in the first screen:

- What is this? A personal AI and technology desk from Kol Tregaskes.
- Who is it for? Readers who want sourced AI/tech signal and opinion without dashboard noise.
- What can I do here? Open the newest published briefing, read essays, browse the news archive, or jump into connected projects.
- What is useful now? The newest published issue and five sourced stories are surfaced above the fold.
- Where do I click first? The lead story/briefing, then the news archive or posts.

## Typography

Kol's explicit font direction is Fira Sans. The previous prototype used a display serif for some headings, but the shipped v1 applies Fira Sans to body, display, masthead, and long-form content. Monospace labels use the system monospace stack only.

Google Fonts load:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

## Colour

Dark is the default. Light mode is available through the site theme toggle and stored with `localStorage` key `kk-theme`.

Core tokens:

- Background dark: `#0e0f12`
- Surface dark: `#16181d`
- Surface 2 dark: `#1d2026`
- Ink dark: `#f1efe9`
- Soft ink dark: `#c9c6bf`
- Muted dark: `#7c7e85`
- Red accent dark: `#ef4444`
- Background light: `#f5f4ef`
- Surface light: `#ffffff`
- Ink light: `#15171c`
- Red accent light: `#d72b2b`

Red is reserved for the `##` motif, active navigation, primary actions, tags, reading progress, and hover states.

## Components

- `site-header`: solid sticky masthead, no backdrop filter.
- `dateline`: small factual status line, not a live/current claim.
- `site-logo`: `Kol's.Korner` wordmark with red dot.
- `theme-toggle`: light/dark only, persisted locally.
- `lead-row`: homepage broadsheet lead plus rail.
- `rail`: four-item "also on the desk" list.
- `section`: large bordered rows for news, writing, projects, and archive.
- `reading-progress`: 2px red progress bar on article pages.
- `toc`: sticky article table of contents on desktop.
- `site-footer`: four-column ecosystem footer plus social row.

## Rules

- Do not use CSS backdrop filters on sticky or modal elements.
- Do not imply real-time, live, current, daily, or today status unless the data proves it.
- Keep visible dates tied to source data.
- Use semantic buttons and links.
- Every form input must have a label or accessible name.
- Generated pages must carry JSON-LD from `scripts/build.mjs`.
- No forbidden legacy publication names in tracked files.

## Implementation

The design is implemented in:

- `scripts/build.mjs`: SSG templates, JSON-LD, shared chrome, and generated pages.
- `site/styles.css`: shared design system and page styles.
- `site/site.js`: generated shared interaction script.
- `site/news/news-app.js`: existing news browser logic.
- `site/news/news-styles.css`: page-specific news browser styles.

Generated output in `site/` is committed because GitHub Pages deploys it directly.
