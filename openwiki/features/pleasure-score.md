---
type: feature
title: Pleasure score (green pixels)
description: How walking routes are scored by counting green pixels (parks, grass, woods) on zoom-16 OpenStreetMap tiles along each route. Covers rasterisation, the tile and distance limits, timeout and abort, the "most pleasant" marker and the unavailable states.
tags: [pleasure, tiles, canvas, walking, scoring]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-5f02ffff932b68a11c68480c
    resource: repo://test/pleasure.test.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Pleasure score (green pixels)

Walking routes get an extra label in their panel entry: `Pleasure: 1234 green px`. The route with the most green is also labelled `· most pleasant`. Car routes have no pleasure span. The score is **best-effort**: it runs in the background after the routes are drawn and never blocks or hides them.

## Pipeline

`scorePleasure(place, seq, stops)` in `src/app.js` runs these steps:

1. **Distance guard.** If the straight-line length from the start, through the stops, to the destination is over `PLEASURE_MAX_STRAIGHT_M` (15 km), every route shows "Pleasure unavailable".
2. **Rasterise.** `pathPixels(path, 16, 4)` (`src/geo.js`) projects each route to Web Mercator world pixels at zoom 16 with `lngLatToPixel`. It walks each segment in steps of half a pixel, then widens every covered pixel by a disc of radius 4 px. The result is a list of unique `[x, y]` pixels.
3. **Tile set.** `pathTiles` collects the 256 px tiles those pixels fall in. If more than `PLEASURE_MAX_TILES` (150) are needed, the score is unavailable.
4. **Download and decode.** `loadTile` fetches `https://tile.openstreetmap.org/16/x/y.png`, decodes it with `createImageBitmap`, draws it on an `OffscreenCanvas` (or a `<canvas>` fallback) and reads the RGBA data. All tiles load in parallel under one `AbortController`, which a 20 s timer (`PLEASURE_TIMEOUT_MS`) aborts.
5. **Count.** `countGreenPixels` counts the pixels for which `isGreenPixel(r, g, b, a)` is true, meaning `a ≥ 128`, `g ≥ r + 12` and `g ≥ b + 12`. That matches the green fills of the OSM Carto style. Pixels on missing tiles are skipped.
6. **Pick the best.** `bestPleasure(counts)` returns the index of the highest count, the first one on ties, or `-1` if no route has any green. That entry gets the `best` CSS class and the "most pleasant" text.

Each label also sets a `title` tooltip and an `aria-label` (for example "Pleasure 120 green pixels, most pleasant"). While scoring runs, the entries show `Pleasure: …`.

## Failure and cancellation

- If any tile fails, or the timer aborts, the whole batch falls back to "Pleasure unavailable" (the `catch` block).
- Every new `updateRoutes()` aborts the batch in flight through `pleasureAbort`. The `seq !== routeSeq` checks stop stale results from labelling the new routes. See [Architecture overview](../architecture/overview.md).
- Decoding tiles into a canvas needs the tile server to send CORS headers (`tile.openstreetmap.org` does). If the canvas were tainted, `getImageData` would throw and the score would show as unavailable.

## Tunables

The constants at the top of `src/app.js` are `PLEASURE_ZOOM = 16`, `PLEASURE_RADIUS_PX = 4`, `PLEASURE_MAX_TILES = 150`, `PLEASURE_TIMEOUT_MS = 20000` and `PLEASURE_MAX_STRAIGHT_M = 15000`. The tile limit and the distance guard keep the number of tile requests, and so the load on OSM's tile servers, bounded. See [External services](../integrations/external-services.md).

## Tests

`test/pleasure.test.js` covers the projection, the pixel and tile maths, green detection, counting with missing tiles, and `bestPleasure` ties and the no-green case.
