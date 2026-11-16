---
type: operations
title: Running, configuration and security
description: How to serve Barnacle Maps locally, why geolocation needs localhost or HTTPS, the lack of configuration and secrets, and the security and privacy properties of the app, including SRI pinning, DOM handling, location data sent to third parties and rate limits.
tags: [operations, security, privacy, configuration]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Running, configuration and security

## Running

- `npm start` runs `python3 -m http.server 8000` in the repository root. Then open `http://localhost:8000`. Any static file server works, because there is no build step.
- Browsers expose `navigator.geolocation` only in a secure context, which means `localhost` or HTTPS. When geolocation is unavailable or denied, the status line says so. Search still works, but routes need a position (see [Routing](../features/routing-and-alternatives.md)).
- The browser must be able to reach unpkg.com and the OSM services listed in [External services](../integrations/external-services.md).
- `npm test` runs the Node unit tests (see [Testing](../testing/test-strategy.md)).

## Configuration

There are no environment variables, config files or secrets. The service endpoints and tuning values are constants in the code:
- service URLs: `TILE_URL` in `src/app.js`; `searchUrl`, `TRAVEL_MODES` and `phoneRouteUrl` defaults in `src/geo.js`;
- behaviour constants: the default view (Paris), the suggestion delay, the pleasure limits (`src/app.js`), `MAX_STOPS` and `MIN_SUGGEST_CHARS` (`src/geo.js`).

## Security and privacy

- **Supply chain**: the qrcode-generator script carries a `sha384` SRI hash, also recorded in `pins.json`. Leaflet is pinned to an exact version but has no SRI. For versions see [`sbom/SBOM.md`](../../sbom/SBOM.md).
- **DOM injection**: text from the services (place names, stop names) is written with `textContent`, so it is never parsed as HTML. The QR code is set as an `<img>` data URI, not inlined as SVG markup. The phone link opens with `target="_blank" rel="noopener"`.
- **Location privacy**: the user's precise position goes to the OSRM routing server with every route request. It also appears in the phone link, which goes to openstreetmap.org once opened. Search text goes to Nominatim, and tile requests reveal the area being viewed. Nothing is stored: there is no cookie, no localStorage and no backend. See [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).
- **Fair use of public services**: suggestions are debounced (500 ms, at least 3 characters), and pleasure scoring downloads at most 150 tiles with a 20 s timeout, to respect the OSM usage policies.
