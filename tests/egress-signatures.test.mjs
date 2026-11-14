import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectScript} from '../scripts/check-public-boundary.mjs';
for(const script of [
 'navigator["sendBeacon"](url,data)',
 "navigator['sendBeacon'](url,data)",
 'navigator[`sendBeacon`](url,data)',
 'navigator [ "sendBeacon" ] (url,data)',
 'document["cookie"] = value',
 'fetch(url,{method:`POST`})',
 'fetch(url,{["method"]:`PUT`})',
 'fetch(url,{[`method`]:"DELETE"})',
 'xhr["open"](`POST`,url)',
 'xhr[`open`]("PATCH",url)',
 'fetch(new Request(url,{method:`post`}))'
])test('egress signature rejects '+script,()=>assert.ok(inspectScript(script).length>0));
test('read-only requests remain accepted',()=>{for(const script of ['fetch(url,{method:`GET`})','xhr["open"]("GET",url)','element["open"]()'])assert.deepEqual(inspectScript(script),[]);});
