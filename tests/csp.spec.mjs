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
