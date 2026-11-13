---
type: feature
title: Stops
description: Users can add up to five ordered stops from search results or by clicking the map; stops can be reordered, removed or cleared, survive mode and destination changes, and make routes pass through each stop in order.
tags: [feature, stops, waypoints, routing]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Stops

A stop is `{ name, lat, lng }`. Routes go from the user's position through every stop **in list order** to the destination.

## List operations (`src/geo.js`)

All helpers are pure and never mutate the list they get:

- `addStop(stops, place, max = MAX_STOPS)` returns `{ stops, error }`. `error` is `"limit"` when there are already `MAX_STOPS` (5) stops, `"duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m, haversine) of an existing stop, otherwise `null` with the stop appended.
- `removeStop(stops, index)` drops one stop; an invalid index returns an unchanged copy.
- `moveStop(stops, index, delta)` swaps the stop with its neighbour (`-1` up, `1` down); out-of-range moves are no-ops.
- `mapPointStop({ lat, lng })` names a map point "Point on map (lat, lng)" with 5 decimals.

## UI (`src/app.js`)

- **Adding**: the "Add as stop" button next to a [search result](place-search.md), or a click on the map, which opens a Leaflet popup with "Add stop here". `tryAddStop` shows "You can add at most 5 stops." or "This place is already a stop." on error.
- **List**: `#stops-box` (hidden when empty) shows numbered stops with ↑, ↓ and ✕ buttons (the first/last arrows are disabled), plus "Clear stops". Each stop also gets a numbered orange marker on the map with a tooltip.
- Every change goes through `setStops(next)`: re-render the list and markers, then `updateRoutes()`.
- Stops are kept when the travel mode or the destination changes. With stops but no destination, the status reads "Choose a destination to get a route through your stops."

## Effect on routing

`updateRoutes` copies the list at request time, so later edits do not change an in-flight request. With stops, only OSRM's own alternatives are used (often a single route) and no detours are forced; errors read "No walking route found. Try removing a stop." See [Routing and travel modes](routing.md). The [pleasure score](walking-pleasure.md) uses the straight-line length through the stops for its distance limit.

Tests: `test/stops.test.js`.
