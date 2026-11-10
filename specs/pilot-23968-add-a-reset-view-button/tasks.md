---

description: "Task list for the Reset View Button feature"
---

# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-23968-add-a-reset-view-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reset-view.md, quickstart.md

**Tests**: The spec does not ask for TDD, but plan.md says pure logic in `src/geo.js` is unit-tested with `node --test`. So this list includes unit tests for `startingView()` in `test/view.test.js` (written first) and nothing more. The Leaflet control, keyboard and screen-reader access, layout and "nothing else changes" are checked by hand with quickstart.md. The repo has no DOM test harness, and adding one would break the README's "no dependencies" rule (research.md R6).

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story the task belongs to (US1, US2)
- Every task names its exact file path

## Path Conventions

Static single-page app, flat layout at the repository root: `index.html`, `styles.css`, `src/app.js`, `src/geo.js`, `test/*.test.js`. There is no build step and there are no npm dependencies. Leaflet 1.9.4 is the global `L`, loaded from unpkg in `index.html` (which stays unchanged).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline and settle the one open technical point before changing code

- [ ] T001 Run `npm test` (runs `node --test test/`) from the repo root and confirm the existing suites in test/geo.test.js, test/modes.test.js, test/pleasure.test.js and test/routes.test.js all pass before any change
- [ ] T002 [P] Check the Leaflet 1.9.4 source (`https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.js`, functions `_tryAnimatedZoom`, `setView` and `_stop`) to see whether `map.setView` is dropped or overwritten while `map._animatingZoom` is true (research.md R4, "To verify during implementation"). Write the result as a short comment above `resetView()` in src/app.js when T009 is done. If unpkg cannot be reached, keep the `zoomend` deferral, since it is harmless when not needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The constant and module state that the reset control reads

**⚠️ CRITICAL**: US1 and US2 both need the control. The control needs `LOCATE_ZOOM` and `startView`.

- [ ] T003 In src/app.js, add `const LOCATE_ZOOM = 15;` next to `DEFAULT_VIEW` (line ~21, `const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };`). Replace the literal `15` in `onPosition`'s first-fix branch (`map.setView(latlng, 15);`, line ~73) with `LOCATE_ZOOM`. Leave the `map.setView([place.lat, place.lng], 15)` call in the search/destination code (line ~274) unchanged: it is not the starting view and must never be treated as one (research.md R3)

**Checkpoint**: The app behaves exactly as before (`npm test` passes, the map still opens at the same view)

---

## Phase 3: User Story 1 - Return the map to its starting view (Priority: P1) 🎯 MVP

**Goal**: A "Reset view" button on the map returns it to the starting view. The starting view is the first location fix at zoom 15, or Paris (48.8566, 2.3522) at zoom 13 if no fix was found. Nothing else changes.

**Independent Test**: Run quickstart.md scenarios 1–6 and 10. Open the app once with location allowed and once with it blocked. Pan and zoom away, press "Reset view", and check that the map is back at the starting view, with routes, markers, panel text, mode and selected route unchanged.

### Tests for User Story 1 ⚠️

> Write these first and make sure they FAIL (`startingView` is not exported yet) before T006

- [ ] T004 [P] [US1] Create test/view.test.js (same style as test/geo.test.js: `import test from "node:test"; import assert from "node:assert/strict"; import { startingView } from "../src/geo.js";`). Add the contract examples from contracts/reset-view.md §1 as tests. (a) `startingView({ lat: 45.76, lng: 4.84 }, { lat: 48.8566, lng: 2.3522, zoom: 13 }, 15)` deep-equals `{ lat: 45.76, lng: 4.84, zoom: 15 }`. (b) `null` and `undefined` first fix → `{ lat: 48.8566, lng: 2.3522, zoom: 13 }`. (c) a first fix with `lat: NaN`, `lng: Infinity`, or a missing `lng` → default view. (d) the result is a new object (`notStrictEqual` to `defaultView`), and neither input is mutated (deep-equal before/after on frozen or cloned inputs). (e) extra fields on the first fix (e.g. `accuracy`) are not copied into the result, which has exactly the keys `lat`, `lng`, `zoom`
- [ ] T005 [US1] Run `npm test` and confirm the new tests in test/view.test.js fail because `startingView` is not exported from src/geo.js

- [X] T021 [P] [US1] Contract test for startingView() in test/view.test.js (covers FR-002, FR-002a, contracts/reset-view.md §1, US1 scenarios 3, 4, CHK029)
- [X] T022 [P] [US1] Integration test for returning to the starting view in test/reset-view.integration.test.js (covers FR-002, FR-002a, FR-003b, FR-007, SC-001, US1 scenarios 1, 2, 3, 4, 5, edge cases: press before first fix, location granted later, repeated presses, mid-animation, reduced motion)
- [X] T023 [P] [US1] Integration test for "only the view changes" in test/reset-view.integration.test.js (covers FR-003, FR-003a, FR-005, SC-004, US1 scenario 6)
- [X] T024 [P] [US1] Integration test for the control's placement and markup in test/reset-view.integration.test.js (covers FR-001, FR-006, contracts/reset-view.md §2)
- [X] T025 [P] [US1] AI test: return to the starting view in tests/ai/us1-reset-view.md (covers FR-001, FR-002, FR-002a, FR-003, FR-003a, FR-003b, FR-007, SC-001, SC-002, SC-004, US1 scenarios 1, 2, 3, 4, 5, 6)

### Implementation for User Story 1

- [ ] T006 [US1] In src/geo.js, add and export `startingView(firstFix, defaultView, locateZoom)` per contracts/reset-view.md §1. If `firstFix` is non-null and `Number.isFinite(firstFix.lat) && Number.isFinite(firstFix.lng)`, return `{ lat: firstFix.lat, lng: firstFix.lng, zoom: locateZoom }`. Otherwise return `{ lat: defaultView.lat, lng: defaultView.lng, zoom: defaultView.zoom }`. Always return a new object and never mutate inputs. Add a one-line JSDoc comment. Then run `npm test`: all tests, including test/view.test.js, must pass
- [ ] T007 [US1] In src/app.js, add `startingView` to the existing `import { ... } from "./geo.js"` list at the top. After `DEFAULT_VIEW`/`LOCATE_ZOOM`, add the module state `let startView = startingView(null, DEFAULT_VIEW, LOCATE_ZOOM);` (a copy of `DEFAULT_VIEW`, data-model.md "Initial value")
- [ ] T008 [US1] In src/app.js `onPosition`, inside the existing `if (!centered) { ... }` branch only (the first fix), set `startView = startingView(position, DEFAULT_VIEW, LOCATE_ZOOM);` next to the existing `map.setView(latlng, LOCATE_ZOOM); centered = true;`. Use the same `{ lat, lng }` object the branch already uses for the fix. Do not update `startView` anywhere else, so later fixes, searches, routes and user pan/zoom never change it (FR-002a). Keep the existing jump to the first fix, even if the user has already moved the map or pressed Reset view (FR-003b, CHK016). Any fix counts, whatever its accuracy (CHK029)
- [ ] T009 [US1] In src/app.js, add `function resetView()`. If `map._animatingZoom` is true, call `map.once("zoomend", resetView)` and return. Otherwise call `map.setView([startView.lat, startView.lng], startView.zoom, reduceMotion() ? { animate: false } : undefined)`, where `reduceMotion()` returns `window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true`. Add a short comment explaining the private-field check and T002's finding (research.md R4). The function must do nothing else. It must not call `clearRoutes`, `showRoute`, `selectRoute` or `setStatus`, and must not touch `mode`, `currentPlace`, markers, popups, `routeLayers`, `selectedRoute` or the panel DOM. It must make no screen-reader announcement (FR-003, FR-005, data-model.md "Unchanged state")
- [ ] T010 [US1] In src/app.js, after the map and tile layer are created, define the control with `L.Control.extend({ options: { position: "bottomright" }, onAdd() { ... } })` and add it to the map with `.addTo(map)`. `onAdd` builds `<div class="leaflet-control leaflet-bar reset-view"><button type="button" title="Reset view">Reset view</button></div>` with `L.DomUtil.create`. The button has visible text "Reset view", no icon, and no custom `tabindex`. `onAdd` calls `L.DomEvent.disableClickPropagation(container)` and `L.DomEvent.disableScrollPropagation(container)`, so click, double-click, wheel and drag on the control never pan or zoom the map or select a route (FR-003a). It attaches `button.addEventListener("click", resetView)`, and must not blur the button or move focus afterwards (FR-004). Leaflet stacks bottom-corner controls above existing ones, so the button sits just above the OpenStreetMap attribution (research.md R2, FR-006)
- [ ] T011 [P] [US1] In styles.css, add a base `.reset-view button` rule so the control looks like a Leaflet bar and reads well on the map. Use a white background, `color: #222` text (≥ 4.5:1), `font: inherit` at ~14px, `padding: 0 12px`, `cursor: pointer` and `border: 0`. Leaflet's `.leaflet-bar` provides the container edge and radius. Reset view only changes the view, so routes and markers stay visible next to it. Do not set `display: none` or `disabled` anywhere: the control is never hidden or disabled (FR-001)
- [ ] T012 [US1] Run quickstart.md §3 scenarios 1–6 and 10 in the browser (`npm start`, http://localhost:8000). Fix any mismatch in src/app.js before going on

**Checkpoint**: US1 works on its own. The map returns to the starting view, and the rest of the app state is unchanged.

---

## Phase 4: User Story 2 - Find and use the button with any input method (Priority: P2)

**Goal**: Keyboard, screen-reader and touch users can find the button, understand it and activate it, and the button meets the size, focus and contrast rules.

**Independent Test**: Run quickstart.md scenarios 7, 8, 9, 11 and 12. Tab to the button, activate it with Enter and with Space, and check the visible focus ring. Check that it is announced as button "Reset view". Tap it in 375 px device mode. Measure it at ≥ 44 × 44 px. Check the instant jump under `prefers-reduced-motion: reduce`.

- [X] T026 [P] [US2] Integration test for the native button, accessible name and tab order in test/reset-view.integration.test.js (covers FR-004, FR-005, US2 scenarios 1, 2)
- [X] T027 [P] [US2] AI test: keyboard, screen reader, touch, size, placement and contrast in tests/ai/us2-input-methods.md (covers FR-001, FR-004, FR-004a, FR-005, FR-006, SC-005, US2 scenarios 1, 2, 3)

### Implementation for User Story 2

- [ ] T013 [US2] In styles.css, extend the `.reset-view button` rule with `min-width: 44px; min-height: 44px;` so the touch target is at least 44 × 44 CSS px (FR-004a, CHK009). Add `.reset-view button:hover { background: #f4f4f4; }`
- [ ] T014 [US2] In styles.css, add `.reset-view button:focus-visible { outline: 3px solid #1a73e8; outline-offset: 2px; }` for a clearly visible keyboard focus outline (FR-004a, CHK010). Leave `:focus` alone so mouse clicks show no ring. Check that `#1a73e8` gives ≥ 3:1 against both the white button and typical OSM tiles
- [ ] T015 [US2] In styles.css, make sure the edge of the `.reset-view.leaflet-bar` container meets WCAG 2.1 AA non-text contrast of 3:1 against the map (FR-004a, CHK011). Leaflet's default `border: 2px solid rgba(0,0,0,0.2)` is below 3:1, so override it on `.reset-view.leaflet-bar` with `border: 2px solid #767676`, or another colour that gives ≥ 3:1 against white and light tiles. Also check the label colour from T011 gives ≥ 4.5:1 against the button background
- [ ] T016 [US2] Check the tab order and accessible name by hand in src/app.js and the browser. The button must appear in document order after Leaflet's zoom buttons (the `topleft` corner is created before `bottomright`, so no `tabindex` is needed, CHK006). Dev tools → Accessibility must show role "button" with name "Reset view" (FR-005). Enter and Space must both trigger `resetView` through the native button `click`, with no extra key handlers. If the order is wrong, fix it in src/app.js without adding a custom `tabindex`
- [ ] T017 [US2] Run quickstart.md §3 scenarios 7, 8, 9, 11 and 12. At 375 px and 1280 px wide, check the button is bottom-right, above the attribution, and does not overlap `#panel`, the zoom control or the attribution (FR-006). Fix any problem in styles.css, for example with `margin` on `.reset-view`

**Checkpoint**: US1 and US2 both work. The button can be used with mouse, touch, keyboard and screen reader.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and a final check

- [ ] T018 [P] Add one line to the README.md feature list, in the existing style, saying the map has a "Reset view" button (bottom-right) that returns to your first-found location at zoom 15, or to the default view
- [ ] T019 Review the diff of src/app.js, src/geo.js, styles.css and test/view.test.js. Check that no new dependency, build step or file was added beyond test/view.test.js. Check that `startView` is assigned only in its declaration and in the `if (!centered)` branch (`grep -n "startView =" src/app.js` shows exactly 2 matches). Check that `resetView` only calls `map.setView` or `map.once`
- [ ] T020 Run `npm test` (all suites pass), then run all 12 quickstart.md scenarios once in full, with the browser console open and showing no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T002 only feeds the comment and decision in T009.
- **Foundational (Phase 2)**: T003 depends on T001 (green baseline). It blocks T007–T010.
- **US1 (Phase 3)**: T004 → T005 → T006 → T007 → T008, then T009 (needs T002 and T007) → T010 → T012. T011 can run any time after T003 (different file).
- **US2 (Phase 4)**: Needs the control from T010 (and the base styles from T011) to check against. T013 → T014 → T015 are in the same file, styles.css, so they run one after another. T016 and T017 run after T015.
- **Polish (Phase 5)**: After US1 and US2. T018 can run in parallel with anything.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2. It is the full feature.
- **US2 (P2)**: Builds on the button from US1 (it adds size, focus, contrast and checks). It can be tested on its own once the control exists, but it cannot be built before T010.

### Within Each User Story

- The test (T004) is written and fails before `startingView` is built (T006)
- Pure helper (src/geo.js) → state wiring (src/app.js) → control → styling → manual check

### Parallel Opportunities

- T001 ∥ T002 (test run versus reading Leaflet source)
- T004 (test/view.test.js) ∥ T003 (src/app.js)
- T011 (styles.css) ∥ T006–T010 (src/geo.js, src/app.js)
- T018 (README.md) ∥ any task in Phase 3 or 4
- Most edits touch src/app.js or styles.css, so tasks on the same file stay in order

---

## Parallel Example: User Story 1

```bash
# Different files, no shared dependency:
Task: "T004 [US1] Create test/view.test.js with the startingView contract cases"
Task: "T011 [US1] Base .reset-view button styles in styles.css"
Task: "T018 README.md line about the Reset view button"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001–T002
2. Phase 2: T003
3. Phase 3: T004–T012
4. **STOP and VALIDATE**: quickstart scenarios 1–6 and 10. A native `<button>` already works with the keyboard and screen readers, so the MVP is usable by everyone. US2 brings it fully up to the size, focus and contrast rules.

### Incremental Delivery

1. Setup + Foundational → no visible change, tests still green
2. US1 → working Reset view button (MVP)
3. US2 → 44 px target, focus ring, AA contrast, checked tab order and placement
4. Polish → README line, final full quickstart run

---

## Notes

- [P] tasks touch different files and have no dependencies on incomplete tasks
- Decision (made without asking, since no one can answer here): the tests are limited to `startingView()` unit tests in test/view.test.js. The spec does not request tests, but plan.md and the repo convention test pure logic. The UI is checked by hand with quickstart.md.
- Decision: the `15` in the search/destination code (src/app.js ~line 274) is not replaced with `LOCATE_ZOOM`. It is a different concept, and plan.md only asks to replace the literal in `onPosition`.
- Commit after each phase. Stay on branch `factory/pilot-23968-add-a-reset-view-button`.
