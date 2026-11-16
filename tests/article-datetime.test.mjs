import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

test('built article dates are machine-readable and retain their publication date', async t => {
  const root = path.resolve('site/posts');
  const entries = await fs.readdir(root, { withFileTypes: true });
  let checked = 0;
  for (const entry of entries.filter(entry => entry.isDirectory())) {
    const file = path.join(root, entry.name, 'index.html');
    const html = await fs.readFile(file, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html)) continue;
    // Digest pages use a separate template without an article time element.
    if (!html.includes('class="post-date"')) continue;
    const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const article = scripts.map(match => JSON.parse(match[1])).find(value => value['@type'] === 'BlogPosting');
    assert.ok(article?.datePublished, `${file}: missing publication date`);
    const times = [...html.matchAll(/<time\b([^>]*\bclass="post-date"[^>]*)>([^<]*)<\/time>/g)];
    assert.equal(times.length, 1, `${file}: expected one article date`);
    const datetime = times[0][1].match(/\bdatetime="([^"]+)"/)?.[1];
    assert.ok(datetime, `${file}: missing datetime`);
    assert.equal(datetime, article.datePublished, `${file}: datetime differs from publication metadata`);
    const published = new Date(datetime);
    assert.ok(Number.isFinite(published.getTime()), `${file}: invalid datetime`);
    assert.equal(times[0][2], published.toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    }), `${file}: visible date differs from publication metadata`);
    checked += 1;
  }
  assert.ok(checked > 0, 'no built articles checked');
  t.diagnostic(`${checked} built articles checked against publication metadata and visible dates`);
});
