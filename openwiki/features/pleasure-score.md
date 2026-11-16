---
type: feature
title: Pleasure score
description: How walking and bike routes get a "pleasure" indicator by counting green map pixels (parks, grass, woods) on OpenStreetMap tiles along each route, with its limits, cancellation and failure states.
tags: [pleasure, tiles, canvas, routing]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Pleasure score

Walking and bike routes show a "Pleasure" line under each route button: the number of green pixels on the standard OSM map along the route. The route with the most green is marked "most pleasant". Car routes have no pleasure line, because the `pleasure` flag of the car entry in `TRAVEL_MODES` is `false`.

Scoring is best effort. It runs after the routes are drawn (`updateRoutes` calls `scorePleasure` without awaiting it), so it never delays or hides routes.

## How the score is computed

1. **Route to pixels**: for each route, `pathPixels(path, 16, 4)` projects the polyline to Web Mercator world pixels at zoom 16 (`lngLatToPixel`, 256-px tiles). It fills every pixel the segments cross (sampling at about half-pixel steps so there are no gaps) and widens the line with a disc of radius 4 px. The result is unique pixels, so overlapping parts of a route count once.
2. **Pixels to tiles**: `pathTiles` gives the unique `[tx, ty]` tiles that hold all routes' pixels.
3. **Tile download**: `loadTile` in `src/app.js` fetches `https://tile.openstreetmap.org/16/x/y.png`, decodes it with `createImageBitmap`, draws it on an `OffscreenCanvas` (or a `<canvas>` fallback) and reads the RGBA data with `getImageData`.
4. **Counting**: `countGreenPixels` looks up each pixel in its tile. `isGreenPixel(r, g, b, a)` counts a pixel as green when it is at least half opaque and green beats both red and blue by 12 or more. Pixels on missing tiles are skipped.
5. **Best route**: `bestPleasure(counts)` returns the index of the highest count, the first (fastest) route on a tie, or `-1` when no route has any green. The best entry gets the `best` CSS class and " · most pleasant".

## Limits and failure

`scorePleasure` shows "Pleasure unavailable" on every route when:

- the straight-line length of position → stops → destination (`straightLineLength`) is above `PLEASURE_MAX_STRAIGHT_M` (15 km);
- more than `PLEASURE_MAX_TILES` (150) tiles would be needed;
- any tile download or decode fails, or the downloads take longer than `PLEASURE_TIMEOUT_MS` (20 s). An `AbortController` then aborts them all.

While scoring runs, each line shows "Pleasure: …" (with the accessible label "Pleasure: computing").

## Cancellation

The controller is kept in `pleasureAbort`. Each new route request (`updateRoutes`) aborts the previous one. `scorePleasure` also checks `seq !== routeSeq` before writing results, so a slow score never lands on newer routes. See [Architecture overview](../architecture/overview.md#request-sequencing).

## Tests

`test/pleasure.test.js` covers `lngLatToPixel`, `pathPixels` (gaps, radius, duplicates), `pathTiles`, `isGreenPixel` colours, `countGreenPixels` tile lookup, a park route scoring higher than a street route, and `bestPleasure` ties. `test/bike.test.js` checks that the pleasure flag is on for foot and bike only. The tile service itself is described in [External services](../integrations/openstreetmap-services.md).
