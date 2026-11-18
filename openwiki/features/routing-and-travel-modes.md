---
type: feature
title: Routing and travel modes
description: How Barnacle Maps gets up to 3 routes from OSRM for walking, cycling or driving - the TRAVEL_MODES table, routeUrl, NoRoute handling, forced walking detours, pickRoutes de-duplication, and drawing and selecting routes.
tags: [routing, osrm, travel-modes, bike, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Routing and travel modes

Once a destination is chosen (see [Place search](search.md)), the app asks OSRM for routes from the user's live position, through any [stops](stops.md), to the destination, and shows up to 3 of them on the map and in the panel.

## Travel modes

The panel has a segmented radio group (`#mode` in `index.html`): 🚶 Walk, 🚗 Car, 🚲 Bike, with Walk checked by default. Each value is a key of `TRAVEL_MODES` in `src/geo.js`, which holds everything mode-specific:

| Mode | OSRM server | Profile | Pleasure | Walking detours |
|---|---|---|---|---|
| `foot` | `routing.openstreetmap.de/routed-foot` | `foot` | yes | yes |
| `car` | `routing.openstreetmap.de/routed-car` | `driving` | no | no |
| `bike` | `routing.openstreetmap.de/routed-bike` | `bike` | yes | no |

It also holds the selector label and icon and the status texts (`computing`, `noRoute`, `single`, `plural`), e.g. "Computing cycling routes…", "No cycling route found.", "… by bike", "3 cycling routes". Changing the radio sets `mode` and, if a destination exists, recomputes routes; stops are kept. Values not in `TRAVEL_MODES` are ignored. Adding a mode means adding an entry here plus a radio in `index.html`.

## Building the request

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds
`{base}/route/v1/{profile}/{lng,lat;…}?overview=full&geometries=geojson[&alternatives=3]`.
Coordinates are in OSRM's `lng,lat` order: start, then each stop in order, then the optional `via` detour point, then the destination. An unknown mode falls back to `foot`. Each FOSSGIS server serves one profile, so the server (base URL) is what really selects the mode.

## Fetching and choosing routes

`fetchRoutes` in `src/app.js`:

1. Requests the main route with alternatives. `fetchRouteJson` treats an HTTP 400 whose body has `code: "NoRoute"` as an empty result (the mode's "No … route found." text), any other non-OK status as an error ("Routing failed: …").
2. `parseRoutes` keeps routes with a GeoJSON geometry and converts coordinates to `[lat, lng]` paths with `distance` (m) and `duration` (s). A response with `code` other than `Ok` gives no routes.
3. **With stops**: returns OSRM's own routes only (no detours).
4. **Walking with fewer than 2 routes**: OSRM often has no alternative for short walks, so two detour routes are requested through side waypoints from `detourWaypoints` — points offset perpendicular to the start–destination line from its midpoint by max(150 m, 25 % of the straight distance), one on each side. Failed detour requests are ignored. Car and bike never get forced detours, since they give silly routes.
5. `pickRoutes` sorts candidates by duration, keeps the fastest, then adds alternatives that are at most 1.6× the shortest distance and overlap less than 80 % with every kept route (`routeOverlap`: share of points sampled every 25 m within 20 m of the other polyline). At most 3 routes.

## Drawing and selecting

`drawRoutes` draws each route as a Leaflet polyline (grey; the selected one blue and brought to front) and a button "Route N · distance · duration" in `#routes`. Clicking either selects that route; route clicks do not bubble, so they do not open the map's "Add stop here" popup. The map fits all routes, stop markers, destination and position. The status line summarises the fastest route, the number of routes and the number of stops. Distances format as `m` below 1 km, else km with 2 or 1 decimals; durations as minutes (at least 1) or `h min`.

If there is no position yet, the app centres on the destination, shows "Waiting for your location to compute a route…" and computes the routes on the next position fix. Results for a superseded request are dropped (`routeSeq`, see [Architecture overview](../architecture/overview.md)).

## Tests

`test/routes.test.js` (URL, parsing, detours, overlap, picking), `test/modes.test.js` and `test/bike.test.js` (mode table and URLs against `specs/sf-73-bicycle-track/contracts/travel-modes.md`), `test/selector.test.js` (selector markup), and `test/bike-app.test.js` (the real `app.js` against the fake OSRM). See [Testing](../testing/testing.md).

## Related pages

- [Stops](stops.md), [Pleasure score](pleasure-score.md), [Place search](search.md)
- [Architecture overview](../architecture/overview.md)
