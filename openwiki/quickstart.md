---
type: quickstart
title: Quickstart
description: A starting point for new engineers on Barnacle Maps, a static Leaflet navigation web app. It explains how to run and test the app and which wiki page to read for each kind of task.
tags: [quickstart, overview, onboarding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Quickstart

Barnacle Maps is a small navigation web app that runs entirely in the browser. It shows an OpenStreetMap map with the user's live position and lets them search for a place. It then shows up to 3 walking or car routes to that place, each with distance and duration, optionally through up to 5 stops. Walking routes get a green-space "pleasure" score. A QR code hands the trip over to a phone.

## Run and test

```sh
npm start   # python3 -m http.server 8000 → open http://localhost:8000
npm test    # node --test test/
```

There is no build step and there are no npm dependencies. Geolocation needs `localhost` or HTTPS. The browser must be able to reach unpkg.com and the OpenStreetMap services.

## Code map

- `index.html`: the page and the CDN scripts (Leaflet, qrcode-generator)
- `src/app.js`: DOM, map, fetch and state glue
- `src/geo.js`: pure, unit-tested helpers
- `src/qr.js`: QR image helper
- `test/`: Node tests; `tests/ai/`: browser scenarios for an AI agent
- `specs/`: feature specs; `.specify/` and `.claude/skills/`: development workflow
- [`dataflow/DATAFLOW.md`](../dataflow/DATAFLOW.md): data flow model; [`sbom/SBOM.md`](../sbom/SBOM.md): dependency versions

## Where to go

| Task | Page |
|---|---|
| Understand the structure and state | [Architecture overview](architecture/overview.md) |
| Change search or suggestions | [Place search](features/search-and-suggestions.md) |
| Change routing, modes or alternatives | [Routing](features/routing-and-alternatives.md) |
| Work on stops | [Stops](features/stops.md) |
| Tune the green score | [Pleasure score](features/pleasure-score.md) |
| Change the QR / phone hand-off | [Continue on your phone](features/phone-qr-handoff.md) |
| Swap or add a third-party service or library | [External services](integrations/external-services.md) |
| Deploy, configure, review security or privacy | [Running and security](operations/running-and-security.md) |
| Write or run tests | [Testing](testing/test-strategy.md) |
| Follow the spec → plan → code process | [Spec-driven workflow](workflows/spec-driven-development.md) |
