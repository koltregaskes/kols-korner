import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {assessRoutedFeedFreshness} from './check-routed-feed-freshness.mjs';

export function assessRuns(runs, now, maxAgeHours) {
  const run = runs.filter(r => r.head_branch === 'main').sort((a,b) => Date.parse(b.created_at)-Date.parse(a.created_at))[0];
  if (!run) return 'missing run';
  if (!Number.isFinite(Date.parse(run.created_at)) || Date.parse(run.created_at) > now + 300000) return 'invalid run time';
  if (now-Date.parse(run.created_at) >= maxAgeHours*3600000) return 'missed schedule or stalled run';
  if (run.status !== 'completed') return now-Date.parse(run.created_at)>3600000 ? 'stalled run' : null;
  return run.conclusion === 'success' ? null : `failed run: ${run.conclusion}`;
}
export async function monitor(config, request=fetch, now=Date.now()) {
  const checks=[];
  const check=async(name,fn)=>{try {await fn();checks.push({name,state:'verified'});} catch(e){checks.push({name,state:'failed',reason:e.message});}};
  const get=async url=>{const r=await request(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`HTTP ${r.status}`);if(new URL(r.url||url).protocol!=='https:')throw Error('HTTPS required');return r;};
  await check('uptime',async()=>{await (await get(config.origin)).body?.cancel();});
  await check('freshness',async()=>{const feed=await (await get(new URL(config.feed,config.origin))).json();const a=assessRoutedFeedFreshness(feed,new Date(now));if(a.ageDays*24>=config.maxAgeHours)throw Error('stale public feed');if(feed.sourcesFailed?.length || feed.source_failures?.length)throw Error('partial sources');});
  for(const workflow of config.workflows) await check(workflow,async()=>{
    const data=await (await get(`https://api.github.com/repos/${config.repository}/actions/workflows/${workflow}/runs?branch=main&per_page=5`)).json();
    // Deployment is push-triggered: no daily run is expected, but the latest must succeed.
    const reason=assessRuns(data.workflow_runs||[],now,workflow==='pages.yml'?87600:26);if(reason)throw Error(reason);
  });
  const failed=checks.some(c=>c.state==='failed');
  return {time:new Date(now).toISOString(),site:config.site,operator:config.operator,checks,state:failed?'failed':'verified',
    alert:{destination:config.alertIssue,delivery:'unverified; existing Chief must relay through the private hub connector',
      comment:`To: agent:claude: ${config.site} monitoring ${failed?'FAILED':'recovered/healthy'}. ${checks.filter(c=>c.state==='failed').map(c=>`${c.name}: ${c.reason}`).join('; ')}. Preserve last good release; inspect source and deployment before retrying. Codex, Gaming-Laptop, via T3 Code Chief of Staff`}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const config=JSON.parse(await fs.readFile(process.argv[2]||'launch/launch-pack.json','utf8'));
  const report=await monitor(config);const output=process.argv[3];
  if(output)await fs.writeFile(output,JSON.stringify(report,null,2),{flag:'wx'});
  console.log(JSON.stringify(report,null,2));if(report.state==='failed')process.exitCode=1;
}
