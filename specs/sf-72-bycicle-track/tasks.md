---
description: "Task list for SF-72 Bicycle Travel Mode"
---

# Tasks: Bicycle Travel Mode

**Input**: Design documents from `/specs/sf-72-bycicle-track/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/travel-modes.md, quickstart.md

**Tests**: Already written by the write-tests gate and recorded below as completed tasks: `test/bike.test.js`, the key-list update in `test/modes.test.js`, the OSRM fake `test/fakes/osrm.js` (checked against `.factory/schemas/osrm-http.md`, see `.factory/test-env.md`), and the AI scenarios in `tests/ai/`. The implementation makes them pass. It must not edit them, except the bike profile assertions if T015 forces the `driving` fallback. SC-004: every other existing test keeps passing unchanged.

**Organization**: Tasks are grouped by user story. US2 and US3 need almost no new code: the existing mode-change listener, `routeSeq` and stops pipeline already cover them (research R5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3)

## Path Conventions

Flat static app at the repository root: `index.html`, `styles.css`, `src/geo.js`, `src/app.js`, `test/*.test.js`, `tests/ai/*.md`, `README.md`. No build step and no dependencies. Unit/contract tests: `npm test`.

---

## Phase 1: Setup

**Purpose**: Confirm the baseline. No project initialization is needed.

- [ ] T001 Run `npm test` from the repository root. The expected result before any change: the new tests in test/bike.test.js and the key-list test in test/modes.test.js fail, and every other test passes (baseline for SC-004).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mode data and helpers that every story reads.

- [ ] T002 In src/geo.js, extend `TRAVEL_MODES` exactly as in data-model.md. `foot`: `icon: "🚶"`, `pleasure: true`, `detours: true`. `car`: `icon: "🚗"`, `pleasure: false`, `detours: false`. New `bike: { label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike", pleasure: true, detours: false }`. Keep the existing `label`/`base`/`profile` values of foot and car unchanged, and keep the key order foot, car, bike. Do not change the `routeUrl` logic: it must still fall back to `foot` for unknown keys. Update the file header comment and the comment above `routeUrl` to mention the bicycle mode ("bike" profile gives cycling routes). src/geo.js must stay free of `document`, `fetch(` and `window` (test L6).
- [ ] T003 In src/geo.js, export `isNoRouteResponse(json)`: it returns `true` only when `json` is an object whose `code` is `"NoRoute"` or `"NoSegment"`, and `false` for any other code (`"InvalidQuery"`, `"InvalidValue"`, `"TooBig"`, `"Ok"`, …) and for `null`, `undefined`, strings and `{}` (contracts/travel-modes.md §6, research R7).
- [ ] T004 In src/app.js, add a `MODE_TEXT` constant next to the other constants, with exactly these values (data-model.md ModeText): `foot: { computing: "Computing walking routes…", noRoute: "No walking route found.", single: "on foot", plural: "walking" }`, `car: { computing: "Computing driving routes…", noRoute: "No driving route found.", single: "by car", plural: "driving" }`, `bike: { computing: "Computing cycling routes…", noRoute: "No cycling route found.", single: "by bike", plural: "cycling" }`. The literal `"No walking route found."` must stay in src/app.js (test L5).

**Checkpoint**: The §1 contract tests in test/bike.test.js, the isNoRouteResponse test and the test/modes.test.js key-list test pass.

---

## Phase 3: User Story 1 - Get cycling routes to a destination (Priority: P1) 🎯 MVP

**Goal**: Select "🚲 Bike" in a segmented selector (design C) and get up to 3 cycling routes with distance, duration, selection and the pleasure indicator. "No cycling route found." when the service has no route.

**Independent Test**: tests/ai/us1-cycling-routes.md (quickstart.md steps 1–3).

### Tests for User Story 1

- [X] T017 [US1] Contract test for TRAVEL_MODES bike/foot/car entries, key order and flags (§1) in test/bike.test.js (covers FR-001, FR-002, FR-005, FR-006, SC-004, US1 scenario 2, 6)
- [X] T018 [US1] Contract test for TRAVEL_MODES key list with bike base/profile in test/modes.test.js (covers FR-001, FR-002)
- [X] T019 [US1] Contract test for routeUrl bike mode: server, profile, alternatives, explicit base (§2) in test/bike.test.js (covers FR-002, FR-003, US1 scenario 2)
- [X] T020 [US1] Contract test for bike requests against the OSRM docs, fake self-check and documented bike response in test/bike.test.js with test/fakes/osrm.js (covers FR-002, FR-003, US1 scenario 2)
- [X] T021 [US1] Contract test for isNoRouteResponse and its use in app.js (§6) in test/bike.test.js (covers FR-007, US1 scenario 5)
- [X] T022 [US1] Contract test for selector markup and segmented CSS, no nested-icon padding (§3, §4) in test/bike.test.js (covers FR-001, US1 scenario 1)
- [X] T023 [US1] Contract test for app.js texts, flag reading and pleasure tooltip (§5) in test/bike.test.js (covers FR-005, FR-006, FR-007, SC-004, US1 scenario 4, 6)
- [X] T024 [US1] AI test: cycling routes (selector, routes, pleasure, selection, no route, no detours, long trip, durations) in tests/ai/us1-cycling-routes.md (covers FR-001 to FR-007, SC-002, US1 scenario 1–6)

### Implementation for User Story 1

- [ ] T005 [P] [US1] In index.html, replace the two radio labels inside `<div id="mode" role="radiogroup" aria-label="Travel mode">` with the exact markup of contracts/travel-modes.md §3: three `<label><input type="radio" name="mode" value="…"><span><span aria-hidden="true">ICON</span> Label</span></label>` for foot (🚶 Walk, `checked`), car (🚗 Car) and bike (🚲 Bike), in that order.
- [ ] T006 [P] [US1] In styles.css, replace the `#mode` rule with the design C segmented control from contracts/travel-modes.md §4:
  - `#mode { display:flex; margin:6px 0 0; border:1px solid #1a73e8; border-radius:6px; overflow:hidden; font-size:14px; }`
  - `#mode label { flex:1; position:relative; }` and `#mode label + label { border-left:1px solid #1a73e8; }`
  - `#mode input { position:absolute; opacity:0; width:1px; height:1px; margin:0; }`
  - `#mode input + span { display:block; text-align:center; padding:6px 8px; color:#1a73e8; cursor:pointer; }`
  - `#mode input:checked + span { background:#1a73e8; color:#fff; font-weight:600; }`
  - `#mode input:focus-visible + span { outline:2px solid #1a73e8; outline-offset:-4px; }` (use a white outline colour on the checked segment if needed for contrast)
  - Never write a descendant `#mode span` / `#mode label span` rule that sets display or padding: it would put the emoji on its own line.
- [ ] T007 [US1] In src/app.js `fetchRoutes`, replace the condition `m !== "foot"` with `!TRAVEL_MODES[m].detours`, so the line reads `if (main.length >= 2 || !TRAVEL_MODES[m].detours) return pickRoutes(main);`. Update the comment above it to say forced detours are walking-only (FR-006). (Depends on T002.)
- [ ] T008 [US1] In src/app.js, make the routing requests handle OSRM's "no route" answer (contracts §6). Add a routing fetch (for example `fetchRouteJson(url)`): on a non-OK response, read the JSON body (ignore a body that is not JSON). If `isNoRouteResponse(body)` is true, return the body, so `parseRoutes` gives `[]`. Otherwise throw `new Error(\`Request failed (${res.status})\`)` as today. Import `isNoRouteResponse` from ./geo.js. Use it for the main request and the detour requests in `fetchRoutes`. Leave `fetchJson` for search unchanged. (Depends on T003 and T007, same file.)
- [ ] T009 [US1] In src/app.js `drawRoutes`, replace `if (m === "foot")` with `if (TRAVEL_MODES[m].pleasure)` when creating the `.pleasure` span (FR-005). In `scorePleasure`, change the title text to `"Green pixels (parks, grass, woods) on the map along this route; more is more pleasant"`. (Depends on T008, same file.)
- [ ] T010 [US1] In src/app.js `updateRoutes`, use `const t = MODE_TEXT[m];` and replace the `m === "car"` ternaries:
  - `setStatus(t.computing)` and `const noRoute = t.noRoute;`
  - single route: `` `${summary} ${t.single}${via}` ``
  - several routes: `` `${routes.length} ${t.plural} routes${via} · fastest ${summary}` ``
  - replace `const car = …` / `if (!car) scorePleasure(place, seq, st);` with `if (TRAVEL_MODES[m].pleasure) scorePleasure(place, seq, st);`
  - Keep the error branch (`Routing failed: …` / `${noRoute} (…)`) and the stops suffixes unchanged.

  The resulting Walk and Car strings must be identical to today's (FR-007, SC-004). (Depends on T004 and T009, same file.)
- [ ] T011 [US1] Run `npm test`: all tests pass except the README test (T014). Then perform tests/ai/us1-cycling-routes.md with the common setup in tests/ai/README.md.

**Checkpoint**: The Bike mode works end to end for a direct trip (MVP).

---

## Phase 4: User Story 2 - Switch to and from Bike for the current destination (Priority: P2)

**Goal**: Switching modes recomputes routes for the same destination. Stale results never replace the routes of the current mode.

**Independent Test**: tests/ai/us2-switch-modes.md (quickstart.md steps 4 and 7).

- [X] T025 [US2] Contract test for switching mode with the same points and stops (§2) in test/bike.test.js (covers FR-008, US2 scenario 1, 2, US3 scenario 2)
- [X] T026 [US2] AI test: switch Walk/Bike/Car, slow bike answer, bike server unreachable in tests/ai/us2-switch-modes.md (covers FR-005, FR-008, FR-010, US2 scenario 1–3)
- [ ] T012 [US2] Check the mode listener at the end of src/app.js (`for (const radio of document.querySelectorAll("input[name=mode]"))`). It must accept `bike` through `radio.value in TRAVEL_MODES`, set `mode`, and call `updateRoutes()` when `currentPlace` is set. Confirm that `updateRoutes` captures `m = mode` and `seq = ++routeSeq`, returns early when `seq !== routeSeq`, and calls `clearRoutes()` before fetching (FR-008, FR-010, edge case "service unreachable"). Make no change unless this check fails; if it does, fix it in src/app.js. Then perform tests/ai/us2-switch-modes.md.

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - Cycling routes with stops (Priority: P3)

**Goal**: Bike routes pass through every stop in list order. Stops are kept when switching modes.

**Independent Test**: tests/ai/us3-bike-stops.md (quickstart.md step 5).

- [X] T027 [US3] Contract test for routeUrl bike stops in list order (§2) in test/bike.test.js (covers FR-009, US3 scenario 1)
- [X] T028 [US3] AI test: bike route through 2 stops, stops kept across modes in tests/ai/us3-bike-stops.md (covers FR-008, FR-009, US3 scenario 1, 2)
- [ ] T013 [US3] Confirm that `fetchRoutes` in src/app.js passes `stops: st` to `routeUrl` for every mode and skips detours when stops exist (the `st.length > 0` branch), and that the mode listener does not touch `stops` (FR-009, FR-008). Make no change unless this check fails. Then perform tests/ai/us3-bike-stops.md.

**Checkpoint**: All user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T029 Contract test for README Bike mode, routed-bike and pleasure for walking and bike in test/bike.test.js (covers FR-011)
- [ ] T014 [P] Update README.md (FR-011):
  - Change the intro sentence to "Switch between walking, car and bike in the panel; walking and bike routes also get a pleasure indicator."
  - Add a bullet after "Car routes": "Bike routes: OSRM bike profile (`routing.openstreetmap.de/routed-bike`), up to 3 alternatives, with the pleasure indicator; no detour routes are added."
  - In the Pleasure bullet, change "along each walking route" to "along each walking and bike route" and "the walk is very long" to "the trip is very long".
  - Remove "(walking only)" from the intro.
  - Keep "up to 3" and "pleasure" in the README (test L3).
- [ ] T015 Run quickstart.md step 6 (`curl` the live routed-bike endpoint). If `{"code":"Ok"` is not returned because the `bike` segment is rejected, change `TRAVEL_MODES.bike.profile` in src/geo.js to `"driving"` and update the matching assertions in test/modes.test.js and test/bike.test.js (research R1). If the network is blocked, record that the check could not be run.
- [ ] T016 Run `npm test` and confirm the whole suite passes: existing tests unchanged except the recorded key-list update in test/modes.test.js, and test/bike.test.js passes (SC-004).

---

## Dependencies & Execution Order

- **Phase 1 (T001)** → **Phase 2 (T002, T003, T004)** → **US1** → **US2 / US3** (checks plus AI scenarios; they can run in parallel after US1) → **Polish**.
- Within US1: T005 and T006 are [P] (different files). T007 → T008 → T009 → T010 run in order (same file, src/app.js) after Phase 2. T011 comes last.
- T014 (README) can run any time. T015 can run any time. T016 needs everything else.

## Parallel Example: User Story 1

```text
# After Phase 2, in parallel:
T005  index.html selector markup
T006  styles.css segmented control
# Then sequentially in src/app.js:
T007 → T008 → T009 → T010 → T011
```

## Implementation Strategy

- **MVP**: Phases 1–3 (T001–T011) deliver a working Bike mode with the new selector. Stop and validate with tests/ai/us1-cycling-routes.md.
- **Increment 2**: T012–T013 confirm switching and stops (no expected code change).
- **Finish**: T014–T016 cover the README, the live endpoint check and the full test run.

## Notes

- Choices made without asking (non-interactive run): OSRM "no route" (HTTP 400 `NoRoute`/`NoSegment`) shows "No … route found." in all modes (T003, T008; spec Clarifications, to confirm).
- Keep src/geo.js pure (no DOM or fetch), and add no dependencies (test L8).
