---

description: "Task list for PILOT-97524: show the arrival time for each route"
---

# Tasks: Show the arrival time for each route

**Input**: Design documents from `/specs/pilot-97524-show-the-arrival-time-for-each-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/arrival.md, quickstart.md

**Tests**: The tests already exist (write-tests gate, commit 6890210) and are recorded below as completed test tasks (`[X]`) in each user story phase. They are the red phase: they fail until the implementation tasks are done. Do **not** rewrite, weaken or delete them. The implementation tasks make them pass.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story this task belongs to (US1, US2)
- Paths are relative to the repository root (single project: `src/`, `test/`, `tests/ai/`, `README.md`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the red phase. The repo has no build step and needs no new dependencies, so there is no project initialization.

- [ ] T001 Run `npm test` and confirm that only the new arrival tests in test/arrival.test.js and test/arrival-panel.test.js fail (no `arrivalTime`/`formatArrival` exports and no arrival text yet), and that every existing test (test/geo.test.js, test/routes.test.js L1–L8, test/modes.test.js, test/pleasure.test.js, test/stops.test.js) passes. Change no file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure helpers in src/geo.js that both user stories depend on (research R1–R4, R8; contracts/arrival.md).

**⚠️ CRITICAL**: Do not start any user story work until this phase is complete.

- [ ] T002 Implement `export function arrivalTime(departure, durationSeconds)` in src/geo.js, right after `formatDuration`. Validation rule (data-model.md): "`departure` must be a valid `Date`, and `duration` must be finite and ≥ 0. Otherwise the display is `""`". Return `null` unless `departure instanceof Date && !Number.isNaN(departure.getTime())` and `typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds >= 0`. Otherwise return `new Date(Math.round((departure.getTime() + durationSeconds * 1000) / 60000) * 60000)` (nearest minute, half a minute rounds up; research R3). Never read the clock and never mutate `departure`.
- [ ] T003 Implement `export function formatArrival(departure, durationSeconds)` in src/geo.js, directly after `arrivalTime` (depends on T002). Return `""` when `arrivalTime(...)` is `null`. Otherwise build `HH:MM` from the arrival's local `getHours()`/`getMinutes()` with `String(n).padStart(2, "0")`; do not use `toLocaleTimeString` or `Intl` (research R2). Compute `dayOffset = Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(departure.getFullYear(), departure.getMonth(), departure.getDate())) / 86400000)` from local calendar fields, so it is DST-safe (research R4). Suffix: `""` for 0, `" (+1 day)"` for 1, `` ` (+${n} days)` `` for n ≥ 2. Return `` `arrive ${hh}:${mm}${suffix}` ``.
- [ ] T004 Update the header comment at the top of src/geo.js so the "formatting" line mentions arrival times, e.g. "formatting (distance, duration, arrival clock time if leaving now)". Keep the words `document`, `window` and `fetch(` out of the file (guard test L6 in test/routes.test.js).
- [ ] T005 Run `npm test`, `TZ=Pacific/Kiritimati npm test` and `TZ=America/New_York npm test`. Every test in test/arrival.test.js must pass in all three, and every existing test must stay green. test/arrival-panel.test.js still fails until Phase 3.

**Checkpoint**: The helpers are complete and pass their contract tests. The panel wiring can now start.

---

## Phase 3: User Story 1 - See when I will arrive on each route (Priority: P1) 🎯 MVP

**Goal**: Each route entry in the panel reads `Route N · <distance> · <duration>, arrive HH:MM[ (+N day[s])]`. The arrival is computed from one departure instant, taken when the route results are received for display.

**Independent Test**: The US1 tests in test/arrival-panel.test.js pass. Manually: run `npm start`, open http://localhost:8000, allow location access, and search for a destination. Every route row shows `, arrive HH:MM`, equal to the current clock plus that row's duration, within 1 minute (quickstart steps 1–2; US1 scenarios 1–4; SC-001, SC-002).

### Tests for User Story 1

- [X] T014 [US1] Contract test for the formatArrival examples of contracts/arrival.md (14:32, 11:05, 14:33 half-minute rounding, 08:05, 00:01, zero and sub-minute durations, +1/+2/+3 days) in test/arrival.test.js (covers FR-001, FR-002, FR-003, FR-004, US1 scenario 1, 3, 4)
- [X] T015 [US1] Contract test for arrivalTime rounding and purity, invalid input ('' / null) and locale independence in test/arrival.test.js (covers FR-002, FR-003, edge invalid duration)
- [X] T016 [US1] Contract test for DST spring-forward and fall-back days in America/New_York in test/arrival.test.js (covers FR-003, FR-004, edge daylight-saving)
- [X] T017 [US1] Integration test for panel titles "25 min, arrive 14:32", "1 h 10 min, arrive 11:05", "arrive 00:15 (+1 day)" and 14:33 rounding in test/arrival-panel.test.js (covers FR-001, FR-002, FR-003, FR-004, US1 scenario 1, 3, 4)
- [X] T018 [US1] Integration test for several car routes, walking routes with the pleasure line, and a route with a stop in test/arrival-panel.test.js (covers FR-001, FR-006, SC-001, US1 scenario 2)
- [X] T019 [US1] Integration test for departure taken when results arrive and for a route with a missing duration in test/arrival-panel.test.js (covers FR-002, SC-002, edge missing duration)
- [X] T020 [US1] Integration test for unchanged status line, no earliest-arrival mark and arrival in the accessible name in test/arrival-panel.test.js (covers FR-006, FR-008, FR-011)
- [X] T021 [US1] Integration test for no arrival left after a no-route or failed computation in test/arrival-panel.test.js (covers FR-007)
- [X] T022 [US1] AI test: arrival times in the panel (one, three, stop, long, midnight, no route, narrow panel, earliest arrival) in tests/ai/us1-arrival-time.md (covers FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, SC-001, SC-002, SC-004, US1 scenario 1, 2, 3, 4)

### Implementation for User Story 1

- [ ] T006 [US1] In src/app.js, add `formatArrival` to the existing `import { … } from "./geo.js"` list at the top of the file (next to `formatDuration`).
- [ ] T007 [US1] In src/app.js `drawRoutes` (around line 211), add a `departure` parameter: `function drawRoutes(routes, m, departure)`. Inside the `routes.forEach` loop, compute `const arrival = formatArrival(departure, route.duration);` and set the title text to `` `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}${arrival ? `, ${arrival}` : ""}` ``. When `arrival` is `""` (missing or invalid duration), leave the suffix out for that route only. Do not change the pleasure span, the button structure, `aria-pressed`, the polyline or the status line (FR-006, FR-008, FR-011; research R6). Do not add a span or CSS; the text wraps in the button (FR-009).
- [ ] T008 [US1] In src/app.js `updateRoutes()` (around lines 333–335), after `if (seq !== routeSeq) return;` and the `if (!routes.length) return setStatus(…)` line, add `const departure = new Date(); // "leave now" = when the routes are shown (FR-002)` and call `drawRoutes(routes, m, departure);` (research R5). Leave the status summary line (`const summary = …`) unchanged: it is out of scope per spec Assumptions.
- [ ] T009 [US1] Run `npm test`: all US1 tests in test/arrival-panel.test.js and every existing test pass. Then do quickstart.md steps 1–2 and 7 manually: every row shows `, arrive HH:MM`, and the pleasure line and status summary look the same as before.

**Checkpoint**: US1 is fully functional. Routes show arrival times on first display.

---

## Phase 4: User Story 2 - Arrival time refreshes when routes are recomputed (Priority: P2)

**Goal**: Each recomputation (travel mode change, new destination, stop added/removed/reordered/cleared, location becoming available for a waiting route) clears the old arrival times and shows new ones based on that computation's instant. The passage of time and later position updates change nothing (FR-005, FR-010; research R7).

**Independent Test**: The US2 tests in test/arrival-panel.test.js pass. Manually: show routes, wait at least one minute (the times do not change), then switch Walk → Car or add a stop. The new rows' arrival times equal the new current time plus the new durations (quickstart steps 3–5; US2 scenarios 1–2; SC-003).

### Tests for User Story 2

- [X] T023 [US2] Integration test for travel mode switch at 14:12 giving 14:12 + new durations in test/arrival-panel.test.js (covers FR-005, SC-003, US2 scenario 1)
- [X] T024 [US2] Integration test for adding, reordering, removing and clearing stops in test/arrival-panel.test.js (covers FR-005, US2 scenario 2)
- [X] T025 [US2] Integration test for a new destination and for the location becoming available for a waiting route in test/arrival-panel.test.js (covers FR-005)
- [X] T026 [US2] Integration test for no change on later position updates or the passage of time in test/arrival-panel.test.js (covers FR-010, edge passage of time)
- [X] T027 [US2] Integration test for old arrivals removed when recomputation starts and superseded results not shown in test/arrival-panel.test.js (covers SC-003, edge newer request supersedes)
- [X] T028 [US2] AI test: arrival refresh on mode, stops, destination, location; no refresh on time or movement; no leftovers in tests/ai/us2-arrival-refresh.md (covers FR-002, FR-005, FR-010, SC-003, US2 scenario 1, 2)

### Implementation for User Story 2

- [ ] T010 [US2] Verify in src/app.js that every recomputation trigger calls `updateRoutes()` and that only `updateRoutes()` calls `drawRoutes`. Known call sites: the location becoming available (`if (pendingRoute && currentPlace) updateRoutes();`, around line 87), the destination change in `showRoute` (around line 303), the stop changes through `setStops` (around line 393, covering add, remove, reorder and clear), and the mode change (around line 422). Confirm that the position-update handler calls `updateRoutes()` only when `pendingRoute` is true (FR-010) and that src/app.js has no `setInterval(` that touches the route titles. If a trigger bypasses `updateRoutes()`, route it through `updateRoutes()`; otherwise make no code change.
- [ ] T011 [US2] Run `npm test`: all US2 tests in test/arrival-panel.test.js pass. Then do quickstart.md steps 3–6 manually: wait a minute with no change; switch Walk → Car; add, reorder, remove and clear stops; pick a destination with no route or go offline. After each recomputation the arrival times are fresh, and no arrival is shown when there is no route (FR-007).

**Checkpoint**: US1 and US2 both work. Arrival times are always from the latest computation.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation.

- [ ] T012 [P] In README.md, extend the opening paragraph sentence "shows up to 3 routes to it, each with distance and duration" to say that each route also shows the arrival clock time if you leave now (24-hour, e.g. "25 min, arrive 14:32", with "(+1 day)" after midnight), updated whenever the routes are computed again. Keep the words "up to 3" and "pleasure" (guard test L3 in test/routes.test.js).
- [ ] T013 Run the full quickstart.md validation: `npm test`, `TZ=Pacific/Kiritimati npm test` and `TZ=America/New_York npm test` all pass (every test, including test/arrival.test.js and test/arrival-panel.test.js), then the manual browser steps 1–7. Run `git diff --stat 6890210 -- src test tests README.md package.json` and confirm that the implementation changed only src/geo.js, src/app.js and README.md: the test files (test/arrival.test.js, test/arrival-panel.test.js, test/support/app-harness.js, tests/ai/us1-arrival-time.md, tests/ai/us2-arrival-refresh.md) are unchanged since the write-tests gate, and package.json has no dependencies (L8).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001)**: no dependencies. It confirms the committed tests fail for the right reason.
- **Foundational (Phase 2, T002–T005)**: needs T001. T002 → T003 → T004 are in the same file (src/geo.js), so they run in sequence. T005 needs T002–T004. **Blocks both stories.**
- **US1 (Phase 3, T006–T009)**: needs Phase 2. T006 → T007 → T008 → T009 (T006–T008 are in the same file, src/app.js).
- **US2 (Phase 4, T010–T011)**: needs T008, because the per-computation `departure` capture in `updateRoutes()` is what the US2 tests check. Its own code change is usually none.
- **Polish (Phase 5)**: T012 can run any time after Phase 2. T013 runs last.

### Test tasks (red phase)

- The completed test tasks recorded in each user story phase (T014 and later) are already written and committed. They define "done" for the implementation tasks of their phase: the contract tests in test/arrival.test.js turn green with Phase 2; the panel tests in test/arrival-panel.test.js turn green with T008 (US1) and stay green through T010 (US2). The AI test files in tests/ai/ run later, on the running app.
- Their IDs come after T013 because the write-tests record step numbers them after the highest existing ID. Their position in the phase, not their number, shows when they apply.

### User Story Dependencies

- **US1 (P1)**: depends only on Phase 2.
- **US2 (P2)**: builds on US1's wiring (the departure is captured per `updateRoutes()` call). The refresh behaviour itself comes from the existing single `updateRoutes()` entry point.

### Within Each User Story

- The tests already exist and fail first. Implement until they pass; never edit them to pass.
- Imports (T006), then rendering (T007), then capturing the departure (T008).

### Parallel Opportunities

- T012 (README.md) can run in parallel with any task in Phase 3 or Phase 4, because it touches a different file.
- Most other tasks share `src/geo.js` or `src/app.js`, so they are sequential by design. The feature is small (about 30 lines of code).

---

## Parallel Example: User Story 1

```bash
# While US1 wiring is in progress in src/app.js, the README can be updated independently:
Task: "T007 [US1] Append ', arrive …' to the title in drawRoutes in src/app.js"
Task: "T012 [P] Mention the arrival time in README.md"
```

## Parallel Example: User Story 2

```bash
# Trigger verification and README are in different files:
Task: "T010 [US2] Verify every recomputation goes through updateRoutes() in src/app.js"
Task: "T012 [P] Mention the arrival time in README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: confirm the red phase (T001).
2. Phase 2: helpers (T002–T005); the contract tests pass.
3. Phase 3: panel wiring (T006–T009); the US1 panel tests pass.
4. **Stop and validate**: routes show `, arrive HH:MM`, which is the MVP. Because `updateRoutes()` already re-runs on every trigger, refreshing works in practice at this point.

### Incremental Delivery

1. Setup + Foundational: the helpers pass in every time zone.
2. US1: arrival times appear in the panel (demo).
3. US2: the refresh guarantees are verified by the US2 panel tests and manually.
4. Polish: README and the full quickstart.

---

## Notes

- `src/geo.js` must stay pure: no `document`, `window`, or `fetch(` (L6).
- Do not add dependencies (L8). Do not change `npm test`.
- The existing export list in L7 doesn't need updating. The new exports are covered by test/arrival.test.js.
- contracts/arrival.md already has the corrected rows (22:00 + 26 h → `(+2 days)`, 22:00 + 50 h → `(+3 days)`), matching the tests.
- Commit after each phase.
