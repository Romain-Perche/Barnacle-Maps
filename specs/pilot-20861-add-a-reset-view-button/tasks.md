---

description: "Task list for Reset View Button"
---

# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-20861-add-a-reset-view-button/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md
**Tests**: No automated test tasks (no browser harness; spec does not request them). Existing `npm test` must keep passing; behavior is verified manually per quickstart.md.
**Organization**: Grouped by user story. All source changes are in `src/app.js` and `styles.css` (same files, so tasks are sequential, not [P]).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Run `npm test` at repo root to record the baseline (all existing tests pass) before changes

## Phase 2: Foundational (blocking)

- [ ] T002 In `src/app.js`, add constant `INITIAL_LOCATION_ZOOM = 15` near `DEFAULT_VIEW` (line ~21) and use it in `onPosition`'s `map.setView(latlng, 15)` (line ~73). Leave the search-selection `map.setView(..., 15)` (line ~274) untouched.
- [ ] T003 In `src/app.js`, add module-level `let startingView = { center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], zoom: DEFAULT_VIEW.zoom };` (data-model.md StartingView; initialized to default view; not persisted) next to `let centered = false;` (line ~50)
- [ ] T004 In `src/app.js`, inside the existing `if (!centered)` block in `onPosition`, set `startingView = { center: latlng, zoom: INITIAL_LOCATION_ZOOM }` alongside the `setView`/`centered = true`. Replaced exactly once (first fix of any accuracy); never updated by later fixes, panning, or search selection (FR-003, FR-004, FR-009)

**Checkpoint**: starting view is captured; no UI yet.

## Phase 3: User Story 1 - Return the map to its starting view (P1) 🎯 MVP

**Goal**: A top-right "Reset view" button returns the map to the starting center and zoom.
**Independent Test**: Quickstart steps 2–5 and 7: pan/zoom away, press button, map returns to starting view; search/routes/destination/mode unchanged.

- [X] T012 [US1] Contract test for the Reset view control (top-right, native button, aria-label/title "Reset view", click propagation disabled, always enabled) in test/reset-view.test.js (covers FR-001, FR-006, FR-007, FR-008, ui-contract)
- [X] T013 [US1] Integration test for starting view and reset (default view, first fix at zoom 15, fixed after later fixes, late permission, search selection never changes it, only map.setView is called, repeated presses) in test/reset-view.test.js with harness test/helpers/app-harness.js (covers FR-002, FR-003, FR-004, FR-005, FR-009, SC-001, US1 scenario 1, 2, 4)
- [X] T014 [US1] AI test: reset the map view (default view, first position, state untouched, repeated presses, layout and size) in tests/ai/us1-reset-map-view.md (covers FR-001-FR-005, FR-007-FR-009, SC-001-SC-003, US1 scenario 1, 2, 3, 4)
- [ ] T005 [US1] In `src/app.js` after the map is created, add a custom `L.Control` with `position: "topright"` whose `onAdd` returns a `div.leaflet-bar.leaflet-control` containing `<button type="button" class="reset-view-btn" aria-label="Reset view" title="Reset view">` with an icon glyph (no visible text), per contracts/ui-contract.md; add the control with `.addTo(map)`
- [ ] T006 [US1] In the control's `onAdd` in `src/app.js`, call `L.DomEvent.disableClickPropagation(container)` and attach a click handler that calls only `map.setView(startingView.center, startingView.zoom)` (animation ≤ 1s; last press wins; no other state read or written — FR-005)
- [ ] T007 [US1] In `styles.css`, style `.reset-view-btn` to match Leaflet zoom controls: at least 30x30 CSS px (34px on touch via `@media (pointer: coarse)`), hover/active styles like `.leaflet-bar a`, always visible/enabled, keep the default focus outline (FR-008)
- [ ] T008 [US1] In `styles.css`/`src/app.js` verify and adjust placement so the topright control does not overlap `#panel` (top-left), the zoom control, or attribution (bottom-right) at widths from 320px up (FR-007)

**Checkpoint**: US1 fully functional and testable.

## Phase 4: User Story 2 - Keyboard and assistive technology (P2)

**Goal**: Button is focusable, operable with Enter/Space, and announced as "Reset view".
**Independent Test**: Quickstart step 6.

- [X] T015 [US2] AI test: keyboard and assistive technology use in tests/ai/us2-keyboard-assistive.md (covers FR-006, SC-004, US2 scenario 1, 2)
- [ ] T009 [US2] In `src/app.js`/`styles.css`, confirm the button is a native `<button>` (tab-focusable, Enter/Space activate), has `aria-label="Reset view"`, and that no CSS removes the default focus outline (`outline: none` must not be applied) (FR-006)

## Phase 5: Polish & Cross-Cutting

- [ ] T010 Run `npm test` and confirm all existing tests still pass
- [ ] T011 Walk through all steps of `specs/pilot-20861-add-a-reset-view-button/quickstart.md` (default view, first-position view, late permission, state untouched, keyboard, layout at 320px/desktop, rapid presses) and fix any deviation

## Dependencies & Execution Order

- Phase 1 → Phase 2 (T002 → T003 → T004) → US1 (T005 → T006 → T007 → T008) → US2 (T009) → Polish (T010, T011).
- US2 depends on the button from US1 (T005); both edit the same files, so no [P] tasks.

## Parallel Opportunities

None meaningful: all tasks touch `src/app.js` or `styles.css` and build on each other. T007 (CSS) may be done in parallel with T006 by a second person if desired.

## Implementation Strategy

MVP = Phases 1–3 (US1). Then US2 verification, then polish. Stop and validate after each checkpoint.
