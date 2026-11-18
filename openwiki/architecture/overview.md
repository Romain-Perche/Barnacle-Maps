---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built as a browser-only app, with a DOM and network layer in src/app.js and pure, testable helpers in src/geo.js, plus the shared state and request-sequencing rules that tie its features together.
tags: [architecture, browser, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Architecture overview

Barnacle Maps is a small static web app. Everything runs in the user's browser. There is no backend, no build step and no stored data. The repo has three runtime files and one stylesheet:

| File | Role |
| --- | --- |
| `index.html` | Page shell: the `#map` container, and the `#panel` with search form, travel-mode selector, results list, stops box, routes list and `#status` line. It loads Leaflet 1.9.4 from unpkg as a classic script and `src/app.js` as an ES module. |
| `src/app.js` | The controller. It owns every DOM element, the Leaflet map, browser geolocation, all `fetch` calls and all mutable UI state. |
| `src/geo.js` | Pure helpers with no DOM access and no `fetch`: formatting, URL building, response parsing, route geometry and selection, stop-list operations and green-pixel maths. Because it is pure, the Node unit tests cover it directly. |
| `styles.css` | Layout of the floating panel, the segmented mode selector, route buttons and stop markers. |

For how data moves between the browser, the OpenStreetMap services and the local file server, see the data flow model in [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md). It is not repeated here.

## The split between app.js and geo.js

`src/geo.js` begins with a comment that sets its rule: no DOM and no fetch, so it can be unit tested in Node. `src/app.js` imports what it needs from it (`routeUrl`, `searchUrl`, `parseRoutes`, `pickRoutes`, `detourWaypoints`, `addStop`, `pathPixels`, `countGreenPixels`, `TRAVEL_MODES`, …) and handles the side effects itself. Follow the same rule when you add a feature: put logic that can be computed in `geo.js` and test it, and keep `app.js` as glue.

`TRAVEL_MODES` in `geo.js` is the single table of per-mode behaviour (OSRM base URL and profile, whether pleasure is scored, whether detours are forced, status texts). `app.js` reads its flags rather than testing mode names. See [Routing and travel modes](../features/routing-and-travel-modes.md).

## Shared state in app.js

`app.js` keeps its state in module-level variables:

- `position`: the latest `{lat, lng}` from `navigator.geolocation.watchPosition`. The first fix centres the map once (`centered`).
- `currentPlace`: the chosen destination. `stops`: the ordered stops list. `mode`: `"foot"`, `"car"` or `"bike"`.
- `routeLayers`: one `{route, line, button, pleasure}` entry per drawn route. `selectedRoute` is the highlighted one.
- `pendingRoute`: set when a destination is chosen before any position is known. The next position fix then calls `updateRoutes()`.
- `pleasureAbort`: the `AbortController` of the pleasure tile downloads that are running.

`updateRoutes()` is the one place that recomputes routes. Choosing a destination (`showRoute`), changing the stops (`setStops`), changing the mode radio, and the first position fix after a pending route all call it. It reads `mode`, `currentPlace` and a copy of `stops` at the start, so a request stays consistent even if the user edits things while it runs.

## Request sequencing

Network replies can arrive out of order, so every async flow is guarded by a counter:

- **Search**: `runSearch` takes `seq = ++searchSeq` and drops its result if `searchSeq` has moved on. Choosing a place, adding a stop from a result, or clearing the input also bumps `searchSeq`, which discards suggestions still in flight.
- **Routes**: `updateRoutes` takes `seq = ++routeSeq`, aborts any running pleasure download, and clears the drawn routes. `fetchRoutes`, `updateRoutes` and `scorePleasure` check `seq !== routeSeq` after every await and stop silently when the request is stale.

So only the newest search and the newest route request ever change the UI.

## Rendering and the map

The map starts on Paris (`DEFAULT_VIEW`) with the OSM tile layer. The panel lists (results, routes, stops) are built with `document.createElement` and `textContent`. The Leaflet destination popup and stop tooltips get place names as strings, which Leaflet renders as HTML (see [security notes](../operations/running-and-configuration.md#security-notes)). Route polylines use `bubblingMouseEvents: false`, so clicking a route selects it and does not open the map-click "Add stop here" popup. After drawing, the map fits the bounds of the routes, stop markers, destination and user marker.

## Feature pages

- [Place search and suggestions](../features/place-search.md)
- [Routing and travel modes](../features/routing-and-travel-modes.md)
- [Stops](../features/stops.md)
- [Pleasure score](../features/pleasure-score.md)
- [External services](../integrations/openstreetmap-services.md)
