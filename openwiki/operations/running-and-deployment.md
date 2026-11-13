---
type: operations
title: Running and serving the app
description: How to run Barnacle Maps locally with npm start (a Python static server on port 8000), why geolocation needs localhost or HTTPS, and what deploying the static files involves.
tags: [operations, running, deployment, static-site]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Running and serving the app

## Local run

```sh
npm start        # python3 -m http.server 8000
# open http://localhost:8000
```

`npm start` only serves the repository folder as static files; it needs `python3` on the PATH. There is nothing to install and no build step: `index.html` loads `styles.css`, `src/app.js` as an ES module, and Leaflet from unpkg. Tools and versions are listed in [sbom/SBOM.md](../../sbom/SBOM.md).

Opening `index.html` via `file://` is not supported — ES module imports need an HTTP origin.

## Requirements at runtime

- **Secure context for geolocation** — `navigator.geolocation` only works on `localhost` or HTTPS. Elsewhere, or if permission is denied, the status line shows "Location unavailable. Allow location access to get directions." and routes cannot start.
- **Outbound network** to `unpkg.com`, `nominatim.openstreetmap.org`, `routing.openstreetmap.de` and `tile.openstreetmap.org` — see [External services](../integrations/external-services.md).
- A browser with `fetch`, `createImageBitmap` and canvas (`OffscreenCanvas` preferred) for the pleasure score.

## Deploying

Any static host works: publish `index.html`, `styles.css` and `src/` over HTTPS. There is no configuration file or environment variable; service URLs are constants in `src/app.js` (`TILE_URL`) and `src/geo.js` (`searchUrl` default base, `TRAVEL_MODES`). The repository's `.specify/`, `.claude/`, `specs/` and `test*/` folders are development-only.

## Tests

`npm test` runs `node --test test/` — see [Testing](../testing/test-strategy.md).
