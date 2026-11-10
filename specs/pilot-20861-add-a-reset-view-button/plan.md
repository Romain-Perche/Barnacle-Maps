# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-20861-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/pilot-20861-add-a-reset-view-button/spec.md`

## Summary

Add a Leaflet control (top-right of the map) with a "Reset view" button. The app records a fixed `startingView` (center + zoom): initially `DEFAULT_VIEW`; replaced once, at the existing one-time auto-centering in `onPosition`, by the first position at zoom 15. Pressing the button calls `map.setView(startingView)` and touches no other state.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES modules), no build step
**Primary Dependencies**: Leaflet 1.9.4 (CDN, global `window.L`)
**Storage**: N/A (starting view is not persisted)
**Testing**: `node --test test/` (existing pure-logic tests plus `test/reset-view.test.js`, which runs `src/app.js` against a fake Leaflet in `test/helpers/app-harness.js`); AI scenarios in `tests/ai/`; manual browser check per quickstart for pixel size, animation time and screen reader
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: Static single-page web app
**Performance Goals**: Reset is a single `setView` call; any animation lasts at most 1 s and the final view is within 1 px of the starting view
**Constraints**: No overlap with `#panel` (top-left), Leaflet zoom control, or attribution (bottom-right); keyboard operable; accessible name
**Scale/Scope**: One control, ~25 lines in `src/app.js`, a few CSS rules

## Constitution Check

`.specify/memory/constitution.md` is the unfilled template: no ratified principles, so no gates apply. Plan stays minimal (no new dependencies, no new files in `src/`; tests only add files under `test/` and `tests/ai/`). **Result: PASS** (before and after design).

## Project Structure

### Documentation (this feature)

```text
specs/pilot-20861-add-a-reset-view-button/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
index.html        # unchanged
src/app.js        # startingView state, set in onPosition; reset control
styles.css        # control styling (if needed beyond Leaflet's bar classes)
test/             # reset-view.test.js, helpers/app-harness.js
tests/ai/         # AI scenarios for US1 and US2
```

**Structure Decision**: Existing flat static app; changes confined to `src/app.js` and `styles.css`.

## Complexity Tracking

No violations.
