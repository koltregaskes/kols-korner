import {findHorizontalOverflow} from './overflow-check.mjs';
import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const origin='https://koltregaskes.com',root=path.resolve('site');
for(const width of [320,390])for(const state of ['fresh','stale','empty','unavailable','corrupt-storage','denied-storage'])test('news '+state+' at '+width+'px',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});
 if(state==='corrupt-storage')await page.addInitScript(()=>localStorage.setItem('news-favorites','{broken'));
 if(state==='denied-storage')await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('denied')}}));
 const now=Date.now(),date=new Date(state==='stale'?now-3*86400000:now-3600000).toISOString();
 const payload={site:"Kol's Korner",generated:new Date(now-600000).toISOString(),articles:state==='empty'?[]:[{title:'A model release',summary:'A source summary.',source:'Example',url:'https://example.test/story',date,category:'models'}]};
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
  if(url.pathname==='/data/news-feed-latest.json')return route.fulfill({status:state==='unavailable'?503:200,json:payload});
  let file=path.resolve(root,'.'+url.pathname);if(file!==root&&!file.startsWith(root+path.sep))return route.abort();
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');const type={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream';return route.fulfill({body:await fs.readFile(file),contentType:type})}catch{return route.fulfill({status:404,body:'missing'})}
 });
 await page.goto(origin+'/news/');const status=page.locator('#newsAvailability');await expect(status).not.toHaveText(/Checking current/);
 const expected=['corrupt-storage','denied-storage'].includes(state)?'fresh':state;await expect(status).toHaveAttribute('data-state',expected);
 if(state==='empty')await expect(status).toContainText('No matching stories');if(state==='unavailable')await expect(status).toContainText('unavailable');
 expect(errors).toEqual([]);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(findHorizontalOverflow)).toEqual([]);
});
