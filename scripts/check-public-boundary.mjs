import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';
export function inspectHtml(html){
 const source=html.replace(/<!--[\s\S]*?-->/g,'');const markup=source.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>');const errors=[];
 for(const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))errors.push(...inspectScript(script[1]));
 if(/<form\b/i.test(markup))errors.push('New form requires validation/abuse/privacy review');
 if(/<input\b[^>]*type\s*=\s*(?:["'](?:email|password)["']|(?:email|password)(?=[\s>]))/i.test(markup))errors.push('New collection/auth field requires an approved interface contract');
 if(/<script\b[^>]*src=["'](?:https?:)?\/\//i.test(markup))errors.push('External script requires an approved public boundary');
 if(/<meta\b[^>]*http-equiv=["'](?:strict-transport-security|x-frame-options|x-content-type-options)["']/i.test(markup))errors.push('Response-only security header cannot be supplied by HTML metadata');
 if(/<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*frame-ancestors/i.test(markup))errors.push('frame-ancestors requires a response header');
 return errors;
}
export function inspectScript(script){const errors=[];
 if(/navigator\.sendBeacon|document\.cookie|googletagmanager|google-analytics|clarity\.ms/i.test(script))errors.push('New telemetry/cookie behaviour requires collector/privacy review');
 if(/(?:["']?method["']?\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']|\.open\s*\(\s*["'](?:POST|PUT|PATCH|DELETE)["'])/i.test(script))errors.push('New browser mutation API requires interface review');
 if(/<form\b/i.test(script))errors.push('Dynamic form requires interface review');return errors;
}
export async function checkBoundary(directory='site'){
 const errors=[];let html=0,js=0;async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){if(/^\.env(?:\.|$)/.test(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(html|m?js)$/i.test(e.name)){const text=await fs.readFile(p,'utf8'),isHtml=/\.html$/i.test(e.name);if(isHtml)html++;else js++;for(const error of (isHtml?inspectHtml(text):inspectScript(text)))errors.push(path.relative(directory,p)+': '+error)}}}await walk(directory);return {html,js,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=await checkBoundary();console.log('Public boundary: '+r.html+' HTML and '+r.js+' JS files; '+r.errors.length+' unexpected interfaces.');if(r.errors.length){console.error(r.errors.join('\n'));process.exitCode=1}}
