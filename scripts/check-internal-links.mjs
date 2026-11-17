import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const decode = value => String(value).replace(/&(?:amp|quot|apos|lt|gt);/g,x=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[x])).replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(all,code)=>{const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return Number.isInteger(n)&&n>=0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):all});
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),decode(m[2]??m[3]??m[4])]));
// A candidate URL ends at whitespace, not at an embedded comma (data URLs
// and ordinary URL paths may contain commas). Commas then delimit descriptors.
function srcsetUrls(value) {
 const urls=[];let position=0;
 while(position<value.length){
  while(position<value.length&&/[\s,]/.test(value[position]))position++;
  const start=position;
  while(position<value.length&&!/\s/.test(value[position]))position++;
  const url=value.slice(start,position);
  if(!url)break;
  urls.push(url.replace(/,+$/,''));
  if(url.endsWith(','))continue;
  let parentheses=0;
  while(position<value.length){
   const character=value[position++];
   if(character==='(')parentheses++;
   else if(character===')'&&parentheses)parentheses--;
   else if(character===','&&!parentheses)break;
  }
 }
 return urls;
}
export async function inspectSite(directory='site',origin='https://koltregaskes.com') {
 const root=path.resolve(directory),files=[],documents=new Map(),errors=[],checkedDownloads=new Set();
 const canonicalUrl=new URL(origin),canonicalHost=canonicalUrl.hostname;
 let maxRedirectHops=0;
 async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(/^\.env(?:\.|$)/.test(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name.endsWith('.html'))files.push(p)}}await walk(root);
 for(const file of files){const html=await fs.readFile(file,'utf8'),ids=new Set(),refs=[];let redirect=null;
  for(const match of html.replace(/<!--[\s\S]*?-->/g,'').replace(/(<(?:script|style)\b[^>]*>)[\s\S]*?<\/(?:script|style)>/gi,'$1</script>').matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)){const tag=match[1].toLowerCase(),a=attrs(match[0]);if(a.id)ids.add(a.id);if(tag==='a'&&a.name)ids.add(a.name);
   for(const key of ['href','src','poster','action'])if(a[key])refs.push({value:a[key],allowData:key==='src' && ['img','source','video','audio'].includes(tag)});
   if(a.srcset)for(const value of srcsetUrls(a.srcset))refs.push({value,allowData:['img','source'].includes(tag)});
   if(a['http-equiv']?.toLowerCase()==='refresh'){const m=a.content?.match(/^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*(.+?)\s*$/i);if(!m)errors.push(path.relative(root,file)+': invalid redirect');else redirect=m[1].replace(/^['"]|['"]$/g,'');}
  }documents.set(file,{ids,refs,redirect});
 }
 async function verifyNonEmptyFile(target){
  const targetStat=await fs.stat(target);
  if(!targetStat.isFile()||targetStat.size===0)throw Error('empty or invalid target');
  if(!target.endsWith('.html'))checkedDownloads.add(path.relative(root,target).replaceAll('\\','/'));
 }
 async function resolve(url,source,visited=new Set(),allowData=false){
  if(!['http:','https:'].includes(url.protocol)){if(['mailto:','tel:'].includes(url.protocol)||(allowData && /^data:(image|audio|video)\//i.test(url.href)))return null;throw Error('unsafe destination protocol '+url.protocol);}
  if(url.origin!==origin){
   if(url.hostname===canonicalHost||url.hostname==='www.'+canonicalHost||'www.'+url.hostname===canonicalHost)throw Error('non-canonical internal origin '+url.origin);
   return null;
  }
  if(visited.has(url.href))throw Error('redirect loop');if(visited.size>=8)throw Error('redirect chain exceeds eight hops');visited.add(url.href);
  if(visited.size>1)maxRedirectHops=Math.max(maxRedirectHops,visited.size-1);
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep))throw Error('target escapes site root');
  const stat=await fs.stat(file);const target=stat.isDirectory()?path.join(file,'index.html'):file;await verifyNonEmptyFile(target);
  const doc=documents.get(target);if(doc?.redirect){const next=new URL(doc.redirect,url);if(url.protocol==='https:'&&next.protocol!=='https:')throw Error('HTTPS redirect downgrade');return resolve(next,source,visited);}
  if(url.hash&&doc&&!doc.ids.has(decodeURIComponent(url.hash.slice(1))))throw Error('missing fragment '+decodeURIComponent(url.hash.slice(1)));
  return target;
 }
 for(const [file,doc] of documents){const source=path.relative(root,file).replaceAll('\\','/'),base=new URL(source,origin+'/');for(const ref of doc.refs){try{await resolve(new URL(ref.value,base),source,new Set(),ref.allowData)}catch(error){errors.push(source+': '+error.message)}}if(doc.redirect){try{const next=new URL(doc.redirect,base);if(next.protocol!=='https:')throw Error('unsafe redirect protocol');await resolve(next,source,new Set([base.href]));}catch(error){errors.push(source+': '+error.message)}}}
 for(const rel of ['feed.xml','sitemap.xml','robots.txt','llms.txt','.well-known/security.txt','data/news-articles.json','data/news-feed-latest.json']){
  const full=path.join(root,rel);
  try{await fs.stat(full);}catch{continue;}
  try{await verifyNonEmptyFile(full);if(rel.endsWith('.json'))JSON.parse(await fs.readFile(full,'utf8'));}
  catch(error){errors.push(rel+': '+error.message);}
 }
 const digestsManifest=path.join(root,'data/news-digests.json');
 try{
  await fs.stat(digestsManifest);
  try{
   const manifest=JSON.parse(await fs.readFile(digestsManifest,'utf8'));
   if(!Array.isArray(manifest.files))errors.push('data/news-digests.json: files must be an array');
   else{
    checkedDownloads.add('data/news-digests.json');
    const digestsRoot=path.resolve(root,'news-digests');
    for(const name of manifest.files){
     const target=path.resolve(digestsRoot,String(name));
     if(!target.startsWith(digestsRoot+path.sep)){errors.push('data/news-digests.json: invalid path '+name);continue;}
     try{await verifyNonEmptyFile(target);}catch(error){errors.push('news-digests/'+name+': '+error.message);}
    }
   }
  }catch(error){errors.push('data/news-digests.json: '+error.message);}
 }catch{}
 return {pages:files.length,downloadsChecked:checkedDownloads.size,maxRedirectHops,errors:[...new Set(errors)]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const report=await inspectSite();console.log(`Internal targets, downloads, fragments and redirects: ${report.pages} pages, ${report.downloadsChecked} downloads/manifests, max ${report.maxRedirectHops} redirect hops; ${report.errors.length} failures.`);if(report.errors.length){console.error(report.errors.slice(0,40).join('\n'));process.exitCode=1}}

export function repairTagMarkup(html, ids, base) {
 return html.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi,(whole,attributes,label)=>{
  const a=attrs(attributes);if(!a.href)return whole;
  let url;try{url=new URL(a.href,base)}catch{return whole}
  if(url.origin!==new URL(base).origin || !url.pathname.endsWith('/tags/') || !url.hash || ids.has(decodeURIComponent(url.hash.slice(1))))return whole;
  // A label without a real collection stays readable, never a dead jump.
  const kept=attributes.replace(/\s*\b(?:href|target|rel)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  return '<span'+kept+'>'+label+'</span>';
 });
}
export async function repairTagTargets(directory='site',origin='https://koltregaskes.com') {
 const root=path.resolve(directory),tags=await fs.readFile(path.join(root,'tags/index.html'),'utf8');
 const ids=new Set([...tags.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>decode(m[1])));
 async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(/^\.env(?:\.|$)/.test(e.name))continue;const file=path.join(dir,e.name);if(e.isDirectory())await walk(file);else if(e.name.endsWith('.html')){const html=await fs.readFile(file,'utf8'),fixed=repairTagMarkup(html,ids,new URL(path.relative(root,file).replaceAll('\\','/'),origin+'/'));if(fixed!==html)await fs.writeFile(file,fixed)}}}await walk(root);
}
