---
type: feature
title: Stops along a journey
description: How the user adds up to 5 ordered stops, from search results or by clicking the map. It covers duplicate detection, reordering, removing and clearing stops, and how stops change routing, alternatives, the pleasure score and the phone link.
tags: [feature, stops, waypoints, routing]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Stops along a journey

Stops are ordered waypoints between the user's position and the destination. A stop is a plain `{ name, lat, lng }` object. The list lives in `stops` in `src/app.js`. The list helpers in `src/geo.js` never mutate their input; they always return a new list.

## Adding

- From a search result's **"Add as stop"** button (see [Search](search-and-suggestions.md)).
- By clicking the map: a Leaflet popup offers **"Add stop here"**. The new stop is named by `mapPointStop` as "Point on map (lat, lng)" with 5 decimals. Clicking a route line does not open this popup.

`addStop(stops, place)` returns `{ stops, error }`. The error is `"limit"` when `MAX_STOPS` (5) stops already exist, and `"duplicate"` when the place is within `STOP_DUPLICATE_M` (20 m, haversine) of an existing stop. `tryAddStop` turns these errors into status messages and leaves the list unchanged.

## Editing

`renderStops` draws numbered markers (`.stop-marker` div icons with tooltips) and the `#stops` list. Each row has ↑ / ↓ buttons (`moveStop`, disabled at the ends) and ✕ (`removeStop`). "Clear stops" empties the list. Invalid indices make the helpers return an unchanged copy. Every change goes through `setStops`, which re-renders and calls `updateRoutes()`.

## Effect on routing and other features

- The routing request visits the stops in list order (`routeUrl` puts them between the start and the destination). Each request takes a copy of the list, so a change during a request cannot mix two lists.
- With stops, no forced detour routes are added. OSRM's own alternatives are kept, and OSRM often returns only one route.
- Stops are kept when the destination or the travel mode changes. With stops but no destination, the status asks the user to choose a destination.
- The pleasure distance limit counts the straight-line path through the stops ([Pleasure](pleasure-score.md)).
- The [phone link](phone-qr-handoff.md) leaves the stops out and shows a note saying so.

Tests: `test/stops.test.js`.
