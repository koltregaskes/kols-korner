// Local verification only. Import the existing owner implementation; never copy,
// activate or replace it. All browser requests terminate in this process.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const expected='d27e5c5adac9aa8402e8df8f35021e0d1b2e37cd';
const [directory,reportPath='.local/analytics-verification.json']=process.argv.slice(2);
if(!directory)throw Error('Usage: node scripts/verify-owned-analytics.mjs <existing-website-tools-clone> [report.json]');
const root=path.resolve(directory),src=path.join(root,'analytics/src');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),expected,'Existing owner revision changed; reconcile before verification');
const files=['worker.mjs','client.mjs','policy.mjs','memory-adapter.mjs'];
execFileSync('git',['diff','--quiet','HEAD','--',...files.map(f=>'analytics/src/'+f)],{cwd:root});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sourceHashes={};
for(const file of files)sourceHashes[file]=hash(await fs.readFile(path.join(src,file)));
const {createCollector,default:production}=await import(pathToFileURL(path.join(src,'worker.mjs')));
const {demoPolicy}=await import(pathToFileURL(path.join(src,'policy.mjs')));
const {MemoryAdapter}=await import(pathToFileURL(path.join(src,'memory-adapter.mjs')));
const policy={...demoPolicy,enabled:true,dailyLimit:100,monthlyLimit:100,minuteLimit:100};
const now=Date.now(),adapter=new MemoryAdapter(policy),collect=createCollector({policy,adapter,clock:()=>now});
const total=()=>adapter.snapshot(now).reduce((s,r)=>s+r.total,0);
const report={checkedAt:new Date().toISOString(),ownerIssue:1859,repository:'koltregaskes/website-tools',sourceCommit:expected,sourceHashes,
 scope:'Browser-generated test event reaches the actual owned handler through local route bridging and synthetic memory storage. No workerd, durable SQL, hosted collector or public site activation.',checks:{}};
const browser=await chromium.launch({channel:'msedge'});
try{
 const context=await browser.newContext();let posts=0,cookieSent=false,referrerSent=false;
 const page=await context.newPage();
 await page.addInitScript(()=>{
  Object.defineProperty(document,'cookie',{get(){throw Error('Cookie access forbidden');},set(){throw Error('Cookie access forbidden');}});
  Object.defineProperty(window,'localStorage',{get(){throw Error('Storage access forbidden');}});
  Object.defineProperty(window,'sessionStorage',{get(){throw Error('Storage access forbidden');}});
 });
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.href==='https://demo.invalid/')return route.fulfill({contentType:'text/html',body:`<button id="count">Count test event</button><script type="module">import {count} from '/client.mjs';window.sendCount=(extra={})=>count({endpoint:'https://collector.invalid/collect',site:'demo',page:'home',enabled:true,optedOut:false,...extra});document.getElementById('count').onclick=async()=>{window.result=await window.sendCount();};</script>`});
  if(url.href==='https://demo.invalid/client.mjs')return route.fulfill({contentType:'text/javascript',body:await fs.readFile(path.join(src,'client.mjs'))});
  if(url.href!=='https://collector.invalid/collect')return route.abort();
  const headers=await req.allHeaders();
  if(req.method()==='POST'){posts++;cookieSent||=!!headers.cookie;referrerSent||=!!headers.referer;}
  const request=new Request(req.url(),{method:req.method(),headers,...(req.method()==='POST'?{body:req.postDataBuffer()}: {})});
  const response=await collect(request);
  await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
 });
 await page.goto('https://demo.invalid/');await page.waitForFunction(()=>typeof window.sendCount==='function');
 await page.locator('#count').click();await page.waitForFunction(()=>window.result!==undefined);
 assert.equal(await page.evaluate(()=>window.result),true);assert.equal(posts,1);assert.equal(total(),1);
 report.checks.browserEvent={status:'passed',collectorPosts:posts,storedAggregateTotal:total()};
 assert.equal(cookieSent,false);assert.equal(referrerSent,false);assert.deepEqual(await context.cookies(),[]);
 report.checks.cookieless={status:'passed',cookieOrStorageAccess:'throws in fixture',cookieSent,referrerSent,cookiesCreated:0};
 for(const options of [{optedOut:true},{enabled:false}]){
  assert.equal(await page.evaluate(options=>window.sendCount(options),options),false);
 }
 await page.evaluate(()=>Object.defineProperty(navigator,'globalPrivacyControl',{configurable:true,value:true}));
 assert.equal(await page.evaluate(()=>window.sendCount()),false);
 await page.evaluate(()=>{Object.defineProperty(navigator,'globalPrivacyControl',{configurable:true,value:false});Object.defineProperty(navigator,'doNotTrack',{configurable:true,value:'1'});});
 assert.equal(await page.evaluate(()=>window.sendCount()),false);
 assert.equal(posts,1);assert.equal(total(),1);report.checks.clientPrivacySignals={status:'passed',browserNavigatorSignals:true,extraPosts:0,extraWrites:0};
 const request=(headers={})=>new Request('https://collector.invalid/collect',{method:'POST',headers:{Origin:'https://demo.invalid','Content-Type':'application/json',...headers},body:JSON.stringify(['demo','home','page_view'])});
 for(const signal of ['Sec-GPC','DNT','X-Analytics-Opt-Out'])assert.equal((await collect(request({[signal]:'1'}))).status,204);
 assert.equal(total(),1);report.checks.serverPrivacySignals={status:'passed',extraWrites:0};
 assert.equal((await production.fetch(request())).status,503);report.checks.productionDisabled={status:'passed'};
 const probes=[];
 for(const agent of ['Googlebot','GPTBot','HeadlessChrome']){const before=total(),response=await collect(request({'User-Agent':agent}));probes.push({syntheticAgent:agent,http:response.status,counted:total()-before});}
 report.checks.botFiltering={status:probes.every(p=>p.counted===0)?'passed':'failed',probes};
 report.aggregateReadback=adapter.snapshot(now);
 await context.close();
}finally{await browser.close();}
for(const file of files)assert.equal(hash(await fs.readFile(path.join(src,file))),sourceHashes[file],'Owned source changed during verification');
report.acceptance=Object.values(report.checks).every(c=>c.status==='passed')?'passed':'blocked';
await fs.mkdir(path.dirname(reportPath),{recursive:true});await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({acceptance:report.acceptance,checks:report.checks}));
if(report.acceptance!=='passed')process.exitCode=2;
