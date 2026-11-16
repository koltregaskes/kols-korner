import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseTree, verifyRestore} from '../scripts/rehearse-backup.mjs';

test('archive metadata rejects env, keys, traversal and symlinks before reading contents', () => {
  for (const name of ['site/.env', 'scripts/.env.production', 'site/key.pem', '../outside'])
    assert.throws(() => parseTree(Buffer.from(`100644 blob abc\t${name}\0`)), /Unsafe/);
  assert.throws(() => parseTree(Buffer.from('120000 blob abc\tsite/link\0')), /Unsafe/);
  assert.deepEqual(parseTree(Buffer.from('100644 blob abc\tsite/index.html\0')), [{name:'site/index.html', oid:'abc'}]);
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
});
