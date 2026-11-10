# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-22089-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-22089-add-a-reset-view-button/spec.md`

## Summary

Add a "Reset view" control on the Leaflet map that moves the map back to the **starting view**:
central Paris at zoom 13, or, once the first geolocation fix arrives, that first location at zoom 15.
The starting view is recorded once per page load, in the same place where the app already centers
on the first fix (`onPosition`, guarded by `centered`). Later position updates, pans, zooms,
searches and route changes never change it. Pressing the control calls `map.setView(center, zoom)`
and touches no other state.

The control is a Leaflet custom control holding a native `<button type="button">` (keyboard
Enter/Space and an accessible name for free), styled like the zoom buttons (`leaflet-bar`). Because
the search panel sits on top of the top-left corner (where the zoom control is today, and where it
is currently hidden behind the panel), the zoom control and the new reset control both move to the
**bottom-right** corner, above the attribution, which is the only corner the panel never covers on
desktop or mobile.

The view logic that can be tested without a DOM (default view, located zoom, building the starting
view from the first fix) lives as pure helpers in `src/geo.js` and gets Node unit tests.

## Technical Context

**Language/Version**: JavaScript (ES modules), run directly in the browser; Node ≥ 18 for tests (`node --test`)

**Primary Dependencies**: Leaflet 1.9.4 (loaded from unpkg as `window.L`); no npm dependencies, no build step

**Storage**: N/A (starting view kept in memory for the page load only; not persisted)

**Testing**: `node:test` + `node:assert/strict` on pure helpers in `src/geo.js` (`npm test`); manual browser checks for the DOM/Leaflet part (see [quickstart.md](./quickstart.md))

**Target Platform**: Modern desktop and mobile browsers; served by `python3 -m http.server 8000` (geolocation needs localhost or HTTPS)

**Project Type**: Single-page static web app (no backend)

**Performance Goals**: Map reaches the starting view within 1 s of the press (SC-003); Leaflet's default `setView` animation is ~0.25 s

**Constraints**: No new dependencies; no change to search/route/mode/pleasure state on reset (FR-005); control must not overlap the search panel at any width (FR-007)

**Scale/Scope**: One new map control, ~30 lines in `src/app.js`, a few lines in `src/geo.js` and `styles.css`, one new test file

No NEEDS CLARIFICATION remains; the only open product question (which view is "starting") was settled in the spec's Clarifications. Technical choices are recorded in [research.md](./research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholders such as
`[PRINCIPLE_1_NAME]`), so it defines no enforceable gates. In its place this plan holds itself to
the conventions the repository already follows (README, `src/geo.js` header, existing tests):

| Gate (from repo conventions) | Pre-design | Post-design |
|---|---|---|
| No build step, no new dependencies | Pass | Pass: uses Leaflet APIs already loaded (`L.Control`, `L.DomUtil`, `L.DomEvent`) |
| Pure, DOM-free logic lives in `src/geo.js` and is unit tested in `test/` | Pass | Pass: `DEFAULT_VIEW`, `LOCATED_ZOOM`, `locatedView()` move/added to `geo.js` with `test/view.test.js` |
| DOM/Leaflet wiring stays in `src/app.js` | Pass | Pass: control and `onPosition` change only in `app.js` |
| Accessible controls (existing code uses `aria-label`, `role`, `aria-pressed`) | Pass | Pass: native `<button>` with `aria-label`/`title` "Reset view" |
| Simplicity (smallest change that meets the spec) | Pass | Pass: one control, two module-level variables, no new abstractions |

No violations, so Complexity Tracking is empty. Recommendation: run `/speckit-constitution` to
replace the template before later features rely on this gate.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-22089-add-a-reset-view-button/
├── spec.md              # Feature spec (with clarifications)
├── plan.md              # This file
├── research.md          # Phase 0: technical decisions
├── data-model.md        # Phase 1: the "starting view" entity and its lifecycle
├── quickstart.md        # Phase 1: how to validate the feature end to end
├── contracts/
│   ├── reset-view-control.md   # UI contract of the control (DOM, a11y, behavior, placement)
│   └── view-helpers.md         # Module contract of the new geo.js exports
├── checklists/requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html          # unchanged (control is created by Leaflet in JS)
styles.css          # + .reset-view button styles (size/icon/focus ring matching .leaflet-bar a)
src/
├── geo.js          # + DEFAULT_VIEW, LOCATED_ZOOM, locatedView(position)
└── app.js          # map created with zoomControl:false; zoom control + ResetViewControl at "bottomright";
                    # `startView` variable set from DEFAULT_VIEW, replaced once in onPosition on first fix;
                    # `resetRouteSeq` + `fit` option on drawRoutes so a reset during loading wins (FR-011)
test/
└── view.test.js    # new: unit tests for DEFAULT_VIEW / LOCATED_ZOOM / locatedView
```

**Structure Decision**: Keep the existing single-project layout (`index.html`, `styles.css`,
`src/`, `test/`). Pure logic in `src/geo.js`, browser wiring in `src/app.js`, tests in `test/`.

## Design Notes (for /speckit-tasks)

1. **Starting view state** (see [data-model.md](./data-model.md)):
   `let startView = DEFAULT_VIEW;` set at map creation. In `onPosition`, inside the existing
   `if (!centered)` branch: `startView = locatedView(position); map.setView([startView.lat, startView.lng], startView.zoom);`.
   The `centered` flag already guarantees this runs once, so later fixes don't move the target (FR-003/FR-004).
   The `map.setView` in `showRoute` (no position yet) is not a startup view and must **not** update `startView`.
2. **Reset action**: `function resetView() { map.setView([startView.lat, startView.lng], startView.zoom, { animate: !reducedMotion() }); }`,
   where `reducedMotion()` reads `matchMedia("(prefers-reduced-motion: reduce)").matches` at press time (FR-010).
   It reads nothing else and writes nothing else (FR-005). Leaflet's `setView` stops any running
   pan/zoom/fly animation first and is a no-op-like move when already there (FR-008, edge cases).
   It does not cancel route fetching. **Reset wins over loading routes (FR-011)**: `resetView()` also
   sets `resetRouteSeq = routeSeq` (new module-level `let resetRouteSeq = 0;`). `drawRoutes(routes, m, { fit })`
   gets a `fit` option, and `showRoute` calls it with `fit: resetRouteSeq !== seq`, so routes of the
   search that was loading during the press are drawn and listed without `fitBounds`. Any later
   `showRoute` (new destination or mode change) increments `routeSeq`, so its routes fit as usual.
   A press after the routes are drawn sets the same value harmlessly (the fit already happened).
3. **Control** (see [contracts/reset-view-control.md](./contracts/reset-view-control.md)):
   `L.Control.extend({ options: { position: "bottomright" }, onAdd() { … } })` returning
   `<div class="leaflet-bar leaflet-control"><button type="button" class="reset-view" aria-label="Reset view" title="Reset view">⌂</button></div>`
   (icon glyph `aria-hidden`), with `L.DomEvent.disableClickPropagation` and
   `disableScrollPropagation` so presses don't reach the map; `click` → `resetView()`.
4. **Placement**: `L.map("map", { zoomControl: false })`, then `L.control.zoom({ position: "bottomright" }).addTo(map)`
   and then the reset control (Leaflet stacks later bottom controls above earlier ones, so reset sits
   directly above the zoom buttons, all above the attribution). This also fixes the zoom control
   being hidden behind the panel today.
5. **Tests**: `test/view.test.js` covers the helpers per [contracts/view-helpers.md](./contracts/view-helpers.md).
   DOM behavior is validated with [quickstart.md](./quickstart.md) scenarios.
6. **Look** (FR-009): 30×30 px like `.leaflet-bar a`, dark glyph (`#333` or darker) on white for ≥ 3:1 contrast, visible `:focus-visible` outline; `title="Reset view"` gives the hover tooltip; focus stays on the button after a press (native button behavior, nothing moves focus).
7. **README**: add one line mentioning the Reset view button.

## Complexity Tracking

No constitution violations to justify.
