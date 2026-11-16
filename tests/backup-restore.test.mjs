import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {parseTree, verifyRestore} from '../scripts/rehearse-backup.mjs';

test('archive metadata rejects env, keys, traversal and symlinks before reading contents', () => {
  for (const name of ['site/.env', 'scripts/.env.production', 'site/key.pem', '../outside'])
    assert.throws(() => parseTree(Buffer.from(`100644 blob abc\t${name}\0`)), /Unsafe/);
  assert.throws(() => parseTree(Buffer.from('120000 blob abc\tsite/link\0')), /Unsafe/);
  assert.deepEqual(parseTree(Buffer.from('100644 blob abc\tsite/index.html\0')), [{name:'site/index.html', oid:'abc'}]);
});
test('portable digest CLI passes exact bytes and fails corruption or empty manifests', async () => {
  await fs.mkdir('.local', {recursive:true});
  const root = await fs.mkdtemp(path.resolve('.local/digest-restore-test-'));
  await fs.mkdir(path.join(root, 'site/news-digests'), {recursive:true});
  const name = 'site/news-digests/example.md', body = Buffer.from('historical digest');
  const entries = [{name, oid:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')}];
  const manifest = path.join(root, 'manifest.json');
  await fs.writeFile(manifest, JSON.stringify(entries));
  await fs.writeFile(path.join(root, name), body);
  const cli = () => spawnSync(process.execPath, [path.resolve('scripts/check-digest-preservation.mjs'), '--manifest', manifest], {cwd:root, encoding:'utf8'});
  assert.equal(cli().status, 0);
  await fs.writeFile(path.join(root, name), 'damaged digest');
  assert.equal(cli().status, 1);
  await fs.writeFile(manifest, '[]');
  assert.equal(cli().status, 1);
});
test('restore verification catches corruption, missing files and empty manifests', async () => {
  await fs.mkdir('.local', {recursive:true});
  const root = await fs.mkdtemp(path.resolve('.local/restore-test-'));
  const body = Buffer.from('known-good');
  const entries = [{name:'example.txt', oid:createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')}];
  await fs.writeFile(path.join(root, 'example.txt'), body);
  assert.deepEqual((await verifyRestore(root, entries)).mismatches, []);
  await fs.writeFile(path.join(root, 'example.txt'), 'damaged fixture');
  assert.deepEqual((await verifyRestore(root, entries)).mismatches, ['example.txt']);
  assert.deepEqual((await verifyRestore(root, [{...entries[0], name:'missing'}])).mismatches, ['missing']);
  await assert.rejects(verifyRestore(root, []), /Empty/);
  await assert.rejects(verifyRestore(root, [{name:'../outside', oid:'abc'}]), /Unsafe/);
  await assert.rejects(verifyRestore(root, [{name:'.env', oid:'abc'}]), /Unsafe/);
});
