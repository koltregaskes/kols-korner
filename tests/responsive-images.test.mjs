import test from 'node:test';
import assert from 'node:assert/strict';
import {responsiveImageTag} from '../scripts/responsive-images.mjs';
import {applyResponsiveImages} from '../scripts/responsive-images.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const manifest={images:[{source:'media/hero.png',variants:[{path:'media/responsive/hero-480.webp',width:480},{path:'media/responsive/hero-960.webp',width:960}]}]};
test('responsive derivatives preserve alternatives and dimensions with route-relative URLs',()=>{
 const result=responsiveImageTag('<img src="../../media/hero.png" alt="A hero" width="2000" height="1000">','posts/story/index.html',manifest);
 assert.match(result,/src="..\/..\/media\/responsive\/hero-960.webp"/);assert.match(result,/hero-480.webp 480w/);assert.match(result,/alt="A hero" width="2000" height="1000"/);
 assert.equal(responsiveImageTag(result,'posts/story/index.html',manifest),result);
});
test('external and unlisted images are preserved',()=>{
 for(const tag of ['<img src="https://outside.test/media/hero.png">','<img src="media/small.png">'])assert.equal(responsiveImageTag(tag,'index.html',manifest),tag);
});
test('a changed original or derivative fails before rewriting HTML',async()=>{
 const root=await fs.mkdtemp('review-local/responsive-');await fs.mkdir(path.join(root,'media/responsive'),{recursive:true});
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const source=Buffer.from('original'),variant=Buffer.from('derivative');
 await fs.writeFile(path.join(root,'media/hero.png'),source);
 await fs.writeFile(path.join(root,'media/responsive/hero.webp'),variant);
 await fs.writeFile(path.join(root,'media/responsive/manifest.json'),JSON.stringify({images:[{source:'media/hero.png',sha256:hash(source),variants:[{path:'media/responsive/hero.webp',sha256:hash(variant)}]}]}));
 await fs.writeFile(path.join(root,'media/hero.png'),'changed');
 await assert.rejects(applyResponsiveImages(root),/source changed/);
 await fs.writeFile(path.join(root,'media/hero.png'),source);await fs.writeFile(path.join(root,'media/responsive/hero.webp'),'changed');
 await assert.rejects(applyResponsiveImages(root),/derivative changed/);
});
