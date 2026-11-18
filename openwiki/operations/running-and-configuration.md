---
type: operations
title: Running, configuration and security
description: How to serve Barnacle Maps locally, why it needs localhost or HTTPS, which in-code constants act as its configuration, and the security properties of a dependency-free browser app.
tags: [operations, configuration, security, deployment]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Running, configuration and security

## Running

There is no build step and nothing to install. `package.json` defines two scripts:

- `npm start` runs `python3 -m http.server 8000`, a static file server on port 8000 serving the repo root. Open `http://localhost:8000`.
- `npm test` runs `node --test test/`. See [Testing](../testing/testing.md).

The browser only allows `navigator.geolocation` in a secure context, so serve the app from `localhost` or over HTTPS. Without a position, routes wait ("Waiting for your location…") or the status shows "Location unavailable. Allow location access to get directions.".

Deploying means copying `index.html`, `styles.css` and `src/` to any static host with HTTPS. The page needs network access to the services in [External services](../integrations/openstreetmap-services.md).

## Dependencies

`package.json` has no dependencies and there is no lockfile. At runtime the only library is Leaflet 1.9.4, loaded from unpkg by `index.html`. The current inventory is in the software bill of materials, [sbom/SBOM.md](../../sbom/SBOM.md).

## Configuration

There are no environment variables or config files. Behaviour is set by constants in the code:

| Constant | File | Meaning |
| --- | --- | --- |
| `DEFAULT_VIEW` | `src/app.js` | Initial map centre (Paris) and zoom before the first position fix |
| `TILE_URL` | `src/app.js` | OSM tile server for the map and the pleasure score |
| `SUGGEST_DELAY_MS` | `src/app.js` | Debounce before type-ahead search (500 ms) |
| `PLEASURE_ZOOM`, `PLEASURE_RADIUS_PX`, `PLEASURE_MAX_TILES`, `PLEASURE_TIMEOUT_MS`, `PLEASURE_MAX_STRAIGHT_M` | `src/app.js` | Pleasure score zoom (16), line width (4 px), tile cap (150), timeout (20 s), distance cap (15 km) |
| `MIN_SUGGEST_CHARS` | `src/geo.js` | Minimum query length for suggestions (3) |
| `TRAVEL_MODES` | `src/geo.js` | OSRM servers, profiles and per-mode flags and texts |
| `MAX_STOPS`, `STOP_DUPLICATE_M` | `src/geo.js` | Stop limit (5) and duplicate radius (20 m) |
| `searchUrl(…, base)` default | `src/geo.js` | Nominatim base URL |

## Security notes

- **No secrets, no storage.** The app uses no API keys, cookies, `localStorage` or other persistence. All state is in memory and is lost on reload.
- **Rendering remote data.** The search results, route list, stops list and status line are built with `createElement` and `textContent`, so place names from Nominatim are not parsed as HTML there. One exception: Leaflet's `bindPopup(place.name)` (destination marker) and `bindTooltip(…s.name)` (stop markers) take a string, and Leaflet inserts string content as HTML. Nominatim names therefore reach the DOM as HTML in those two places. Escape them or pass a DOM node if this matters.
- **Third-party script.** Leaflet is loaded from unpkg without a Subresource Integrity hash.
- **Privacy.** The precise live position is sent to the OSRM routing server. See [External services](../integrations/openstreetmap-services.md#privacy).
- **Dev server.** `python3 -m http.server` serves every file in the repo root and is meant for local development only.
