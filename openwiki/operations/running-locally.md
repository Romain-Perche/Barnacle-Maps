---
type: operations
title: Running and configuration
description: How to run Barnacle Maps locally with npm start (Python's static server on port 8000), why it needs localhost or HTTPS for geolocation, how to deploy it as static files, and which source constants act as its configuration.
tags: [operations, running, configuration, deployment]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Running and configuration

## Run locally

```sh
npm start      # python3 -m http.server 8000
# open http://localhost:8000
npm test       # node --test test/
```

There is **no build step and no installable dependency**. `package.json` contains only two scripts, and `"type": "module"` so that Node treats `src/*.js` as ES modules in tests. Leaflet comes from a CDN at runtime. Tool and library versions are recorded in [`sbom/SBOM.md`](../../sbom/SBOM.md).

You need:

- **Python 3**, for `npm start`. Any static file server works.
- **Node.js** with the built-in `node:test` runner, for `npm test`.
- A **secure context** for geolocation: `http://localhost` or HTTPS. Over plain HTTP on another host, geolocation is blocked and the status line shows "Location unavailable…". Search still works, but routes wait for a position.
- **Network access** to the services listed in [External services](../integrations/external-services.md).

## Deploy

Serve `index.html`, `styles.css` and `src/` as static files over HTTPS. Nothing runs on the server.

## Configuration

There are no environment variables or config files. The behaviour is set by constants in the source:

| Constant | File | Default | Effect |
| --- | --- | --- | --- |
| `TILE_URL` | `src/app.js` | `https://tile.openstreetmap.org` | Base map tiles and pleasure tiles |
| `DEFAULT_VIEW` | `src/app.js` | Paris, zoom 13 | Map view before the first position fix |
| `SUGGEST_DELAY_MS` | `src/app.js` | 500 | Type-ahead debounce |
| `PLEASURE_*` | `src/app.js` | zoom 16, radius 4 px, 150 tiles, 20 s, 15 km | [Pleasure score](../features/pleasure-score.md) limits |
| `ROUTE_STYLE` / `SELECTED_STYLE` | `src/app.js` | grey / blue `#1a73e8` | Route line styles |
| `TRAVEL_MODES` | `src/geo.js` | routed-foot / routed-car | OSRM servers and profiles |
| `searchUrl` base | `src/geo.js` | `https://nominatim.openstreetmap.org` | Geocoder |
| `MIN_SUGGEST_CHARS` | `src/geo.js` | 3 | Type-ahead threshold |
| `MAX_STOPS`, `STOP_DUPLICATE_M` | `src/geo.js` | 5, 20 m | [Stops](../features/stops.md) rules |

## Troubleshooting

- **No routes, "Waiting for your location…":** geolocation is denied, or the page is not in a secure context.
- **"Pleasure unavailable":** the walk is too long, needs too many tiles, or a tile failed or timed out.
- **Search or routing errors with an HTTP status:** a public service rejected the request, for example because of rate limiting.
