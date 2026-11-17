// Offline staging only. Never invokes a provider CLI or publishes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const settings=JSON.parse(await fs.readFile('launch/security-profile.json','utf8'));
const config=JSON.parse(await fs.readFile('launch/launch-pack.json','utf8'));
const output=path.resolve(process.argv[2]||'.local/cloudflare-site');
if(!output.startsWith(path.resolve('.local')+path.sep))throw Error('Output must be a new .local subdirectory');
await fs.mkdir(path.dirname(output),{recursive:true});await fs.mkdir(output); // refuses overwrite
const files=[];
async function copy(dir,relative=''){
 for(const e of await fs.readdir(dir,{withFileTypes:true})){
  if(e.name==='CNAME')continue; // GitHub-only config; do not delete source
  if(e.isSymbolicLink()||/^(?:\.env(?:\..*)?|\.git|\.aws|\.ssh)$/i.test(e.name)||/\.(?:pem|key|pfx|p12)$/i.test(e.name))throw Error('Unsafe staging path refused before content read');
  const name=path.join(relative,e.name),target=path.join(output,name);
  if(e.isDirectory()){await fs.mkdir(target);await copy(path.join(dir,e.name),name);}
  else if(e.isFile()){await fs.copyFile(path.join(dir,e.name),target,fs.constants.COPYFILE_EXCL);files.push({path:name.split(path.sep).join('/'),sha256:createHash('sha256').update(await fs.readFile(target)).digest('hex')});}
  else throw Error('Non-regular staging entry');
 }
}
await copy('site');
const headers=settings.host.proposedChange.rule.action_parameters.headers;
await fs.writeFile(path.join(output,'_headers'),'/*\n'+Object.entries(headers).map(([k,v])=>`  ${k}: ${v.value}`).join('\n')+'\n\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n',{flag:'wx'});
const host=new URL(config.origin).hostname;
await fs.writeFile(path.join(output,'_redirects'),`https://www.${host}/* ${config.canonicalOrigin}/:splat 301\n`,{flag:'wx'});
await fs.writeFile(output+'-manifest.json',JSON.stringify({files:files.sort((a,b)=>a.path.localeCompare(b.path)),generatedConfig:['_headers','_redirects'],scope:'offline candidate; not uploaded'},null,2),{flag:'wx'});
console.log(JSON.stringify({output,publicFiles:files.length,headers:Object.keys(headers),status:'prepared; no deployment'}));
