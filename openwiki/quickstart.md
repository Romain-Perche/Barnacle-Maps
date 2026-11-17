---
type: quickstart
title: Quickstart
description: What Barnacle Maps is, how to run and test it in a minute, and which wiki page to read for each common task.
tags: [quickstart, overview, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Quickstart

Barnacle Maps is a small, build-free navigation web app. It shows an OpenStreetMap map with your live position, lets you search a place, and shows up to 3 routes to it by **walking, car or bike**, each with distance and duration. You can add up to 5 stops, and walking and bike routes get a "pleasure" score from the amount of green along them.

## Run it

```
npm start   # serves the repo at http://localhost:8000 (python3 http.server)
npm test    # node --test test/
```

Open http://localhost:8000 and allow location access (geolocation needs localhost or HTTPS). No `npm install` is needed; versions of the tools and the Leaflet library are listed in [sbom/SBOM.md](../sbom/SBOM.md).

## Where the code is

- `index.html` - page and panel markup, loads Leaflet from unpkg and `src/app.js`.
- `src/app.js` - DOM, Leaflet, geolocation and network calls; app state.
- `src/geo.js` - pure, unit-tested helpers (URLs, parsing, travel modes, stops, geometry, pleasure maths).
- `test/` - Node unit tests and the OSRM fake; `tests/ai/` - Playwright scenarios with faked services.
- `specs/` - Spec Kit feature specs.

How data moves between the browser, the user and the outside services is drawn in [dataflow/DATAFLOW.md](../dataflow/DATAFLOW.md).

## Find your task

| I want to… | Read |
| --- | --- |
| Understand the overall design and state | [Architecture overview](architecture/overview.md) |
| Change search or suggestions | [Place search and suggestions](features/search.md) |
| Add a travel mode or change routing | [Routing and travel modes](features/routing-and-travel-modes.md) |
| Change how stops work | [Stops](features/stops.md) |
| Tune the green "pleasure" score | [Pleasure score](features/pleasure-score.md) |
| Know what each outside service receives | [External services and privacy](integrations/external-services.md) |
| Run tests or the browser scenarios offline | [Running and testing](operations/running-and-testing.md) |
| Follow the spec → plan → tasks → build flow | [Spec-driven workflow](operations/spec-workflow.md) |
