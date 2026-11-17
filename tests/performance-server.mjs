import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {brotliCompressSync} from 'node:zlib';
// Ephemeral loopback test fixture; no publication or persistent service.
export async function startPerformanceServer(directory='site'){
 const root=path.resolve(directory),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.ico':'image/x-icon'};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(404);return res.end();}
   let target=file;if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');
   const type=types[path.extname(target)]||'application/octet-stream',raw=await fs.readFile(target);
   const compress=/text\/|json|xml|svg/.test(type)&&req.headers['accept-encoding']?.includes('br');
   const body=compress?brotliCompressSync(raw):raw;
   res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'no-store',...(compress?{'content-encoding':'br','vary':'Accept-Encoding'}:{})});res.end(body);
  }catch{res.writeHead(404);res.end('missing');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}
