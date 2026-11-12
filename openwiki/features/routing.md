---
type: feature
title: Routing, alternatives and detours
description: How Barnacle Maps computes and shows up to three routes with OSRM. Covers the walk and car travel modes, OSRM alternatives, forced walking detours through side waypoints, the pickRoutes selection rules, drawing and selecting routes, and the status messages.
tags: [routing, osrm, alternatives, detours, travel-modes, leaflet]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Routing, alternatives and detours

Routes always go from the user's live position, through any [stops](stops.md) in list order, to the chosen destination. The flow is `updateRoutes()` → `fetchRoutes()` → `pickRoutes()` → `drawRoutes()` in `src/app.js`, with the URL building and the selection logic in `src/geo.js`.

## Travel modes

`TRAVEL_MODES` in `src/geo.js` defines:

| Mode | Label | OSRM server | Profile |
| --- | --- | --- | --- |
| `foot` (default) | Walk | `https://routing.openstreetmap.de/routed-foot` | `foot` |
| `car` | Car | `https://routing.openstreetmap.de/routed-car` | `driving` |

The `#mode` radio group switches `mode`. Values that are not in `TRAVEL_MODES` are ignored. If a destination is set, the routes are recomputed and the stops are kept. Car mode changes the status wording ("driving routes", "by car") and has no [pleasure score](pleasure-score.md).

## When routes are (re)computed

`updateRoutes()` runs:

- when a destination is chosen (`showRoute`);
- when the stops change (`setStops`);
- on a mode change while a destination is set;
- on the first geolocation fix after a route was left waiting (`pendingRoute`).

Ordinary position updates do **not** recompute the routes.

Each run:

1. snapshots the mode, the destination and the stops;
2. increments `routeSeq`;
3. aborts pleasure scoring;
4. clears the old lines and panel entries.

Without a destination, the status line only asks the user to choose one when there are stops. Without a position, the map centres on the destination and the status line shows "Waiting for your location…".

## `fetchRoutes`: alternatives and detours

1. It requests `routeUrl(position, place, undefined, { alternatives: 3, mode, stops })`, which asks OSRM for up to 3 alternatives.
2. If the request is stale or returned no route, it returns the result unchanged.
3. **With stops**, it returns `pickRoutes(main)`. No artificial detours are added, and OSRM often returns a single route.
4. If OSRM returned **2 or more routes, or the mode is car**, it returns `pickRoutes(main)`. Detours through arbitrary side points give silly car routes, so they are never forced in car mode.
5. Otherwise, for a short walk with no alternatives, it computes `detourWaypoints(position, place)`. These are two points on either side of the straight line, offset by `max(150 m, 25 % × length)`. It requests a route through each one with `via`, using `Promise.allSettled` so that a failed detour is just ignored. It then picks from the main route plus the detours.

## `pickRoutes(candidates, max = 3)` rules

- Sort by duration. The fastest route is always kept.
- Skip any candidate longer than 1.6 × the shortest distance.
- Keep a candidate only if its `routeOverlap` with every route already kept is below 0.8. `routeOverlap` is the share of points sampled every 25 m (`samplePath`) that lie within 20 m of the other route's polyline (`pointToSegmentDistance`).
- Stop at `max` routes. The input array is never mutated.

## Drawing and selection

`drawRoutes(routes, mode, departure)`:

- draws a grey `L.polyline` for each route, with `bubblingMouseEvents: false` so that clicking a line does not open the "Add stop here" popup;
- adds a panel `<button>` labelled `Route n · distance · duration, arrive HH:MM` (see [Arrival time](arrival-time.md)), plus a pleasure span in walking mode.

Clicking a line or a button calls `selectRoute(i)`, which:

- restyles that line blue (`SELECTED_STYLE`) and brings it to the front;
- sets `aria-pressed` and the `selected` class on its button.

Route 1, the fastest, is selected first, and the map fits all route lines and markers. `routesBbox` in `geo.js` computes a padded bounding box but is currently only used by tests; the app uses Leaflet's `featureGroup().getBounds()`.

## Status messages

- While computing: "Computing walking routes…" or "Computing driving routes…".
- One route: `2.10 km · 25 min on foot` (or `by car`), plus ` via N stops`.
- Several routes: `3 walking routes via 1 stop · fastest 2.10 km · 25 min`.
- No route: "No walking route found." (or "No driving route found."). With stops, it adds "Try removing a stop.".
- Request failure: `Routing failed: <msg>`, or with stops `No … route found. (<msg>)`.

## Tests

- `test/routes.test.js` (groups A–H) covers `routeUrl`, `parseRoutes`, `detourWaypoints`, `samplePath`, `pointToSegmentDistance`, `routeOverlap`, `pickRoutes` and `routesBbox`.
- `test/modes.test.js` covers `TRAVEL_MODES` and the per-mode URLs.
