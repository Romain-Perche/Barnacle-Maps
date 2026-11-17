---
type: testing
title: Testing
description: How Barnacle Maps is tested, with Node's built-in test runner on the pure helpers in src/geo.js plus source and markup checks, and AI-run browser scenarios in tests/ai that drive the real app against live OpenStreetMap services.
tags: [testing, node-test, playwright, ai-scenarios]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-278e62085e4d44585a3e9b2d
    resource: repo://test/bike.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
  - id: openwiki-source-6cace7c7d249e62c818cb3f7
    resource: repo://tests/ai/us1-cycling-routes.md
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Testing

There are two layers of tests: deterministic unit tests that run with `npm test`, and written scenarios in `tests/ai/` that an AI agent runs in a real browser.

## Unit tests (`test/`)

`npm test` runs `node --test test/`, the test runner built into Node, with `node:assert/strict`. There is no test framework dependency. The tests import `src/geo.js` directly. That works because `geo.js` touches neither the DOM nor the network (see [Architecture overview](../architecture/overview.md)). `src/app.js` cannot be imported in Node, so its wiring is checked by reading the source as text.

| File | Covers |
| --- | --- |
| `test/geo.test.js` | `haversine`, `formatDistance`, `formatDuration`, `searchUrl`, `parseSearchResults`, `MIN_SUGGEST_CHARS`, basic `routeUrl` and `parseRoute` |
| `test/routes.test.js` | `routeUrl` options (A), `parseRoutes` and `parseRoute` (B), `detourWaypoints` (C), `samplePath` (D), `pointToSegmentDistance` (E), `routeOverlap` (F), `pickRoutes` (G), `routesBbox` (H), and static checks (L) on `index.html`, `styles.css`, `README.md`, `app.js` imports, that `geo.js` stays pure, and that there are no new dependencies |
| `test/modes.test.js` | `TRAVEL_MODES` keys, car-mode URLs, fallback of unknown modes to walking |
| `test/bike.test.js` | The bike entry of `TRAVEL_MODES` and the contract in `specs/sf-70-bicycle-track/contracts/travel-modes.md`; detours only for walking; pleasure for foot and bike only; bike URLs with stops; the `#mode` radiogroup markup; the segmented-control CSS; that `app.js` reads mode flags instead of comparing names; README text |
| `test/stops.test.js` | Stops in `routeUrl`, `addStop` limit and duplicate, `moveStop`, `removeStop`, `mapPointStop`, `straightLineLength` |
| `test/pleasure.test.js` | `lngLatToPixel`, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels`, `bestPleasure`, with synthetic tiles |

Many test comments name the spec items they cover (for example `// covers FR-002, …`), which ties them to the feature spec.

## AI browser scenarios (`tests/ai/`)

Each file is one user story of a feature, written as Markdown scenarios with Setup, Steps and Expected checkboxes. They are made to be run by an agent with headless Playwright (Chromium):

- start the app with `npm start` and open `http://localhost:8000`;
- grant geolocation and set a fixed position (Alexanderplatz, Berlin);
- wait until `#status` no longer says "Waiting";
- the services must be reachable: `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org` and `unpkg.com`.

Current files cover the bike feature: `us1-cycling-routes.md` (selector, bike routes, selection, pleasure), `us2-switch-modes.md` (switching modes keeps the destination; routing service unreachable), and `us3-bike-stops.md` (bike routes through stops in order). They use live services, so results such as route counts can vary.

## Where tests come from

The `write-tests` skill writes both kinds of tests for each feature and records them as tasks in `specs/<feature>/tasks.md`. See [Spec-driven development workflow](../development/spec-driven-workflow.md).
