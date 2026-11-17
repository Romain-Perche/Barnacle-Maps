---
type: feature
title: Routing and travel modes
description: How Barnacle Maps asks OSRM for walking, bike and car routes, what the per-mode flags in TRAVEL_MODES control, how detour routes and alternative de-duplication work, and how "no route" answers are shown.
tags: [routing, osrm, travel-modes, bike, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-278e62085e4d44585a3e9b2d
    resource: repo://test/bike.test.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Routing and travel modes

Routes always go from the user's live position, through every [stop](stops.md) in order, to the chosen destination. They are computed by the public OSRM servers at `routing.openstreetmap.de`, one server per travel mode.

## Travel modes

The panel has a segmented radio group `#mode` in `index.html` with three values: `foot` (Walk, default), `car` and `bike`. Every mode is described by one entry of `TRAVEL_MODES` in `src/geo.js`:

| Mode | OSRM server | OSRM profile | `pleasure` | `detours` |
| --- | --- | --- | --- | --- |
| `foot` | `https://routing.openstreetmap.de/routed-foot` | `foot` | yes | yes |
| `car` | `https://routing.openstreetmap.de/routed-car` | `driving` | no | no |
| `bike` | `https://routing.openstreetmap.de/routed-bike` | `bike` | yes | no |

`app.js` reads the flags instead of comparing mode names: `pleasure` decides whether route buttons get a [pleasure score](pleasure-score.md), `detours` whether forced detour routes are tried. Adding a mode means adding an entry here, a radio button in `index.html` and its status texts in `MODE_TEXT` (`src/app.js`).

Changing the radio recomputes routes for the current destination (if any); stops are kept. Values not in `TRAVEL_MODES` are ignored.

## Building the request

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds

```
{base}/route/v1/{profile}/{lng,lat;...}?overview=full&geometries=geojson[&alternatives=3]
```

Coordinates are in OSRM's `lng,lat` order: start, then the stops, then an optional `via` detour point, then the destination. An unknown mode falls back to `foot`.

## Fetching and picking routes

`fetchRoutes()` in `src/app.js`:

1. Requests the main route with `alternatives=3` and parses it with `parseRoutes` (each route becomes `{ distance, duration, path: [[lat, lng], ...] }`).
2. With stops, returns OSRM's own routes only (no artificial detours).
3. If OSRM gave two or more routes, or the mode has `detours: false` (car, bike), returns `pickRoutes(main)`.
4. Otherwise (short walks often get no alternative) it asks for two more routes forced through `detourWaypoints` - points on each side of the start-destination line, offset from its midpoint by max(150 m, 25 % of the straight distance). Failed detour requests are ignored.

`pickRoutes(candidates, 3)` sorts by duration, keeps the fastest, then adds alternatives that are at most 1.6× the shortest distance and overlap every kept route by less than 80 % (`routeOverlap`: share of points sampled every 25 m that lie within 20 m of the other route).

## No route and errors

OSRM answers "no route" with HTTP 400 and code `NoRoute` or `NoSegment`. `fetchRouteJson` recognises this with `isNoRouteResponse` and treats it as zero routes, so the status shows the mode's text ("No walking route found.", "No driving route found.", "No cycling route found."), plus "Try removing a stop." when there are stops. Other HTTP errors show "Routing failed: …" (or the no-route text with the error when there are stops).

Without a position yet, the map centres on the destination, the status says "Waiting for your location to compute a route…" and routing starts on the first fix.

## Display and selection

`drawRoutes()` draws each route as a grey Leaflet polyline and a button "Route N · distance · duration" in `#routes`, then selects route 1 (blue, on top) and fits the map to routes, stops and markers. Clicking a line or a button selects it; line clicks don't bubble to the map, so they don't open the "Add stop here" popup. The status line summarises the fastest route, e.g. "3 cycling routes via 1 stop · fastest 2.40 km · 9 min" or "… by bike" for a single route. Distances and durations are formatted by `formatDistance` / `formatDuration`.

## Tests

`test/routes.test.js` (URLs, parsing, detours, picking), `test/modes.test.js` (car and mode table) and `test/bike.test.js` (bike mode, flags, NoRoute, request shape checked by the fake OSRM). See [Running and testing](../operations/running-and-testing.md).

## Related pages

- [Stops](stops.md)
- [Pleasure score](pleasure-score.md)
- [External services and privacy](../integrations/external-services.md)
- [Architecture overview](../architecture/overview.md)
