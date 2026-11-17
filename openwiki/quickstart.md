---
type: quickstart
title: Quickstart
description: Start here for Barnacle Maps — what the walking/car navigation web app does, how to run and test it, and which wiki page to read for each task.
tags: [quickstart, overview, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Quickstart

Barnacle Maps is a small static navigation web app. It shows a Leaflet map with OpenStreetMap
tiles and your live position, lets you search for a place (results nearest to you first, with
their distance), and shows up to 3 walking or car routes to it, optionally through up to 5 stops.
Walking routes also get a "pleasure" score from the green on the map along them.

## Run and test

```sh
npm start   # python3 -m http.server 8000, then open http://localhost:8000
npm test    # node --test test/
```

No build step and no dependencies to install. Geolocation needs `localhost` or HTTPS.

## Where things are

- `index.html`, `styles.css` — the page and its panel.
- `src/app.js` — controller: map, DOM, events, network calls.
- `src/geo.js` — pure helpers (URLs, parsing, geometry, stops, pleasure math), unit tested.
- `test/` — unit tests; `tests/ai/` — AI browser scenarios.
- `specs/` — feature specs from the factory workflow.
- [`dataflow/DATAFLOW.md`](../dataflow/DATAFLOW.md) — data flow diagrams;
  [`sbom/SBOM.md`](../sbom/SBOM.md) — dependency list.

## Task routing

| I want to… | Read |
| --- | --- |
| Understand how the app is put together | [Architecture overview](architecture/overview.md) |
| Change search, suggestions or result ordering | [Place search and suggestions](features/place-search.md) |
| Change routes, travel modes or alternatives | [Routing and travel modes](features/routing.md) |
| Change stops | [Stops](features/stops.md) |
| Change the green "pleasure" score | [Pleasure score](features/pleasure-score.md) |
| Know which outside services are called and what they receive | [External services](integrations/openstreetmap-services.md) |
| Run it, tune a constant, check security notes | [Running and configuration](operations/running-and-configuration.md) |
| Write or run tests | [Testing](testing/tests.md) |
| Follow the spec → plan → tests → build process | [Spec-driven development workflow](development/spec-workflow.md) |
