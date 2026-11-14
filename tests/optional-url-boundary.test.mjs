import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHtml,inspectScript} from '../scripts/check-public-boundary.mjs';
for(const code of ['navigator?.sendBeacon(url,data)','document?.cookie','navigator?.["sendBeacon"](url,data)',"document?.['cookie']",'fetch?.(url)','window.fetch?.(url)'])
 test('reject optional browser interface '+code,()=>assert.ok(inspectScript(code).length));
for(const name of ['formaction','src','action','xlink:href'])
 test('reject javascript URL in '+name,()=>assert.ok(inspectHtml('<button '+name+'=" &#106;ava&Tab;script&colon;collect()">Run</button>').some(e=>e.includes('JavaScript URL'))));
test('ordinary URLs and unrelated optional access stay accepted',()=>{
 for(const name of ['href','formaction','src','action','xlink:href'])assert.deepEqual(inspectHtml('<a '+name+'="/safe">Read</a>'),[]);
 assert.deepEqual(inspectHtml('<p>action="javascript:collect()" is text</p>'),[]);
 for(const code of ['object?.value','fetch(url,{method:"GET"})'])assert.deepEqual(inspectScript(code),[]);
});
