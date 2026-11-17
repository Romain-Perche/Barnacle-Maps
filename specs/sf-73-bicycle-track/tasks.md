---
description: "Task list for the Bicycle Travel Mode (SF-73)"
---

# Tasks: Bicycle Travel Mode

**Input**: Design documents from `/specs/sf-73-bicycle-track/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/travel-modes.md, quickstart.md

**Tests**: The `/write-tests` gate already wrote the tests (listed as completed `[X]` tasks in each story phase). Implementation tasks make them pass. Do not weaken or delete them. Run with `npm test` (`node --test test/`). The AI scenarios in `tests/ai/` run after Build.

**Organization**: Tasks are grouped by user story. Paths are relative to the repository root (flat layout: `src/`, `test/`, `index.html`, `styles.css`, `README.md`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (US1, US2, US3)

## Constraints that apply to every task

- No npm dependencies and no build step (test `L8 no_new_dependencies`).
- `src/geo.js` must stay pure: it must not contain the substrings `document`, `fetch(` or `window` (test `L6 geo_module_pure`). Watch comments too.
- `src/app.js` must keep containing `parseRoutes`, `pickRoutes`, `detourWaypoints`, `routeSeq`, `clearRoutes`, `Promise.allSettled`, `Pleasure unavailable`, `aria-pressed` (tests L4/L5).
- Walk and Car texts and behaviour stay identical to today (SC-004). The one exception is research R8: an OSRM "NoRoute" answer now shows the mode's "No … route found." text.
- Do not edit `test/fakes/` or `tests/ai/` to make a test pass. They model the outside services (`.factory/test-env.md`).

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Run `npm test` from the repository root and record the baseline. The SF-73 tests in `test/bike.test.js`, `test/selector.test.js`, `test/bike-app.test.js`, `test/modes.test.js` ("TRAVEL_MODES offers walking, car and bike") fail. All others pass.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Per-mode data in `TRAVEL_MODES`, which `src/app.js` and every story rely on (research R2, data-model.md).

**⚠️ CRITICAL**: No user story work can start until this phase is done.

- [ ] T002 Extend `TRAVEL_MODES` in `src/geo.js` so it has exactly three keys in this insertion order: `foot`, `car`, `bike`. Every entry has all of these fields (from data-model.md):
  - `label`: `Walk` / `Car` / `Bike`
  - `icon`: `🚶` / `🚗` / `🚲`
  - `base`: `https://routing.openstreetmap.de/routed-foot` / `https://routing.openstreetmap.de/routed-car` / `https://routing.openstreetmap.de/routed-bike`
  - `profile`: `foot` / `driving` / `bike`
  - `pleasure`: `true` / `false` / `true`
  - `detours`: `true` / `false` / `false`
  - `computing`: `Computing walking routes…` / `Computing driving routes…` / `Computing cycling routes…` (use the `…` character, U+2026)
  - `noRoute`: `No walking route found.` / `No driving route found.` / `No cycling route found.`
  - `single`: `on foot` / `by car` / `by bike`
  - `plural`: `walking` / `driving` / `cycling`

  Validation rules to respect: "Every entry has every field. Strings are non-empty."; "`pleasure` is false only for car (FR-008). `detours` is true only for foot (FR-009)."; "Foot/car texts must equal today's literals in `src/app.js`". Do not change the signature of `routeUrl`. Done when `test/bike.test.js` and `test/modes.test.js` pass.
- [ ] T003 Update the comments in `src/geo.js`: the file header ("OSRM walking, car and bike routes") and the comment above `routeUrl` (add `"bike" cycling routes; the OSRM server ignores the profile segment`). Do not write `fetch(`, `document` or `window` in the comments.

**Checkpoint**: `test/bike.test.js` and `test/modes.test.js` pass. Bike exists in data but not yet in the UI.

---

## Phase 3: User Story 1 - Get cycling routes to a destination (Priority: P1) 🎯 MVP

**Goal**: The selector shows design C (🚶 Walk | 🚗 Car | 🚲 Bike). Selecting Bike gives up to 3 cycling routes with distance, duration, pleasure indicator and cycling texts.

**Independent Test**: Select Bike, search a destination 3–5 km away. Up to 3 routes appear, the status says "Computing cycling routes…" then "N cycling routes · fastest …" or "… by bike", and the pleasure lines appear with one marked "most pleasant".

### Tests for User Story 1

- [X] T017 [US1] Contract test for TRAVEL_MODES fields and routeUrl bike requests in test/bike.test.js (covers FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-009, FR-010, US1 scenario 2, 4, 5)
- [X] T018 [US1] Contract test for the design C selector markup and styles in test/selector.test.js (covers FR-001, FR-002, US1 scenario 1)
- [X] T019 [US1] Contract test for the fake OSRM against the OSRM HTTP docs in test/osrm-fake.test.js (covers FR-003, US1 scenario 5)
- [X] T020 [US1] Unit test for the travel mode list (walking, car and bike) in test/modes.test.js (covers FR-001)
- [X] T021 [US1] Unit test for the shipped strings in app.js + geo.js (L5) in test/routes.test.js (covers FR-005, SC-004)
- [X] T022 [US1] Integration test for cycling routes, texts, selection, pleasure, no detours, no route, errors and no position yet in test/bike-app.test.js (covers FR-002, FR-003, FR-004, FR-005, FR-008, FR-009, US1 scenario 2, 3, 4, 5, 6)
- [X] T023 [US1] AI test: selector, cycling routes on the real map, texts, pleasure in tests/ai/us1-cycling-routes.md (covers FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, US1 scenario 1, 2, 3, 4, 5, 6)

### Implementation for User Story 1

- [ ] T004 [P] [US1] Replace the `#mode` block in `index.html` with the design C markup from `contracts/travel-modes.md`. Keep `<div id="mode" role="radiogroup" aria-label="Travel mode">` with three `<label><input type="radio" name="mode" value="…"><span><span aria-hidden="true">ICON</span> Label</span></label>`, in order foot (`🚶` Walk, `checked`), car (`🚗` Car), bike (`🚲` Bike). Walk stays the default (FR-002).
- [ ] T005 [P] [US1] Replace the `#mode` rule in `styles.css` with a segmented row (design C, values from `design-options.html`):
  - `#mode { display: flex; margin: 6px 0 0; font-size: 14px; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; }` (no `gap`)
  - `#mode label { flex: 1; position: relative; }`
  - `#mode label + label { border-left: 1px solid #dadce0; }`
  - `#mode input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }` (visually hidden but still focusable; never `display:none`)
  - `#mode input + span { display: block; padding: 6px 8px; text-align: center; cursor: pointer; }`
  - `#mode input:checked + span { background: #e8f0fe; color: #1a73e8; font-weight: 600; }`
  - `#mode input:focus-visible + span { outline: 2px solid #1a73e8; outline-offset: -2px; }`

  Keep the existing `#routes` rules (test L2). Done when `test/selector.test.js` passes.
- [ ] T006 [US1] In `src/app.js` `updateRoutes()`: set `const cfg = TRAVEL_MODES[m];` and replace the car/foot ternaries:
  - status → `setStatus(cfg.computing)`
  - `const noRoute = cfg.noRoute;`
  - summary → `` `${summary} ${cfg.single}${via}` `` for one route, `` `${routes.length} ${cfg.plural} routes${via} · fastest ${summary}` `` for several
  - replace `if (!car) scorePleasure(place, seq, st);` with `if (cfg.pleasure) scorePleasure(place, seq, st);`

  Remove the now-unused `car` variable (FR-005). Depends on T002.
- [ ] T007 [US1] In `src/app.js` `drawRoutes(routes, m)`: create the pleasure span when `TRAVEL_MODES[m].pleasure` instead of `m === "foot"` (FR-008). Depends on T002.
- [ ] T008 [US1] In `src/app.js` `fetchRoutes()`: replace `m !== "foot"` with `!TRAVEL_MODES[m].detours` so bike gets no side-waypoint detours (FR-009). Keep the `Promise.allSettled` and `detourWaypoints` code for foot. Depends on T002.
- [ ] T009 [US1] In `src/app.js` `scorePleasure()`: change the tooltip `title` from "…along this walk; more is more pleasant" to `Green pixels (parks, grass, woods) on the map along this route; more is more pleasant` (contract, research R4). Keep `Pleasure unavailable` and the limits unchanged.
- [ ] T010 [US1] In `src/app.js`, make the main route request in `fetchRoutes()` treat an OSRM "no route" answer as an empty result (research R8, contract "OSRM response consumed"):
  - Add a helper next to `fetchJson`, for example `fetchRouteJson(url)`. If the response status is 400 and its JSON body has `code === "NoRoute"`, return that body (`parseRoutes` then gives `[]`).
  - Any other non-OK status throws `Request failed (N)` as today.
  - Keep `fetchJson` for search and detours.

  Result: `updateRoutes()` shows `No cycling route found.`, or `No cycling route found. Try removing a stop.` with stops (US1 scenario 5).
- [ ] T011 [US1] Run `npm test`. Confirm that `test/bike.test.js`, `test/selector.test.js`, `test/routes.test.js` and the US1/FR/edge tests in `test/bike-app.test.js` pass.

**Checkpoint**: US1 is fully usable. Bike routes work end to end with design C.

---

## Phase 4: User Story 2 - Switch between walk, bike and car (Priority: P2)

**Goal**: Switching mode with a destination set recomputes routes for the new mode without a new search, and only the last selected mode's results are shown.

**Independent Test**: With a destination set, switch Walk → Bike → Car → Bike, including quick repeated clicks. Each switch replaces the routes and the destination is kept.

- [X] T024 [US2] Integration test for switching Walk/Bike/Car and late results in test/bike-app.test.js (covers FR-006, US2 scenario 1, 2, 3)
- [X] T025 [US2] AI test: switch modes on the real map, quick clicks in tests/ai/us2-switch-modes.md (covers FR-006, US2 scenario 1, 2, 3)
- [ ] T012 [US2] Check the mode `change` listener at the bottom of `src/app.js`. It must still work with the new markup: it selects `input[name=mode]`, guards with `radio.value in TRAVEL_MODES`, sets `mode`, and calls `updateRoutes()` when `currentPlace` is set. Also check that `updateRoutes()` still increments `routeSeq`, aborts `pleasureAbort`, and drops stale results (FR-006, research R6). Expected: no code change. Done when the `US2 …` tests in `test/bike-app.test.js` pass.

**Checkpoint**: Mode switching works between all three modes.

---

## Phase 5: User Story 3 - Cycling routes with stops (Priority: P3)

**Goal**: Bike routes pass through every stop in list order, and stops survive mode switches.

**Independent Test**: Add 2 stops, select Bike and a destination. The route passes both stops in order, and switching modes keeps them.

- [X] T026 [US3] Integration test for cycling routes through stops and stops kept across modes in test/bike-app.test.js (covers FR-007, US3 scenario 1, 2)
- [X] T027 [US3] AI test: bike route through two map stops in tests/ai/us3-stops.md (covers FR-007, US3 scenario 1, 2)
- [ ] T013 [US3] Confirm in `src/app.js` that `fetchRoutes` passes `stops: st` to `routeUrl` for every mode, and that the stops early return (`if (st.length > 0) return pickRoutes(main);`) stays before the detours check. Confirm that the mode `change` listener does not touch `stops`. Expected: no code change. Done when the `US3 …` tests in `test/bike-app.test.js` pass.

**Checkpoint**: All three stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Update `README.md` (FR-010):
  - the intro sentence becomes "Switch between walking, bike and car in the panel; walking and bike routes also get a pleasure indicator"
  - add a bullet "Bike routes: OSRM bike profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, with the pleasure indicator and without detour routes"
  - the Pleasure bullet says "along each walking or cycling route"

  Keep the words "up to 3" and "pleasure" (test L3).
- [ ] T015 Run `npm test` and confirm everything is green, with no new dependencies in `package.json` (L8).
- [ ] T016 Run the live `curl` check in quickstart.md against `routed-bike`. It needs network approval for `routing.openstreetmap.de`. If the server rejects the `bike` segment, set `TRAVEL_MODES.bike.profile` to `driving` and update the expected URLs in `test/bike.test.js`, `test/modes.test.js` and `test/bike-app.test.js`. If the network is not available, record that the live check was not run.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T003)** → user stories.
- **US1 (T004–T011)** depends on T002. T004 (`index.html`) and T005 (`styles.css`) can run in parallel with each other and with T006. T006–T010 all edit `src/app.js` and run one after another. T011 comes last.
- **US2 (T012)** and **US3 (T013)** depend on US1's `src/app.js` edits. They are independent of each other.
- **Polish**: T014 can run any time after T002. T015 and T016 come last.

## Parallel Example: User Story 1

```text
T004 index.html | T005 styles.css | T006→T010 src/app.js (sequential)
then T011
```

## Implementation Strategy

- **MVP**: Phases 1–3 (T001–T011). Bike routes with design C are the whole value of the request.
- **Increment 2**: US2 is verification only (the existing `routeSeq` logic already covers it).
- **Increment 3**: US3 is verification only (stops already flow through `routeUrl`).
- Finish with the README and a full test run.

