// Optional maintenance tool: use an existing FFmpeg install; originals stay intact.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const executable=process.argv[2]||'ffmpeg',dir='site/media/responsive';
await fs.mkdir(dir,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),images=[];
for(const name of (await fs.readdir('site/media')).sort()){
 if(!name.endsWith('.png'))continue;
 const source='media/'+name,bytes=await fs.readFile('site/'+source);
 if(bytes.length<500000)continue;
 const originalWidth=bytes.readUInt32BE(16),sha256=hash(bytes),variants=[];
 for(const width of [...new Set([480,960,1600].map(w=>Math.min(w,originalWidth)))]){
  const target=`${path.basename(name,'.png')}-${sha256.slice(0,12)}-${width}.webp`,output=path.join(dir,target);
  try{await fs.access(output);}catch{
   execFileSync(executable,['-nostdin','-v','error','-n','-i','site/'+source,'-vf',`scale=${width}:-2`,'-c:v','libwebp','-quality','82','-frames:v','1',output],{stdio:'pipe'});
  }
  const variant=await fs.readFile(output);variants.push({path:'media/responsive/'+target,width,bytes:variant.length,sha256:hash(variant)});
 }
 images.push({source,bytes:bytes.length,sha256,variants});
}
await fs.writeFile(dir+'/manifest.json',JSON.stringify({version:1,format:'webp',quality:82,images},null,2)+'\n');
console.log(JSON.stringify({images:images.length,originalBytes:images.reduce((s,i)=>s+i.bytes,0),derivativeBytes:images.flatMap(i=>i.variants).reduce((s,i)=>s+i.bytes,0)}));
