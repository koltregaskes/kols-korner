import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const paths=execFileSync('git',['ls-files','-z','--','site/news-digests'],{encoding:'utf8'}).split('\0').filter(Boolean);
if(!paths.length)throw new Error('No committed digest downloads found; refusing an empty preservation check');
const missing=[];
for(const file of paths){try{const stat=await fs.stat(file);if(!stat.isFile()||!stat.size)missing.push(file)}catch{missing.push(file)}}
if(missing.length)throw new Error(`Build dropped ${missing.length} published digest downloads:\n${missing.join('\n')}`);
console.log(`Digest preservation passed: ${paths.length} committed downloads remain available`);
