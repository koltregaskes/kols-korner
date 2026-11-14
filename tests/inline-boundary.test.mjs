import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHtml} from '../scripts/check-public-boundary.mjs';
for (const [name,html] of [
 ['click telemetry', '<button onclick="navigator.sendBeacon(url,data)">Click</button>'],
 ['load mutation', '<img onload="fetch(url,{method:\'POST\'})">'],
 ['unquoted handler', '<body onpageshow=collect()>'],
 ['mixed-case handler', '<svg oNLoAd="collect()">'],
 ['quoted greater-than', '<button title="a > b" onclick="collect()">Click</button>'],
 ['javascript href', '<a href="javascript:navigator.sendBeacon(url,data)">Click</a>'],
 ['encoded javascript href', '<a HREF="&#x6a;ava&#115;cript:collect()">Click</a>']
]) test('inline boundary rejects '+name,()=>assert.ok(inspectHtml(html).length>0));
test('inert text and normal attributes remain accepted',()=>{
 for(const html of ['<!-- <img onload="collect()"> -->','<p>onclick= is text</p>','<button data-onclick="collect()" title="onclick=collect()">Read</button>','<a href="mailto:hello@example.test">Email</a>','<script type="application/ld+json">{"description":"onclick=read()"}</script>'])assert.deepEqual(inspectHtml(html),[]);
});
