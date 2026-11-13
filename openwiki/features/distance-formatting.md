---
type: feature
title: Distance and duration formatting
description: How route distances are formatted with the convert package (loaded non-blocking via an import map in the browser, node_modules in Node) with a whole-metre fallback, and how durations are formatted.
tags: [formatting, convert, dependency, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-d6eb1ae9e3d4cd8cc8a74ce2
    resource: repo://test/format-distance.contract.test.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Distance and duration formatting

Route entries and the status summary show `Route 1 · 1.5 km · 18 min`. Both strings come from
`src/geo.js`: `formatDistance` and `formatDuration`, called by `drawRoutes` and `updateRoutes` in
`src/app.js` (see [Routing](routing.md)).

## formatDistance and the `convert` package

`formatDistance(meters, conv = convert)` uses the third-party
[`convert`](https://www.npmjs.com/package/convert) package, the repo's only runtime dependency
(exact version: see [`sbom/SBOM.md`](../../sbom/SBOM.md)).

- **Loading**: `geo.js` runs `import("convert")` at module load and exports the promise as
  `distanceFormatReady`. In the browser, the bare specifier resolves through the import map in
  `index.html` to the same version on unpkg; in Node (tests), it resolves from `node_modules`, so
  `npm install` is needed before `npm test`. The import is never awaited by the app, so a slow or
  failing CDN never blocks the map or routing. A failed import is swallowed.
- **Rules with the package**: invalid input (not a finite, non-negative number) gives `"—"`. The
  value is rounded to whole metres first; `0` gives `"0 m"`; otherwise `convert(m, "m").to("best",
  "metric")` picks the unit and the quantity is shown with at most one decimal and no trailing
  `.0` (`420 m`, `1 km`, `1.5 km`, `12.3 km`). Rounding happens before unit choice, so 999.6 m is
  `1 km`, never `1000 m`.
- **Fallback**: until the import has resolved, or if it failed, the output is whole metres
  (`1500 m`). Routes drawn before the package loads keep that text; they are not re-rendered.

The full input/output table is the feature contract in
`specs/pilot-68528-format-distances-with-a-small-library/contracts/format-distance.md`, enforced by
`test/format-distance.contract.test.js`. `test/distance-package.contract.test.js` checks the wiring:
one exact-pinned dependency in `package.json`, the lockfile entry with an integrity hash, the
import map URL at the same version, and unchanged npm scripts (no build step).

## formatDuration

`formatDuration(seconds)` rounds to whole minutes with a minimum of 1: under an hour gives
`"N min"`, otherwise `"H h"` or `"H h M min"`.
