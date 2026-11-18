---
type: feature
title: Stops
description: Intermediate stops in Barnacle Maps - adding up to 5 from search results or map clicks, duplicate detection, reordering, removing and clearing, and how stops change routing and the pleasure score.
tags: [stops, waypoints, routing, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Stops

A journey can pass through up to 5 intermediate stops. Routes go from the user's position through every stop, in list order, to the destination.

## Data and rules

A stop is `{ name, lat, lng }`. The list lives in `stops` in `src/app.js`; the helpers in `src/geo.js` never mutate the list they get and always return a new one:

- `addStop(stops, place)` appends the stop, or returns `error: "limit"` when there are already `MAX_STOPS` (5) stops, or `error: "duplicate"` when the place is within 20 m (`STOP_DUPLICATE_M`, by haversine distance) of an existing stop. The app shows "You can add at most 5 stops." or "This place is already a stop.".
- `removeStop(stops, index)` drops one stop; an invalid index returns an unchanged copy.
- `moveStop(stops, index, delta)` swaps a stop with its neighbour (`-1` up, `+1` down); out-of-range moves return an unchanged copy.
- `mapPointStop(latlng)` names a clicked point `Point on map (lat, lng)` with 5 decimals.

## UI

- **From search**: the "Add as stop" button next to each [search result](search.md).
- **From the map**: a click on the map opens a popup with "Add stop here". Clicks on a route line do not open it (they select the route).
- The `#stops-box` panel lists the stops numbered, each with ↑ / ↓ (disabled at the ends) and ✕ buttons, plus "Clear stops". It is hidden when there are no stops. Each stop also gets a numbered marker on the map with a tooltip.

Every change goes through `setStops`, which re-renders the list and markers and calls `updateRoutes()`. Without a destination, the status reads "Choose a destination to get a route through your stops.". Stops are kept when the travel mode or the destination changes.

## Effect on routing and pleasure

- Stops are inserted between start and destination in the OSRM request (`routeUrl`). The list is copied at request time, so edits during a request do not mix into it.
- With stops, only OSRM's own routes are used: no forced walking detours. OSRM usually returns fewer alternatives (often one).
- Error texts mention stops: "No … route found. Try removing a stop." or the error in brackets.
- The [pleasure](pleasure-score.md) distance guard measures the straight line through all stops.

## Tests

`test/stops.test.js` covers the list helpers. See [Testing](../testing/testing.md); the AI scenario `tests/ai/us3-stops.md` checks stops with bike routes.

## Related pages

- [Routing and travel modes](routing-and-travel-modes.md), [Place search](search.md)
