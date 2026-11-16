---
type: feature
title: Stops (multi-point journeys)
description: How users add, reorder and remove up to five intermediate stops, how the stops list is kept, and how stops change route requests, detours and the pleasure limits.
tags: [stops, waypoints, routing, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Stops (multi-point journeys)

A journey can pass through up to 5 stops between the user's position and the destination. Routes visit every stop in list order.

## Data and helpers

A stop is `{ name, lat, lng }`. The list lives in the `stops` variable of `src/app.js`. The pure helpers in `src/geo.js` never change the list they receive:

- `addStop(stops, place, max = MAX_STOPS)` returns `{ stops, error }`. `error` is `"limit"` when there are already `MAX_STOPS` (5) stops, `"duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m, by `haversine`) of an existing stop, and `null` otherwise. In that case the place is appended.
- `removeStop(stops, index)` and `moveStop(stops, index, delta)` return a new list. Invalid indexes return an unchanged copy.
- `mapPointStop({lat, lng})` names a map point "Point on map (lat, lng)" with 5 decimals.

## Adding stops

- From a search result: the "Add as stop" button. See [Place search](place-search.md).
- From the map: clicking the map opens a popup with an "Add stop here" button. Clicks on route lines do not open it, because they do not bubble.

Both call `tryAddStop`. A refusal shows "You can add at most 5 stops." or "This place is already a stop." in the status line.

## Editing and display

`setStops(next)` replaces the list, re-renders it and calls `updateRoutes()`. `renderStops` draws:

- numbered `stop-marker` div icons on the map, with tooltips;
- the `#stops` ordered list, with ↑ / ↓ / ✕ buttons that have accessible labels ("Move stop 2 up", …). The first stop cannot move up and the last cannot move down;
- the `#stops-box`, which is hidden when there are no stops. "Clear stops" empties the list.

Stops stay when the destination or the travel mode changes. With stops but no destination, the status reads "Choose a destination to get a route through your stops.".

## Effect on routing

`updateRoutes` copies `stops` at the start of each request and passes them to `routeUrl`, which puts them between the start and the destination. With at least one stop, `fetchRoutes` never adds detour routes. Only OSRM's own alternatives are used, and with stops OSRM often returns a single route. Status texts add " via N stop(s)". Failures say the mode's "No … route found." plus "Try removing a stop." or the error.

For the [pleasure score](pleasure-score.md), the 15 km straight-line limit is measured through the stops (`straightLineLength([position, ...stops, place])`).

## Tests

`test/stops.test.js` covers the stops order in `routeUrl`, `addStop` limit and duplicate, `moveStop`, `removeStop`, `mapPointStop` and `straightLineLength`. `test/bike.test.js` checks that stops keep their order in bike URLs, and `tests/ai/us3-bike-stops.md` is the browser scenario for bike routes with stops. See also [Routing and travel modes](routing-and-travel-modes.md).
