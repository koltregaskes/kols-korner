// Offline, metadata-only scanner. No network, environment lookup or secret-file reads.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const git = (...argv) => execFileSync('git', argv, {
  cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const slash = p => p.replaceAll('\\', '/');
const excluded = p => {
  const parts = slash(p).split('/');
  const name = parts.at(-1);
  return parts.some(s => /^(?:\.git|node_modules|\.ssh|\.aws|\.azure|\.gnupg|\.vercel|secrets?|credentials)$/i.test(s)) ||
    /^(?:\.env(?:\..*)?|\.envrc|.*\.env(?:\..*)?|\.npmrc|\.netrc|\.git-credentials|credentials(?:\..*)?|secrets?(?:\..*)?|id_(?:rsa|dsa|ecdsa|ed25519)(?:\..*)?)$/i.test(name) ||
    /^(?:keys?|.*(?:private[-_]?key|service[-_]?account|api[-_]?keys?|keyfile).*)\.json$/i.test(name) ||
    /\.(?:pem|key|p8|p12|pfx|jks|keystore|kdbx|der|crt|cer)$/i.test(name);
};
const patterns = [
  ['aws-access-key', /\b(?:AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}\b/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{50,255})\b/g],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,255}\b/g],
  ['slack-webhook', /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]{20,255}/g],
  ['stripe-secret', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,255}\b/g],
  ['openai-token', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,255}\b/g],
  ['anthropic-token', /\bsk-ant-[A-Za-z0-9_-]{20,255}\b/g],
  ['google-api-key', /\bAIza[A-Za-z0-9_-]{35}\b/g],
  ['google-oauth-token', /\bya29\.[A-Za-z0-9_-]{20,512}\b/g],
  ['google-oauth-client-secret', /\bGOCSPX-[A-Za-z0-9_-]{20,255}\b/g],
  ['azure-storage-key', /\bAccountKey=([A-Za-z0-9+/]{64,}={0,2})/g, 1],
  ['private-key', /-----BEGIN (?:(?:[A-Z0-9]+ )?PRIVATE KEY|PGP PRIVATE KEY BLOCK)-----/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{8,}\b/g],
  ['credential-url', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:([^\s/@]{8,})@/gi, 1],
  ['credential-assignment', /["'`]?\b(?:[A-Za-z_][\w.-]*(?:key|secret|token|password|passwd|pwd)[\w.-]*|key|secret|token|password|passwd|pwd)["'`]?\s*[:=]\s*["'`]?([^\s"'`<>;,}\])]{16,})/gi, 1],
  ['credential-query', /[?&](?:api[_-]?key|access[_-]?token|secret|token|password)=([^\s&"'<>]{16,})/gi, 1],
];

function entropy(value) {
  const counts = new Map();
  for (const c of value) counts.set(c, (counts.get(c) || 0) + 1);
  return [...counts.values()].reduce((h, n) => h - n / value.length * Math.log2(n / value.length), 0);
}

function classify(type, value, line, p) {
  const syntheticBody = value.replace(/^(?:gh[pousr]_|github_pat_|sk-(?:proj-|svcacct-)?)/, '');
  const sequences = ['0123456789', '1234567890', '0123456789abcdef',
    '0123456789abcdefghijklmnopqrstuvwxyz', '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 'abcdefghijklmnopqrstuvwxyz0123456789',
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  if (syntheticBody.length >= 16 && sequences.some(s => s.repeat(100).startsWith(syntheticBody))) {
    return ['test', 'Entire credential body is a deterministic repeated alphabet/digit sequence used as synthetic test data.'];
  }
  if (['credential-url', 'credential-assignment'].includes(type) && p.endsWith('publish-routed-news.test.mjs') &&
      /^(?:(?:top|very|super|not|a|real|some|my|hidden|secret|token|redacted|credential|value|sensitive)[-_!.*]*){1,8}$/i.test(value.split('@')[0])) {
    return ['test', 'Synthetic English-label password in the publisher credential-redaction test; paired with a deterministic fake GitHub token.'];
  }
  if (type === 'openai-token' && /^sk-(?:hynix|telecom)-(?:[a-z0-9]+-)*[a-z0-9]+$/i.test(value)) {
    return ['false positive', 'SK Hynix or SK Telecom company-name news slug; the generic legacy OpenAI prefix overlaps that name.'];
  }
  // A URL path containing a model/news slug is not an API credential.
  if (type === 'openai-token' && /https?:\/\//i.test(line) &&
      /(?:^|[-/])sk-[a-z]+(?:-[a-z]+){2,}/.test(value) &&
      value === value.toLowerCase()) {
    return ['false positive', 'Lower-case hyphenated news/model URL slug, not a credential format.'];
  }
  if (/^(?:YOUR[_-]|your[_-]|example[_-]|placeholder[_-]|dummy[_-]|fake[_-])/i.test(value) ||
      /^(?:sk-|ghp_|xoxb-)?(?:[xX0]{16,}|test(?:[_-]?test){4,})$/.test(value)) {
    return ['test', 'Explicit placeholder or repeated synthetic value.'];
  }
  if (type === 'jwt' || type === 'credential-query') {
    try {
      const claims = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
      if ((claims.iss === 'github.com' || claims.iss === 'https://github.com') &&
          (claims.aud === 'raw.githubusercontent.com' || claims.aud === 'https://raw.githubusercontent.com') &&
          /https:\/\/(?:[\w.-]+\.)?githubusercontent\.com\//.test(line)) {
        return ['false positive', 'GitHub public-image signed URL; JWT issuer/audience bind it to raw image delivery, not an account API credential.'];
      }
      if (claims.role === 'anon' && /supabase/i.test(line) && /publishable|anon/i.test(line)) {
        return ['false positive', 'Explicit public Supabase anonymous client token; not a privileged service-role credential.'];
      }
    } catch { /* Do not expose decoding errors or payloads. */ }
  }
  if (type === 'credential-assignment' && /^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) {
    return ['false positive', 'Supabase explicitly publishable browser key, not a secret service-role key.'];
  }
  if (type === 'credential-assignment' && value.includes('${')) {
    return ['false positive', 'JavaScript template expression constructing a value, not a literal credential.'];
  }
  if (type === 'credential-assignment' && /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+\(/.test(value)) {
    return ['false positive', 'JavaScript method-call expression computing a value, not a literal credential.'];
  }
  if (type === 'credential-assignment' && /^(?:https?:\/\/|process\.|import\.|\$\{|\$\(|secrets\.|vars\.|[A-Za-z_][\w]*\()/.test(value)) {
    return ['false positive', 'URL, source expression or configuration reference rather than a literal credential.'];
  }
  if (type === 'aws-access-key' && /https:\/\/(?:[\w.-]+\.)?githubusercontent\.com\//.test(line) && /[?&](?:X-Amz-Credential|AWSAccessKeyId)=/i.test(line)) {
    return ['false positive', 'Access identifier in a signed public-image URL; no AWS secret access key is supplied.'];
  }
  return ['real', 'Potential real credential; validity unverified. Stop and obtain private owner review without revealing the value.'];
}

function inspect(text, p, location, emit) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const seen = new Set();
    for (const [type, regex, group = 0] of patterns) {
      regex.lastIndex = 0;
      for (const match of line.matchAll(regex)) {
        const value = match[group];
        if ((type === 'credential-assignment' || type === 'credential-query') && entropy(value) < 3.5) continue;
        const key = `${type}:${match.index}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const [classification, reason] = classify(type, value, line, p);
        emit({ ...location, file: p, line: i + 1, pattern: type, classification, reason });
      }
    }
  }
}

function selfTest() {
  const sample = 'Ab9qR7mN2vX4zH6jK8pL1cD3eF5gT0sW';
  const tests = [
    ['aws-access-key', 'AK' + 'IA' + sample.toUpperCase().slice(0, 16)],
    ['github-token', 'gh' + 'p_' + (sample + sample).slice(0, 36)],
    ['github-token', 'github_' + 'pat_' + sample + sample],
    ['slack-token', 'xo' + 'xb-' + sample],
    ['slack-webhook', 'https://hooks.' + 'slack.com/services/' + sample],
    ['stripe-secret', 'sk_' + 'live_' + sample],
    ['openai-token', 'sk' + '-proj-' + sample],
    ['anthropic-token', 'sk' + '-ant-api03-' + sample],
    ['google-api-key', 'AI' + 'za' + (sample + sample).slice(0, 35)],
    ['google-oauth-token', 'ya' + '29.' + sample],
    ['google-oauth-client-secret', 'GOC' + 'SPX-' + sample],
    ['azure-storage-key', 'Account' + 'Key=' + sample + sample],
    ['private-key', '-----BEGIN ' + 'RSA PRIVATE KEY-----'],
    ['jwt', 'ey' + 'JhbGciOiJIUzI1NiJ9.' + 'ey' + 'JzdWIiOiJzY2FubmVyLXRlc3QifQ.' + sample],
    ['credential-assignment', 'access_' + 'token = "' + sample + '"'],
    ['credential-query', 'https://example.invalid/?access_' + 'token=' + sample],
    ['credential-url', 'postgres://user:' + sample + '@example.invalid/db'],
  ];
  for (const [expected, text] of tests) {
    const found = [];
    inspect(text, 'synthetic.txt', { scope: 'self-test', commit: null }, r => found.push(r.pattern));
    if (!found.includes(expected)) throw new Error('Self-test detection failed');
  }
  for (const p of ['.env', '.env.local', 'a/.env.production', 'a/private.key', 'a/id_rsa', '.aws/credentials', '.npmrc']) {
    if (!excluded(p)) throw new Error('Self-test exclusion failed');
  }
  const rows = [];
  inspect('gh' + 'p_' + (sample + sample).slice(0, 36), 'synthetic.txt', { scope: 'self-test', commit: null }, r => rows.push(r));
  if (rows.length !== 1 || rows[0].classification !== 'real' || JSON.stringify(rows).includes(sample)) throw new Error('Redaction or stop classification failed');
  if (classify('credential-assignment', '${generatedTopic}', '', 'sample.mjs')[0] !== 'false positive') throw new Error('Template classification failed');
  if (classify('github-token', 'gh' + 'p_' + '0123456789'.repeat(4), '', 'sample.test.mjs')[0] !== 'test') throw new Error('Synthetic classification failed');
  return { detectionCases: tests.length, exclusionCases: 7, classificationCases: 3, redactionCases: 1, result: 'passed' };
}

function walk(dir, relative, scope, state, emit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = slash(path.join(relative, entry.name));
    if (excluded(p)) {
      if (!entry.isDirectory()) state.excluded.push({ scope, file: p, reason: 'Environment, key or credential-store path; never opened.' });
      continue;
    }
    if (entry.isSymbolicLink()) {
      state.links.push({ scope, file: p, reason: 'Symbolic link not followed.' });
      continue;
    }
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, p, scope, state, emit);
    else if (entry.isFile()) {
      const data = fs.readFileSync(absolute);
      state.files++;
      state.bytes += data.length;
      state.hashes.push([p, crypto.createHash('sha256').update(data).digest('hex')]);
      // Latin-1 preserves ASCII token bytes even in binary downloads/media.
      inspect(data.toString('utf8'), p, { scope, commit: null }, emit);
      if (data.includes(0)) inspect(data.toString('latin1'), p, { scope, commit: null, encoding: 'binary-ascii' }, emit);
    }
  }
}

function main() {
  const controls = selfTest();
  if (args.includes('--self-test')) {
    console.log(JSON.stringify(controls));
    return;
  }
  const scopeArg = args.find(a => a.startsWith('--scope='));
  const scopes = scopeArg ? scopeArg.slice(8).split(',') : ['working-tree', 'history', 'site'];
  if (scopes.some(s => !['working-tree', 'history', 'site'].includes(s))) throw new Error('Invalid scope');
  const head = git('rev-parse', 'HEAD').trim();
  const result = { head, controls, scopes: {}, candidates: [], stopped: false, historyComplete: false };
  const seen = new Set();
  const emit = row => {
    const key = [row.scope, row.file, row.line, row.commit, row.pattern].join(':');
    if (seen.has(key)) return;
    seen.add(key);
    result.candidates.push(row);
    if (row.classification === 'real') {
      result.stopped = true;
      throw new Error('CANDIDATE_STOP');
    }
  };
  try {
    for (const scope of scopes) {
      const state = { files: 0, bytes: 0, excluded: [], links: [], hashes: [] };
      result.scopes[scope] = state;
      if (scope === 'history') {
        if (git('rev-parse', '--is-shallow-repository').trim() !== 'false') throw new Error('Shallow history');
        const commits = git('rev-list', '--all').trim().split('\n').filter(Boolean);
        const blobs = new Map();
        state.commits = commits.length;
        state.treeEntries = 0;
        state.commitObjectsScanned = 0;
        const messages = git('log', '--all', '--format=%H%x00%B%x00').split('\0');
        const messageCommits = new Set();
        for (let i = 0; i + 1 < messages.length; i += 2) {
          const commit = messages[i].trim();
          if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid commit record');
          inspect(messages[i + 1], '(commit message)', { scope, commit }, emit);
          messageCommits.add(commit);
          state.commitObjectsScanned++;
        }
        if (messageCommits.size !== commits.length || commits.some(c => !messageCommits.has(c))) throw new Error('Incomplete commit messages');
        for (const commit of commits) {
          for (const record of git('ls-tree', '-rz', '--full-tree', commit).split('\0').filter(Boolean)) {
            const match = /^(\d+) (\w+) ([a-f0-9]+)\t([\s\S]*)$/.exec(record);
            if (!match) throw new Error('Invalid tree record');
            const [, mode, kind, blob, p] = match;
            state.treeEntries++;
            if (excluded(p)) {
              if (!state.excluded.some(x => x.file === p)) state.excluded.push({ scope, file: p, commit, reason: 'Environment, key or credential-store path; blob never opened.' });
              continue;
            }
            if (mode === '120000' || kind !== 'blob') {
              if (!state.links.some(x => x.file === p)) state.links.push({ scope, file: p, commit, reason: 'Symbolic link or submodule not followed.' });
              continue;
            }
            // Deduplicate identical file versions. Every commit tree is still enumerated.
            const key = `${blob}:${p}`;
            if (!blobs.has(key)) blobs.set(key, { blob, p, commit });
          }
        }
        const versions = [...blobs.values()];
        state.uniqueVersions = versions.length;
        for (let start = 0; start < versions.length; start += 32) {
          const batch = versions.slice(start, start + 32);
          const output = execFileSync('git', ['cat-file', '--batch'], {
            cwd: root, input: batch.map(x => x.blob).join('\n') + '\n',
            maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
          });
          let offset = 0;
          for (const { blob, p, commit } of batch) {
            const end = output.indexOf(10, offset);
            const header = output.subarray(offset, end).toString('ascii').split(' ');
            const size = Number(header[2]);
            if (header[0] !== blob || header[1] !== 'blob' || !Number.isSafeInteger(size) || size < 0) throw new Error('Invalid batch record');
            const data = output.subarray(end + 1, end + 1 + size);
            if (data.length !== size || output[end + 1 + size] !== 10) throw new Error('Truncated batch record');
            offset = end + size + 2;
            state.files++;
            state.bytes += size;
            inspect(data.toString('utf8'), p, { scope, commit }, emit);
            if (data.includes(0)) inspect(data.toString('latin1'), p, { scope, commit, encoding: 'binary-ascii' }, emit);
          }
          if (offset !== output.length) throw new Error('Extra batch data');
        }
        result.historyComplete = true;
      } else {
        const dir = scope === 'site' ? path.join(root, 'site') : root;
        if (!fs.existsSync(dir)) throw new Error('Missing scope directory');
        walk(dir, scope === 'site' ? 'site' : '', scope, state, emit);
        if (!state.files) throw new Error('Empty scope');
        state.manifestSha256 = crypto.createHash('sha256').update(JSON.stringify(state.hashes.sort((a, b) => a[0].localeCompare(b[0])))).digest('hex');
      }
      delete state.hashes;
    }
  } catch (error) {
    if (error.message !== 'CANDIDATE_STOP') {
      // Never include child-process stderr, source text, candidate or error values.
      result.failure = 'Scanner operation failed; no clean result. Check file permissions, Git availability and scope completeness.';
      process.exitCode = 1;
    } else process.exitCode = 2;
  }
  for (const state of Object.values(result.scopes)) delete state.hashes;
  result.counts = { candidates: result.candidates.length, real: 0, test: 0, 'false positive': 0 };
  for (const row of result.candidates) result.counts[row.classification]++;
  result.status = result.stopped ? 'STOP: potential real credential' : result.failure ? 'FAILED' : 'completed; no potential real credentials detected';
  console.log(JSON.stringify(result, null, 2));
}

try { main(); } catch {
  console.log(JSON.stringify({ status: 'FAILED', failure: 'Scanner setup or self-test failed; details withheld.' }));
  process.exitCode = 1;
}
