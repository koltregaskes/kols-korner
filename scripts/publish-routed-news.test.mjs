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
  nothingToPublishMessage,
  publishDecision,
  publishRoutedDigest,
  readCommittedRoutedFeed,
  renderRoutedFeedDigest,
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
  assert.deepEqual(publishDecision({ publish: true, source: 'unchanged', deploy: false }), {
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

const routedFeedArticle = {
  title: 'Research agenda proposes seven open problems for multi-agent AI swarms',
  url: 'https://www.digg.com/ai/r76rcah4',
  source: 'Digg AI',
  tags: [
    'announcement',
    'model_release',
    'open_source',
    'ai_agents',
    'research_paper',
    'industry_move'
  ],
  matching_tags: [
    'announcement',
    'industry_move',
    'open_source',
    'model_release',
    'ai_agents'
  ],
  importance: 0.45,
  date: '2026-10-25T23:40:03.518Z',
  summary: 'A JinesisLab researcher says each problem is scored for its importance to AI alignment.',
  category: 'industry-media'
};

function absentDigestDate() {
  return '2099-12-31';
}

test('a missing or empty committed feed is nothing to publish', () => {
  const date = absentDigestDate();
  const missingPath = path.join(os.tmpdir(), 'kk-routed-feed-missing.json');
  const missing = readCommittedRoutedFeed(missingPath);
  assert.equal(missing.status, 'missing');
  assert.deepEqual(missing.articles, []);

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-empty-feed-'));
  const emptyPath = path.join(temp, 'news-feed-latest.json');
  fs.writeFileSync(emptyPath, JSON.stringify({
    generated: '2026-10-26T01:22:30.410Z',
    site: "Kol's Korner",
    article_count: 0,
    articles: [{ title: ' ', url: 'not-a-url' }]
  }));
  const empty = readCommittedRoutedFeed(emptyPath);
  assert.equal(empty.status, 'empty');

  const message = nothingToPublishMessage({ date, feedPath: emptyPath, reason: 'empty' });
  assert.match(message, /There was nothing to publish/);
  assert.match(message, /digest-2099-12-31\.md/);
  assert.match(message, /no articles/);
  assert.match(message, /No digest post was written/);

  const digest = path.join(repoRoot, 'news-digests', `${date}-digest.md`);
  const post = path.join(repoRoot, 'content', `daily-digest-${date}.md`);
  assert.equal(fs.existsSync(digest), false);
  const decision = publishRoutedDigest({
    date,
    publish: true,
    feedPath: missingPath
  });
  assert.equal(decision.nothing, true);
  assert.equal(decision.source, 'unchanged');
  assert.equal(decision.deploy, 'false');
  assert.match(decision.message, /nothing to publish/i);
  assert.equal(fs.existsSync(digest), false);
  assert.equal(fs.existsSync(post), false);

  const emptyDecision = publishRoutedDigest({
    date,
    publish: false,
    feedPath: emptyPath
  });
  assert.equal(emptyDecision.nothing, true);
  assert.equal(emptyDecision.deploy, 'false');
  assert.equal(fs.existsSync(digest), false);
  fs.rmSync(temp, { recursive: true, force: true });
});

test('an unreadable committed feed fails instead of publishing nothing', () => {
  const date = absentDigestDate();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-bad-feed-'));
  const feedPath = path.join(temp, 'news-feed-latest.json');
  const digest = path.join(repoRoot, 'news-digests', `${date}-digest.md`);
  fs.writeFileSync(feedPath, '{');

  try {
    assert.throws(() => readCommittedRoutedFeed(feedPath), /not valid JSON/);
    assert.throws(
      () => publishRoutedDigest({ date, publish: false, feedPath }),
      /not valid JSON/
    );
    fs.writeFileSync(feedPath, JSON.stringify({ generated: '2026-10-26T01:22:30.410Z' }));
    assert.throws(() => readCommittedRoutedFeed(feedPath), /no articles array/);
    assert.equal(fs.existsSync(digest), false);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('real routed-feed articles pass through the existing generator', () => {
  const date = '2099-11-30';
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kk-feed-render-'));
  const sourceDir = path.join(temp, 'news-digests');
  const outDir = path.join(temp, 'content');
  fs.mkdirSync(sourceDir);
  fs.mkdirSync(outDir);

  const feedPath = path.join(temp, 'news-feed-latest.json');
  fs.writeFileSync(feedPath, JSON.stringify({
    generated: '2026-10-26T01:22:30.410Z',
    site: "Kol's Korner",
    article_count: 1,
    articles: [routedFeedArticle, { title: 'Skipped', url: '' }]
  }));
  const feed = readCommittedRoutedFeed(feedPath);
  assert.equal(feed.status, 'ready');
  assert.equal(feed.articles.length, 1);
  assert.equal(feed.articles[0].title, routedFeedArticle.title);

  const rendered = renderRoutedFeedDigest({
    date,
    articles: feed.articles,
    generated: feed.generated
  });
  assert.match(rendered, /Research agenda proposes seven open problems for multi-agent AI swarms/);
  assert.match(rendered, /https:\/\/www\.digg\.com\/ai\/r76rcah4/);
  assert.match(rendered, /Digg AI/);
  assert.match(rendered, /JinesisLab researcher/);
  assert.equal(rendered.includes('No matching source items'), false);
  assert.equal(rendered.includes('No news digest available'), false);
  assert.equal(rendered.includes('Decoy headline'), false);
  fs.writeFileSync(path.join(sourceDir, `${date}-digest.md`), rendered);

  const result = spawnSync(process.execPath, [
    path.join(repoRoot, 'scripts', 'generate-daily-digest.mjs'),
    '--date',
    date,
    '--force'
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NEWS_SOURCE_PATH: sourceDir,
      CONTENT_OUTPUT_PATH: outDir
    }
  });

  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const post = fs.readFileSync(path.join(outDir, `daily-digest-${date}.md`), 'utf8');
    assert.match(post, /Research agenda proposes seven open problems for multi-agent AI swarms/);
    assert.match(post, /https:\/\/www\.digg\.com\/ai\/r76rcah4/);
    assert.match(post, /JinesisLab researcher/);
    assert.equal(post.includes('Decoy headline'), false);
    assert.equal(post.includes('No news digest available'), false);
    assert.equal(fs.existsSync(path.join(repoRoot, 'content', `daily-digest-${date}.md`)), false);
    assert.equal(fs.existsSync(path.join(repoRoot, 'news-digests', `${date}-digest.md`)), false);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
