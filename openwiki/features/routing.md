---
type: feature
title: Routing and travel modes
description: How routes are requested from OSRM (walking or car profile), how extra detour routes are forced for short walks, how candidates are filtered to up to three distinct routes, and how routes are drawn and selected.
tags: [feature, routing, osrm, travel-mode, leaflet]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-1778c2bc3ebc361f3bc7daac
    resource: repo://test/modes.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Routing and travel modes

Routes come from the public OSRM instances on `routing.openstreetmap.de`. The request cycle around them (sequencing, statuses, pending position) is described in [App state and request lifecycle](../architecture/app-state-and-lifecycle.md).

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines the two modes:

| Key | Label | Base URL | OSRM profile |
| --- | --- | --- | --- |
| `foot` | Walk | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` | Car | `https://routing.openstreetmap.de/routed-car` | `driving` |

The `#mode` radio group sets `mode`; changing it recomputes routes if a destination exists, keeping the stops. Unknown values are ignored. Only walking routes get the [pleasure score](walking-pleasure.md).

## Request URL

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds `…/route/v1/<profile>/<lng,lat;…>?overview=full&geometries=geojson`, adding `&alternatives=3` when alternatives are asked. Points are ordered: start, every stop in order, optional `via` waypoint, destination. OSRM expects `lng,lat` order. An unknown mode falls back to `foot`.

`parseRoutes(json)` returns `[]` unless `code === "Ok"`, and converts each route to `{ distance, duration, path }` with the path in Leaflet's `[lat, lng]` order.

## Choosing routes (`fetchRoutes` in `src/app.js`)

1. Ask OSRM for the main route plus up to 3 alternatives.
2. With [stops](stops.md), or in car mode, or when OSRM already returned at least two routes, keep `pickRoutes(main)`.
3. Otherwise (a walk with a single route) request two **detour** routes through `detourWaypoints(position, place)`: points offset perpendicular from the midpoint of the straight line, on each side, by `max(150 m, 25 % of the distance)`. Failed detour requests are ignored (`Promise.allSettled`). Car detours are not forced because they give silly routes.

`pickRoutes(candidates, max = 3)` sorts by duration and keeps the fastest, then each next candidate that is at most 1.6 × the shortest distance and overlaps every kept route by less than 80 % (`routeOverlap`: share of points sampled every 25 m that lie within 20 m of the other polyline).

## Drawing and selecting

`drawRoutes` adds one grey Leaflet polyline per route and one panel button "Route N · distance · duration" (plus a pleasure span for walks). Clicking either selects the route: the selected line turns blue, is brought to front, its button gets `aria-pressed="true"`, and the [route summary card](route-summary-card.md) updates. Route lines do not bubble clicks, so they do not open the map's "Add stop here" popup. The map is fitted to routes, stops, destination and position. The status line summarises the result, e.g. "3 walking routes · fastest 2.35 km · 25 min".

Errors: a failed request shows "Routing failed: …" (or "No walking/driving route found. (…)" with stops); an empty result shows "No walking route found." / "No driving route found."

Tests: `test/routes.test.js` (parsing, detours, overlap, `pickRoutes`), `test/modes.test.js` (mode URLs and labels).
