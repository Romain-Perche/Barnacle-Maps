---
type: feature
title: Routing, travel modes and alternatives
description: How Barnacle Maps asks the FOSSGIS OSRM servers for walking or car routes, forces detour alternatives for short walks, removes near-duplicate routes, then draws the routes, lets the user select one and reports the result in the status line.
tags: [feature, routing, osrm, travel-mode]
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

# Routing, travel modes and alternatives

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines two modes, each with an OSRM base URL, a profile and the engine name used by the OSM directions page:

| Mode | OSRM base | Profile |
|---|---|---|
| `foot` (Walk, default) | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` (Car) | `https://routing.openstreetmap.de/routed-car` | `driving` |

The `#mode` radio group sets `mode` in `src/app.js` (only values that exist in `TRAVEL_MODES` are accepted). If a destination is already chosen, changing the mode recomputes the routes and keeps the stops.

## Request: `routeUrl`

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds `{base}/route/v1/{profile}/{lng,lat;…}?overview=full&geometries=geojson`, adding `&alternatives=3` when alternatives are requested. The waypoints are, in order: start, then each stop, then the optional `via` detour point, then the destination. OSRM expects coordinates in `lng,lat` order. `parseRoutes` keeps only responses with `code === "Ok"` and converts each route to `{ distance, duration, path: [[lat, lng], …] }`.

## Choosing routes: `fetchRoutes` (src/app.js)

1. The first request asks for up to 3 alternatives.
2. With stops, or with car mode, or when OSRM already returned 2 or more routes, the result goes straight to `pickRoutes`.
3. Otherwise (a walk with a single route), `detourWaypoints` puts two side points, one on each side of the start→destination line, perpendicular to its midpoint and offset by max(150 m, 25 % of the distance). One routed request goes through each side point (`Promise.allSettled`, so failures are ignored). The first route of each reply is added to the candidates.
4. `pickRoutes(candidates, 3)` sorts the candidates by duration and keeps the fastest. It then adds the others in order, skipping any route longer than 1.6× the shortest distance and any route that overlaps a kept route by 80 % or more. Overlap is `routeOverlap`: the share of 25 m samples within 20 m of the other route's polyline.

## Drawing and selection

`drawRoutes` adds one grey Leaflet polyline and one panel button per route ("Route n · distance · duration"), selects route 0 (blue, brought to front) and fits the map to the routes, stops, destination and user marker. Clicking either the line or the button selects that route. The line click does not bubble, so it does not open the map's "Add stop here" popup.

## Status and edge cases

`updateRoutes` writes "Computing walking/driving routes…" while it works, then either a one-route summary ("… on foot / by car via N stops") or "N walking/driving routes … · fastest …". It also handles:
- **No position yet**: it centres on the destination, shows "Waiting for your location…" and sets `pendingRoute`. The next geolocation fix retries.
- **Errors**: "Routing failed: …", or with stops "No … route found. (…)".
- **No route**: "No walking/driving route found." (with stops: "Try removing a stop.").

After drawing, it shows the [phone QR card](phone-qr-handoff.md) and, for walking, starts the [pleasure score](pleasure-score.md). For how stops are added see [Stops](stops.md).

Tests: `test/routes.test.js` (URL building, parsing, detours, overlap, pickRoutes) and `test/modes.test.js` (mode profiles and URLs).
