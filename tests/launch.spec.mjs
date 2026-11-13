import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('site');
const base = (await fs.readFile('site/sitemap.xml', 'utf8')).match(/<loc>(.*?)<\/loc>/)[1];
const origin = new URL(base).origin;
async function pages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? pages(path.join(dir,e.name)) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []))).flat();
}
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml'};
for (const file of await pages(root)) {
 const relative = path.relative(root,file).replaceAll('\\','/');
 const html = await fs.readFile(file,'utf8');
 for (const width of [320,1280]) test(`${relative} at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.route('**/*', async route => {
   const url = new URL(route.request().url());
   if(url.origin !== origin) return route.abort();
   const target = path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(!target.startsWith(root+path.sep) && target !== root) return route.abort();
   let resolved = target;
   try { if((await fs.stat(resolved)).isDirectory()) resolved=path.join(resolved,'index.html');
    await route.fulfill({body:await fs.readFile(resolved),contentType:types[path.extname(resolved)] || 'application/octet-stream'});
   } catch { await route.fulfill({status:404,body:'Not found'}); }
  });
  await page.goto(new URL(relative,origin+'/').href);
  const redirect = html.match(/http-equiv=["']refresh["'][^>]*content=["']0;\s*url=([^"']+)/i);
  if (redirect) await page.waitForURL(new URL(redirect[1], new URL(relative, origin+'/')).href);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
  const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => ({tag:e.tagName,classes:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(0,10));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(overflow)).toBe(true);
  const result = await new AxeBuilder({page}).analyze();
  expect(result.violations.filter(v => ['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  const links = await page.locator('[href], [src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')||n.getAttribute('src')).filter(Boolean));
  for(const link of links) {
   const url=new URL(link,page.url());
   if(url.origin!==origin || !['https:','http:'].includes(url.protocol)) continue;
   const target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   expect(target===root || target.startsWith(root+path.sep)).toBe(true);
   let stat; try {stat=await fs.stat(target)} catch {throw new Error(`Broken internal target: ${relative} -> ${url.pathname}`)}
   if(stat.isDirectory()) await fs.access(path.join(target,'index.html'));
  }
 });
}
