# Owned analytics verification — 17 November 2026

For [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907), reusing
[#1498](https://github.com/koltregaskes/rooms-os-hub/issues/1498),
[#367](https://github.com/koltregaskes/rooms-os-hub/issues/367) and their existing
implementation child [#1859](https://github.com/koltregaskes/rooms-os-hub/issues/1859).

**Acceptance blocked: the owned handler counts all three bot probes.**

Read the existing local website-tools clone at
`d27e5c5adac9aa8402e8df8f35021e0d1b2e37cd`; its source remains unchanged.
The optional verification command requires that exact clean owner revision:

```text
node scripts/verify-owned-analytics.mjs /path/to/existing/website-tools report.json
```

It imports the actual owned client, policy, handler and synthetic memory adapter;
it does not copy or replace them. Source hashes are retained in the JSON receipt.
Every browser request is intercepted locally, including the two reserved .invalid
origins. No server, public endpoint, database, account or deployment is created.

Verified with installed Edge:

- One browser button click invoked the owned client, made one POST through the
  local bridge to the actual handler and incremented the aggregate from zero to
  one. This is a browser-generated test event using the existing demo allowlist,
  not production traffic or a durable/platform event.
- No Cookie/Referer header or new cookie; cookie/local/session-storage access
  throws in the fixture. Actual browser navigator GPC/DNT overrides, explicit
  opt-out and disabled client cause no further sends or writes. Server privacy
  headers also cause no writes. Production entrypoint remains disabled (503).
- Synthetic Googlebot, GPTBot and HeadlessChrome requests each returned 204 and
  each added one count. Bot filtering therefore **failed**. The verifier exits
  **2** for this acceptance blocker rather than reporting green.
- The existing owner's 20 Node tests passed. This repo's build and all 155 Node
  tests passed; those suites do not prove bot filtering or hosted acceptance.

Smallest next action: the existing #1859 owner defines and implements an admitted
bot classification/exclusion contract, then this same verifier is reconciled to
the reviewed successor SHA and repeated. No UA is stored by the current adapter,
but omitting UA retention does not establish filtering. Do not add a parallel
collector or count our local probes as human traffic.

Workerd, durable adapter/SQL and same-period Cloudflare comparison remain
unverified; no Cloudflare account is accessed. Site wiring and public activation
remain gated. No privacy/legal/support page or checklist tick was changed.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
