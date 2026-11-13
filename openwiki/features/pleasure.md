---
type: feature
title: Pleasure score (green pixels)
description: Walking routes are scored by counting green (park, grass, wood) pixels on zoom-16 OpenStreetMap tiles along each route; the route with the most green is marked "most pleasant". Covers limits, timeout and failure behaviour.
tags: [feature, pleasure, tiles, walking]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Pleasure score (green pixels)

Each walking route gets a line under its button: `Pleasure: <n> green px`, plus `· most pleasant` on the winner. Car routes have no pleasure line (`drawRoutes` only creates the element when the mode is `foot`, and `updateRoutes` only calls `scorePleasure` for walking).

## Algorithm

Split between `src/app.js` (I/O) and pure helpers in `src/geo.js`:

1. **Pixels along each route** — `pathPixels(path, 16, 4)` converts the route to world pixel coordinates at zoom 16 (`lngLatToPixel`, Web Mercator, 256-px tiles), rasterises every segment without gaps, and widens it by a disc of radius 4 px. Pixels are de-duplicated.
2. **Tiles needed** — `pathTiles` maps all pixels of all routes to unique `[x, y]` tile coordinates.
3. **Download** — `loadTile` fetches `https://tile.openstreetmap.org/16/x/y.png`, decodes it with `createImageBitmap`, draws it on an `OffscreenCanvas` (or a `<canvas>` fallback) and reads the RGBA bytes.
4. **Count** — `countGreenPixels` counts pixels where `isGreenPixel(r, g, b, a)` holds: alpha ≥ 128 and green at least 12 above both red and blue. Pixels on tiles that are missing are skipped.
5. **Best** — `bestPleasure` returns the index of the highest count (first wins ties), or `-1` when no route has any green, in which case no route is marked most pleasant.

## Limits and failure

`scorePleasure` is best-effort and never hides or blocks the routes. It shows **"Pleasure unavailable"** on every route when:

- the straight-line length start → stops → destination exceeds 15 km (`PLEASURE_MAX_STRAIGHT_M`),
- more than 150 tiles would be needed (`PLEASURE_MAX_TILES`),
- any tile fails to load, or the 20 s timeout (`PLEASURE_TIMEOUT_MS`) aborts the downloads.

While computing, routes show `Pleasure: …`. A newer route request aborts the running job via its `AbortController` and results for an older `routeSeq` are discarded — see [App state](../architecture/app-state-and-ui.md).

## Notes

- The tiles are the same public OSM tiles the map displays, fetched directly with `fetch` (CORS) — see [External services](../integrations/external-services.md) for the usage-policy implications.
- The "green" test depends on the colours of the standard OSM style; a different tile style would change the scores.
- Unit tests: `test/pleasure.test.js` covers projection, rasterisation, tile lookup, green detection and `bestPleasure`.
