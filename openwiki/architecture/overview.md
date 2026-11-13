---
type: architecture
title: Architecture overview
description: Barnacle Maps is a dependency-free static web app; index.html loads Leaflet from unpkg and the ES module src/app.js, which drives the UI and calls OpenStreetMap services, with pure logic in src/geo.js.
tags: [architecture, overview, leaflet, frontend]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Architecture overview

Barnacle Maps is a small navigation web app that runs entirely in the browser. There is no build step, no backend of its own and no npm dependency: `npm start` only serves the repository folder with `python3 -m http.server 8000` (see [Running and configuration](../operations/running-and-configuration.md)).

For how data moves between the browser, the static server and the third-party services, see the data flow model in [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md). Library versions are listed in [sbom/SBOM.md](../../sbom/SBOM.md).

## Parts

| File | Role |
| --- | --- |
| `index.html` | Page skeleton: `#map`, the side `#panel` (search form, mode radios, results, stops, routes, status) and the `#route-card` summary bar. Loads Leaflet's CSS and JS from unpkg, then `src/app.js` as a module. |
| `styles.css` | Layout: full-screen map, floating panel, route card at the bottom centre. |
| `src/app.js` | Controller: creates the Leaflet map and OSM tile layer, wires DOM events, watches geolocation, fetches search/routing/tiles, draws routes and markers. Holds all state. |
| `src/geo.js` | Pure helpers with no DOM or `fetch`: formatting, Nominatim/OSRM URL building and parsing, route de-duplication, detour waypoints, stop list operations, pixel/tile geometry for the pleasure score, arrival time formatting. Unit tested directly in Node. |

The split between `app.js` (side effects) and `geo.js` (pure functions) is the main design rule: anything that can be computed without the browser lives in `geo.js` so `node --test` can cover it (see [Testing](../testing/test-suites.md)).

## External services

All are public OpenStreetMap-ecosystem services called directly from the browser, without API keys:

- **OSM tiles** (`tile.openstreetmap.org`) for the base map and, at zoom 16, for the [pleasure score](../features/walking-pleasure.md).
- **Nominatim** for [place search](../features/place-search.md).
- **OSRM** on `routing.openstreetmap.de` (`routed-foot`, `routed-car`) for [routing](../features/routing.md).
- **unpkg** serves Leaflet 1.9.4.

See [External services, security and privacy](../integrations/external-services.md).

## Feature map

- [App state and request lifecycle](app-state-and-lifecycle.md): how a destination becomes drawn routes.
- [Place search](../features/place-search.md), [Routing and travel modes](../features/routing.md), [Stops](../features/stops.md), [Walking pleasure score](../features/walking-pleasure.md), [Route summary card](../features/route-summary-card.md).
