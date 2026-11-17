import test from 'node:test';
import assert from 'node:assert/strict';
import {headerFailures,validatePng} from '../scripts/accept-host.mjs';
test('HTML disguised as PNG and empty dimensions fail',()=>{
 assert.equal(validatePng(Buffer.from('<html>not an image</html>')),false);
 const b=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.write('IHDR',12);assert.equal(validatePng(b),false);
 b.writeUInt32BE(1200,16);b.writeUInt32BE(630,20);assert.equal(validatePng(b),true);
});
test('absent or weak security headers fail',()=>{
 assert.equal(headerFailures(new Headers()).length,6);
 const h=new Headers({'x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'strict-origin-when-cross-origin','strict-transport-security':'max-age=31536000','content-security-policy':"default-src 'self'; frame-ancestors 'none'",'permissions-policy':'camera=()'});
 assert.deepEqual(headerFailures(h),[]);h.set('strict-transport-security','max-age=0');assert.deepEqual(headerFailures(h),['strict-transport-security']);
});
