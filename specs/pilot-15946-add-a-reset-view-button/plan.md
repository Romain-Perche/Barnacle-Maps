# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-15946-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-15946-add-a-reset-view-button/spec.md`

## Summary

Add a "Reset view" button on the map that returns it to its *starting view*. The starting view is the default view (central Paris, zoom 13). The first time the app auto-centers on the user's location (zoom 15), that location view replaces it, once. After that it never changes. The button only calls `map.setView(...)`. It does not touch search, routes, mode, status or markers.

Technical approach:
- A small pure module `src/view.js` exports `createStartView(defaultView)`. It holds the starting view and a one-shot `settle(lat, lng, zoom)` transition. It is unit-tested with `node --test`.
- `src/app.js` uses it in place of the current `centered` boolean in `onPosition`. It also adds a custom Leaflet control (`L.Control`) at `bottomright` that holds a native `<button>` named "Reset view".
- `styles.css` gets a few rules so the control matches Leaflet's `leaflet-bar` look and has a visible focus ring.

## Technical Context

**Language/Version**: JavaScript (ES modules, browser), Node.js built-in test runner for unit tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN, global `window.L`), OpenStreetMap tiles. No new dependencies.

**Storage**: N/A (the starting view is in-memory and recomputed on every load, per the spec assumptions)

**Testing**: `npm test` → `node --test test/`. Pure logic is tested there. DOM/Leaflet behavior is checked by hand with [quickstart.md](./quickstart.md), because the repo has no browser test harness.

**Target Platform**: Modern desktop and mobile browsers. Served statically (`npm start` → `python3 -m http.server 8000`).

**Project Type**: Single-page static web app (no build step)

**Performance Goals**: The reset finishes in < 1 s (SC-001). This is one `setView` call, and Leaflet's pan/zoom animation is ~250 ms.

**Constraints**: No build step and no new dependencies. The control must not overlap `#panel` or the existing map controls on desktop or mobile (FR-008).

**Scale/Scope**: 1 new module (~25 LOC), ~30 LOC in `app.js`, ~10 LOC CSS, 1 new test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled Spec Kit template. It defines no principles, so there are no project-specific gates. The plan follows the conventions already in the repo instead:

| Implicit convention (from repo) | Status |
|---|---|
| No build step, no runtime dependencies (README) | ✅ No new deps. Plain ES module. |
| Pure logic lives in importable modules tested with `node --test` (`src/geo.js` + `test/*.test.js`) | ✅ Start-view logic goes in `src/view.js` with `test/view.test.js` |
| Accessible controls (existing `aria-label`, `aria-pressed`, `role="status"`) | ✅ Native `<button>` with `aria-label`/`title` "Reset view" |

**Pre-design gate**: PASS (nothing to violate). **Post-design re-check**: PASS. The design adds one small module and no new complexity.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-15946-add-a-reset-view-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── start-view.md        # src/view.js module contract
│   └── reset-view-control.md # UI contract for the on-map button
├── checklists/requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks – not created here)
```

### Source Code (repository root)

```text
index.html               # unchanged (control is created by Leaflet in app.js)
styles.css               # + .reset-view control styles, focus ring
src/
├── app.js               # use createStartView; replace `centered`; add ResetViewControl
├── geo.js               # unchanged
└── view.js              # NEW: createStartView(defaultView)
test/
└── view.test.js         # NEW: unit tests for createStartView
```

**Structure Decision**: Keep the existing single-project layout (`src/` + `test/`). The start-view logic goes in its own module (`src/view.js`) rather than `geo.js`. `geo.js` handles geography and routing, while this is map-view state. A separate module also stays importable in Node without Leaflet.

## Complexity Tracking

No violations. Nothing to justify.
