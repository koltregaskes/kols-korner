import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {verifyRestore} from './rehearse-backup.mjs';
const manifestIndex = process.argv.indexOf('--manifest');
let paths;
if (manifestIndex >= 0) {
  const entries = JSON.parse(await fs.readFile(process.argv[manifestIndex + 1], 'utf8'));
  const digests = entries.filter(entry => /^site\/news-digests\/[^/]+$/.test(entry.name) && !entry.name.includes('..'));
  const result = await verifyRestore(process.cwd(), digests);
  if (result.mismatches.length) throw new Error('Restored digest bytes differ from committed manifest');
  paths = digests.map(entry => entry.name);
} else paths=execFileSync('git',['ls-files','-z','--','site/news-digests'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!paths.length)throw new Error('No committed digest downloads found; refusing an empty preservation check');
const missing=[];
for(const file of paths){try{const stat=await fs.stat(file);if(!stat.isFile()||!stat.size)missing.push(file)}catch{missing.push(file)}}
if(missing.length)throw new Error(`Build dropped ${missing.length} published digest downloads:\n${missing.join('\n')}`);
console.log(`Digest preservation passed: ${paths.length} committed downloads remain available`);
