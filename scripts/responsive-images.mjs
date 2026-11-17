import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
export function responsiveImageTag(tag,relative,manifest){
 const match=tag.match(/\bsrc="([^"]+)"/i);if(!match)return tag;
 const url=new URL(match[1],`https://artifact.test/${relative}`);
 if(url.origin!=='https://artifact.test')return tag;
 const image=manifest.images.find(image=>'/'+image.source===url.pathname||image.variants.some(v=>'/'+v.path===url.pathname));
 if(!image)return tag;
 const fallback=image.variants.find(v=>v.width>=960)||image.variants.at(-1);
 const prefix=path.posix.relative(path.posix.dirname(relative),'')||'.';
 const href=p=>prefix+'/'+p;
 const clean=tag.replace(/\s+(?:srcset|sizes)="[^"]*"/gi,'');
 // Cover crops need more source pixels than the visible box width.
 return clean.replace(/\bsrc="[^"]+"/i,()=>`src="${href(fallback.path)}" srcset="${image.variants.map(v=>`${href(v.path)} ${v.width}w`).join(', ')}" sizes="(max-width: 600px) calc(200vw - 80px), (max-width: 980px) 120vw, 1280px"`);
}
export async function applyResponsiveImages(site='site'){
 const manifest=JSON.parse(await fs.readFile(path.join(site,'media/responsive/manifest.json'),'utf8'));
 for(const image of manifest.images){
  if(digest(await fs.readFile(path.join(site,image.source)))!==image.sha256)throw Error(`Responsive image source changed: ${image.source}; regenerate derivatives`);
  for(const variant of image.variants)if(digest(await fs.readFile(path.join(site,variant.path)))!==variant.sha256)throw Error(`Responsive derivative changed: ${variant.path}`);
 }
 let pages=0;
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);if(entry.isDirectory()){await walk(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  const relative=path.relative(site,file).replaceAll('\\','/'),before=await fs.readFile(file,'utf8');
  let after=before.replace(/<img\b[^>]*>/gi,tag=>responsiveImageTag(tag,relative,manifest));
  if(relative==='index.html')after=after.replace(/<img\b[^>]*>/i,tag=>tag.replace(/loading="lazy"/i,'loading="eager" fetchpriority="high"'));
  if(after!==before){await fs.writeFile(file,after);pages++;}
 }}
 await walk(site);return {pages,images:manifest.images.length};
}
