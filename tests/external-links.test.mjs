import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {checkExternalUrl,classifyDisposition,collectExternalUrls} from '../scripts/check-external-links.mjs';

test('only 404 and 410 are broken; blocked and throttled hosts remain unverified with explicit dispositions',async()=>{
 const expectedDispositions={200:'verified-http-ok',401:'blocked-auth-or-paywall',403:'blocked-bot-challenge',404:'broken-http-not-found',410:'broken-http-not-found',429:'rate-limited-upstream',500:'upstream-server-error'};
 for(const code of [200,401,403,404,410,429,500]){
  const result=await checkExternalUrl('https://example.com/',{fetchImpl:async()=>({status:code,ok:code===200,url:'https://example.com/'})});
  assert.equal(result.status,[404,410].includes(code)?'broken':code===200?'ok':'unverified');
  if(code!==200)assert.equal(result.disposition,expectedDispositions[code]);
  assert.equal(classifyDisposition(code),expectedDispositions[code]);
 }
});

test('archive transient failures retry once and then report real success',async()=>{
 let calls=0; const result=await checkExternalUrl('https://web.archive.org/',{retry:true,fetchImpl:async()=>({status:++calls===1?429:200,ok:calls===2,url:'https://web.archive.org/'})});assert.equal(calls,2);assert.equal(result.status,'ok');
});

test('external downloads must deliver nonempty bytes, not only a 200 response',async()=>{
 const empty=await checkExternalUrl('https://example.test/paper.pdf',{verifyDownload:true,fetchImpl:async()=>new Response('')});
 assert.equal(empty.status,'broken');assert.equal(empty.disposition,'broken-empty-download');
 const body=await checkExternalUrl('https://example.test/paper.pdf',{verifyDownload:true,fetchImpl:async()=>new Response('%PDF-example')});
 assert.equal(body.status,'ok');assert.equal(body.downloadBodyVerified,true);assert.equal(body.disposition,'verified-http-ok');
});

test('manual redirect chains count hops and reject loops or excessive hops',async()=>{
 const hopsMap=new Map([
  ['https://example.com/start',{status:301,headers:new Headers({location:'https://example.com/mid'})}],
  ['https://example.com/mid',{status:302,headers:new Headers({location:'/final.pdf'})}],
  ['https://example.com/final.pdf',{status:200,ok:true,url:'https://example.com/final.pdf'}]
 ]);
 const okResult=await checkExternalUrl('https://example.com/start',{fetchImpl:async u=>hopsMap.get(u)});
 assert.equal(okResult.status,'ok');
 assert.equal(okResult.hops,2);
 assert.equal(okResult.finalUrl,'https://example.com/final.pdf');

 const loopResult=await checkExternalUrl('https://example.com/a',{fetchImpl:async u=>({status:302,headers:new Headers({location:u.endsWith('/a')?'/b':'/a'})})});
 assert.equal(loopResult.status,'broken');
 assert.equal(loopResult.code,'redirect-loop');
 assert.equal(loopResult.disposition,'broken-redirect-loop');

 let hop=0;
 const capResult=await checkExternalUrl('https://example.com/0',{maxHops:3,fetchImpl:async()=>({status:302,headers:new Headers({location:`/hop-${++hop}`})})});
 assert.equal(capResult.status,'broken');
 assert.equal(capResult.code,'too-many-redirects');
 assert.equal(capResult.disposition,'broken-too-many-redirects');
});

test('collectExternalUrls scans HTML, non-preconnect links, news JSON, llms/security.txt, and flags downloads',async()=>{
 await fs.mkdir('review-local',{recursive:true});
 const root=await fs.mkdtemp(path.resolve('review-local/ext-collect-'));
 await fs.mkdir(path.join(root,'data'),{recursive:true});
 await fs.mkdir(path.join(root,'.well-known'),{recursive:true});
 await fs.writeFile(path.join(root,'index.html'),'<head><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://cdn.example.test/site.css"></head><body><a href="https://koltregaskes.com/posts/">Internal</a><a href="https://example.org/paper.pdf">Paper</a></body>');
 await fs.writeFile(path.join(root,'llms.txt'),'- Ref: https://docs.example.test/guide\n');
 await fs.writeFile(path.join(root,'.well-known/security.txt'),'Contact: https://x.com/koltregaskes\n');
 await fs.writeFile(path.join(root,'data/news-articles.json'),JSON.stringify({articles:[{url:'https://news.example.test/live'},{url:'https://dead.example.test/gone',sourceUnavailable:true}]}));
 const entries=await collectExternalUrls(root);
 const urls=new Map(entries.map(e=>[e.url,e]));
 assert.ok(!urls.has('https://fonts.googleapis.com/'));
 assert.ok(!urls.has('https://koltregaskes.com/posts/'));
 assert.ok(!urls.has('https://dead.example.test/gone'));
 assert.equal(urls.get('https://example.org/paper.pdf')?.download,true);
 assert.ok(urls.has('https://cdn.example.test/site.css'));
 assert.ok(urls.has('https://docs.example.test/guide'));
 assert.ok(urls.has('https://x.com/koltregaskes'));
 assert.ok(urls.has('https://news.example.test/live'));
});

test('external media collection checks both source and poster regardless of attribute order',async()=>{
 await fs.mkdir('review-local',{recursive:true});
 const root=await fs.mkdtemp(path.resolve('review-local/ext-media-'));
 await fs.writeFile(path.join(root,'index.html'),'<video src="https://media.example.test/first.mp4" poster="https://media.example.test/first.jpg"></video><video poster="https://media.example.test/second.jpg" src="https://media.example.test/second.mp4"></video>');
 const entries=await collectExternalUrls(root);
 assert.deepEqual(entries.map(entry=>entry.url).sort(),[
  'https://media.example.test/first.jpg','https://media.example.test/first.mp4',
  'https://media.example.test/second.jpg','https://media.example.test/second.mp4',
 ]);
 assert.equal(entries.filter(entry=>entry.download).length,2);
});
