---
type: feature
title: Pleasure indicator (green pixels)
description: How walking routes get a best-effort "pleasure" score by counting green pixels of OpenStreetMap tiles (zoom 16) along each route, with tile, distance and time limits.
tags: [pleasure, tiles, canvas, walking]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Pleasure indicator (green pixels)

For walking routes only, each route entry shows `Pleasure: N green px` and the route with the
most green is marked `most pleasant`. Green pixels on the standard OSM style are parks, grass and
woods. The score never blocks or hides routes: it is computed after they are drawn and degrades to
`Pleasure unavailable`.

## Pipeline

`scorePleasure` in `src/app.js` runs after `drawRoutes` when the mode is walking:

1. **Distance limit**: if the straight-line length from the position through the stops to the
   destination exceeds 15 km, every route shows `Pleasure unavailable`.
2. **Pixels**: `pathPixels(path, 16, 4)` (geo.js) projects the route to Web Mercator world pixels
   at zoom 16 (`lngLatToPixel`), rasterises every segment and widens it by a disc of radius 4 px,
   returning unique `[x, y]` pixels.
3. **Tiles**: `pathTiles` gives the unique 256 px tiles covering all routes' pixels. More than 150
   tiles means unavailable.
4. **Download**: `loadTile` fetches each `https://tile.openstreetmap.org/16/x/y.png`, decodes it with
   `createImageBitmap` and reads RGBA data through an `OffscreenCanvas` (or a `<canvas>` fallback).
   All tiles load in parallel under one `AbortController` with a 20 s timeout.
5. **Count**: `countGreenPixels` counts pixels where `isGreenPixel` holds (alpha >= 128, green at
   least 12 above both red and blue); pixels on missing tiles are not counted.
6. **Best**: `bestPleasure` returns the index of the highest count (first wins ties), or -1 when
   no route has any green, in which case no route is marked most pleasant.

## Failure and cancellation

Any tile error, non-OK response, decoding failure or the timeout makes the whole score
unavailable (all or nothing). A new route computation aborts the in-flight controller
(`pleasureAbort`) and results are ignored when `routeSeq` changed, so a stale score never lands on
new routes.

## Operational note

Each scored walk can download up to 150 tiles from the OSM tile server, which has a usage policy;
see [External services](../integrations/external-services.md). The pure helpers are covered by
`test/pleasure.test.js`.
