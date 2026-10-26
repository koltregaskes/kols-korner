import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertIsoDate,
  isAllowedSourcePath,
  londonToday,
  missingDigestMessage,
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

test('push errors do not keep credential material', () => {
  const scrubbed = scrubSecrets('https://x-access-token:secret-token@github.com/koltregaskes/kols-korner ghp_abcdefghijklmnopqrstuvwxyz0123456789');
  assert.equal(scrubbed.includes('secret-token'), false);
  assert.equal(scrubbed.includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), false);
  assert.match(scrubbed, /x-access-token:\[redacted\]/);
});
