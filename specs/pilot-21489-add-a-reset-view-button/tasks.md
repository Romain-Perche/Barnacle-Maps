# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-21489-add-a-reset-view-button/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md
**Tests**: Unit tests only for the pure helper `src/view.js` (per plan.md); UI verified manually via quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Confirm baseline: run `npm test` from repo root and note that existing tests in `test/` pass; no new dependencies are to be added (package.json unchanged)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The DOM-free start-view state that both stories rely on.

- [ ] T002 Create `src/view.js` exporting `createStartView(defaultView)` returning `{ get(), settle({lat, lng, zoom}) }` per contracts/ui-contract.md: `get()` returns a copy `{lat, lng, zoom}` of the current view (initially the default view); the first `settle()` call replaces the view and returns `true`; later calls are no-ops returning `false`; nothing persisted
- [ ] T003 [P] Create `test/view.test.js` (node:test + node:assert/strict, ES imports like `test/geo.test.js`) covering: initial `get()` equals default (48.8566, 2.3522, zoom 13); first `settle()` returns true and `get()` returns the new view; second `settle()` returns false and leaves view unchanged; `get()` returns a copy (mutating it does not alter state); the default passed in is not mutated. Run `npm test`

**Checkpoint**: `npm test` passes including `test/view.test.js`.

---

## Phase 3: User Story 1 - Return the map to its starting view (Priority: P1) 🎯 MVP

**Goal**: A "Reset view" button on the map returns the map to the start-up view and changes nothing else.

**Independent Test**: quickstart.md steps 2–6 (pan/zoom away, press button, map returns to start view; search/routes/mode/status unchanged; no new requests).

- [X] T013 [US1] Unit test for the start-view helper (set-once, default, copies) in test/view.test.js (covers FR-004, FR-005, FR-010, US1 scenario 1, 2, 4)
- [X] T014 [US1] AI test: return to the starting view, state preserved, mid-animation in tests/ai/us1-return-to-starting-view.md (covers FR-001, FR-003, FR-004, FR-005, FR-006, FR-009, FR-010, US1 scenario 1, 2, 3, 4, 5)
- [ ] T004 [US1] In `src/app.js`, import `createStartView` from `./view.js` and create `const startView = createStartView(DEFAULT_VIEW);` after `DEFAULT_VIEW` (line ~21)
- [ ] T005 [US1] In `src/app.js` `onPosition` (inside `if (!centered)` block, line ~72, next to `map.setView(latlng, 15)`), call `startView.settle({ lat: latlng.lat, lng: latlng.lng, zoom: 15 })` using the same values passed to `setView`; do not filter by accuracy; do not call it anywhere else (the search `setView` at line ~274 must not settle it)
- [ ] T006 [US1] In `src/app.js`, add a Leaflet `L.Control` at position `topright` whose container holds `<button type="button">` with visible text "Reset view", `aria-label="Reset view"`, `title="Reset view"`; apply `L.DomEvent.disableClickPropagation` (and scroll propagation) on the container; on click call only `const v = startView.get(); map.setView([v.lat, v.lng], v.zoom);` — no other state, requests, status or popup changes; add the control with `.addTo(map)`
- [ ] T007 [P] [US1] In `styles.css`, style the control button like other Leaflet controls (white background, border like `.leaflet-bar`, padding), with hover/active states, min-height 44px, text contrast ≥ 4.5:1; ensure it does not overlap the panel, zoom controls or attribution at 320 px width
- [ ] T008 [US1] Manually verify quickstart.md steps 3–6 and 8 (location denied, location allowed + later movement, preserved state/no network requests, mid-animation reset within 1 s, 360 px width); fix any deviation in `src/app.js` / `styles.css`

**Checkpoint**: US1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Keyboard and assistive technology (Priority: P2)

**Goal**: Button is focusable, visibly focused, activatable with Enter/Space, announced as "Reset view, button".

**Independent Test**: quickstart.md step 7.

- [X] T015 [US2] AI test: keyboard, focus, accessible name, touch target in tests/ai/us2-keyboard-and-assistive-tech.md (covers FR-002, FR-007, FR-008, US2 scenario 1, 2, 3)
- [ ] T009 [P] [US2] In `styles.css`, add a `:focus-visible` rule for the Reset view button with a visible focus ring (≥ 3:1 contrast against adjacent colours)
- [ ] T010 [US2] Verify in `src/app.js` that the control uses a native `<button type="button">` (Enter/Space work, tab order follows page order, no `tabindex` override) and is announced as "Reset view"; verify quickstart.md step 7 manually

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T011 [P] Add a short "Reset view" mention to `README.md` features/usage if it lists map controls
- [ ] T012 Run `npm test` and the full quickstart.md checklist (steps 1–8) as final validation

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (T002 before T003 can pass) → US1 (T004 → T005, T006 → T008) → US2 (T009, T010 depend on T006/T007) → Polish.
- T004, T005, T006 all edit `src/app.js`: sequential. T007 and T009 edit `styles.css`: do T007 first or in one pass.
- US2 builds on the button created in US1 (same control), so it follows US1.

## Parallel Example

```text
After T002: T003 (test/view.test.js) in parallel with T004–T006 (src/app.js)
T007 (styles.css) in parallel with T006 (src/app.js)
```

## Implementation Strategy

- **MVP**: Phases 1–3 (US1): working button returning to the start view.
- Then add US2 focus styling/verification, then polish.
