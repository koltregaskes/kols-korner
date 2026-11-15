# Hosting and security headers

## Protection today

Kol's Korner uses GitHub Pages. The supplied live observation checked on
15 November 2026 reports `Server: GitHub.com`, no security response headers and
no Cloudflare proxy. This task's permitted `curl.exe -sI --max-time 30
https://koltregaskes.com/` returned exit 1 with no headers. That recheck failed;
it does not independently confirm either header absence or deployed HTML.

GitHub Pages cannot set response headers from this repository. There is no
`_headers` deployment mechanism here. The build supplies enforced meta CSP and
`strict-origin-when-cross-origin` referrer metadata on every HTML file, including
privacy, 404, noindex pages and redirect stubs. These restrict resources,
ordinary inline scripts, plugins, base URLs and forms. Inline styles and broad
HTTPS images/media remain allowed. Meta CSP applies only after the browser
parses it, so it must precede scripts, styles, resource links and redirects.

Meta cannot provide HSTS, X-Frame-Options, frame-ancestors, MIME sniffing
protection or Permissions-Policy. HTTPS and live response headers are separate
acceptance checks. Do not describe the meta mitigation as equivalent to headers.
The existing home/news policies retain mailto form-action; news also retains
its fixed public `nonce-kk-jsonld`. That value is not a random per-response
nonce and gives no protection against injection that reuses it.

## Policy source and drift check

`launch/security-profile.json` is the source for the generated meta policy and
explicit preserved-page variants. The final build pass adds missing policies
without overwriting existing ones. Run `python scripts/check-meta-security.py`
after `node scripts/build.mjs`: it checks every built page, early direct-head
placement, duplicates, exact values, the proposal and this JSON example. It
fails on empty coverage. Existing policy drift requires a deliberate source
edit; it is not silently repaired by the build. No file in this repo applies
the Cloudflare proposal. `approvedMitigation` remains null.

## Exact change requiring Kol's yes

Recommendation: retain GitHub Pages and approve the proxy switch plus one
Cloudflare HTTP Response Header Modification Transform Rule below. Both are
**proposed only, not applied**. An authorised owner must inspect current zone
records and rules before applying it; this proposal is based on the supplied
hosting evidence and the Axy house pattern, not account readback.

In the existing Cloudflare zone, switch only the existing web records for
`koltregaskes.com` and `www.koltregaskes.com` from **DNS only (grey cloud)** to
**Proxied (orange cloud)**. Retain their existing Pages IP/CNAME targets and all
mail records. Do not proxy MX or mail hosts. If either web record is absent or
its target differs from the existing Pages setup, stop and revise the proposal
for review rather than inventing a record. Verify Pages custom-domain/TLS
compatibility and the current Cloudflare TLS mode with the owner before the
switch; any required TLS or other account change needs separate approval.

Add one rule named `Kol's Korner security headers` in
`http_response_headers_transform` (Rules / Transform Rules / Modify Response
Header; dashboard labels may vary). Use the exact expression below and six
**Set static** header operations. Preserve all existing rules; do not replace
the zone's ruleset. Check for later rules or managed settings that could
conflict. The `rule` object below is the copy-paste rule payload; the surrounding
fields describe the approval scope. `enabled: true` has no effect until an
authorised owner applies it. Capture the existing proxy/rule state first.

```json
{
  "status": "not applied; requires Kol's explicit approval",
  "proxySwitch": {
    "hostnames": [
      "koltregaskes.com",
      "www.koltregaskes.com"
    ],
    "from": "DNS only (grey cloud)",
    "to": "Proxied (orange cloud)",
    "preserve": "Existing Pages address/CNAME targets and all mail records; do not proxy MX or mail hosts"
  },
  "phase": "http_response_headers_transform",
  "rule": {
    "description": "Kol's Korner security headers (PROPOSED ONLY)",
    "expression": "(http.host eq \"koltregaskes.com\" or http.host eq \"www.koltregaskes.com\")",
    "action": "rewrite",
    "action_parameters": {
      "headers": {
        "X-Content-Type-Options": {
          "operation": "set",
          "value": "nosniff"
        },
        "X-Frame-Options": {
          "operation": "set",
          "value": "DENY"
        },
        "Referrer-Policy": {
          "operation": "set",
          "value": "strict-origin-when-cross-origin"
        },
        "Strict-Transport-Security": {
          "operation": "set",
          "value": "max-age=31536000"
        },
        "Permissions-Policy": {
          "operation": "set",
          "value": "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        },
        "Content-Security-Policy": {
          "operation": "set",
          "value": "default-src 'self'; script-src 'self' 'nonce-kk-jsonld'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https: data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; media-src 'self' https: blob:; object-src 'none'; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'none';"
        }
      }
    },
    "enabled": true
  }
}
```

The proposed response CSP is enforced, includes the preserved news variant
(to avoid breaking current permitted resources) and adds frame-ancestors none.
X-Frame-Options DENY agrees with it. HSTS is exactly `max-age=31536000`, with
neither includeSubDomains nor preload. Do not submit to a preload list. Even
plain HSTS remains cached by visitors for its max-age.

## Verify after the authorised change

Use normal TLS verification and record status, Location and every header value
with the real capture time. Example read-only PowerShell commands:

```powershell
curl.exe -sI --max-time 30 https://koltregaskes.com/
curl.exe -sI --max-time 30 https://koltregaskes.com/privacy.html
curl.exe -sI --max-time 30 https://koltregaskes.com/404.html
curl.exe -sI --max-time 30 https://koltregaskes.com/launch-header-probe-missing
curl.exe -sI --max-time 30 https://www.koltregaskes.com/
```

Also check one real legacy redirect path from the built output. Compare all six
headers with the JSON on successful HTML responses. Require one enforced CSP
with frame-ancestors none, DENY, nosniff, the exact referrer/permissions values
and HSTS without includeSubDomains/preload. Check actual 404 status and headers;
a custom 404 file returning 200 alone does not prove the error-response policy.
Record redirects separately and inspect each approved final destination.
Blank output, a non-zero curl exit, missing/duplicate headers or a Cloudflare
Server header alone cannot pass. A rule scoped to these two hosts does not
protect the github.io project URL.

When separately authorised to read the body, verify GET headers too and inspect
the actual HTML's matching meta policy before resources. Check fonts, images,
media, navigation and blocked framing in a browser. Offline checks do not prove
Cloudflare deployment, TLS renewal or current live bytes.

For an authorised rollback, restore only the captured web proxy states and
remove/disable only the new rule; preserve unrelated records and rules. Record
fresh readback. Disabling the rule or proxy does not clear cached HSTS. If HSTS
must be unwound, an approved HTTPS response with `max-age=0` helps revisiting
clients; others retain the previous expiry. No change is applied by this work.
