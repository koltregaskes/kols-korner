import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
// Missing-policy routes remain owned by #34; this checks declared policies.
test('declared CSP disallows unsafe-inline and required scripts are externalised',async()=>{
 let count=0,unsafe=[],inline=[];
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);
  else if(/\.html$/i.test(file)){
   count++;const html=await fs.readFile(file,'utf8');
   for(const meta of html.matchAll(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]*)"/gi)){
    const script=meta[1].split(';').find(x=>x.trim().startsWith('script-src '));
    if(script?.includes("'unsafe-inline'"))unsafe.push(file);
   }
   for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    if(!/\bsrc\s*=/i.test(script[1])&&!/\btype\s*=\s*["']application\/ld\+json["']/i.test(script[1])&&script[2].trim())inline.push(file);
  }
 }}
 await walk('site');assert.ok(count>300);assert.deepEqual(unsafe,[]);assert.deepEqual(inline,[]);
});

import {externalizeInlineScripts} from '../scripts/externalize-inline-scripts.mjs';
import os from 'node:os';
test('externalised scripts preserve order, attributes, JSON-LD and style policy',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'kk-inline-assets-'));
 await fs.mkdir(path.join(root,'nested'));
 const json='<script type="application/ld+json">{"name":"Preserved < data"}</script>';
 const policy='<meta http-equiv="Content-Security-Policy" content="script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\';">';
 await fs.writeFile(path.join(root,'nested','index.html'),policy+json+'<script id="first">globalThis.order=["first"];</script><script>globalThis.order.push("second");</script>');
 const result=await externalizeInlineScripts(root);
 assert.deepEqual(result,{pages:1,scripts:2});
 const html=await fs.readFile(path.join(root,'nested','index.html'),'utf8');
 assert.ok(html.includes(json));assert.ok(html.includes("script-src 'self'; style-src 'self' 'unsafe-inline'"));
 const tags=[...html.matchAll(/<script(?: id="first")? src="([^"]+)"><\/script>/g)];
 assert.equal(tags.length,2);assert.match(tags[0][1],/^\.\.\/assets\/page-scripts\//);
 const code=await Promise.all(tags.map(tag=>fs.readFile(path.resolve(root,'nested',tag[1]),'utf8')));
 assert.deepEqual(code,['globalThis.order=["first"];','globalThis.order.push("second");']);
 assert.deepEqual(await externalizeInlineScripts(root),{pages:0,scripts:0});
});
