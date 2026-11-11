---

description: "Task list for the Reset View Button feature"
---

# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-7912-add-a-reset-view-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reset-view-control.md, contracts/start-view-helper.md, quickstart.md

**Tests**: Included, and already written by the write-tests gate before implementation. `test/startview.test.js` holds the required unit test cases for `createStartView` from `contracts/start-view-helper.md` (run with `npm test` → `node --test test/`); it fails until T003. The Leaflet/DOM part has no browser test harness (research R7); it is covered by the AI scenarios in `tests/ai/us1-return-to-starting-view.md` and `tests/ai/us2-accessible-reset-control.md`, and by the manual check in `quickstart.md`. The test tasks (recorded as completed `[X]` lines in each story's Tests section) must not be rewritten by the implementer.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Paths are relative to the repository root (static single-page app: `index.html`, `styles.css`, `src/`, `test/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline. No new project, dependency or build step is added (plan: "No build step, no dependencies").

- [ ] T001 Run `npm test` from the repository root and confirm the baseline: every suite in `test/` (geo, modes, pleasure, routes) passes, and `test/startview.test.js` fails only because `createStartView` is not yet exported from `src/geo.js` (expected red: the test was written first). Any other failure is a pre-existing problem to report before changing code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None needed. The only shared piece (the `createStartView` helper) is used only by User Story 1, so it lives in that phase. User Story 2 builds on the control created in User Story 1.

**Checkpoint**: Baseline green → User Story 1 can start.

---

## Phase 3: User Story 1 - Return to the starting view in one click (Priority: P1) 🎯 MVP

**Goal**: A "Reset view" button on the map (bottom-right, above the attribution) moves the map back to the starting view: Paris `{ lat: 48.8566, lng: 2.3522, zoom: 13 }` until the first location fix, then `{ lat, lng, zoom: 15 }` of the first fix, fixed for the rest of the session. Nothing but the map view changes.

**Independent Test**: Load the app, note the starting center/zoom, pan and zoom elsewhere, press "Reset view", and check the map is back at the same zoom and the same center (within 1 screen pixel). Quickstart scenarios A, B, C, D, E, F.

### Tests for User Story 1 ⚠️

> These tests are already written (the `[X]` lines below). Do not recreate or rewrite them. Confirm the unit tests FAIL (`createStartView` is not exported yet) before T003.

- [ ] T002 [US1] Open the existing `test/startview.test.js` (written by the write-tests gate, recorded below as a completed contract-test task) and check that it has one `test(...)` per required case in `contracts/start-view-helper.md` (1–7) and imports `createStartView` from `../src/geo.js`; do **not** recreate or overwrite the file; run `npm test` and confirm these tests fail and every other suite passes

- [X] T015 [US1] Contract test for createStartView (contract cases 1–7 plus repeated get) in test/startview.test.js (covers FR-002, FR-003, FR-004, US1 scenario 1, 2, 4, 5)
- [X] T016 [US1] AI test: reset after panning returns to the first-fix view in tests/ai/us1-return-to-starting-view.md (covers FR-002, FR-003, SC-001, SC-002, US1 scenario 1, 4)
- [X] T017 [US1] AI test: location denied, reset goes to Paris at zoom 13 in tests/ai/us1-return-to-starting-view.md (covers FR-003, US1 scenario 5)
- [X] T018 [US1] AI test: reset at the starting view changes nothing in tests/ai/us1-return-to-starting-view.md (covers FR-001, FR-005, US1 scenario 2)
- [X] T019 [US1] AI test: reset with routes shown changes only the view in tests/ai/us1-return-to-starting-view.md (covers FR-005, SC-003, US1 scenario 3)
- [X] T020 [US1] AI test: search results stay listed after a reset in tests/ai/us1-return-to-starting-view.md (covers FR-005, US1 scenario 3)
- [X] T021 [US1] AI test: later location updates do not move the starting view in tests/ai/us1-return-to-starting-view.md (covers FR-004, Edge case live updates)
- [X] T022 [US1] AI test: location fails after a first fix in tests/ai/us1-return-to-starting-view.md (covers FR-004, Edge case location fails)
- [X] T023 [US1] AI test: reset during route animation and 5 quick presses in tests/ai/us1-return-to-starting-view.md (covers SC-001, Edge cases quick presses / animating)
- [X] T024 [US1] AI test: reset never requests a location fix in tests/ai/us1-return-to-starting-view.md (covers FR-008)
- [X] T025 [US1] AI test: reset before the first fix, then the fix arrives in tests/ai/us1-return-to-starting-view.md (covers FR-003, Edge case reset before location)
- [X] T026 [US1] AI test: user pans before the first fix in tests/ai/us1-return-to-starting-view.md (covers FR-003, Edge case pans before first fix)
- [X] T027 [US1] AI test: destination picked before the first fix in tests/ai/us1-return-to-starting-view.md (covers FR-003, Edge case destination before first fix)
- [X] T028 [US1] AI test: route computation in progress is not cancelled in tests/ai/us1-return-to-starting-view.md (covers FR-005, Edge case computation in progress)
- [X] T029 [US1] AI test: reduced motion, reset jumps with no animation in tests/ai/us1-return-to-starting-view.md (covers FR-010)
- [X] T030 [US1] AI test: placement on desktop and small screens, resize keeps the view in tests/ai/us1-return-to-starting-view.md (covers FR-001, FR-007, Edge cases small screens / resize)

### Implementation for User Story 1

- [ ] T003 [US1] Add and export `createStartView(defaultView)` at the end of `src/geo.js` per `contracts/start-view-helper.md` and `data-model.md`: keep it pure (no DOM, no fetch); validate with a local helper that `lat`, `lng` and `zoom` are each `typeof === "number"` and `Number.isFinite` ("all finite numbers"); throw `TypeError` if `defaultView` is missing or invalid; store a copy `{ lat, lng, zoom }` in internal `view` and `locked = false`; return `{ get() { return { lat: view.lat, lng: view.lng, zoom: view.zoom }; }, setOnce(v) { … } }` where `setOnce` returns `false` and changes nothing if `locked` or if `v` is invalid (an invalid call does **not** set `locked`), otherwise stores a copy of `v`, sets `locked = true` and returns `true`; add a short JSDoc comment; run `npm test` and confirm T002 now passes (depends on T002)
- [ ] T004 [US1] In `src/app.js`, add `createStartView` to the existing `import { … } from "./geo.js"` list (keep the list alphabetical), and right after `const DEFAULT_VIEW = …` (line ~21) add `const startView = createStartView(DEFAULT_VIEW);` (depends on T003)
- [ ] T005 [US1] In `src/app.js` `onPosition`, inside the existing `if (!centered) { map.setView(latlng, 15); centered = true; }` branch, add `startView.setOnce({ lat: position.lat, lng: position.lng, zoom: 15 });` so the first fix's location-centered view becomes the starting view (FR-003) and later live updates, which skip this branch, never change it (FR-004); do not touch any other branch or the `watchPosition` call (depends on T004)
- [ ] T006 [US1] In `src/app.js`, after the tile layer is added to `map` (and after `startView` exists), define `const ResetViewControl = L.Control.extend({ options: { position: "bottomright" }, onAdd() { … } });` where `onAdd` creates `L.DomUtil.create("div", "leaflet-control leaflet-bar reset-view-control")`, appends a native `<button type="button" aria-label="Reset view" title="Reset view">` containing `<span aria-hidden="true">⌂</span>` (build with `document.createElement`/`textContent`, no `innerHTML`), calls `L.DomEvent.disableClickPropagation(container)` and `L.DomEvent.disableScrollPropagation(container)`, and returns the container; then `new ResetViewControl().addTo(map);` — DOM must match `contracts/reset-view-control.md`; the button is always enabled (never set `disabled`) (FR-001, FR-007) (depends on T004)
- [ ] T007 [US1] In `src/app.js`, add a `click` listener on the reset button (inside `onAdd` from T006) that runs `const start = startView.get(); const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; map.setView([start.lat, start.lng], start.zoom, { animate: !reducedMotion });` — read `reducedMotion` at each activation (FR-010); the handler MUST NOT read or write `routeLayers`, `destMarker`, `currentPlace`, `mode`, `results`, `input`, `status`/`setStatus`, `userMarker`, `centered`, `position`, `selectedRoute`, `routeSeq`, `pleasureAbort`, must not call `navigator.geolocation` (FR-008), must not open/close any popup, must not call `.blur()` or move focus (focus stays on the button, FR-006) and must not announce anything (FR-005) (depends on T006)
- [ ] T008 [P] [US1] In `styles.css`, add rules for `.reset-view-control button` so it looks like a Leaflet bar button: `display: block; width: 30px; height: 30px; line-height: 30px; padding: 0; margin: 0; border: none; border-radius: 4px; background: #fff; color: #000; font-size: 18px; text-align: center; cursor: pointer;`, `:hover` and `:active` states with `background: #f4f4f4` (Leaflet's `.leaflet-bar a:hover`; Leaflet has no separate active style, so pressing the button looks like hovering and never shows the browser's default grey button, FR-001), and `.leaflet-touch .reset-view-control button { width: 34px; height: 34px; line-height: 34px; }` for touch devices ("at least 30×30 CSS px (34×34 on touch devices)", FR-009); do not change `#panel` or any existing rule (can run in parallel with T003–T007, different file)
- [ ] T009 [US1] Run quickstart.md scenarios A, B, C, D, E and F in a browser (`npm start`, http://localhost:8000) and confirm: reset returns to first-fix view at zoom 15 (A), Paris at zoom 13 with location blocked (B), no change and no console error at start (C), every FR-005 item unchanged after reset with routes shown (D), first location kept after a simulated move (E), starting view reached with no errors during a route animation and after 5 quick presses (F), each within 1 s (SC-002) (depends on T005, T007, T008)

**Checkpoint**: User Story 1 is fully functional and testable on its own (MVP).

---

## Phase 4: User Story 2 - Accessible reset control (Priority: P2)

**Goal**: Keyboard and screen-reader users can find and activate the control like the other map controls: native button named "Reset view", Enter and Space each reset the view, visible focus indicator with at least 3:1 contrast, focus stays on the button.

**Independent Test**: With the keyboard only, Tab to the control and press Enter, then (after panning again) Space; each resets the view and focus stays on the button with a visible ring. A screen reader or the devtools Accessibility pane reports a "button" named "Reset view". Quickstart scenarios G, H, I.

### Tests for User Story 2

- [X] T031 [US2] AI test: keyboard Enter resets and focus stays on the control in tests/ai/us2-accessible-reset-control.md (covers FR-005, FR-006, US2 scenario 1)
- [X] T032 [US2] AI test: keyboard Space alone also resets in tests/ai/us2-accessible-reset-control.md (covers FR-006, US2 scenario 1)
- [X] T033 [US2] AI test: screen reader name and role in tests/ai/us2-accessible-reset-control.md (covers FR-001, FR-006, US2 scenario 2)
- [X] T034 [US2] AI test: visible focus indicator with at least 3:1 contrast in tests/ai/us2-accessible-reset-control.md (covers FR-009)
- [X] T035 [US2] AI test: touch target size in tests/ai/us2-accessible-reset-control.md (covers FR-009)

### Implementation for User Story 2

- [ ] T010 [P] [US2] In `styles.css`, add a visible keyboard focus indicator: `.reset-view-control button:focus-visible { outline: 2px solid #1a73e8; outline-offset: 2px; }` (`#1a73e8` on white is about 4.5:1, above the required "at least 3:1 contrast for its icon and focus indicator against their background"), and make sure the icon color `#000` on `#fff` is kept (21:1); do not remove the outline on `:focus` for keyboard users (FR-009)
- [ ] T011 [US2] Review the button built in `src/app.js` (T006/T007) against `contracts/reset-view-control.md`: element is a native `<button type="button">` (so Enter and Space work without extra key handlers), `aria-label="Reset view"` and `title="Reset view"` are set, the glyph span has `aria-hidden="true"`, there is no `tabindex` override, no `role` override, no `disabled`, no `keydown` handler, and the click handler does not move focus or write to `#status`; fix anything that differs (FR-006, FR-005) (depends on T007)
- [ ] T012 [US2] Run quickstart.md scenarios G (Tab to control, Enter resets, pan, Space resets, focus ring visible, accessible name "Reset view", role "button"), H (devtools responsive mode at 360×640 and at 320×568 with search results and routes shown: control is bottom-right above the attribution, fully visible, and overlaps neither `#panel` nor the zoom control) and I (with "prefers-reduced-motion: reduce" emulated, reset jumps with no animation) (depends on T010, T011)

**Checkpoint**: User Stories 1 and 2 both work; the control is usable by mouse, touch, keyboard and screen reader.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation across both stories.

- [ ] T013 [P] Update `README.md` to mention the "Reset view" (⌂) map control in the features/usage description: it returns the map to the starting view (your first located position at zoom 15, or Paris at zoom 13 if location is unavailable) without clearing the search or routes
- [ ] T014 Run `npm test` and confirm all tests pass (existing suites plus `test/startview.test.js`), then confirm with `git diff --stat main...HEAD` that only `src/geo.js`, `src/app.js`, `styles.css`, `test/startview.test.js`, `tests/ai/us1-return-to-starting-view.md`, `tests/ai/us2-accessible-reset-control.md`, `README.md` and this feature's `specs/` files changed, and that `index.html` and `package.json` are unchanged (no new dependencies)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Empty; passes straight through after Setup.
- **User Story 1 (Phase 3)**: Depends on Setup.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (it hardens the control US1 creates; the spec says "it builds on Story 1").
- **Polish (Phase 5)**: Depends on US1 and US2.

### Pre-written test tasks

- The completed (`[X]`) test tasks in each story's Tests section were written before implementation by the write-tests gate. Their IDs come after T014 because they were recorded later; they are not a step in the implementation order.
- The unit test (`test/startview.test.js`) is red at T001/T002 and must turn green at T003; it runs again at T014.
- The AI scenarios in `tests/ai/us1-return-to-starting-view.md` run once US1 is done (after T009) and those in `tests/ai/us2-accessible-reset-control.md` once US2 is done (after T012), in the factory's running-tests step. The implementer does not edit them.

### User Story Dependencies

- **US1 (P1)**: Independent. Delivers the whole visible feature.
- **US2 (P2)**: Needs the button from US1 (T006/T007). T010 (CSS) can be written in parallel with US1 work since it only touches `styles.css` selectors for the new control.

### Within User Story 1

- T002 (confirm the pre-written tests fail) → T003 (helper) → T004 (import + instance) → T005 (setOnce at first fix) and T006 (control) → T007 (click handler) → T009 (manual check)
- T008 (CSS) is independent of T003–T007 and only needs to be done before T009.

### Parallel Opportunities

- T008 [US1] (`styles.css`) in parallel with T002–T007 (`test/`, `src/geo.js`, `src/app.js`).
- T010 [US2] (`styles.css`) can follow T008 in the same file while T005–T007 are in progress in `src/app.js`.
- T013 (`README.md`) in parallel with any other task.
- T005 and T006 both edit `src/app.js`, so they are sequential, not [P].

---

## Parallel Example: User Story 1

```bash
# Developer A: tests and logic
Task: "T002 Confirm the existing test/startview.test.js fails (7 contract cases)"
Task: "T003 Export createStartView from src/geo.js"

# Developer B, at the same time: styling
Task: "T008 Add .reset-view-control button styles in styles.css"
```

## Parallel Example: User Story 2

```bash
Task: "T010 Add :focus-visible outline for .reset-view-control button in styles.css"
Task: "T011 Review the reset button markup and handler in src/app.js against the contract"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 baseline.
2. T002–T009: confirm red tests, helper, wiring at first fix, control, click handler, base styles, manual check.
3. **STOP and VALIDATE**: quickstart A–F. A native `<button>` already gives basic keyboard use at this point.

### Incremental Delivery

1. US1 → working reset button (MVP).
2. US2 → focus indicator, accessibility review, small-screen and reduced-motion checks.
3. Polish → README and final test run.

---

## Notes

- Decisions made without asking (factory mode): tests are included because the helper contract lists required test cases; Phase 2 is left empty because the only shared code serves just US1; hover color `#f4f4f4` and focus color `#1a73e8` (the app's existing selected-route blue) were chosen to match Leaflet and the app.
- [P] tasks = different files, no dependencies on incomplete tasks.
- Commit after each task or logical group.
