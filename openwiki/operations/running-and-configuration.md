---
type: operations
title: Running and configuration
description: How to serve Barnacle Maps locally, why it needs localhost or HTTPS, and where its tunable constants and service URLs live, since there is no config file or environment variable.
tags: [operations, configuration, deployment]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-ca3d215a404898072882c592
    resource: repo://sbom/SBOM.md
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Running and configuration

## Running

There is no build step and no npm dependency. `npm start` runs `python3 -m http.server 8000` from
the repo root, which serves `index.html`, `styles.css` and `src/` as static files; open
<http://localhost:8000>. Any static file host works the same way in production.

The browser only grants geolocation in a secure context, so the page must be served from
`localhost` or over HTTPS. Without a position the app still searches (unsorted, no distances) but
waits for a position before computing routes.

`npm test` runs `node --test test/` (see [Testing](../testing/tests.md)). The software bill of
materials, [`sbom/SBOM.md`](../../sbom/SBOM.md), lists no package because the repo has no
lockfile; Leaflet is pinned only by its CDN URL in `index.html`.

## Configuration

There are no environment variables, config files or secrets. Behaviour is tuned by constants in
the source:

| Constant | File | Default | Effect |
| --- | --- | --- | --- |
| `DEFAULT_VIEW` | `src/app.js` | Paris, zoom 13 | Map view before the first position (then zoom 15 on the user). |
| `TILE_URL` | `src/app.js` | `https://tile.openstreetmap.org` | Map and pleasure tiles. |
| `SUGGEST_DELAY_MS` | `src/app.js` | 500 | Debounce before a suggestion search. |
| `MIN_SUGGEST_CHARS` | `src/geo.js` | 3 | Minimum query length for suggestions. |
| `NEAR_BOX_DEG` | `src/geo.js` | 0.25 | Half-height of the "prefer near me" search box. |
| `searchUrl` `base` | `src/geo.js` | `https://nominatim.openstreetmap.org` | Geocoder. |
| `TRAVEL_MODES` | `src/geo.js` | OSRM foot / car on routing.openstreetmap.de | Routing servers and profiles. |
| `MAX_STOPS`, `STOP_DUPLICATE_M` | `src/geo.js` | 5, 20 m | Stop limit and duplicate radius. |
| `PLEASURE_ZOOM`, `PLEASURE_RADIUS_PX` | `src/app.js` | 16, 4 px | Tile zoom and route width for the pleasure score. |
| `PLEASURE_MAX_TILES`, `PLEASURE_MAX_STRAIGHT_M`, `PLEASURE_TIMEOUT_MS` | `src/app.js` | 150, 15 km, 20 s | Pleasure scoring limits. |

## Security and privacy notes

- All data stays in page memory; nothing is stored on a server or in browser storage.
- Place names from Nominatim are written with `textContent`, not HTML.
- The user's position goes to Nominatim and OSRM, and the Leaflet scripts come from a CDN without
  integrity hashes. See [External services](../integrations/openstreetmap-services.md).
