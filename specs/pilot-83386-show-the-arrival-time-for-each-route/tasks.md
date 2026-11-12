---

description: "Task list for PILOT-83386: Show the arrival time for each route"
---

# Tasks: Show the arrival time for each route

**Input**: Design documents from `/specs/pilot-83386-show-the-arrival-time-for-each-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/route-entry.md, quickstart.md

**Tests**: Included, and already written by the write-tests step: `test/arrival.test.js` (deterministic, `node:test` + `node:assert/strict`, run with `npm test` = `node --test test/`) and the AI scenarios in `tests/ai/`. They are recorded below as completed test tasks in each user story phase. **Do not create, recreate or overwrite `test/arrival.test.js` or `tests/ai/*.md`**: implement the code until those tests pass.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are given in each description

## Path Conventions

Single static web app, no build step: `src/` and `test/` at the repository root (`src/geo.js` = pure helpers, `src/app.js` = DOM/fetch glue). AI test scenarios live in `tests/ai/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before any change. No project initialization or new dependencies are needed (plan.md: "No new dependencies").

- [ ] T001 Run `npm test` from the repository root. Confirm the 5 earlier suites in test/ (geo, modes, pleasure, routes, stops) all pass. test/arrival.test.js is expected to FAIL at this point (it imports `arrivalTime`/`formatArrival`, which don't exist yet, and checks src/app.js and README.md); that is the expected red state, not a broken baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure arrival-time helpers in `src/geo.js` that both user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `export function arrivalTime(departure, seconds)` to src/geo.js right after `formatDuration` (around line 23–29). Per plan.md Implementation Notes §1: `const ms = Math.round((+departure + seconds * 1000) / 60000) * 60000; const a = new Date(ms); const d = new Date(+departure);` then `dayOffset = Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000)`; return `{ hours: a.getHours(), minutes: a.getMinutes(), dayOffset }`. Data-model constraints: `hours` "integer 0–23", `minutes` "integer 0–59", `dayOffset` "integer ≥ 0" ("Number of local calendar dates between departure and arrival", not elapsed hours / 24); `seconds` "is a finite number ≥ 0"; "`departure` may be a `Date` or epoch milliseconds". Must be pure (never read the current clock). Add a one-line comment above it explaining rounding of the exact arrival instant to the nearest minute (exactly 30 s rounds up) and the calendar-date day offset (DST-safe)
- [ ] T003 Add `export function formatArrival(departure, seconds)` to src/geo.js right after `arrivalTime`: call `arrivalTime`, zero-pad with `String(n).padStart(2, "0")`, return `` `arrive ${HH}:${MM}` `` plus `" (+1 day)"` when `dayOffset === 1` or `` ` (+${dayOffset} days)` `` when `dayOffset >= 2`, nothing when `dayOffset === 0`. Do NOT use `Intl` / `toLocaleTimeString` (research.md R4: fixed 24-hour `HH:MM` regardless of locale)
- [ ] T004 Update the header comment at the top of src/geo.js (lines 1–4) to mention arrival time formatting (e.g. "formatting (distance, duration, arrival time), …"); keep geo.js free of DOM access and fetch
- [ ] T005 Run `npm test`, then `TZ=Pacific/Auckland npm test` and `TZ=America/New_York npm test`. All `arrivalTime` / `formatArrival` / monotonicity / SC-002 / US2-scenario tests in test/arrival.test.js must pass in every time zone; only the `integration:` tests (src/app.js source and README) may still fail at this point

**Checkpoint**: Helpers exist, are exported from src/geo.js, and every contract table row passes.

---

## Phase 3: User Story 1 - See when I would arrive on each route (Priority: P1) 🎯 MVP

**Goal**: Every route entry in the panel reads `Route N · <distance> · <duration>, arrive HH:MM` (plus ` (+1 day)` / ` (+N days)`), for walking and car, with or without stops, all sharing one departure moment per computation.

**Independent Test**: `npm start`, allow location, search a destination 1–3 km away: each route entry shows `, arrive HH:MM` ≈ current time + its duration (±1 min); longer routes never show earlier times; status line has no "arrive"; switch to Car and add a stop, entries still show arrival times (quickstart.md §2 steps 1–3, 5).

### Tests for User Story 1

(Already written; see the completed test tasks recorded below.)

- [X] T015 [US1] Contract test for arrivalTime (every contracts/route-entry.md row, rounding 29 s/30 s, exact-instant rounding, zero time, calendar-date day offset, epoch ms, DST nights) in test/arrival.test.js (covers FR-002, FR-004, US1 scenario 1)
- [X] T016 [US1] Contract test for formatArrival (same day, +1 day, +N days, rounding past midnight, HH:MM 24-hour without AM/PM, fixed word "arrive", long and very short trips) in test/arrival.test.js (covers FR-001, FR-003, FR-004, US1 scenario 1)
- [X] T017 [US1] Unit test for monotonic arrivals, same-duration routes 1 min apart, and SC-002 within 30 s in test/arrival.test.js (covers FR-002, US1 scenario 2, SC-002)
- [X] T018 [US1] Integration test for the route title text "Route N · distance · duration, arrive HH:MM" wired in drawRoutes, pleasure and selection unchanged, README mention, geo.js pure in test/arrival.test.js (covers FR-001, FR-005, FR-008, FR-009, US1 scenario 1, 3, 4, SC-001, SC-004, SC-005)
- [X] T019 [US1] AI test: walk, car, stop, long trip, next-day and routing-failure scenarios in tests/ai/us1-arrival-time.md (covers FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, FR-009, FR-010, US1 scenario 1, 2, 3, 4)

### Implementation for User Story 1

- [ ] T006 [US1] In src/app.js add `formatArrival` to the existing `import { … } from "./geo.js"` list at the top of the file (line 1)
- [ ] T007 [US1] In src/app.js change `function drawRoutes(routes, m)` (around line 211) to `function drawRoutes(routes, m, departure)` and set the title text (around line 219) to exactly `` `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}, ${formatArrival(departure, route.duration)}` `` (test/arrival.test.js matches this template literally). Keep it in the same single title `<span>` text node (research.md R5, FR-009: arrival is part of the visible/accessible text, no extra ARIA, no new element or CSS). Leave the `.pleasure` span, selection behaviour and everything else in `drawRoutes` unchanged (FR-008)
- [ ] T008 [US1] In src/app.js `updateRoutes()` (around lines 333–335), after `if (seq !== routeSeq) return;` and after `if (!routes.length) return setStatus(…);`, add `const departure = new Date();` and change the call to `drawRoutes(routes, m, departure);` so one departure is taken per successful, non-superseded computation and shared by all its routes (research.md R2, FR-002). It must be the only `new Date(` in `updateRoutes()`. Do NOT modify the following `setStatus(...)` summary call (FR-010: status line stays unchanged and has no arrival time)
- [ ] T009 [US1] Verify no other caller of `drawRoutes` exists in src/app.js (`grep -n "drawRoutes(" src/app.js`); if any does, pass a departure taken the same way, otherwise nothing to do
- [ ] T010 [US1] Run `npm test` and the manual browser checks in quickstart.md §2 steps 1, 2, 3 and 5 (walk, car, with a stop, long car trip shown as `2 h 5 min, arrive HH:MM`) and step 7 (offline: existing error, no route entries, no arrival). Also narrow the browser window (or DevTools device mode, ≈ 320 px wide) and confirm the longer route text wraps onto several lines inside the route entry and nothing is truncated (spec Edge case "Narrow panel")

**Checkpoint**: User Story 1 is fully functional: every displayed route shows its arrival time (SC-001, SC-002, SC-004, SC-005).

---

## Phase 4: User Story 2 - Arrival times refresh when routes are recomputed (Priority: P2)

**Goal**: Each recomputation (destination, mode, stops, first computation once position is available) recalculates arrival times from the new departure moment; nothing ticks between computations (FR-006, FR-007).

**Independent Test**: Show routes, wait ≥ 2 minutes without touching anything (times must not change), then switch mode and back: times move forward to the new computation moment (quickstart.md §2 step 4).

### Tests for User Story 2

(Already written; see the completed test tasks recorded below.)

- [X] T020 [US2] Unit test for recomputation at 14:12 moving "arrive 14:32" to "arrive 14:37" in test/arrival.test.js (covers FR-006, FR-007, US2 scenario 1)
- [X] T021 [US2] Integration test for one departure per non-superseded computation, no timer, status line unchanged in test/arrival.test.js (covers FR-002, FR-006, FR-007, FR-010, US2 scenario 1, 2, SC-003)
- [X] T022 [US2] AI test: refresh after time passes, mode switch, stop add/clear, waiting for location in tests/ai/us2-arrival-refresh.md (covers FR-006, FR-007, US2 scenario 1, 2)

### Implementation for User Story 2

- [ ] T011 [US2] Review src/app.js and confirm every recomputation trigger goes through `updateRoutes()` → `drawRoutes(routes, m, departure)` with a fresh `new Date()`: destination selection, mode change (around line 303), stop add/remove/reorder/clear (around lines 393 and 422), and the pending-route path when the position arrives (around line 87). Confirm there is no `setInterval`/`setTimeout` updating route titles (research.md R6, FR-007). No code change is expected; fix only if a trigger bypasses `updateRoutes()`
- [ ] T012 [US2] Run the manual check in quickstart.md §2 step 4 (wait ≥ 2 min: no change; then switch mode back and forth: times move forward) and optionally step 6 (clock at 23:50, route ≥ 15 min → `arrive 00:xx (+1 day)`)

**Checkpoint**: User Stories 1 and 2 both work: arrival times reflect each new computation and stay fixed between computations (SC-003).

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation.

- [ ] T013 [P] In README.md, extend the first paragraph's route description (line 3, "…shows up to 3 routes to it, each with distance and duration.") with one sentence saying each route also shows its arrival time if you leave now (e.g. "25 min, arrive 14:32", 24-hour local time, with "(+1 day)" when it is on a later date), refreshed whenever the routes are computed again. The sentence must contain the word "arrive" (checked by test/arrival.test.js)
- [ ] T014 Run the full quickstart.md validation: `npm test`, `TZ=Pacific/Auckland npm test`, `TZ=America/New_York npm test` (all suites, including every test in test/arrival.test.js, must pass), then all manual steps of §2; confirm `index.html` and `styles.css` are unchanged: `git diff --stat main...` shows only src/geo.js, src/app.js, README.md, test/arrival.test.js, tests/ai/us1-arrival-time.md, tests/ai/us2-arrival-refresh.md and the spec folder, and the implementation commits themselves touch only src/geo.js, src/app.js and README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. T002 → T003 → T004 (same file); T005 last. BLOCKS both user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Its behaviour is delivered through the US1 `updateRoutes()`/`drawRoutes()` change (T008), so T011–T012 need T006–T008 done.
- **Polish (Phase 5)**: T013 any time after Phase 2; T014 after all user stories.

### Within Each Phase

- T002 → T003 → T004 (same file, src/geo.js)
- T006 → T007 → T008 → T009 (same file, src/app.js)

### Parallel Opportunities

- After Phase 2: T013 (README.md) in parallel with T006–T008 (src/app.js)
- T011 (review) can start as soon as T008 is done, in parallel with the T010 manual checks

---

## Parallel Example: User Story 1

```bash
# After Phase 2, run together (different files):
Task: "T006–T008 [US1] Wire formatArrival into drawRoutes/updateRoutes in src/app.js"
Task: "T013 README sentence in README.md"
```

## Parallel Example: User Story 2

```bash
Task: "T011 [US2] Review recomputation triggers in src/app.js"
Task: "T012 [US2] Manual refresh check (quickstart.md §2 step 4)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: baseline `npm test` (arrival tests red, others green)
2. Phase 2: helpers in src/geo.js → helper tests green
3. Phase 3: wire into src/app.js (+ T013 README) → integration tests green
4. **STOP and VALIDATE**: quickstart.md §2 steps 1–3, 5, 7 and the narrow-panel check

### Incremental Delivery

1. Setup + Foundational → helpers tested
2. US1 → arrival time visible on every route (MVP)
3. US2 → confirm refresh on every recomputation and no ticking
4. Polish → README + full quickstart validation

---

## Notes

- Decided without interaction: the test tasks that duplicated the already written tests were removed; the written tests are the recorded, completed tasks below. US2 needs no new code beyond US1's `updateRoutes()` change (research.md R6), so its tasks are a review plus a manual check.
- The integration tests in test/arrival.test.js check the src/app.js source text (as test/routes.test.js does), so follow the exact code in T006–T008.
- Total: ~25 lines in src/geo.js, ~3 lines changed in src/app.js, 1 README sentence. No new dependencies, modules, CSS or timers.
