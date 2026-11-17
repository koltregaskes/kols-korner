import test from 'node:test';
import assert from 'node:assert/strict';
import {checkExternalUrl} from '../scripts/check-external-links.mjs';
test('an HTTPS downgrade is unsafe rather than a passing or merely unverified destination',async()=>{
 const result=await checkExternalUrl('https://example.test/download',{fetchImpl:async()=>({status:200,ok:true,url:'http://example.test/download'})});
 assert.equal(result.status,'unsafe');
 const midDowngrade=await checkExternalUrl('https://example.test/start',{fetchImpl:async u=>u.endsWith('/start')?{status:302,headers:new Headers({location:'http://example.test/insecure'})}:{status:200,ok:true,url:'https://example.test/final'}});
 assert.equal(midDowngrade.status,'unsafe');
 assert.equal(midDowngrade.code,'https-downgrade');
});

import fs from 'node:fs/promises';
import path from 'node:path';
import {inspectSite,repairTagMarkup} from '../scripts/check-internal-links.mjs';

test('valid srcset data URLs retain embedded commas while local candidates are checked',async()=>{
 await fs.mkdir('review-local',{recursive:true});
 const root=await fs.mkdtemp(path.resolve('review-local/srcset-'));
 const image='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
 await fs.writeFile(path.join(root,'image.png'),'image fixture');
 await fs.writeFile(path.join(root,'index.html'),`<img srcset="${image} 1x, image.png 2x">`);
 assert.deepEqual((await inspectSite(root)).errors,[]);
 await fs.writeFile(path.join(root,'index.html'),`<img srcset="${image} 1x, missing.png 2x">`);
 assert.ok((await inspectSite(root)).errors.some(error=>error.includes('missing.png')));
});
test('missing tag destinations become labels; real targets and escaped text are preserved',()=>{
 const html='<a href="../tags/#missing" class="tag">&lt;safe&gt;</a><a href="../tags/#ai">AI</a>';
 assert.equal(repairTagMarkup(html,new Set(['ai']),'https://koltregaskes.com/posts/'),'<span class="tag">&lt;safe&gt;</span><a href="../tags/#ai">AI</a>');
});
test('static checks find missing anchors, unsafe redirects, empty downloads, non-canonical origins and cycles but ignore inline script templates',async()=>{
 await fs.mkdir('review-local',{recursive:true});const root=await fs.mkdtemp(path.resolve('review-local/link-fixture-'));
 await fs.writeFile(path.join(root,'index.html'),"<main id=\"main\"><a href=\"#missing\">Missing</a></main><script>const template=\"<a href=unresolved>\";</script>");
 const first=await inspectSite(root);assert.ok(first.errors.some(e=>e.includes('missing fragment missing')));
 await fs.writeFile(path.join(root,'index.html'),"<a href=\"#main\">Jump</a><main id=\"main\"></main><script>const template=\"<a href=unresolved>\";</script>");
 assert.deepEqual((await inspectSite(root)).errors,[]);
 await fs.writeFile(path.join(root,'empty.pdf'),'');
 await fs.writeFile(path.join(root,'index.html'),"<a href=\"empty.pdf\">Empty download</a><a href=\"http://koltregaskes.com/about/\">Downgrade</a>");
 const dlReport=await inspectSite(root);
 assert.ok(dlReport.errors.some(e=>e.includes('empty or invalid target')));
 assert.ok(dlReport.errors.some(e=>e.includes('non-canonical internal origin')));
 await fs.mkdir(path.join(root,'data'),{recursive:true});
 await fs.mkdir(path.join(root,'news-digests'),{recursive:true});
 await fs.writeFile(path.join(root,'data/news-digests.json'),JSON.stringify({files:['missing-digest.md']}));
 assert.ok((await inspectSite(root)).errors.some(e=>e.includes('news-digests/missing-digest.md')));
 await fs.rm(path.join(root,'data'),{recursive:true,force:true});
 await fs.writeFile(path.join(root,'index.html'),"<a href=\"#main\">Jump</a><main id=\"main\"></main>");
 await fs.writeFile(path.join(root,'a.html'),'<meta http-equiv="refresh" content="0; url=b.html">');
 await fs.writeFile(path.join(root,'b.html'),'<meta http-equiv="refresh" content="0; url=a.html">');
 assert.ok((await inspectSite(root)).errors.some(e=>e.includes('redirect loop')));
 await fs.writeFile(path.join(root,'b.html'),'<meta http-equiv="refresh" content="0; url=http://example.test/">');
 assert.ok((await inspectSite(root)).errors.some(e=>/unsafe redirect|downgrade/.test(e)));
});
