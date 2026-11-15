import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getSecurityHeaders, secureHtml } from '../scripts/meta-security.mjs';

const profileText = await fs.readFile('launch/security-profile.json', 'utf8');
const documentText = await fs.readFile('docs/HOSTING-SECURITY.md', 'utf8');
const profile = JSON.parse(profileText);
const valid = '<!doctype html><html><head><meta charset="utf-8">' + getSecurityHeaders() + '</head><body>Fixture</body></html>';
function check(args = []) {
  return spawnSync('python', ['scripts/check-meta-security.py', ...args], { encoding: 'utf8', timeout: 30000 });
}

test('every built page including privacy, 404 and legacy redirects carries its exact early meta policy', async () => {
  const result = check();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Meta security: [3-9]\d\d HTML files; 0 failures/);
  for (const name of ['privacy.html', '404.html', 'x-cards/ai-2026-timeline/index.html'])
    assert.ok((await fs.stat(path.join('site', name))).isFile());
});

test('missing-policy pass preserves existing policies, adds both independently and is idempotent', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kk-meta-build-'));
  const retained = '<meta http-equiv="Content-Security-Policy" content="custom retained policy">';
  await fs.writeFile(path.join(root, 'index.html'), '<html><head><meta charset="utf-8">' + retained + '</head><body></body></html>');
  await fs.writeFile(path.join(root, 'redirect.html'), '<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/"></head><body></body></html>');
  assert.deepEqual(await secureHtml(root), { pages: 2 });
  const home = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  assert.ok(home.includes(retained));
  assert.equal((home.match(/name="referrer"/g) || []).length, 1);
  const redirect = await fs.readFile(path.join(root, 'redirect.html'), 'utf8');
  assert.ok(redirect.indexOf('Content-Security-Policy') < redirect.indexOf('http-equiv="refresh"'));
  assert.deepEqual(await secureHtml(root), { pages: 0 });
});

const mutations = [
  ['valid control', html => html, null, null, 0],
  ['missing CSP', html => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')],
  ['missing referrer', html => html.replace(/<meta name="referrer"[^>]*>/, '')],
  ['drifted CSP', html => html.replace("object-src 'none'", "object-src 'self'")],
  ['duplicate CSP', html => html.replace('</head>', getSecurityHeaders() + '</head>')],
  ['late policy', html => html.replace('<meta charset="utf-8">', '<script src="/early.js"></script>')],
  ['policy nested in template', html => html.replace(getSecurityHeaders(), '<template>' + getSecurityHeaders() + '</template>')],
  ['commented-out policy', html => html.replace(getSecurityHeaders(), '<!--' + getSecurityHeaders() + '-->')],
  ['report-only substitution', html => html.replace('Content-Security-Policy', 'Content-Security-Policy-Report-Only')],
  ['drifted referrer', html => html.replace('strict-origin-when-cross-origin', 'unsafe-url')],
  ['document drift', html => html, null, text => text.replace('max-age=31536000', 'max-age=0')],
  ['HSTS preload', html => html, p => { p.host.proposedChange.rule.action_parameters.headers['Strict-Transport-Security'].value += '; preload'; }],
  ['approval claim', html => html, p => { p.host.approvedMitigation = 'approved'; }],
  ['response CSP drift', html => html, p => { p.host.proposedChange.rule.action_parameters.headers['Content-Security-Policy'].value = p.browserMeta.csp; }],
  ['empty coverage', () => null],
];
for (const [name, mutateHtml, mutateProfile, mutateDocument, expected = 1] of mutations) {
  test('meta admission: ' + name, async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kk-meta-admission-'));
    const site = path.join(root, 'site');
    await fs.mkdir(site);
    const html = mutateHtml(valid);
    if (html !== null) await fs.writeFile(path.join(site, 'fixture.html'), html);
    const p = structuredClone(profile);
    mutateProfile?.(p);
    const profileFile = path.join(root, 'profile.json'), docFile = path.join(root, 'HOSTING-SECURITY.md');
    await fs.writeFile(profileFile, JSON.stringify(p));
    await fs.writeFile(docFile, mutateDocument ? mutateDocument(documentText) : documentText);
    const result = check(['--site', site, '--profile', profileFile, '--document', docFile]);
    assert.equal(result.status, expected, result.stdout + result.stderr);
    if (expected) assert.match(result.stdout, /[1-9]\d* failures/);
  });
}
