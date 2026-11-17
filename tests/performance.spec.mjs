import {test, expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {startPerformanceServer} from './performance-server.mjs';

const root = path.resolve('site');
let fixture;
test.beforeAll(async()=>{fixture=await startPerformanceServer(root);});
test.afterAll(async()=>{await fixture?.close();});
const essay = (await fs.readdir(path.join(root, 'posts'))).find(name => !/^\d{4}-\d{2}-\d{2}$/.test(name));
const routes = ['/', '/news/', '/links/', '/privacy.html', ...(essay ? [`/posts/${essay}/`] : [])];

for (const routePath of routes) test(`mobile performance ${routePath}`, async ({page}, info) => {
  await page.setViewportSize({width: 390, height: 844});
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:1125000,uploadThroughput:375000});
  const errors = [], blockedOrigins = new Set();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__perf = {lcp: null, cls: 0};
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime;
    }).observe({type: 'largest-contentful-paint', buffered: true});
    // Maximum CLS session window (1 second gap, 5 second total), excluding input.
    let start = 0, last = 0, value = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        if (entry.startTime - last > 1000 || entry.startTime - start > 5000) {
          start = entry.startTime; value = 0;
        }
        last = entry.startTime; value += entry.value;
        window.__perf.cls = Math.max(window.__perf.cls, value);
      }
    }).observe({type: 'layout-shift', buffered: true});
  });
  await page.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    blockedOrigins.add(url.origin);return route.abort();
  });
  await page.goto(fixture.origin + routePath,{waitUntil:'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000); // Fixed observation window, no network/status polling.
  const metrics = await page.evaluate(() => window.__perf);
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).map(r=>({path:new URL(r.name).pathname,bytes:r.decodedBodySize,transferBytes:r.transferSize,encodedBodyBytes:r.encodedBodySize,image:r.initiatorType==='img'})));
  const navigation=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {bytes:n.decodedBodySize,transferBytes:n.transferSize,encodedBodyBytes:n.encodedBodySize};});
  const report = {route: routePath, viewport: '390x844', cpuSlowdown: 4,
    run:info.repeatEachIndex+1,network:{downloadMbps:9,uploadMbps:3,latencyMs:40,cache:'disabled'},
    scope: 'Loopback HTTP with Brotli text, real Resource Timing transfer sizes; external fonts blocked; not final-host or field evidence',
    observationMs: 2000, ...metrics, decodedResourceBytes: navigation.bytes+resources.reduce((sum, r) => sum + r.bytes, 0),
    imageBytes: resources.filter(r => r.image).reduce((sum, r) => sum + r.bytes, 0),
    transferBytes:navigation.transferBytes+resources.reduce((sum,r)=>sum+r.transferBytes,0),
    imageTransferBytes:resources.filter(r=>r.image).reduce((sum,r)=>sum+r.transferBytes,0),
    blockedOrigins: [...blockedOrigins], resources};
  const reportPath = info.outputPath('mobile-performance.json');
  await fs.mkdir(path.dirname(reportPath), {recursive: true});
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  await info.attach('mobile-performance.json', {path: reportPath, contentType: 'application/json'});
  console.log(JSON.stringify({...report, resources: undefined}));
  expect(metrics.lcp).not.toBeNull();
  expect(metrics.lcp).toBeLessThanOrEqual(2500);
  expect(metrics.cls).toBeLessThanOrEqual(0.1);
  expect(report.transferBytes).toBeGreaterThan(0);
  expect(report.imageTransferBytes).toBeLessThanOrEqual(2000000);
  expect(errors).toEqual([]);
  const theme = page.locator('[data-theme-toggle]').first();
  if (await theme.count()) {
    const before = await page.locator('html').getAttribute('data-theme');
    await theme.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before);
  }
});
