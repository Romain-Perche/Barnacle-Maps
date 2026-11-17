---
description: "Task list for SF-74 Sort Search Results by Distance"
---

# Tasks: Sort Search Results by Distance

**Input**: `/specs/sf-74-sort-search-results/` (plan.md, spec.md, research.md, data-model.md, contracts/search-ui-and-api.md, quickstart.md)

**Tests**: The plan lists unit tests in `test/geo.test.js` (repo convention: pure helpers in `src/geo.js` are unit tested), so test tasks are included.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No setup needed: existing single project, no new dependencies or files in `src/`.

## Phase 2: Foundational

None: both stories build on the existing `haversine` and `formatDistance` in `src/geo.js`.

## Phase 3: User Story 1 - Nearest place listed first (Priority: P1) 🎯 MVP

**Goal**: With a known position, the search prefers nearby places and results (submitted and suggestions) are listed nearest first; without a position, behaviour is unchanged.

**Independent Test**: `npm test`; then with a known position search "bakery" and check results are in increasing distance (quickstart steps 1–3, 5–7).

### Tests for User Story 1

- [X] T001 [P] [US1] Unit test for searchUrl viewbox: written in test/sort-results.test.js (see T009-T012); nothing more to write in test/geo.test.js
- [X] T002 [P] [US1] Unit test for sortByDistance: written in test/sort-results.test.js (see T013-T016); nothing more to write in test/geo.test.js

- [X] T009 [US1] Unit test searchUrl adds a viewbox centred on the position in test/sort-results.test.js (covers FR-008, US1 scenario 4)
- [X] T010 [US1] Unit test searchUrl never sets bounded=1 and keeps limit 5 in test/sort-results.test.js (covers FR-008, US1 scenario 5)
- [X] T011 [US1] Unit test searchUrl without a position is unchanged in test/sort-results.test.js (covers FR-009)
- [X] T012 [US1] Unit test searchUrl viewbox is clamped to valid coordinates in test/sort-results.test.js (covers FR-008)
- [X] T013 [US1] Unit test sortByDistance orders nearest first in test/sort-results.test.js (covers FR-001, FR-002, US1 scenario 1, 2)
- [X] T014 [US1] Unit test sortByDistance keeps service order on ties in test/sort-results.test.js (covers FR-003, US1 scenario 3)
- [X] T015 [US1] Unit test sortByDistance without a position in test/sort-results.test.js (covers FR-004, FR-006)
- [X] T016 [US1] Unit test sortByDistance returns a new array and keeps places in test/sort-results.test.js (covers FR-005, FR-007)
- [X] T017 [US1] AI test: sorted results, suggestions, actions and no-position in tests/ai/us1-nearest-first.md (covers FR-001, FR-002, FR-005, FR-008, FR-009, US1 scenario 1-6)

### Implementation for User Story 1

- [X] T003 [US1] In `src/geo.js`, export `NEAR_BOX_DEG = 0.25` and extend `searchUrl(query, base = "https://nominatim.openstreetmap.org", near = null)` to append `viewbox=<left>,<top>,<right>,<bottom>` when `near` is given (see T001 for the maths); keep `limit: "5"` and do not set `bounded`.
- [X] T004 [US1] In `src/geo.js`, export `sortByDistance(results, from)` using the existing `haversine`: if `from` is null/undefined return `[...results]`; otherwise return a new array of `{ ...r, distance }` sorted ascending with the stable `Array.prototype.sort`.
- [X] T005 [US1] In `src/app.js` `runSearch`, import `sortByDistance`; read `position` at call time, call `searchUrl(q, undefined, position)`, and after the `seq` check replace `found` with `sortByDistance(found, position)` before rendering. Leave the existing handlers so each row's `showRoute(place)` / `tryAddStop(place)` use that row's own place (FR-005). Do not re-sort already shown results when `position` changes.

**Checkpoint**: US1 works on its own; `npm test` passes.

## Phase 4: User Story 2 - See how far each result is (Priority: P2)

**Goal**: Each result shows its distance in a column right of the name, before "Add as stop" (Design A); nothing shown when position unknown.

**Independent Test**: quickstart step 3 and 6: distances shown, non-decreasing, in `formatDistance` format; absent without position.

- [X] T018 [US2] AI test: distance column and no distance without position in tests/ai/us2-distance-column.md (covers FR-006, US2 scenario 1, 2)

- [X] T006 [US2] In `src/app.js` `runSearch`, when `place.distance` is a number, create `<span class="distance">` with `formatDistance(place.distance)` and append the row as `li.append(btn, distanceSpan, add)`; when no distance, append `li.append(btn, add)` as today (FR-006, US2 scenario 2).
- [X] T007 [P] [US2] In `styles.css`, add `#results .distance { flex: none; align-self: center; padding: 6px 0; font-size: 12px; color: #666; white-space: nowrap; min-width: 4.5em; text-align: right; }` (matches `.distA` in `design-options.html`).

## Phase 5: Polish

- [X] T008 Run `npm test`, then walk through every step in `specs/sf-74-sort-search-results/quickstart.md` in the browser (`npm start`) and fix any mismatch.

## Dependencies & Execution Order

- T001, T002 (tests, same file; write first, they fail until T003/T004) → T003, T004 (same file `src/geo.js`, sequential) → T005 (`src/app.js`).
- US2 depends on US1 (needs `distance` from T004/T005): T006 after T005; T007 is independent and can run any time.
- T008 last.

## Parallel Example

- T001 and T002 can be drafted together (different test blocks); T007 can run alongside T003–T006.

## Implementation Strategy

MVP = User Story 1 (T001–T005): sorting plus nearby preference. Then add the distance column (US2) and finish with the manual quickstart check.
