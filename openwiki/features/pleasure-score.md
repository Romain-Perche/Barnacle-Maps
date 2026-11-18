---
type: feature
title: Pleasure score
description: The best-effort "pleasure" indicator for walking and cycling routes - counts green pixels (parks, grass, woods) on zoom-16 OpenStreetMap tiles along each route and marks the most pleasant one.
tags: [pleasure, map-tiles, routing, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Pleasure score

Walking and cycling routes show a pleasure indicator: how many green map pixels (parks, grass, woods in the OpenStreetMap style) lie along the route. The route with the most green is marked "most pleasant". Car routes have no indicator. The feature is best-effort: it never blocks or hides the routes.

## Which modes

`TRAVEL_MODES[mode].pleasure` decides it: `true` for `foot` and `bike`, `false` for `car` (see [Routing and travel modes](routing-and-travel-modes.md)). When the flag is set, `drawRoutes` adds a `.pleasure` span to each route button showing "Pleasure: …" and `updateRoutes` starts `scorePleasure` after drawing.

## How it works

`scorePleasure(place, seq, stops)` in `src/app.js`:

1. **Distance guard.** If the straight-line length from the position through every stop to the destination (`straightLineLength`) exceeds 15 km (`PLEASURE_MAX_STRAIGHT_M`), every route shows "Pleasure unavailable".
2. **Pixels.** For each route, `pathPixels(path, 16, 4)` converts the path to Web Mercator world pixels at zoom 16 (`lngLatToPixel`), rasterises each segment, and widens it by a disc of radius 4 px. Pixels are de-duplicated.
3. **Tiles.** `pathTiles` lists the distinct 256×256 tiles those pixels fall on. More than 150 tiles (`PLEASURE_MAX_TILES`) → unavailable.
4. **Download.** Each tile is fetched from `https://tile.openstreetmap.org/16/{x}/{y}.png`, decoded with `createImageBitmap` and drawn to an `OffscreenCanvas` (or a `<canvas>` fallback) to read its RGBA data. All tiles are fetched in parallel under one `AbortController`, aborted after 20 s (`PLEASURE_TIMEOUT_MS`) or by the next `updateRoutes()`.
5. **Count.** `countGreenPixels` counts pixels for which `isGreenPixel(r, g, b, a)` holds: alpha ≥ 128 and green at least 12 above both red and blue. Pixels on missing tiles are skipped.
6. **Best.** `bestPleasure(counts)` returns the index of the largest count (first wins ties), or −1 when no route has any green, in which case no route is marked.

The button then reads `Pleasure: N green px` (plus ` · most pleasant` and a `best` CSS class on the winner), with a tooltip explaining the metric and an accessible `aria-label`.

## Failure and concurrency

- Any tile error, timeout or abort makes every route show "Pleasure unavailable".
- Results are dropped if `routeSeq` changed meanwhile (new destination, mode or stops), so an old score never lands on new routes.
- Because the score depends on tile colours, it changes if the OSM map style changes; it is a heuristic, not a land-use query.

## Tests

`test/pleasure.test.js` covers the pixel math (`lngLatToPixel`, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels`, `bestPleasure`). `test/bike-app.test.js` checks that bike routes get the indicator, using all-green fake tiles from `test/fakes/app-harness.js`. See [Testing](../testing/testing.md).

## Related pages

- [Routing and travel modes](routing-and-travel-modes.md)
- [Architecture overview](../architecture/overview.md)
