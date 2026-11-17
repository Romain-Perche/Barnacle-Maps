---
type: feature
title: Pleasure score
description: How Barnacle Maps rates walking and bike routes by counting green (park, grass, wood) pixels on zoom-16 OpenStreetMap tiles along each route, and when it reports "Pleasure unavailable".
tags: [pleasure, tiles, routing, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Pleasure score

The pleasure score is a best-effort hint for **walking and bike routes**: the more green the OpenStreetMap style draws along a route (parks, grass, woods), the more pleasant it is assumed to be. Car routes have no score. Whether a mode gets the score is set by the `pleasure` flag in `TRAVEL_MODES` (`src/geo.js`); see [Routing and travel modes](routing-and-travel-modes.md).

The score never blocks or hides routes: routes are drawn first, each route button shows "Pleasure: …", and the label is filled in later.

## How it is computed

`scorePleasure(place, seq, stops)` in `src/app.js` runs after `drawRoutes()`:

1. **Distance guard** - if the straight-line length from the position through every stop to the destination (`straightLineLength`) exceeds 15 km, every route shows "Pleasure unavailable".
2. **Pixels** - `pathPixels(path, 16, 4)` turns each route polyline into the set of world pixels at zoom 16 it crosses, widened by a 4 px disc.
3. **Tiles** - `pathTiles` lists the 256×256 tiles those pixels fall on. More than 150 tiles makes the score unavailable.
4. **Download** - every tile is fetched from `https://tile.openstreetmap.org/16/{x}/{y}.png`, decoded with `createImageBitmap` and read through an `OffscreenCanvas` (or a `<canvas>` fallback).
5. **Count** - `countGreenPixels` counts pixels where `isGreenPixel` holds: alpha ≥ 128 and green at least 12 above both red and blue. Pixels on missing tiles are skipped.
6. **Best** - `bestPleasure` picks the index of the largest count (first wins ties), or none when no route has any green. That route is labelled "most pleasant" and gets the `best` class.

Each label reads `Pleasure: N green px`, with a tooltip explaining the measure and an `aria-label` for screen readers.

## Cancellation and failure

- All tile downloads share one `AbortController`, stored in `pleasureAbort`. A new `updateRoutes()` aborts it, and a 20 s timer aborts it too.
- Any failed or aborted tile makes the whole computation fall back to "Pleasure unavailable".
- Results are applied only if `seq` still equals `routeSeq`, so a score for an old route set never lands on new routes.

## Tuning constants

In `src/app.js`: `PLEASURE_ZOOM = 16`, `PLEASURE_RADIUS_PX = 4`, `PLEASURE_MAX_TILES = 150`, `PLEASURE_TIMEOUT_MS = 20000`, `PLEASURE_MAX_STRAIGHT_M = 15000`.

## Tests

`test/pleasure.test.js` covers the pure helpers (pixel projection, path pixels, tiles, green detection, best route); `test/modes.test.js` and `test/bike.test.js` check which modes carry the `pleasure` flag. See [Running and testing](../operations/running-and-testing.md).

## Related pages

- [Routing and travel modes](routing-and-travel-modes.md)
- [External services and privacy](../integrations/external-services.md) - load this puts on the OSM tile server
