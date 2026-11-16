# Implementation Plan: Bicycle Travel Mode

**Branch**: `factory/pilot-45168-bicycle-track` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pilot-45168-bicycle-track/spec.md`

## Summary

Add "Bike" as a third travel mode next to Walk and Car. Cycling routes come from the same FOSSGIS OSRM
service already used for the other modes (`routing.openstreetmap.de/routed-bike`). The mode table in
`src/geo.js` gains a `bike` entry plus per-mode metadata (wording, pleasure on/off, detours on/off), so
`src/app.js` drops its `m === "car"` / `m === "foot"` ternaries and reads behavior from the table
(the no-route messages stay as a literal per-mode map in `app.js`, because the existing test
`test/routes.test.js` L5 requires the literal `"No walking route found."` there). The
Walk/Car radio group is restyled as a segmented control with icons (🚶 Walk | 🚗 Car | 🚲 Bike), keeping
the native radio inputs so keyboard and screen-reader behavior is unchanged. Bike routes get the pleasure
indicator like walking; detour routes stay walking-only. README is updated.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node ≥ 18 for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN); no npm dependencies

**Storage**: N/A (mode not persisted, per spec assumption)

**Testing**: `node --test test/` (node:test + node:assert), pure helpers in `src/geo.js` only

**Target Platform**: Modern browsers (static site served by `python3 -m http.server`)

**Project Type**: Single-page static web app, no build step

**Performance Goals**: Bike results within a few seconds, same as walk/car (SC-004) — one OSRM request, same as car

**Constraints**: No API key, no new dependency; public OSRM server rate limits respected (no extra requests vs. car mode)

**Scale/Scope**: ~5 files touched (`src/geo.js`, `src/app.js`, `index.html`, `styles.css`, `README.md`) + tests

No NEEDS CLARIFICATION remain; see [research.md](./research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholders, no ratified
principles), so there are no project gates to evaluate. In their absence the plan follows the
conventions visible in the repo, and the factory's non-interactive instruction: chose them myself.

| Implicit convention (from repo) | Status |
|---|---|
| No build step, no dependencies | PASS — CSS + one table entry, nothing added |
| Pure logic in `src/geo.js`, unit-tested in Node; DOM/fetch in `src/app.js` | PASS — mode metadata lives in `geo.js` and is tested |
| Existing tests keep passing (SC-005) | PASS with one justified edit: `test/modes.test.js` asserts the exact mode set `["car","foot"]`; it becomes `["bike","car","foot"]` (done by `/write-tests`, see Complexity Tracking). `test/routes.test.js` L4/L5 stay untouched: `app.js` keeps `detourWaypoints`, `Promise.allSettled` and the literal `"No walking route found."` |
| README documents each routing source | PASS — FR-012 task |

**Post-design re-check**: PASS. Re-checked by `/write-tests` on 2026-11-16: the L5 literal constraint is now part of the design (research R2).

## Project Structure

### Documentation (this feature)

```text
specs/pilot-45168-bicycle-track/
├── spec.md
├── design-options.html
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── geo-api.md       # TRAVEL_MODES / routeUrl contract
│   └── ui.md            # mode selector markup + status wording
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html          # mode selector: 3 labelled radios with icons, order Walk, Car, Bike
styles.css          # segmented-control style for #mode (mock B look), hidden native radios, focus ring
src/
├── geo.js          # TRAVEL_MODES.bike + per-mode metadata (noun, by, pleasure, detours)
└── app.js          # fetchRoutes/drawRoutes/updateRoutes read mode metadata instead of foot/car ternaries
test/
├── modes.test.js            # mode-set assertion now includes bike (already updated by /write-tests)
├── bike.contract.test.js    # contracts/geo-api.md + contracts/ui.md (written by /write-tests)
└── bike.integration.test.js # app.js/README wiring checks (written by /write-tests)
tests/ai/
├── us1-bike-routes.md       # AI scenarios for US1 (Playwright, mocked OSRM/Nominatim/tiles)
├── us2-mode-switching.md    # AI scenarios for US2
└── fixtures/green-tile.png  # 256×256 green tile used by the AI mocks
README.md           # bike mode, routed-bike source, pleasure now walk + bike
```

**Structure Decision**: Keep the existing single-project layout; no new files in `src/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Edit to existing test `test/modes.test.js` ("offers walking and car") | It asserts the exact key set of `TRAVEL_MODES`; adding a mode is the feature | Keeping bike out of `TRAVEL_MODES` would break the mode-switch guard in `app.js` (`radio.value in TRAVEL_MODES`) and `routeUrl`'s fallback-to-foot |
