---
type: quickstart
title: Quickstart
description: Start here — what Barnacle Maps is, how to run and test it, and which wiki page to read for each task.
tags: [quickstart, overview, onboarding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Quickstart

Barnacle Maps is a small, dependency-free navigation web app. It shows a Leaflet/OpenStreetMap map with your live position, lets you search a place (Nominatim), and shows up to 3 walking or car routes to it (OSRM), optionally through up to 5 stops. Walking routes get a "pleasure" score from the green pixels on the map tiles.

## Run and test

```sh
npm start   # static server on http://localhost:8000 (geolocation needs localhost or HTTPS)
npm test    # node --test test/
```

No install or build step is needed. The repo's dependencies and tools are listed in [sbom/SBOM.md](../sbom/SBOM.md); how data moves between the browser and the outside services is drawn in [dataflow/DATAFLOW.md](../dataflow/DATAFLOW.md).

## Where the code is

- `index.html`, `styles.css` — page and panel layout.
- `src/app.js` — UI, map, geolocation and every network call.
- `src/geo.js` — pure helpers (URLs, parsing, geometry, stops, pleasure maths), unit tested.
- `test/`, `tests/ai/` — Node tests and AI browser scenarios.
- `specs/`, `.specify/`, `.claude/skills/` — the spec-driven development tooling.

## Which page to read

| If you want to… | Read |
| --- | --- |
| understand the overall design | [Architecture overview](architecture/overview.md) |
| follow state, the panel, status messages, stale-response handling | [App state, UI panel and request sequencing](architecture/app-state-and-ui.md) |
| change search, suggestions or the × clear button | [Place search](features/search.md) |
| change routing, travel modes, alternatives or detours | [Routing](features/routing.md) |
| change stops | [Stops](features/stops.md) |
| change the pleasure score | [Pleasure score](features/pleasure.md) |
| see which services get which data, privacy and security notes | [External services and privacy](integrations/external-services.md) |
| run or deploy the app | [Running and serving the app](operations/running-and-deployment.md) |
| write or run tests | [Testing](testing/test-strategy.md) |
| add a feature the spec-driven way | [Spec-driven development workflow](development/spec-workflow.md) |
