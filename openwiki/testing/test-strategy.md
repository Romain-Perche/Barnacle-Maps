---
type: testing
title: Testing
description: How Barnacle Maps is tested. It covers Node's built-in test runner over the pure helpers in src/geo.js and src/qr.js, text-contract tests that read index.html, styles.css and src/app.js, and AI-driven Playwright browser scenarios written as Markdown under tests/ai.
tags: [testing, node-test, playwright, contracts]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-c2e63a215a7dd2b6cf644c69
    resource: repo://test/phone-card.test.js
  - id: openwiki-source-7a20b5490c0fbf46b7b214d4
    resource: repo://test/phone-updates.test.js
  - id: openwiki-source-e4f4ae177fecd528895e4c85
    resource: repo://test/qr-image.test.js
  - id: openwiki-source-1c481527e1de0efbb36b0e88
    resource: repo://test/routes.test.js
  - id: openwiki-source-fdf22309edab7c8602a1b816
    resource: repo://tests/ai/us1-continue-on-phone.md
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Testing

## Unit and contract tests (`npm test`)

`npm test` runs `node --test test/`, using Node's built-in runner and `node:assert/strict`. There are no test dependencies, browser or network access. The suite has about 120 tests.

Two styles of test live side by side:

- **Pure-function tests** import `src/geo.js` and `src/qr.js` directly. This only works because those modules never touch the DOM or `fetch` (see [Architecture](../architecture/overview.md)). The QR library is replaced by small fake factories. One of them "encodes" by echoing the text, so a test can read back what a QR code would contain.
- **Text-contract tests** read `index.html`, `styles.css` and `src/app.js` as strings and assert on markup and wiring, for example the order and SRI of the script tags, that the phone card starts `hidden`, or that `app.js` imports and calls the right helpers.

| File | Covers |
|---|---|
| `test/geo.test.js` | Formatting, Nominatim URL and parsing |
| `test/routes.test.js` | OSRM URLs and parsing, detours, sampling and overlap, `pickRoutes`, plus contract checks on `app.js` |
| `test/modes.test.js` | Walk/car profiles and URLs |
| `test/stops.test.js` | Add, remove, move stops; limit and duplicate rules |
| `test/pleasure.test.js` | Projection, path pixels, tiles, green detection, best route |
| `test/phone-link.test.js`, `test/phone-updates.test.js` | `phoneRouteUrl` and following mode/destination changes |
| `test/qr-image.test.js`, `test/phone-card.test.js` | `qrImageSrc` and the phone card markup/CSS contract |

Test comments name the spec requirements they cover (for example `covers FR-005`). This ties each test back to `specs/…/spec.md` (see [Spec-driven workflow](../workflows/spec-driven-development.md)).

## Browser scenarios (`tests/ai/`)

The DOM behaviour, the real CDN libraries and the live services are covered by Markdown scenarios, which an AI agent runs with headless Playwright (Chromium) against `npm start`. The scenarios fake the geolocation at Paris and need network access to unpkg and the OSM services. `us1-continue-on-phone.md` and `us2-qr-follows-changes.md` check the [phone QR card](../features/phone-qr-handoff.md). They decode a real QR code by taking a screenshot and running `zbarimg`, then compare it with the displayed link.
