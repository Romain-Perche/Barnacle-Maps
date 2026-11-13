---
type: feature
title: Routing, travel modes and route selection
description: How Barnacle Maps asks OSRM for walking or car routes from the user's position, forces walking detours when OSRM has no alternative, de-duplicates to at most 3 routes, and draws and selects them.
tags: [routing, osrm, travel-mode, leaflet]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-1778c2bc3ebc361f3bc7daac
    resource: repo://test/modes.test.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Routing, travel modes and route selection

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines two modes, chosen with the Walk/Car radios in `index.html`:

| Mode | OSRM server | Profile |
|---|---|---|
| `foot` (default) | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` | `https://routing.openstreetmap.de/routed-car` | `driving` |

Changing mode re-runs routing if a destination is set; stops are kept. An unknown mode falls back to
walking in `routeUrl`.

## Building the request

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds
`<base>/route/v1/<profile>/<coords>?overview=full&geometries=geojson`, where the coordinates
(`lng,lat`, OSRM order) are: start, each stop in order, an optional `via` detour point, then the
destination. `alternatives > 0` appends `&alternatives=3`. `parseRoutes` keeps every route of an
`"Ok"` response as `{ distance, duration, path }` with the path flipped to `[lat, lng]` for Leaflet;
anything else gives `[]`.

## Choosing routes (`fetchRoutes` in src/app.js)

1. Ask OSRM for the main route with alternatives.
2. With [stops](stops.md), or in car mode, or when OSRM already returned 2+ routes: keep
   `pickRoutes(main)`.
3. Otherwise (a walk with a single route) build two `detourWaypoints` - points on either side of
   the start-destination line, offset from its midpoint by max(150 m, 25% of the straight
   distance) - and request one route through each. Failed detour requests are ignored.
4. `pickRoutes(candidates, 3)` sorts by duration, always keeps the fastest, and adds another route
   only if it is at most 1.6x the shortest distance and less than 80% overlapping each kept route
   (`routeOverlap`: share of points sampled every 25 m that lie within 20 m of the other route).

## Drawing and selecting

`drawRoutes` draws each route as a grey Leaflet polyline and adds a button
`Route N · <distance> · <duration>` ([formatting](distance-formatting.md)); walking routes also get
a pleasure span ([pleasure](pleasure.md)). Route 1 (the fastest) starts selected (blue, brought to
front, `aria-pressed="true"`). Clicking a line or a button selects that route; line clicks do not
bubble, so they do not open the "Add stop here" popup. The map then fits all routes, stops and
markers.

## Status messages and failures

- No destination: empty status, or a hint to choose one if stops exist.
- No position yet: the map centres on the destination, status says it is waiting, and the next
  geolocation fix retries (`pendingRoute`).
- Fetch error: `Routing failed: <message>`, or with stops `No walking/driving route found. (<message>)`.
- No route: `No walking route found.` / `No driving route found.`, with stops adding `Try removing a stop.`
- Success: a summary of the fastest route, e.g. `3 walking routes via 1 stop · fastest 1.2 km · 15 min`.

Each run captures `routeSeq`; a newer run (new destination, stop change, mode change) makes older
results be ignored (see [Architecture overview](../architecture/overview.md)).
