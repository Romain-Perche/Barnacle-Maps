---
type: guide
title: Quickstart
description: Start here - what Barnacle Maps is, how to run and test it, and which wiki page to read for each kind of task.
tags: [quickstart, overview, onboarding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Quickstart

Barnacle Maps is a small, no-build navigation web app. It shows an OpenStreetMap map (Leaflet) with
your live position, lets you search for a place (Nominatim), and shows up to 3 walking or car routes
to it (OSRM), optionally through up to 5 ordered stops. Walking routes get a "pleasure" score from
the green pixels on the map tiles along them.

## Run and test

```sh
npm start          # python3 -m http.server 8000, then open http://localhost:8000
npm install        # once, only needed for the tests
npm test           # node --test test/
```

Geolocation needs `localhost` or HTTPS. Details: [Running and dependencies](operations/running-and-dependencies.md).

## Code map

- `index.html`, `styles.css`: page shell and layout; loads Leaflet and `convert` from unpkg.
- `src/app.js`: DOM, map, network and state.
- `src/geo.js`: pure, unit-tested helpers.
- `test/`, `tests/ai/`: deterministic tests and AI scenarios.
- `specs/`, `.specify/`, `.claude/skills/`: spec-driven factory workflow.

Data flow: [`dataflow/DATAFLOW.md`](../dataflow/DATAFLOW.md). Dependencies and versions:
[`sbom/SBOM.md`](../sbom/SBOM.md).

## Where to look

| Task | Page |
|---|---|
| Understand the structure and request lifecycle | [Architecture overview](architecture/overview.md) |
| Change search or suggestions | [Place search and suggestions](features/search.md) |
| Change routing, travel modes, route choice | [Routing](features/routing.md) |
| Change stops | [Stops](features/stops.md) |
| Change the pleasure score | [Pleasure indicator](features/pleasure.md) |
| Change distance or duration text | [Distance and duration formatting](features/distance-formatting.md) |
| Review third parties, privacy, security | [External services](integrations/external-services.md) |
| Run, deploy, manage dependencies | [Running and dependencies](operations/running-and-dependencies.md) |
| Write or fix tests | [Test suite](testing/test-suite.md) |
| Follow the feature process | [Spec-driven development workflow](development/spec-workflow.md) |
