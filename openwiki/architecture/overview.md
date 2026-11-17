---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built - a static, build-free browser app split into a DOM/network module (src/app.js) and a pure helper module (src/geo.js), talking directly to public OpenStreetMap services.
tags: [architecture, frontend, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Architecture overview

Barnacle Maps is a single static web page. There is no backend of its own, no build step and no runtime npm dependencies: the browser loads `index.html`, Leaflet 1.9.4 from unpkg, `styles.css` and the ES module `src/app.js`, which imports `src/geo.js`. All search, routing and tile requests go straight from the browser to public OpenStreetMap services (see [External services and privacy](../integrations/external-services.md)).

For the diagrams of how data moves between the user, the browser modules and the outside services, see [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md).

## Files and responsibilities

| File | Role |
| --- | --- |
| `index.html` | Page skeleton: `#map`, the panel with `#search-form`, the travel-mode radio group `#mode` (Walk / Car / Bike), `#results`, `#stops-box`, `#routes` and the live `#status` line. Loads Leaflet from unpkg and `src/app.js` as a module. |
| `src/app.js` | Everything that touches the DOM, Leaflet, `navigator.geolocation` or `fetch`: event handlers, app state, network calls, drawing routes and markers. |
| `src/geo.js` | Pure helpers with no DOM and no fetch, so they can be unit tested in Node: formatting, URL builders and response parsers for Nominatim and OSRM, the `TRAVEL_MODES` table, stop-list operations, local geometry (detours, overlap, route picking) and the green-pixel maths for the pleasure score. |
| `styles.css` | Layout of the floating panel, the segmented mode selector, stop markers and route buttons. |

This split is the main extension seam: new logic that can be expressed as data in / data out belongs in `geo.js` with a test under `test/`; `app.js` only wires it to the page.

## Application state

`app.js` keeps its state in module-level variables, nothing is persisted (no cookies, no local storage):

- `position` - the latest geolocation fix, updated by `navigator.geolocation.watchPosition`;
- `currentPlace` - the chosen destination;
- `stops` - the ordered list of up to 5 stops (see [Stops](../features/stops.md));
- `mode` - the travel mode, `"foot"` by default (see [Routing and travel modes](../features/routing-and-travel-modes.md));
- `routeLayers` / `selectedRoute` - the drawn routes and which one is highlighted.

The map starts on Paris (48.8566, 2.3522, zoom 13) and recentres once on the first position fix.

## Request sequencing

Two counters protect the UI from out-of-order answers:

- `searchSeq` is incremented for each search; a search answer whose sequence number is no longer current is dropped.
- `routeSeq` is incremented by every `updateRoutes()` call; route answers and pleasure scores for an older sequence are ignored, and a running pleasure computation is aborted through `pleasureAbort`.

`updateRoutes()` is the single entry point that recomputes routes. It runs when a destination is chosen, when the stop list changes, when the travel mode changes (if a destination exists) and when the first position arrives while a route was waiting (`pendingRoute`). It copies `stops` at the start so one request uses a consistent list.

## Main flows

1. **Search** - typing or submitting the form queries Nominatim; results are listed with "Add as stop" buttons ([Place search](../features/search.md)).
2. **Route** - choosing a result calls `showRoute()`, which places a destination marker and calls `updateRoutes()`; OSRM routes are fetched for the current mode and stops, filtered by `pickRoutes`, drawn and summarised in `#status`.
3. **Pleasure** - for modes with the `pleasure` flag, `scorePleasure()` loads OSM tiles along the drawn routes and labels each route ([Pleasure score](../features/pleasure-score.md)).

## Related pages

- [Routing and travel modes](../features/routing-and-travel-modes.md)
- [Place search and suggestions](../features/search.md)
- [External services and privacy](../integrations/external-services.md)
- [Running and testing](../operations/running-and-testing.md)
