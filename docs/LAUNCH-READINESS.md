# Launch Readiness

Verified: 2026-05-05

## Draft Triage

Decision: park the Alibaba/Qwen draft and exclude it from launch.

Evidence:
- The draft lives in `.local/blocked-drafts/2026-04-26-launch-blockers/2026-04-22-alibaba-drops-qwen-3-6-max-previewits-most-powerful-model-yet.md`.
- Its frontmatter is already `publish: false` with `status: needs_changes`.
- `node scripts/build.mjs` completed on 2026-05-05 and did not publish that draft into `site/`.

Reason:
- The draft still says the packet needs more corroboration before it becomes publishable.
- Parking it keeps the launch surface clean without deleting potentially useful source material.

Next review trigger:
- Revisit only if a refreshed source packet or a stronger editorial angle makes it publishable.
