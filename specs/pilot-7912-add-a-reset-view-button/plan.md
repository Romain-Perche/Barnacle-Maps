# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-7912-add-a-reset-view-button` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pilot-7912-add-a-reset-view-button/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a "Reset view" button on the Leaflet map. Pressing it puts the map back to the **starting view**: Paris at zoom 13 until the first location fix, then the location-centered view (zoom 15) that the app already sets at that first fix. After that the starting view never changes. The reset changes only the map view, never the search, routes, mode or markers.

Approach (details in [research.md](./research.md)):

- A small pure helper `createStartView(defaultView)` in `src/geo.js` holds the starting view and only lets it be set once (`get()` / `setOnce(view)`). It is unit tested with `node --test`, like the other helpers.
- `src/app.js` creates it with `DEFAULT_VIEW` and calls `setOnce({ lat, lng, zoom: 15 })` in `onPosition` in the same `!centered` branch that already centers the map at the first fix.
- A custom `L.Control` (`position: "bottomright"`, stacked above the attribution) renders a native `<button type="button" aria-label="Reset view" title="Reset view">` inside a `leaflet-bar`. On click it calls `map.setView([lat, lng], zoom)` with the stored starting view. Click and scroll propagation to the map is disabled.
- A few CSS rules in `styles.css` make the button match the Leaflet bar buttons (size, focus ring).

## Technical Context

**Language/Version**: JavaScript (ES modules), runs in the browser directly; Node.js (any version with `node:test`, ≥18) for tests

**Primary Dependencies**: Leaflet 1.9.4 (loaded from unpkg in `index.html`); no npm dependencies, no build step

**Storage**: N/A (the starting view lives in memory and is set again on each visit)

**Testing**: `npm test` → `node --test test/` for the pure helpers in `src/geo.js`; manual browser check for the DOM/Leaflet part (see [quickstart.md](./quickstart.md))

**Target Platform**: Modern desktop and mobile browsers; served by `python3 -m http.server` on localhost

**Project Type**: Static single-page web app (no backend)

**Performance Goals**: Map reaches the starting view in ≤ 1 s after activation (SC-002); Leaflet's default `setView` animation takes about 0.25 s

**Constraints**: No new dependencies or build step; reset must not touch any state other than the view (FR-005); control must not overlap `#panel` or the zoom control (FR-007)

**Scale/Scope**: One new control, one pure helper with tests, about 40 lines in total in `src/app.js`, `src/geo.js` and `styles.css`

No item is left as NEEDS CLARIFICATION. The spec's only open question (which view to reset to) was settled in its Clarifications section.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled Spec Kit template: it has placeholders only and no ratified principles. So there are no constitution gates to check. **Result: PASS (no gates defined).**

In place of constitution rules, the plan follows the repository's own conventions, taken from `README.md` and the code:

| Convention | How the plan follows it |
|------------|-------------------------|
| No build step, no dependencies | Uses only Leaflet, which is already loaded; adds no packages |
| Pure, DOM-free helpers live in `src/geo.js` and are unit tested | Starting-view logic goes in `createStartView` in `geo.js`, with tests in `test/startview.test.js` |
| Accessible controls (aria labels, native buttons, as in the route list) | Native `<button>` with `aria-label="Reset view"` |
| UI text in English | Label "Reset view" |

**Post-design re-check (after Phase 1)**: still PASS. The design adds no dependencies, no storage and no new project.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-7912-add-a-reset-view-button/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   ├── reset-view-control.md   # UI contract for the map control
│   └── start-view-helper.md    # API contract for createStartView in src/geo.js
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html            # unchanged (the control is created from JS)
styles.css            # + styles for .reset-view-control button (size, icon, focus-visible ring)
src/
├── app.js            # + startView instance; setOnce at first fix in onPosition; ResetViewControl added to map
└── geo.js            # + export createStartView(defaultView)
test/
└── startview.test.js # new: unit tests for createStartView
```

**Structure Decision**: Keep the current single static app layout. Logic that can be tested without a DOM goes in `src/geo.js` with a `node:test` file in `test/`. Leaflet/DOM wiring stays in `src/app.js`. No new directories.

## Complexity Tracking

No constitution violations to justify.
