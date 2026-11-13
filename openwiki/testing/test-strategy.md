---
type: testing
title: Testing
description: How Barnacle Maps is tested — node:test unit tests of the pure helpers in src/geo.js, source-level contract tests for the UI, and AI-driven browser scenarios in tests/ai.
tags: [testing, node-test, playwright, quality]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-733cd7c9feb79506e81022d8
    resource: repo://test/clear-button.test.js
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
  - id: openwiki-source-9c1bbaded573e189f3c0d5cc
    resource: repo://tests/ai/us1-clear-search-text.md
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Testing

## Running

```sh
npm test    # node --test test/
```

No test framework is installed: tests use Node's built-in `node:test` and `node:assert/strict`. There is no DOM library, so `src/app.js` is never executed in tests.

## Unit tests of `src/geo.js`

Because `geo.js` has no DOM and no `fetch` (see [Architecture overview](../architecture/overview.md)), it is imported directly:

| File | Covers |
| --- | --- |
| `test/geo.test.js` | haversine, distance/duration formatting, `searchUrl`, `parseSearchResults`, `MIN_SUGGEST_CHARS`, basic `routeUrl`/`parseRoute` |
| `test/routes.test.js` | `routeUrl` options (alternatives, via), `parseRoutes`, detour waypoints, overlap and `pickRoutes` |
| `test/modes.test.js` | `TRAVEL_MODES` and car/walk URLs, fallback to walking |
| `test/stops.test.js` | stops in URLs, `addStop` limit/duplicate, `moveStop`, `removeStop`, `mapPointStop`, `straightLineLength` |
| `test/pleasure.test.js` | tile projection, `pathPixels`, `pathTiles`, green detection, `countGreenPixels`, `bestPleasure` |

## Source contract tests

`test/clear-button.test.js` reads `index.html`, `styles.css` and `src/app.js` as text and checks the clear button's markup, CSS and the bodies of its event listeners with regular expressions (e.g. it extracts the `clearBtn.addEventListener("click", …)` body up to the next `addEventListener`). Tests carry `// covers FR-…` comments that link them to the feature spec. Such tests are sensitive to code layout: reordering listeners can break them — this is why the clear handler sits before the submit listener in `app.js`.

## AI browser scenarios

`tests/ai/us1-clear-search-text.md`, `us2-clear-after-destination.md` and `us3-keyboard-and-screen-reader.md` are Markdown scenarios (setup, steps, expected checkboxes) for an agent driving headless Playwright against `npm start` at a mobile viewport. They cover behaviour the Node tests cannot: visibility, focus, keyboard and screen reader announcements. When Nominatim is unreachable they route its requests to a stub.

Both kinds of tests are produced by the `write-tests` step of the [spec workflow](../development/spec-workflow.md).

## Gaps

There are no automated tests of the network flows, Leaflet rendering, geolocation or pleasure tile loading in `app.js`; those rely on the AI scenarios and manual checks.
