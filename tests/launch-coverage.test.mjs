import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import config from '../playwright.config.mjs';

test('the launch browser uses the installed Edge channel without downloads',()=>{
 assert.equal(config.use.channel,'msedge');
 const workflow=fs.readFileSync('.github/workflows/validate.yml','utf8');
 assert.ok(!/playwright install/.test(workflow),'CI must use the runner-installed browser');
});

test('actual Playwright discovery covers every built HTML route at 320, 390 and desktop',()=>{
 const result=spawnSync(process.execPath,[path.resolve('node_modules/@playwright/test/cli.js'),'test','launch.spec.mjs','--list','--reporter=json'],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);
 const report=JSON.parse(result.stdout);const titles=[];
 function walk(suites){for(const suite of suites||[]){for(const spec of suite.specs||[])titles.push(spec.title);walk(suite.suites)}}walk(report.suites);
 const routes=new Set(titles.map(title=>title.replace(/ at \d+px$/,'')));
 assert.ok(routes.size>100,'real launch routes must be discovered');
 for(const route of routes)for(const width of [320,390,1280])assert.ok(titles.includes(route+' at '+width+'px'),route+' is not tested at '+width+'px');
});
