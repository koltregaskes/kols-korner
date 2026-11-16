import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

async function htmlFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? htmlFiles(path.join(root, entry.name))
    : entry.name.endsWith('.html') ? [path.join(root, entry.name)] : []))).flat();
}

test('all built documents declare British English, including preserved pages and redirects', async t => {
  const files = await htmlFiles('site');
  assert.ok(files.length > 0, 'no HTML documents checked');
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const tag = html.match(/<html\b[^>]*>/i)?.[0];
    assert.ok(tag, `${file}: missing html element`);
    assert.equal(tag.match(/\blang=["']([^"']+)["']/i)?.[1], 'en-GB',
      `${file}: document language must match the British English site`);
  }
  t.diagnostic(`${files.length} HTML documents checked`);
});
