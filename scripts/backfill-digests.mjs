#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(args) {
  const result = {
    from: null,
    to: null,
    force: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) {
      result.from = args[++i];
    } else if (args[i].startsWith('--from=')) {
      result.from = args[i].split('=')[1];
    } else if (args[i] === '--to' && args[i + 1]) {
      result.to = args[++i];
    } else if (args[i].startsWith('--to=')) {
      result.to = args[i].split('=')[1];
    } else if (args[i] === '--force') {
      result.force = true;
    }
  }

  return result;
}

function isWithinRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

async function getPendingDates(newsDir, contentDir, from, to) {
  const digestFiles = (await fs.readdir(newsDir))
    .map(name => /^(\d{4}-\d{2}-\d{2})-digest\.md$/.exec(name))
    .filter(Boolean)
    .map(match => match[1])
    .filter(date => isWithinRange(date, from, to))
    .sort();

  const contentFiles = new Set(
    (await fs.readdir(contentDir))
      .map(name => /^daily-digest-(\d{4}-\d{2}-\d{2})\.md$/.exec(name))
      .filter(Boolean)
      .map(match => match[1])
  );

  return digestFiles.filter(date => !contentFiles.has(date));
}

function runDigestGenerator(date, force) {
  const scriptPath = path.join(__dirname, 'generate-daily-digest.mjs');
  const args = [scriptPath, '--date', date];

  if (force) {
    args.push('--force');
  }

  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEWS_SOURCE_PATH: path.join(__dirname, '..', 'news-digests')
    }
  });

  if (result.status !== 0) {
    throw new Error(`Digest generation failed for ${date}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const newsDir = path.join(__dirname, '..', 'news-digests');
  const contentDir = path.join(__dirname, '..', 'content');
  const pendingDates = await getPendingDates(newsDir, contentDir, args.from, args.to);

  if (pendingDates.length === 0) {
    console.log('No missing digest posts found.');
    return;
  }

  console.log(`Backfilling ${pendingDates.length} digest posts...`);

  for (const date of pendingDates) {
    console.log(`\nGenerating post for ${date}`);
    runDigestGenerator(date, args.force);
  }

  console.log('\nBackfill complete.');
}

main().catch(err => {
  console.error('Error backfilling digests:', err);
  process.exit(1);
});
