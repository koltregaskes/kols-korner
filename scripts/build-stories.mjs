#!/usr/bin/env node
// Story wiki builder (prototype). See docs/story-wiki.md.
//
// Reads stories/*.md, validates structure and citations, and renders pages.
// Safety rules:
//   - A story without `status: approved` (plus approved_by and approved_at) is a draft.
//   - Drafts are NEVER written into site/. They render only with --preview <dir>,
//     carry a visible DRAFT banner and a noindex,nofollow robots tag.
//   - Approved stories render to site/stories/<yyyy>/<mm>/<slug>/ only with --write-site.
//     Nothing calls --write-site yet, so merging this file publishes nothing.
//
// Usage:
//   node scripts/build-stories.mjs --check
//   node scripts/build-stories.mjs --check --preview <dir>
import fs from 'node:fs/promises';
import path from 'node:path';

const STORIES_DIR = path.join(process.cwd(), 'stories');
const SITE_URL = 'https://koltregaskes.com';
const REQUIRED_SECTIONS = ['Summary', 'Background', 'Timeline', 'Key players', 'Why it matters', 'Related stories', 'Sources'];
const UNCITED_SECTIONS = new Set(['Related stories', 'Sources']);
const REQUIRED_FIELDS = ['title', 'slug', 'date', 'topic', 'category', 'status', 'summary', 'last_checked'];

const args = process.argv.slice(2);
const previewIdx = args.indexOf('--preview');
const previewDir = previewIdx >= 0 ? args[previewIdx + 1] : null;
const writeSite = args.includes('--write-site');

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2] };
}

function splitSections(body) {
  const sections = new Map();
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) { current = h[1].trim(); sections.set(current, []); continue; }
    if (current) sections.get(current).push(line);
  }
  return sections;
}

function blocks(lines) {
  // Paragraphs and list items, each treated as one claim-bearing block.
  const out = []; let para = [];
  const flush = () => { if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = []; } };
  for (const line of lines) {
    if (!line.trim()) { flush(); continue; }
    const li = line.match(/^(?:-|\d+\.)\s+(.*)$/);
    if (li) { flush(); out.push({ type: 'li', ordered: /^\d+\./.test(line), text: li[1] }); continue; }
    para.push(line.trim());
  }
  flush();
  return out;
}

function parseSources(lines) {
  return blocks(lines).filter((b) => b.type === 'li').map((b, i) => {
    const url = (b.text.match(/https?:\/\/\S+$/) || [''])[0];
    return { n: i + 1, text: b.text.replace(url, '').trim(), url };
  });
}

function validate(file, fm, sections) {
  const errors = [];
  for (const f of REQUIRED_FIELDS) if (!fm[f]) errors.push(`missing frontmatter field "${f}"`);
  if (fm.status && !['draft', 'approved'].includes(fm.status)) errors.push(`status must be draft or approved, got "${fm.status}"`);
  if (fm.status === 'approved' && (!fm.approved_by || !fm.approved_at)) errors.push('approved stories need approved_by and approved_at');
  if (fm.date && !/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) errors.push('date must be YYYY-MM-DD');
  if (fm.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.slug)) errors.push('slug must be lower-case kebab-case');
  for (const s of REQUIRED_SECTIONS) if (!sections.has(s)) errors.push(`missing section "## ${s}"`);
  const sources = parseSources(sections.get('Sources') || []);
  if (sources.length < 2) errors.push('at least two sources are required');
  sources.forEach((s) => { if (!s.url) errors.push(`source ${s.n} has no URL`); });
  const used = new Set();
  for (const [name, lines] of sections) {
    if (UNCITED_SECTIONS.has(name)) continue;
    for (const b of blocks(lines)) {
      const cites = [...b.text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
      if (!cites.length) errors.push(`uncited claim in "${name}": ${b.text.slice(0, 70)}…`);
      for (const c of cites) { used.add(c); if (c < 1 || c > sources.length) errors.push(`citation [${c}] in "${name}" has no matching source`); }
    }
  }
  sources.forEach((s) => { if (!used.has(s.n)) errors.push(`source ${s.n} is never cited`); });
  return { errors, sources };
}

function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(\d+)\]/g, '<sup class="story-cite"><a href="#source-$1">[$1]</a></sup>');
}

function renderSection(name, lines, sources) {
  if (name === 'Sources') {
    return `<h2 id="sources">Sources</h2>\n<ol class="story-sources">\n${sources.map((s) => `  <li id="source-${s.n}">${esc(s.text)} <a href="${esc(s.url)}" rel="noopener">${esc(s.url)}</a></li>`).join('\n')}\n</ol>`;
  }
  let html = `<h2 id="${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${esc(name)}</h2>\n`;
  let open = null;
  for (const b of blocks(lines)) {
    if (b.type === 'li') {
      const tag = b.ordered ? 'ol' : 'ul';
      if (open !== tag) { if (open) html += `</${open}>\n`; html += `<${tag}>\n`; open = tag; }
      html += `  <li>${inline(b.text)}</li>\n`;
    } else {
      if (open) { html += `</${open}>\n`; open = null; }
      html += `<p>${inline(b.text)}</p>\n`;
    }
  }
  if (open) html += `</${open}>\n`;
  return html;
}

function storyPath(fm) {
  const [y, m] = fm.date.split('-');
  return `/stories/${y}/${m}/${fm.slug}/`;
}

function renderPage(fm, sections, sources) {
  const isDraft = fm.status !== 'approved';
  const urlPath = storyPath(fm);
  const body = [...sections.keys()].map((n) => renderSection(n, sections.get(n), sources)).join('\n');
  const dateLabel = new Date(`${fm.date}T12:00:00Z`).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(fm.title)} - Kol's Korner</title>
  <meta name="description" content="${esc(fm.summary)}" />
  ${isDraft ? '<meta name="robots" content="noindex,nofollow" />' : ''}
  <link rel="canonical" href="${SITE_URL}${urlPath}" />
  <meta property="og:title" content="${esc(fm.title)}" />
  <meta property="og:description" content="${esc(fm.summary)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${SITE_URL}${urlPath}" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/post-styles.css" />
  <style>
    .story-draft-banner{background:#7c2d12;color:#fff;padding:.75rem 1rem;font-weight:600;text-align:center}
    .story-cite a{text-decoration:none;font-size:.75em}
    .story-sources li{margin-bottom:.5rem;word-break:break-word}
    .story-meta{opacity:.8;font-size:.9rem}
  </style>
</head>
<body>
  ${isDraft ? '<div class="story-draft-banner" role="status">DRAFT: not approved, not published. Awaiting Kol\'s review.</div>' : ''}
  <div class="page-container">
  <main class="post-main" id="main-content">
    <article class="post story" data-status="${esc(fm.status)}" data-topic="${esc(fm.topic)}">
      <header class="post-header">
        <h1 class="post-title">${esc(fm.title)}</h1>
        <p class="story-meta">Story date ${esc(dateLabel)} · Topic: ${esc(fm.topic)} · Last checked ${esc(fm.last_checked)} · Status: ${esc(fm.status)}</p>
        <p class="post-summary">${esc(fm.summary)}</p>
      </header>
      <div class="post-content">
${body}
      </div>
    </article>
  </main>
  </div>
</body>
</html>
`;
}

const files = (await fs.readdir(STORIES_DIR).catch(() => [])).filter((f) => f.endsWith('.md')).sort();
let failed = 0;
const slugs = new Set();
for (const file of files) {
  const raw = await fs.readFile(path.join(STORIES_DIR, file), 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  if (!fm.status) fm.status = 'draft';
  const sections = splitSections(body);
  const { errors, sources } = validate(file, fm, sections);
  if (fm.slug && slugs.has(storyPath(fm))) errors.push('duplicate story path');
  if (fm.slug && fm.date) slugs.add(storyPath(fm));
  if (errors.length) {
    failed++;
    console.error(`[fail] ${file}\n  - ${errors.join('\n  - ')}`);
    continue;
  }
  console.log(`[ok] ${file} -> ${storyPath(fm)} (${fm.status}, ${sources.length} sources)`);
  const html = renderPage(fm, sections, sources);
  if (fm.status !== 'approved') {
    if (previewDir) {
      const out = path.join(previewDir, storyPath(fm));
      await fs.mkdir(out, { recursive: true });
      await fs.writeFile(path.join(out, 'index.html'), html, 'utf8');
    }
  } else if (writeSite) {
    const out = path.join(process.cwd(), 'site', storyPath(fm));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, 'index.html'), html, 'utf8');
  }
}
console.log(`\n${files.length} stories checked, ${failed} failed.`);
if (failed) process.exit(1);
