"""Offline policy admission check. No network or third-party dependencies."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path


class PagePolicy(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.csp = []
        self.referrer = []
        self.errors = []
        self.heads = 0
        self.resource_seen = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'head':
            self.heads += 1
        equiv = a.get('http-equiv', '').lower()
        referrer = tag == 'meta' and a.get('name', '').lower() == 'referrer'
        policy = tag == 'meta' and equiv == 'content-security-policy'
        if policy or referrer:
            if self.stack != ['html', 'head']:
                self.errors.append('policy must be a direct child of head')
            if self.resource_seen:
                self.errors.append('policy must precede scripts, styles, links and refresh')
            if len(attrs) != len(a):
                self.errors.append('duplicate policy attributes')
            (self.csp if policy else self.referrer).append(a.get('content'))
        if equiv in ('content-security-policy-report-only', 'x-frame-options',
                     'strict-transport-security', 'x-content-type-options', 'permissions-policy'):
            self.errors.append('unsupported meta response-header claim')
        if tag in ('script', 'style', 'link', 'iframe', 'img') or equiv == 'refresh':
            self.resource_seen = True
        if tag not in ('meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'wbr', 'area', 'base', 'embed', 'param', 'track', 'col'):
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]


def check_page(html, csp, referrer):
    parser = PagePolicy()
    parser.feed(html)
    errors = parser.errors
    if parser.heads != 1:
        errors.append('expected one head')
    if parser.csp != [csp]:
        errors.append('missing, duplicate or drifted CSP')
    if parser.referrer != [referrer]:
        errors.append('missing, duplicate or drifted referrer')
    return errors


def check_contract(profile, document):
    host, meta = profile['host'], profile['browserMeta']
    proposal = host['proposedChange']
    rule = proposal['rule']
    headers = rule['action_parameters']['headers']
    assert host['provider'] == 'github-pages' and host['repositoryCanSetResponseHeaders'] is False
    assert host['approvedMitigation'] is None, 'proposal must not imply approval'
    assert proposal['status'] == "not applied; requires Kol's explicit approval"
    assert host['currentPolicy']['cloudflareProxy'] is False
    assert host['currentPolicy']['securityResponseHeadersObserved'] == []
    assert proposal['phase'] == 'http_response_headers_transform'
    assert proposal['proxySwitch']['hostnames'] == ['koltregaskes.com', 'www.koltregaskes.com']
    assert rule['expression'] == '(http.host eq "koltregaskes.com" or http.host eq "www.koltregaskes.com")'
    assert rule['action'] == 'rewrite' and rule['enabled'] is True
    assert set(headers) == set(host['responseHeaders'])
    assert all(h['operation'] == 'set' for h in headers.values())
    assert headers['Strict-Transport-Security']['value'] == 'max-age=31536000', 'HSTS scope drift'
    assert headers['X-Frame-Options']['value'] == 'DENY'
    assert headers['X-Content-Type-Options']['value'] == 'nosniff'
    assert headers['Referrer-Policy']['value'] == meta['referrer'] == 'strict-origin-when-cross-origin'
    assert headers['Permissions-Policy']['value'] == 'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    assert meta['overrides'] == {
        'index.html': meta['csp'].replace("form-action 'self';", "form-action 'self' mailto:;"),
        'news/index.html': meta['csp'].replace("form-action 'self';", "form-action 'self' mailto:;").replace("script-src 'self';", "script-src 'self' 'nonce-kk-jsonld';")
    }, 'preserved-page policy drift'
    directives = dict((d.strip().split(maxsplit=1) + [''])[:2] for d in meta['csp'].split(';') if d.strip())
    assert directives['script-src'] == "'self'"
    assert directives['object-src'] == "'none'"
    assert directives['base-uri'] == directives['form-action'] == "'self'"
    assert 'frame-ancestors' not in directives, 'framing is response-only'
    assert headers['Content-Security-Policy']['value'] == meta['overrides']['news/index.html'] + " frame-ancestors 'none';"
    blocks = document.split('```json\n')
    assert len(blocks) == 2, 'expected one copy-paste JSON proposal'
    assert json.loads(blocks[1].split('```')[0]) == proposal, 'documented proposal drift'


def check(site, profile_path, document_path):
    profile = json.loads(Path(profile_path).read_text(encoding='utf-8'))
    errors = []
    try:
        check_contract(profile, Path(document_path).read_text(encoding='utf-8'))
    except (AssertionError, KeyError, ValueError) as error:
        errors.append('contract/document: ' + (str(error) or 'policy drift'))
    files = sorted(p for p in Path(site).rglob('*') if p.is_file() and p.suffix.lower() == '.html')
    if not files:
        errors.append('no HTML files checked')
    meta = profile['browserMeta']
    for file in files:
        name = file.relative_to(site).as_posix()
        expected = meta['overrides'].get(name, meta['csp'])
        errors.extend(name + ': ' + e for e in check_page(file.read_text(encoding='utf-8'), expected, meta['referrer']))
    return len(files), errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', default='site')
    parser.add_argument('--profile', default='launch/security-profile.json')
    parser.add_argument('--document', default='docs/HOSTING-SECURITY.md')
    args = parser.parse_args()
    count, errors = check(args.site, args.profile, args.document)
    print(f'Meta security: {count} HTML files; {len(errors)} failures; profile and documented proposal checked.')
    for error in errors:
        print(error)
    raise SystemExit(1 if errors else 0)
