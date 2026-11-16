---
type: architecture
title: Architecture overview
description: How the Barnacle Maps single-page browser app is built, with no build step. It covers index.html, the src/app.js glue module, the pure helpers in src/geo.js and src/qr.js, the CDN scripts, and how app state and request sequencing work.
tags: [architecture, frontend, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Architecture overview

Barnacle Maps is a static, client-side navigation web app. It has no backend, no build step and no npm dependencies. A static file server delivers `index.html`, `styles.css` and the ES modules in `src/`, and everything else runs in the user's browser. The browser calls third-party OpenStreetMap services directly (see [External services](../integrations/external-services.md)). For how data moves between the parts, see the data flow model in [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

## Pieces

| File | Role |
|---|---|
| `index.html` | Page skeleton: the `#map` container and a `#panel` holding the search form, the travel-mode radio buttons, results, stops, the route list, the status line and the phone card. It loads Leaflet and qrcode-generator from unpkg as classic scripts, then `src/app.js` as a module. |
| `src/app.js` | The only module that touches the DOM, Leaflet, `fetch` and geolocation. It owns all mutable state and wires up the event handlers. |
| `src/geo.js` | Pure helpers with no DOM and no fetch: formatting, Nominatim/OSRM URL builders and parsers, stop list operations, local geometry, route de-duplication, and the green-pixel maths. |
| `src/qr.js` | A pure wrapper that turns a URL into a QR code SVG data URI using an injected `qrcode` factory. |
| `styles.css` | Layout: the full-screen map with a floating panel, and the styling for routes, stops and the phone card. |

Keeping `geo.js` and `qr.js` free of browser APIs is what lets `npm test` run them in Node with no browser (see [Testing](../testing/test-strategy.md)). `app.js` reads the libraries from globals (`window.L` and `window.qrcode`) that the CDN scripts in `index.html` define.

## State and lifecycle

`app.js` keeps module-level state: `position` (the latest geolocation fix), `currentPlace` (the destination), `mode` (`foot` or `car`), `stops`, `routeLayers` (one entry per drawn route: route, polyline, button and pleasure label), `selectedRoute` and `pendingRoute`.

- At startup the map is centred on Paris and `navigator.geolocation.watchPosition` starts. The first fix re-centres the map at zoom 15. Later fixes only move the user marker.
- `updateRoutes()` is the central recompute. Picking a destination, changing the stops or switching the travel mode all call it. It clears the old routes (and hides the phone card), and waits for a position if there is none yet (`pendingRoute`). Then it fetches routes, draws them, shows the phone card, writes a summary to the status line and, for walking, starts the pleasure score.
- **Stale-response guards**: every route computation takes a new `routeSeq` number, and every search takes a new `searchSeq` number. When an async result arrives and its number is no longer current, the result is dropped. A new route computation also aborts any pleasure tile downloads still in flight (`pleasureAbort`).

## Main flows

- [Place search and suggestions](../features/search-and-suggestions.md)
- [Routing, travel modes and alternatives](../features/routing-and-alternatives.md)
- [Stops along a journey](../features/stops.md)
- [Walking pleasure score](../features/pleasure-score.md)
- [Continue on your phone (QR code)](../features/phone-qr-handoff.md)

Errors from the services appear as text in the `#status` live region. The pleasure score and the QR card are best-effort: when they fail, they never hide the routes.
