---
type: feature
title: Walking pleasure score
description: For walking routes, the app downloads OpenStreetMap tiles at zoom 16 along each route and counts green pixels (parks, grass, woods); the route with the most is marked "most pleasant". Scoring is best-effort, bounded and abortable.
tags: [feature, pleasure, tiles, canvas, walking]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Walking pleasure score

Each walking route button shows a "Pleasure" line. The score is the number of green map pixels near the route on standard OSM tiles; more green means parks, grass or woods along the way. Car routes have no score.

## Algorithm (`src/geo.js`)

1. `pathPixels(path, 16, 4)`: project the route to world pixels at zoom 16 (`lngLatToPixel`, Web Mercator, 256-px tiles), rasterise each segment at half-pixel steps, and widen it by a disc of radius 4 px. Pixels are unique per route.
2. `pathTiles(pixels)`: the set of tiles those pixels fall on (union over all routes).
3. `countGreenPixels(pixels, tiles)`: count pixels where `isGreenPixel` holds (alpha ≥ 128, green at least 12 above red and blue). Pixels on missing tiles are skipped.
4. `bestPleasure(counts)`: index of the highest count (first wins ties), or `-1` if no route has any green.

## Orchestration (`scorePleasure` in `src/app.js`)

`updateRoutes` starts it after drawing walking routes; it never blocks or hides routes.

- Gives up immediately ("Pleasure unavailable") when the straight-line length start → stops → destination exceeds 15 km, or more than 150 tiles are needed.
- Downloads tiles in parallel from `https://tile.openstreetmap.org/16/x/y.png` with an `AbortController` that fires after 20 s. Each tile is decoded with `createImageBitmap` and read through an `OffscreenCanvas` (or a regular canvas) to RGBA data.
- Any tile failure, timeout or abort shows "Pleasure unavailable" on every route.
- A new routing request aborts the running scoring, and results are ignored when `routeSeq` changed (see [App state and request lifecycle](../architecture/app-state-and-lifecycle.md)).
- On success each route shows "Pleasure: N green px", and the best one gets " · most pleasant" with the `.best` (green) style. While computing it reads "Pleasure: …".

Tile downloads go to the OSM tile server like the base map; see [External services](../integrations/external-services.md) for the load this puts on it. Tests: `test/pleasure.test.js`.
