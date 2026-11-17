import test from 'node:test';
import assert from 'node:assert/strict';
import {assessRuns,monitor} from '../scripts/monitor-launch.mjs';
const now=Date.parse('2026-11-17T12:00:00Z');
const good={head_branch:'main',created_at:'2026-11-17T11:30:00Z',status:'completed',conclusion:'success'};
test('missing, failed, stale, future and stalled runs fail; recovery succeeds',()=>{
  assert.equal(assessRuns([],now,26),'missing run');
  assert.match(assessRuns([{...good,conclusion:'failure'}],now,26),/failed/);
  assert.match(assessRuns([{...good,created_at:'2026-11-15T00:00:00Z'}],now,26),/missed/);
  assert.match(assessRuns([{...good,created_at:'2026-11-18T00:00:00Z'}],now,26),/invalid/);
  assert.equal(assessRuns([good],now,26),null);
});
test('network failures create named private alert payload; healthy recovery clears failures',async()=>{
 const c={origin:'https://example.org/',feed:'feed.json',repository:'owner/repo',workflows:['pages.yml'],maxAgeHours:24,operator:'Claude',alertIssue:'private hub'};
 const failed=await monitor(c,async()=>{throw Error('offline');},now);
 assert.equal(failed.state,'failed');assert.equal(failed.operator,'Claude');assert.equal(failed.alert.destination,'private hub');
 const healthy=await monitor(c,async url=>new Response(JSON.stringify(String(url).includes('api.github')?{workflow_runs:[good]}:{generated:new Date(now).toISOString(),articles:[]})),now);
 assert.equal(healthy.state,'verified');
});
