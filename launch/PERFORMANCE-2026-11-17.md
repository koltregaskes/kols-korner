# Mobile performance — 17 November 2026

For [#1907](https://github.com/koltregaskes/rooms-os-hub/issues/1907), stacked after accessibility.

Original PNGs are preserved. The build now selects checked-in WebP derivatives
at 480/960/1600px through srcset and sizes, allowing extra source pixels for cover
crops. It keeps alt text and dimensions, makes the homepage lead image eager,
and verifies SHA-256 for each original and derivative before rewriting HTML.
Changed images require regeneration; a normal build needs no image tool or new
dependency. The optional maintenance command is:

```text
node scripts/generate-responsive-images.mjs /path/to/existing/ffmpeg
```

This run used existing FFmpeg 9.0.2, WebP quality 82. The manifest records 23
originals (52,632,413 bytes) and 69 derivatives (5,106,828 bytes). Nothing was
deleted. Before/after 390px renders were inspected; source selection was increased
after the first comparison to preserve cover-crop sharpness.

The measurement fixture now serves actual loopback HTTP with Brotli-compressed
text, rather than fulfilling every request through Playwright. It binds only to
127.0.0.1 on an ephemeral port and closes after tests. Chromium Resource Timing
records transfer, encoded and decoded body bytes. Cold cache is disabled via CDP;
CPU slowdown is 4x, network 9 Mbps down/3 Mbps up with 40ms latency, viewport
390x844. Three independent contexts per route measure homepage, news, links,
privacy (read-only) and the existing heaviest representative essay.

All 15 runs passed: worst LCP **856ms**, worst CLS **0.00898**. Final homepage
image bodies total **165,790 bytes** and measured total transfer **182,736 bytes**.
The previous intercepted baseline requested **36,493,065 image bytes**; transfer
was not measurable there. Compare payloads, not timing deltas between these two
harnesses. The essay's image bodies fell from 7,102,576 to 20,324 bytes.
The adjacent JSON retains all run summaries and conditions.

Build and all 154 Node tests passed. The 27 affected image/index route-width
checks passed, as did SEO, internal links, digest preservation and public-boundary
checks. Contrast checks now wait for actual reveal opacity to reach one: faster
assets exposed transient fade-animation measurements, not a resting contrast
change. All real failures remain retained in local logs.

External fonts are blocked. Loopback compression/latency is a controlled lab
fixture, not the actual hosting stack, real-device or field evidence. Repeat on
the approved final host with real fonts and retain final release/transfer data.
No hosting, publication, privacy-page implementation or checklist tick changed.

Codex, Gaming-Laptop, keeper thread via T3 Code Chief of Staff
