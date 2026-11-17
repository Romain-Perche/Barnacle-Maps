---
type: feature
title: Stops
description: How users add, reorder and remove up to five intermediate stops, how duplicates and the limit are enforced, and how stops change route computation.
tags: [stops, waypoints, routing, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-f5cd3d802481729626fed340
    resource: repo://test/stops.test.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Stops

A journey can pass through up to **5 stops** (`MAX_STOPS`) between the user's position and the destination. Routes visit them in list order. A stop is `{ name, lat, lng }`.

## Adding a stop

- From a search result: the **Add as stop** button next to a place (see [Place search](search.md)).
- From the map: clicking the map (not a route line) opens a popup with **Add stop here**; the stop is named `Point on map (lat, lng)` with 5 decimals (`mapPointStop`).

Both go through `tryAddStop(place)`, which calls the pure `addStop(stops, place)` from `src/geo.js`:

- at the limit it returns error `limit` → status "You can add at most 5 stops.";
- a place within 20 m (`STOP_DUPLICATE_M`, haversine distance) of an existing stop returns `duplicate` → "This place is already a stop.";
- otherwise the stop is appended.

## Editing the list

`#stops-box` (hidden when empty) lists numbered stops with ↑ / ↓ (`moveStop`, swap with a neighbour; disabled at the ends), ✕ (`removeStop`) and a **Clear stops** button. The list helpers never mutate their input and ignore out-of-range indexes. Numbered round markers (`stop-marker` div icons) are drawn on the map.

Every change goes through `setStops(next)`, which redraws the list and markers and calls `updateRoutes()`. With stops but no destination, the status says "Choose a destination to get a route through your stops."

## Effect on routing

- Stops are inserted between start and destination in the OSRM request (`routeUrl`).
- With stops no forced detour routes are added; OSRM usually returns fewer alternatives (often one).
- Stops are kept when the travel mode or destination changes.
- Status texts mention them ("… via 2 stops"), and a no-route answer suggests "Try removing a stop."
- The pleasure distance guard measures the straight line through all stops.

See [Routing and travel modes](routing-and-travel-modes.md).

## Tests

`test/stops.test.js` covers `addStop`, `removeStop`, `moveStop`, `mapPointStop` and stop-aware `routeUrl`; `tests/ai/us3-bike-stops.md` drives stops with bike mode in the browser.

## Related pages

- [Routing and travel modes](routing-and-travel-modes.md)
- [Place search and suggestions](search.md)
