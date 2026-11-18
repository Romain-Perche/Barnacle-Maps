---
type: testing
title: Testing
description: How Barnacle Maps is tested - Node unit tests of src/geo.js, integration tests that run the real src/app.js with fake DOM, Leaflet and services, the documented-schema fakes, and AI browser scenarios run with Playwright.
tags: [testing, node-test, fakes, playwright, ai-tests]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-5d833a4e40042c48c16b6480
    resource: repo://.factory/run/scenarios.mjs
  - id: openwiki-source-35ed8c8d0070d8cbe9842e81
    resource: repo://.factory/run/setup.sh
  - id: openwiki-source-5738600e8178fc1c65db9d13
    resource: repo://.factory/test-env.md
  - id: openwiki-source-8b413bab823e96dbec31884e
    resource: repo://test/fakes/app-harness.js
  - id: openwiki-source-83e42da60db83247529dbbbb
    resource: repo://test/fakes/osrm.js
  - id: openwiki-source-62eedd09f9c8d199f5a9b6b5
    resource: repo://tests/ai/harness.mjs
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Testing

Tests never call the real OpenStreetMap services: the test machines cannot reach them, so every outside service is faked, and the fakes are checked against the services' documentation. The test recipe is recorded in `.factory/test-env.md` (see [Specs and the software factory workflow](../development/specs-and-factory.md)).

## Node tests (`npm test`)

`npm test` runs `node --test test/` with the built-in Node test runner; no dependency is installed.

| File | What it covers |
|---|---|
| `test/geo.test.js` | formatting, haversine, search URL and parsing |
| `test/routes.test.js` | `routeUrl`, `parseRoutes`, detour waypoints, path sampling, overlap, `pickRoutes`, `routesBbox` |
| `test/modes.test.js`, `test/bike.test.js` | `TRAVEL_MODES` and route URLs per mode, against `specs/sf-73-bicycle-track/contracts/travel-modes.md` and the fake OSRM |
| `test/selector.test.js` | the travel-mode selector markup in `index.html` |
| `test/stops.test.js` | stop list helpers |
| `test/pleasure.test.js` | pixel and tile math of the pleasure score |
| `test/bike-app.test.js` | integration: the real `src/app.js` in bike mode against the fakes |
| `test/osrm-fake.test.js` | self-checks that the fake OSRM refuses what real OSRM refuses |

### Fakes (`test/fakes/`)

- **`osrm.js`** — a fake of the OSRM route service on `routing.openstreetmap.de`. `checkRouteUrl` validates server, profile, coordinates and options against the OSRM HTTP docs (`.factory/schemas/osrm-http.md`, read via `SCHEMA_PATH`); `answerRoute` answers 200 `{ code: "Ok", waypoints, routes }`, or 400 `{ code, message }` for errors such as `NoRoute` or `InvalidOptions`, as the docs say.
- **`app-harness.js`** — `loadApp()` imports a fresh copy of `src/app.js` into Node with a minimal fake DOM, a fake Leaflet, fake geolocation and a fake `fetch` (OSRM through `osrm.js`, Nominatim with `nominatimPlace()` in the documented jsonv2 shape, all-green tiles). Tests do not share state.

The schemas live in `.factory/schemas/`, which git does not track; `.factory/test-env.md` gives the commands that fetch them from the OSRM and Nominatim GitHub repos at pinned commits. Tests that need a schema depend on that step.

## AI scenarios (`tests/ai/`)

`tests/ai/us1-cycling-routes.md`, `us2-switch-modes.md` and `us3-stops.md` are scenarios an agent performs on the real app in headless Chromium. `tests/ai/harness.mjs` exports `openApp(options)`, which opens the app (default `http://localhost:8000/`), grants geolocation at Paris, and intercepts the outside services: the real Leaflet 1.9.4 package (from `npm pack`) for unpkg, a fake Nominatim place, the fake OSRM, and generated 256×256 PNG tiles (green when `x + y` is even, else beige). Intercepted URLs are logged in `log`. Setup steps are in `tests/ai/README.md`.

For the factory's AI review, `.factory/run/setup.sh` unpacks Leaflet to `/tmp/leaflet` and starts `npm run start`; `NODE_PATH=/opt/playwright/node_modules node .factory/run/scenarios.mjs [filter]` runs the scenarios, prints one JSON result per scenario and saves screenshots to `.factory/run/out/`. It records page requests itself because the harness does not log tile URLs.

## Limits

Nothing checks real-world route quality (real cycling durations, roads open to bikes): that would need the live OSRM servers.

## Related pages

- [Specs and the software factory workflow](../development/specs-and-factory.md)
- [Routing and travel modes](../features/routing-and-travel-modes.md)
