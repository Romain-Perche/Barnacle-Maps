---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built as a single-page browser app with no build step, split between the DOM/Leaflet controller in src/app.js and pure, testable helpers in src/geo.js.
tags: [architecture, frontend, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Architecture overview

Barnacle Maps is a static, single-page web app. There is no backend of its own, no build step and
no package dependencies: a static file server delivers `index.html`, `styles.css` and two ES
modules, and everything else happens in the user's browser against public OpenStreetMap services.
For the diagram of who sends what to whom, see [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

## Building blocks

| Piece | Role |
| --- | --- |
| `index.html` | The page: a `#map` element and a `#panel` with the search form, the Walk/Car radio group, the result list, the stops box, the route list and a `role="status"` line. Loads Leaflet 1.9.4 from unpkg, then `src/app.js` as a module. |
| `src/app.js` | The controller. Owns all module state, the Leaflet map, DOM rendering, event handlers and every `fetch`. |
| `src/geo.js` | Pure helpers with no DOM access and no `fetch`: distance and formatting, Nominatim/OSRM URL builders and parsers, route selection, stop list operations and the pleasure pixel math. This is what the unit tests import. |
| `styles.css` | Layout of the map and the floating panel. |

The split is deliberate: anything that can be expressed as a pure function lives in `geo.js` so it
can be tested with `node --test` without a browser (see [Testing](../testing/tests.md)). `app.js`
only wires those functions to the network, Leaflet and the DOM.

## Module state in app.js

All state is module-level `let` variables in `app.js`; nothing is persisted (no `localStorage`,
cookies or server storage), so a reload starts fresh.

- `position` — the latest `{ lat, lng }` from `navigator.geolocation.watchPosition`, or `null`.
- `currentPlace` — the chosen destination; `mode` — `"foot"` or `"car"`.
- `stops` — the ordered list of `{ name, lat, lng }` stops (see [Stops](../features/stops.md)).
- `routeLayers` — one `{ route, line, button, pleasure }` entry per drawn route, plus
  `selectedRoute`.
- `pendingRoute` — set when a destination was chosen before the position was known; the next
  position update calls `updateRoutes()`.
- `searchSeq`, `routeSeq`, `pleasureAbort` — request sequencing (below).

## Request sequencing

Every user action may start network work that finishes out of order, so `app.js` uses counters:

- `runSearch` takes `++searchSeq` and drops its response if a newer search (or a click on a
  result, which also bumps `searchSeq`) happened meanwhile.
- `updateRoutes` takes `++routeSeq`, aborts any running pleasure scoring through
  `pleasureAbort`, clears the drawn routes and ignores its own result if `routeSeq` moved on.
  `fetchRoutes` and `scorePleasure` re-check the same counter before they write to the page.

`updateRoutes()` is the single entry point that recomputes routes; it is called when a destination
is chosen, when stops change, when the travel mode changes and when a pending route gets a
position.

## Main flows

1. **Startup** — the map is centred on Paris (`DEFAULT_VIEW`), OSM tiles load, and the position is
   watched; the first fix recentres the map at zoom 15.
2. **Search** — typing (debounced) or submitting queries Nominatim and lists results nearest
   first. See [Place search](../features/place-search.md).
3. **Route** — clicking a result sets the destination and calls `updateRoutes()`, which queries
   OSRM and draws up to 3 routes. See [Routing](../features/routing.md).
4. **Pleasure** — for walking routes, OSM tiles along the routes are fetched and their green
   pixels counted. See [Pleasure score](../features/pleasure-score.md).

All outside services are listed in [External services](../integrations/openstreetmap-services.md).
