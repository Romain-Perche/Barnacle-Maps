---
type: quickstart
title: Quickstart
description: Start here - what Barnacle Maps is, how to run and test it, and which wiki page to read for each task.
tags: [quickstart, overview, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Quickstart

Barnacle Maps is a small navigation web app. It shows an OpenStreetMap map with your live position, lets you search a place, and shows up to 3 walking, cycling or driving routes to it, each with distance and duration. Routes can go through up to 5 stops, and walking and cycling routes get a "pleasure" score based on green areas along the way. It is plain HTML, CSS and ES modules running in the browser, with Leaflet for the map, Nominatim for search and OSRM for routing.

## Run and test

```sh
npm start   # python3 -m http.server 8000, then open http://localhost:8000
npm test    # node --test test/
```

Geolocation needs `localhost` or HTTPS. There is no build step and nothing to install. Libraries and versions: [`sbom/SBOM.md`](../sbom/SBOM.md). How data moves: [`dataflow/DATAFLOW.md`](../dataflow/DATAFLOW.md).

## Where to look

| I want to… | Read | Main code |
|---|---|---|
| understand how the app is put together | [Architecture overview](architecture/overview.md) | `index.html`, `src/app.js`, `src/geo.js` |
| change search or suggestions | [Place search](features/search.md) | `runSearch` in `src/app.js`, `searchUrl` / `parseSearchResults` in `src/geo.js` |
| add or change a travel mode, or how routes are chosen | [Routing and travel modes](features/routing-and-travel-modes.md) | `TRAVEL_MODES`, `routeUrl`, `pickRoutes` in `src/geo.js`; `fetchRoutes`, `updateRoutes` in `src/app.js` |
| work on stops | [Stops](features/stops.md) | `addStop` / `moveStop` / `removeStop` in `src/geo.js`; `setStops` in `src/app.js` |
| change the pleasure score | [Pleasure score](features/pleasure-score.md) | `scorePleasure` in `src/app.js`; pixel helpers in `src/geo.js` |
| run it, point it at other servers, review security | [Running, configuration and security](operations/running-and-configuration.md) | `package.json`, `index.html`, `pins.json` |
| write or run tests | [Testing](testing/testing.md) | `test/`, `test/fakes/`, `tests/ai/` |
| follow how features are specified and built | [Specs and the software factory workflow](development/specs-and-factory.md) | `specs/`, `.specify/`, `.factory/`, `.claude/skills/` |

Rule of thumb: logic that can run without a browser goes in `src/geo.js` and gets a unit test; `src/app.js` only wires it to the DOM, Leaflet and the network.
