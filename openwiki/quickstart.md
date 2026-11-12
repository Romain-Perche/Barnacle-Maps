---
type: quickstart
title: Quickstart
description: The entry point to the Barnacle Maps wiki. It explains what the app does, how to run and test it, and which page to read for each part of the code.
tags: [quickstart, overview, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Barnacle Maps quickstart

Barnacle Maps is a small, build-free navigation web app that runs entirely in the browser:

- a Leaflet map with OpenStreetMap tiles and your live position;
- Nominatim place search, with type-ahead suggestions;
- up to 3 OSRM routes in **Walk** or **Car** mode, through up to 5 ordered **stops**;
- for each route, its distance, its duration and its **arrival time** if you leave now (for example `arrive 14:32`, or `(+1 day)` when it falls on a later date);
- for walks, a **pleasure** score: green pixels along the route on the map tiles.

## Run and test

```sh
npm start   # serves the repo on http://localhost:8000 (geolocation needs localhost or HTTPS)
npm test    # node --test test/
```

There are no dependencies to install. Leaflet loads from a CDN, and versions are recorded in [`sbom/SBOM.md`](../sbom/SBOM.md). See [Running and configuration](operations/running-locally.md).

## Code map

- `index.html` and `styles.css`: page layout and styling.
- `src/app.js`: the browser layer (Leaflet, DOM, geolocation, network, state).
- `src/geo.js`: pure, unit-tested helpers.
- `test/`: Node unit tests.
- `tests/ai/`: Playwright scenarios run by an agent.
- `specs/`: feature specs.
- `.specify/` and `.claude/skills/`: Spec Kit and the factory tooling.

## Where to go for…

| Task | Page |
| --- | --- |
| Understand the overall design and the request flow | [Architecture overview](architecture/overview.md) |
| Find or add a pure helper | [Pure geo helpers](architecture/geo-helpers.md) |
| Change search or suggestions | [Place search](features/place-search.md) |
| Change routing, alternatives, detours or travel modes | [Routing](features/routing.md) |
| Work on stops | [Intermediate stops](features/stops.md) |
| Change the arrival-time display | [Arrival time](features/arrival-time.md) |
| Tune or debug the pleasure score | [Pleasure score](features/pleasure-score.md) |
| Swap a service provider, or review privacy and security | [External services](integrations/external-services.md) |
| Run, deploy or configure | [Running and configuration](operations/running-locally.md) |
| Write or run tests | [Testing](testing/test-suite.md) |
| Follow the spec → plan → tests → implement process | [Spec-driven development](workflows/spec-driven-development.md) |
