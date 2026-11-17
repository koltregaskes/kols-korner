import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('site'),origin='https://koltregaskes.com';
const routes=['/','/posts/','/news/','/links/','/about/','/404.html','/privacy.html','/posts/ais-efficiency-promise-has-a-catch-you/'];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
for(const width of [320,390,1280]) for(const routePath of routes) test(`keyboard traversal ${routePath} at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==root&&!file.startsWith(root+path.sep))return route.abort();
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');return route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});}
  catch{return route.fulfill({status:404,body:'missing'});}
 });
 await page.goto(origin+routePath);await page.waitForLoadState('networkidle');
 await page.keyboard.press('Tab');
 const first=await page.locator(':focus').elementHandle();expect(first).not.toBeNull();
 await expect(page.locator(':focus')).toHaveText(/Skip to/);
 await page.keyboard.press('Enter');
 await page.keyboard.press('Tab');
 expect(await page.locator(':focus').evaluate(el=>!!el.closest('main')),'skip link must bypass navigation').toBe(true);
 // Restart at the skip link; traverse until browser chrome or the first link.
 await first.focus();let checked=0,complete=false;
 for(let i=0;i<600;i++){
  await page.keyboard.press('Tab');
  if(await page.evaluate(()=>document.activeElement===document.body)){complete=true;break;}
  if(await first.evaluate(el=>el===document.activeElement)){complete=true;break;}
  // Native date controls focus a browser-owned inner segment, so :focus may
  // not match their host even though document.activeElement identifies it.
  await page.evaluate(()=>{document.querySelector('[data-keyboard-current]')?.removeAttribute('data-keyboard-current');document.activeElement.setAttribute('data-keyboard-current','');});
  const focused=page.locator('[data-keyboard-current]');
  await expect(focused).toBeVisible();await expect(focused).toBeInViewport();
  const result=await focused.evaluate(el=>{
   const style=getComputedStyle(el);
   return {outline:style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0};
  });
  expect(result.outline,'keyboard focus must have an outline').toBe(true);checked++;
 }
 expect(complete,'keyboard traversal must terminate without a focus trap').toBe(true);
 expect(checked).toBeGreaterThan(0);
 test.info().annotations.push({type:'keyboard-controls',description:String(checked)});
 if(routePath==='/news/'){
  const summary=page.locator('#filterSummaryText');
  await expect(summary).toHaveAttribute('role','status');
  await expect(summary).toHaveAttribute('aria-atomic','true');
  await page.locator('#searchInput').fill('zzzz-no-such-story');
  await expect(summary).toContainText('Showing 0 articles');
  await expect(page.locator('#searchInput')).toBeFocused();
 }
});
