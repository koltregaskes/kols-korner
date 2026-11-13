import test from 'node:test';
import assert from 'node:assert/strict';
import {checkExternalUrl} from '../scripts/check-external-links.mjs';
test('only 404 and 410 are broken; blocked and throttled hosts remain unverified',async()=>{
 for(const code of [200,403,404,410,429,500]){
  const result=await checkExternalUrl('https://example.com/',{fetchImpl:async()=>({status:code,ok:code===200,url:'https://example.com/'})});
  assert.equal(result.status,[404,410].includes(code)?'broken':code===200?'ok':'unverified');
 }
});
test('archive transient failures retry once and then report real success',async()=>{
 let calls=0; const result=await checkExternalUrl('https://web.archive.org/',{retry:true,fetchImpl:async()=>({status:++calls===1?429:200,ok:calls===2,url:'https://web.archive.org/'})});assert.equal(calls,2);assert.equal(result.status,'ok');
});
