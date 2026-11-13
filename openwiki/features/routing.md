---
type: feature
title: "Routing: travel modes, alternatives and detours"
description: How Barnacle Maps asks OSRM for walking or car routes from the user's position through the stops to the destination, forces detour alternatives for short walks, keeps up to three distinct routes, and draws and selects them.
tags: [feature, routing, osrm, travel-mode]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Routing: travel modes, alternatives and detours

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines two modes, chosen with the Walk/Car radios in the panel:

| Mode | OSRM server | OSRM profile |
| --- | --- | --- |
| `foot` (default) | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` | `https://routing.openstreetmap.de/routed-car` | `driving` |

Changing the radio sets `mode` and, if a destination is chosen, recomputes routes; stops are kept. Unknown modes fall back to walking in `routeUrl`.

## Building the request

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds
`<base>/route/v1/<profile>/<lng,lat;…>?overview=full&geometries=geojson[&alternatives=3]`.
The points are, in order: start, every stop, an optional `via` waypoint, destination. Coordinates are in OSRM's `lng,lat` order. `parseRoutes` turns an `Ok` response into `{distance, duration, path}` objects with `path` flipped to `[lat, lng]` for Leaflet, and returns `[]` otherwise.

## Choosing routes (`fetchRoutes`)

1. Ask for the main route with alternatives.
2. With stops, or with ≥ 2 routes, or in car mode: return `pickRoutes(main)`.
3. Otherwise (a walk with one route), compute two `detourWaypoints` — points offset perpendicular to the start→destination line by `max(150 m, 25 %` of its length) on each side — and request a route through each (`Promise.allSettled`, so a failed detour is ignored).
4. `pickRoutes` sorts candidates by duration, keeps the fastest, and adds others only if they are at most 1.6× the shortest distance and overlap every kept route by less than 80 % (`routeOverlap`: share of 25 m samples within 20 m of the other path). At most 3 are kept.

Car detours are skipped because detours through arbitrary side points give silly driving routes; with stops, only OSRM's own routes are used — see [Stops](stops.md).

## Drawing and selecting

`drawRoutes` adds one grey Leaflet polyline and one panel button per route (`Route n · distance · duration`). `selectRoute(i)` highlights the line in blue, brings it to front and sets `aria-pressed` on its button. Clicking a line or a button selects it; line clicks don't bubble so they don't open the map's "Add stop here" popup. The map fits the routes, stops, destination and user markers.

The status line then summarises, e.g. `3 walking routes via 2 stops · fastest 1.20 km · 15 min`. Walking routes then get a [pleasure score](pleasure.md).

## Position and errors

Routes start from the live geolocation `position`. If none is known yet, the map centres on the destination, status says "Waiting for your location…", and the first position fix triggers the computation. A failed request shows "Routing failed: …" (or "No walking/driving route found. (…)" with stops); an empty result suggests removing a stop when there are stops. Out-of-date responses are dropped by `routeSeq` — see [App state](../architecture/app-state-and-ui.md).

Formatting (`formatDistance`, `formatDuration`) and URL/parse helpers are unit tested in `test/routes.test.js`, `test/modes.test.js` and `test/geo.test.js`.
