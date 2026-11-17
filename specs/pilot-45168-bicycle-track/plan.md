# Implementation Plan: Bicycle Travel Mode

**Branch**: `pilot-recipe/pilot-45168-bicycle-track` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pilot-45168-bicycle-track/spec.md`

## Summary

Add a third travel mode, **Bike**, to Barnacle Maps, next to Walk and Car. Cycling routes come from the same
FOSSGIS OSRM server as the other modes, through its bicycle instance (`https://routing.openstreetmap.de/routed-bike`,
profile `bike`). The mode is one more entry in `TRAVEL_MODES`. The mode-specific `if (m === "car")` / `m === "foot"`
branches in `src/app.js` become per-mode data: wording, `pleasure` (Walk + Bike), `detours` (Walk only). The
radio group in `index.html` gets a third radio and is restyled as a segmented control with icons
(🚶 Walk | 🚗 Car | 🚲 Bike). It keeps native radio inputs, so keyboard use and screen-reader announcements
stay as they are. The README is updated. No new dependency and no build step.

## Technical Context

**Language/Version**: JavaScript (ES modules), runs in modern browsers; Node ≥ 20 for `node --test`

**Primary Dependencies**: Leaflet 1.9.4 from the unpkg CDN (already present). No npm packages.

**Storage**: N/A (mode is not persisted; FR-002 / spec assumption)

**Testing**: `node --test test/` (built-in Node test runner) on the pure helpers in `src/geo.js`

**Target Platform**: Modern desktop/mobile browsers (geolocation needs localhost or HTTPS)

**Project Type**: Static single-page web app (no backend)

**Performance Goals**: Cycling results in a time comparable to walk/car: one OSRM request, no detour requests (SC-004)

**Constraints**: No build step, no dependencies; respect the public FOSSGIS/OSM usage policies (no extra request load beyond walking)

**Scale/Scope**: About 6 files touched (`src/geo.js`, `src/app.js`, `index.html`, `styles.css`, `README.md`, tests)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template: it has no ratified principles, so there are no
gates to check. The plan follows the conventions already in the repo instead:

- Pure, DOM-free helpers stay in `src/geo.js` and get unit tests. DOM wiring stays in `src/app.js`. ✅
- No build step or dependencies (README). ✅
- Simplicity: Bike is one entry in an existing table, and mode behavior is data, not new branches. ✅

Post-design re-check: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-45168-bicycle-track/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── travel-modes.md  # TRAVEL_MODES / routeUrl contract (geo.js public API)
│   ├── osrm-bike.md     # What we call on the outside routing service
│   └── mode-selector.md # UI contract of the segmented control
├── dependencies.json    # [] — no new dependency
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html          # mode radiogroup → 3 segments with icons (Walk, Car, Bike)
styles.css          # segmented-control style for #mode, selected segment highlighted, focus ring
src/geo.js          # TRAVEL_MODES.bike + per-mode metadata (wording, pleasure, detours)
src/app.js          # use mode metadata instead of car/foot branches (status, pleasure, detours)
README.md           # bicycle mode + routing source; pleasure applies to walk and bike
test/modes.test.js  # updated: TRAVEL_MODES now has 3 keys; bike URL tests
test/stops.test.js  # bike route through stops (URL)
```

**Structure Decision**: Keep the existing flat layout (`src/`, `test/`). Add no new modules.

## Design notes for Build

- `TRAVEL_MODES.bike = { label: "Bike", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", ... }`.
  Add to every mode the fields listed in [data-model.md](./data-model.md) (`icon`, `noun`, `adverb`, `pleasure`, `detours`)
  and read them in `app.js`:
  - `setStatus(\`Computing ${noun} routes…\`)`, `No ${noun} route found.`, `${summary} ${adverb}${via}`,
    `${n} ${noun} routes${via} · fastest …` (walk: walking / on foot; car: driving / by car; bike: cycling / by bike).
  - `drawRoutes`: create the pleasure span when `TRAVEL_MODES[m].pleasure`; `updateRoutes`: call `scorePleasure`
    under the same condition.
  - `fetchRoutes`: force detours only when `TRAVEL_MODES[m].detours` (Walk), replacing `m !== "foot"`.
  - Pleasure tooltip: say "along this route" rather than "along this walk".
- Keep the same stale-result guard (`routeSeq`). It already covers mode, destination and stop changes (FR-011).
- Mode selector: keep `<input type="radio" name="mode">` inside each `<label>` and hide the input visually
  (not `display:none`, so it stays focusable). Style the labels as segments, highlight the selected one with `:has(input:checked)`,
  and show a focus ring with `:has(input:focus-visible)`. Put the icons in `<span aria-hidden="true">` so the
  accessible names stay "Walk", "Car", "Bike". The existing `change` listener needs no change.
- Existing test `TRAVEL_MODES offers walking and car` asserts exactly two keys. It must be updated to three keys
  (`bike`, `car`, `foot`), with the other assertions unchanged. This is the only change to existing tests that SC-005
  needs; every other existing test must keep passing as is.

## Outside services

- OSRM routing (FOSSGIS `routing.openstreetmap.de/routed-bike`, Route service): no public schema found on GitHub (searched Project-OSRM/osrm-backend at commit 0d2de72d2db751a9d01ab15ca82695bf4dfbd28c and fossgis-routing-server/cbf-routing-profiles at commit b530337d5aaa04cdabaf685f9ff3ef8bbb98ccb4; OSRM's HTTP API is documented only in prose: https://github.com/Project-OSRM/osrm-backend/blob/0d2de72d2db751a9d01ab15ca82695bf4dfbd28c/docs/http.md)
- OpenStreetMap raster tiles (`tile.openstreetmap.org`, now also fetched for bike pleasure scoring): no public schema found on GitHub (it serves PNG images at `/{z}/{x}/{y}.png`; there is no API schema in the openstreetmap org repos)

## Complexity Tracking

No violations.
