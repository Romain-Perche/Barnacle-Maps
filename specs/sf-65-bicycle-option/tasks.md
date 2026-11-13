---

description: "Task list for the Bicycle Option feature"
---

# Tasks: Bicycle Option

**Input**: Design documents from `/specs/sf-65-bicycle-option/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/travel-modes.md, contracts/ui.md, quickstart.md

**Tests**: Limited to what the plan and spec ask for: `test/modes.test.js` is extended for bike (SC-004: "only the travel-mode list test is extended for bike"). No other test files change; all existing tests must still pass.

**Organization**: Tasks are grouped by user story. Paths are relative to the repository root (flat static app: `index.html`, `src/`, `test/`, `README.md`). Run tests with `npm test` (= `node --test test/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline and the routing source before changing code

- [ ] T001 Run `npm test` from the repository root and confirm every existing test in `test/` passes before any change (baseline for SC-004)
- [ ] T002 [P] Run the endpoint sanity check from `specs/sf-65-bicycle-option/quickstart.md` (`curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=false&alternatives=3"`) and confirm it returns `"code":"Ok"` with `routes[].duration` lower than the same query on `routed-foot/route/v1/foot`; if the network is blocked, note it and continue (spec: runtime failures show the normal error status)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Per-mode wording data in `TRAVEL_MODES`, used by every status text. Must be done before the user stories so walk/car texts are produced from data and stay byte-identical (FR-010).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 In `src/geo.js`, add the fields `adjective` and `by` to the existing `TRAVEL_MODES` entries exactly as in `contracts/travel-modes.md`: `foot` → `adjective: "walking", by: "on foot"`; `car` → `adjective: "driving", by: "by car"`. Data-model rule: "Every entry has non-empty `label`, `base`, `profile`, `adjective`, `by`." Do not change `label`, `base` or `profile` of foot/car, and do not change `routeUrl` (unknown mode ids still fall back to `foot`)
- [ ] T004 In `src/app.js` `updateRoutes()` (around lines 324–345), replace the `m === "car" ? … : …` ternaries with a lookup `const t = TRAVEL_MODES[m] || TRAVEL_MODES.foot;` and build the texts from it: `` `Computing ${t.adjective} routes…` ``, `` `No ${t.adjective} route found.` ``, `` `${summary} ${t.by}${via}` `` for one route and `` `${routes.length} ${t.adjective} routes${via} · fastest ${summary}` `` for several. Replace `if (!car) scorePleasure(place, seq, st);` with `if (m === "foot") scorePleasure(place, seq, st);` and remove the now-unused `car` variable. Keep the existing `"Routing failed: …"`, `"… Try removing a stop."` and `"(… message)"` paths unchanged. Ensure `TRAVEL_MODES` is imported from `./geo.js` (it already is, used by the radio handler). Walk/car strings must be byte-identical to before (FR-010)
- [ ] T005 Run `npm test` and confirm all existing tests still pass after T003–T004 (no behaviour change for walk/car yet)

**Checkpoint**: Walk/car behave exactly as before, but status wording now comes from `TRAVEL_MODES`.

---

## Phase 3: User Story 1 - See cycling routes and their duration (Priority: P1) 🎯 MVP

**Goal**: A "Bike" option in the travel mode selector shows up to 3 cycling routes (OSRM bicycle profile) with distance and cycling duration, selectable in the panel or on the map, with bike-specific status texts, no pleasure indicator and no forced detours.

**Independent Test**: With a destination chosen, click "Bike": status shows "Computing cycling routes…", then up to 3 routes each with distance + duration, no pleasure label, summary "… by bike" or "N cycling routes · fastest …"; bike duration is shorter than walking for the same trip; clicking routes selects them; switching back to Walk/Car recomputes as before.

### Tests for User Story 1

- [ ] T006 [US1] In `test/modes.test.js`, extend the test "TRAVEL_MODES offers walking and car" (rename it to "TRAVEL_MODES offers walking, car and bike"): expect `Object.keys(TRAVEL_MODES).sort()` to equal `["bike", "car", "foot"]`; for each of `foot`, `car`, `bike` assert `label`, `base`, `profile`, `adjective`, `by` are non-empty strings; assert `TRAVEL_MODES.bike` equals `{ label: "Bike", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", adjective: "cycling", by: "by bike" }` and the foot/car `adjective`/`by` values from `contracts/travel-modes.md`. Keep the existing foot/car assertions
- [ ] T007 [US1] In `test/modes.test.js`, add a `BIKE` constant `` `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson` `` and tests from `contracts/travel-modes.md`: `routeUrl(from, to, undefined, { mode: "bike" })` equals `BIKE`; with `alternatives: 3` equals `` `${BIKE}&alternatives=3` ``; with base `"https://example.test"` equals `` `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson` ``. Run `npm test` and confirm these new tests FAIL before T008

- [X] T018 [US1] Contract test for TRAVEL_MODES (keys foot/car/bike, every field non-empty, exact bike entry) in test/modes.test.js (covers FR-001, FR-002, FR-010, contracts/travel-modes.md)
- [X] T019 [US1] Contract test for routeUrl bike mode (bicycle server and bike profile, alternatives=3, explicit base) in test/modes.test.js (covers FR-002, FR-003, FR-004, US1 scenario 1, contracts/travel-modes.md)
- [X] T020 [US1] Contract test for status wording of every mode (walking/driving/cycling, on foot/by car/by bike) in test/modes.test.js (covers FR-006, FR-010, US1 scenario 1, 5, contracts/ui.md)
- [X] T021 [US1] Contract test for the travel mode radiogroup Walk · Car · Bike with Walk checked in test/bike-ui.test.js (covers FR-001, FR-010, FR-012, contracts/ui.md)
- [X] T022 [US1] AI test: cycling routes, selection, mode switching, single route, failures, live bike-vs-walk check in tests/ai/us1-cycling-routes.md (covers FR-001 to FR-010, FR-012, US1 scenario 1, 2, 3, 4, 5, 6, 7, SC-001, SC-002, SC-003)

### Implementation for User Story 1

- [ ] T008 [US1] In `src/geo.js`, add the `bike` entry to `TRAVEL_MODES` after `car`: `bike: { label: "Bike", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", adjective: "cycling", by: "by bike" }`; update the comment above `routeUrl` to mention the "bike" profile (mode "bike") for cycling routes. Run `npm test`: T006/T007 now pass
- [ ] T009 [P] [US1] In `index.html`, inside `<div id="mode" role="radiogroup" aria-label="Travel mode">`, add `<label><input type="radio" name="mode" value="bike"> Bike</label>` after the Car label (order Walk · Car · Bike, FR-001/FR-012). Keep `checked` on the Walk radio only (Walk stays the default after every page load, FR-010)
- [ ] T010 [US1] Verify in `src/app.js` (no change expected) that bike inherits the required guards: `fetchRoutes` returns `pickRoutes(main)` early when `m !== "foot"` (no forced detours, FR-008); `drawRoutes` only creates the pleasure element when `m === "foot"` (FR-007); `updateRoutes` only calls `scorePleasure` when `m === "foot"` (from T004); the radio `change` handler accepts `bike` because it checks `radio.value in TRAVEL_MODES` and keeps `currentPlace`/stops (FR-009); `routeSeq` discards stale results (switch-while-computing edge case). Fix only if one of these does not hold
- [ ] T011 [US1] Manually validate steps 1–5 and 7 of `specs/sf-65-bicycle-option/quickstart.md` (`npm start`, http://localhost:8000): Bike shows "Computing cycling routes…", up to 3 routes with distance + duration and no pleasure label, summary "by bike" / "N cycling routes · fastest …", selection by panel and map, switching Car/Walk recomputes with walk pleasure back, quick Bike→Walk shows only walking routes. If no browser/network is available, record that the manual check was not done

**Checkpoint**: User Story 1 is fully functional: Bike mode works for a destination without stops.

---

## Phase 4: User Story 2 - Cycle through stops (Priority: P2)

**Goal**: With stops in the journey, Bike computes a cycling route through every stop in list order; editing stops recomputes it.

**Independent Test**: Add 2 stops, select "Bike": the route passes through the stops in order, the status reads "… by bike via 2 stops" (or "N cycling routes via 2 stops · fastest …"); reordering, adding or removing a stop recomputes the cycling route; with no route the status reads "No cycling route found. Try removing a stop."

### Tests for User Story 2

- [ ] T012 [US2] In `test/modes.test.js`, add a test that `routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2] })` (e.g. `s1 = { lat: 48.852, lng: 2.352 }`, `s2 = { lat: 48.855, lng: 2.355 }`) returns `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.352,48.852;2.355,48.855;2.36,48.86?overview=full&geometries=geojson` (coordinates `from;s1;s2;to` in order, per `contracts/travel-modes.md`)

- [X] T023 [US2] Contract test for routeUrl bike mode with stops in order in test/modes.test.js (covers FR-002, US2 scenario 1, contracts/travel-modes.md)
- [X] T024 [US2] AI test: bike route through stops, reorder/add/remove stops, no route with stops in tests/ai/us2-cycle-through-stops.md (covers FR-002, FR-006, FR-009, US2 scenario 1, 2)

### Implementation for User Story 2

- [ ] T013 [US2] Verify in `src/app.js` (no change expected) that stop handling is mode-agnostic for bike: `fetchRoutes` passes `stops: st` to `routeUrl` for every mode; stop add/remove/reorder/clear call `updateRoutes()` regardless of mode; the stops-with-no-route text is `` `${noRoute} Try removing a stop.` `` and the failure-with-stops text is `` `${noRoute} (${err.message})` ``, giving "No cycling route found. Try removing a stop." / "No cycling route found. (<reason>)" for bike; stop limits (`MAX_STOPS = 5`, `STOP_DUPLICATE_M = 20`) are unchanged. Fix only if one of these does not hold
- [ ] T014 [US2] Manually validate step 6 of `specs/sf-65-bicycle-option/quickstart.md`: add 2 stops, select Bike, route passes through the stops in order; reorder/remove a stop → recomputed; stops are kept when switching modes. If no browser/network is available, record that the manual check was not done

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [X] T025 Contract test for the README bike mode line (routed-bike source, bicycle profile, up to 3 alternatives, no detour, no pleasure) in test/bike-ui.test.js (covers FR-011)
- [ ] T015 [P] Update `README.md` (FR-011): in the intro sentence, change "Switch between walking and car in the panel" to mention walking, car and bike; add a line after the "Car routes" bullet: "Bike routes: OSRM bicycle profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, no detour routes, without the pleasure indicator." Keep the pleasure bullet saying walking only
- [ ] T016 Run `npm test` and confirm all tests pass (existing `geo`, `pleasure`, `routes`, `stops` tests unchanged; `modes` extended) – SC-004
- [ ] T017 Review the diff (`git diff main -- src/ index.html`) to confirm walk/car status strings are byte-identical to before ("Computing walking routes…", "Computing driving routes…", "No walking route found.", "No driving route found.", "… on foot", "… by car", "N walking routes …", "N driving routes …") and that no new dependency or file was added under `src/` (FR-010, plan constraints)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 and T002 can run in parallel
- **Foundational (Phase 2)**: T003 → T004 → T005; blocks both user stories
- **User Story 1 (Phase 3)**: After Phase 2. T006 → T007 (same file) → T008; T009 can run in parallel with T006–T008 (different file); T010 after T008/T009; T011 last
- **User Story 2 (Phase 4)**: Needs the `bike` mode from T008 and the radio from T009 (bike must exist to cycle through stops); T012 after T007 (same test file); T013, T014 after that
- **Polish (Phase 5)**: T015 can start any time after T008 (different file); T016/T017 after all stories

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational
- **US2 (P2)**: Depends on US1's `bike` entry and radio (T008, T009); the stops logic itself is already mode-agnostic, so US2 is mainly verification

### Within Each User Story

- Tests written first and seen failing (T007 before T008)
- Data (`src/geo.js`) before UI (`index.html`) verification and manual checks

### Parallel Opportunities

- T001 ‖ T002
- T009 (`index.html`) ‖ T006–T008 (`test/modes.test.js`, `src/geo.js`)
- T015 (`README.md`) ‖ any task of Phase 3/4 after T008

---

## Parallel Example: User Story 1

```bash
# After Phase 2, in parallel:
Task: "Add bike tests to test/modes.test.js (T006, T007), then add bike entry to TRAVEL_MODES in src/geo.js (T008)"
Task: "Add the Bike radio after Car in index.html (T009)"
Task: "Document bike mode in README.md (T015) once T008 is merged"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: baseline tests + endpoint check
2. Phase 2: wording fields + lookup in `app.js` (walk/car unchanged)
3. Phase 3: bike entry, Bike radio, tests
4. **STOP and VALIDATE**: `npm test` + quickstart steps 1–5, 7

### Incremental Delivery

1. Setup + Foundational → walk/car unchanged, wording data-driven
2. US1 → Bike mode for direct trips (MVP)
3. US2 → Bike with stops verified
4. Polish → README, final test run and diff review

---

## Notes

- [P] tasks = different files, no dependencies
- The whole feature touches `src/geo.js`, `src/app.js`, `index.html`, `test/modes.test.js`, `README.md` only
- Commit after each phase
- Avoid changing walk/car texts or the default mode (FR-010)
