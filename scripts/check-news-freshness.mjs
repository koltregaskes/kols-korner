#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

function parseArgs(argv) {
  const args = { requiredDate: '' };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--required-date' && argv[i + 1]) {
      args.requiredDate = argv[++i];
    } else if (value.startsWith('--required-date=')) {
      args.requiredDate = value.slice('--required-date='.length);
    }
  }

  return args;
}

function parseIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getToday() {
  const override = process.env.CHECK_DATE || process.env.CURRENT_DATE;
  const date = override ? new Date(`${override}T12:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid CHECK_DATE/CURRENT_DATE: ${override}`);
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function getPreviousWorkday(today) {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() - 1);

  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return date;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const today = getToday();
  const requiredDate = args.requiredDate
    ? parseIsoDate(args.requiredDate)
    : getPreviousWorkday(today);
  if (!requiredDate) {
    throw new Error(`Invalid --required-date value: ${args.requiredDate}`);
  }
  const requiredDateKey = formatDate(requiredDate);
  const dataPath = path.join(repoRoot, 'site', 'data', 'news-articles.json');
  const payload = await readJson(dataPath);
  const articles = Array.isArray(payload.articles) ? payload.articles : [];

  if (articles.length === 0) {
    throw new Error('No generated news articles found in site/data/news-articles.json');
  }

  const latestDate = articles
    .map((article) => parseIsoDate(article.date))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  if (!latestDate) {
    throw new Error('No parseable news article dates found in generated payload');
  }

  const latestDateKey = formatDate(latestDate);
  if (latestDate < requiredDate) {
    throw new Error(`News freshness failed: latest generated article is ${latestDateKey}, but required date is ${requiredDateKey}`);
  }

  const requiredDigestFilename = `${requiredDateKey}-digest.md`;
  const requiredDateArticles = articles.filter(
    (article) => article.filename === requiredDigestFilename
  );
  if (requiredDateArticles.length === 0) {
    throw new Error(`News freshness failed: no generated articles found for ${requiredDigestFilename}`);
  }

  const contentPath = path.join(repoRoot, 'content', `daily-digest-${requiredDateKey}.md`);
  const digestPaths = [
    path.join(repoRoot, 'news-digests', `${requiredDateKey}-digest.md`),
    path.join(repoRoot, 'news-digests', `digest-${requiredDateKey}.md`)
  ];

  const missing = [];
  if (!(await pathExists(contentPath))) missing.push(path.relative(repoRoot, contentPath));
  const digestExists = (await Promise.all(digestPaths.map(pathExists))).some(Boolean);
  if (!digestExists) {
    missing.push(`news-digests/{${requiredDateKey}-digest.md,digest-${requiredDateKey}.md}`);
  }

  if (missing.length > 0) {
    throw new Error(`News freshness failed: missing required-date artefact(s): ${missing.join(', ')}`);
  }

  console.log(`News freshness OK: latest generated article ${latestDateKey}; required digest ${requiredDigestFilename} has ${requiredDateArticles.length} article(s); ${articles.length} generated articles total.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
