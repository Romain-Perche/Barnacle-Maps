---

description: "Task list for the Reset View Button feature"
---

# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-15946-add-a-reset-view-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/start-view.md, contracts/reset-view-control.md, quickstart.md

**Tests**: Requested, and already written by `/write-tests` (plan.md §Testing): a unit test (`test/view.test.js`), a contract test and three integration tests that load the real `src/app.js` through the fake browser in `test/support/fake-browser.js`, and three AI scenario files in `tests/ai/`. They fail until the code exists. The implementation must make them pass without rewriting them. Real layout, animation and screen readers are also checked by hand with quickstart.md.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task names its exact file path

## Path Conventions

Single static project at the repository root: `index.html`, `styles.css`, `src/`, `test/`. There is no build step and there are no new dependencies. Leaflet 1.9.4 is the global `window.L` from the CDN. Tests run with `npm test` (`node --test test/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before changing anything

- [ ] T001 From the repo root, run only the four original test files: `node --test test/geo.test.js test/modes.test.js test/pleasure.test.js test/routes.test.js`, and confirm they all pass, so later failures can be attributed to this feature (no file changes). Do not use `npm test` here: it also runs the new feature tests (`test/view.test.js`, `test/reset-view-control.test.js`, `test/reset-view.us1/us2/us3.integration.test.js`), which are expected to fail until they are implemented

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The StartView module that records the starting view (FR-003, FR-004, FR-019). The reset button (US1) reads it, and US2/US3 build on the button.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for StartView (write first, confirm they FAIL) ⚠️

- [X] T002 `test/view.test.js` already exists (written by `/write-tests`, recorded as T022 below) with the required cases from contracts/start-view.md, including the range checks (lat −90..90, lng −180..180, zoom 0..19). Review it against the contract; do not rewrite it
- [X] T022 Unit test for the StartView module in test/view.test.js (covers FR-003, FR-004, FR-019, US1 scenario 1, 2; contracts/start-view.md cases 1–6)
- [ ] T003 Run `node --test test/view.test.js` and confirm it fails because `src/view.js` does not exist yet (depends on T002)

### Implementation for StartView

- [ ] T004 [P] Create `src/view.js` as an ES module with no DOM or Leaflet dependency, exporting `createStartView(defaultView)` per contracts/start-view.md. Use a private validator that throws `TypeError` unless every value is a finite number with "lat −90..90", "lng −180..180" and "zoom 0..19" (inclusive bounds; 0..19 is the tile layer's `maxZoom`, data-model.md). Validate `defaultView` in `createStartView`. The returned object has a getter `current` that returns a fresh copy `{ lat, lng, zoom }` on every read, a getter `settled` (`false` until the first successful `settle`, then `true` for good), and `settle(lat, lng, zoom)`. `settle` validates all three arguments first (throwing `TypeError` and changing nothing on bad input); if not yet settled it stores the view, sets `settled = true` and returns `true`; otherwise it returns `false` and changes nothing. Target about 25 lines of code
- [ ] T005 Run `node --test test/view.test.js test/geo.test.js test/modes.test.js test/pleasure.test.js test/routes.test.js` and confirm they all pass (depends on T002, T004)
- [ ] T006 In `src/app.js`, add `import { createStartView } from "./view.js";`, create `const startView = createStartView(DEFAULT_VIEW);` in module scope right after `DEFAULT_VIEW` is declared (module scope keeps it across a bfcache restore, research.md R8), delete `let centered = false;`, and in `onPosition` replace the `if (!centered) { map.setView(latlng, 15); centered = true; }` block with `if (startView.settle(position.lat, position.lng, 15)) map.setView(latlng, 15);`. Leave every other behavior of `onPosition` unchanged (marker creation and update, auto-center on the first fix even if the user already moved the map, R9) (depends on T004)

**Checkpoint**: The starting view is recorded (default view, replaced once by the first location fix at zoom 15). The app behaves exactly as before, since nothing reads it yet.

---

## Phase 3: User Story 1 - Return the map to its starting view (Priority: P1) 🎯 MVP

**Goal**: A "Reset view" button in the map's bottom-right corner returns the map to the starting view, in under 1 s, from any panned or zoomed state.

**Independent Test**: Load the app, pan and zoom away, press the button, and confirm the map is back at the starting center and zoom: central Paris at zoom 13 with location denied, or the first location fix at zoom 15 with location allowed (quickstart A, B, C, D).

### Tests for User Story 1 (written by /write-tests) ⚠️

- [X] T023 [US1] Integration test for resetting to the starting view in test/reset-view.us1.integration.test.js (covers FR-002, FR-003, FR-004, FR-010, FR-015, FR-018, SC-001, SC-002, US1 scenario 1, 2, 3)
- [X] T024 [US1] AI test: return to the starting view in tests/ai/us1-return-to-starting-view.md (covers FR-001, FR-002, FR-003, FR-004, FR-010, FR-014, FR-015, SC-001, SC-002, US1 scenario 1, 2, 3)

### Implementation for User Story 1

- [ ] T007 [US1] In `src/app.js`, after the tile layer is added, define `const ResetViewControl = L.Control.extend({ options: { position: "bottomright" }, onAdd() { … } });`. `onAdd` creates `div.leaflet-control.leaflet-bar.reset-view-control` with `L.DomUtil.create`. Inside it goes a native `<button type="button" class="reset-view" aria-label="Reset view" title="Reset view">` containing an inline SVG circular arrow (⟲): `aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"` with an open-arc path plus an arrowhead (no text glyph, FR-001). Call `L.DomEvent.disableClickPropagation(container)` and `L.DomEvent.disableScrollPropagation(container)` so clicks, double-clicks/taps, mouse-wheel, `mousedown`, `touchstart` and `contextmenu` on the button never pan or zoom the map (FR-002). The button itself MUST be a real DOM element created with `L.DomUtil.create("button", "reset-view", container)` or `document.createElement` (the test harness throws if "Reset view" exists only as an `innerHTML` string); only the SVG inside it may be set with `innerHTML`. `onAdd` returns the container. Then `new ResetViewControl().addTo(map);` once at startup, never removed or hidden (FR-001, FR-010; never `disabled`) (depends on T006)
- [ ] T008 [US1] In `src/app.js`, add a `resetView()` function and attach it as the button's `click` listener in `onAdd` (a native button fires `click` for mouse, tap, Enter and Space). Its body is exactly the contracts/reset-view-control.md §Behavior pseudo-code: `try { const v = startView.current; const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; map.setView([v.lat, v.lng], v.zoom, { animate: !reduce }); } catch (err) { console.error(err); }`. Read `matchMedia` at press time (FR-015). Use `setView`, not `flyTo` (SC-001); `setView` stops a running pan/zoom/inertia (FR-014). The handler must not move focus, touch any other state, or call `fitBounds` (FR-005, FR-006, FR-018) (depends on T007)
- [ ] T009 [P] [US1] In `styles.css`, add control styles per contracts/reset-view-control.md §Styling: `.reset-view { display: block; width: 44px; height: 44px; padding: 0; margin: 0; border: 0; background: #fff; color: #000; cursor: pointer; }` (FR-011; the `leaflet-bar` supplies Leaflet 1.9.4's "border 2px solid rgba(0,0,0,0.2), corner radius 4px", FR-009), center the SVG at 22×22 px (e.g. `.reset-view svg { display: block; margin: auto; width: 22px; height: 22px; }`), and `.reset-view:hover { background: #f4f4f4; }`. Add no `:active` rule and no disabled style (FR-009, FR-010). Set `border-radius: 4px` on the button too, matching the radius of the `leaflet-bar` container, so its corners don't poke out
- [ ] T010 [US1] In `styles.css`, cap the panel so the bottom 96px of the map stays free for the button (FR-012, research.md R3b): add `max-height: calc(100% - 108px); overflow-y: auto; box-sizing: border-box;` to the existing `#panel` rule (108px = 12px top offset + 96px free strip). Change nothing else about the panel
- [ ] T011 [US1] First run `node --test test/view.test.js test/reset-view.us1.integration.test.js` and confirm both pass, and run `node --test test/reset-view-control.test.js` and confirm every test passes except the `:focus-visible` and forced-colors ones (those come with T014/T015). Then run `npm start` and check quickstart.md scenarios A (location denied → central Paris, zoom 13), A2 (no console errors over several presses), B (location allowed → first fix at zoom 15), C (repeated presses at the starting view change nothing), D (a changed simulated location still resets to the *first* fix, while the blue marker follows the new location), M (double-click and wheel over the button never zoom the map) and O (reduced motion → instant jump). Also check the SC-001 timing (click to `moveend` < 1 s in Chrome with 4× CPU throttling) and SC-002 (zoom equal, center within 0.000001°), using a temporary `console.log(map.getCenter(), map.getZoom())` in `resetView()` in `src/app.js`. Remove the log before committing (depends on T008, T009, T010)

**Checkpoint**: User Story 1 is fully functional and testable on its own. This is the MVP.

---

## Phase 4: User Story 2 - Reset the view without losing work (Priority: P2)

**Goal**: A reset changes only the map center and zoom. Search input and results, routes, the selected route, travel mode, status text, both markers and open popups are untouched, and route requests in flight still load and fit.

**Independent Test**: Search for a destination, show routes, select Route 2, switch the mode, zoom in, press Reset view, and confirm everything except the view is unchanged (quickstart E, K, L).

### Tests for User Story 2 (written by /write-tests) ⚠️

- [X] T025 [US2] Integration test for a non-destructive reset in test/reset-view.us2.integration.test.js (covers FR-005, FR-014, SC-003, US2 scenario 1, 2)
- [X] T026 [US2] AI test: reset without losing work in tests/ai/us2-reset-without-losing-work.md (covers FR-004, FR-005, FR-014, SC-003, US2 scenario 1, 2)

### Implementation for User Story 2

- [ ] T012 [US2] Review `resetView()` and the control's `onAdd` in `src/app.js` against FR-005 and research.md R5: confirm they never read or write `routeLayers`, `selectedRoute`, `mode`, `currentPlace`, `results`, `input`, `status`/`setStatus`, `userMarker`, `destMarker`, `routeSeq` or `pleasureAbort`, never call `fitBounds`, `closePopup` or `clearRoutes`, and never abort a `fetch`. Remove anything that does (depends on T008)
- [ ] T013 [US2] First run `node --test test/reset-view.us2.integration.test.js` and confirm it passes. Then run `npm start` and check quickstart.md scenarios E (search "Louvre", pick it, wait for routes, select Route 2, switch to Car, zoom in, reset: only the view changes and the starting view is still the one from A/B; this is SC-003, with no route request in flight), K (the destination popup stays open and the status text is unchanged after a reset) and L (a reset during a drag-inertia glide stops it and ends at the starting view; a reset before routes arrive doesn't cancel them and the later `fitBounds` still runs, FR-014). Record any defect against `src/app.js` (depends on T012)

**Checkpoint**: User Stories 1 and 2 both work on their own.

---

## Phase 5: User Story 3 - Accessible and discoverable control (Priority: P3)

**Goal**: Keyboard and screen reader users can find and activate the button. It shows a visible focus ring that meets WCAG 2.1 AA contrast, works in forced-colors mode and at 200% zoom, and stays clear of the panel and other controls at every tested viewport.

**Independent Test**: Tab to the button, confirm the accessibility tree shows role "button" and name "Reset view", activate it with Enter and with Space, and confirm the view resets and focus stays on the button (quickstart F, G, J).

### Tests for User Story 3 (written by /write-tests) ⚠️

- [X] T027 [US3] Contract test for the Reset view control DOM and styles.css in test/reset-view-control.test.js (covers FR-001, FR-002, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-016, FR-017, US3 scenario 2, 4)
- [X] T028 [US3] Integration test for the accessible control in test/reset-view.us3.integration.test.js (covers FR-005, FR-006, FR-007, FR-010, SC-004, US3 scenario 1, 2, 3, 4)
- [X] T029 [US3] AI test: accessible and discoverable control in tests/ai/us3-accessible-control.md (covers FR-001, FR-006, FR-007, FR-008, FR-009, FR-011, FR-012, FR-013, FR-016, FR-017, SC-004, SC-005, SC-006, SC-007, US3 scenario 1, 2, 3, 4)

### Implementation for User Story 3

- [ ] T014 [P] [US3] In `styles.css`, add the keyboard focus ring: `.reset-view:focus-visible { outline: 2px solid #1a73e8; outline-offset: -2px; }`. It is drawn inside the button's edge, on its white background, and never over the tiles (FR-009, FR-013; ~4.6:1 against white, at least 3:1 required)
- [ ] T015 [US3] In `styles.css`, add forced-colors support (FR-016, research.md R7): `@media (forced-colors: active) { .reset-view { background: ButtonFace; color: ButtonText; forced-color-adjust: none; } .reset-view:focus-visible { outline-color: Highlight; } }`. The SVG uses `currentColor`, so the icon follows ButtonText. The 3:1 rule doesn't apply in this mode
- [ ] T016 [US3] First run `node --test test/reset-view-control.test.js test/reset-view.us3.integration.test.js` and confirm both pass in full. Then run `npm start` and check quickstart.md scenarios F (Tab to the button; Enter and Space both reset; visible focus ring), G (DevTools accessibility tree: role "button", name "Reset view"; hovering shows the tooltip "Reset view"; plus one NVDA (Chrome/Firefox, Windows) or VoiceOver (Safari, macOS) spot check announcing "Reset view, button", SC-004), J (focus stays on the button after Enter; the next Tab follows the natural order: attribution links, then the panel), I (box ≥ 44×44 px, SVG ~22×22 px, hover #f4f4f4, inset 2px #1a73e8 ring; icon contrast ≥ 3:1 on #fff and #f4f4f4, SC-006), P (forced-colors emulation: icon and ring visible) and Q (200% browser zoom at 1280×800: button fully inside the map, not intersecting the panel or controls, works with pointer and keyboard; panel content reachable by scrolling, FR-017). Fix any defect in `styles.css` or `src/app.js` (depends on T014, T015, T007)
- [ ] T017 [US3] Check quickstart.md scenarios H and N in DevTools' device toolbar (FR-008, FR-012, SC-005, SC-006). At 360×640, 375×667, 667×375 and 1280×800, with the panel showing 5 results, 3 routes, an error status (go offline and search) and long wrapping names (search "Rue"), confirm the button's box is fully visible bottom-right above the attribution, with ≥ 8px to the panel and to every control, and that the panel never enters the bottom 96px strip. Rotate 375×667 → 667×375 without reloading and confirm this still holds and the starting view is unchanged. Scroll the panel at 667×375 with the wheel, touch and Tab, and confirm the focused result scrolls into view. Adjust `styles.css` if a check fails (depends on T007, T009, T010)

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final checks across all stories

- [ ] T018 [P] Update `README.md` with a one-line mention of the "Reset view" button (bottom-right of the map; returns to the starting view: your first location at zoom 15, or central Paris at zoom 13) in its feature list, if the README has one. Otherwise make no change
- [ ] T019 Code review of `src/app.js` for FR-018 and SC-007: `resetView()` is wrapped in `try/catch` with `console.error(err)`; no temporary `console.log` from T011 remains; `centered` is fully removed; the control is added exactly once
- [ ] T020 Run `npm test` and confirm every file under `test/` passes (the four original files, `test/view.test.js`, `test/reset-view-control.test.js` and `test/reset-view.us1/us2/us3.integration.test.js`), then run the remaining quickstart.md scenario R (a bfcache restore keeps the starting view; a real reload starts over, FR-003) as a final pass
- [ ] T021 With `npm start` running, run the AI test scenarios in `tests/ai/us1-return-to-starting-view.md`, `tests/ai/us2-reset-without-losing-work.md` and `tests/ai/us3-accessible-control.md` with headless Playwright, check every expected result and record notes and screenshots; a failed scenario is retried once, and a repeated failure goes back to `src/app.js` / `styles.css` (depends on T020)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories (the button reads `startView`).
- **US1 (Phase 3)**: Depends on Phase 2.
- **US2 (Phase 4)**: Depends on US1's T008 (it verifies the reset handler). It adds no new code unless review finds a defect.
- **US3 (Phase 5)**: The CSS tasks T014 and T015 can start right after Phase 2, in parallel with US1. Verification (T016, T017) needs the US1 button (T007–T010).
- **Polish (Phase 6)**: Depends on all stories. T021 (AI tests) runs after T020 (all of `test/` green).

### Within Each Phase

- T002 (existing test reviewed) → T003 (confirm failure) → T004 (implementation) → T005 (green) → T006 (wire into app.js)
- T007 → T008 (same file `src/app.js`, run in order). T009 → T010 and T014 → T015 each edit `styles.css`, so they run one after another. Only the first task of each pair is marked [P], since it can run alongside `src/app.js` work
- Manual checks (T011, T013, T016, T017) come after the code they check

### Parallel Opportunities

- `styles.css` work (T009, T010, T014, T015) can run in parallel with `src/app.js` work (T007, T008)
- T018 (`README.md`) can run in parallel with T019

---

## Parallel Example: User Story 1

```bash
# While one agent edits src/app.js (T007 → T008):
Task: "Add .reset-view control styles (44×44, #fff, hover #f4f4f4, 22px SVG) in styles.css"   # T009
Task: "Cap #panel: max-height: calc(100% - 108px); overflow-y: auto; box-sizing: border-box in styles.css"  # T010 (after T009, same file, so no [P])
```

## Parallel Example: Foundational

```bash
Task: "Review the existing test/view.test.js against contracts/start-view.md"  # T002
Task: "Implement createStartView in src/view.js"                   # T004
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001 baseline
2. Phase 2: T002–T006 (StartView + wiring)
3. Phase 3: T007–T011 (button, reset, styles, panel cap)
4. **STOP and VALIDATE**: quickstart A, A2, B, C, D, M, O

### Incremental Delivery

1. Setup + Foundational → starting view recorded, no visible change
2. + US1 → working Reset view button (MVP)
3. + US2 → non-destructive behavior confirmed (E, K, L)
4. + US3 → focus ring, forced colors, viewport and zoom checks (F, G, H, I, J, N, P, Q)
5. Polish → README, code review, full test run (all of `test/`), R, AI tests (T021)

---

## Notes

- Autonomous choices (no questions could be asked): test tasks are the files `/write-tests` already wrote, recorded as completed tasks (T022–T029; T022 sits in Foundational and T027 in US3 per analyze I4); green checks for them are part of T005, T011, T013, T016 and T020, and the AI scenarios run in T021; the StartView module is Foundational rather than US1 because every story's button depends on it; US2 has no new code, only a review and manual checks, since the design makes the reset non-destructive by construction; README update is conditional.
- `src/app.js` is touched by T006, T007, T008 in sequence. Do not parallelize those.
- Never commit the temporary SC-002 `console.log`.
- Commit after each phase or logical group.
