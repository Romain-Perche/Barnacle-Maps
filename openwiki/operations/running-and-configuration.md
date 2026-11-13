---
type: operations
title: Running and configuration
description: How to serve Barnacle Maps locally with npm start, why it must run on localhost or HTTPS, how to deploy it as static files, and which source constants act as its configuration.
tags: [operations, configuration, deployment, local-dev]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Running and configuration

## Run locally

```sh
npm start   # python3 -m http.server 8000
```

Open <http://localhost:8000>. There is nothing to install or build: `package.json` has no dependencies, and `npm start` only runs Python's built-in static file server on port 8000 from the repository root (Python 3 must be installed). Any static server works the same way.

The browser only grants geolocation in a secure context, so use `localhost` or HTTPS; from another host over plain HTTP the app shows "Location unavailable…" and cannot compute routes. Without a position fix, a chosen destination waits ("Waiting for your location to compute a route…").

The app needs outbound access to `tile.openstreetmap.org`, `nominatim.openstreetmap.org`, `routing.openstreetmap.de` and `unpkg.com` (see [External services](../integrations/external-services.md)).

## Deploy

Publish `index.html`, `styles.css` and `src/` on any static host with HTTPS. There are no environment variables, secrets or server processes. Library versions are in [sbom/SBOM.md](../../sbom/SBOM.md).

## Configuration

Settings are constants in the source, changed by editing code:

| Constant | File | Value | Effect |
| --- | --- | --- | --- |
| `TILE_URL` | `src/app.js` | `https://tile.openstreetmap.org` | Base map and pleasure tiles |
| `DEFAULT_VIEW` | `src/app.js` | Paris, zoom 13 | Map view before the first position fix |
| `PLEASURE_ZOOM`, `PLEASURE_RADIUS_PX` | `src/app.js` | 16, 4 | Tile zoom and route width for the pleasure score |
| `PLEASURE_MAX_TILES`, `PLEASURE_MAX_STRAIGHT_M`, `PLEASURE_TIMEOUT_MS` | `src/app.js` | 150, 15000, 20000 | Limits for pleasure scoring |
| `SUGGEST_DELAY_MS` | `src/app.js` | 500 | Search suggestion debounce |
| `MIN_SUGGEST_CHARS` | `src/geo.js` | 3 | Minimum characters before suggestions |
| `TRAVEL_MODES` | `src/geo.js` | foot / car OSRM servers | Routing servers and profiles |
| `searchUrl` default base | `src/geo.js` | `https://nominatim.openstreetmap.org` | Geocoder |
| `MAX_STOPS`, `STOP_DUPLICATE_M` | `src/geo.js` | 5, 20 | Stop list limits |

Run the tests with `npm test` (see [Testing](../testing/test-suites.md)).
