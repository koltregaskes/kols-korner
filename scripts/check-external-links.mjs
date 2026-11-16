import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const REDIRECT_STATUSES=new Set([301,302,303,307,308]);
const DOWNLOAD_EXT_RE=/\.(?:pdf|zip|md|mp3|mp4|xml|json|txt)(?:$|\?)/i;

export function classifyDisposition(code) {
 if(typeof code==='number'&&code>=200&&code<300)return 'verified-http-ok';
 if(code===401)return 'blocked-auth-or-paywall';
 if(code===403)return 'blocked-bot-challenge';
 if(code===429)return 'rate-limited-upstream';
 if([500,502,503,504].includes(code))return 'upstream-server-error';
 if(code==='deadline')return 'crawl-deadline-unverified';
 if(code==='network/redirect')return 'network-timeout-or-tls-unverified';
 if(code==='missing-redirect-location')return 'redirect-without-location';
 if(code==='https-downgrade')return 'unsafe-https-downgrade';
 if(code===404||code===410)return 'broken-http-not-found';
 if(code==='too-many-redirects')return 'broken-too-many-redirects';
 if(code==='redirect-loop')return 'broken-redirect-loop';
 return `unverified-http-${code}`;
}

export async function checkExternalUrl(url,{fetchImpl=fetch,retry=false,deadline=Date.now()+20000,maxHops=8}={}) {
 for(let attempt=0;attempt<(retry?2:1);attempt++) {
  let current=url,hops=0;
  const visited=new Set([current]),chain=[current];
  try {
   while(true) {
    const remaining=deadline-Date.now();
    if(remaining<=0)return {status:'unverified',code:'deadline',disposition:classifyDisposition('deadline'),hops,finalUrl:current,chain};
    const response=await fetchImpl(current,{signal:AbortSignal.timeout(Math.max(1,Math.min(6000,remaining))),redirect:'manual',headers:{'user-agent':'KolsKornerLinkCheck/1.0'}});
    await response.body?.cancel();
    if(REDIRECT_STATUSES.has(response.status)) {
     const location=response.headers?.get?.('location');
     if(!location)return {status:'unverified',code:'missing-redirect-location',disposition:classifyDisposition('missing-redirect-location'),hops,finalUrl:current,chain};
     const next=new URL(location,current);
     chain.push(next.href);
     if(new URL(current).protocol==='https:'&&next.protocol!=='https:')return {status:'unsafe',code:'https-downgrade',disposition:classifyDisposition('https-downgrade'),hops:hops+1,finalUrl:next.href,chain};
     hops++;
     if(hops>maxHops)return {status:'broken',code:'too-many-redirects',disposition:classifyDisposition('too-many-redirects'),hops,finalUrl:next.href,chain};
     if(visited.has(next.href))return {status:'broken',code:'redirect-loop',disposition:classifyDisposition('redirect-loop'),hops,finalUrl:next.href,chain};
     visited.add(next.href);
     current=next.href;
     continue;
    }
    const resolvedUrl=response.url||current;
    if(new URL(current).protocol==='https:'&&new URL(resolvedUrl).protocol!=='https:')return {status:'unsafe',code:'https-downgrade',disposition:classifyDisposition('https-downgrade'),hops,finalUrl:resolvedUrl,chain};
    if([404,410].includes(response.status))return {status:'broken',code:response.status,disposition:classifyDisposition(response.status),hops,finalUrl:resolvedUrl,chain};
    if(response.ok)return {status:'ok',code:response.status,hops,finalUrl:resolvedUrl,chain};
    if(attempt===0&&retry&&[429,500,502,503,504].includes(response.status)&&Date.now()<deadline)break;
    return {status:'unverified',code:response.status,disposition:classifyDisposition(response.status),hops,finalUrl:resolvedUrl,chain};
   }
  } catch {
   if(attempt===0&&retry&&Date.now()<deadline)continue;
   return {status:'unverified',code:'network/redirect',disposition:classifyDisposition('network/redirect'),hops,finalUrl:current,chain};
  }
 }
}

async function walk(dir){return (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]))).flat()}

export async function collectExternalUrls(directory='site',{includeJson=true}={}) {
 const root=path.resolve(directory),urls=new Map();
 const add=(raw,source)=>{
  let parsed;
  try{parsed=new URL(String(raw).replaceAll('&amp;','&'));}catch{return;}
  if(!['http:','https:'].includes(parsed.protocol))return;
  if(parsed.hostname==='koltregaskes.com'||parsed.hostname==='www.koltregaskes.com')return;
  parsed.hash='';
  if(!urls.has(parsed.href))urls.set(parsed.href,{url:parsed.href,sources:new Set(),download:DOWNLOAD_EXT_RE.test(parsed.pathname)});
  urls.get(parsed.href).sources.add(source);
 };
 for(const file of await walk(root)) {
  const html=await fs.readFile(file,'utf8');
  for(const m of html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi))add(m[1],'html-a');
  for(const m of html.matchAll(/<link\b([^>]*)>/gi)) {
   const attrs=m[1],rel=(attrs.match(/\brel=["']([^"']+)["']/i)?.[1]||'').toLowerCase().split(/\s+/);
   if(rel.some(r=>r==='preconnect'||r==='dns-prefetch'))continue;
   const href=attrs.match(/\bhref=["'](https?:\/\/[^"']+)["']/i)?.[1];
   if(href)add(href,'html-link');
  }
  for(const m of html.matchAll(/<(?:img|script|video|audio|source)\b[^>]*\b(?:src|poster)=["'](https?:\/\/[^"']+)["']/gi))add(m[1],'html-media');
 }
 for(const rel of ['llms.txt','.well-known/security.txt']) {
  try {
   const txt=await fs.readFile(path.join(root,rel),'utf8');
   for(const m of txt.matchAll(/https?:\/\/[^\s)<>"]+/g))add(m[0],rel);
  } catch {}
 }
 if(includeJson) {
  for(const rel of ['data/news-articles.json','data/news-feed-latest.json']) {
   try {
    const parsed=JSON.parse(await fs.readFile(path.join(root,rel),'utf8'));
    for(const item of (parsed.articles||[]))if(item?.url&&!item.sourceUnavailable)add(item.url,rel);
   } catch {}
  }
 }
 return [...urls.values()].map(entry=>({url:entry.url,sources:[...entry.sources].sort(),download:entry.download})).sort((a,b)=>a.url.localeCompare(b.url));
}

async function main(){
 const args=process.argv.slice(2),reportIdx=args.indexOf('--report'),reportPath=reportIdx>=0?args[reportIdx+1]:null;
 const includeJson=!args.includes('--html-only');
 const entries=await collectExternalUrls('site',{includeJson});
 const archive=entries.filter(e=>new URL(e.url).hostname==='web.archive.org');
 const other=entries.filter(e=>new URL(e.url).hostname!=='web.archive.org');
 const deadline=Date.now()+250000;let checked=0,ok=0,failed=0,unsafe=0,unknown=0,redirected=0,maxHops=0;
 const hosts=new Map(),results=[];
 function recordUnverified(entry,code,disposition,hops=0,finalUrl=entry.url){
  unknown++;
  const host=new URL(entry.url).hostname,key=`${host}|${code}|${disposition}`;
  if(!hosts.has(key))hosts.set(key,{host,code,disposition,count:0,sampleUrl:entry.url,sources:new Set()});
  const rec=hosts.get(key);rec.count++;entry.sources.forEach(s=>rec.sources.add(s));
  console.log(`UNVERIFIED ${code} [${disposition}] ${host}`);
 }
 async function workers(queue,count,retry){
  await Promise.all(Array.from({length:count},async()=>{
   while(queue.length){
    const entry=queue.shift();
    if(Date.now()>=deadline){
     const disposition=classifyDisposition('deadline');
     recordUnverified(entry,'deadline',disposition);
     results.push({...entry,status:'unverified',code:'deadline',disposition,hops:0,finalUrl:entry.url});
     continue;
    }
    const result=await checkExternalUrl(entry.url,{retry,deadline});
    checked++;
    if(result.hops>0)redirected++;
    if(result.hops>maxHops)maxHops=result.hops;
    results.push({...entry,...result});
    if(result.status==='ok')ok++;
    else if(result.status==='unsafe'){unsafe++;console.log(`UNSAFE ${result.code} [${result.disposition}] ${new URL(entry.url).origin}${new URL(entry.url).pathname}`);}
    else if(result.status==='broken'){failed++;console.log(`BROKEN ${result.code} [${result.disposition}] ${new URL(entry.url).origin}${new URL(entry.url).pathname}`);}
    else if(result.status==='unverified')recordUnverified(entry,result.code,result.disposition,result.hops,result.finalUrl);
   }
  }));
 }
 await Promise.all([workers(archive,3,true),workers(other,10,false)]);
 const dispositions=[...hosts.values()].map(d=>({...d,sources:[...d.sources].sort()})).sort((a,b)=>b.count-a.count||a.host.localeCompare(b.host));
 const summary={checked,ok,broken:failed,unsafe,unverified:unknown,redirected,maxHops,downloads:entries.filter(e=>e.download).length,total:entries.length};
 console.log(JSON.stringify(summary));
 if(reportPath) {
  await fs.mkdir(path.dirname(reportPath),{recursive:true});
  await fs.writeFile(reportPath,JSON.stringify({generatedAt:new Date().toISOString(),summary,dispositions,brokenItems:results.filter(r=>r.status==='broken'),unsafeItems:results.filter(r=>r.status==='unsafe'),unverifiedItems:results.filter(r=>r.status==='unverified'),downloadItems:results.filter(r=>r.download)},null,2)+'\n');
 }
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## External link crawl\n\n${checked}/${entries.length} checked (${ok} ok, ${redirected} redirected, max ${maxHops} hops); ${failed} broken (404/410/redirect-error); ${unsafe} unsafe redirects; ${unknown} unverified (not counted as working).\n\n${dispositions.map(d=>`- Disposition \`${d.disposition}\` (${d.code}): ${d.host} — ${d.count} unverified`).join('\n')}\n`);
 if(unknown)console.log('::warning::Some external hosts blocked or limited verification; explicit dispositions recorded.');
 if(failed || unsafe)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
