# Implementation Plan: Reset View Button

**Branch**: `pilot-21489-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/pilot-21489-add-a-reset-view-button/spec.md`

## Summary

Add a "Reset view" button to the map as a Leaflet control (top-right, clear of the top-left search panel and the bottom-right attribution). The app records a *starting view* (centre + zoom) once start-up settles: the default view at load, replaced exactly once by the user-centred view (zoom 15) when the first geolocation fix auto-centres the map. Pressing the button calls `map.setView(startView.center, startView.zoom)` and touches no other state.

## Technical Context

**Language/Version**: JavaScript (ES modules, browser) + Node for tests
**Primary Dependencies**: Leaflet 1.9.4 (CDN, global `L`); no new dependencies
**Storage**: N/A (in-memory, session only)
**Testing**: `node --test test/` (existing); pure helper unit-tested, UI checked manually via quickstart
**Target Platform**: Modern browsers, desktop and mobile
**Project Type**: Static single-page web app (no build step)
**Performance Goals**: Map reaches start view within 1 s (SC-002); use `animate: false`-free default `setView` (≤ ~250 ms animation)
**Constraints**: No new network requests (FR-009); must not alter search/route/mode state (FR-006)
**Scale/Scope**: ~30 lines in `src/app.js`, a small CSS rule, one test file

## Constitution Check

`.specify/memory/constitution.md` is the unfilled template: no ratified principles, so no gates apply. Self-imposed checks: no new dependencies (pass), minimal change (pass), tests for logic (pass). Re-checked after design: still pass.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-21489-add-a-reset-view-button/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html           # unchanged (control is created by Leaflet in JS)
styles.css           # small style for the control, if needed
src/
├── app.js           # startView state, set in init and in first onPosition; reset control
└── view.js          # NEW: pure helper createStartView() (default, settle-on-location, get)
test/
└── view.test.js     # NEW: unit tests for the helper
```

**Structure Decision**: Keep the existing flat static layout. Extract the start-view state into a tiny DOM-free module `src/view.js` so the "set once, never follow later updates" logic is testable with `node --test`; the Leaflet control wiring stays in `src/app.js`.

## Complexity Tracking

No violations.
