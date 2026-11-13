import fs from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) {return (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]))).flat()}
const urls=new Set();
for(const file of await walk('site')) for(const m of (await fs.readFile(file,'utf8')).matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi)) {
 const url=new URL(m[1].replaceAll('&amp;','&')); if(url.hostname==='koltregaskes.com')continue; url.hash=''; urls.add(url.href);
}
const queue=[...urls]; let checked=0,failed=0,unknown=0;
await Promise.all(Array.from({length:8},async()=>{while(queue.length){const url=queue.shift(); try {
 const response=await fetch(url,{signal:AbortSignal.timeout(15000),redirect:'follow',headers:{'user-agent':'KolsKornerLinkCheck/1.0'}});
 await response.body?.cancel(); checked++;
 if(new URL(response.url).protocol!=='https:' && new URL(url).protocol==='https:')throw Error('unsafe HTTPS downgrade');
 if([404,410].includes(response.status)){failed++; console.log(`BROKEN ${response.status} ${new URL(url).origin}${new URL(url).pathname}`)}
 else if(!response.ok){unknown++;console.log(`UNVERIFIED HTTP ${response.status} ${new URL(url).hostname}`)}
 }catch{unknown++; console.log(`UNVERIFIED network/redirect ${new URL(url).hostname}`)} }}));
console.log(JSON.stringify({checked,broken:failed,unverified:unknown,total:urls.size}));
if(failed || unknown)process.exitCode=1;
