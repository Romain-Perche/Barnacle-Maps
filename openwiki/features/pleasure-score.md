---
type: feature
title: Walking pleasure score
description: How Barnacle Maps rates walking routes by counting green pixels (parks, grass, woods) on zoom-16 OpenStreetMap tiles along each route. It covers the geometry helpers, tile loading, size and time limits, how the most pleasant route is marked, and what happens on failure.
tags: [feature, pleasure, tiles, walking]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Walking pleasure score

Each walking route gets a "Pleasure" label. The score is the number of green map pixels along the route, and the route with the most green pixels is marked "most pleasant". Car routes have no label. The score is best-effort: it never blocks the routes or hides them.

## Algorithm

The pure maths lives in `src/geo.js`; the browser side lives in `scorePleasure` / `loadTile` in `src/app.js`.

1. **Path pixels**: `pathPixels(path, 16, 4)` projects the route polyline to Web Mercator world pixels at zoom 16 (`lngLatToPixel`). It rasterises each segment at half-pixel steps, then widens the line with a disc of radius 4 px. The result is a set of unique integer pixels.
2. **Tiles needed**: `pathTiles` lists the unique 256 px tiles that contain those pixels, across all routes together.
3. **Load tiles**: `loadTile` fetches `https://tile.openstreetmap.org/16/x/y.png` and decodes it with `createImageBitmap`. It draws the bitmap on an `OffscreenCanvas`, or on a plain canvas as fallback, and reads the RGBA data.
4. **Count**: `countGreenPixels` counts the pixels where `isGreenPixel` holds: alpha ≥ 128 and green at least 12 above both red and blue. Pixels on missing tiles are skipped.
5. **Best**: `bestPleasure` returns the index of the largest count. The first route wins ties. It returns `-1` when there is no green at all, and then no route is marked.

## Limits and failure

Constants at the top of `src/app.js`:

- `PLEASURE_MAX_STRAIGHT_M` = 15 km. If the straight-line length from the position through the stops to the destination is longer, every route shows "Pleasure unavailable" without downloading anything.
- `PLEASURE_MAX_TILES` = 150. Above this many tiles, the result is also "unavailable".
- `PLEASURE_TIMEOUT_MS` = 20 s. An `AbortController` cancels the tile downloads after this time. The same controller is stored in `pleasureAbort`, so a new route computation cancels them too.
- If any tile fails, all routes show "Pleasure unavailable". If the routes changed meanwhile (`routeSeq`), the results are discarded.

Each tile request also gives the user's route area to the OSM tile server (see [External services](../integrations/external-services.md)).

Tests: `test/pleasure.test.js` covers the projection, rasterising, tile listing, the green test, counting and tie-breaking with synthetic tile data.

Related: [Routing](routing-and-alternatives.md).
