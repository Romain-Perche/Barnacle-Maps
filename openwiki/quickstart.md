---
type: quickstart
title: Quickstart
description: Start here — what Barnacle Maps is, how to run and test it, the two source files that make up the app, and which wiki page to read for each kind of task.
tags: [quickstart, overview, onboarding, navigation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Quickstart

Barnacle Maps is a small, build-free navigation web app. It shows a Leaflet map with OpenStreetMap tiles and your live position, lets you search for a place, and shows up to 3 routes to it. Each route lists distance, duration and the arrival time if you leave now. You can switch between walking and car, add up to 5 ordered stops, and walking routes get a "pleasure" score based on how much green (parks, woods) the route passes.

## Run and test

```sh
npm start   # python3 -m http.server 8000, then open http://localhost:8000
npm test    # node --test test/
```

Geolocation needs `localhost` or HTTPS. Nothing to install: no build step and no npm dependencies (see [`sbom/SBOM.md`](../sbom/SBOM.md)). Details: [Running, dependencies and external services](operations/running-and-external-services.md).

## Code map

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css` | Page shell: map + floating panel (search, mode, results, stops, routes, status). |
| `src/app.js` | Browser controller: state, DOM events, network calls, drawing. |
| `src/geo.js` | Pure, Node-testable helpers: formatting, URLs/parsing, geometry, route picking, stops, pleasure maths. |
| `test/` | `node --test` suite and the app harness in `test/support/`. |
| `tests/ai/` | Playwright scenarios run by an agent. |
| `specs/`, `.specify/`, `.claude/skills/` | Spec Kit feature specs and factory tooling. |

## Where to go for a task

| I want to… | Read |
| --- | --- |
| Understand how the app is put together, state and request sequencing | [Architecture overview](architecture/overview.md) |
| Change search or suggestions | [Place search](features/search.md) |
| Change routing, alternatives, detours or travel modes | [Routing and travel modes](features/routing.md) |
| Work on stops | [Stops](features/stops.md) |
| Change the arrival time display or its refresh rules | [Arrival time](features/arrival-time.md) |
| Tune the green-pixel pleasure score | [Pleasure indicator](features/pleasure.md) |
| Deploy, swap providers, review external calls/security | [Running, dependencies and external services](operations/running-and-external-services.md) |
| Write or run tests | [Test suite](testing/test-suite.md) |
| Follow the spec → tests → code process | [Spec-driven development workflow](development/spec-driven-workflow.md) |
