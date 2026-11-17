import {test, expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const origin = 'https://koltregaskes.com', root = path.resolve('site');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'};
for (const routePath of ['/', '/news/', '/privacy.html', '/contact/', '/terms/', '/cookies/', '/accessibility/']) test(`privacy boundary ${routePath}`, async ({page, context}, info) => {
  const requests = [];
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    requests.push({origin: url.origin, path: url.pathname, method: request.method()});
    if (url.origin !== origin) return route.abort();
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) return route.abort();
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      return route.fulfill({body: await fs.readFile(file), contentType: types[path.extname(file)] || 'application/octet-stream'});
    } catch { return route.fulfill({status: 404, body: 'missing'}); }
  });
  await page.goto(origin + routePath);
  await page.waitForLoadState('networkidle');
  const initialStorage = await page.evaluate(() => ({local: Object.keys(localStorage), session: Object.keys(sessionStorage)}));
  const theme = page.locator('[data-theme-toggle]').first();
  if (await theme.count()) await theme.click();
  if (routePath === '/news/') {
    await page.locator('.fav-btn').first().click();
    page.on('dialog', dialog => dialog.type() === 'prompt' ? dialog.accept('1') : dialog.accept());
    await page.locator('.flag-btn').first().click();
  }
  const storage = await page.evaluate(() => ({local: Object.keys(localStorage), session: Object.keys(sessionStorage)}));
  const cookies = await context.cookies();
  await info.attach('privacy-boundary.json', {body: JSON.stringify({route: routePath,
    scope: 'Local artifact; external requests recorded then blocked. No provider cookie/log or final-host claim.',
    requests, initialStorage, storage, cookieCount: cookies.length}, null, 2), contentType: 'application/json'});
  expect(requests.filter(r => r.origin !== origin).map(r => r.origin)).toEqual(
    requests.filter(r => r.origin !== origin && r.origin === 'https://fonts.googleapis.com').map(r => r.origin));
  expect(requests.every(r => r.method === 'GET')).toBe(true);
  expect(cookies).toEqual([]);
  expect(storage.session).toEqual([]);
  expect(storage.local.filter(key => !['kk-theme', 'news-favorites', 'news-flags'].includes(key))).toEqual([]);
  if (await theme.count()) expect(storage.local).toContain('kk-theme');
  if (routePath === '/news/') expect(storage.local).toEqual(expect.arrayContaining(['news-favorites', 'news-flags']));
  if (routePath === '/privacy.html') {
    await expect(page.locator('main')).toContainText('No analytics collector is enabled');
    await expect(page.locator('main')).toContainText('Google Fonts');
    await expect(page.locator('main a[href="mailto:hello@koltregaskes.com"]')).toHaveCount(1);
    await expect(page.locator('main a[href="mailto:contact@koltregaskes.com"]')).toHaveCount(1);
  }
});
