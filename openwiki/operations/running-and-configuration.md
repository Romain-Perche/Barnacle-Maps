---
type: operations
title: Running, configuration and security
description: How to run Barnacle Maps locally, why geolocation needs localhost or HTTPS, which public services it depends on, where its tunable constants live, and its security and privacy properties (SRI-pinned Leaflet, data sent to OpenStreetMap services).
tags: [operations, configuration, security, privacy, deployment]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-832598c8183ff3da283ac785
    resource: repo://pins.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Running, configuration and security

## Running

There is no build step and no package to install. `npm start` runs `python3 -m http.server 8000` in the repo root; open <http://localhost:8000>. Any static file server works, and so does any static hosting: the app is just `index.html`, `styles.css` and `src/*.js`.

The browser only grants geolocation in a secure context, so serve the app from `localhost` or over HTTPS. Without a position the app can search, but routes wait with "Waiting for your location to compute a route…"; a refused permission shows "Location unavailable. Allow location access to get directions.".

`npm test` runs the Node test suite (see [Testing](../testing/testing.md)).

## External dependencies

The app needs network access from the user's browser to:

| Service | Used for | Where configured |
|---|---|---|
| `tile.openstreetmap.org` | base map, pleasure tiles | `TILE_URL` in `src/app.js` |
| `nominatim.openstreetmap.org` | place search | default `base` of `searchUrl` in `src/geo.js` |
| `routing.openstreetmap.de` (`routed-foot`, `routed-bike`, `routed-car`) | routes | `base` of each entry of `TRAVEL_MODES` in `src/geo.js` |
| `unpkg.com` | Leaflet 1.9.4 script and CSS | `index.html`, pinned in `pins.json` |

These are free community services with usage policies (fair use, rate limits). The app debounces search suggestions for that reason, and is not suited to heavy traffic without its own servers. To use other servers, change the URLs above. The exact library versions are listed in [`sbom/SBOM.md`](../../sbom/SBOM.md); the data flow between the app and these services is drawn in [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

## Tunable constants

There is no runtime configuration file; behaviour is tuned with constants:

- `src/app.js`: `DEFAULT_VIEW` (Paris, zoom 13), `SUGGEST_DELAY_MS` (500), `PLEASURE_ZOOM` (16), `PLEASURE_RADIUS_PX` (4), `PLEASURE_MAX_TILES` (150), `PLEASURE_TIMEOUT_MS` (20 000), `PLEASURE_MAX_STRAIGHT_M` (15 000), route line styles.
- `src/geo.js`: `MIN_SUGGEST_CHARS` (3), `TRAVEL_MODES`, `MAX_STOPS` (5), `STOP_DUPLICATE_M` (20), and the `pickRoutes` / `detourWaypoints` thresholds.

## Security and privacy

- **Pinned third-party code.** Leaflet's script and stylesheet are loaded from unpkg with fixed versions and `integrity` (SHA-256 SRI) hashes plus `crossorigin`, so a changed file on the CDN is refused by the browser. `pins.json` records the same URLs and hashes for the SBOM; keep both in sync when upgrading.
- **No secrets, no backend, no storage.** The app has no API keys, cookies or local storage; nothing outlives the page.
- **Data leaving the browser.** Search text goes to Nominatim. The user's precise position, every stop and the destination go to OSRM in the route URL. The tiles requested for the map and pleasure score reveal the area of the route to the tile server.
- **DOM output.** In the panel, place and stop names from Nominatim are written with `textContent`. The destination marker popup (`bindPopup(place.name)`) and stop marker tooltips (`bindTooltip`) pass the name as a string to Leaflet, which inserts strings as HTML; keep that in mind when changing what reaches those calls.

## Related pages

- [Architecture overview](../architecture/overview.md)
- [Testing](../testing/testing.md)
