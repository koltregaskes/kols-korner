import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const mappingPath=fileURLToPath(new URL('./archived-link-replacements.json',import.meta.url));
export async function repairArchivedLinks(root='site') {
 const replacements=JSON.parse(await fs.readFile(mappingPath,'utf8'));
 for(const [original,target] of Object.entries(replacements)) {
  const archived=new URL(target);
  const primaryHosts=new Set(['a16z.com','blog.google','ideogram.ai','ramp.com','finch-static.agibot.com','www.ycombinator.com','www.itiger.com']);
  if(new URL(original).hostname!=='www.digg.com' || archived.protocol!=='https:' || (!primaryHosts.has(archived.hostname) && (archived.hostname!=='web.archive.org' || !archived.pathname.includes(new URL(original).pathname)))) throw new Error('Invalid archived-source mapping');
 }
 const unavailable=JSON.parse(await fs.readFile(new URL('./unavailable-source-paths.json',import.meta.url),'utf8'));
 const dead=new Set(unavailable.paths.map(id=>'/ai/'+id));
 const isUnavailable=url=>{try{const u=new URL(url);return ['digg.com','www.digg.com'].includes(u.hostname)&&dead.has(u.pathname)}catch{return false}};
 function flagUnavailable(value){
  if(Array.isArray(value))return value.map(flagUnavailable);
  if(value && typeof value==='object'){
   const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,flagUnavailable(v)]));
   if(typeof result.url==='string'&&isUnavailable(result.url))result.sourceUnavailable=true;
   return result;
  }
  return value;
 }
 let repaired=0;
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){await walk(file);continue}
  if(!/\.(html|json)$/.test(entry.name))continue;
  const before=await fs.readFile(file,'utf8');
  let after=before.replace(/https?:\/\/www\.digg\.com\/ai\/[A-Za-z0-9-]+(?:\?[^"'<>\\\s]*)?/g,original=>{
   const key=original.split('?')[0]; const target=replacements[key]; if(!target)return original; repaired++; return target;
  });
  if(entry.name.endsWith('.html'))after=after.replace(/<a\b([^>]*\bhref=["'](https?:[^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi,(all,attrs,url,label)=>isUnavailable(url)?`<span class="source-unavailable">${label} <small>(source no longer available)</small></span>`:all);
  if(entry.name.endsWith('.json'))after=JSON.stringify(flagUnavailable(JSON.parse(after)),null,2)+'\n';
  if(after!==before)await fs.writeFile(file,after);
 }}
 await walk(root); console.log(`[ok] Repaired ${repaired} historic source links using exact archive snapshots or verified primary sources`);
}
