---
type: feature
title: Routing and travel modes
description: How Barnacle Maps asks OSRM for walking or car routes from the user's position through any stops to the destination, adds detour alternatives for short walks, picks up to 3 distinct routes and draws them.
tags: [routing, osrm, travel-mode, leaflet]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-1778c2bc3ebc361f3bc7daac
    resource: repo://test/modes.test.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Routing and travel modes

Choosing a search result as destination (`showRoute`) stores it in `currentPlace`, drops a marker
and calls `updateRoutes()` in `src/app.js`. That function is also re-run when stops change, when
the Walk/Car radio changes, and when a position arrives for a pending route.

## Travel modes

`TRAVEL_MODES` in `src/geo.js` maps each mode to an OSRM server and profile:

| Mode | Server | Profile |
| --- | --- | --- |
| `foot` (Walk, default) | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` (Car) | `https://routing.openstreetmap.de/routed-car` | `driving` |

The radio handler ignores values not in `TRAVEL_MODES` and keeps the stops when the mode changes.

## updateRoutes

1. Capture `mode`, `currentPlace` and a copy of `stops`; take `++routeSeq`; abort any pleasure
   scoring; clear drawn routes.
2. No destination → status asks for one if there are stops. No position → set `pendingRoute`,
   centre on the destination and show "Waiting for your location…"; `onPosition` resumes later.
3. `fetchRoutes` → `drawRoutes` → summary status (`N walking routes · fastest …`, or the single
   route's distance and duration, with ` via N stops`). Walking then starts the
   [pleasure score](pleasure-score.md).
4. Errors: "Routing failed: …" without stops, "No walking/driving route found. (…)" with stops,
   and "Try removing a stop." when OSRM returns no route through the stops.

## fetchRoutes: alternatives and detours

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds
`/route/v1/<profile>/<lng,lat;…>?overview=full&geometries=geojson[&alternatives=3]`, with points in
the order start, stops, optional `via`, destination. `parseRoutes` turns an OSRM `code: "Ok"`
response into `{ distance, duration, path: [[lat, lng], …] }` entries.

- The first request asks for alternatives.
- With stops, or in car mode, or when OSRM already returned 2+ routes, the result goes straight to
  `pickRoutes`.
- Otherwise (a short walk with a single route) it builds two `detourWaypoints` — one on each side
  of the start→destination line, offset from its midpoint by `max(150 m, 25 % of the distance)` —
  requests a route through each (`Promise.allSettled`, failures ignored), and adds them as
  candidates.

`pickRoutes(candidates, 3)` sorts by duration, always keeps the fastest, drops candidates longer
than 1.6× the shortest distance, and keeps one only if less than 80 % of it lies within 20 m of
each route already kept (`routeOverlap`, sampled every 25 m).

## Drawing and selection

`drawRoutes` draws each route as a grey Leaflet polyline with a matching button
`Route N · distance · duration` in `#routes`. Selecting a route (button or line click) restyles it
blue, sets `aria-pressed` and brings it to the front; route 0 is selected first. Line clicks stop
propagation so they do not open the map's "Add stop here" popup. The map then fits the routes,
stop markers, destination and user markers.

## Tests

`test/modes.test.js` covers `TRAVEL_MODES` and the URLs per mode; `test/routes.test.js` covers
parsing, detour waypoints, sampling, overlap, `pickRoutes` and `routeUrl` with stops and via. See
[Stops](stops.md) and [External services](../integrations/openstreetmap-services.md).
