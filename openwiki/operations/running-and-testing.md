---
type: operations
title: Running and testing
description: How to serve Barnacle Maps locally, run the Node unit tests, and run the Playwright AI scenarios against faked OSRM, Nominatim, tile and unpkg services, including the OSRM-docs-checked fake.
tags: [operations, testing, node-test, playwright, fakes]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-278e62085e4d44585a3e9b2d
    resource: repo://test/bike.test.js
  - id: openwiki-source-83e42da60db83247529dbbbb
    resource: repo://test/fakes/osrm.js
  - id: openwiki-source-e39fe1ffb6de8047867d5fd0
    resource: repo://tests/ai/README.md
  - id: openwiki-source-e41e9cbfc6b2b1473a0e22ca
    resource: repo://tests/ai/support/fake-services.mjs
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Running and testing

## Run the app

```
npm start        # python3 -m http.server 8000
```

Open http://localhost:8000. There is no build step and no `npm install`: `package.json` only defines `start` and `test`. Geolocation needs `localhost` or HTTPS, so serving from another host over plain HTTP gives "Location unavailable". The app needs the public OSM services described in [External services and privacy](../integrations/external-services.md). Tool and library versions are in [sbom/SBOM.md](../../sbom/SBOM.md).

## Unit tests

```
npm test         # node --test test/
```

The tests import `src/geo.js` directly (it is DOM-free) and some read `src/app.js`, `index.html` or `README.md` as text to check wiring and markup.

| File | Covers |
| --- | --- |
| `test/geo.test.js` | haversine, formatting, Nominatim URL and parsing |
| `test/routes.test.js` | `routeUrl`, `parseRoutes`, detours, overlap, `pickRoutes` |
| `test/stops.test.js` | stop list helpers and stop-aware URLs |
| `test/pleasure.test.js` | tile pixel maths, green detection, best route |
| `test/modes.test.js` | `TRAVEL_MODES` (walk / car / bike) and mode URLs |
| `test/bike.test.js` | bike mode contract, per-mode flags, NoRoute handling, OSRM request shape, selector markup, README |

### The OSRM fake

`test/fakes/osrm.js` stands in for routing.openstreetmap.de, which the test VM cannot reach. `loadOsrmSchema()` parses the official OSRM HTTP docs saved at `.factory/schemas/osrm-http.md` (downloaded per `.factory/test-env.md`; the folder is git-ignored) into the list of allowed route options. `checkRouteRequest(url, schema)` throws for a wrong path, out-of-range coordinates, an undocumented option or a disallowed value; `routeResponse(...)` builds a documented Route object. When the docs file is missing, the tests that need it are skipped with a message pointing to `.factory/test-env.md`.

## AI browser scenarios

`tests/ai/us1-cycling-routes.md`, `us2-switch-modes.md` and `us3-bike-stops.md` are scenario scripts for an agent driving headless Playwright against `npm start`. The common setup in `tests/ai/README.md`:

1. check `.factory/schemas/osrm-http.md` exists;
2. get Leaflet 1.9.4 with `npm pack` (unpkg is blocked);
3. install Playwright in a scratch folder;
4. call `installFakes(page, options)` from `tests/ai/support/fake-services.mjs` before `page.goto`, with geolocation granted at `START` (near Notre-Dame, Paris).

`installFakes` answers OSRM (checked by the OSRM fake; refused requests get HTTP 400 `InvalidQuery` and are logged in `log.refused`), Nominatim (fixed `PLACES`), tiles (solid green for even x, beige for odd x) and unpkg (local Leaflet copy). Every scenario expects no page error and an empty `log.refused`.

## Related pages

- [Spec-driven workflow](spec-workflow.md)
- [Routing and travel modes](../features/routing-and-travel-modes.md)
