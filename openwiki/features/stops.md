---
type: feature
title: Stops
description: How users add, reorder and remove up to 5 ordered stops (from search results or map clicks), how duplicates are rejected, and how stops change routing.
tags: [stops, waypoints, routing, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Stops

A journey goes from the user's position through every stop, in list order, to the destination.
Stops live only in memory (`stops` in `src/app.js`), as `{ name, lat, lng }`.

## List operations (src/geo.js)

The helpers never mutate the list they receive:

- `addStop(stops, place, max = 5)` returns `{ stops, error }`: error `"limit"` when `MAX_STOPS` (5)
  are already set, `"duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m, haversine) of an
  existing stop, otherwise `null` with the stop appended.
- `removeStop(stops, i)` and `moveStop(stops, i, delta)` return a copy; out-of-range or non-integer
  indexes leave the list unchanged. Moving swaps with the neighbour (`-1` up, `1` down).
- `mapPointStop({ lat, lng })` names a map point `Point on map (lat, lng)` with 5 decimals.

## UI (src/app.js)

- **Adding**: "Add as stop" next to a [search result](search.md), or click the map and choose "Add
  stop here" in the popup. `tryAddStop` shows `You can add at most 5 stops.` or `This place is
  already a stop.` on error.
- **Editing**: each listed stop has up/down arrows (disabled at the ends) and a remove button;
  "Clear stops" empties the list. The stops box is hidden when empty.
- **Markers**: numbered circular `divIcon` markers with a tooltip.

Every change goes through `setStops`, which re-renders and calls `updateRoutes()`. Stops are kept
when the travel mode or destination changes.

## Effect on routing

Stops are inserted between the start and destination in the OSRM request. With stops, no artificial
detour routes are added, so OSRM's own alternatives (often a single route) are shown, and
error messages suggest removing a stop. See [Routing](routing.md). The pleasure distance limit
counts the straight line through the stops ([Pleasure](pleasure.md)).
