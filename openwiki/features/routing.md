---
type: feature
title: Routing and travel modes
description: How Barnacle Maps asks OSRM for walking or car routes, forces walking detours when OSRM has no alternative, keeps up to three distinct routes with pickRoutes, and draws, selects and summarises them.
tags: [feature, routing, osrm, travel-mode, geometry]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-1778c2bc3ebc361f3bc7daac
    resource: repo://test/modes.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Routing and travel modes

Routes go from the user's live position, through every [stop](../features/stops.md) in order, to the chosen destination. Up to three routes are shown, fastest first, each with distance, duration and [arrival time](../features/arrival-time.md); walking routes also get a [pleasure](../features/pleasure.md) line.

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines the two modes:

| key | label | OSRM server | profile |
| --- | --- | --- | --- |
| `foot` (default) | Walk | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` | Car | `https://routing.openstreetmap.de/routed-car` | `driving` |

The `#mode` radio group sets `mode` in `app.js`; values not in `TRAVEL_MODES` are ignored. Changing mode recomputes routes when a destination exists and keeps the stops.

## Building requests

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds an OSRM `route/v1` URL:

- Coordinates are joined in **`lng,lat`** order: `from`, then each stop, then the optional `via` waypoint, then `to`.
- `alternatives > 0` adds `&alternatives=3`; zero omits the parameter.
- Always `overview=full&geometries=geojson`.
- Unknown modes fall back to walking; an explicit `base` overrides the server but keeps the mode's profile.

`parseRoutes(json)` returns `[]` unless `code === "Ok"`, drops routes without coordinates and converts geometry to `{ distance, duration, path: [[lat, lng], …] }`. `parseRoute` returns the first one or `null`.

## Choosing routes (`fetchRoutes` in `app.js`)

1. Request the main route with alternatives.
2. If the request is stale or empty, return as is.
3. **With stops:** keep only OSRM's own routes (`pickRoutes(main)`), no detours.
4. **Car, or ≥ 2 routes already:** `pickRoutes(main)`. Car detours are never forced because detours through arbitrary side points give silly driving routes.
5. **Walking, no stops, one route:** compute two side waypoints with `detourWaypoints` and request a route through each (`Promise.allSettled`, so a failed detour is ignored), then `pickRoutes` over main + detours.

`detourWaypoints(from, to, factor = 0.25)` places one point on each side of the from→to line, perpendicular from its midpoint, at `max(150 m, factor × straight distance)`, using a local equirectangular projection.

### `pickRoutes(candidates, max = 3)`

- Sort by duration; always keep the fastest.
- Skip routes longer than 1.6 × the shortest distance.
- Keep a route only if it overlaps every kept route by less than 80 %. `routeOverlap(a, b)` samples `a` every 25 m (`samplePath`) and returns the share of samples within 20 m of `b`'s polyline (`pointToSegmentDistance`).

## Drawing and selection

`drawRoutes` adds one grey Leaflet polyline and one panel button per route; the selected route (initially route 1) is blue, thicker, brought to front and its button gets `aria-pressed="true"` and class `selected`. Clicking either the line or the button selects that route. The map then fits all routes, stop markers, destination and user marker.

## Status messages

- While computing: `Computing walking routes…` / `Computing driving routes…`.
- Success: one route → `2.10 km · 25 min on foot` (or `by car`); several → `3 walking routes · fastest 2.10 km · 25 min`; with stops the text includes ` via N stop(s)`.
- No route: `No walking route found.` / `No driving route found.`, plus ` Try removing a stop.` when stops exist.
- Request error: `Routing failed: <message>`, or with stops `No … route found. (<message>)`.
- No position yet: `Waiting for your location to compute a route…`, and routing resumes on the first fix.

`fetchJson` throws `Request failed (<status>)` for non-2xx responses.

## Tests

- `test/routes.test.js` — URL building, parsing, detour geometry, sampling, point-to-segment distance, overlap and `pickRoutes`.
- `test/modes.test.js` — `TRAVEL_MODES` and mode-specific URLs.
- `test/geo.test.js` — `lng,lat` order and coordinate flipping.

## Related pages

- [Architecture overview](../architecture/overview.md)
- [Stops](../features/stops.md)
- [Arrival time](../features/arrival-time.md)
- [Pleasure indicator](../features/pleasure.md)
