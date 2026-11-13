import test from 'node:test';
import assert from 'node:assert/strict';
import {checkExternalUrl} from '../scripts/check-external-links.mjs';
test('an HTTPS downgrade is unsafe rather than a passing or merely unverified destination',async()=>{
 const result=await checkExternalUrl('https://example.test/download',{fetchImpl:async()=>({status:200,ok:true,url:'http://example.test/download'})});
 assert.equal(result.status,'unsafe');
});

import fs from 'node:fs/promises';
import path from 'node:path';
import {inspectSite,repairTagMarkup} from '../scripts/check-internal-links.mjs';
test('missing tag destinations become labels; real targets and escaped text are preserved',()=>{
 const html='<a href="../tags/#missing" class="tag">&lt;safe&gt;</a><a href="../tags/#ai">AI</a>';
 assert.equal(repairTagMarkup(html,new Set(['ai']),'https://koltregaskes.com/posts/'),'<span class="tag">&lt;safe&gt;</span><a href="../tags/#ai">AI</a>');
});
test('static checks find missing anchors, unsafe redirects and cycles but ignore inline script templates',async()=>{
 await fs.mkdir('review-local',{recursive:true});const root=await fs.mkdtemp(path.resolve('review-local/link-fixture-'));
 await fs.writeFile(path.join(root,'index.html'),"<main id=\"main\"><a href=\"#missing\">Missing</a></main><script>const template=\"<a href=unresolved>\";</script>");
 const first=await inspectSite(root);assert.ok(first.errors.some(e=>e.includes('missing fragment missing')));
 await fs.writeFile(path.join(root,'index.html'),"<a href=\"#main\">Jump</a><main id=\"main\"></main><script>const template=\"<a href=unresolved>\";</script>");
 assert.deepEqual((await inspectSite(root)).errors,[]);
 await fs.writeFile(path.join(root,'a.html'),'<meta http-equiv="refresh" content="0; url=b.html">');
 await fs.writeFile(path.join(root,'b.html'),'<meta http-equiv="refresh" content="0; url=a.html">');
 assert.ok((await inspectSite(root)).errors.some(e=>e.includes('redirect loop')));
 await fs.writeFile(path.join(root,'b.html'),'<meta http-equiv="refresh" content="0; url=http://example.test/">');
 assert.ok((await inspectSite(root)).errors.some(e=>/unsafe redirect|downgrade/.test(e)));
});
