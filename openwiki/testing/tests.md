---
type: testing
title: Testing
description: How Barnacle Maps is tested — Node's built-in test runner over the pure helpers in src/geo.js, plus AI-run browser scenarios in tests/ai described by .factory/test-env.md.
tags: [testing, node-test, playwright, ai-scenarios]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-5738600e8178fc1c65db9d13
    resource: repo://.factory/test-env.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
  - id: openwiki-source-1778c2bc3ebc361f3bc7daac
    resource: repo://test/modes.test.js
  - id: openwiki-source-82a6c108a0cce47d4fee63ff
    resource: repo://test/sort-results.test.js
  - id: openwiki-source-fdc7161e0cace0f3932df952
    resource: repo://tests/ai/us1-nearest-first.md
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Testing

## Unit tests (`npm test`)

`npm test` runs `node --test test/`, Node's built-in runner with `node:assert/strict`; there is no
test framework to install. The tests import only `src/geo.js`, which has no DOM or `fetch`, so they
run without a browser or network (see [Architecture overview](../architecture/overview.md)).

| File | Covers |
| --- | --- |
| `test/geo.test.js` | Haversine, distance/duration formatting, `searchUrl` base, `parseSearchResults`, `parseRoute`, `routeUrl`, `MIN_SUGGEST_CHARS`. |
| `test/sort-results.test.js` | `viewbox` in `searchUrl` (centring, no `bounded`, clamping) and `sortByDistance` (order, stable ties, no position, no mutation). |
| `test/modes.test.js` | `TRAVEL_MODES` and the foot/car OSRM URLs. |
| `test/routes.test.js` | `parseRoutes`, detour waypoints, path sampling, route overlap, `pickRoutes`, `routesBbox`. |
| `test/stops.test.js` | `addStop` limit and duplicates, `removeStop`, `moveStop`, `mapPointStop`, routes through stops. |
| `test/pleasure.test.js` | Mercator pixels, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels`, `bestPleasure`. |

`src/app.js` (DOM, Leaflet, fetching, sequencing, canvas) has no unit tests.

## AI scenarios (`tests/ai/`)

Each user story of a feature gets a Markdown scenario file, e.g. `tests/ai/us1-nearest-first.md`
and `tests/ai/us2-distance-column.md`, written by the factory's `write-tests` step (see
[Spec-driven development workflow](../development/spec-workflow.md)). Each scenario lists Setup,
Steps and checkbox Expected results, and names the requirements it covers. An agent runs them
against the real app (`npm start`) in headless Playwright with a mocked geolocation.

## Test environment notes

`.factory/test-env.md` records, per service, whether a fake is needed. For search, unit tests check
the URL built by `searchUrl` without any network call; the AI scenarios use the real Nominatim when
reachable and otherwise route the search request to a canned `jsonv2` response. Its smoke check is
`npm test`.
