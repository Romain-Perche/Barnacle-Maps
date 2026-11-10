---

description: "Task list for the Reset View Button feature"
---

# Tasks: Reset View Button

**Input**: Design documents from `/specs/pilot-22089-add-a-reset-view-button/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reset-view-control.md, contracts/view-helpers.md, quickstart.md

**Tests**: The tests are already written (write-tests step) and recorded below as completed tasks (T020–T030), before each story's implementation tasks: Node unit tests of the pure helpers in `test/view.test.js`; integration and contract tests in `test/reset-view.test.js` and `test/reset-view-css.test.js`, which drive the real `src/app.js` and read `styles.css` in a fake browser with a fake Leaflet (`test/support/fake-browser.js`, no new dependencies); and AI scenarios in `tests/ai/`. The fake browser does no real layout or animation, so pixel measurements, timing and the look are also checked by hand with the `quickstart.md` scenarios. Until the feature is built, the new suites fail (red); each task below says which of them must pass at that point.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every description gives the exact file path

## Path Conventions

Single static project at the repository root: `index.html`, `styles.css`, `src/app.js` (DOM and Leaflet wiring), `src/geo.js` (pure helpers), `test/*.test.js` (`node --test`). There is no build step and there are no npm dependencies. Leaflet 1.9.4 is available as `window.L`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before changing anything. No project initialization is needed because the project already exists.

- [ ] T001 Run `npm test` from the repository root (`package.json` script `test`, which runs every file in `test/`) before any change. Confirm the baseline: the pre-existing suites `test/geo.test.js`, `test/modes.test.js`, `test/pleasure.test.js` and `test/routes.test.js` all pass, and the new suites `test/view.test.js`, `test/reset-view.test.js` and `test/reset-view-css.test.js` fail as expected because the feature is not built yet (red). Any failure in a pre-existing suite must be investigated before going on.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the shared view helpers and move the zoom control to the bottom-right corner. Both user stories depend on these.

**⚠️ CRITICAL**: Finish this phase before starting any user story. The zoom control must be at `bottomright` before the reset control is added, because Leaflet 1.9.4 inserts each new bottom-corner control above the existing ones. That gives the order Reset view, zoom, attribution.

- [ ] T002 [P] Check that `test/view.test.js` (already written, recorded as T020) matches `contracts/view-helpers.md`, and do not rewrite it. Run `node --test test/view.test.js` and confirm that its tests FAIL because `DEFAULT_VIEW`, `LOCATED_ZOOM` and `locatedView` are not exported from `src/geo.js` yet (red before T003).
- [ ] T003 [P] In `src/geo.js`, add these pure exports and add "map views" to the header comment:
  - `export const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };` (central Paris)
  - `export const LOCATED_ZOOM = 15;`
  - `export function locatedView({ lat, lng }) { return { lat, lng, zoom: LOCATED_ZOOM }; }`

  Data-model rules for a View: `lat` "Finite, −90..90", `lng` "Finite, −180..180", `zoom` "Integer, within the tile layer's range (0..19)". The function copies only `lat` and `lng` and always returns a new object. Run `node --test test/view.test.js` and confirm that it now passes.
- [ ] T004 In `src/app.js`, delete the local `const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };` and add `DEFAULT_VIEW`, `LOCATED_ZOOM` and `locatedView` to the existing alphabetically sorted import list from `./geo.js`. In `onPosition`, replace the literal `15` in `map.setView(latlng, 15)` with `LOCATED_ZOOM`. Keep the separate `15` in `showRoute`'s `map.setView([place.lat, place.lng], 15)` unchanged, because it is a different concern. Depends on T003.
- [ ] T005 In `src/app.js`, change map creation to `L.map("map", { zoomControl: false }).setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom)`. Right after the tile layer is added, add `L.control.zoom({ position: "bottomright" }).addTo(map);` so the zoom buttons move from top-left (hidden under `#panel`) to bottom-right, above the attribution. They keep their default behavior, accessible names ("Zoom in" / "Zoom out"), tooltips and keyboard use (FR-007). Depends on T004 because it edits the same file.

**Checkpoint**: `node --test test/view.test.js test/geo.test.js test/modes.test.js test/pleasure.test.js test/routes.test.js` passes. `test/reset-view.test.js` and `test/reset-view-css.test.js` still fail, because the control and its styles come in Phases 3 and 4. With `npm start`, the zoom +/- buttons are visible in the bottom-right corner above the "Leaflet | © OpenStreetMap contributors" credits, and the app behaves as before.

---

## Phase 3: User Story 1 - Return to the starting view in one click (Priority: P1) 🎯 MVP

**Goal**: A "Reset view" button on the map returns it to the starting view. The starting view is central Paris at zoom 13 or, once the first location fix of the page load arrives, that fix at zoom 15. Only the map center and zoom change.

**Independent Test**: Run `npm start` and open http://localhost:8000. Note the starting view, pan and zoom away, press Reset view, and check that the map is back at the same center (within 5 m) and the exact zoom. Run quickstart scenarios 1–6 and 11: location blocked → Paris z13; first Berlin fix → Berlin z15; a later Tokyo fix does not move the target; repeated presses cause no glitch; search, routes, mode, pleasure, status and markers stay unchanged; a press during "Computing … routes…" wins over the route zoom; reduced motion jumps instantly.

### Tests for User Story 1

- [X] T020 [US1] Contract test for the view helpers DEFAULT_VIEW, LOCATED_ZOOM and locatedView in test/view.test.js (covers FR-003, FR-004, US1 scenario 4, 5)
- [X] T021 [US1] Integration test for the starting view: Paris when unsupported or denied, first fix at zoom 15, later fixes ignored, first success after an error, destination before fix ignored, press before first fix, never stored, in test/reset-view.test.js (covers FR-002, FR-003, FR-004, US1 scenario 1, 4, 5)
- [X] T022 [US1] Integration test for repeated presses at the starting view and for unchanged app state after a reset, in test/reset-view.test.js (covers FR-005, FR-008, SC-004, US1 scenario 2, 3)
- [X] T023 [US1] Integration test for a reset while routes are loading, then the next search and the travel-mode change fitting again, in test/reset-view.test.js (covers FR-011)
- [X] T024 [US1] Integration test for an instant reset under reduced motion, with the preference read at each press, in test/reset-view.test.js (covers FR-010, SC-003)
- [X] T025 [US1] AI test: return to the starting view (location blocked or located, later fix, no glitch, reset beats route zoom, reduced motion) in tests/ai/us1-reset-to-starting-view.md (covers FR-002, FR-003, FR-004, FR-005, FR-008, FR-010, FR-011, SC-001, SC-002, SC-003, SC-004, US1 scenario 1, 2, 3, 4, 5)

### Implementation for User Story 1

- [ ] T006 [US1] Record the starting view in `src/app.js`:
  - Add the module-level `let startView = DEFAULT_VIEW;` next to the other `let` state (`position`, `centered`, …).
  - In `onPosition`, inside the existing `if (!centered)` branch, replace the `setView` call with `startView = locatedView(position); map.setView([startView.lat, startView.lng], startView.zoom);` and keep `centered = true;`.

  Do NOT update `startView` anywhere else. In particular, leave alone `showRoute`'s `setView` when there is no position yet, `drawRoutes`' `fitBounds`, later `onPosition` calls, and the reset itself (FR-003, FR-004, data-model lifecycle). Do not persist it (no `localStorage`).
- [ ] T007 [US1] Add the reset action in `src/app.js`:
  - Add the module-level `let resetRouteSeq = 0;`.
  - Add a `function prefersReducedMotion()` that returns `window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true`. It is read at each press (FR-010).
  - Add a `function resetView()` that runs `resetRouteSeq = routeSeq;` then `map.setView([startView.lat, startView.lng], startView.zoom, { animate: !prefersReducedMotion() });`.

  `resetView` must read and write no other state: `position`, `userMarker`, `destMarker`, `routeLayers`, `selectedRoute`, `routeSeq`, `searchSeq`, `pleasureAbort`, `mode`, `currentPlace`, the input, the results, the routes list, the list scroll positions and the status text all stay as they are (FR-005). It must not call `setStatus`, cancel any fetch, or move focus (FR-006). Depends on T006.
- [ ] T008 [US1] Make a reset win over loading routes (FR-011) in `src/app.js`:
  - Change the signature to `function drawRoutes(routes, m, { fit = true } = {})` and run `map.fitBounds(bounds, { padding: [40, 40] })` only when `fit` is true.
  - In `showRoute`, call `drawRoutes(routes, m, { fit: resetRouteSeq !== seq });`.

  This way, routes of the search that was loading when Reset view was pressed are still drawn, listed and selected (`selectRoute(0)`), and the status and pleasure scoring still run, but the map does not zoom to them. Any later `showRoute` (new destination or travel-mode change) increments `routeSeq`, so its routes fit as usual. Depends on T007.
- [ ] T009 [US1] Add the Leaflet control in `src/app.js`, right after the `L.control.zoom({ position: "bottomright" }).addTo(map);` line from T005, so that it stacks directly above the zoom buttons. Define `const ResetViewControl = L.Control.extend({ options: { position: "bottomright" }, onAdd() { … } });`. In `onAdd`:
  - Create a `div` with class `leaflet-bar leaflet-control`, using `L.DomUtil.create`.
  - Inside it, create a native `<button type="button" class="reset-view" aria-label="Reset view" title="Reset view">` containing `<span aria-hidden="true">⌂</span>` and no visible text.
  - Call `L.DomEvent.disableClickPropagation(container)` and `L.DomEvent.disableScrollPropagation(container)` so clicks, double-clicks, double-taps and wheel events on the button never reach the map (FR-006).
  - Attach `button.addEventListener("click", resetView)`.
  - Return the container.

  Then call `new ResetViewControl().addTo(map);`. The resulting DOM must exactly match `contracts/reset-view-control.md`. `resetView` is a function declaration, so it is hoisted and the listener can reference it even though it is defined further down. Depends on T005 and T007.
- [ ] T010 [P] [US1] Add base styles for the control in `styles.css` so that it looks like a Leaflet zoom button (white box, border and shadow come from `.leaflet-bar`):

  ```css
  .reset-view {
    display: block; width: 30px; height: 30px;
    padding: 0; margin: 0; border: 0; border-radius: 4px;
    background: #fff; color: #333;
    font: bold 18px/30px "Lucida Console", Monaco, monospace;
    text-align: center; cursor: pointer;
  }
  ```

  Also add `.leaflet-touch .reset-view { font-size: 22px; }`, because Leaflet 1.9.4 draws the zoom `+`/`−` glyphs at 22px under `.leaflet-touch` (18px otherwise) and the ⌂ glyph must match them (plan Design Note 6).

  Requirements: at least "30×30 CSS px" (FR-009); the glyph is "#333 or darker" at the zoom buttons' glyph size (FR-001). Can be done in parallel with T006–T009 because it is a different file.
- [ ] T011 [US1] Validate US1 by hand. Run `npm start` and work through quickstart scenarios 1, 2, 3, 4, 5, 6 and 11 in `specs/pilot-22089-add-a-reset-view-button/quickstart.md`.
  - **Exact check**: set a devtools breakpoint at the end of `resetView()`, then compare `map.getCenter()` and `map.getZoom()` with `startView` (SC-002: within 5 m, exact zoom).
  - **Timing**: the movement ends within 1 s (SC-003).
  - **No glitch**: pressing at the starting view causes no console error, flicker or jump (FR-008).
  - **Pressed before the first fix**: the map goes to Paris z13, and when the fix arrives it re-centers on it.

  Fix any issue in `src/app.js` or `styles.css`. Depends on T006–T010.

**Checkpoint**: The US1 tests in `test/reset-view.test.js` (T021–T024) pass. User Story 1 works. The button is in the bottom-right corner above the zoom buttons and resets the view, and nothing else changes.

---

## Phase 4: User Story 2 - Find and use the button with any input method (Priority: P2)

**Goal**: The control is easy to find and works with keyboard, screen reader, mouse and touch. It is visible at every viewport from 320×320, and the search panel never covers it on narrow screens.

**Independent Test**: Tab to the button and check for a visible focus ring and the name "Reset view". Press Enter, then Space, and check that the map resets each time and focus stays on the button. Tap it with touch emulation: the map resets and does not zoom. At 320×568 and 320×320, with a long results or routes list, the panel ends at least 10 px above Reset view, only the list scrolls, and the search box, Go, travel mode and status stay visible. Quickstart scenarios 7, 8, 9, 9b and 10.

### Tests for User Story 2

- [X] T026 [US2] Contract test for the control DOM (native button, ⌂, name and tooltip "Reset view"), the bottom-right stacking and the blocked event propagation, in test/reset-view.test.js (covers FR-001, FR-006, FR-007, FR-009, US2 scenario 1, 3)
- [X] T027 [US2] Integration test for focus staying on the button after a press, in test/reset-view.test.js (covers FR-006, SC-005, US2 scenario 2)
- [X] T028 [US2] Integration test for replaced results and routes lists starting at the top, in test/reset-view.test.js (covers FR-007)
- [X] T029 [US2] Contract test for the .reset-view size, colour, contrast, hover, active and focus styles and for the panel cap at 440 px or less, in test/reset-view-css.test.js (covers FR-001, FR-006, FR-007, FR-009, SC-006)
- [X] T030 [US2] AI test: find and use the button (placement at 5 viewports, keyboard Enter and Space, accessible name, touch and double-tap, panel cap at 320×568 and 320×320, scroll kept on reset) in tests/ai/us2-find-and-use-button.md (covers FR-001, FR-006, FR-007, FR-009, SC-005, SC-006, US2 scenario 1, 2, 3)

### Implementation for User Story 2

- [ ] T012 [P] [US2] Add interaction states for `.reset-view` in `styles.css`:
  - `.reset-view:hover, .reset-view:active { background: #f4f4f4; }`. This is the zoom buttons' look (FR-001): Leaflet 1.9.4 sets `background-color: #f4f4f4` on `.leaflet-bar a:hover` and `:focus` and has no separate pressed colour, so do not add a darker `:active` colour.
  - `.reset-view:focus-visible { outline: 2px solid #1a73e8; outline-offset: 1px; }`, a visible focus indicator (FR-006).

  The button is never disabled, so do not add a disabled style. Contrast requirement (FR-009): "its icon and border MUST have at least 3:1 contrast against their background". Check that the `#333` glyph on `#fff` and on the `#f4f4f4` hover/active background stays ≥ 3:1, and that the `.leaflet-bar` border (`2px solid rgba(0,0,0,0.2)` in `.leaflet-touch`) is not lightened.
- [ ] T013 [P] [US2] Add the narrow-screen panel cap in `styles.css`, at the end of the file (FR-007, SC-006):

  ```css
  @media (max-width: 440px) {
    #panel { max-height: calc(100% - 172px); box-sizing: border-box;
             display: flex; flex-direction: column; overflow: hidden; }
    #search-form, #mode, #status { flex: none; }
    #results, #routes { flex: 0 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  }
  ```

  Keep the DOM order unchanged: search form, mode, results, routes, status. `#routes:empty` and `#status:empty` must still hide those elements (`display: none`). With `box-sizing: border-box` the 8px padding is counted inside `max-height`. Wider viewports keep today's panel. The 172 px value is an estimate; acceptance is the measured clearance of at least 10 px in T016.
- [ ] T014 [US2] Make replaced lists start at the top (spec clarification: "A list whose content is replaced starts scrolled to the top") in `src/app.js`:
  - In `runSearch`, set `results.scrollTop = 0;` right after `results.replaceChildren();`.
  - In `clearRoutes`, set `routesList.scrollTop = 0;` right after `routesList.replaceChildren();`.

  Do NOT touch the scroll positions in `resetView`, because a reset must keep them (FR-005). This is the two-line JS change from plan Design Note 4. It is needed because `replaceChildren()` followed by synchronous appends can keep the old `scrollTop`. Depends on T009 because it edits the same file.
- [ ] T015 [US2] Validate US2 by hand. Run `npm start` and work through quickstart scenarios 7, 8, 9 and 10 in `specs/pilot-22089-add-a-reset-view-button/quickstart.md`:
  - **Keyboard**: Tab reaches the button, the focus ring is visible, Enter and Space each reset the map, and focus stays on the button.
  - **Accessibility pane**: role is button and the name is exactly "Reset view". The hover tooltip reads "Reset view".
  - **Size**: the rendered button is ≥ 30×30 px.
  - **Placement**: at 360×640, 568×320 and 1280×800, the stack is (top to bottom) Reset view, zoom +/−, credits, all visible and not under `#panel`.
  - **Touch**: with touch emulation, a double-tap on the button gives two resets and no map zoom. The zoom buttons still work and keep their "Zoom in"/"Zoom out" names.

  Fix any issue in `src/app.js` or `styles.css`. Depends on T012 and T014.
- [ ] T016 [US2] Validate the panel cap with quickstart scenario 9b in `specs/pilot-22089-add-a-reset-view-button/quickstart.md`, at 320×568 and 320×320, default text size. Search "rue" for a long results list, then pick a result to get routes.
  - **Clearance**: in devtools, measure that the bottom of `#panel` is ≥ 10 px above the top of the Reset view button.
  - **Scrolling**: only `#results` / `#routes` scroll, while the search box, Go, travel mode and a one-line status stay fully visible.
  - **Rows**: at 320×568, at least 3 full list rows are visible; at 320×320, at least part of one row is visible.
  - **Results and routes together**: when both lists are shown, each scrolls on its own.
  - **Map isolation**: wheel or touch scrolling to the end of a list does not pan or zoom the map.
  - **Reset keeps scroll**: pressing Reset view keeps the lists' scroll positions.
  - **New content**: new results, or a travel-mode change, start the list at the top.
  - **Wide screens**: at 1280×800 the panel is unchanged.

  If the clearance is under 10 px, raise the `172px` offset in `styles.css`. Depends on T013 and T014.

**Checkpoint**: `npm test` passes completely, including `test/reset-view-css.test.js`. Both user stories work on their own. The control can be used with any input method and is never covered by the panel.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final checks.

- [ ] T017 [P] In `README.md`, add one bullet to the feature list: "Reset view: the ⌂ button in the bottom-right corner (above the zoom buttons) brings the map back to its starting view, either central Paris or your first located position." This is documentation only, not a spec requirement.
- [ ] T018 Run `npm test` from the repository root and confirm that all suites pass, including `test/view.test.js`, `test/reset-view.test.js` and `test/reset-view-css.test.js`. Review the diff of `src/app.js`: `startView` is assigned only at its declaration and in `onPosition`'s `if (!centered)` branch, `resetView` writes only `resetRouteSeq`, and there are no new dependencies in `package.json` and no changes to `index.html`.
- [ ] T019 Do the full quickstart pass. Re-run every scenario in `specs/pilot-22089-add-a-reset-view-button/quickstart.md` (1–11, including 9b) on the final build and confirm that there are no console errors.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on T001. T002 and T003 run in parallel; then T004, then T005 (same file, `src/app.js`).
- **US1 (Phase 3)**: depends on Phase 2. T006 → T007 → T008 → T009 (all `src/app.js`, in sequence); T010 (`styles.css`) runs in parallel with them; T011 comes last.
- **US2 (Phase 4)**: depends on Phase 2, and on T009 because it styles and validates the button US1 creates. T012 and T013 (`styles.css`) can be done together, or in parallel with each other if merged carefully; T014 (`src/app.js`) comes after T009; T015 and T016 come last.
- **Polish (Phase 5)**: depends on US1 and US2.

### User Story Dependencies

- **US1 (P1)**: needs only the Foundational phase. It is the MVP.
- **US2 (P2)**: refines the control that US1 creates (focus/hover styles, panel cap, list scrolling), so it needs T009. The panel cap (T013) and the list scroll reset (T014) do not depend on the reset logic and could be built right after Phase 2.

### Within Each Story

- Tests first: the recorded tests (T020–T030) already exist and fail; T002 confirms `test/view.test.js` fails before T003.
- State (T006) → action (T007) → route-fit guard (T008) → control (T009) → manual validation.

### Parallel Opportunities

- T002 ∥ T003 (test file vs. `src/geo.js`)
- T010 ∥ T006–T009 (`styles.css` vs. `src/app.js`)
- T012 and T013 both edit `styles.css`, in different rule blocks. They are marked [P] relative to the `src/app.js` work (T014).
- T017 (`README.md`) ∥ any US2 task

---

## Parallel Example: User Story 1

```bash
# While T006–T009 are implemented in src/app.js, in sequence:
Task: "T010 [US1] Add base .reset-view styles in styles.css"
```

## Parallel Example: User Story 2

```bash
Task: "T012 [US2] Hover/active/focus-visible styles for .reset-view in styles.css"
Task: "T013 [US2] Narrow-screen panel cap media query in styles.css"   # same file, separate block
Task: "T014 [US2] Reset list scrollTop on replace in src/app.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: baseline `npm test`.
2. Phase 2: helpers with tests, and the zoom control moved to bottom-right.
3. Phase 3: starting view, reset action, FR-011 guard, control, base styles.
4. **STOP and VALIDATE** with T011. The button works and the view resets correctly.

### Incremental Delivery

1. Setup + Foundational → zoom buttons visible again (the current top-left placement hides them under the panel).
2. + US1 → working Reset view (MVP).
3. + US2 → focus, hover and contrast polish, and the narrow-screen panel cap so the controls are never covered.
4. Polish → README, full test run, full quickstart pass.

---

## Notes

- T014 adds the two `scrollTop = 0` lines in `src/app.js` that plan Design Note 4 calls for. The spec's clarification "A list whose content is replaced starts scrolled to the top" requires them once the lists can scroll.
- Choice made without asking: T013 adds `overscroll-behavior: contain` to the plan's CSS. `#panel` is a sibling of `#map`, not inside it, so scroll events already do not reach Leaflet. This only stops scroll chaining to the page at the end of a list.
- Commit after each phase or logical group, and stop at any checkpoint to validate.
