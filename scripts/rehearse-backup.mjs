import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Explicit release inputs only. No .git, local instructions, credentials or env.
const inputs = ['content', 'news-digests', 'site', 'scripts', 'tests', '.github', 'launch', 'docs',
  'package.json', 'package-lock.json', 'site-config.json', 'CNAME',
  'opinions.txt', 'memories.txt', 'writing-style.txt', 'llms.txt'];
export function parseTree(buffer) {
  return buffer.toString('utf8').split('\0').filter(Boolean).map(line => {
    const [metadata, name] = line.split('\t');
    const [mode, type, oid] = metadata.split(' ');
    if (!name || type !== 'blob' || !['100644', '100755'].includes(mode) ||
        name.split('/').some(part => /^(?:\.env(?:\..*)?|\.git|\.aws|\.ssh)$/i.test(part)) ||
        /\.(?:pem|key|pfx|p12)$/i.test(name) || name.includes('..') || path.isAbsolute(name)) {
      throw new Error('Unsafe archive entry refused (metadata only; no file opened)');
    }
    return {name, oid};
  });
}
export async function verifyRestore(directory, entries, algorithm = 'sha1') {
  const mismatches = [];
  let bytes = 0;
  for (const {name, oid} of entries) {
    let body;
    try {
      const file = path.join(directory, name);
      if (!(await fs.lstat(file)).isFile()) throw new Error('Not a regular file');
      body = await fs.readFile(file);
    } catch { mismatches.push(name); continue; }
    const hash = createHash(algorithm).update(`blob ${body.length}\0`).update(body).digest('hex');
    bytes += body.length;
    if (hash !== oid) mismatches.push(name);
  }
  if (!entries.length) throw new Error('Empty restore cannot pass');
  return {files: entries.length, bytes, mismatches};
}
async function rehearse() {
  const git = args => execFileSync('git', args, {maxBuffer: 16 * 1024 * 1024});
  const head = git(['rev-parse', 'HEAD']).toString().trim();
  const entries = parseTree(git(['ls-tree', '-rz', head, '--', ...inputs]));
  if (!entries.length) throw new Error('Empty archive refused');
  await fs.mkdir('.local', {recursive: true});
  const destination = await fs.mkdtemp(path.resolve('.local/backup-rehearsal-'));
  const archive = path.join(destination, 'source.tar'), restored = path.join(destination, 'restored');
  await fs.mkdir(restored);
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(entries, null, 2));
  git(['archive', '--format=tar', `--output=${archive}`, head, '--', ...inputs]);
  execFileSync('tar', ['-xf', archive, '-C', restored]);
  const algorithm = git(['rev-parse', '--show-object-format']).toString().trim();
  const verification = await verifyRestore(restored, entries, algorithm);
  const receipt = {time: new Date().toISOString(), head, inputs, ...verification,
    archiveSha256: createHash('sha256').update(await fs.readFile(archive)).digest('hex'),
    scope: 'Retained local release snapshot and isolated extraction; not history, off-site backup, provider settings or production rollback'};
  await fs.writeFile(path.join(destination, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({destination, ...receipt}, null, 2));
  if (verification.mismatches.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await rehearse();
