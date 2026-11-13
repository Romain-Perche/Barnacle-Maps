---
type: guide
title: Quickstart
description: What Barnacle Maps is, how to run and test it in two commands, and which wiki page to read for each kind of change.
tags: [quickstart, overview, onboarding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Quickstart

Barnacle Maps is a small browser navigation app. It shows an OpenStreetMap map with your live position, searches places, and shows up to three walking or car routes to the chosen place, optionally through up to five stops. Walking routes get a "pleasure" score (green space along the way), and the selected route is summarised in a bar at the bottom of the map with its arrival time.

```sh
npm start   # serve on http://localhost:8000 (geolocation needs localhost or HTTPS)
npm test    # node --test test/
```

No build and no dependencies: the app is `index.html`, `styles.css`, `src/app.js` and `src/geo.js`, with Leaflet from a CDN. Library versions: [sbom/SBOM.md](../sbom/SBOM.md). Data flow: [dataflow/DATAFLOW.md](../dataflow/DATAFLOW.md).

## Where to look

| I want to… | Read |
| --- | --- |
| Understand the overall design | [Architecture overview](architecture/overview.md) |
| Follow what happens when a destination is chosen, or fix a race | [App state and request lifecycle](architecture/app-state-and-lifecycle.md) |
| Change search or suggestions | [Place search](features/place-search.md) |
| Change routing, alternatives or travel modes | [Routing and travel modes](features/routing.md) |
| Change stops | [Stops](features/stops.md) |
| Change the green-space score | [Walking pleasure score](features/walking-pleasure.md) |
| Change the bottom summary bar | [Route summary card](features/route-summary-card.md) |
| Know what is sent to third parties, or review security | [External services, security and privacy](integrations/external-services.md) |
| Run, deploy, or tweak constants | [Running and configuration](operations/running-and-configuration.md) |
| Write or run tests | [Testing](testing/test-suites.md) |
| Understand specs, factory skills and generated docs | [Spec-driven development workflow](development/spec-workflow.md) |

## Rule of thumb

Put anything computable without the browser in `src/geo.js` (pure, unit-tested); keep DOM, Leaflet and `fetch` in `src/app.js`.
