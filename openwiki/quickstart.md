---
type: quickstart
title: Quickstart
description: What Barnacle Maps is, how to run and test it in a minute, and which wiki page to read for each task.
tags: [quickstart, overview, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Barnacle Maps quickstart

Barnacle Maps is a small navigation web app that runs entirely in the browser. It shows an OpenStreetMap map with your live position. You can search a place, add up to 5 stops, and get up to 3 walking, car or bike routes with distance and duration. Walking and bike routes also get a "pleasure" indicator based on how much green (parks, woods) lies along them.

## Run it

```bash
npm start          # python3 -m http.server 8000
# open http://localhost:8000 and allow location access
npm test           # node --test test/
```

There is no build step and nothing to install: Leaflet comes from a CDN. Geolocation needs `localhost` or HTTPS. Dependencies are listed in [sbom/SBOM.md](../sbom/SBOM.md).

## Code map

- `index.html`: page shell (map, search, mode selector, stops, routes, status).
- `src/app.js`: DOM, Leaflet map, geolocation, network calls and UI state.
- `src/geo.js`: pure, unit-tested helpers (URLs, parsing, route choice, stops, pleasure maths).
- `styles.css`: panel and controls.
- `test/`: Node unit tests. `tests/ai/`: browser scenarios for an AI tester.
- `specs/`, `.specify/`, `.claude/skills/`: the spec-driven workflow.

For how data moves between the browser and the services, see [dataflow/DATAFLOW.md](../dataflow/DATAFLOW.md).

## Where to go for…

| Task | Page |
| --- | --- |
| Understand the overall structure, state and request ordering | [Architecture overview](architecture/overview.md) |
| Change search or suggestions | [Place search and suggestions](features/place-search.md) |
| Add or change a travel mode, or tune route alternatives and detours | [Routing and travel modes](features/routing-and-travel-modes.md) |
| Work on intermediate stops | [Stops](features/stops.md) |
| Change the green "pleasure" score | [Pleasure score](features/pleasure-score.md) |
| Check what third-party services receive, their limits and privacy | [External services](integrations/openstreetmap-services.md) |
| Run, deploy, configure, or review security | [Running, configuration and security](operations/running-and-configuration.md) |
| Write or run tests | [Testing](testing/testing.md) |
| Follow the spec → plan → tasks → implement process | [Spec-driven development workflow](development/spec-driven-workflow.md) |
