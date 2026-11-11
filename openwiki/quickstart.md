---
type: "Reference"
title: "Quickstart"
openwiki_generated: true
verified:
  - by: openwiki/0.9.0
    at: 2026-11-11T18:14:21.891Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "claude-code", at: "2026-11-11T18:14:21.891Z" }
---

# Quickstart

Barnacle Maps is a small navigation web app: it shows a map and your live position, lets you search for a place, and shows up to 3 routes with distance and duration. You can switch between walking and car, and add up to 5 stops. Walking routes also get a pleasure indicator. See [Routing, Stops and Pleasure Logic](routing-and-geo.md) for the details.

## Layout

- `index.html`, `styles.css`: the page and its styling.
- `src/app.js`: UI, Leaflet map, network calls.
- `src/geo.js`: pure helper functions.
- `test/`: Node tests.
- `specs/`: spec-kit planning documents for features.

## Run and test

- `npm start` serves the folder with `python3 -m http.server 8000`; open http://localhost:8000. Geolocation requires localhost or HTTPS.
- `npm test` runs `node --test test/`.
- There is no build step and no runtime dependency to install.

## External services

Leaflet with OpenStreetMap tiles for the map, Nominatim for search, and OSRM on routing.openstreetmap.de for foot and car routes. The repo's dependency inventory is in [sbom/SBOM.md](../sbom/SBOM.md).
