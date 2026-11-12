---
type: module
title: Pure geo helpers (src/geo.js)
description: Reference for src/geo.js, the side-effect-free helper module of Barnacle Maps covering distances, local geometry, formatting, Nominatim/OSRM URL building and parsing, route selection, stops and the pleasure pixel maths.
tags: [geo, helpers, pure-functions, osrm, nominatim, formatting]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Pure geo helpers (`src/geo.js`)

`src/geo.js` holds all of the app's logic that does not need a browser. Its header comment states the rule: **no DOM access and no `fetch`**, so every export can be imported and unit-tested directly in Node (`node --test test/`). `src/app.js` imports these helpers and adds the side effects (Leaflet, DOM, network). See [Architecture overview](overview.md).

Keep this rule when adding features. Put the computation in `geo.js` as a pure, exported function, and keep only the wiring in `app.js`. That way the [test suite](../testing/test-suite.md) can cover it.

## Distances and formatting

| Export | Behaviour |
| --- | --- |
| `haversine(a, b)` | Great-circle distance in metres between `{lat, lng}` points, mean Earth radius 6 371 008.8 m. |
| `formatDistance(m)` | `"850 m"` below 1 km; `"1.23 km"` (2 decimals) below 10 km; `"12.3 km"` (1 decimal) after that. |
| `formatDuration(s)` | Whole minutes, at least `1 min`; from 60 min on, `"2 h"` or `"2 h 5 min"`. |
| `arrivalTime(departure, s)` / `formatArrival(departure, s)` | Local clock arrival, rounded to the minute, with a day offset. Rendered as `"arrive 14:32"` or `"arrive 00:10 (+1 day)"`. See [Arrival time](../features/arrival-time.md). |
| `straightLineLength(points)` | Sum of the haversine lengths between consecutive points. Used to skip pleasure scoring on long walks. |

## Search (Nominatim)

- `searchUrl(query, base)` builds `…/search?q=…&format=jsonv2&limit=5`. The base defaults to `https://nominatim.openstreetmap.org`.
- `parseSearchResults(json)` maps results to `{ name, lat, lng }`. It turns the string `lat`/`lon` into numbers and drops entries with no name or with non-finite coordinates. Input that is not an array gives `[]`.
- `MIN_SUGGEST_CHARS = 3` is the type-ahead threshold. See [Place search](../features/place-search.md).

## Routing (OSRM)

- `TRAVEL_MODES` maps `foot` to `routing.openstreetmap.de/routed-foot` (profile `foot`) and `car` to `routed-car` (profile `driving`).
- `routeUrl(from, to, base, { alternatives, via, mode, stops })` builds an OSRM `route/v1` URL:
  - points in `lng,lat` order: from, then each stop, then the optional `via`, then the destination;
  - always `overview=full&geometries=geojson`;
  - `&alternatives=3` when `alternatives > 0`.

  An unknown mode falls back to walking. An explicit `base` replaces the mode's server but keeps the mode's profile.
- `parseRoutes(json)` returns `[]` unless `code === "Ok"`. Otherwise it returns `{ distance, duration, path }` for every route, with the GeoJSON `[lng, lat]` coordinates flipped to Leaflet's `[lat, lng]`. `parseRoute` returns only the first route, or `null`.
- `pickRoutes`, `routeOverlap`, `samplePath`, `detourWaypoints` and `routesBbox` choose and arrange alternatives. See [Routing](../features/routing.md).

## Local geometry

For short distances the module uses a local equirectangular projection: metres, with longitude scaled by `cos(reference latitude)`. Its functions accept points as either `[lat, lng]` arrays or `{lat, lng}` objects.

- `pointToSegmentDistance(p, a, b)` is the clamped perpendicular distance in metres.
- `detourWaypoints(from, to, factor = 0.25)` returns two side points, offset from the midpoint by `max(150 m, factor × length)`. When both points are the same, the offset runs north/south.
- `samplePath(path, stepM = 25)` returns evenly spaced samples that always include both endpoints.

## Stops

`MAX_STOPS = 5` and `STOP_DUPLICATE_M = 20`. `addStop`, `removeStop` and `moveStop` never mutate the list they are given. `mapPointStop` names a clicked map point. See [Stops](../features/stops.md).

## Pleasure pixel maths

`lngLatToPixel` (Web Mercator, 256 px tiles), `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels` and `bestPleasure` work on plain arrays and Maps of RGBA data. The tile download itself stays in `app.js`. See [Pleasure score](../features/pleasure-score.md).
