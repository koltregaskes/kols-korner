import {test, expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('site');
const origin = 'https://koltregaskes.com';
const essay = (await fs.readdir(path.join(root, 'posts'))).find(name => !/^\d{4}-\d{2}-\d{2}$/.test(name));
const routes = ['/', '/news/', '/links/', '/privacy.html', ...(essay ? [`/posts/${essay}/`] : [])];
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'};

for (const routePath of routes) test(`mobile performance ${routePath}`, async ({page}, info) => {
  await page.setViewportSize({width: 390, height: 844});
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
  const errors = [], blockedOrigins = new Set(), resources = [];
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
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) { blockedOrigins.add(url.origin); return route.abort(); }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) return route.abort();
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      resources.push({path: path.relative(root, file).replaceAll('\\', '/'), bytes: body.length, image: route.request().resourceType() === 'image'});
      return route.fulfill({body, contentType: types[path.extname(file)] || 'application/octet-stream'});
    } catch { return route.fulfill({status: 404, body: 'missing'}); }
  });
  await page.goto(origin + routePath);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000); // Fixed observation window, no network/status polling.
  const metrics = await page.evaluate(() => window.__perf);
  const report = {route: routePath, viewport: '390x844', cpuSlowdown: 4,
    scope: 'Local intercepted artifact; external requests blocked; no network or final-host timing claim',
    observationMs: 2000, ...metrics, decodedResourceBytes: resources.reduce((sum, r) => sum + r.bytes, 0),
    imageBytes: resources.filter(r => r.image).reduce((sum, r) => sum + r.bytes, 0),
    transferBytes: null, transferNote: 'Interception cannot measure compressed HTTP transfer',
    blockedOrigins: [...blockedOrigins], resources};
  const reportPath = info.outputPath('mobile-performance.json');
  await fs.mkdir(path.dirname(reportPath), {recursive: true});
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  await info.attach('mobile-performance.json', {path: reportPath, contentType: 'application/json'});
  console.log(JSON.stringify({...report, resources: undefined}));
  expect(metrics.lcp).not.toBeNull();
  expect(metrics.lcp).toBeLessThanOrEqual(2500);
  expect(metrics.cls).toBeLessThanOrEqual(0.1);
  expect(errors).toEqual([]);
  const theme = page.locator('[data-theme-toggle]').first();
  if (await theme.count()) {
    const before = await page.locator('html').getAttribute('data-theme');
    await theme.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before);
  }
});
