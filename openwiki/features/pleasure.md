---
type: feature
title: Pleasure indicator
description: How walking routes get a "pleasure" score by counting green pixels (parks, grass, woods) of OpenStreetMap zoom-16 tiles along each route, the limits that make it unavailable, and how it stays best-effort and cancellable.
tags: [feature, pleasure, walking, map-tiles, canvas]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-5f02ffff932b68a11c68480c
    resource: repo://test/pleasure.test.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Pleasure indicator

For **walking** routes only, each route button gets a second line, `Pleasure: N green px`, and the route with the most green pixels is marked `· most pleasant` (CSS class `best`). Green pixels are those of parks, grass and woods in the standard OpenStreetMap tile style. Car routes have no pleasure line at all. The score is best-effort: it never blocks or hides the routes.

## Pipeline

`scorePleasure(place, seq, stops)` in `src/app.js` runs after the routes are drawn (it is not awaited by `updateRoutes`):

1. **Distance guard.** If the straight-line length start → stops → destination (`straightLineLength`) exceeds 15 km (`PLEASURE_MAX_STRAIGHT_M`), every route shows `Pleasure unavailable`.
2. **Rasterise routes.** `pathPixels(path, 16, 4)` converts each route into unique integer world pixels at zoom 16 (`lngLatToPixel`, Web Mercator, 256 px tiles), walking each segment at half-pixel steps so there are no gaps, then widening it by a disc of radius 4 px.
3. **Tile guard.** `pathTiles` lists the unique tiles that hold those pixels; more than 150 tiles (`PLEASURE_MAX_TILES`) → unavailable.
4. **Download tiles.** `loadTile` fetches `https://tile.openstreetmap.org/16/x/y.png`, decodes it with `createImageBitmap` and reads RGBA data through an `OffscreenCanvas` (or a `<canvas>` fallback). All tiles load in parallel with one `AbortController`, aborted after 20 s (`PLEASURE_TIMEOUT_MS`).
5. **Count.** `countGreenPixels` looks up each pixel in its tile; pixels on missing tiles are skipped. `isGreenPixel` treats a pixel as green when alpha ≥ 128 and green exceeds both red and blue by at least 12.
6. **Pick best.** `bestPleasure` returns the index of the highest count, first wins ties (the fastest route, since routes are ordered by duration), or −1 when no route has any green.

Any tile error, abort or timeout makes all routes show `Pleasure unavailable`.

## Cancellation and staleness

The controller is stored in `pleasureAbort`; `updateRoutes()` aborts it at the start of every recomputation. Before writing results, `scorePleasure` checks that `seq` still equals `routeSeq`, so a superseded score never overwrites newer routes (see [Architecture overview](../architecture/overview.md)).

While computing, the line reads `Pleasure: …` with aria-label `Pleasure: computing`. Final lines have a tooltip explaining the metric and an aria-label such as `Pleasure 42 green pixels, most pleasant`.

## Operational note

Each walking route computation can download up to 150 tiles from the public OSM tile server, on top of the map's own tiles. Keep this in mind against the OSM tile usage policy (see [Running, dependencies and external services](../operations/running-and-external-services.md)).

## Tests

`test/pleasure.test.js` covers projection, rasterisation (no gaps, no duplicates, radius), tile lookup, the green colour rule, a synthetic park-vs-street comparison and `bestPleasure` ties. App-level behaviour (e.g. tiles returning 503 → `Pleasure unavailable`) is exercised by the panel tests and AI scenarios in the [Test suite](../testing/test-suite.md).

## Related pages

- [Routing and travel modes](../features/routing.md)
- [Running, dependencies and external services](../operations/running-and-external-services.md)
