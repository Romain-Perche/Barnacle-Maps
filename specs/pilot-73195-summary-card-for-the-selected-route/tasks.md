---

description: "Task list for the route summary bar (PILOT-73195)"
---

# Tasks: Summary Card for the Selected Route

**Input**: Design documents from `specs/pilot-73195-summary-card-for-the-selected-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/geo-summary-api.md, contracts/route-card-ui.md, quickstart.md

**Tests**: Included and already written by /write-tests (recorded below as completed `[X]` tasks). There are contract tests for the helpers and the markup/CSS, integration tests that drive the real `src/app.js` through the dependency-free fake browser in `test/helpers/fake-browser.js`, and AI scenarios in `tests/ai/`. Implementation tasks are done when those tests pass.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2 or US3 from spec.md

## Path Conventions

Single static project at the repo root: `index.html`, `styles.css`, `src/geo.js` (pure logic, no DOM), `src/app.js` (DOM + Leaflet wiring), `test/*.test.js` (`node --test test/`), `README.md`.

**Global constraints (apply to every task)**:

- `src/geo.js` must never contain the strings `document`, `window` or `fetch(` (comments included, test L6).
- No `dependencies` or `devDependencies` in `package.json` (test L8).
- All existing tests in `test/` must keep passing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a green baseline before changing anything.

- [ ] T001 Run `npm test` at the repo root and confirm all existing tests in test/ pass before any change (record failures, if any, as pre-existing)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The static markup and styling of the bar, which every story renders into.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add the bar markup to index.html right after `<div id="map"></div>` and before `<div id="panel">`: `<div id="route-card" role="group" aria-label="Selected route" hidden><b class="rc-duration"></b><span class="rc-distance"></span><span class="rc-arrival"></span></div>` followed by `<p id="route-card-live" class="sr-only" aria-live="polite"></p>`. Keep the existing order `#results` < `#routes` < `#status` inside `#panel` unchanged (test L1).
- [ ] T003 [P] Add Design A styles to styles.css per contracts/route-card-ui.md:
  - `#route-card { position:absolute; left:50%; transform:translateX(-50%); bottom:28px; z-index:1000; display:flex; flex-wrap:wrap; justify-content:center; align-items:baseline; gap:4px 12px; max-width:calc(100% - 24px); box-sizing:border-box; background:#fff; border-radius:8px; padding:7px 14px; box-shadow:0 2px 8px rgba(0,0,0,.3); font-size:13px }`
  - `#route-card[hidden] { display:none }`
  - `#route-card > * { white-space:nowrap }`
  - `#route-card .rc-duration { color:#1a73e8; font-size:15px }`
  - `#route-card > * + * { border-left:1px solid #ddd; padding-left:12px }`
  - a standard `.sr-only` utility (`position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0`)
  - Do not alter the existing `#routes:empty { display: none }` rule (test L2).

**Checkpoint**: The page loads unchanged and the bar is invisible (it has `hidden`).

---

## Phase 3: User Story 1 - See the selected route's key figures on the map (Priority: P1) 🎯 MVP

**Goal**: When routes are displayed, the bar shows the selected (by default the first) route's duration, distance and "Arrive <time>", matching the panel.

**Independent Test**: Search a destination. The bar appears bottom-center with Route 1's duration and distance exactly as in the panel, and an arrival time equal to the current time plus the displayed minutes (quickstart scenarios 2–3).

### Tests for User Story 1

> The tests already exist (written by /write-tests). Confirm they FAIL before T005.

- [ ] T004 [US1] Run `node --test test/summary.test.js test/route-card-ui.test.js test/route-card.integration.test.js` and confirm the US1 tests listed below fail (red) before T005. The tests were already written by /write-tests: do not rewrite or weaken them.
- [X] T016 [US1] Contract test for the pure summary helpers arrivalInfo/formatArrival/routeSummary in test/summary.test.js (covers FR-002, FR-003, FR-004, FR-005, US1 scenario 2, 3, SC-003, edge cases "arrival on a later day" and "very short routes")
- [X] T017 [US1] Contract test for the bar markup and Design A styles in test/route-card-ui.test.js (covers FR-002, FR-007, FR-009, FR-010, edge cases "small screens" and "must not intercept map interactions")
- [X] T018 [US1] Integration test for the bar on first display (tests "FR-007: … before any search", "US1 scenario 1/2/3", "FR-005 edge case", "FR-009 edge case") in test/route-card.integration.test.js (covers FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-009, US1 scenario 1, 2, 3, SC-001, SC-003)
- [X] T019 [US1] AI test: see the selected route's figures in tests/ai/us1-see-route-figures.md (covers FR-001–FR-005, FR-009, FR-010, US1 scenario 1, 2, 3)

### Implementation for User Story 1

- [ ] T005 [US1] In src/geo.js (after `formatDuration`), add and export the pure functions from contracts/geo-summary-api.md:
  - `arrivalInfo(now, seconds)`:
    - `minutes = Math.max(1, Math.round(seconds / 60))`
    - `time = new Date(now.getTime() + minutes * 60000)`
    - `dayOffset = Math.round((midnight(time) - midnight(now)) / 86400000)`, where `midnight(d) = new Date(d.getFullYear(), d.getMonth(), d.getDate())`
    - returns `{ time, dayOffset }`
  - `formatArrival(now, seconds, locale)`:
    - `hc = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle`
    - format `time` with `{ hour: hc === "h11" || hc === "h12" ? "numeric" : "2-digit", minute: "2-digit" }`
    - append `" +1 day"` if `dayOffset === 1` or `` ` +${dayOffset} days` `` if `dayOffset > 1`
  - `routeSummary(route, now, locale)` returns `{ duration: formatDuration(route.duration), distance: formatDistance(route.distance), arrival: formatArrival(now, route.duration, locale) }`

  Add them to the header comment's list of responsibilities without using the forbidden words. Run `node --test test/summary.test.js` and confirm it passes.
- [ ] T006 [US1] In src/app.js:
  - import `routeSummary` from ./geo.js
  - add `const card = document.getElementById("route-card")` and `const cardLive = document.getElementById("route-card-live")` next to the other element lookups
  - add `let cardTimer = null;` to the state block
  - add a function `renderCard()`:
    - `const entry = routeLayers[selectedRoute]; if (!entry) return hideCard();`
    - `const s = routeSummary(entry.route, new Date());`
    - set `card.querySelector(".rc-duration").textContent = s.duration`, `.rc-distance` to `s.distance`, and `.rc-arrival` to `` `Arrive ${s.arrival}` ``
    - set `card.hidden = false`
    - return `s`
  - add a function `hideCard()` that sets `card.hidden = true` (the timer and live-region parts come in US3/US2)
  - call `renderCard()` at the end of `selectRoute(i)` (after `bringToFront`)
- [ ] T007 [US1] In src/app.js `drawRoutes()`: replace `map.fitBounds(bounds, { padding: [40, 40] })` with `map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + card.offsetHeight + 28] })`. The card is already visible here because `selectRoute(0)` runs first. This keeps the start and destination from being hidden behind the bar (research R7).

**Checkpoint**: quickstart scenarios 2, 3, 5 and 10 pass. US1 is shippable as the MVP.

---

## Phase 4: User Story 2 - Card follows the route the user picks (Priority: P1)

**Goal**: Selecting another route from the panel or the map updates the bar immediately, and assistive technology announces the change politely.

**Independent Test**: With ≥ 2 routes, click Route 2 in the panel and then Route 3 on the map. The bar shows each route's figures in turn, and `#route-card-live` reads `Route N: …` (quickstart scenario 4).

- [X] T020 [US2] Integration test for selection changes (tests "US2 scenario 1/2/3", "FR-010: a selection change is announced politely…") in test/route-card.integration.test.js (covers FR-006, FR-010, US2 scenario 1, 2, 3, SC-002)
- [X] T021 [US2] AI test: card follows the selected route in tests/ai/us2-card-follows-selection.md (covers FR-006, FR-010, US2 scenario 1, 2, 3)

### Implementation for User Story 2

- [ ] T008 [US2] In src/app.js `selectRoute(i)`:
  - use the summary returned by `renderCard()`
  - when it is truthy, set `cardLive.textContent = `Route ${i + 1}: ${s.duration}, ${s.distance}, arrive ${s.arrival}``
  - only `selectRoute` writes `cardLive`; the minute tick in T011 must not (research R5)
  - confirm that both existing call paths (`button` click handler and `line.on("click")` in `drawRoutes`) go through `selectRoute(i)` and need no other change (FR-006)
- [ ] T009 [US2] In src/app.js `hideCard()`: also clear the announcement with `cardLive.textContent = ""` so no stale route is announced after routes are cleared.

**Checkpoint**: quickstart scenario 4 passes, and US1 still passes.

---

## Phase 5: User Story 3 - Card stays accurate and out of the way (Priority: P2)

**Goal**: The bar is hidden whenever there is no route (loading, cleared, failed, empty), reappears with fresh figures after mode/stop changes, keeps the arrival time current, and flags arrivals on a later day.

**Independent Test**: Display routes, switch Walk → Car. The bar disappears while loading and returns with the new Route 1. Leave the page open across a minute boundary and the arrival advances (quickstart scenarios 1, 6, 7, 8, 9).

### Tests for User Story 3

- [ ] T010 [P] [US3] Run `node --test test/route-card.integration.test.js` and confirm the US3 tests listed below fail (red) before T011. Do not rewrite or weaken them.
- [X] T022 [US3] Integration test for hiding, refresh and new routes (tests "US3 scenario 1/2/3/4") in test/route-card.integration.test.js (covers FR-007, FR-008, FR-011, US3 scenario 1, 2, 3, 4, SC-004, SC-005)
- [X] T023 [US3] AI test: card stays accurate and out of the way in tests/ai/us3-accurate-and-out-of-the-way.md (covers FR-007, FR-008, FR-010, FR-011, US3 scenario 1, 2, 3, 4)

### Implementation for User Story 3

- [ ] T011 [US3] In src/app.js, add the minute refresh (research R4):
  - in `renderCard()`, after showing the card, call `clearTimeout(cardTimer)`
  - then set `cardTimer = setTimeout(renderCard, 60000 - (Date.now() % 60000) + 50)`
  - in `hideCard()`, call `clearTimeout(cardTimer); cardTimer = null;`
  - the tick only re-renders the bar text and must not write `cardLive` (`renderCard` itself never touches `cardLive`)
- [ ] T012 [US3] In src/app.js `clearRoutes()`, call `hideCard()` after resetting `selectedRoute`. `updateRoutes()` calls `clearRoutes()` first on every path (new search, mode change, stop edit, waiting for position, routing failure, no route), so this covers FR-007. Verify no path calls `drawRoutes` without going through `selectRoute(0)`.

**Checkpoint**: quickstart scenarios 1, 6, 7, 8 and 9 pass, and all stories work together.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T013 [P] Update README.md: add one bullet saying that a bar at the bottom of the map shows the selected route's duration, distance and arrival time (device clock format, "+1 day" when arriving on a later day), refreshed every minute. Keep the existing "up to 3" and "pleasure" wording (test L3).
- [ ] T014 Run `npm test` at the repo root. All tests must pass: L1–L8 in test/routes.test.js, test/summary.test.js, test/route-card-ui.test.js and test/route-card.integration.test.js.
- [ ] T015 Walk through every scenario in specs/pilot-73195-summary-card-for-the-selected-route/quickstart.md (`npm start`, http://localhost:8000) and note the results. Check especially the 360 px width (no truncation, attribution not covered) and that clicking beside the bar still opens "Add stop here".

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: none.
- **Foundational (T002, T003)**: after T001. Blocks every story, since every story renders into `#route-card`.
- **US1 (T004–T007)**: after Foundational.
- **US2 (T008–T009)**: after T006 (it extends `selectRoute`, `renderCard` and `hideCard` in the same file).
- **US3 (T010–T012)**: T010 needs nothing. T011–T012 need T006.
- **Polish (T013–T015)**: after the desired stories.

### User Story Dependencies

- **US1**: independent, and the MVP.
- **US2**: builds on US1's `renderCard` (same file, src/app.js). It is independently testable once US1 exists.
- **US3**: builds on US1's `renderCard` and `hideCard`. It is independently testable once US1 exists. US2 and US3 don't depend on each other.

### Within Each Story

- The tests (already written) are run red at T004/T010, before the code they cover.
- geo.js helpers (T005) come before the app.js wiring (T006–T012).
- All src/app.js tasks are sequential (same file): T006 → T007 → T008 → T009 → T011 → T012.

### Parallel Opportunities

- T002 (index.html) ∥ T003 (styles.css)
- T004 (run the red tests) ∥ T002/T003
- T010 (tests) ∥ T008/T009 (app.js)
- T013 (README.md) ∥ any app.js task

---

## Parallel Example: User Story 1

```bash
# After T001, in parallel:
Task: "T002 Add #route-card and #route-card-live markup in index.html"
Task: "T003 Add Design A #route-card and .sr-only styles in styles.css"
Task: "T004 Run the existing US1 tests and confirm they fail"
# Then sequentially:
Task: "T005 Implement arrivalInfo/formatArrival/routeSummary in src/geo.js"
Task: "T006 Wire renderCard/hideCard into selectRoute in src/app.js"
Task: "T007 Pad fitBounds for the bar in src/app.js"
```

## Parallel Example: User Story 3

```bash
Task: "T010 Run the existing US3 tests and confirm they fail"   # parallel with US2's app.js work
Task: "T013 README bullet in README.md"                   # parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 → T002 + T003 → T004 → T005 → T006 → T007
2. **STOP and VALIDATE**: `npm test` + quickstart scenarios 2, 3, 5, 10

### Incremental Delivery

1. US1 → bar shows Route 1's figures (MVP)
2. US2 → bar follows the selection, with announcements
3. US3 → bar hides when there is no route, refreshes every minute, and shows the next-day suffix
4. Polish → README, full test run, quickstart walkthrough

Note: without US3, a stale bar could stay visible during reloads. Ship US1 + US2 + US3 together for production. The MVP is for internal validation only.

---

## Notes

- Commit after each phase.
- Keep `src/geo.js` free of the forbidden words (L6), including in comments.
- `#route-card` is a sibling of `#map`, not a Leaflet control, so no `L.DomEvent.disableClickPropagation` is needed.
