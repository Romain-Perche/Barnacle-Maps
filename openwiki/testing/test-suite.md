---
type: testing
title: Testing
description: How Barnacle Maps is tested. Deterministic node:test suites cover the pure helpers in src/geo.js and check the app.js wiring through its source text. AI-run Playwright scenarios in tests/ai/ exercise the real app with a frozen clock.
tags: [testing, node-test, playwright, ai-tests]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-2f8a8f62d774016705d4a227
    resource: repo://test/arrival.test.js
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
  - id: openwiki-source-3b14d78e3717fdbd006f12a5
    resource: repo://tests/ai/us1-arrival-time.md
  - id: openwiki-source-9da4f12f9c4f191133b070e9
    resource: repo://tests/ai/us2-arrival-refresh.md
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Testing

There are two layers of tests. Both are written from the feature spec by the factory's `write-tests` gate (see [Spec-driven development](../workflows/spec-driven-development.md)).

## 1. Deterministic tests: `test/*.test.js`

Run them with `npm test`, which is `node --test test/`. They need no dependencies, no browser and no network, and they all import `../src/geo.js` directly. That works because `geo.js` is kept free of DOM and fetch calls (see [Pure geo helpers](../architecture/geo-helpers.md)).

| File | Covers |
| --- | --- |
| `geo.test.js` | `haversine`, `formatDistance`, `formatDuration`, `searchUrl`, `parseSearchResults`, `MIN_SUGGEST_CHARS`, basic `routeUrl`/`parseRoute` |
| `routes.test.js` | Groups A–H: `routeUrl` options, `parseRoutes`, `detourWaypoints`, `samplePath`, `pointToSegmentDistance`, `routeOverlap`, `pickRoutes`, `routesBbox` ([Routing](../features/routing.md)) |
| `modes.test.js` | `TRAVEL_MODES` and the walk/car URLs ([Routing](../features/routing.md)) |
| `stops.test.js` | `addStop`, `removeStop`, `moveStop`, `mapPointStop`, `straightLineLength`, routes with stops ([Stops](../features/stops.md)) |
| `pleasure.test.js` | Projection, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels`, `bestPleasure` ([Pleasure](../features/pleasure-score.md)) |
| `arrival.test.js` | `arrivalTime`/`formatArrival` contract table, format regex, `app.js` wiring ([Arrival time](../features/arrival-time.md)) |

Conventions:

- **Time-zone independent.** Dates are built with the local `Date` constructor (for example `new Date(2026, 10, 12, 14, 7)`), so the expected values hold in any `TZ`.
- **Source-text checks for `app.js`.** `app.js` needs Leaflet and the DOM, so tests read its source with `readFileSync` and assert on patterns. For example, `formatArrival` must be used in the route title, and `departure` must be created once per `updateRoutes`. These checks are brittle against refactors, so update them together with `app.js`.
- **Traceability comments.** Each test names the requirement or scenario it covers, such as `// covers FR-002, US1 scenario 1`.

## 2. AI scenarios: `tests/ai/*.md`

These are Markdown scripts that an agent runs against the live app with headless Playwright (Chromium):

- `us1-arrival-time.md`: arrival times on walking and car routes, with stops, long trips and next-day trips.
- `us2-arrival-refresh.md`: arrival times are refreshed when routes are recomputed and do not tick between recomputations.

Each scenario starts the app with `npm start` and needs real network access to OSM, Nominatim, OSRM and unpkg. It fixes the `timezoneId`, the locale and the geolocation (Paris), freezes the clock with `page.clock.setFixedTime`, then follows the Steps and checks the Expected boxes. The common setup in each file explains how to read the route entries and how to compute the expected values.

## Adding tests

- Put new logic in `geo.js` as a pure export and add a `test/<feature>.test.js` file. `node --test` picks it up automatically.
- Add AI scenarios under `tests/ai/` for behaviour that only shows up in the browser.
