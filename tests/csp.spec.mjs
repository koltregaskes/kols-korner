import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('site'),origin='https://koltregaskes.com';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};

test('CSP sweep detects a planted inline script',async({page})=>{
 await page.addInitScript(()=>{globalThis.__cspViolations=[];document.addEventListener('securitypolicyviolation',event=>globalThis.__cspViolations.push(event.effectiveDirective));});
 await page.route('https://csp-control.test/**',route=>route.fulfill({contentType:'text/html',body:'<meta http-equiv="Content-Security-Policy" content="script-src \'self\'"><script>globalThis.__plantedRan=true</script><p>Control</p>'}));
 await page.goto('https://csp-control.test/');
 await expect.poll(()=>page.evaluate(()=>globalThis.__cspViolations.length)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>globalThis.__plantedRan)).not.toBe(true);
});
test('externalised navigation script keeps the phone menu working',async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});}
  catch{await route.fulfill({status:404,body:''});}
 });
 await page.goto(origin+'/posts/');
 const toggle=page.locator('.site-nav-toggle');await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','false');
});

for (const routePath of ['/', '/posts/', '/news/', '/links/', '/about/', '/posts/ais-efficiency-promise-has-a-catch-you/'])
for (const width of [320, 390]) test(routePath+' collapsed phone navigation stays out of keyboard focus at '+width+'px', async ({page}) => {
 await page.setViewportSize({width,height:900});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==root&&!file.startsWith(root+path.sep))return route.abort();
  try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});}
  catch{await route.fulfill({status:404,body:''});}
 });
 await page.goto(origin+routePath);
 const toggle=page.locator('.site-nav-toggle');
 const nav=page.locator('#site-nav-links');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await toggle.focus();await page.keyboard.press('Tab');
 expect(await page.locator(':focus').evaluate(el=>!!el.closest('#site-nav-links'))).toBe(false);
 await expect(nav).toBeHidden();
 // Keyboard users can open the menu and reach its first link.
 await toggle.focus();await page.keyboard.press('Enter');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Tab');
 await expect(nav.locator('a').first()).toBeFocused();
 await expect(nav.locator('a').first()).toBeVisible();
 // Space closes the disclosure and removes its links from the tab sequence.
 await toggle.focus();await page.keyboard.press('Space');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await page.keyboard.press('Tab');
 expect(await page.locator(':focus').evaluate(el=>!!el.closest('#site-nav-links'))).toBe(false);
 await expect(nav).toBeHidden();
 // A collapsed phone menu must not hide navigation after resizing to desktop.
 await page.setViewportSize({width:1280,height:900});
 await expect(nav).toBeVisible();
 await nav.locator('a').first().focus();
 await expect(nav.locator('a').first()).toBeFocused();
});
