#!/usr/bin/env node
/**
 * Publish one existing routed digest.
 *
 * Cross-platform publisher used by `.github/workflows/publish-routed-digest.yml`.
 * `scripts/publish-routed-news.ps1` remains the Windows isolated helper.
 *
 * This does not collect news and does not invent articles. It normalises a
 * routed digest that is already on disk. When both digest filenames are
 * absent, it copies articles from the committed
 * `news-digests/news-feed-latest.json` into the tracked digest, then generates
 * the post from this repo's news-digests directory. With `--publish`, it
 * commits and pushes only that date's source files. A verified `--publish`
 * run still requests Pages deployment when those files are already on main.
 *
 * A missing feed file, or a feed with no usable articles, exits 0 and reports
 * that there was nothing to publish. No post is written. An unreadable feed
 * fails the run. This script does not fetch sources. A failed source fetch
 * still fails the feed-refresh job and leaves the committed feed unchanged.
 *
 * Usage:
 *   node scripts/publish-routed-news.mjs [--date YYYY-MM-DD] [--source-dir PATH] [--publish]
 *
 * Source directory: `--source-dir`, else `ROUTED_DIGEST_DIR`, else `news-digests/`.
 * Preferred filename: `digest-YYYY-MM-DD.md` (shared classifier, gitignored).
 * Fallback filename: `YYYY-MM-DD-digest.md` (tracked contract).
 * Feed fallback: `news-digests/news-feed-latest.json` in this repo.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, '..');

export function londonToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

export function assertIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Target date must use YYYY-MM-DD: ${value}`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Target date must use YYYY-MM-DD: ${value}`);
  }
}

export function digestCandidates(sourceDir, date) {
  return [
    path.join(sourceDir, `digest-${date}.md`),
    path.join(sourceDir, `${date}-digest.md`)
  ];
}

export function missingDigestMessage({ date, sourceDir, candidates }) {
  const resolved = candidates.map((file) => `- ${file}`).join('\n');
  return [
    `Routed digest publish blocked for ${date}.`,
    '',
    'Missing piece: the shared Rooms OS classifier output for this date.',
    'This job does not scrape and does not invent articles. It only publishes a routed digest that already exists.',
    '',
    `Looked in ${sourceDir} for:`,
    `- digest-${date}.md (classifier filename, gitignored as news-digests/digest-*.md)`,
    `- ${date}-digest.md (tracked publish contract)`,
    '',
    'Resolved paths:',
    resolved,
    '',
    'The classifier is not in this repository. scripts/fetch-news.mjs only starts W:/Websites/shared/website-tools/pipelines/news/src/cli.mjs, and that collector is not in git. GitHub Actions cannot see the Windows checkout where the ignored digest file is written.',
    '',
    `Until digest-${date}.md or ${date}-digest.md is in the checkout, this scheduled run fails on purpose so the missed day stays visible.`
  ].join('\n');
}

export function statusPath(line) {
  if (!line || line.length < 4) return '';

  let pathText = line.slice(3).trim();
  if (pathText.includes(' -> ')) {
    pathText = pathText.split(' -> ').at(-1);
  }

  return pathText.replaceAll('"', '').replaceAll('\\', '/');
}

export function isAllowedSourcePath(filePath, date) {
  return (
    filePath === `news-digests/${date}-digest.md` ||
    filePath === `content/daily-digest-${date}.md`
  );
}

export function scrubSecrets(text) {
  return String(text || '')
    .replace(/x-access-token:[^@\s]+/g, 'x-access-token:[redacted]')
    .replace(/ghp_[A-Za-z0-9]+/g, 'ghp_[redacted]')
    .replace(/github_pat_[A-Za-z0-9_]+/g, 'github_pat_[redacted]');
}

export const normalisedNewsDigestsDir = path.join(repoRoot, 'news-digests');

export function generatorChildEnv(baseEnv = {}) {
  return {
    ...baseEnv,
    NEWS_SOURCE_PATH: normalisedNewsDigestsDir
  };
}

export function publishDecision({ publish, source, deploy }) {
  if (deploy === undefined) {
    return {
      source,
      deploy: publish ? 'true' : 'false'
    };
  }

  const enabled = deploy === true || deploy === 'true';
  return {
    source,
    deploy: enabled ? 'true' : 'false'
  };
}

export function routedFeedPath(root = repoRoot) {
  return path.join(root, 'news-digests', 'news-feed-latest.json');
}

function cleanFeedText(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function digestTitle(value) {
  return cleanFeedText(value).replace(/\*/g, '').trim();
}

function digestUrl(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url) || /\s/.test(url)) return '';
  return url.replace(/\)/g, '%29');
}

function digestSource(article) {
  const source = cleanFeedText(article && article.source).replace(/[*[\]]/g, '').trim();
  if (source) return source;

  const url = digestUrl(article && article.url);
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function digestItemDate(article) {
  const raw = cleanFeedText(article && article.date).replace(/_/g, '');
  if (!raw || Number.isNaN(new Date(raw).getTime())) return '';
  return raw;
}

function digestCategory(article) {
  const value = cleanFeedText(article && article.category).replace(/#/g, '').trim();
  return value || 'Routed feed';
}

export function isUsableFeedArticle(article) {
  if (!article || typeof article !== 'object') return false;
  return Boolean(digestTitle(article.title) && digestSource(article) && digestUrl(article.url));
}

export function readCommittedRoutedFeed(feedPath) {
  if (!fs.existsSync(feedPath)) {
    return { status: 'missing', path: feedPath, articles: [], generated: '' };
  }

  let raw;
  try {
    raw = fs.readFileSync(feedPath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { status: 'missing', path: feedPath, articles: [], generated: '' };
    }
    throw new Error(`Routed feed ${feedPath} could not be read: ${error.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Routed feed ${feedPath} is not valid JSON: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.articles)) {
    throw new Error(
      `Routed feed ${feedPath} has no articles array. Refusing to treat an unreadable feed as nothing to publish.`
    );
  }

  const articles = data.articles.filter(isUsableFeedArticle);
  const generated = cleanFeedText(data.generated);
  if (articles.length === 0) {
    return { status: 'empty', path: feedPath, articles: [], generated };
  }

  return { status: 'ready', path: feedPath, articles, generated };
}

export function renderRoutedFeedDigest({ date, articles, generated }) {
  const groups = new Map();

  for (const article of articles) {
    if (!isUsableFeedArticle(article)) continue;
    const category = digestCategory(article);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({
      title: digestTitle(article.title),
      source: digestSource(article),
      url: digestUrl(article.url),
      summary: cleanFeedText(article.summary),
      date: digestItemDate(article)
    });
  }

  if (groups.size === 0) {
    throw new Error(`Refusing to write a digest for ${date} with no articles from the routed feed.`);
  }

  const lines = [
    `# Routed feed for ${date}`,
    '',
    'Articles below are copied from the committed file news-digests/news-feed-latest.json.',
    generated ? `Feed generated: ${cleanFeedText(generated)}` : 'Feed generated: not recorded',
    ''
  ];

  for (const [category, items] of groups) {
    lines.push(`## ${category}`, '');
    for (const item of items) {
      const stamp = item.date ? ` _${item.date}_` : '';
      lines.push(`- **${item.title}** ([${item.source}](${item.url}))${stamp}`);
      if (item.summary) lines.push(`  ${item.summary}`);
      lines.push('');
    }
  }

  return `${lines.join('\n').trim()}\n`;
}

export function nothingToPublishMessage({ date, feedPath, reason }) {
  const feedDetail = reason === 'empty'
    ? `The committed routed feed has no articles: ${feedPath}`
    : `The committed routed feed is not in the checkout: ${feedPath}`;

  return [
    `There was nothing to publish for ${date}.`,
    '',
    `The Mini PC classifier file news-digests/digest-${date}.md is absent, and news-digests/${date}-digest.md is absent too.`,
    feedDetail,
    'No digest post was written.',
    'This job does not fetch sources. A failed source fetch still fails the feed refresh job and leaves the committed feed unchanged.'
  ].join('\n');
}

function parseArgs(argv) {
  const args = {
    date: '',
    sourceDir: process.env.ROUTED_DIGEST_DIR || '',
    publish: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--help' || value === '-h') args.help = true;
    else if (value === '--publish') args.publish = true;
    else if (value === '--date' && argv[i + 1]) args.date = argv[++i];
    else if (value.startsWith('--date=')) args.date = value.slice('--date='.length);
    else if (value === '--source-dir' && argv[i + 1]) args.sourceDir = argv[++i];
    else if (value.startsWith('--source-dir=')) args.sourceDir = value.slice('--source-dir='.length);
    else throw new Error(`Unknown argument: ${value}`);
  }

  if (!args.date) args.date = londonToday();
  return args;
}

function printHelp() {
  console.log(`Publish one existing routed digest.

Usage:
  node scripts/publish-routed-news.mjs [--date YYYY-MM-DD] [--source-dir PATH] [--publish]

Without --publish the run validates and leaves main untouched.
`);
}

function reportBlocker(message) {
  const text = scrubSecrets(message).trim();
  process.stderr.write(`${text}\n`);

  if (process.env.GITHUB_ACTIONS === 'true') {
    const oneLine = text.replace(/[%\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    process.stderr.write(`::error title=Routed digest publish blocked::${oneLine}\n`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Routed digest publish blocked\n\n\`\`\`text\n${text}\n\`\`\`\n`
    );
  }
}

function reportNothingToPublish(message) {
  const text = scrubSecrets(message).trim();
  console.log(text);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Nothing to publish\n\nThere was nothing to publish.\n\n\`\`\`text\n${text}\n\`\`\`\n`
    );
  }
}

function git(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.error) {
    throw new Error(`git ${args[0]} failed to start: ${result.error.message}`);
  }

  if (!allowFailure && result.status !== 0) {
    const detail = scrubSecrets(`${result.stderr || ''}${result.stdout || ''}`).trim();
    throw new Error(`git ${args.join(' ')} failed with exit code ${result.status}${detail ? `: ${detail}` : ''}`);
  }

  return result;
}

function runNode(scriptName, args, label, env = process.env) {
  const scriptPath = path.join(repoRoot, 'scripts', scriptName);
  console.log(`>> node scripts/${scriptName} ${args.join(' ')}`);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    env
  });

  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function writeGitHubOutput(decision) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `source=${decision.source}\ndeploy=${decision.deploy}\n`
  );
}

function assertCleanWorktree() {
  const status = git(['status', '--porcelain=v1']).stdout.trim();
  if (status) {
    throw new Error(`Refusing to publish from a dirty worktree.\n${status}`);
  }
}

function assertPublishBase() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    if (process.env.GITHUB_REF !== 'refs/heads/main') {
      throw new Error(`Refusing to publish from ${process.env.GITHUB_REF || 'an unknown ref'}. The schedule runs on main.`);
    }
    return;
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
  if (branch !== 'main') {
    throw new Error(`Refusing to publish from branch ${branch}. Check out main first.`);
  }
}

function ensureGitIdentity() {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  git(['config', '--local', 'user.name', 'github-actions[bot]']);
  git(['config', '--local', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
}

function trackedDigestPath(date) {
  return path.join(repoRoot, 'news-digests', `${date}-digest.md`);
}

function normaliseDigest(found, date) {
  const destination = trackedDigestPath(date);
  if (path.resolve(found) === path.resolve(destination)) return destination;

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(found, destination);
  console.log(`Normalised ${found} -> ${destination}`);
  return destination;
}

function sourceStatusLines(date) {
  const lines = git(['status', '--porcelain=v1']).stdout.split('\n').filter(Boolean);
  return lines.filter((line) => {
    const filePath = statusPath(line);
    return filePath && !filePath.startsWith('site/');
  });
}

function assertSourceScope(lines, date) {
  const unexpected = lines
    .map((line) => statusPath(line))
    .filter((filePath) => filePath && !isAllowedSourcePath(filePath, date));

  if (unexpected.length > 0) {
    throw new Error(`Publisher produced out-of-scope path changes: ${unexpected.join(', ')}`);
  }
}

function commitAndPush(date) {
  const digestPath = `news-digests/${date}-digest.md`;
  const postPath = `content/daily-digest-${date}.md`;
  git(['add', '--all', '--', digestPath, postPath]);

  const staged = spawnSync('git', ['diff', '--cached', '--quiet', '--'], { cwd: repoRoot });
  if (staged.status === 0) return 'unchanged';
  if (staged.status !== 1) {
    throw new Error(`git diff --cached failed with exit code ${staged.status}`);
  }

  ensureGitIdentity();
  git([
    '-c', 'commit.gpgsign=false',
    'commit',
    '--no-verify',
    '-m',
    `chore: publish routed news for ${date}`
  ]);

  const push = spawnSync('git', ['push', 'origin', 'HEAD:main'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (push.stdout) process.stdout.write(scrubSecrets(push.stdout));
  if (push.stderr) process.stderr.write(scrubSecrets(push.stderr));
  if (push.status !== 0) {
    const detail = scrubSecrets(`${push.stderr || ''}\n${push.stdout || ''}`).trim();
    throw new Error(
      [
        `git push to main failed with exit code ${push.status}.`,
        detail,
        'If this is a permission or ruleset refusal, the missing piece is a credential allowed to push to main. This workflow uses the built-in GITHUB_TOKEN with contents: write.'
      ].filter(Boolean).join('\n')
    );
  }

  const head = git(['rev-parse', 'HEAD']).stdout.trim();
  const remoteLine = git(['ls-remote', 'origin', 'refs/heads/main']).stdout.trim();
  const remoteCommit = remoteLine.split(/\s+/)[0];
  if (remoteCommit !== head) {
    throw new Error(`Remote main readback mismatch: expected ${head}, found ${remoteCommit || 'nothing'}`);
  }

  console.log(`Pushed routed news for ${date} at commit ${head}.`);
  return 'published';
}

function publishTrackedDigest({ date, publish }) {
  runNode(
    'generate-daily-digest.mjs',
    ['--date', date, '--force'],
    'digest generation',
    generatorChildEnv(process.env)
  );
  runNode('build.mjs', [], 'site build');
  runNode('check-news-freshness.mjs', ['--required-date', date], 'target-date freshness verification');

  const lines = sourceStatusLines(date);
  let source = 'unchanged';
  if (lines.length === 0) {
    console.log(`No source changes for ${date}.`);
  } else {
    assertSourceScope(lines, date);
    console.log('Verified source change scope:');
    for (const line of lines) console.log(`  ${line}`);

    if (publish) {
      source = commitAndPush(date);
    } else {
      console.log('Validation-only run complete. Nothing was committed or pushed.');
    }
  }

  const decision = publishDecision({ publish, source });
  if (decision.deploy === 'true' && source === 'unchanged') {
    console.log('Verified digest is unchanged. Pages deployment is tracked separately and will continue.');
  }
  return decision;
}

export function publishRoutedDigest({ date, sourceDir, publish, feedPath }) {
  assertIsoDate(date);

  const resolvedSourceDir = path.resolve(sourceDir || path.join(repoRoot, 'news-digests'));
  if (!fs.existsSync(resolvedSourceDir) || !fs.statSync(resolvedSourceDir).isDirectory()) {
    throw new Error(
      [
        'Routed digest publish blocked.',
        '',
        `Missing piece: source digest directory does not exist: ${resolvedSourceDir}`,
        'Set ROUTED_DIGEST_DIR, or pass --source-dir, to the directory that contains the routed digest.'
      ].join('\n')
    );
  }

  const candidates = digestCandidates(resolvedSourceDir, date);
  const found = candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
  if (!found) {
    const resolvedFeedPath = feedPath || routedFeedPath();
    const feed = readCommittedRoutedFeed(resolvedFeedPath);
    if (feed.status === 'missing' || feed.status === 'empty') {
      return {
        ...publishDecision({ publish, source: 'unchanged', deploy: false }),
        nothing: true,
        message: nothingToPublishMessage({
          date,
          feedPath: feed.path,
          reason: feed.status
        })
      };
    }

    assertCleanWorktree();
    if (publish) assertPublishBase();

    const markdown = renderRoutedFeedDigest({
      date,
      articles: feed.articles,
      generated: feed.generated
    });
    const destination = trackedDigestPath(date);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, markdown);
    console.log(`Built ${path.relative(repoRoot, destination)} from ${feed.path} (${feed.articles.length} articles).`);
    return publishTrackedDigest({ date, publish });
  }

  assertCleanWorktree();
  if (publish) assertPublishBase();

  console.log(`Routed digest: ${found}`);
  normaliseDigest(found, date);
  return publishTrackedDigest({ date, publish });
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    reportBlocker(error.message || String(error));
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  try {
    const decision = publishRoutedDigest(args);
    writeGitHubOutput(decision);
    if (decision.nothing) {
      reportNothingToPublish(decision.message);
      return;
    }
    if (decision.source === 'published') {
      console.log(`Published routed digest for ${args.date}.`);
    }
  } catch (error) {
    reportBlocker(error.message || String(error));
    process.exit(1);
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  main();
}
