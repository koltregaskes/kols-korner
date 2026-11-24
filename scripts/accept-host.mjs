import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {findHorizontalOverflow} from '../tests/overflow-check.mjs';

export function validatePng(bytes) {
  return bytes.length>=33 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) &&
    bytes.toString('ascii',12,16)==='IHDR' && bytes.readUInt32BE(16)>0 && bytes.readUInt32BE(20)>0;
}
export function headerFailures(headers) {
 const expected={'x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'strict-origin-when-cross-origin'};
 const failures=Object.entries(expected).filter(([k,v])=>headers.get(k)?.toLowerCase()!==v.toLowerCase()).map(([k])=>k);
 if(!/max-age=[1-9]\d*/i.test(headers.get('strict-transport-security')||''))failures.push('strict-transport-security');
 if(!/frame-ancestors\s+'none'/i.test(headers.get('content-security-policy')||''))failures.push('content-security-policy');
 if(!headers.get('permissions-policy'))failures.push('permissions-policy');return failures;
}
export async function acceptHost(base,config,output) {
 const origin=new URL(base);if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash)throw Error('Use a public HTTPS base URL without credentials, query or fragment');
 const results=[];
 const record=async(name,fn)=>{try {const detail=await fn();results.push({name,state:'verified',detail});}catch(e){results.push({name,state:'failed',reason:e.message});}};
 const get=async relative=>{const url=new URL(relative,base);const r=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'follow'});if(new URL(r.url).protocol!=='https:')throw Error('HTTPS downgrade');return r;};
 await record('status and HTTPS',async()=>{const r=await get('');if(r.status!==200)throw Error(`HTTP ${r.status}`);return {status:r.status,final:r.url};});
 for(const route of config.routes) await record(`headers ${route}`,async()=>{const r=await get(route);const missing=headerFailures(r.headers);if(missing.length)throw Error('Missing/incorrect: '+missing.join(', '));return Object.fromEntries(['content-security-policy','strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'].map(k=>[k,r.headers.get(k)]));});
 let browser;
 try {
  const module=process.env.PLAYWRIGHT_MODULE ? await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href) : await import('playwright');
  browser=await module.chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:320,height:900},serviceWorkers:'block'});
  for(const route of config.routes) await record(`page ${route}`,async()=>{
   const page=await context.newPage();const mixed=[];
   page.on('request',r=>{if(r.url().startsWith('http:'))mixed.push('request');});
   try {
    const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle',timeout:30000});
    if(!response||response.status()!==200)throw Error(`HTTP ${response?.status()}`);
    const metadata=await page.evaluate(()=>({canonical:document.querySelector('link[rel="canonical"]')?.href,
     og:document.querySelector('meta[property="og:image"]')?.content,
     jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),
     mixed:[...document.querySelectorAll('[src],[href],[srcset],[poster],style,[style]')].some(x=>[x.getAttribute('src'),x.getAttribute('href'),x.getAttribute('srcset'),x.getAttribute('poster'),x.getAttribute('style'),x.tagName==='STYLE'?x.textContent:''].some(v=>/(?:^|[\s"'(,])http:\/\//i.test(v||'')))}));
    if(route!=='/404.html') {
     if(metadata.canonical!==new URL(route,config.canonicalOrigin).href)throw Error('canonical mismatch');
     if(!metadata.jsonld.length||metadata.jsonld.some(x=>!x['@context']||(!x['@type']&&!x['@graph'])))throw Error('missing/invalid JSON-LD');
     if(!metadata.og)throw Error('missing OG image');
     const r=await get(metadata.og);const bytes=Buffer.from(await r.arrayBuffer());
     if(r.status!==200||!r.headers.get('content-type')?.includes('image/png')||!validatePng(bytes))throw Error('OG must be a real PNG');
     const dimensions=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return [i.naturalWidth,i.naturalHeight];},metadata.og);
     if(!dimensions.every(n=>n>0))throw Error('PNG cannot decode');
    }
    if(mixed.length||metadata.mixed)throw Error('mixed content');
    const overflow=await page.evaluate(findHorizontalOverflow);
    if(overflow.length||await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('horizontal overflow at 320px');
    return {canonical:metadata.canonical,jsonld:metadata.jsonld.length,og:metadata.og,width:320};
   } finally {await page.close();}
  });
  await record('sitemap, robots and RSS',async()=>{
   const sitemap=await get('sitemap.xml'),robots=await get('robots.txt'),rss=await get('feed.xml');
   if([sitemap,robots,rss].some(r=>r.status!==200))throw Error('missing sitemap, robots or RSS');
   const texts=await Promise.all([sitemap.text(),robots.text(),rss.text()]);
   const page=await context.newPage();try {
    const xml=await page.evaluate(([s,r])=>{const p=new DOMParser(),a=p.parseFromString(s,'text/xml'),b=p.parseFromString(r,'text/xml');return {errors:a.querySelectorAll('parsererror').length+b.querySelectorAll('parsererror').length,urls:[...a.querySelectorAll('url > loc')].map(x=>x.textContent),items:b.querySelectorAll('rss channel item').length};},[texts[0],texts[2]]);
    if(xml.errors||!xml.urls.length||!xml.items)throw Error('invalid/empty sitemap or RSS');
    if(xml.urls.some(u=>new URL(u).origin!==config.canonicalOrigin))throw Error('sitemap origin mismatch');
    if(!texts[1].includes(`Sitemap: ${config.canonicalOrigin}/sitemap.xml`)||/Disallow:\s*\/(?:\s|$)/m.test(texts[1]))throw Error('robots sitemap/disallow mismatch');
    return {sitemapUrls:xml.urls.length,rssItems:xml.items};
   }finally{await page.close();}
  });
 }catch(e){results.push({name:'browser acceptance',state:'failed',reason:e.message});}
 finally{await browser?.close();}
 await record('real 404 response',async()=>{const r=await get('__launch_pack_missing_2020__');const text=await r.text();if(r.status!==404||!/<html/i.test(text)||!/(404|not found)/i.test(text))throw Error(`Expected HTML 404, got ${r.status}`);const missing=headerFailures(r.headers);if(missing.length)throw Error('404 headers missing: '+missing.join(', '));return {status:404};});
 const report={time:new Date().toISOString(),base,canonicalOrigin:config.canonicalOrigin,scope:config.routes,results,state:results.every(r=>r.state==='verified')?'verified':'failed'};
 if(output)await fs.writeFile(output,JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify(report,null,2));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const config=JSON.parse(await fs.readFile('launch/launch-pack.json','utf8'));if((await acceptHost(process.argv[2]||config.origin,config,process.argv[3])).state!=='verified')process.exitCode=1;}
