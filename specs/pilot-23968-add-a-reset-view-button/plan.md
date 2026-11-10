# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-23968-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-23968-add-a-reset-view-button/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a "Reset view" button on the map that returns it to the starting view: the person's first
location fix at the close zoom (15) if it was found, otherwise the fixed default view (Paris,
zoom 13). Approach: a custom Leaflet control in the bottom-right corner holding a native
`<button>`; a module-level `startView` in `src/app.js`, set once on the first fix through a pure,
unit-tested helper `startingView()` in `src/geo.js`; the button calls `map.setView` (deferred to
`zoomend` if a zoom animation is running) and touches no other state. See [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), run directly in the browser; Node.js 18+ for tests

**Primary Dependencies**: Leaflet 1.9.4 (global `L`, loaded from unpkg in `index.html`); no npm dependencies

**Storage**: N/A (in-memory state only; starting view is not persisted)

**Testing**: `node --test test/` (`npm test`): unit tests for the pure `startingView()` in `test/view.test.js`, and integration tests in `test/reset-view.integration.test.js` that import `src/app.js` under a small dependency-free fake browser and fake Leaflet (`test/helpers/fake-browser.js`). Real layout, contrast, focus ring, keyboard, screen reader and touch are checked by the AI test scenarios in `tests/ai/` (they load Leaflet from unpkg) and by hand via [quickstart.md](./quickstart.md). See [research.md](./research.md) R6

**Target Platform**: Modern desktop and mobile browsers, served over localhost/HTTPS (geolocation)

**Project Type**: Static single-page web app (no build step, no backend)

**Performance Goals**: Map reaches the starting view within 1 s of pressing (SC-002); Leaflet's default animation is ~0.25 s

**Constraints**: No new dependencies or build step (README); button must not overlap `#panel`, the zoom control or the OpenStreetMap attribution, checked at 375 px and 1280 px wide (FR-006); keyboard and screen-reader accessible (FR-004/005)

**Scale/Scope**: One control, ~40 lines in `src/app.js`, ~10 in `src/geo.js`, a few CSS rules; tests already written (two test files, one test helper, two AI scenario files)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholders such as
`[PRINCIPLE_1_NAME]`), so it defines no enforceable gates. Decision (made without asking, as
instructed): treat the gate as **PASS** and apply the project's de-facto rules from `README.md`
and the existing code instead:

| De-facto rule | Status (pre-design) | Status (post-design) |
|---------------|---------------------|----------------------|
| No build step, no dependencies | PASS: plain JS + existing Leaflet | PASS: no package added |
| Pure logic lives in `src/geo.js` and is unit-tested with `node --test` | PASS | PASS: `startingView()` + `test/view.test.js`; wiring covered by `test/reset-view.integration.test.js` with a fake browser written in plain JS (no dependency added) |
| DOM/Leaflet wiring lives in `src/app.js` | PASS | PASS: control + `startView` state there |
| Accessible UI (existing code uses `aria-label`, `role`, `aria-pressed`) | PASS | PASS: native button, accessible name "Reset view" |
| Keep it simple | PASS | PASS: one control, one state variable, no new modules |

No violations; Complexity Tracking is empty. Recommend running `/speckit-constitution` separately
so future plans have real gates.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-23968-add-a-reset-view-button/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: design decisions
├── data-model.md        # Phase 1: View / starting view state
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   └── reset-view.md    # Phase 1: startingView() + map control contract
├── checklists/
│   ├── requirements.md
│   └── ux.md
├── analyze-report.md    # /speckit-analyze output
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html          # unchanged (Leaflet + app.js already loaded)
styles.css          # + .reset-view button styles (size, focus ring)
src/
├── app.js          # + LOCATE_ZOOM const, startView state set in onPosition's first-fix branch,
│                   #   ResetViewControl (L.Control, bottomright), resetView() with zoomend deferral
└── geo.js          # + export startingView(firstFix, defaultView, locateZoom)
test/
├── view.test.js                     # new: unit tests for startingView
├── reset-view.integration.test.js   # new: control wiring under the fake browser
└── helpers/
    └── fake-browser.js              # new: fake DOM, geolocation and Leaflet (plain JS, no dependency)
tests/
└── ai/
    ├── us1-reset-view.md            # new: AI scenarios for US1 (real browser)
    └── us2-input-methods.md         # new: AI scenarios for US2 (real browser)
```

**Structure Decision**: Keep the existing flat layout (`src/`, `test/`, root `index.html` and
`styles.css`). No new source files. Deterministic tests stay in `test/` (`*.test.js`, run by `node --test test/`; helpers in `test/helpers/` are not test files). AI scenarios live in `tests/ai/`, the factory's folder for scenario files run by an agent in a real browser; the two folders are separate on purpose.

### Implementation outline (for `/speckit-tasks`)

1. `src/geo.js`: add `startingView` per [contracts/reset-view.md](./contracts/reset-view.md) §1;
   `test/view.test.js` (already written) covers located, no fix, invalid fix, no input mutation.
2. `src/app.js`: `const LOCATE_ZOOM = 15;` replace the literal in `onPosition`;
   `let startView = startingView(null, DEFAULT_VIEW, LOCATE_ZOOM);` and in the `if (!centered)`
   branch `startView = startingView(position, DEFAULT_VIEW, LOCATE_ZOOM);`.
3. `src/app.js`: `resetView()` (`map._animatingZoom` → `map.once("zoomend", resetView)`, else
   `map.setView(...)`, with `{ animate: false }` when `matchMedia("(prefers-reduced-motion: reduce)")`
   matches) and a `bottomright` `L.Control` with the button, propagation disabled
   ([research.md](./research.md) R1, R2, R4).
4. `styles.css`: button styling matching Leaflet bars, visible `:focus-visible` outline, ≥ 44 × 44 CSS px
   touch target, WCAG AA contrast (FR-004a).
5. README: one line mentioning the Reset view button.
6. Validate: `npm test` (unit + integration suites green), the AI scenarios in `tests/ai/`, and [quickstart.md](./quickstart.md).

## Complexity Tracking

No constitution violations to justify.
