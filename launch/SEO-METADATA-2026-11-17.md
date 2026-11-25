# Distinct page metadata — 17 November 2026

SEO follow-up for [launch checklist #1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907).

The offline gate accepted the same HTML title or description on separate
indexable pages. It now compares decoded metadata after collapsing whitespace
and normalising case, rejects empty descriptions, and names both URLs when a
collision occurs. Redirects and noindex pages retain their existing exclusions.
No editorial text or public artifact is changed by this PR.

The regression was reproduced with a homepage title copied from About: the
previous checker passed; the changed checker rejected it. Seven added cases
cover exact, case/whitespace and entity-encoded collisions for both fields and
whitespace-only descriptions. Existing redirect fixtures remain green.

Local validation on the generated artifact:

- Build: 184 content items.
- SEO: 193 indexable pages/sitemap URLs, 20 RSS items, 177 redirects.
- Node suite: 149 tests passed, including 22 SEO tests.
- Internal targets: 372 HTML pages, 180 downloads/manifests, zero failures.
- All 220 committed digest downloads preserved; public-boundary, operations
  references and metadata-security checks passed.
- Full local browser suite: 1,150 passed using installed Edge (8.8 minutes),
  with intercepted local files and external requests blocked.

The build incorporates existing November 16 content and time-dependent news
output; those generated changes are excluded from this validation PR and retained
locally. Pinned test dependencies were installed with lifecycle scripts disabled.
The Node CLI fixture needs permission to write its existing sibling temporary
directory; the complete rerun passed with that permission.

SEO remains unticked. This is offline regression evidence, not final-host byte
parity, publication approval or launch acceptance. CI and independent review
remain for the reviewer. No deployment or account action was performed.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
