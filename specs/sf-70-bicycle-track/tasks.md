---

description: "Task list for SF-70 Bicycle Travel Mode"
---

# Tasks: Bicycle Travel Mode

**Input**: Design documents from `/specs/sf-70-bicycle-track/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/travel-modes.md, quickstart.md

**Tests**: Included. The spec does not ask for TDD, but SC-004 depends on the test suite and plan.md and quickstart.md list new unit tests in `test/modes.test.js`. Tests cover the pure helpers in `src/geo.js` only. `src/app.js` is DOM code with no test harness, so it is checked manually with `quickstart.md`.

**Organization**: Tasks are grouped by user story so each story can be built and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story the task belongs to (US1, US2, US3)

## Path Conventions

Flat static app at the repository root: `index.html`, `styles.css`, `src/geo.js` (pure helpers), `src/app.js` (DOM/Leaflet), `test/*.test.js` (`node --test`), `README.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Record the baseline. Nothing to install: there are no dependencies and no build step.

- [ ] T001 Run `npm test` from the repository root and confirm all existing tests in `test/` pass before any change (baseline for SC-004)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Move per-mode behaviour into `TRAVEL_MODES` (research R2) without changing Walk or Car behaviour, so Bike can be added as data.

**⚠️ CRITICAL**: Finish this phase before starting any user story.

- [X] T022 Contract test: foot and car entries keep their routing and reproduce today's texts in test/bike.test.js (covers SC-004, FR-005, FR-006)
- [X] T023 Unit test: L5 app_js_strings checks src/app.js + src/geo.js in test/routes.test.js (covers SC-004)
- [ ] T002 In `src/geo.js`, extend `TRAVEL_MODES.foot` and `TRAVEL_MODES.car` with the fields from `data-model.md`. Keep the existing `label`, `base` and `profile` values. foot = `icon: "🚶", pleasure: true, detours: true, computing: "Computing walking routes…", noRoute: "No walking route found.", single: "on foot", plural: "walking"`; car = `icon: "🚗", pleasure: false, detours: false, computing: "Computing driving routes…", noRoute: "No driving route found.", single: "by car", plural: "driving"`. Also update the comment above `routeUrl` and the file header comment to say walking/car/bike
- [ ] T003 [P] Run `node --test test/bike.test.js` and confirm the test "foot and car entries keep their routing and reproduce today's texts" passes after T002 ("Existing values for `foot` and `car` … are unchanged; their texts reproduce today's strings exactly"). Do not edit the test
- [ ] T004 In `src/app.js`, replace the mode checks with lookups in `TRAVEL_MODES[m]` (import already present; keep `TRAVEL_MODES.foot` as the fallback for an unknown `m`):
  - `fetchRoutes`: `!cfg.detours` replaces `m !== "foot"`
  - `drawRoutes`: `cfg.pleasure` replaces `m === "foot"`
  - `updateRoutes`: `setStatus(cfg.computing)`; `noRoute = cfg.noRoute`; the summary becomes `` `${summary} ${cfg.single}${via}` `` / `` `${routes.length} ${cfg.plural} routes${via} · fastest ${summary}` ``; `if (cfg.pleasure) scorePleasure(place, seq, st)` replaces `if (!car)`; remove the `car` local
- [ ] T005 Run `npm test`. Every test outside `test/bike.test.js` and the key-list test in `test/modes.test.js` must pass, including L5 in `test/routes.test.js`. Walk and Car behaviour must be unchanged (SC-004)

**Checkpoint**: Mode behaviour is now data-driven, and Walk/Car look and behave exactly as before.

---

## Phase 3: User Story 1 - Get cycling routes to a destination (Priority: P1) 🎯 MVP

**Goal**: The user selects "🚲 Bike" in a design C segmented selector and gets up to 3 cycling routes with distance, duration and the pleasure indicator, without forced detours.

**Independent Test**: Select Bike, search a destination 2–10 km away. Check that the status says "Computing cycling routes…", then that 1–3 routes appear with Route 1 selected and durations shorter than walking. Check that the pleasure indicator appears with "most pleasant" on one route, and that clicking a route selects it (quickstart scenarios 1–3).

### Tests for User Story 1

- [ ] T006 [P] [US1] Confirm the key-list test "TRAVEL_MODES offers walking, car and bike" in `test/modes.test.js` (already updated, research R7) fails before T009 and passes after it. Do not edit the test
- [ ] T007 [P] [US1] Confirm the bike-entry test in `test/bike.test.js` expects `label: "Bike"`, `icon: "🚲"`, `base: "https://routing.openstreetmap.de/routed-bike"`, `profile: "bike"`, `pleasure: true`, `detours: false`, `computing: "Computing cycling routes…"`, `noRoute: "No cycling route found."`, `single: "by bike"`, `plural: "cycling"` (already written; do not edit)
- [ ] T008 [P] [US1] Confirm the bike `routeUrl` tests in `test/bike.test.js` use the `BIKE` constant `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson`. Cover: `{ mode: "bike" }` → `BIKE`; `{ mode: "bike", alternatives: 3 }` → `` `${BIKE}&alternatives=3` ``; explicit base `"https://example.test"` → `` `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson` `` (already written; do not edit)

- [X] T024 [US1] Unit test: TRAVEL_MODES offers walking, car and bike in test/modes.test.js (covers FR-001, US1 scenario 1)
- [X] T025 [US1] Contract test: bike mode entry (label, icon, routed-bike server, pleasure on, no detours, cycling texts) in test/bike.test.js (covers FR-002, FR-005, FR-006, FR-007, US1 scenario 4, 5, 6)
- [X] T026 [US1] Contract test: TRAVEL_MODES order is foot, car, bike in test/bike.test.js (covers FR-001)
- [X] T027 [US1] Contract test: only walking forces detours in test/bike.test.js (covers FR-006)
- [X] T028 [US1] Contract test: pleasure indicator applies to foot and bike only in test/bike.test.js (covers FR-005, US1 scenario 6)
- [X] T029 [US1] Contract test: routeUrl bike mode uses the OSRM bike server and bike profile in test/bike.test.js (covers FR-002, US1 scenario 2)
- [X] T030 [US1] Contract test: routeUrl bike mode asks for alternatives in test/bike.test.js (covers FR-003, US1 scenario 2)
- [X] T031 [US1] Contract test: routeUrl bike mode with an explicit base in test/bike.test.js (covers FR-002)
- [X] T032 [US1] Contract test: index.html radiogroup with Walk, Car, Bike segments, Walk checked, emoji aria-hidden in test/bike.test.js (covers FR-001, US1 scenario 1)
- [X] T033 [US1] Contract test: styles.css segmented control with checked and focus styles in test/bike.test.js (covers FR-001)
- [X] T034 [US1] Unit test: app.js reads mode behaviour from TRAVEL_MODES instead of comparing mode names in test/bike.test.js (covers FR-005, FR-006, FR-007, US1 scenario 4)
- [X] T035 [US1] Unit test: app.js pleasure tooltip refers to the route in test/bike.test.js (covers FR-005, US1 scenario 6)
- [X] T036 [US1] AI test: selector shows Walk, Car and Bike as segmented buttons in tests/ai/us1-cycling-routes.md (covers FR-001, US1 scenario 1)
- [X] T037 [US1] AI test: bike routes for a destination in tests/ai/us1-cycling-routes.md (covers FR-002, FR-003, FR-007, US1 scenario 2, 4)
- [X] T038 [US1] AI test: bike durations shorter than walking in tests/ai/us1-cycling-routes.md (covers SC-002, FR-002)
- [X] T039 [US1] AI test: select a bike route from the panel and from the map in tests/ai/us1-cycling-routes.md (covers FR-004, US1 scenario 3)
- [X] T040 [US1] AI test: pleasure indicator on bike routes, none on car in tests/ai/us1-cycling-routes.md (covers FR-005, US1 scenario 6)
- [X] T041 [US1] AI test: no cycling route found in tests/ai/us1-cycling-routes.md (covers FR-007, US1 scenario 5)
- [X] T042 [US1] AI test: no forced detours for bike in tests/ai/us1-cycling-routes.md (covers FR-006)

### Implementation for User Story 1

- [ ] T009 [US1] In `src/geo.js`, add `TRAVEL_MODES.bike` with exactly the values from T007 (after `car`, so the object order is foot, car, bike). Then run `npm test`: the tests named in T006–T008 must pass
- [ ] T010 [P] [US1] In `index.html`, replace the contents of `#mode` with the design C markup from `contracts/travel-modes.md`. Keep `role="radiogroup" aria-label="Travel mode"`; use three `<label><input type="radio" name="mode" value="…"><span><span aria-hidden="true">ICON</span> Label</span></label>` for foot (`checked`, 🚶 Walk), car (🚗 Car) and bike (🚲 Bike)
- [ ] T011 [P] [US1] In `styles.css`, replace the `#mode` rule with the segmented control:
  - `#mode`: `display:flex; margin:6px 0 0; border:1px solid #dadce0; border-radius:6px; overflow:hidden; font-size:14px`
  - `#mode label`: `flex:1; display:flex; cursor:pointer`
  - `#mode input`: visually hidden but still focusable (`position:absolute; opacity:0; width:1px; height:1px; margin:0`), never `display:none`
  - `#mode input + span`: `flex:1; text-align:center; padding:6px 0`
  - `#mode label + label span`: `border-left:1px solid #dadce0`
  - `#mode input:checked + span`: `background:#e8f0fe; color:#1a73e8; font-weight:600`
  - `#mode input:focus-visible + span`: `outline:2px solid #1a73e8; outline-offset:-2px`
- [ ] T012 [US1] In `src/app.js` `scorePleasure`, change the tooltip `title` to `"Green pixels (parks, grass, woods) on the map along this route; more is more pleasant"` (FR-005)
- [ ] T013 [US1] Check manually with `npm start` (quickstart.md scenarios 1–3): the selector looks like design C and is keyboard accessible; Bike shows cycling routes, the status texts, the pleasure indicator, and no forced detours

**Checkpoint**: Bike mode works end-to-end for a direct trip (MVP).

---

## Phase 4: User Story 2 - Switch to and from Bike for the current destination (Priority: P2)

**Goal**: Changing mode recomputes routes for the same destination and stops, and only the latest mode's results are shown.

**Independent Test**: Show walking routes, switch to Bike (cycling routes replace them), switch back to Walk (walking routes return). Click Walk, Bike, Car quickly: only Car routes end up shown (quickstart scenario 4).

- [X] T043 [US2] Contract test: switching mode keeps the same points and changes only the server and profile in test/bike.test.js (covers FR-008, US2 scenario 1, 2, US3 scenario 2)
- [X] T044 [US2] AI test: Walk → Bike → Walk keeps the destination in tests/ai/us2-switch-modes.md (covers FR-008, US2 scenario 1, 2)
- [X] T045 [US2] AI test: Car → Bike replaces car routes in tests/ai/us2-switch-modes.md (covers FR-008, US2 scenario 1)
- [X] T046 [US2] AI test: quick switching shows only the last mode in tests/ai/us2-switch-modes.md (covers FR-010, US2 scenario 3)
- [X] T047 [US2] AI test: bike routing service fails in tests/ai/us2-switch-modes.md (covers FR-010, edge case routing service unreachable)

### Implementation for User Story 2

- [ ] T014 [US2] In `src/app.js`, check the mode `change` listener at the end of the file. It must accept `"bike"` through `radio.value in TRAVEL_MODES`, call `updateRoutes()` when `currentPlace` is set, and leave `stops` alone. No code change is expected; fix it if any of this does not hold (FR-008)
- [ ] T015 [US2] In `src/app.js` `updateRoutes`, check that stale results are dropped and that error paths show no routes. `++routeSeq` must come before the fetch; `pleasureAbort?.abort()` and `clearRoutes()` must run before `setStatus(cfg.computing)`; results are discarded when `seq !== routeSeq`. No routes from the previous mode may remain after a routing error (FR-010, error edge case). No code change is expected; fix it if any of this does not hold
- [ ] T016 [US2] Check manually quickstart.md scenarios 4 and 6 (switching both ways, quick switching, routing error with routing blocked in devtools)

**Checkpoint**: Mode switching works across all three modes.

---

## Phase 5: User Story 3 - Cycling routes with stops (Priority: P3)

**Goal**: Cycling routes go through every stop in list order, and stops are kept when the mode changes.

**Independent Test**: Add 2 stops, select Bike, choose a destination. The route must pass through both stops in order, and switching mode keeps the stops (quickstart scenario 5).

### Tests for User Story 3

- [ ] T017 [P] [US3] Confirm the stops test in `test/bike.test.js` ("routeUrl bike mode visits the stops in list order", already written; do not edit) checks that `routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2] })` with `s1 = { lat: 48.852, lng: 2.352 }` and `s2 = { lat: 48.855, lng: 2.355 }` equals `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.352,48.852;2.355,48.855;2.36,48.86?overview=full&geometries=geojson`

- [X] T048 [US3] Contract test: routeUrl bike mode visits the stops in list order in test/bike.test.js (covers FR-009, US3 scenario 1)
- [X] T049 [US3] AI test: bike route goes through two stops in order in tests/ai/us3-bike-stops.md (covers FR-009, US3 scenario 1)
- [X] T050 [US3] AI test: stops are kept when switching to and from Bike in tests/ai/us3-bike-stops.md (covers FR-008, US3 scenario 2)

### Implementation for User Story 3

- [ ] T018 [US3] Check manually quickstart.md scenario 5. Bike uses the existing stops path in `fetchRoutes` in `src/app.js` (no detours with stops; the "Try removing a stop." message comes from `cfg.noRoute`); no code change is expected

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T051 Unit test: README mentions Bike mode, routed-bike and pleasure for walking and bike in test/bike.test.js (covers FR-011)
- [ ] T019 [P] Update `README.md` (FR-011):
  - Intro: switch between walking, car and bike; walking and bike routes get the pleasure indicator (remove "(walking only)"; the README test in `test/bike.test.js` checks it is gone)
  - Add a bullet: "Bike routes: OSRM bike profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, with the pleasure indicator; no detour routes are added."
  - Pleasure bullet: "…along each walking or bike route…" and "…if the trip is very long"
  - Mention the segmented 🚶 Walk | 🚗 Car | 🚲 Bike selector
- [ ] T020 Run the quickstart.md live API smoke check (`curl` on `routed-bike/route/v1/bike/…`). If it fails because the server rejects the `bike` segment, change `TRAVEL_MODES.bike.profile` to `"driving"` in `src/geo.js` and update the expected URLs in `test/modes.test.js` to match (research R1). If network access is blocked, record that in the final report
- [ ] T021 Run `npm test` one last time: all tests must pass, including every test in `test/bike.test.js` (SC-004)

---

## Fix round 1: icon on its own line in the mode selector

- [ ] T052 In `styles.css`, change the selector `#mode span` to `#mode input + span` (keep its declarations), so `display:block` and the padding apply only to the outer button span and not to the nested `<span aria-hidden="true">` icon. Do not edit `index.html` or the tests (FR-001, plan "Fix round 1")
- [ ] T053 Run `npm test`: all tests pass, including "styles.css: #mode button padding does not apply to the nested icon span" in `test/bike.test.js`. Check with `npm start` that each button shows "🚶 Walk", "🚗 Car", "🚲 Bike" on one line

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks all stories (T004 depends on T002)
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after Foundational; needs T009 and T010 so Bike can be selected
- **US3 (Phase 5)**: after Foundational; T017 can run as soon as T009 is done
- **Polish (Phase 6)**: after the stories you want to ship

### Within Each Story

- The tests named in T006–T008 are already written and fail; T009 (plus T010–T012 and T019 for the markup, source and README checks) makes them pass
- T010, T011 and T012 touch different files and can run alongside T009
- Manual checks (T013, T016, T018) come last in their phase

### Parallel Opportunities

- T003 runs alongside T004 (test file vs. app.js)
- US1: T006, T007 and T008 edit the same test file, so they are [P] only relative to other files and should go in one sitting. T010 (`index.html`), T011 (`styles.css`) and T012 (`src/app.js`) can run in parallel
- T019 (README) can be done any time after Phase 2

## Parallel Example: User Story 1

```text
Task: "T009 Add TRAVEL_MODES.bike in src/geo.js"
Task: "T010 Design C selector markup in index.html"
Task: "T011 Segmented control CSS in styles.css"
Task: "T012 Pleasure tooltip text in src/app.js"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (refactor with no behaviour change, tests green)
2. Phase 3 (US1) → validate with quickstart scenarios 1–3 → shippable

### Incremental Delivery

1. US1 → Bike routes for direct trips
2. US2 → confirm switching and stale-result handling (expected to need no code)
3. US3 → stops test plus manual check
4. Polish → README, live API check, final test run

## Notes

- Tests were written before implementation by `/write-tests` (see the recorded test tasks per phase). Implementation tasks make them pass and never edit them.
- Don't change `routeUrl`'s signature or the foot/car `base`/`profile` values.
- Commit after each phase.
