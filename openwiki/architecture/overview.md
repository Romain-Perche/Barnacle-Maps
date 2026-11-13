---
type: architecture
title: Architecture overview
description: Barnacle Maps is a dependency-free static web app; index.html loads Leaflet from a CDN and the ES module src/app.js, which drives the UI and network calls while src/geo.js holds pure, unit-tested helpers.
tags: [architecture, overview, frontend, leaflet]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Architecture overview

Barnacle Maps is a small navigation web app: a Leaflet map with your live position, place search, up to three walking or car routes to a destination (optionally through up to five stops), and a "pleasure" score for walking routes. It has **no build step, no backend and no npm dependencies** — the libraries and tools the repo uses are listed in [sbom/SBOM.md](../../sbom/SBOM.md).

## Parts

| File | Responsibility |
| --- | --- |
| `index.html` | Page skeleton: `#map`, the floating `#panel`, and script tags for Leaflet 1.9.4 (from `unpkg.com`) and `src/app.js` (`type="module"`). |
| `src/app.js` | Everything with side effects: Leaflet map and markers, DOM events, geolocation, `fetch` calls to Nominatim, OSRM and the OSM tile server, canvas pixel reads, status text. |
| `src/geo.js` | Pure helpers with no DOM and no `fetch`: formatting, URL builders (`searchUrl`, `routeUrl`), response parsers, travel modes, stop list operations, geometry (haversine, detours, route overlap) and tile/pixel maths for the pleasure score. |
| `styles.css` | Panel layout, route/stop styling, the search clear button. |
| `package.json` | `npm start` (Python static server on port 8000) and `npm test` (`node --test test/`). |

The split is deliberate: `geo.js` says in its header that it has no DOM access and no fetch "so they can be unit tested in Node", and every file in `test/` imports it directly. `app.js` is only covered by source-level contract tests and manual scenarios — see [Testing](../testing/test-strategy.md).

## How data moves

The browser fetches the static files from the local server, Leaflet from unpkg, then talks directly to three OpenStreetMap-ecosystem services: Nominatim (search), OSRM on `routing.openstreetmap.de` (routes) and `tile.openstreetmap.org` (map tiles, also read pixel-by-pixel for pleasure). The full diagram and tables are in [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md); per-service details are in [External services](../integrations/external-services.md).

## Main flow

1. On load, `app.js` creates the map (default view Paris, zoom 13), adds the OSM tile layer and starts `navigator.geolocation.watchPosition`.
2. The user searches ([Place search](../features/search.md)) and picks a result; `showRoute` sets the destination marker and calls `updateRoutes`.
3. `updateRoutes` fetches OSRM routes for the current mode and stops, picks up to three distinct ones and draws them ([Routing](../features/routing.md)).
4. For walking routes, `scorePleasure` downloads zoom-16 tiles along the routes and counts green pixels ([Pleasure](../features/pleasure.md)).

State handling, the panel layout and stale-response protection are described in [App state, UI panel and request sequencing](app-state-and-ui.md).
