# Dependency and redacted security evidence — 17 November 2026

For [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907), after local analytics verification.

Current npm audit against registry.npmjs.org reports **zero advisories** at every
severity. The adjacent JSON records timestamp and the exact lockfile SHA-256.
No dependency update is justified by that result; existing exact pins remain.

The existing Security launch checks workflow now proposes a Monday **08:20 UTC**
schedule (08:20 UK in winter, 09:20 in summer). Review stays with the existing
Claude launch operator through #1907; operator acknowledgement remains open.
Review npm advisories, direct/transitive updates, Actions/runtime pins and CDN
references weekly; changes need relevant build/test evidence and independent
review. This is the existing cloud workflow, not a laptop schedule or new alert
route. It takes effect only after reviewed merge. The #2020 runbook owner should
reconcile its older "no schedule" table after that merge; this PR leaves it alone.

Read-only CI receipt: [Security run 44097840570](https://github.com/koltregaskes/kols-korner/actions/runs/44097840570),
head `7f776780a0ca991a247280bb6e84366bd7cf21ca`, audit job `134089586012`:
dependency audit and redacted full-history scan **passed**. Only job/step status
metadata was read; secret-scan logs and values were not opened. That receipt does
not cover the later analytics/security commits or certify a generated artifact.

The same pinned Gitleaks 8.30.0 CI job now also builds and scans the public
artifact, using directory mode and 100% redaction. It refuses artifacts containing
`.env` or `.env.*` by filename before opening them. Scan output stays in runner
temporary storage; only passed/findings/scanner-error summaries reach logs. No
raw report is uploaded. Existing history exclusions remain unchanged. CLI modes
and redaction flags follow the [upstream documentation](https://github.com/gitleaks/gitleaks#usage).

Local Docker is installed but its Linux-engine pipe is unavailable. It was not
started or reconfigured, and no alternate credentials/runtime were used. New-head
history/artifact scan execution remains a CI check, not a local scan claim.

CI on the earlier links head also exposed a keyboard smooth-scroll race and About
sections that never became visible: the template omitted its existing animation
initializer. The About template now enables that initializer. The shared stylesheet
uses immediate scrolling while keyboard focus is visible. The route test scrolls
actual reveal sections into view and waits for their opacity, preserving contrast
assertions rather than forcing content visible. Relevant browser checks and full
Node tests are recorded with the PR; earlier CI failure remains historical evidence,
not waived. No excluded support-page template was changed.

No scanner reads of excluded environment files, secret-value inspection,
deployment, account/DNS/auth change, own merge or checklist tick occurred. This is
bounded advisory/scan evidence, not a full application security certification.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
