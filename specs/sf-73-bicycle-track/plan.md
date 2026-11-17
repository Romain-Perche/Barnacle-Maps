# Implementation Plan: Bicycle Travel Mode

**Branch**: `factory/sf-73-bicycle-track` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/sf-73-bicycle-track/spec.md`

## Summary

Add a third travel mode, **Bike**, next to Walk and Car. Bike routes come from the same OSRM provider already used for walking and car (FOSSGIS `routing.openstreetmap.de/routed-bike`), so URL building, parsing, alternatives, stops and stale-result handling stay as they are. Each `TRAVEL_MODES` entry in `src/geo.js` gets the per-mode data the UI needs (icon, `pleasure`, `detours`, status texts). `src/app.js` reads that data instead of using `m === "car"` / `m === "foot"` checks. OSRM answers "no route" with HTTP 400 and `{ code: "NoRoute" }` (OSRM HTTP docs). The app treats that answer as an empty result, so the "No … route found." message appears (research R8). The selector becomes design C: one row of segmented buttons with icons (🚶 Walk | 🚗 Car | 🚲 Bike). It is built from restyled native radio inputs, so keyboard use and the existing `change` handler keep working.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node ≥ 20 for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN). No npm dependencies, no build step

**Storage**: N/A (mode not persisted, per spec assumption)

**Testing**: `node --test test/` (built-in `node:test` + `node:assert/strict`). Pure helpers in `src/geo.js` are unit-tested. `src/app.js` is only checked by source-string tests.

**Target Platform**: Modern desktop/mobile browsers (served by `python3 -m http.server`)

**Project Type**: Static single-page web app

**Performance Goals**: Same as walking: routes shown as soon as OSRM answers, pleasure scoring best-effort within the existing limits (15 km straight line, 150 tiles, 20 s)

**Constraints**: Free public OSM services only, no API key. Existing walk/car behaviour unchanged except for the selector look (SC-004).

**Scale/Scope**: About 4 source files touched (`src/geo.js`, `src/app.js`, `index.html`, `styles.css`), plus README and tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template: no ratified principles, so there are no gates to apply. We fall back on the project's own conventions, and the design follows them:

- No new dependencies and no build step: ✅ (same OSRM provider, plain CSS/HTML)
- Pure, Node-testable logic lives in `src/geo.js`. DOM/fetch code lives in `src/app.js`: ✅ (mode data and texts are added to `geo.js`)
- Existing tests keep passing (SC-004): ✅ with two intentional, documented test edits (see research R7)
- Outside services tested only through fakes checked against their public docs (`.factory/test-env.md`): ✅

**Post-design re-check**: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/sf-73-bicycle-track/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── travel-modes.md  # Phase 1: TRAVEL_MODES / routeUrl / selector markup / texts
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html        # mode selector: 3 radios (foot, car, bike) with icon spans (design C)
styles.css        # #mode as one segmented row; checked + focus-visible styles
src/
├── geo.js        # TRAVEL_MODES gains bike + per-mode fields; routeUrl unchanged in signature
└── app.js        # uses TRAVEL_MODES[m].{pleasure,detours,texts}; OSRM NoRoute (HTTP 400) = no route
test/
├── modes.test.js       # edited: key list includes bike (research R7)
├── routes.test.js      # edited: L5 reads app.js + geo.js (research R7)
├── bike.test.js        # contract: TRAVEL_MODES fields, routeUrl bike rows
├── selector.test.js    # design C markup and CSS
├── bike-app.test.js    # integration: real app.js with fake DOM/Leaflet/OSRM
├── osrm-fake.test.js   # self-check of the fake OSRM against the OSRM docs
└── fakes/              # osrm.js (fake OSRM), app-harness.js (fake DOM, Leaflet, fetch)
tests/ai/               # AI scenarios us1–us3 + harness.mjs (headless Chromium, fake services)
README.md               # mention bike mode (FR-010)
```

**Structure Decision**: Keep the existing flat layout (`src/`, `test/`, root HTML/CSS). No new modules.

## Design Notes (implementation guidance)

1. **`src/geo.js`**: extend `TRAVEL_MODES` per [data-model.md](./data-model.md). Add `bike: { base: ".../routed-bike", profile: "bike", pleasure: true, detours: false, ... }`. Insertion order is `foot, car, bike` (same as the selector). Update the header comments to mention bike.
2. **`src/app.js`**:
   - `fetchRoutes`: replace `m !== "foot"` with `!TRAVEL_MODES[m].detours` (FR-009).
   - `drawRoutes`: create the pleasure span when `TRAVEL_MODES[m].pleasure` (FR-008).
   - `updateRoutes`: take `computing`, `noRoute`, `single`, `plural` from `TRAVEL_MODES[m]` (FR-005). Call `scorePleasure` when `pleasure` is true.
   - `scorePleasure` tooltip: "…along this walk…" becomes "…along this route…" (it now covers rides too).
   - Route requests: an OSRM answer with HTTP 400 and JSON `code: "NoRoute"` gives an empty route list (so `noRoute` is shown, with " Try removing a stop." when there are stops). Any other non-OK answer still throws ("Routing failed: …"). Only the route requests change. Search keeps `fetchJson` (research R8).
   - Mode change listener: unchanged (already validates `value in TRAVEL_MODES`, keeps stops, recomputes; `routeSeq` drops late results for FR-006).
3. **`index.html` / `styles.css`**: selector markup and CSS per [contracts/travel-modes.md](./contracts/travel-modes.md). Inputs are visually hidden but stay focusable, so arrow keys work (FR-001). Walk keeps `checked` (FR-002).
4. **README**: add Bike to the mode sentence and a "Bike routes" bullet (FR-010).

## Complexity Tracking

No constitution violations to justify.
