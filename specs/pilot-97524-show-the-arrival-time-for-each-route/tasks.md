---

description: "Task list for PILOT-97524: show the arrival time for each route"
---

# Tasks: Show the arrival time for each route

**Input**: Design documents from `/specs/pilot-97524-show-the-arrival-time-for-each-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/arrival.md, quickstart.md

**Tests**: Included. plan.md (Implementation Approach step 3) and quickstart.md explicitly ask for a new `test/arrival.test.js` that covers the contract examples and the `app.js` wiring.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story this task belongs to (US1, US2)
- Paths are relative to the repository root (single project: `src/`, `test/`, `README.md`)

## Decisions made without interaction

- **Contract correction**: In `contracts/arrival.md`, the row `2026-11-12 22:00:00 | 180000 (50 h) | arrive 00:00 (+2 days)` is arithmetically wrong. 22:00 + 50 h is 2026-11-15 00:00, which is `(+3 days)`. The tests use a correct +2-day case (`2026-11-12 22:00:00 + 93600 s (26 h)` → `arrive 00:00 (+2 days)`) and keep the 50 h case as a `(+3 days)` check. T001 fixes the contract row.
- No new modules. Run the tests with plain `npm test` (`node --test test/`). No dependencies are added (guard test L8).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align the design contract with correct arithmetic before writing tests. There is no project initialization: the repo already exists, has no build step, and needs no new dependencies.

- [ ] T001 Fix the +2-day example row in specs/pilot-97524-show-the-arrival-time-for-each-route/contracts/arrival.md. Replace `| 2026-11-12 22:00:00 | 180000 (50 h) | \`arrive 00:00 (+2 days)\` |` with two rows: `| 2026-11-12 22:00:00 | 93600 (26 h) | \`arrive 00:00 (+2 days)\` |` and `| 2026-11-12 22:00:00 | 180000 (50 h) | \`arrive 00:00 (+3 days)\` |`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure helpers that both user stories depend on (research R1–R4, R8).

**⚠️ CRITICAL**: Do not start any user story work until this phase is complete.

- [ ] T002 Write failing unit tests in a new file test/arrival.test.js (style: `import test from "node:test"; import assert from "node:assert/strict"; import { arrivalTime, formatArrival } from "../src/geo.js";`). Build every date with the local constructor `new Date(y, mIndex, d, h, min, s)` so the tests pass in any time zone. Cover:
  (a) Every row of contracts/arrival.md as `formatArrival(departure, seconds)`: 14:07:00+1500 → `"arrive 14:32"`; 09:55:00+4200 → `"arrive 11:05"`; 14:07:40+1490 → `"arrive 14:33"` (half minute rounds up); 08:00:00+300 → `"arrive 08:05"`; 23:50:00+1500 → `"arrive 00:15 (+1 day)"`; 23:59:40+20 → `"arrive 00:00 (+1 day)"`; 22:00:00+93600 → `"arrive 00:00 (+2 days)"`; 22:00:00+180000 → `"arrive 00:00 (+3 days)"`; 14:07:00+0 → `"arrive 14:07"`.
  (b) Invalid input returns `""`: `formatArrival(new Date(NaN), 60)`, `formatArrival(new Date(2026,10,12,14,7), NaN)`, `formatArrival(new Date(2026,10,12,14,7), -5)`, `formatArrival(new Date(2026,10,12,14,7), Infinity)`, `formatArrival("2026-11-12", 60)`, `formatArrival(new Date(2026,10,12,14,7), "60")`.
  (c) `arrivalTime` returns a `Date` whose `getTime()` equals `new Date(2026,10,12,14,33).getTime()` for 14:07:40+1490, returns `null` for every invalid input in (b), and does not mutate its input (the departure's `getTime()` is the same before and after the call).
  (d) `arrivalTime` result has 0 seconds and 0 ms (rounded to the minute).
  The tests must fail at this point because the exports do not exist yet.
- [ ] T003 Implement `export function arrivalTime(departure, durationSeconds)` in src/geo.js, right after `formatDistance`/`formatDuration`. Return `null` unless `departure instanceof Date && !Number.isNaN(departure.getTime())` and `typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds >= 0`. Otherwise return `new Date(Math.round((departure.getTime() + durationSeconds * 1000) / 60000) * 60000)`. Half a minute rounds up (research R3). Never read the clock and never mutate `departure`.
- [ ] T004 Implement `export function formatArrival(departure, durationSeconds)` in src/geo.js, directly after `arrivalTime` (depends on T003). Return `""` when `arrivalTime(...)` is `null`. Otherwise build `HH:MM` from the arrival's local `getHours()`/`getMinutes()` with `String(n).padStart(2, "0")`. Do not use `toLocaleTimeString` or `Intl` (research R2). Compute `dayOffset = Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(departure.getFullYear(), departure.getMonth(), departure.getDate())) / 86400000)`, using local calendar fields so it is DST-safe (research R4). The suffix is `""` for 0, `" (+1 day)"` for 1, and `` ` (+${n} days)` `` for n ≥ 2. Return `` `arrive ${hh}:${mm}${suffix}` ``.
- [ ] T005 Update the header comment at the top of src/geo.js so the "formatting" line mentions arrival times. Example: "formatting (distance, duration, arrival clock time if leaving now)". Keep the words `document`, `window` and `fetch(` out of the file (guard test L6 in test/routes.test.js).
- [ ] T006 Run `npm test`, then `TZ=Pacific/Kiritimati npm test` and `TZ=America/New_York npm test`. All of test/arrival.test.js (T002) must pass, and every existing test (test/geo.test.js, test/routes.test.js L1–L8, test/modes.test.js, test/pleasure.test.js, test/stops.test.js) must stay green.

**Checkpoint**: The helpers are complete and tested. The panel wiring can now start.

---

## Phase 3: User Story 1 - See when I will arrive on each route (Priority: P1) 🎯 MVP

**Goal**: Each route entry in the panel reads `Route N · <distance> · <duration>, arrive HH:MM[ (+N day[s])]`. The arrival is computed from one departure instant, taken when the route results are received for display.

**Independent Test**: Run `npm start`, open http://localhost:8000, allow location access, and search for a destination. Every route row shows `, arrive HH:MM`, equal to the current clock plus that row's duration, within 1 minute (quickstart steps 1–2; US1 scenarios 1–4; SC-001, SC-002).

### Tests for User Story 1

- [ ] T007 [US1] Add wiring tests to test/arrival.test.js (same file as T002, so run it after T002). Read src/app.js with `readFileSync(new URL("../src/app.js", import.meta.url), "utf8")`, following the `read` helper style of the L4/L5 guards in test/routes.test.js. Assert that:
  (a) the import block of src/app.js includes `formatArrival`;
  (b) the body of `function drawRoutes(` has the signature `drawRoutes(routes, m, departure)` and calls `formatArrival(departure, route.duration)`;
  (c) the title text contains the literal `", "` join of the arrival. Check that the source includes `` `, ${arrival}` `` or the equivalent pattern chosen in T009, and keep the test and the implementation consistent.
  These tests must fail before T008–T009.

- [X] T017 [US1] Contract test for the formatArrival examples of contracts/arrival.md (14:32, 11:05, 14:33 half-minute rounding, 08:05, 00:01, zero and sub-minute durations, +1/+2/+3 days) in test/arrival.test.js (covers FR-001, FR-002, FR-003, FR-004, US1 scenario 1, 3, 4)
- [X] T018 [US1] Contract test for arrivalTime rounding and purity, invalid input ('' / null) and locale independence in test/arrival.test.js (covers FR-002, FR-003, edge invalid duration)
- [X] T019 [US1] Contract test for DST spring-forward and fall-back days in America/New_York in test/arrival.test.js (covers FR-003, FR-004, edge daylight-saving)
- [X] T020 [US1] Integration test for panel titles "25 min, arrive 14:32", "1 h 10 min, arrive 11:05", "arrive 00:15 (+1 day)" and 14:33 rounding in test/arrival-panel.test.js (covers FR-001, FR-002, FR-003, FR-004, US1 scenario 1, 3, 4)
- [X] T021 [US1] Integration test for several car routes, walking routes with the pleasure line, and a route with a stop in test/arrival-panel.test.js (covers FR-001, FR-006, SC-001, US1 scenario 2)
- [X] T022 [US1] Integration test for departure taken when results arrive and for a route with a missing duration in test/arrival-panel.test.js (covers FR-002, SC-002, edge missing duration)
- [X] T023 [US1] Integration test for unchanged status line, no earliest-arrival mark and arrival in the accessible name in test/arrival-panel.test.js (covers FR-006, FR-008, FR-011)
- [X] T024 [US1] Integration test for no arrival left after a no-route or failed computation in test/arrival-panel.test.js (covers FR-007)
- [X] T025 [US1] AI test: arrival times in the panel (one, three, stop, long, midnight, no route, narrow panel, earliest arrival) in tests/ai/us1-arrival-time.md (covers FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, SC-001, SC-002, SC-004, US1 scenario 1, 2, 3, 4)

### Implementation for User Story 1

- [ ] T008 [US1] In src/app.js, add `formatArrival` to the existing `import { … } from "./geo.js"` list (next to `formatDuration`, around line 9).
- [ ] T009 [US1] In src/app.js `drawRoutes` (around line 211), change the signature to `function drawRoutes(routes, m, departure)`. Inside the `routes.forEach` loop, compute `const arrival = formatArrival(departure, route.duration);` and set `title.textContent = \`Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}${arrival ? \`, ${arrival}\` : ""}\`;`. If `arrival` is `""` (missing or invalid duration), the suffix is left out for that route only. Do not change the pleasure span, the button structure, `aria-pressed`, the polyline, or the status line (FR-006, FR-008, FR-011; research R6). Do not add a separate span or CSS. The text wraps naturally in the button (FR-009).
- [ ] T010 [US1] In src/app.js `updateRoutes()` (around lines 333–335), right after `if (seq !== routeSeq) return;` and the `if (!routes.length) return setStatus(…)` line, add `const departure = new Date(); // "leave now" = when the routes are shown (FR-002)` and change the call to `drawRoutes(routes, m, departure);` (research R5). Leave the status summary line (`const summary = …`) unchanged: it is out of scope per spec Assumptions.
- [ ] T011 [US1] Run `npm test` (the T007 wiring tests and all existing tests must pass). Then do the US1 manual check from quickstart.md steps 1–2 and 7. With the browser at a known time, every row shows `, arrive HH:MM`, and the pleasure line and status summary look the same as before.

**Checkpoint**: US1 is fully functional. Routes show arrival times on first display.

---

## Phase 4: User Story 2 - Arrival time refreshes when routes are recomputed (Priority: P2)

**Goal**: Each recomputation (travel mode change, new destination, stop added/removed/reordered/cleared, location becoming available for a waiting route) clears the old arrival times and shows new ones based on that computation's instant. The passage of time and later position updates change nothing (FR-005, FR-010; research R7).

**Independent Test**: Show routes, wait at least one minute (the times do not change), then switch Walk → Car or add a stop. The new rows' arrival times equal the new current time plus the new durations (quickstart steps 3–5; US2 scenarios 1–2; SC-003).

### Tests for User Story 2

- [ ] T012 [US2] Add guard tests to test/arrival.test.js (same file, after T007), reading src/app.js as text. Assert that:
  (a) in the source of `async function updateRoutes(`, `new Date()` appears **after** `if (seq !== routeSeq) return;` and **before** `drawRoutes(routes, m, departure)`, so the departure is per computation and taken after the superseded-request check (FR-002, SC-003);
  (b) `clearRoutes();` appears in `updateRoutes` before the `await fetchRoutes(` call, so old arrivals are removed when a recomputation starts;
  (c) src/app.js contains no `setInterval(`, so arrivals never tick on their own (spec edge case "passage of time alone").
  To extract the function body, slice from `async function updateRoutes(` to the next `\nfunction ` or `\nasync function `.

- [X] T026 [US2] Integration test for travel mode switch at 14:12 giving 14:12 + new durations in test/arrival-panel.test.js (covers FR-005, SC-003, US2 scenario 1)
- [X] T027 [US2] Integration test for adding, reordering, removing and clearing stops in test/arrival-panel.test.js (covers FR-005, US2 scenario 2)
- [X] T028 [US2] Integration test for a new destination and for the location becoming available for a waiting route in test/arrival-panel.test.js (covers FR-005)
- [X] T029 [US2] Integration test for no change on later position updates or the passage of time in test/arrival-panel.test.js (covers FR-010, edge passage of time)
- [X] T030 [US2] Integration test for old arrivals removed when recomputation starts and superseded results not shown in test/arrival-panel.test.js (covers SC-003, edge newer request supersedes)
- [X] T031 [US2] AI test: arrival refresh on mode, stops, destination, location; no refresh on time or movement; no leftovers in tests/ai/us2-arrival-refresh.md (covers FR-002, FR-005, FR-010, SC-003, US2 scenario 1, 2)

### Implementation for User Story 2

- [ ] T013 [US2] Verify in src/app.js that every recomputation trigger calls `updateRoutes()` and that no other path calls `drawRoutes`. The known call sites are the mode change, `showRoute` (around line 303), the stop changes `setStops` (around line 393, covering add/remove/reorder/clear), the destination change (around line 422), and the location becoming available (`if (pendingRoute && currentPlace) updateRoutes();`, around line 87). Confirm that the position-update handler only calls `updateRoutes()` when `pendingRoute` is true (FR-010). If you find a trigger that bypasses `updateRoutes()`, route it through `updateRoutes()`. Otherwise make no code change.
- [ ] T014 [US2] Run `npm test` (T012 must pass) and do quickstart.md steps 3–6 manually: wait a minute with no change; switch Walk → Car; add, reorder, remove and clear stops; pick a destination with no route or go offline. Confirm that there are fresh arrival times after each recomputation and that no arrival is shown when there is no route (FR-007).

**Checkpoint**: US1 and US2 both work. Arrival times are always from the latest computation.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation.

- [ ] T015 [P] In README.md, extend the opening paragraph sentence "shows up to 3 routes to it, each with distance and duration" to say that each route also shows the arrival clock time if you leave now (24-hour, e.g. "25 min, arrive 14:32", with "(+1 day)" after midnight), updated whenever the routes are computed again. Keep the words "up to 3" and "pleasure" (guard test L3 in test/routes.test.js).
- [ ] T016 Run the full quickstart.md validation: `npm test`, `TZ=Pacific/Kiritimati npm test`, and `TZ=America/New_York npm test` all pass, followed by the manual browser steps 1–7. Run `git diff --stat` and confirm that only src/geo.js, src/app.js, test/arrival.test.js, README.md and contracts/arrival.md changed, and that package.json has no dependencies (L8).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001)**: no dependencies.
- **Foundational (Phase 2, T002–T006)**: T002 needs the corrected contract rows (T001). T003 → T004 → T005 are in the same file (src/geo.js), so they run in sequence. T006 needs T002–T005. **Blocks both stories.**
- **US1 (Phase 3, T007–T011)**: needs Phase 2. T007 → T008 → T009 → T010 → T011 (T008–T010 are in the same file, src/app.js).
- **US2 (Phase 4, T012–T014)**: needs US1's T010, because the `departure` capture in `updateRoutes` is what US2 verifies. Its own code change is usually none: it is verification and guard tests.
- **Polish (Phase 5)**: T015 can run any time after Phase 2. T016 runs last.

### User Story Dependencies

- **US1 (P1)**: depends only on Phase 2.
- **US2 (P2)**: builds on US1's wiring (the departure is captured per `updateRoutes()` call). The refresh behavior itself comes from the existing single `updateRoutes()` entry point.

### Within Each User Story

- Write the tests first (T007, T012) and check that they fail before you implement.
- Imports (T008), then rendering (T009), then capturing the departure (T010).

### Parallel Opportunities

- T015 (README.md) can run in parallel with any task in Phase 3 or Phase 4, because it touches a different file.
- T001 (contract doc) can run in parallel with reading and planning, but T002 depends on it.
- Most other tasks share `src/geo.js`, `src/app.js` or `test/arrival.test.js`, so they are sequential by design. The feature is small (about 30 lines of code).

---

## Parallel Example: User Story 1

```bash
# While US1 wiring is in progress in src/app.js, the README can be updated independently:
Task: "T009 [US1] Append ', arrive …' to the title in drawRoutes in src/app.js"
Task: "T015 [P] Mention the arrival time in README.md"
```

## Parallel Example: User Story 2

```bash
# Guard tests and README are in different files:
Task: "T012 [US2] Add updateRoutes ordering / no-setInterval guards in test/arrival.test.js"
Task: "T015 [P] Mention the arrival time in README.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: fix the contract row (T001).
2. Phase 2: helpers and tests (T002–T006).
3. Phase 3: panel wiring (T007–T011).
4. **Stop and validate**: routes show `, arrive HH:MM`, which is the MVP. Because `updateRoutes()` already re-runs on every trigger, refreshing works in practice at this point.

### Incremental Delivery

1. Setup + Foundational: the helpers are tested in every time zone.
2. US1: arrival times appear in the panel (demo).
3. US2: the refresh guarantees are locked in by guard tests and verified manually.
4. Polish: README and the full quickstart.

---

## Notes

- `src/geo.js` must stay pure: no `document`, `window`, or `fetch(` (L6).
- Do not add dependencies (L8). Do not change `npm test`.
- The existing export list in L7 doesn't need updating. The new exports are covered by test/arrival.test.js.
- Commit after each phase.
