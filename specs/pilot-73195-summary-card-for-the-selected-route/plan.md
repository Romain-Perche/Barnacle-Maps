# Implementation Plan: Summary Card for the Selected Route

**Branch**: `factory/pilot-73195-summary-card-for-the-selected-route` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-73195-summary-card-for-the-selected-route/spec.md`

## Summary

Show a one-line bar (Design A) centered at the bottom of the map with the selected route's travel mode ("Walk" or "Car", grey), duration, distance and "Arrive <time>" (clarification 2026-11-13: Pilot asked for the travel mode). Formatting and arrival-time math go in pure, unit-tested helpers in `src/geo.js` (`arrivalInfo`, `formatArrival`, `routeSummary`, which also returns the mode label from `TRAVEL_MODES`). Distance and duration reuse the panel's `formatDistance` / `formatDuration`, and arrival is computed from the *displayed* (rounded) minutes so the figures always match. `src/app.js` remembers the mode the drawn routes were computed for (`drawnMode`, set in `drawRoutes`), renders the bar from `selectRoute()`, hides it in `clearRoutes()` (which already runs on every new request, failure and empty result), and refreshes it on each minute boundary while it is visible. The bar is a static `#route-card` element placed next to `#map`, with a separate visually hidden polite live region that announces only selection changes, not the minute ticks.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node ≥ 20 for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN, already used); `Intl.DateTimeFormat` (built-in). No new dependencies.

**Storage**: N/A

**Testing**: `node --test test/` (node:test + node:assert, mock timers). The tests are written before the code (by /write-tests):
  - contract tests for the helpers (`test/summary.test.js`) and for the markup/CSS (`test/route-card-ui.test.js`)
  - integration tests that drive the real `src/app.js` + `index.html` through a dependency-free fake browser (`test/helpers/fake-browser.js`: tiny DOM parsed from index.html, fake Leaflet, scripted fetch and geolocation) in `test/route-card.integration.test.js`
  - AI scenarios for headless Playwright in `tests/ai/`

**Target Platform**: Modern desktop and mobile browsers

**Project Type**: Static single-page web app (no build step)

**Performance Goals**: Card update on selection < 100 ms (SC-002). It's a synchronous text update, effectively instant.

**Constraints**: `src/geo.js` must stay DOM-free (test L6 forbids the strings `document`, `window`, `fetch(`). No package dependencies (L8). Existing tests must keep passing.

**Scale/Scope**: 1 HTML element (4 parts), 1 sr-only element, ~40 lines in app.js, ~40 lines in geo.js, ~20 lines of CSS. The 3 test files + 1 test helper are already written.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so it defines no ratified principles or gates. **Gate result: PASS (nothing to check).** As a substitute, the plan follows the conventions the repo already enforces through its tests:

| De facto rule | Source | Status |
|---|---|---|
| No dependencies / no build step | README, test L8 | ✅ Uses only `Intl` and existing Leaflet |
| Pure logic in `geo.js`, DOM in `app.js` | test L6, existing layout | ✅ New helpers are pure and take `now` as a parameter |
| Logic covered by `node --test` | test/ | ✅ `test/summary.test.js`, `test/route-card-ui.test.js`, `test/route-card.integration.test.js` (written first, failing until implemented) |
| Simplicity | codebase style | ✅ No framework, no Leaflet control class, one timer |

Post-design re-check: **PASS**, and the design adds no violations.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-73195-summary-card-for-the-selected-route/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── geo-summary-api.md   # pure helper signatures + examples
│   └── route-card-ui.md     # DOM/CSS/a11y/behaviour contract of the bar
├── design-options.html  # from /speckit-specify (Design A chosen)
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)

tests/ai/                # AI scenarios (written by /write-tests)
├── README.md            # shared Playwright setup + network stubs
├── fixtures/            # OSRM fixture responses
├── us1-see-route-figures.md
├── us2-card-follows-selection.md
└── us3-accurate-and-out-of-the-way.md
```

### Source Code (repository root)

```text
index.html          # + <div id="route-card" hidden> and <p id="route-card-live" class="sr-only" aria-live="polite">
styles.css          # + #route-card (Design A) and .sr-only
src/
├── geo.js          # + arrivalInfo, formatArrival, routeSummary (pure)
└── app.js          # + renderCard/hideCard/minute timer; hooks in selectRoute, clearRoutes, drawRoutes (fitBounds padding)
test/               # already written by /write-tests; the implementation must make them pass
├── summary.test.js                  # contract tests: geo helpers
├── route-card-ui.test.js            # contract tests: markup + Design A CSS
├── route-card.integration.test.js   # integration tests: app.js behaviour (US1–US3)
└── helpers/fake-browser.js          # test-only fake DOM/Leaflet/fetch (not a dependency)
README.md           # + one line describing the card
```

**Structure Decision**: Keep the existing single-project layout: pure logic in `src/geo.js`, DOM wiring in `src/app.js`, tests in `test/`. No new modules or folders.

## Implementation Outline

1. **geo.js**: add `arrivalInfo(now, seconds)` → `{ time: Date, dayOffset }` using displayed minutes `max(1, round(s/60))`, and `formatArrival(now, seconds, locale?)` → `"14:35"`, `"2:35 PM"`, or `"00:20 +1 day"`. Add `routeSummary(route, now, locale?, mode?)` → `{ mode, duration, distance, arrival }`, where `mode` is `TRAVEL_MODES[mode].label` (`"Walk"`/`"Car"`, foot when unknown or missing, like `routeUrl`). See [contracts/geo-summary-api.md](./contracts/geo-summary-api.md).
2. **index.html**: add `#route-card` with `.rc-mode`, `.rc-duration`, `.rc-distance`, `.rc-arrival` in that order (sibling after `#map`, before `#panel`) and the sr-only live region. See [contracts/route-card-ui.md](./contracts/route-card-ui.md).
3. **styles.css**: style the Design A bar: absolute, `left:50%` + `translateX(-50%)`, `bottom: 28px` (above the attribution), `z-index:1000`, `max-width: calc(100% - 24px)`, `flex-wrap: wrap` with `white-space: nowrap` per item, so figures never get truncated. `.rc-mode` is grey (`#666`, the panel's secondary text colour) so the blue duration stays the strongest item. Also add the `.sr-only` utility.
4. **app.js**:
   - `drawRoutes(routes, m)` sets `drawnMode = m` before `selectRoute(0)`. The mode radio is not read, so the bar never shows a mode whose routes are still loading (FR-012).
   - `renderCard()`: if `routeLayers[selectedRoute]` exists, fill the four parts from `routeSummary(route, new Date(), undefined, drawnMode)`, unhide, and (re)arm the minute timer. Otherwise call `hideCard()`.
   - `selectRoute(i)` calls `renderCard()` and writes the announcement `Route N, <Mode>: <duration>, <distance>, arrive <time>` to `#route-card-live` (selection changes only).
   - `clearRoutes()` calls `hideCard()` (hide, clear the timer, clear the live text).
   - Minute timer: `setTimeout` until the next wall-clock minute boundary, then `renderCard()` re-arms it. The tick doesn't touch the live region.
   - `drawRoutes()`: `selectRoute(0)` already runs before `fitBounds`. Change the padding to `{ paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + card height + 28] }` so the bar never hides the start or destination.
5. **Tests**: they already exist and fail (written by /write-tests). The implementation is done when `npm test` is fully green. Do not weaken the tests. The integration tests depend on the exact ids and classes in contracts/route-card-ui.md (`#route-card`, `.rc-mode`, `.rc-duration`, `.rc-distance`, `.rc-arrival`, `#route-card-live`), on `selectRoute`/`clearRoutes` being the hook points, and on `setTimeout`/`setInterval`/`Date` (mocked in tests) for the minute refresh.
6. **README.md**: add one line about the summary bar.

## Complexity Tracking

No violations. Nothing to justify.
