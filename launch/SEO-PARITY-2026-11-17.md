# Deployed SEO parity — 17 November 2026

Checklist: [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907).

Downloaded the exact `github-pages` artifact from successful Pages run
[44079160396, attempt 1](https://github.com/koltregaskes/kols-korner/actions/runs/44079160396),
source `5428e53fc87a67a80c848c51dfeae009479604b2`. No deployment was requested.

The artifact passes the current offline SEO gate: 193 canonical indexable pages,
193 sitemap URLs, 20 RSS items and 177 redirects, including real PNG validation,
JSON-LD, robots and llms discovery checks. `SEO_SITE_DIR` now permits validation
of the downloaded artifact without substituting a local rebuild.

Public readback at `https://koltregaskes.com/` matched **all 653 artifact files**:
zero mismatches and zero unverified. The adjacent JSON receipt records timestamp,
per-file expected/actual SHA-256, HTTP status and final URL. The checker now
rejects cross-origin redirects even when bytes match, and retains its HTTPS,
network-error and deadline failure handling. Five parity regression tests pass.

This receipt establishes parity for that deployed release at the recorded time.
It does not establish public parity for unmerged PR #66 or this follow-up, nor
approve a future deployment or certify a new final host. Repeat the same checks
for the accepted launch artifact. No checklist tick was changed.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
