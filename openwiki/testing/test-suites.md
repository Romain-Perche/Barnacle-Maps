---
type: testing
title: Testing
description: Barnacle Maps is tested with Node's built-in test runner (unit tests on src/geo.js, an integration suite that boots src/app.js in a dependency-free fake browser) plus AI-driven Playwright scenarios described in Markdown under tests/ai.
tags: [testing, node-test, integration, playwright, fixtures]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
  - id: openwiki-source-67f12ee4a3055c4b4bac7849
    resource: repo://test/helpers/fake-browser.js
  - id: openwiki-source-82a2d2662bc1d8f133e3021f
    resource: repo://test/route-card.integration.test.js
  - id: openwiki-source-e39fe1ffb6de8047867d5fd0
    resource: repo://tests/ai/README.md
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Testing

## Running

```sh
npm test   # node --test test/
```

No test dependency is installed: tests use `node:test`, `node:assert/strict` and Node's mock timers. CI-free; they run anywhere Node is available.

## Unit tests (pure helpers in `src/geo.js`)

| File | Covers |
| --- | --- |
| `test/geo.test.js` | `haversine`, `formatDistance`, `formatDuration`, `searchUrl`, `parseSearchResults`, basic `routeUrl` |
| `test/routes.test.js` | `routeUrl` variants, `parseRoutes`, `detourWaypoints`, `samplePath`, `pointToSegmentDistance`, `routeOverlap`, `pickRoutes` |
| `test/modes.test.js` | `TRAVEL_MODES` and mode-specific routing URLs |
| `test/stops.test.js` | Stop list helpers and routing through stops |
| `test/pleasure.test.js` | Tile/pixel geometry, green-pixel counting, `bestPleasure` |
| `test/summary.test.js` | `arrivalInfo`, `formatArrival`, `routeSummary` (locales, next day, DST) |
| `test/route-card-ui.test.js` | Markup in `index.html` and rules in `styles.css` for the [route summary card](../features/route-summary-card.md) |

Keeping logic in `src/geo.js` without DOM or `fetch` is what makes these tests possible (see [Architecture overview](../architecture/overview.md)).

## Integration tests and the fake browser

`test/route-card.integration.test.js` runs the real `src/app.js` against the real `index.html` through `test/helpers/fake-browser.js`, which provides:

- a tiny DOM parsed from `index.html` (`El`, `parseBody`), implementing only what `app.js` uses;
- a fake Leaflet (`window.L`) that records layers, styles and `fitBounds` padding;
- a scripted `fetch` (`osrm(routes)` builds OSRM responses) and a controllable geolocation;
- `boot()`, which installs these globals and imports `app.js` with a cache-busting query so each test gets a fresh app; `flush()` lets pending promises settle.

Tests combine it with `mock.timers` (`setTimeout`, `Date`) to fix "now" and to advance time for the minute refresh. They are named after the spec's user stories and requirements (US1–US3, FR-…).

## AI test scenarios

`tests/ai/` contains Markdown scenarios (`us1-…`, `us2-…`, `us3-…`) that an agent performs on the running app with headless Playwright: start `npm start`, grant geolocation at a fixed position, install a fixed clock, stub Nominatim, OSRM and tiles with `page.route` using the JSON in `tests/ai/fixtures/`, then check `#route-card` and `#route-card-live`. `tests/ai/README.md` holds the shared setup. These scenarios are written by the factory's `write-tests` step (see [Spec-driven development workflow](../development/spec-workflow.md)).
