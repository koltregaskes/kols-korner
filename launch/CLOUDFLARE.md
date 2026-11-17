# Final host preparation

Candidate: Cloudflare Pages static hosting in Kol's existing account. Nothing provisioned or applied. Existing GitHub Pages continues until Kol approves cutover. The earlier proxy-only alternative in docs/HOSTING-SECURITY.md remains historical advice, not an instruction to apply both approaches. This pack prepares the requested Pages option without changing that decision.

Use `launch/cloudflare.json` as the exact dashboard settings sheet. It is not a provider API payload. Repository: `koltregaskes/kols-korner`; production branch main; framework None; root repository root; output `.local/cloudflare-site`; build command and non-secret version/domain fields are in the JSON. No Functions, database, secret variables or paid feature is required. Do not copy existing GitHub secret bindings. The stage excludes the GitHub CNAME file, adds `_headers` from the existing security proposal, and redirects www to the apex. A root 404.html is included. `_headers` is only active when the candidate is deployed to Cloudflare; GitHub Pages does not apply it.

## Exact proposed DNS changes, for Kol only

**Gate:** `kols-korner.pages.dev` is the requested project hostname, not a verified allocated hostname. Kol must confirm the exact assigned hostname in his existing Cloudflare account. If unavailable, revise this table before approval. Do not invent DNS IP addresses. Capture existing records first, including web A/AAAA/CNAME, mail and TTLs; leave MX, TXT, SPF, DKIM, DMARC, mail forwarding and hello@ untouched. Any existing conflicting web records need Kol's named replacement approval, never agent deletion.

| Type | Name | Target, conditional on confirmed project hostname | Proxy | TTL | Action |
|---|---|---|---|---|---|
| CNAME | @ (`koltregaskes.com`) | `kols-korner.pages.dev` | Proxied | Auto | Kol associates apex in Pages Custom domains, reviews generated flattened CNAME and approves replacing only conflicting web records |
| CNAME | www (`www.koltregaskes.com`) | `kols-korner.pages.dev` | Proxied | Auto | Kol associates www in Pages Custom domains, approves web target; staged redirect sends it to apex |

An apex requires the zone to use Cloudflare nameservers in the same account. Current account/zone/nameservers have not been inspected. If that prerequisite is absent, stop for a separately reviewed nameserver plan; do not treat this table as a complete zone migration. Associate each hostname in Pages **before** pointing a CNAME at it, otherwise Cloudflare documents a 522 failure. [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Launch and recovery

1. Review this PR and all required checks. Have Claude select the frozen commit, retain its exact artifact/input archive and record SHA-256, counts, current host/DNS and last good run on #1907. Privacy/legal/support is separate #2020 part 3.
2. Kol signs in himself in Edge. Agents stop at the sign-in screen and never enter credentials, accept terms, create accounts or connect OAuth. Kol checks whether the project and Git integration already exist; any new authorisation is his action.
3. Kol approves the exact first public Pages deployment, including the pages.dev URL. Use the JSON settings. Do not click Save and Deploy beforehand: a preview is also a public deployment. No first-deploy approval is implied by a merged PR.
4. Capture deployment URL/head/build log. Run final-host acceptance on the assigned pages.dev URL with canonicalOrigin still set to the final apex; require all checks. Retain staged manifest and compare public artifact bytes with `check-live.mjs`. Cloudflare extensionless HTML redirects may require a route-aware parity review; never call a mismatch a pass. Preview noindex is deliberate.
5. Only after preview acceptance, Kol approves and performs the exact DNS table. Observe HTTPS issuance, apex/www redirect chain, headers including real 404 and canonical/feed/robots readback. Rerun acceptance and exact artifact parity. Check contact mail via its existing owner; outside mail sends require their own approval.
6. Keep the previous host and retained release intact until acceptance. For failure, use RECOVERY.md. Kol restores captured DNS web targets if cutover itself fails; never change mail or nameservers as an incidental rollback. Cloudflare production rollback requires a prior successful production deployment. No provider rollback has been rehearsed here.
7. Claude records operator acceptance, received failure alert, independently retained backup location/retention and seven dated source-to-public proofs. The local pack does not tick those checklist items. Confirm the current weekly launch sequence on #1501; do not infer an exact launch date from old windows.

## Kol-only steps

Cloudflare sign-in: in Edge open https://dash.cloudflare.com/ and sign in yourself to the existing account; inspect Workers & Pages and the koltregaskes.com zone, stopping before Save and Deploy.

First deploy yes: approve the exact reviewed commit, settings in launch/cloudflare.json and the first public kols-korner.pages.dev deployment; perform any required Git authorisation yourself.

DNS yes: after preview acceptance and hostname confirmation, approve and apply only the two CNAME web records in this table; preserve mail and captured previous web targets.

Sources: [build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [static headers](https://developers.cloudflare.com/pages/configuration/headers/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/). Config is prepared, not proof of provisioned resources or deployed behaviour.

Codex, Gaming-Laptop, via T3 Code Chief of Staff
