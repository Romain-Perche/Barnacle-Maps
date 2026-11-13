---
type: operations
title: Running and dependencies
description: How to serve Barnacle Maps locally, why it needs localhost or HTTPS, how dependencies are pinned (npm lockfile and CDN URLs), and where the SBOM and data flow docs live.
tags: [operations, setup, dependencies, sbom]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-ea70eb6c045047448e446296
    resource: repo://.gitignore
  - id: openwiki-source-5093b074f16e0b77479219b2
    resource: repo://package-lock.json
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Running and dependencies

## Run

There is no build step. `npm start` runs `python3 -m http.server 8000` in the repo root, so any
static file server works too. Open `http://localhost:8000`.

- Geolocation (and so routing) only works in a secure context: `localhost` or HTTPS. Over plain
  HTTP on another host the app shows "Location unavailable…" and never computes a route.
- The browser needs outbound access to unpkg, Nominatim, OSRM and the OSM tile server (see
  [External services](../integrations/external-services.md)).
- Deploying means copying `index.html`, `styles.css` and `src/` to any static HTTPS host.

## Dependencies

- **npm**: `package.json` declares a single runtime dependency, `convert`, pinned to an exact version
  and locked with an integrity hash in `package-lock.json`. It is only installed for Node: the tests
  import `src/geo.js`, which imports `convert` from `node_modules`. Run `npm install` once before
  `npm test`. `node_modules/` is git-ignored.
- **CDN**: the browser loads Leaflet (script and CSS) and `convert` from unpkg with versions pinned
  in `index.html`. The import-map version of `convert` must match `package.json`; a contract test
  checks that (see [Test suite](../testing/test-suite.md) and
  [Distance formatting](../features/distance-formatting.md)).

Exact versions of every dependency are in the generated software bill of materials,
[`sbom/SBOM.md`](../../sbom/SBOM.md) (do not edit; the factory rewrites it).

## Generated documentation

- [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md) is drawn from `dataflow/model.json`.
- `openwiki/` is this wiki; `openwiki/.run.json` is git-ignored run state.
