---
type: testing
title: Test suite
description: The deterministic node:test suite (unit tests of src/geo.js plus source-text contract checks) and the AI test scenarios in tests/ai that an agent performs on the running app with Playwright and mocked services.
tags: [testing, node-test, contract-tests, playwright]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-f6c7141f703e29163844b9c2
    resource: repo://test/distance-package.contract.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
  - id: openwiki-source-3e996dfa3892052d15658054
    resource: repo://tests/ai/us1-route-distances.md
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Test suite

## Deterministic tests (`test/`)

`npm test` runs `node --test test/` with Node's built-in runner and `node:assert/strict`; there are
no dev dependencies. Run `npm install` first: `src/geo.js` imports the `convert` package from
`node_modules` (see [Running and dependencies](../operations/running-and-dependencies.md)).

Only `src/geo.js` is imported. `src/app.js` needs a browser (DOM, Leaflet, geolocation), so it is
covered by source-text checks and the AI scenarios, not executed in Node.

| File | Covers |
|---|---|
| `geo.test.js` | haversine, formatting basics, `searchUrl`, `parseSearchResults`, `MIN_SUGGEST_CHARS`, `routeUrl` / `parseRoute` coordinate order |
| `routes.test.js` | groups A-H: `routeUrl` options, `parseRoutes`, `detourWaypoints`, `samplePath`, `pointToSegmentDistance`, `routeOverlap`, `pickRoutes`, `routesBbox`; group L reads `index.html`, `styles.css`, `README.md`, `src/app.js` and `src/geo.js` as text to check markup, strings, that `geo.js` uses no `document`/`fetch(`/`window`, its exports, and that `convert` is the only dependency |
| `modes.test.js` | `TRAVEL_MODES` and `routeUrl` for foot/car, explicit base, unknown mode |
| `stops.test.js` | `routeUrl` with stops, `addStop` limit/duplicate, `moveStop`, `removeStop`, `mapPointStop`, `straightLineLength` |
| `pleasure.test.js` | `lngLatToPixel`, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels`, `bestPleasure` |
| `format-distance.contract.test.js` | the `formatDistance` contract table with the package loaded, invalid inputs giving `—`, the whole-metre fallback, `distanceFormatReady` |
| `distance-package.contract.test.js` | dependency wiring: exact pin in `package.json` and `package-lock.json`, import-map URL, unchanged npm scripts |

Contract test names cite spec requirement ids (FR-xxx, SC-xxx, USn) from
`specs/<feature>/spec.md`. Because group L and the contract tests check source text, renaming
strings in `app.js`, editing the README or adding a dependency can fail tests on purpose.

## AI test scenarios (`tests/ai/`)

Markdown scenarios written by the `write-tests` gate (see
[Spec-driven development workflow](../development/spec-workflow.md)), one per user story, for an
agent to perform. They start the app with `npm start`, drive headless Playwright Chromium with a
fixed geolocation, and mock Nominatim and OSRM with `page.route(...)` so results are
deterministic, then read `#routes` and `#status` texts. Some steps are shell checks instead (for
example comparing the pinned versions).
