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

for(const name of ['href','formaction','src','action','xlink:href'])
 test('reject numeric reference without semicolon in '+name,()=>assert.ok(inspectHtml('<a '+name+'="&#106avascript:collect()">Run</a>').some(e=>e.includes('JavaScript URL'))));
test('reject object data javascript URL',()=>{
 assert.ok(inspectHtml('<object data="&#106avascript:collect()"></object>').some(e=>e.includes('JavaScript URL')));
 assert.deepEqual(inspectHtml('<object data="/safe.svg"></object>'),[]);
 assert.deepEqual(inspectHtml('<div data="javascript:inert"></div>'),[]);
});
// Computed-parent access and bracketed fetch calls remain outside this bounded signature guard.
