import {defineConfig} from '@playwright/test';
export default defineConfig({testDir: 'tests', testMatch: 'performance.spec.mjs',
  workers: 1, repeatEach: 3, retries: 0, timeout: 60000, reporter: 'list',
  use: {browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', serviceWorkers: 'block'}});
