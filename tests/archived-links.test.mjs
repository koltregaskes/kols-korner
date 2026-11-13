import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {repairArchivedLinks} from '../scripts/repair-archived-links.mjs';
test('repair archived sources in HTML and runtime JSON while retaining unrelated links',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'kk-archive-test-'));
 const mapping=JSON.parse(await fs.readFile(new URL('../scripts/archived-link-replacements.json',import.meta.url),'utf8'));
 const [original,archived]=Object.entries(mapping)[0];
 await fs.writeFile(path.join(root,'index.html'),`<a href="${original}?utm_source=news">Original story title</a><a href="https://example.com/">Other</a>`);
 await fs.writeFile(path.join(root,'news.json'),JSON.stringify({url:original,title:'Original story title'}));
 await repairArchivedLinks(root);
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes(`href="${archived}"`));assert.ok(html.includes('Original story title'));assert.ok(html.includes('href="https://example.com/"'));
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'news.json'),'utf8')),{url:archived,title:'Original story title'});
});
