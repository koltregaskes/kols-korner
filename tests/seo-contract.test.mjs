import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
fs.mkdirSync('review-local',{recursive:true});
const root=fs.mkdtempSync(path.resolve('review-local/seo-contract-'));
fs.mkdirSync(path.join(root,'scripts'));
fs.copyFileSync('scripts/check-seo.py',path.join(root,'scripts/check-seo.py'));
fs.writeFileSync(path.join(root,'scripts/build.mjs'),'// fixture marker');
fs.copyFileSync('CNAME',path.join(root,'CNAME'));
fs.cpSync('site',path.join(root,'site'),{recursive:true,filter:p=>!/^\.env(?:\.|$)/.test(path.basename(p))});
function check(){const r=spawnSync(process.env.PYTHON_EXE || 'python',[path.join(root,'scripts/check-seo.py')],{cwd:root,encoding:'utf8',timeout:30000});assert.ok(!r.error,r.error?.message);return r;}
function mutate(file,change,pattern){const p=path.join(root,'site',file),original=fs.readFileSync(p);try{fs.writeFileSync(p,change(original));const r=check();assert.notEqual(r.status,0,'corruption passed SEO: '+file);assert.match(r.stdout+r.stderr,pattern);}finally{fs.writeFileSync(p,original)}}
test('built-output SEO baseline passes',()=>{const r=check();assert.equal(r.status,0,r.stdout+r.stderr)});
test('SEO rejects empty llms discovery content',()=>mutate('llms.txt',()=>'',/llms/i));
test('SEO rejects robots rules that block sitemap pages',()=>mutate('robots.txt',b=>b.toString()+'\nDisallow: /posts/\n',/robots|blocked/i));
test('SEO rejects corrupt PNG data even with an intact signature and dimensions',()=>mutate('media/social-default.png',b=>{const copy=Buffer.from(b);copy[45]^=1;return copy},/PNG|CRC/i));
test('SEO rejects duplicate structured-data identities',()=>mutate('index.html',b=>{const s=b.toString(),script=s.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/)[0];return s.replace('</head>',script+'</head>')},/duplicate|JSON-LD/i));
