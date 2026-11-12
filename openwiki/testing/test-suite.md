---
type: testing
title: Test suite
description: How Barnacle Maps is tested — Node built-in test runner unit tests for the pure geo.js helpers, integration tests that run the real app.js in a fake DOM/Leaflet/geolocation/fetch harness, and AI-driven Playwright scenarios in tests/ai.
tags: [testing, node-test, harness, playwright, integration]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-d27ecf6cb97e60958bc3ff10
    resource: repo://test/arrival-panel.test.js
  - id: openwiki-source-f7e3465cae85a41df1211df1
    resource: repo://test/support/app-harness.js
  - id: openwiki-source-3b14d78e3717fdbd006f12a5
    resource: repo://tests/ai/us1-arrival-time.md
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Test suite

`npm test` runs `node --test test/`: Node's built-in runner and `node:assert/strict`, no test dependencies. At the time of writing the whole suite (136 tests) runs in well under a second. There are three layers.

## 1. Unit tests of `src/geo.js`

Because `geo.js` has no DOM or network access ([Architecture overview](../architecture/overview.md)), tests import it directly:

| File | Covers |
| --- | --- |
| `test/geo.test.js` | haversine, distance/duration formatting, Nominatim URL and parsing, `lng,lat` order |
| `test/routes.test.js` | `routeUrl`, `parseRoutes`, detour waypoints, path sampling, segment distance, overlap, `pickRoutes` (IDs A1…G3) |
| `test/modes.test.js` | `TRAVEL_MODES` and car/foot URLs |
| `test/stops.test.js` | stop list helpers |
| `test/pleasure.test.js` | tile projection, rasterisation, green pixel rule, `bestPleasure` |
| `test/arrival.test.js` | contract of `arrivalTime`/`formatArrival` incl. DST and locale independence |

## 2. App integration tests with the harness

`test/support/app-harness.js` runs the **real** `src/app.js` in Node. It is not itself a test (no `.test.` in its name). `bootApp({ route, search })`:

- builds a minimal fake DOM (`FakeElement` with children, attributes, listeners, `classList`, `textContent`) for the element IDs of `index.html`, plus the two mode radios;
- installs a fake Leaflet on `window.L` that records polylines and their styles;
- fakes `navigator.geolocation.watchPosition` so the test decides when a position arrives;
- replaces `fetch` with a scripted router: `/route/v1/` calls go to the `route(url, n)` handler (default: three routes), `/search?` calls to `search`, and every other URL (map tiles) returns 503 so pleasure becomes unavailable;
- imports `app.js` with a unique `?instance=N` query so every test gets a fresh module with fresh state.

It returns a driver with helpers such as `setPosition`, `chooseDestination`, `addStopFromResult`, `setMode`, `stopButtons`, `clearStops`, `routeButtons`, `routeTitles`, `status` and `panelText`. Utilities: `settle()` flushes pending promises, `deferred()` makes a manually resolved promise (to simulate slow or superseded requests), `osrmJson`/`routesWith` build OSRM fixtures, `START`/`DEST`/`PATHS` give fixed coordinates.

`test/arrival-panel.test.js` uses it with `t.mock.timers.enable({ apis: ["Date"] })` to control the clock, e.g. advancing time between request and response to check that the departure is taken when results arrive. Test names cite spec IDs (US1/US2, FR-xxx, SC-xxx); see [Arrival time](../features/arrival-time.md).

**Adding a test:** for pure logic, add to the matching `test/*.test.js`; for UI behaviour, `bootApp` with a scripted `route`/`search`, drive it, `await settle()`, assert on the driver's getters.

## 3. AI test scenarios (`tests/ai/`)

Markdown scripts (`us1-arrival-time.md`, `us2-arrival-refresh.md`) for an agent to run against the real app in headless Playwright Chromium: serve with `python3 -m http.server 8000`, fixed geolocation, `timezoneId: "Europe/Paris"`, a fixed clock via `page.clock`, and `page.route` stubs for Nominatim, OSRM and tiles (503). Each scenario has setup, steps and checkbox expectations with exact panel texts. They are written by the factory's `write-tests` gate ([Spec-driven development workflow](../development/spec-driven-workflow.md)) and are not run by `npm test`.

## Related pages

- [Architecture overview](../architecture/overview.md)
- [Arrival time](../features/arrival-time.md)
- [Spec-driven development workflow](../development/spec-driven-workflow.md)
