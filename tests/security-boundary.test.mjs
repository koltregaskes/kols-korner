import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('launch security boundary explicitly records host-only headers and absent collection paths',()=>{
 const contract=JSON.parse(fs.readFileSync('launch/security-profile.json','utf8'));
 assert.equal(contract.host.provider,'github-pages');assert.equal(contract.host.repositoryCanSetResponseHeaders,false);
 for(const item of ['forms','workerApi','newsletterSending','paymentProcessing','analyticsCollector'])assert.equal(contract.interfaces[item],'absent');
});

import {inspectHtml,inspectScript,checkBoundary} from '../scripts/check-public-boundary.mjs';
test('new collection, payment-style mutations and telemetry fail the declared absent-interface boundary',()=>{
 assert.ok(inspectHtml('<form action="https://example.test/subscribe"><input type="email"></form>').length>0);
 assert.ok(inspectScript('fetch(url,{method:"POST"})').length>0);
 assert.ok(inspectScript('navigator.sendBeacon(url,data)').length>0);
 assert.ok(inspectHtml('<meta http-equiv="X-Frame-Options" content="DENY">').length>0);
 assert.deepEqual(inspectHtml('<a href="mailto:hello@koltregaskes.com">Email</a>'),[]);
});
test('actual built public interface inventory matches the launch boundary',async()=>{const r=await checkBoundary();assert.ok(r.html>100);assert.deepEqual(r.errors,[])});

import os from 'node:os';import path from 'node:path';
for(const [name,html] of [
 ['inline telemetry','<script>navigator.sendBeacon("https://clarity.ms/collect", data)</script>'],
 ['inline mutation','<script>fetch("/api",{method:"POST"})</script>'],
 ['unquoted collection field','<input type=email>'],
 ['inline XHR mutation','<script>const xhr=new XMLHttpRequest();xhr.open("POST","/api");</script>']
])test('planted public boundary rejects '+name,()=>assert.ok(inspectHtml(html).length>0));
test('planted mjs module cannot bypass the public boundary inventory',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kk-boundary-'));fs.writeFileSync(path.join(dir,'collect.mjs'),'const x=new XMLHttpRequest();x.open("POST","/api");');const r=await checkBoundary(dir);assert.equal(r.js,1);assert.ok(r.errors.length>0);});
