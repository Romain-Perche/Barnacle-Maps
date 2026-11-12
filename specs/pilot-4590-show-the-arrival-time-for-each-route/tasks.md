---

description: "Task list for PILOT-4590: show the arrival time for each route"
---

# Tasks: Show the Arrival Time for Each Route

**Input**: Design documents from `/specs/pilot-4590-show-the-arrival-time-for-each-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/arrival-helpers.md, contracts/route-entry-ui.md, quickstart.md

**Tests**: Already written and committed before implementation (write-tests gate): `test/arrival.test.js`, `test/route-entry.test.js` and `tests/ai/*.md`. They are listed below as completed `[X]` test tasks inside each story phase. They fail until the implementation tasks are done. **Do not recreate or rewrite these files**; extend them only if a case is missing, and do not duplicate their cases in `test/geo.test.js`. Tests use the built-in `node:test` + `node:assert/strict` (`npm test`, i.e. `node --test test/`). No dependencies may be added.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own. Test task IDs come after the implementation task IDs because they were recorded after task generation; their position in each phase, not their ID, gives the order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2)

## Path Conventions

Single static project, no build step: logic in `src/geo.js` (pure: no DOM, no fetch, never reads the current time itself), wiring in `src/app.js`, deterministic tests in `test/`, AI scenarios in `tests/ai/`, docs in `README.md`.

**Reference rule (spec FR-002, the only formula used everywhere)**: displayed minutes = `max(1, round(seconds / 60))` (halves up, via `Math.round`), with a missing, non-numeric, non-finite or negative duration counted as `0`. Arrival `at` = departure with seconds and milliseconds zeroed + displayed minutes × 60 000 ms (epoch arithmetic). The label is `arrive HH:MM`, plus `" (+1 day)"` when the local calendar date of `at` is one day after the departure's date, or `" (+N days)"` for N ≥ 2.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before changing anything. No project initialization is needed (existing repo, no dependencies).

- [ ] T001 Run `npm test` from the repo root. Confirm every existing suite in `test/` (geo, modes, pleasure, routes, stops) passes, and that the new suites `test/arrival.test.js` and `test/route-entry.test.js` fail (expected: no implementation yet; the two daylight-saving tests skip unless `TZ=Europe/Paris`). Record any other pre-existing failure in the PR description instead of fixing it here

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: One shared "displayed minutes" helper so the duration text and the arrival time can never disagree (plan step 1, data-model.md "Validation and invariants").

**⚠️ CRITICAL**: US1 needs this helper before the arrival helpers can be written.

- [ ] T002 In `src/geo.js`, add and export `durationMinutes(seconds)` directly above `formatDuration`: return `Math.max(1, Math.round(s / 60))` where `s = (typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0) ? seconds : 0` (so missing, non-numeric, non-finite or negative durations count as 0 and give 1). Then change `formatDuration(seconds)` to use `const mins = durationMinutes(seconds);` instead of its inline `Math.max(1, Math.round(seconds / 60))`; leave the rest of `formatDuration` (`"N min"`, `"H h M min"`, `"H h"`) unchanged. Run `npm test`: the existing `test/geo.test.js` assertions still pass, and the `durationMinutes` / `formatDuration` contract tests in `test/arrival.test.js` now pass

**Checkpoint**: `formatDuration` behaves as before for valid input and reads `1 min` for invalid input (FR-007's only allowed change).

---

## Phase 3: User Story 1 - See when I will arrive on each route (Priority: P1) 🎯 MVP

**Goal**: Every route entry's title reads `Route n · <distance> · <duration>, arrive HH:MM[ (+N day[s])]`, in walking and car mode, with and without stops; the pleasure line stays below, unchanged.

**Independent Test**: `npm test` passes the US1 tests of `test/arrival.test.js` and `test/route-entry.test.js`; then `npm start`, open http://localhost:8000, search a destination 1–3 km away, and check each route reads `… · NN min, arrive HH:MM` where HH:MM = the clock shown when the routes appeared + NN (quickstart.md manual steps 1–3, 7).

### Tests for User Story 1 ⚠️

> Already written (see the `[X]` test tasks recorded here). They must fail before T003–T007 and pass after.

- [X] T013 [US1] Contract test for formatArrival with every row of contracts/arrival-helpers.md (14:07:40+25 min, rounding, half minute, 40 min with a stop, whole hour, 1 h 20 min, short and invalid durations, padding, midnight, several days, 23:59:59+1 s) in test/arrival.test.js (covers FR-002, FR-003, FR-004, US1 scenario 1, 5)
- [X] T014 [US1] Contract test for formatClock, arrivalTime { at, dayOffset } and helpers that never read the clock in test/arrival.test.js (covers FR-002, FR-003, FR-004)
- [X] T015 [US1] Contract test for durationMinutes and formatDuration of invalid durations ("1 min") in test/arrival.test.js (covers FR-002, FR-007)
- [X] T016 [US1] Contract test for three routes with their own arrival, monotonic arrival and the at = clock + shown minutes / < 90 s property in test/arrival.test.js (covers FR-002, US1 scenario 2, SC-002)
- [X] T017 [US1] Contract test for daylight-saving spring forward and fall back under TZ=Europe/Paris in test/arrival.test.js (covers FR-004)
- [X] T018 [US1] Integration test for the route title wiring (import, drawRoutes(routes, m, departure), title template, pleasure span separate, no aria-label) in test/route-entry.test.js (covers FR-001, FR-005, FR-007, FR-008, US1 scenario 1, 3, 4, 5)
- [X] T019 [US1] Integration test for the status summary without clock time in test/route-entry.test.js (covers FR-007, spec Assumptions)
- [X] T020 [US1] Integration test for the README arrival-time line in test/route-entry.test.js (covers spec Assumptions)
- [X] T021 [US1] Integration test for pure arrival helpers in src/geo.js (no Date.now, no argument-less new Date) in test/route-entry.test.js (covers FR-002, plan Constitution Check)
- [X] T022 [US1] AI test: walking routes show their arrival time in tests/ai/us1-arrival-time.md (covers FR-001, FR-002, FR-003, FR-005, FR-007, US1 scenario 1, 2, 3)
- [X] T023 [US1] AI test: car routes show their arrival time in tests/ai/us1-arrival-time.md (covers FR-001, FR-005, US1 scenario 4)
- [X] T024 [US1] AI test: a route with a stop shows the arrival at the final destination in tests/ai/us1-arrival-time.md (covers FR-005, US1 scenario 5)
- [X] T025 [US1] AI test: an arrival after midnight shows the later day in tests/ai/us1-arrival-time.md (covers FR-004)
- [X] T026 [US1] AI test: the arrival is part of the accessible name in tests/ai/us1-arrival-time.md (covers FR-008)
- [X] T027 [US1] AI test: a narrow panel wraps the text and never cuts it in tests/ai/us1-arrival-time.md (covers FR-001)

### Implementation for User Story 1

- [ ] T003 [US1] In `src/geo.js`, below `formatDuration`, add and export `arrivalTime(departure, seconds)` returning `{ at, dayOffset }`: `const start = new Date(departure.getTime()); start.setSeconds(0, 0);` then `at = new Date(start.getTime() + durationMinutes(seconds) * 60000)` (epoch arithmetic, DST-safe); `dayOffset = Math.round((Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) - Date.UTC(departure.getFullYear(), departure.getMonth(), departure.getDate())) / 86400000)` (local calendar dates, integer ≥ 0). Must not call `Date.now()` or `new Date()` without an argument, and must not mutate `departure` (depends on T002)
- [ ] T004 [US1] In `src/geo.js`, add and export `formatClock(date)`: `` `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` `` (local time, 24-hour, no `Intl`/locale formatting)
- [ ] T005 [US1] In `src/geo.js`, add and export `formatArrival(departure, seconds)`: `const { at, dayOffset } = arrivalTime(departure, seconds);` return `` `arrive ${formatClock(at)}` `` + (`dayOffset === 1` ? `" (+1 day)"` : `dayOffset > 1` ? `` ` (+${dayOffset} days)` `` : `""`). Update the header comment of `src/geo.js` to mention arrival-time formatting among the pure helpers (depends on T003, T004)
- [ ] T006 [US1] In `src/app.js`, add `formatArrival` to the existing `import { … } from "./geo.js"` list; change `function drawRoutes(routes, m)` to `function drawRoutes(routes, m, departure)` and set the title to `` `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}, ${formatArrival(departure, route.duration)}` ``. Keep the title as the existing single `<span>` inside the route `<button>` (no new element, no `aria-label`, no CSS change) so the button's accessible name includes the arrival text (FR-008); the `.pleasure` `<span>` stays a separate element appended after it (depends on T005)
- [ ] T007 [US1] In `updateRoutes()` in `src/app.js`, right after `if (!routes.length) return setStatus(…);` (which comes after the `if (seq !== routeSeq) return;` guard), add `const departure = new Date();` and change the call to `drawRoutes(routes, m, departure);`. Do not change the `#status` summary line (it keeps `formatDuration(fastest.duration)` with no clock time). Run `npm test` and confirm the US1 tests now pass (depends on T006)

**Checkpoint**: US1 is complete: every listed route shows its arrival time; manual quickstart steps 1–3 and 7 pass.

---

## Phase 4: User Story 2 - Arrival time stays consistent with freshly computed routes (Priority: P2)

**Goal**: Every recomputation (destination, mode, stop add/remove/reorder including removing the last stop, first computation after the location arrives) shows arrival times from the time its own routes arrived; superseded, failed or empty computations show none; nothing else (route selection, pleasure scores, time passing) changes the text.

**Independent Test**: Show routes, wait ≥ 1 minute, switch walking ↔ car: the new arrival times use the new clock. Select another route and wait for the pleasure scores: no arrival text changes (quickstart.md manual steps 4–6). Automated: the US2 tests of `test/route-entry.test.js` pass.

### Tests for User Story 2 ⚠️

> Already written (see the `[X]` test tasks recorded here).

- [X] T028 [US2] Integration test for the departure captured once per computation after the latest-request guard, and every recomputation path going through updateRoutes in test/route-entry.test.js (covers FR-002, FR-006, US2 scenario 1, 2, SC-003)
- [X] T029 [US2] Integration test for arrival text changing only on recomputation (no timer, selection and pleasure never touch it) in test/route-entry.test.js (covers FR-006, US2 scenario 3)
- [X] T030 [US2] AI test: a recomputation uses the new clock in tests/ai/us2-recomputed-arrival.md (covers FR-006, US2 scenario 1, 2)
- [X] T031 [US2] AI test: stop changes and a new destination recompute the arrival in tests/ai/us2-recomputed-arrival.md (covers FR-006, US2 scenario 2)
- [X] T032 [US2] AI test: time passing, selecting a route and pleasure scores do not change the arrival in tests/ai/us2-recomputed-arrival.md (covers FR-006, US2 scenario 3)
- [X] T033 [US2] AI test: no route and a routing error leave no arrival time in tests/ai/us2-recomputed-arrival.md (covers FR-006, SC-003)

### Implementation for User Story 2

- [ ] T008 [US2] Review every caller of `updateRoutes()` in `src/app.js` (destination choice, mode switch, stop add/remove/move/clear including removing the last stop, and the `if (pendingRoute && currentPlace) updateRoutes();` position path) and confirm each reaches the single `const departure = new Date()` from T007 with no separate draw path; if any path calls `drawRoutes` without going through `updateRoutes`, route it through `updateRoutes` instead. Expected result: no code change (research.md R2); record the outcome in the PR description (depends on T007)
- [ ] T009 [US2] Confirm in `src/app.js` that `updateRoutes()` calls `clearRoutes()` before `await fetchRoutes(`, and that the error branch (`catch (err)`) and the empty branch (`if (!routes.length)`) return before `drawRoutes`, so they show only the existing status message and no route entries or arrival times (spec edge cases "No route found / routing error" and "Superseded computation", SC-003); do not change those messages. Run `npm test` and confirm the US2 tests pass

**Checkpoint**: US1 and US2 both work; all automated tests pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation.

- [ ] T010 [P] In `README.md`, add one line after the existing feature description on line 3 (near the route description): each route shows its duration and the arrival time if you leave now ("25 min, arrive 14:32"); the arrival time is the current time plus the routing duration only, with no traffic and no waiting time at stops
- [ ] T011 Run `npm test`, `TZ=Europe/Paris npm test` (the daylight-saving tests must run, not skip) and `TZ=America/New_York npm test` from the repo root; all must pass with identical non-DST results (depends on T007, T009, T010)
- [ ] T012 Run the manual checks of `specs/pilot-4590-show-the-arrival-time-for-each-route/quickstart.md` (steps 1–8, step 8 optional) with `npm start` at http://localhost:8000, and the AI scenarios in `tests/ai/` (setup in `tests/ai/fixtures.md`; needs https://unpkg.com for Leaflet); also check in a narrow window that the title wraps inside the route button, is not truncated, and the pleasure line stays below it (FR-001). If the network or a browser is unavailable in the environment, state which steps were not run

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: After Setup; BLOCKS US1 (T003 uses `durationMinutes`)
- **US1 (Phase 3)**: After Foundational
- **US2 (Phase 4)**: After US1 (spec: "It depends on Story 1 existing"; the US2 checks need the `departure` wiring of T007)
- **Polish (Phase 5)**: T010 can start any time (the README test passes only after it); T011–T012 after US1 and US2

### Within Each Story

- The `[X]` test tasks of each phase are already done; they are the target the implementation tasks make pass.
- US1: T003 → T004 → T005 (same file `src/geo.js`, sequential) → T006 → T007 (same file `src/app.js`, sequential)
- US2: T008 → T009

### Task-level dependencies

- T003 depends on T002; T005 depends on T003, T004
- T006 depends on T005; T007 depends on T006
- T008, T009 depend on T007
- T011 depends on T007, T009, T010; T012 depends on T011

## Parallel Opportunities

Few: the feature touches three source files and the tests are already written. What can run in parallel:

- T010 (`README.md`) with any other task
- T004 (`formatClock`) with T003 (`arrivalTime`) by two people only if they coordinate edits in `src/geo.js`; otherwise keep them sequential

## Parallel Example: User Story 1

```bash
# Developer A: helpers, then wiring
Task: "T003–T005 Add arrivalTime, formatClock, formatArrival in src/geo.js"
Task: "T006–T007 Wire formatArrival and the departure capture in src/app.js"
# Anyone, any time
Task: "T010 Add the arrival-time line to README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002)
3. Phase 3: US1 (T003–T007)
4. **STOP and VALIDATE**: `npm test` (US1 tests pass), quickstart manual steps 1–3 and 7

Because every recomputation already goes through `updateRoutes()`, the MVP already refreshes arrival times on recomputation; US2 confirms this and makes its tests pass.

### Incremental Delivery

1. Setup + Foundational → `formatDuration` safe for invalid durations
2. US1 → arrival time visible on every route (MVP)
3. US2 → recomputation and no-change rules verified by tests and manual checks
4. Polish → README line, multi-TZ test run, full quickstart and AI scenarios

---

## Notes

- Do not add dependencies, a build step, timers, new DOM elements or CSS.
- Do not change the `#status` summary line.
- Helpers in `src/geo.js` must never read the current time; only `updateRoutes()` in `src/app.js` does (`new Date()` once per computation).
- Do not recreate or rewrite the committed test files; never weaken a test to make it pass.
- Checklist notes that mention "nearest-minute rounding" are historical; the spec Clarifications are the reference.
- Commit after each phase.
