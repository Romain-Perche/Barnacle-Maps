---
type: feature
title: Stops
description: How users add up to five intermediate stops from search results or map clicks, reorder and remove them, and how stops change route computation.
tags: [stops, waypoints, routing, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Stops

A journey goes from the user's position through every stop, in list order, to the destination.
The list logic is pure functions in the stops section of `src/geo.js`; rendering and wiring are
`renderStops`, `setStops`, `tryAddStop` and the map click handler in `src/app.js`. The list is held
in memory only.

## Adding a stop

- **From search**: each result row has an "Add as stop" button. It drops pending searches, clears
  the list and the input, and adds the place (see [Place search](place-search.md)).
- **From the map**: a map click opens a Leaflet popup with "Add stop here"; choosing it adds
  `mapPointStop(latlng)`, named `Point on map (lat, lng)` with 5 decimals. Clicks on a route line
  do not open the popup.

`addStop(stops, place)` returns `{ stops, error }` without mutating the input:

- `error: "limit"` when there are already `MAX_STOPS` (5) stops → status "You can add at most 5
  stops.";
- `error: "duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m) of an existing stop →
  "This place is already a stop.";
- otherwise the stop `{ name, lat, lng }` is appended.

## Editing

Each stop row shows `N. name` with ↑, ↓ (disabled at the ends) and ✕ buttons calling `moveStop`
(swap with a neighbour) and `removeStop`; "Clear stops" empties the list. Out-of-range indexes
return an unchanged copy. Numbered `divIcon` markers with tooltips show the stops on the map, and
`#stops-box` is hidden when the list is empty.

## Effect on routing

Every change goes through `setStops`, which re-renders and calls `updateRoutes()`. Stops survive
changes of travel mode and destination. With stops, routes are only OSRM's own alternatives (no
forced detours), so there is often a single route; failures say "No walking/driving route found"
and suggest removing a stop. The pleasure distance guard measures start → stops → destination.
See [Routing](routing.md).

## Tests

`test/stops.test.js` covers adding (limit, duplicate), removing, moving, map-point naming and
`routeUrl` with stops.
