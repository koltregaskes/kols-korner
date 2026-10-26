import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertIsoDate,
  generatorChildEnv,
  isAllowedSourcePath,
  londonToday,
  missingDigestMessage,
  normalisedNewsDigestsDir,
  publishDecision,
  repoRoot,
  scrubSecrets,
  statusPath
} from './publish-routed-news.mjs';

test('London calendar date follows Europe/London across the October clock change', () => {
  assert.equal(londonToday(new Date('2026-10-24T22:30:00Z')), '2026-10-24');
  assert.equal(londonToday(new Date('2026-10-24T23:30:00Z')), '2026-10-25');
});

test('rejects dates that are not real YYYY-MM-DD values', () => {
  assert.doesNotThrow(() => assertIsoDate('2026-10-25'));
  assert.throws(() => assertIsoDate('25-10-2026'), /YYYY-MM-DD/);
  assert.throws(() => assertIsoDate('2026-02-31'), /YYYY-MM-DD/);
});

test('missing routed digest names the classifier output', () => {
  const message = missingDigestMessage({
    date: '2026-10-25',
    sourceDir: '/repo/news-digests',
    candidates: [
      '/repo/news-digests/digest-2026-10-25.md',
      '/repo/news-digests/2026-10-25-digest.md'
    ]
  });

  assert.match(message, /Routed digest publish blocked for 2026-10-25/);
  assert.match(message, /Missing piece: the shared Rooms OS classifier output/);
  assert.match(message, /digest-2026-10-25\.md/);
  assert.match(message, /2026-10-25-digest\.md/);
  assert.match(message, /does not scrape/);
  assert.match(message, /pipelines\/news\/src\/cli\.mjs/);
});

test('source scope allows only the routed digest and its post', () => {
  assert.equal(isAllowedSourcePath('news-digests/2026-10-25-digest.md', '2026-10-25'), true);
  assert.equal(isAllowedSourcePath('content/daily-digest-2026-10-25.md', '2026-10-25'), true);
  assert.equal(isAllowedSourcePath('news-digests/digest-2026-10-25.md', '2026-10-25'), false);
  assert.equal(isAllowedSourcePath('content/welcome.md', '2026-10-25'), false);
  assert.equal(statusPath('R  news-digests/old.md -> news-digests/2026-10-25-digest.md'), 'news-digests/2026-10-25-digest.md');
  assert.equal(statusPath('?? content/daily-digest-2026-10-25.md'), 'content/daily-digest-2026-10-25.md');
});

test('a verified unchanged digest still deploys', () => {
  assert.deepEqual(publishDecision({ publish: true, source: 'unchanged' }), {
    source: 'unchanged',
    deploy: 'true'
  });
  assert.deepEqual(publishDecision({ publish: true, source: 'published' }), {
    source: 'published',
    deploy: 'true'
  });
  assert.deepEqual(publishDecision({ publish: false, source: 'unchanged' }), {
    source: 'unchanged',
    deploy: 'false'
  });
});

test('generator env stays pinned to the normalised news-digests directory', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-source-pin-'));
  const decoyDir = path.join(temp, 'decoy');
  const outDir = path.join(temp, 'content');
  fs.mkdirSync(decoyDir);
  fs.mkdirSync(outDir);
  fs.writeFileSync(
    path.join(decoyDir, '2026-10-24-digest.md'),
    [
      '## [Decoy headline](https://example.com/decoy)',
      '*Decoy* | 24/10/2026 | Score: 0.80',
      'Tags: product_launch',
      '',
      '> This decoy must not be published.',
      ''
    ].join('\n')
  );

  const env = generatorChildEnv({
    ...process.env,
    NEWS_SOURCE_PATH: decoyDir,
    CONTENT_OUTPUT_PATH: outDir
  });
  assert.equal(env.NEWS_SOURCE_PATH, normalisedNewsDigestsDir);

  const result = spawnSync(process.execPath, [
    path.join(repoRoot, 'scripts', 'generate-daily-digest.mjs'),
    '--date',
    '2026-10-24',
    '--force'
  ], { cwd: repoRoot, env, encoding: 'utf8' });

  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const post = fs.readFileSync(path.join(outDir, 'daily-digest-2026-10-24.md'), 'utf8');
    assert.equal(post.includes('Decoy headline'), false);
    assert.match(post, /Kimi K3\.1 Pro/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('push errors do not keep credential material', () => {
  const scrubbed = scrubSecrets('https://x-access-token:secret-token@github.com/koltregaskes/kols-korner ghp_abcdefghijklmnopqrstuvwxyz0123456789');
  assert.equal(scrubbed.includes('secret-token'), false);
  assert.equal(scrubbed.includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), false);
  assert.match(scrubbed, /x-access-token:\[redacted\]/);
});
