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

**Testing**: `node --test test/` (`npm test`) for pure logic in `src/geo.js`; manual browser checks via [quickstart.md](./quickstart.md)

**Target Platform**: Modern desktop and mobile browsers, served over localhost/HTTPS (geolocation)

**Project Type**: Static single-page web app (no build step, no backend)

**Performance Goals**: Map reaches the starting view within 1 s of pressing (SC-002); Leaflet's default animation is ~0.25 s

**Constraints**: No new dependencies or build step (README); button must not overlap `#panel` or the zoom control on desktop and mobile (FR-006); keyboard and screen-reader accessible (FR-004/005)

**Scale/Scope**: One control, ~40 lines in `src/app.js`, ~10 in `src/geo.js`, a few CSS rules, one new test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholders such as
`[PRINCIPLE_1_NAME]`), so it defines no enforceable gates. Decision (made without asking, as
instructed): treat the gate as **PASS** and apply the project's de-facto rules from `README.md`
and the existing code instead:

| De-facto rule | Status (pre-design) | Status (post-design) |
|---------------|---------------------|----------------------|
| No build step, no dependencies | PASS: plain JS + existing Leaflet | PASS: no package added |
| Pure logic lives in `src/geo.js` and is unit-tested with `node --test` | PASS | PASS: `startingView()` + `test/view.test.js` |
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
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
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
└── view.test.js    # new: unit tests for startingView
```

**Structure Decision**: Keep the existing flat layout (`src/`, `test/`, root `index.html` and
`styles.css`). No new source files; one new test file following the `*.test.js` convention.

### Implementation outline (for `/speckit-tasks`)

1. `src/geo.js`: add `startingView` per [contracts/reset-view.md](./contracts/reset-view.md) §1;
   `test/view.test.js`: cover located, no fix, invalid fix, no input mutation.
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
6. Validate with [quickstart.md](./quickstart.md).

## Complexity Tracking

No constitution violations to justify.
