import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
export function inspectHtml(html){
 const source=html.replace(/<!--[\s\S]*?-->/g,'');const markup=source.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>');const errors=[];
 for(const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))errors.push(...inspectScript(script[1]));
 if(/<form\b/i.test(markup))errors.push('New form requires validation/abuse/privacy review');
 if(/<input\b[^>]*type\s*=\s*(?:["'](?:email|password)["']|(?:email|password)(?=[\s>]))/i.test(markup))errors.push('New collection/auth field requires an approved interface contract');
 if(/<script\b[^>]*src=["'](?:https?:)?\/\//i.test(markup))errors.push('External script requires an approved public boundary');
 if(/<meta\b[^>]*http-equiv=["'](?:strict-transport-security|x-frame-options|x-content-type-options)["']/i.test(markup))errors.push('Response-only security header cannot be supplied by HTML metadata');
 if(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*frame-ancestors/i.test(markup))errors.push('frame-ancestors requires a response header');

 // Scan actual tag attributes, not text or quoted strings in script bodies.
 for(const tag of markup.matchAll(/<[a-z][^"'<>]*(?:"[^"]*"[^"'<>]*|'[^']*'[^"'<>]*)*>/gi)){
  for(const attribute of tag[0].matchAll(/\s+([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+))/g)){
   const name=attribute[1].toLowerCase();
   const value=(attribute[2]??attribute[3]??attribute[4]).replace(/&#(x[0-9a-f]+|\d+);?|&(?:quot|apos|amp|colon|tab|newline);/gi,(entity,number)=>{
    if(number){const code=number[0].toLowerCase()==='x'?parseInt(number.slice(1),16):Number(number);return code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):'\ufffd';}
    return ({'&quot;':'"','&apos;':"'",'&amp;':'&','&colon;':':','&tab;':'\t','&newline;':'\n'})[entity.toLowerCase()]??entity;
   });
   if(/^on[a-z]+$/.test(name)){errors.push('Inline event handler requires script/privacy review');errors.push(...inspectScript(value));}
   if((/^(?:href|formaction|src|action|xlink:href)$/.test(name)||(name==='data'&&/^<object\b/i.test(tag[0])))&&/^javascript:/i.test(value.replace(/[\u0000-\u0020]/g,''))){errors.push('JavaScript URL requires script/privacy review');errors.push(...inspectScript(value));}
  }
 }
 return errors;
}
export function inspectScript(script){const errors=[];
 if(/\bfetch\s*\?\.\s*\(/i.test(script))errors.push('Optional browser request requires interface review');
 if(/navigator\s*(?:\??\.\s*sendBeacon|(?:\?\.\s*)?\[\s*["'`]sendBeacon["'`]\s*\])|document\s*(?:\??\.\s*cookie|(?:\?\.\s*)?\[\s*["'`]cookie["'`]\s*\])|googletagmanager|google-analytics|clarity\.ms/i.test(script))errors.push('New telemetry/cookie behaviour requires collector/privacy review');
 if(/(?:(?:["'`]?method["'`]?|\[\s*["'`]method["'`]\s*\])\s*:\s*["'`](?:POST|PUT|PATCH|DELETE)["'`]|(?:\.\s*open|\[\s*["'`]open["'`]\s*\])\s*\(\s*["'`](?:POST|PUT|PATCH|DELETE)["'`])/i.test(script))errors.push('New browser mutation API requires interface review');
 if(/<form\b/i.test(script))errors.push('Dynamic form requires interface review');return errors;
}
export async function checkBoundary(directory='site'){
 const errors=[];let html=0,js=0;async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(/^\.env(?:\.|$)/.test(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(html|m?js)$/i.test(e.name)){const text=await fs.readFile(p,'utf8'),isHtml=/\.html$/i.test(e.name);if(isHtml)html++;else js++;for(const error of (isHtml?inspectHtml(text):inspectScript(text)))errors.push(path.relative(directory,p)+': '+error)}}}await walk(directory);return {html,js,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await checkBoundary();console.log('Public boundary: '+r.html+' HTML and '+r.js+' JS files; '+r.errors.length+' unexpected interfaces.');if(r.errors.length){console.error(r.errors.join('\n'));process.exitCode=1}}
