import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function assertArtifactFiles(files,dir) {
 if (!files.length || !files.some(f=>path.relative(dir,f)==='index.html')) throw Error('Artifact must contain public files and a root index.html');
}
export async function compareLive(file, url, fetchImpl=fetch, {deadline=Infinity,clock=Date.now}={}) {
 try {
  const remaining=deadline-clock();if(remaining<=0)return {status:'unverified',reason:'deadline'};
  const response=await fetchImpl(url,{redirect:'follow',signal:AbortSignal.timeout(Math.max(1,Math.min(15000,remaining))),headers:{'cache-control':'no-cache'}});
  if(!response.ok){await response.body?.cancel();return {status:'unverified',http:response.status};}
  const finalUrl=new URL(response.url||url);
  if(finalUrl.protocol!=='https:'){await response.body?.cancel();return {status:'unverified',reason:'HTTPS downgrade'};}
  if(finalUrl.origin!==new URL(url).origin){await response.body?.cancel();return {status:'unverified',reason:'Unexpected origin'};}
  const expected=hash(await fs.readFile(file)),actual=hash(Buffer.from(await response.arrayBuffer()));
  if(clock()>=deadline)return {status:'unverified',reason:'deadline'};
  return {status:expected===actual?'match':'mismatch',expectedSha256:expected,actualSha256:actual,http:response.status,finalUrl:finalUrl.href};
 }catch{return {status:'unverified',reason:'network or redirect failure'};}
}
async function walk(dir) {
 const entries=await fs.readdir(dir,{withFileTypes:true});
 return (await Promise.all(entries.filter(e=>!e.name.startsWith('.')||e.name==='.well-known').map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();
}
async function main(){
 const [dir,base,reportPath]=process.argv.slice(2);if(!dir||!base||!base.endsWith('/')||new URL(base).protocol!=='https:')throw Error('Usage: node scripts/check-live.mjs <deployed-artifact-directory> <https-base-url/> [report.json]');
 const files=await walk(dir);assertArtifactFiles(files,dir);const queue=[...files],results=[],deadline=Date.now()+240000;
 await Promise.all(Array.from({length:6},async()=>{while(queue.length){const file=queue.shift(),relative=path.relative(dir,file).split(path.sep).map(encodeURIComponent).join('/');const result=Date.now()<deadline?await compareLive(file,new URL(relative,base).href,fetch,{deadline}):{status:'unverified',reason:'deadline'};results.push({path:relative,...result});if(result.status!=='match')console.log(JSON.stringify(results.at(-1)));}}));
 const report={checkedAt:new Date().toISOString(),base,files:files.length,matched:results.filter(r=>r.status==='match').length,mismatched:results.filter(r=>r.status==='mismatch').length,unverified:results.filter(r=>r.status==='unverified').length};
 if(reportPath)await fs.writeFile(reportPath,JSON.stringify({...report,results:results.sort((a,b)=>a.path.localeCompare(b.path))},null,2)+'\n');
 console.log(JSON.stringify(report));if(report.mismatched||report.unverified)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
