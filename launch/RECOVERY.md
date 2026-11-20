# Recovery and monitoring

Operator: Claude, existing Kol's Korner operations owner. Escalation and failure route: private hub [#517](https://github.com/koltregaskes/rooms-os-hub/issues/517), then Chief [#1973](https://github.com/koltregaskes/rooms-os-hub/issues/1973). Never create public failure issues. Telegram/Discord stay off. Existing Neon alerts migration is [#1886](https://github.com/koltregaskes/rooms-os-hub/issues/1886); its rendered delivery is not accepted. No new account, webhook or credential is introduced.

Run `node scripts/monitor-launch.mjs launch/launch-pack.json REPORT.json` from the existing Chief check, alongside the existing 06:30 freshness workflow. Exit 1 means failure or unavailable evidence. The report checks HTTPS uptime, public feed age and latest main workflow outcomes, including missing/stalled scheduled runs and failed deployments. The Chief relays `alert.comment` using its existing private GitHub connector to `alert.destination`, reads the comment back, and records actual operator receipt and recovery. A report file or comment alone is not a received alert. **Automatic ingestion into the existing alerts route and named recipient receipt remain blocked on the route owner; do not add a token to this public repo.** The monitor cannot detect its own missing invocation: the existing Chief must check its expected receipt daily. No new laptop timer.

## Last good build

1. Preserve failed run URL/head, last successful deployment run/head/attempt and its artifact. Do not overwrite current content or retry a permission refusal.
2. Select the last accepted artifact, not merely the newest green build. GitHub Pages artifacts expire after one day: retain each approved release through the existing backup owner before expiry. Record SHA-256, file count and location privately. See OPERATIONS.md for download and public-byte commands.
3. On Cloudflare, after Kol has authorised the first launch, the existing operator selects the previous successful **production** deployment and Rollback. Do not use a preview as a production rollback target. For GitHub Pages use the reviewed revert PR procedure in OPERATIONS.md. Never force-push or reset main.
4. Run `node scripts/accept-host.mjs https://koltregaskes.com/ RECEIPT.json` and `node scripts/check-live.mjs RETAINED_ARTIFACT https://koltregaskes.com/`. Require exact bytes and final-host checks. Preserve newer content and input data. Record recovery on #1907/#2020; Claude accepts duties separately.

## Content and data restore

Run `node scripts/rehearse-backup.mjs` into a new isolated directory. It archives only allowlisted committed release inputs and refuses env/key paths and symlinks before opening content. Retain source.tar, manifest.json and receipt.json. Compare every restored Git blob and the archive SHA-256. Rebuild in the restored directory; run digest preservation with the manifest, SEO, internal links and public-boundary checks. Historical feeds may correctly fail freshness; never change timestamps to pass. For a single damaged file, recover from the selected reviewed commit on a recovery branch, review differences, then PR. No server database exists here; reader favourites are browser-local. Provider settings and external routing config require their existing owners' non-secret exports. This laptop snapshot is not an independent backup: off-site retention remains open.

## Local rollback drill

After the backup rehearsal, run `node scripts/drill-rollback.mjs .local/backup-rehearsal-XXXX/restored`. It builds the actual restored site, saves the known-good homepage, introduces a harmless marker, proves its hash changed, preserves that version, rolls back, and requires the original hash. No port, server, production mutation or deletion. Keep both receipts; this tests local build recovery, not provider rollback or seven days of refresh delivery.

Codex, Gaming-Laptop, via T3 Code Chief of Staff
