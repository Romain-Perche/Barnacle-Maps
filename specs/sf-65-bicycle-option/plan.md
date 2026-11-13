# Implementation Plan: Bicycle Option

**Branch**: `factory/sf-65-bicycle-option` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/sf-65-bicycle-option/spec.md`

## Summary

Add a third travel mode, "Bike", next to "Walk" and "Car". Cycling routes come from the same FOSSGIS OSRM
service already used for the other modes, via its bicycle instance (`routing.openstreetmap.de/routed-bike`).
The change is mostly data: one new entry in `TRAVEL_MODES` (with per-mode wording for status messages), one
new radio button in `index.html`, and replacing the two-way `car ? … : …` wording in `src/app.js` with a
lookup in `TRAVEL_MODES`. Existing guards already give the required bike behaviour: detours are only forced
for `foot`, pleasure is only scored for `foot`, stale results are dropped by `routeSeq`, and changing the
mode keeps the destination and stops.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node ≥ 18 for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN), OSRM HTTP API (routing.openstreetmap.de), Nominatim; no npm deps

**Storage**: N/A (mode not persisted, per spec assumptions)

**Testing**: `node --test test/` (built-in Node test runner: pure helpers in `src/geo.js`, plus static checks of `index.html` and `README.md`); AI scenarios in `tests/ai/` run later by an agent on the running app (headless Playwright)

**Target Platform**: Modern desktop/mobile browsers, served statically (`python3 -m http.server`)

**Project Type**: Static single-page web app, no build step

**Performance Goals**: Same as existing modes: one OSRM request per mode change (bike never triggers the 2 extra detour requests)

**Constraints**: No new dependencies; walk/car behaviour and default mode unchanged (FR-010, SC-004)

**Scale/Scope**: ~3 files of source changed (`src/geo.js`, `src/app.js`, `index.html`), `README.md`; tests: `test/modes.test.js` extended, `test/bike-ui.test.js` and `tests/ai/us1-*.md`, `tests/ai/us2-*.md` added (already written, red before implementation). Pre-existing test files (`geo`, `pleasure`, `routes`, `stops`) unchanged (SC-004)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (no ratified principles), so there are no
project gates to evaluate. Applied instead, as de-facto project conventions seen in the codebase:

| Convention | Status |
|------------|--------|
| No build step, no dependencies | PASS – no new dependency |
| Pure logic in `src/geo.js`, unit tested in Node; DOM/fetch in `src/app.js` | PASS – mode data lives in `geo.js` and is tested |
| README documents user-visible features | PASS – FR-011 README update planned |
| Simplicity (smallest change that works) | PASS – one data entry + wording lookup |

**Post-design re-check**: PASS, design unchanged against the above.

## Project Structure

### Documentation (this feature)

```text
specs/sf-65-bicycle-option/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── travel-modes.md  # geo.js TRAVEL_MODES / routeUrl contract
│   └── ui.md            # mode selector + status messages contract
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html          # + <label><input type="radio" name="mode" value="bike"> Bike</label>
src/
├── geo.js          # TRAVEL_MODES: add `bike`; add per-mode wording (adjective, by) to every mode
└── app.js          # status/summary/no-route texts read from TRAVEL_MODES[m] instead of car/foot ternaries
test/
├── modes.test.js   # keys now foot/car/bike; bike URL tests; wording fields present for every mode
└── bike-ui.test.js # new: radiogroup order Walk · Car · Bike (Walk checked); README bike line (FR-011)
tests/
└── ai/             # new: agent-run scenarios on the running app
    ├── us1-cycling-routes.md
    └── us2-cycle-through-stops.md
README.md           # mention bike mode (FR-011)
```

**Structure Decision**: Keep the existing flat layout (`index.html`, `src/`, `test/`). No new files in `src/`. Deterministic tests stay in `test/` (picked up by `npm test`); AI scenarios live in `tests/ai/` and are not run by `npm test`.

**Test state before implementation**: the 96 pre-existing tests pass; the 8 bike tests fail until the `bike` entry (`src/geo.js`), the Bike radio (`index.html`) and the README line exist. The wording test covers every mode, so it stays red until the `bike` entry is added, even after foot/car get their wording fields.

## Complexity Tracking

No violations; nothing to justify.
