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
