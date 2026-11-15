import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const REQUIRED_SECTIONS = [
  'Owner and escalation',
  'Deployment today',
  'Rollback without force-pushing',
  'Backup and recovery',
  'Failure alerts and response',
  'Pre-launch rehearsal',
  'Offline runbook check',
];

export async function checkOperations(root = process.cwd(), markdown) {
  const errors = [];
  if (markdown === undefined) {
    try { markdown = await fs.readFile(path.join(root, 'launch/OPERATIONS.md'), 'utf8'); }
    catch { return {references: 0, errors: ['Missing or unreadable launch/OPERATIONS.md']}; }
  }
  // Headings inside example fences do not count as runbook sections.
  const prose = markdown.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const title of REQUIRED_SECTIONS) {
    const heading = `## ${title}`;
    const start = prose.split(/\r?\n/).indexOf(heading);
    const lines = prose.split(/\r?\n/).slice(start + 1);
    const end = lines.findIndex(line => /^#{1,2} /.test(line));
    if (start < 0 || !lines.slice(0, end < 0 ? undefined : end).join('\n').trim()) {
      errors.push(`Missing or empty section: ${title}`);
    }
  }

  const references = new Set();
  // All local Markdown links are relative to this document, including paths
  // outside the usual code directories. Remote URLs and same-page anchors are not files.
  for (const match of markdown.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;
    let decoded;
    try { decoded = decodeURIComponent(target.split(/[?#]/)[0]); }
    catch { errors.push('Invalid encoded repository link'); continue; }
    references.add(path.resolve(root, 'launch', decoded));
  }
  // Also check unlinked paths in prose, inline code and command fences.
  // .local receipt paths are deliberately runtime outputs, not repo inputs.
  for (const match of markdown.matchAll(/(?<![\w./-])(?:\.github\/workflows|scripts|tests|launch|content|news-digests|site)\/[\w./-]*/g)) {
    references.add(path.resolve(root, match[0]));
  }
  // gh accepts workflow basenames; a typo in a command must fail too.
  for (const match of markdown.matchAll(/\bgh workflow run ([\w.-]+\.ya?ml)\b/g)) {
    references.add(path.resolve(root, '.github/workflows', match[1]));
  }
  const absoluteRoot = path.resolve(root);
  for (const reference of references) {
    const relative = path.relative(absoluteRoot, reference);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
      errors.push('Repository reference escapes the repo');
      continue;
    }
    try { await fs.stat(reference); }
    catch { errors.push(`Missing repository reference: ${relative.split(path.sep).join('/')}`); }
  }
  return {references: references.size, errors: [...new Set(errors)]};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await checkOperations();
  console.log(`Operations runbook: ${report.references} repository references; ${report.errors.length} failures.`);
  if (report.errors.length) {
    console.error(report.errors.join('\n'));
    process.exitCode = 1;
  }
}
