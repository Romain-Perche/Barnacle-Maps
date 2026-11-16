---

description: "Tasks for the Bicycle Travel Mode (PILOT-45168)"
---

# Tasks: Bicycle Travel Mode

**Input**: Design documents from `/specs/pilot-45168-bicycle-track/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/geo-api.md, contracts/ui.md, quickstart.md

**Tests**: Already written by `/write-tests` (before any code) and recorded below as completed tasks in each story phase: `test/bike.contract.test.js`, `test/bike.integration.test.js`, the updated mode-set test in `test/modes.test.js`, and the AI scenarios in `tests/ai/`. They fail until the feature is built. Do not write them again; make them pass. Never weaken them. Existing tests (`test/routes.test.js` L4/L5 in particular) must keep passing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Paths are relative to the repository root (single static project: `src/`, `test/`, `tests/ai/`, `index.html`, `styles.css`, `README.md`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before changing anything

- [ ] T001 Run `npm test` from the repository root; confirm the only failures are the tests in test/bike.contract.test.js, test/bike.integration.test.js and "TRAVEL_MODES offers walking, car and bike" in test/modes.test.js (no build step or dependency install is needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Move mode-specific behavior out of the `m === "car"` / `m === "foot"` ternaries in `src/app.js` and into `TRAVEL_MODES` (research R2), without changing Walk/Car behavior. Bike then only needs a new table entry.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add the fields `icon`, `noun`, `by`, `pleasure`, `detours` to the `foot` and `car` entries of `TRAVEL_MODES` in src/geo.js, exactly: `foot` → `icon: "🚶"`, `noun: "walking"`, `by: "on foot"`, `pleasure: true`, `detours: true`; `car` → `icon: "🚗"`, `noun: "driving"`, `by: "by car"`, `pleasure: false`, `detours: false`; keep `label`, `base`, `profile` unchanged and add no other field (the contract test uses deepEqual); update the header comment and the comment above `routeUrl` so they no longer say "walking and car" only
- [ ] T003 Refactor src/app.js to read the mode metadata instead of hard-coded mode checks, keeping every Walk/Car text identical to today (contracts/ui.md): add near the other constants `const NO_ROUTE = { foot: "No walking route found.", car: "No driving route found.", bike: "No cycling route found." };` (literal strings: test/routes.test.js L5 and test/bike.integration.test.js look for them); in `fetchRoutes` replace `m !== "foot"` with `!TRAVEL_MODES[m].detours`; in `drawRoutes` replace `m === "foot"` with `TRAVEL_MODES[m].pleasure`; in `updateRoutes` set `const cfg = TRAVEL_MODES[m]` and use `Computing ${cfg.noun} routes…`, `const noRoute = NO_ROUTE[m]`, single route `${summary} ${cfg.by}${via}`, several routes `${routes.length} ${cfg.noun} routes${via} · fastest ${summary}`, and `if (cfg.pleasure) scorePleasure(place, seq, st)`; remove the `car` variable; no `=== "foot"`/`=== "car"`/`!== "foot"` comparison may remain (`let mode = "foot"` stays) (depends on T002)
- [ ] T004 In `scorePleasure` in src/app.js change the pleasure tooltip from "Green pixels (parks, grass, woods) on the map along this walk; more is more pleasant" to "Green pixels (parks, grass, woods) on the map along this route; more is more pleasant" (research R4) (depends on T003)
- [ ] T005 Run `npm test`; the test "TRAVEL_MODES.foot and .car keep their routing and gain mode metadata" and all pre-existing tests must pass (depends on T002, T003)

**Checkpoint**: Walk and Car behave exactly as before, but all mode-specific behavior comes from `TRAVEL_MODES`

---

## Phase 3: User Story 1 - Get cycling routes to a destination (Priority: P1) 🎯 MVP

**Goal**: The user can select "🚲 Bike" in a segmented Walk | Car | Bike control and get up to 3 cycling routes with distance, duration, pleasure indicator and cycling wording.

**Independent Test**: `npm start`, allow location, choose a destination about 3 km away, select Bike: "Computing cycling routes…" appears, then 1–3 routes with pleasure lines and "N cycling routes · fastest …" (or "… by bike") (quickstart.md rows 1–5; tests/ai/us1-bike-routes.md).

### Tests for User Story 1

- [X] T016 [US1] Contract test for the mode set (walking, car and bike) in test/modes.test.js (covers FR-001, US1 scenario 1)
- [X] T017 [US1] Contract test for the TRAVEL_MODES.bike entry, the foot/car metadata and the pleasure/detour flags in test/bike.contract.test.js (covers FR-003, FR-007, FR-008, FR-009, US1 scenario 2, 4, 5)
- [X] T018 [US1] Contract test for routeUrl in bike mode (plain, alternatives, explicit base) in test/bike.contract.test.js (covers FR-003, FR-004, US1 scenario 2)
- [X] T019 [US1] Contract test for the Walk/Car/Bike segmented selector markup and styles in test/bike.contract.test.js (covers FR-001, FR-002, US1 scenario 1)
- [X] T020 [US1] Integration test for app.js reading the mode table (no hard-coded mode checks, per-mode no-route messages, route tooltip) in test/bike.integration.test.js (covers FR-007, FR-008, FR-009, FR-010, US1 scenario 2, 4, 5)
- [X] T021 [US1] Integration test for README documenting bike mode and routed-bike in test/bike.integration.test.js (covers FR-012)
- [X] T022 [US1] AI test: segmented selector with three icon segments and keyboard in tests/ai/us1-bike-routes.md (covers FR-001, FR-002, US1 scenario 1)
- [X] T023 [US1] AI test: cycling routes with cycling wording in tests/ai/us1-bike-routes.md (covers FR-003, FR-004, FR-007, US1 scenario 2, 5)
- [X] T024 [US1] AI test: select a cycling route in the panel and on the map in tests/ai/us1-bike-routes.md (covers FR-004, US1 scenario 3)
- [X] T025 [US1] AI test: pleasure indicator on cycling routes in tests/ai/us1-bike-routes.md (covers FR-009, US1 scenario 4)
- [X] T026 [US1] AI test: single cycling route, no detours in tests/ai/us1-bike-routes.md (covers FR-007, FR-008)
- [X] T027 [US1] AI test: no cycling route found in tests/ai/us1-bike-routes.md (covers FR-007, FR-010)
- [X] T028 [US1] AI test: cycling routing service fails in tests/ai/us1-bike-routes.md (covers FR-010)
- [X] T029 [US1] AI test: long ride, pleasure unavailable in tests/ai/us1-bike-routes.md (covers FR-009)
- [X] T030 [US1] AI test: car routes have no pleasure indicator in tests/ai/us1-bike-routes.md (covers FR-009)

### Implementation for User Story 1

- [ ] T006 [US1] Add the `bike` entry to `TRAVEL_MODES` in src/geo.js after `car`: `{ label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", noun: "cycling", by: "by bike", pleasure: true, detours: false }`; mention bike in the comment above `routeUrl` (depends on T002)
- [ ] T007 [P] [US1] Replace the mode radio group in index.html with three labels in the order Walk, Car, Bike, keeping `<div id="mode" role="radiogroup" aria-label="Travel mode">`: `<label><input type="radio" name="mode" value="foot" checked> <span aria-hidden="true">🚶</span> Walk</label>`, `<label><input type="radio" name="mode" value="car"> <span aria-hidden="true">🚗</span> Car</label>`, `<label><input type="radio" name="mode" value="bike"> <span aria-hidden="true">🚲</span> Bike</label>` — plain `<label>` with no attributes, text ending right after the label word (contracts/ui.md; FR-001, FR-002)
- [ ] T008 [P] [US1] Restyle `#mode` in styles.css as a segmented control using mock B's look from specs/pilot-45168-bicycle-track/design-options.html (research R3): `#mode` → `display:flex; margin:6px 0 0; border:1px solid #ccc; border-radius:6px; overflow:hidden; font-size:14px` (replace the current `gap:12px` rule); `#mode label` → `flex:1; text-align:center; padding:6px 0; border-left:1px solid #ccc; cursor:pointer; position:relative`; `#mode label:first-child` → `border-left:0`; `#mode label:has(input:checked)` → `background:#e8f0fe; color:#1a73e8; font-weight:600`; `#mode label:has(input:focus-visible)` → `outline:2px solid #1a73e8; outline-offset:-2px`; radios hidden but focusable (no `display:none`, no `visibility:hidden`): `#mode input { position:absolute; opacity:0; width:1px; height:1px; margin:0; }`
- [ ] T009 [US1] Check in src/app.js that the radio `change` handler at the bottom accepts `bike` (it tests `radio.value in TRAVEL_MODES`, so no change is expected) and that `grep -nE '(===?|!==?) *"(foot|car|bike)"' src/app.js` prints nothing (depends on T003, T006)
- [ ] T010 [US1] Run `npm test`; all tests in test/bike.contract.test.js and test/modes.test.js must pass (depends on T006, T007, T008)

**Checkpoint**: Bike mode works end to end for a destination without stops; Walk/Car unchanged

---

## Phase 4: User Story 2 - Switch between modes without losing context (Priority: P2)

**Goal**: Switching Walk ↔ Bike ↔ Car keeps the destination and stops and recomputes routes for the selected mode; late results from an old mode are ignored.

**Independent Test**: With a destination and two stops, switch Walk → Bike → Car → Bike: destination and stops stay, routes are recomputed each time through the stops in order; switching rapidly leaves only the last mode's routes (quickstart.md rows 6–7; tests/ai/us2-mode-switching.md).

### Tests for User Story 2

- [X] T031 [US2] Contract test for routeUrl in bike mode through the stops in list order in test/bike.contract.test.js (covers FR-005, US2 scenario 2)
- [X] T032 [US2] AI test: Walk → Bike keeps the destination in tests/ai/us2-mode-switching.md (covers FR-006, US2 scenario 1)
- [X] T033 [US2] AI test: cycling routes go through the stops in list order in tests/ai/us2-mode-switching.md (covers FR-005, US2 scenario 2)
- [X] T034 [US2] AI test: Walk → Bike → Car → Bike keeps destination and stops in tests/ai/us2-mode-switching.md (covers FR-006, US2 scenario 1, 2)
- [X] T035 [US2] AI test: late results from a previous mode are ignored in tests/ai/us2-mode-switching.md (covers FR-011, US2 scenario 3)

### Implementation for User Story 2

- [ ] T011 [US2] Review `updateRoutes` and the mode `change` handler in src/app.js and confirm (no change expected; fix only if broken) that: `currentPlace` and `stops` are not reset on mode change (FR-006); `clearRoutes()` runs before each request so no routes from a previous mode remain on error or no-route (FR-010); results with `seq !== routeSeq` are dropped and `pleasureAbort` is aborted (FR-011)
- [ ] T012 [US2] Run `npm test`; "routeUrl bike mode passes through the stops in list order" must pass (depends on T006)

**Checkpoint**: Both user stories work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and end-to-end validation

- [ ] T013 [P] Update README.md (FR-012): first paragraph says you can switch between walking, car and bike, and that walking and bike routes get the pleasure indicator — remove the words "(walking only)" (test/bike.integration.test.js rejects "walking only"); add a bullet "Bike routes: OSRM bike profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, with the pleasure indicator and without detour routes."; change the Pleasure bullet from "along each walking route" / "the walk is very long" to "along each walking or cycling route" / "the route is very long"
- [ ] T014 Run the endpoint smoke check and the manual checks 1–9 in specs/pilot-45168-bicycle-track/quickstart.md, and the AI scenarios in tests/ai/us1-bike-routes.md and tests/ai/us2-mode-switching.md; if the bike endpoint is unreachable from the build environment (the planning sandbox got HTTP 403), record that in the PR description instead of changing the URL
- [ ] T015 Final `npm test` run; confirm all tests in test/ pass (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T003 refactor is what makes Bike wording and pleasure/detour flags work)
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational; needs T006 (the `bike` entry) to be meaningful, so do it after US1 in practice
- **Polish (Phase 5)**: Depends on US1 and US2

### Within Each Phase

- T002 → T003 → T004; T005 after T003
- T006 → T009, T010; T007 and T008 any time after Phase 2
- T011 independent; T012 after T006

### Parallel Opportunities

- T007 (index.html) and T008 (styles.css) in parallel with each other and with T006 (src/geo.js)
- T013 (README.md) in parallel with anything after T006

---

## Parallel Example: User Story 1

```bash
# After Phase 2, in parallel:
Task: "T006 TRAVEL_MODES.bike in src/geo.js"
Task: "T007 segmented mode selector markup in index.html"
Task: "T008 segmented control styles in styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (baseline: only the new tests fail) → Phase 2 (metadata refactor, Walk/Car unchanged)
2. Phase 3 → Bike selectable with cycling routes, pleasure, wording
3. **STOP and VALIDATE** with quickstart.md rows 1–5

### Incremental Delivery

1. Setup + Foundational → no visible change, tests green
2. + US1 → MVP (Bike mode)
3. + US2 → mode switching with stops verified and tested
4. + Polish → README and full quickstart run

---

## Notes

- [P] tasks = different files, no dependencies
- Do not add detour logic, distance-limit changes or mode persistence for bike (spec assumptions, research R4)
- Commit after each phase
