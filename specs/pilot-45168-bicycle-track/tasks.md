---
description: "Task list for the Bicycle Travel Mode"
---

# Tasks: Bicycle Travel Mode

**Input**: Design documents from `/specs/pilot-45168-bicycle-track/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (travel-modes.md, osrm-bike.md, mode-selector.md), quickstart.md

**Tests**: The plan asks for unit tests of the pure helpers in `src/geo.js` (`node --test test/`): bike URLs, the
`TRAVEL_MODES` table, and updating the existing two-mode test. There are no DOM tests, because the project has none. UI behavior is
checked by hand with `quickstart.md`.

**Organization**: Tasks are grouped by user story. US1 = get cycling routes (P1). US2 = switch modes without losing context (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1, US2)

---

## Phase 1: Setup

**Purpose**: Confirm the baseline before changing anything.

- [ ] T001 Run `npm test` from the repo root (runs `node --test test/`) and record that all existing tests pass before any change; no file is modified

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Add per-mode metadata to `TRAVEL_MODES` so `app.js` stops branching on `"car"` and `"foot"`. US1 and US2 both depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 In `src/geo.js`, extend the existing `TRAVEL_MODES` entries with the data-model fields, keeping `label`, `base` and `profile` of `foot` and `car` byte-for-byte unchanged: `foot` gets `icon: "🚶", noun: "walking", adverb: "on foot", pleasure: true, detours: true`; `car` gets `icon: "🚗", noun: "driving", adverb: "by car", pleasure: false, detours: false`. Update the header comment on line 2 and the comment above `routeUrl` to mention cycling
- [ ] T003 In `src/app.js` `updateRoutes()`, replace the `m === "car"` ternaries with `const tm = TRAVEL_MODES[m] || TRAVEL_MODES.foot` and the strings `` `Computing ${tm.noun} routes…` ``, `` `No ${tm.noun} route found.` ``, `` `${summary} ${tm.adverb}${via}` `` and `` `${routes.length} ${tm.noun} routes${via} · fastest ${summary}` ``. Call `scorePleasure(place, seq, st)` only when `tm.pleasure`. The text for walk and car must stay exactly as today
- [ ] T004 In `src/app.js` `drawRoutes(routes, m)`, create the `.pleasure` span when `(TRAVEL_MODES[m] || TRAVEL_MODES.foot).pleasure` instead of `m === "foot"`. In `fetchRoutes`, replace `m !== "foot"` with `!(TRAVEL_MODES[m] || TRAVEL_MODES.foot).detours`, so forced detours stay walking-only (FR-008). In `scorePleasure`, change the tooltip "along this walk" to "along this route"
- [ ] T005 [P] In `test/modes.test.js`, add a test that `foot` and `car` have the data-model values from T002 (`icon`, `noun`, `adverb`, `pleasure`, `detours`) and that their `base` and `profile` are unchanged

**Checkpoint**: `npm test` passes. Walk and car behave exactly as before.

---

## Phase 3: User Story 1 - Get cycling routes to a destination (Priority: P1) 🎯 MVP

**Goal**: The user selects "🚲 Bike" in a three-segment selector and gets up to 3 cycling routes (distance, duration, pleasure line, selectable), with cycling wording.

**Independent Test**: `npm test` passes. Then follow quickstart.md steps 1–4, 6 and 7: the selector shows 🚶 Walk | 🚗 Car | 🚲 Bike, selecting Bike shows "Computing cycling routes…" and then 1–3 routes with shorter durations than walking, each with a pleasure line and one marked "most pleasant", and routes can be selected in the list or on the map.

### Tests for User Story 1

- [ ] T006 [P] [US1] In `test/modes.test.js`, update the existing test `"TRAVEL_MODES offers walking and car"` (rename to `"TRAVEL_MODES offers walking, car and bike"`): `Object.keys(TRAVEL_MODES)` must deep-equal `["foot", "car", "bike"]` (insertion order = UI order), loop the label checks over all three keys, and keep the existing foot/car `base`/`profile` assertions. Add `TRAVEL_MODES.bike` assertions: `label "Bike"`, `icon "🚲"`, `base "https://routing.openstreetmap.de/routed-bike"`, `profile "bike"`, `noun "cycling"`, `adverb "by bike"`, `pleasure true`, `detours false`
- [ ] T007 [US1] In `test/modes.test.js`, add a `BIKE` constant `` `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson` `` and tests: `routeUrl(from, to, undefined, { mode: "bike" }) === BIKE`; with `alternatives: 3` → `` `${BIKE}&alternatives=3` ``; with an explicit base `"https://example.test"` → `` `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson` `` (contracts/travel-modes.md)

### Implementation for User Story 1

- [ ] T008 [US1] In `src/geo.js`, add `bike: { label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", noun: "cycling", adverb: "by bike", pleasure: true, detours: false }` as the last entry of `TRAVEL_MODES`, after `car` (key order `foot`, `car`, `bike`). T006 and T007 now pass
- [ ] T009 [P] [US1] In `index.html`, replace the `#mode` radiogroup content with three labels in this order, keeping `role="radiogroup" aria-label="Travel mode"`: `<label><input type="radio" name="mode" value="foot" checked><span aria-hidden="true">🚶</span> Walk</label>`, the same with `value="car"` / 🚗 / Car, and the same with `value="bike"` / 🚲 / Bike (contracts/mode-selector.md). Walk stays `checked` (FR-002)
- [ ] T010 [P] [US1] In `styles.css`, restyle `#mode` as a segmented control: segments flush side by side (`display: flex; gap: 0`) with a shared border and rounded outer corners. `#mode label` is `flex: 1`, centered, with padding and `cursor: pointer`. Hide each `#mode input` visually with the clip pattern (`position: absolute; opacity: 0; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)`), not `display: none`, so it stays focusable and arrow keys still work. Style the selected segment with `#mode label:has(input:checked) { background: #1a73e8; color: #fff; }` and give it a focus ring with `#mode label:has(input:focus-visible) { outline: 2px solid #1a73e8; outline-offset: 2px; }`
- [ ] T011 [US1] In `src/app.js`, check that the existing mode `change` listener (`for (const radio of document.querySelectorAll("input[name=mode]"))`) accepts `"bike"` through `radio.value in TRAVEL_MODES` without changes, and that a failed or empty bike request shows the cycling text from T003 (`No cycling route found.`, or `Routing failed: …`) with `clearRoutes()` already run, so no routes from another mode are left (FR-010)

**Checkpoint**: US1 works on its own: bike routes with pleasure, cycling wording, three-segment selector.

---

## Phase 4: User Story 2 - Switch between modes without losing context (Priority: P2)

**Goal**: Switching Walk ↔ Bike ↔ Car keeps the destination and stops, recomputes routes through the stops in order for the new mode, and ignores late results.

**Independent Test**: `npm test` passes. Then follow quickstart.md step 5: with a destination and two stops, switch Walk → Bike → Car → Bike. The destination and stops are kept, routes go through the stops in order, the wording follows the mode, and car routes have no pleasure line.

### Tests for User Story 2

- [ ] T012 [P] [US2] In `test/stops.test.js`, add `const BIKE = "https://routing.openstreetmap.de/routed-bike/route/v1/bike";` and a test that `routeUrl(from, to, undefined, { stops: [s1, s2], mode: "bike", alternatives: 3 })` equals `` `${BIKE}/2.35,48.85;2.37,48.852;2.34,48.857;2.36,48.86${Q}&alternatives=3` `` (FR-005), and that `{ stops: [], mode: "bike" }` gives the same URL as `{ mode: "bike" }`

### Implementation for User Story 2

- [ ] T013 [US2] In `src/app.js`, check that the mode `change` handler only sets `mode` and calls `updateRoutes()`, leaving `currentPlace` and `stops` alone (FR-006). Also check that `updateRoutes()` captures `m`, `place` and `st` before the `await`, and drops results when `seq !== routeSeq` in both `updateRoutes` and `scorePleasure` (FR-011). Change code only if one of these does not hold

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T014 [P] In `README.md`: change the intro sentence to "Switch between walking, car and bike in the panel; walking and cycling routes also get a pleasure indicator". Add a bullet "Bike routes: OSRM bike profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, with the pleasure indicator and without detour routes" (FR-012). Change the Pleasure bullet from "each walking route" / "the walk" to "each walking or cycling route" / "the route"
- [ ] T015 Run `npm test` from the repo root: all tests pass (SC-005; the only existing test changed is the one updated in T006)
- [ ] T016 Make one real request to `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=false&alternatives=3` (e.g. with `curl`) and check that the response has `"code":"Ok"` and `routes[].distance`/`duration`, as in contracts/osrm-bike.md. If the endpoint or profile differs, fix `TRAVEL_MODES.bike` and T006/T007/T012 to match. This was not possible during planning because of the network approval
- [ ] T017 Follow quickstart.md manual steps 1–7 in a browser (`npm start`, http://localhost:8000)

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T005)** → **US1 (T006–T011)** → **US2 (T012–T013)** → **Polish (T014–T017)**
- T003 and T004 both edit `src/app.js`: do them one after the other. T005 depends on T002.
- In US1, T006/T007 (tests) come before T008 (they fail first, then pass). T009 and T010 can run in parallel with T008. T011 depends on T003 and T008.
- US2 depends on the bike mode from T008. T012 can be written in parallel with T013.
- T014 can run any time after T008. T015–T017 come last.

### User Story Dependencies

- **US1 (P1)**: depends only on the Foundational phase.
- **US2 (P2)**: depends on US1's `TRAVEL_MODES.bike` (T008). It mostly checks behavior that already exists.

## Parallel Example: User Story 1

```text
# After T002–T004:
T006 then T007 (same file: test/modes.test.js)
T009 (index.html)   T010 (styles.css)   # in parallel with each other and with the tests
then T008 (src/geo.js), then T011 (src/app.js check)
```

## Parallel Example: User Story 2

```text
T012 (test/stops.test.js)  ||  T013 (src/app.js review)
```

## Implementation Strategy

1. **MVP**: Phases 1–3 (T001–T011). Bike routes with pleasure in a three-segment selector. Ship-ready on its own.
2. **Increment**: Phase 4 (T012–T013) locks in mode switching with stops.
3. **Finish**: Phase 5 (README, full test run, live endpoint check, manual quickstart).
