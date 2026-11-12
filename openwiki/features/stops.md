---
type: feature
title: Intermediate stops
description: How users add up to five ordered stops, from search results or by clicking the map, then reorder, remove or clear them. Covers the duplicate rule, the immutable stop-list helpers, and how stops change routing, detours and the pleasure score.
tags: [stops, waypoints, routing, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Intermediate stops

A journey can pass through up to **5** stops. Routes go from the user's position through every stop **in list order** to the destination. A stop is a plain `{ name, lat, lng }` object.

## Adding stops

- **From search results:** the "Add as stop" button next to a result clears the search box and the results, then calls `tryAddStop(place)`. See [Place search](place-search.md).
- **From the map:** clicking the map (not dragging) opens a Leaflet popup with an "Add stop here" button. That button adds `mapPointStop(latlng)`, a stop named `Point on map (lat, lng)` with 5 decimals. Route lines use `bubblingMouseEvents: false`, so clicking a route selects it instead of opening this popup.

`tryAddStop` calls `addStop(stops, place)` in `src/geo.js`, which returns `{ stops, error }`:

- `"limit"` when there are already `MAX_STOPS` (5) stops. The status line shows "You can add at most 5 stops.".
- `"duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m, by haversine distance) of an existing stop. The status line shows "This place is already a stop.".
- Otherwise the stop is appended, keeping only its `name`, `lat` and `lng`.

## Editing

`renderStops()` shows `#stops-box` only when there is at least one stop. It renders:

- numbered entries, each with ↑, ↓ and ✕ buttons (with ARIA labels such as "Move stop 2 up"); ↑ is disabled on the first stop and ↓ on the last;
- numbered `stop-marker` div icons on the map, with tooltips.

The edit helpers are `moveStop(stops, i, ±1)` (swap with a neighbour), `removeStop(stops, i)` and "Clear stops" (`[]`). All of them are pure. They return a new array and ignore indexes that are out of range or not integers.

Every change goes through `setStops(next)`, which replaces the list, re-renders and calls `updateRoutes()`. Stops are kept when the travel mode or the destination changes.

## Effect on routing

- `routeUrl` puts the stops between the start and the destination (and before any `via` point). See [Routing](routing.md).
- `updateRoutes` copies `stops` at the start of each computation, so later edits cannot change a request already in flight.
- With stops, `fetchRoutes` never adds forced detours. It only uses OSRM's own alternatives, which with waypoints is usually a single route.
- Status messages say `via N stop(s)`. Without a destination, the status line shows "Choose a destination to get a route through your stops.". When no route is found, it suggests "Try removing a stop.".
- The [pleasure](pleasure-score.md) distance guard measures the straight line from the start, through the stops, to the destination.
- The [arrival time](arrival-time.md) is the time of reaching the final destination.

## Tests

`test/stops.test.js` covers `addStop` (limit, duplicate radius, no mutation), `removeStop`, `moveStop`, `mapPointStop`, `straightLineLength` and the URLs `routeUrl` builds with stops.
