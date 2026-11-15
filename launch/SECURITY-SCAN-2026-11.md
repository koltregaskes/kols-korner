# Kol's Korner launch security evidence (audit rank 9), 15 November 2026

**Result for main `7c6322cadf53c9b92b41b642f38b45f14daed31b`:** no known-vulnerable dependencies and no secrets detected in the repository's full Git history, which includes the committed built site under `site/`. **Still required:** the same checks on the actual 11 December freeze commit, recorded below before launch.

## Evidence

Both checks run in the existing **Security launch checks** workflow (`.github/workflows/security.yml`, job `audit`) on every push to `main`.

| Check | How it runs | Result on `7c6322ca` |
|---|---|---|
| Dependency audit | `npm ci`, then `npm audit --audit-level=low` (Node 24.22.1) | **0 vulnerabilities** at any severity |
| Secret scan | Gitleaks v8.30.0 (`zricethezav/gitleaks:v8.30.0`), `git` mode over `--all` refs with `fetch-depth: 0`, `--redact=100`, `.env*` paths excluded, existing `.gitleaksignore` applied | **Passed** (no findings) |

- Run: [Security launch checks #43747051039](https://github.com/koltregaskes/kols-korner/actions/runs/43747051039), 15 Nov 2026 18:29 UTC.
- Lockfile `package-lock.json` SHA-256: `d98b4454b8101fd1f592e2c53d77b00c35fe90da51752bbecb5bcdde7bce4293`.
- All five locked packages (`@playwright/test`, `playwright`, `playwright-core`, `@axe-core/playwright`, `axe-core`) are development and test tooling. The static site ships no external production dependency.
- The scan output is redacted by design. No secret value is printed, stored or reproduced here. Environment files were never opened.

## Supplementary one-off review (15 November 2026)

Before relying on the CI scan, a separate offline pattern scan of the working tree, every reachable historical file version and the rebuilt site was run as a cross-check. It produced 947 matches, all classified as false positives (for example news slugs mentioning SK Hynix or SK Telecom that resemble a legacy key prefix, and configuration or template expressions) or synthetic test fixtures. **No real credential was found.** Four locations were classified by owner review from masked structure only, with no value seen:
- a template reference to a variable read from `process.env`;
- a rich-snippet placeholder marker;
- two internal de-duplication keys.

That bespoke scanner was not adopted: independent review showed pattern scanners of this kind need continual tuning, and Gitleaks above is the maintained, authorised tool. Its code, results and reviews are archived outside the repository.

## Freeze acceptance (11 December 2026)

1. Identify the freeze commit on `main`.
2. Confirm **Security launch checks** ran on that exact commit and passed, or re-run it with **Run workflow** on `main` once the freeze commit is the head.
3. Record below: the commit SHA, the run URL, the npm audit totals and the Gitleaks result line, plus the lockfile SHA-256 if it changed.
4. If either check fails, do not launch. Review the finding privately (values are withheld in the log), fix, rotate any real credential, and re-run.

| Freeze commit | Run | npm audit | Gitleaks | Recorded by |
|---|---|---|---|---|
| _pending_ | | | | |

This evidence covers the repository and its committed build. It does not cover live response headers, the hosting account, or credentials stored outside Git.
