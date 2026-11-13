import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const mappingPath=fileURLToPath(new URL('./archived-link-replacements.json',import.meta.url));
export async function repairArchivedLinks(root='site') {
 const replacements=JSON.parse(await fs.readFile(mappingPath,'utf8'));
 for(const [original,target] of Object.entries(replacements)) {
  const archived=new URL(target);
  if(new URL(original).hostname!=='www.digg.com' || archived.protocol!=='https:' || archived.hostname!=='web.archive.org' || !archived.pathname.includes(new URL(original).pathname)) throw new Error('Invalid archived-source mapping');
 }
 let repaired=0;
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){await walk(file);continue}
  if(!/\.(html|json)$/.test(entry.name))continue;
  const before=await fs.readFile(file,'utf8');
  const after=before.replace(/https?:\/\/www\.digg\.com\/ai\/[A-Za-z0-9-]+(?:\?[^"'<>\\\s]*)?/g,original=>{
   const key=original.split('?')[0]; const target=replacements[key]; if(!target)return original; repaired++; return target;
  });
  if(after!==before)await fs.writeFile(file,after);
 }}
 await walk(root); console.log(`[ok] Repaired ${repaired} historic source links using exact archive snapshots`);
}
