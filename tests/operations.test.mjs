import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkOperations, REQUIRED_SECTIONS} from '../scripts/check-operations.mjs';

const root = path.resolve(import.meta.dirname, '..');
const markdown = await fs.readFile(path.join(root, 'launch/OPERATIONS.md'), 'utf8');

test('the real runbook and offline CLI pass with non-empty reference coverage', async () => {
  const report = await checkOperations(root);
  assert.deepEqual(report.errors, []);
  assert.ok(report.references > 10);
  const cli = spawnSync(process.execPath, ['scripts/check-operations.mjs'], {cwd: root, encoding: 'utf8'});
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /0 failures/);
});

test('a missing runbook fails explicitly, including the CLI exit status', async () => {
  assert.match((await checkOperations(path.join(root, 'launch'))).errors.join('\n'), /Missing or unreadable/);
  const cli = spawnSync(process.execPath, [path.join(root, 'scripts/check-operations.mjs')], {cwd: path.join(root, 'launch'), encoding: 'utf8'});
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /Missing or unreadable/);
});

test('every required section is enforced, and an example heading cannot replace it', async () => {
  for (const section of REQUIRED_SECTIONS) {
    const changed = markdown.replace(`## ${section}`, `### ${section}`) + `\n\n\x60\x60\x60text\n## ${section}\nExample only\n\x60\x60\x60\n`;
    assert.ok((await checkOperations(root, changed)).errors.includes(`Missing or empty section: ${section}`));
  }
  const empty = REQUIRED_SECTIONS.map(section => `## ${section}`).join('\n\n');
  assert.equal((await checkOperations(root, empty)).errors.length, REQUIRED_SECTIONS.length);
});

test('broken workflow, command script, directory and arbitrary local link fail', async () => {
  for (const reference of [
    '.github/workflows/missing-operations.yml',
    'gh workflow run missing-operations.yml --ref main',
    'scripts/missing-operations.mjs',
    'site/missing-operations/',
    '[missing](../missing-operations.txt)',
    '[escape](../../outside-operations.txt)',
  ]) {
    const report = await checkOperations(root, markdown + '\n' + reference);
    assert.ok(report.errors.some(error => /Missing repository reference|escapes the repo/.test(error)), reference);
  }
});

test('remote URLs, public routes, runtime receipts and same-page anchors are not repo inputs', async () => {
  const report = await checkOperations(root, markdown + '\n[remote](https://example.com/not-a-file) [section](#deployment-today) `/links/` `.local/new-receipt/artifact.tar`');
  assert.deepEqual(report.errors, []);
});
