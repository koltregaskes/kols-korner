import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
async function walk(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
test('every built HTML response including redirects and 404 carries the meta mitigations',async()=>{
 const files=(await walk('site')).filter(f=>f.endsWith('.html'));
 assert.ok(files.some(f=>f.endsWith('404.html')));
 for(const file of files){const html=await fs.readFile(file,'utf8');assert.ok(/http-equiv="Content-Security-Policy"/i.test(html),file);assert.ok(/object-src 'none'/.test(html),file);assert.ok(/name="referrer" content="strict-origin-when-cross-origin"/.test(html),file);}
});
