import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Preserve parser order: classic external scripts remain blocking at the same
// position. Inert JSON-LD stays inline; modules need their own URL/import review.
export async function externalizeInlineScripts(root='site'){
 const scripts=new Map();let pages=0;
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())await walk(file);
  else if(/\.html$/i.test(file)){
   const html=await fs.readFile(file,'utf8');
   let updated=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(tag,attributes,body)=>{
    if(/\bsrc\s*=/i.test(attributes)||!body.trim())return tag;
    const type=attributes.match(/\btype\s*=\s*["']([^"']*)["']/i)?.[1]?.toLowerCase()||'';
    if(type==='application/ld+json')return tag;
    if(type&&!['text/javascript','application/javascript'].includes(type))throw Error('Review inline script type '+type+' in '+file);
    const code=body.replace(/\r\n?/g,'\n');
    const name=createHash('sha256').update(code).digest('hex').slice(0,24)+'.js';
    const output=path.join(root,'assets','page-scripts',name);
    scripts.set(output,code);
    const src=path.relative(path.dirname(file),output).replaceAll('\\','/');
    return '<script'+attributes+' src="'+src+'"></script>';
   });
   updated=updated.replace(/<meta\b[^>]*>/gi,tag=>{
    if(!/\bhttp-equiv\s*=\s*["']Content-Security-Policy["']/i.test(tag))return tag;
    return tag.replace(/\bcontent="([^"]*)"/i,(_,policy)=>'content="'+policy.split(';').map(directive=>/^\s*script-src(?:\s|$)/i.test(directive)?directive.replace(/\s+'unsafe-inline'/gi,''):directive).join(';')+'"');
   });
   if(updated!==html){await fs.writeFile(file,updated);pages++;}
  }
 }}
 await walk(root);
 for(const [file,code]of scripts){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,code);}
 return {pages,scripts:scripts.size};
}
