import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const { browserMeta } = JSON.parse(readFileSync(new URL('../launch/security-profile.json', import.meta.url), 'utf8'));
export function getSecurityHeaders() {
  return `\n  <meta http-equiv="Content-Security-Policy" content="${browserMeta.csp}">\n  <meta name="referrer" content="${browserMeta.referrer}">`;
}

// Carry #34's missing-policy mitigation through the final build pass. Existing
// policies are retained, then checked for drift by check-meta-security.py.
export async function secureHtml(root = 'site') {
  let pages = 0;
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.html$/i.test(entry.name)) {
        const html = await fs.readFile(file, 'utf8');
        let additions = '';
        if (!/http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(html))
          additions += `\n  <meta http-equiv="Content-Security-Policy" content="${browserMeta.csp}">`;
        if (!/name\s*=\s*["']referrer["']/i.test(html))
          additions += `\n  <meta name="referrer" content="${browserMeta.referrer}">`;
        if (additions) {
          if (!/<head\b[^>]*>/i.test(html)) throw new Error('Missing head: ' + file);
          // Keep the encoding declaration first where present.
          const updated = html.replace(/(<head\b[^>]*>\s*(?:<meta\s+charset\s*=[^>]+>)?)/i, '$1' + additions);
          await fs.writeFile(file, updated);
          pages++;
        }
      }
    }
  }
  await walk(root);
  return { pages };
}
