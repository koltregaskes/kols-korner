import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'launch.spec.mjs',globalTimeout:280000,fullyParallel:true,workers:8,retries:0,timeout:60000,use:{browserName:'chromium',serviceWorkers:'block'},reporter:'list'});

