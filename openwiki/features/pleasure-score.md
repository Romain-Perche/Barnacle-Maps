---
type: feature
title: Pleasure score
description: How walking routes get a "pleasure" indicator by counting green pixels on zoom-16 OpenStreetMap tiles along each route, with its limits, timeout and failure behaviour.
tags: [pleasure, tiles, walking, canvas]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Pleasure score

Walking routes (mode `foot`) get a best-effort "pleasure" indicator: the number of green pixels
(parks, grass, woods in the standard OSM style) on the map tiles along the route. The route with
the most green is marked "most pleasant". Car routes have no indicator. The orchestration is
`scorePleasure` and `loadTile` in `src/app.js`; the pixel math is in the pleasure section of
`src/geo.js`.

## Lifecycle

1. `drawRoutes` adds a `span.pleasure` per walking route showing "Pleasure: …".
2. After the routes are drawn, `updateRoutes` calls `scorePleasure(place, seq, stops)` without
   awaiting it, so scoring never blocks or hides the routes.
3. Guards: if the straight-line length start → stops → destination exceeds
   `PLEASURE_MAX_STRAIGHT_M` (15 km), or the routes need more than `PLEASURE_MAX_TILES` (150)
   tiles, every route shows "Pleasure unavailable" with no tile request.
4. Tiles are fetched in parallel from `https://tile.openstreetmap.org/16/{x}/{y}.png`, decoded with
   `createImageBitmap`, drawn on an `OffscreenCanvas` (or a `<canvas>` fallback) and read back as
   RGBA. A `PLEASURE_TIMEOUT_MS` (20 s) timer aborts them through an `AbortController` stored in
   `pleasureAbort`; a new `updateRoutes` aborts it too.
5. Any failure (one tile failing, timeout, abort) turns every route into "Pleasure unavailable".
   Results are written only if `routeSeq` still matches, so a superseded scoring never overwrites
   newer routes.

## Pixel math (geo.js)

- `lngLatToPixel` — Web Mercator world pixel at a zoom (256-px tiles).
- `pathPixels(path, zoom, radius)` — rasterises the polyline at half-pixel steps and widens it by a
  disc of `radius` pixels (`PLEASURE_RADIUS_PX` = 4), returning unique integer pixels.
- `pathTiles` — the unique tiles those pixels fall on.
- `isGreenPixel(r, g, b, a)` — opaque enough (`a ≥ 128`) and green dominates red and blue by at
  least 12.
- `countGreenPixels(pixels, tiles)` — counts green pixels; pixels on missing tiles are skipped.
- `bestPleasure(counts)` — index of the largest count, first wins ties, `-1` when no route has any
  green (then no route is marked "most pleasant").

Because counts are absolute pixels, a longer route naturally tends to score higher; the score
compares the alternatives of one request, not routes in general.

## Tests

`test/pleasure.test.js` covers the projection, rasterisation, tile set, colour rule, counting and
best-route choice. The fetching and canvas parts in `app.js` are not unit tested. See
[Routing](routing.md) and [External services](../integrations/openstreetmap-services.md).
