# Accessibility evidence — 17 November 2026

For [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907), stacked after the SEO follow-up.

The route sweep now explicitly enables WCAG 2.0/2.1/2.2 A/AA rules and rejects
every applicable violation, rather than filtering by impact. That exposed footer
links below the 24px target-size requirement. Their clickable rows are now at
least 24px high. Date controls retain a visible outline when their native inner
segments have focus. News filter counts now have an atomic polite status region.

Verified locally with installed Edge and intercepted built files:

- All 372 HTML routes at 320, 390 and 1280px: 1,116 distinct successful cases,
  including /links, essays, privacy and 404. Coverage/log hashes are in the JSON
  receipt. Initial failures are retained locally; the two mobile homepage/news
  cases passed after auditing resting layout instead of a focused skip-link
  overlay. Keyboard skip-link behaviour is checked separately.
- 24 full keyboard traversal cases across eight templates and three widths:
  skip navigation, visible focus outline, focus in viewport and no focus trap.
- Three additional news cases: search announces zero results and retains focus.
- Build and all 151 Node tests passed.

The sweep checks contrast, landmarks/headings, alternatives and labels through
axe, plus overflow, script/CSP errors and first keyboard focus. Tests abort
external requests, so real web fonts and final-host conditions are not covered.
No screen-reader speech/output was checked: manual assistive-technology and
final-host acceptance remain open. No privacy/legal/support implementation was
changed, and no checklist tick was changed.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
