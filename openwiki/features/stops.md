---
type: feature
title: Stops
description: The ordered list of up to five intermediate stops — added from search results or by clicking the map — that every route passes through in order; covers duplicates, reordering, removal and the effect on routing.
tags: [feature, stops, routing, waypoints]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Stops

A journey goes from your position through every stop, in list order, to the destination. Stops are `{name, lat, lng}` objects held in the module variable `stops` in `src/app.js`; all list operations are pure functions in `src/geo.js` that never mutate their input.

## Adding

- **From search** — the "Add as stop" button next to a result ([Place search](search.md)).
- **From the map** — clicking the map (not a route line) opens a popup with "Add stop here"; the stop is named `Point on map (lat, lng)` with 5 decimals (`mapPointStop`).

`addStop(stops, place)` returns `{stops, error}`:

| error | When | Status shown |
| --- | --- | --- |
| `"limit"` | already `MAX_STOPS` (5) stops | "You can add at most 5 stops." |
| `"duplicate"` | the place is within `STOP_DUPLICATE_M` (20 m, haversine) of an existing stop | "This place is already a stop." |
| `null` | otherwise; appended at the end | — |

## Editing

Each row in `#stops` has ↑ / ↓ (`moveStop`, swap with the neighbour; disabled at the ends) and ✕ (`removeStop`). "Clear stops" empties the list. Every change goes through `setStops`, which re-renders the numbered orange map markers and the list, hides `#stops-box` when empty, and calls `updateRoutes`.

Stops survive changing the travel mode or the destination, and the search clear button does not touch them.

## Effect on routing

- Stops are inserted between start and destination in the OSRM URL (`routeUrl`'s `stops` option).
- With stops, no forced detour routes are added; only OSRM's own alternatives are used, so there is often a single route.
- Without a destination, status says "Choose a destination to get a route through your stops."
- When no route is found with stops, the status suggests "Try removing a stop."
- The pleasure limit uses the straight-line length through all stops — see [Pleasure](pleasure.md).

Details of routing are in [Routing](routing.md). Unit tests: `test/stops.test.js`.
