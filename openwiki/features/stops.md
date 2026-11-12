---
type: feature
title: Stops (multi-leg journeys)
description: How users add up to five ordered stops from search results or by clicking the map, how duplicates and the limit are enforced, how stops are reordered, removed and rendered, and how they change routing.
tags: [feature, stops, waypoints, routing, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Stops (multi-leg journeys)

A journey can pass through up to **5** intermediate stops. Routes go from the user's position through every stop **in list order** to the destination. A stop is a plain `{ name, lat, lng }` object.

## Adding stops

- From a [search](../features/search.md) result: **Add as stop**.
- From the map: clicking the map (not a route line) opens a popup with an **Add stop here** button; the stop is named by `mapPointStop`, e.g. `Point on map (48.85000, 2.35000)`.

Both paths call `tryAddStop(place)`, which uses the pure `addStop(stops, place)`:

| Result | Status message |
| --- | --- |
| list already has `MAX_STOPS` (5) | `You can add at most 5 stops.` |
| a stop within `STOP_DUPLICATE_M` (20 m, haversine) exists | `This place is already a stop.` |
| otherwise | stop appended at the end, routes recomputed |

## Managing stops

`renderStops()` draws numbered circular markers (`L.divIcon`, class `stop-marker`, tooltip `1. <name>`) and fills `#stops` with one row per stop: name, ↑ (disabled for the first), ↓ (disabled for the last) and ✕. `#clear-stops` empties the list. `#stops-box` is hidden when there are no stops.

The list helpers in `src/geo.js` never mutate their input:

- `moveStop(stops, index, delta)` swaps with the neighbour; out-of-range moves return an unchanged copy.
- `removeStop(stops, index)` removes one; invalid indices return a copy.

Every change goes through `setStops(next)`: replace the list → re-render → `updateRoutes()`. So adding, reordering, removing or clearing stops always recomputes routes (and their [arrival times](../features/arrival-time.md)). Stops are kept when the travel mode or the destination changes. Without a destination, the status reads `Choose a destination to get a route through your stops.`

## Effect on routing

- `routeUrl` inserts the stops between start and destination.
- `updateRoutes` passes a copy of the list so a request stays consistent even if stops change meanwhile.
- With stops, **no detour routes** are forced; OSRM usually returns fewer alternatives, often one.
- Status texts include ` via N stop(s)`; failures suggest `Try removing a stop.` (see [Routing](../features/routing.md)).
- [Pleasure](../features/pleasure.md) uses the straight-line length through all stops (`straightLineLength`) for its 15 km guard.

## Tests

`test/stops.test.js` covers URL order, `addStop` limit and duplicate rules, immutability of `moveStop`/`removeStop`, `mapPointStop` naming and `straightLineLength`. `test/arrival-panel.test.js` checks that stop changes refresh routes.

## Related pages

- [Routing and travel modes](../features/routing.md)
- [Place search](../features/search.md)
- [Pleasure indicator](../features/pleasure.md)
