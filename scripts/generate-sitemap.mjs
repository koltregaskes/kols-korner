// Standalone refresh shares page discovery and domain handling with the build.
import fs from 'node:fs/promises';
import { writeSitemap } from './seo.mjs';
const owner = process.env.GITHUB_OWNER || 'koltregaskes';
const repo = process.env.GITHUB_REPO || process.env.REPO_NAME || 'kols-korner';
const cname = (await fs.readFile('CNAME', 'utf8').catch(() => '')).trim();
const domain = (process.env.CUSTOM_DOMAIN || cname).trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
await writeSitemap(domain ? `https://${domain}` : `https://${owner}.github.io/${repo}`);
console.log('Generated sitemap from indexable public pages.');
