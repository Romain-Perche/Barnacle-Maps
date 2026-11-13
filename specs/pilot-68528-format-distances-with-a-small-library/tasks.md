---

description: "Task list for PILOT-68528: Format distances with a small library"
---

# Tasks: Format distances with a small library

**Input**: Design documents from `/specs/pilot-68528-format-distances-with-a-small-library/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/format-distance.md, quickstart.md

**Tests**: Requested. FR-009 requires automated tests for every example and edge case, including the fallback format, and the old `"1.50 km"` assertion must be updated. The test runner is `node --test test/` with `node:assert/strict`.

**Organization**: Tasks are grouped by user story. US1 (P1) is the visible distance format. US2 (P2) covers the dependency, browser loading and documentation. Both stories share one function (`formatDistance` in `src/geo.js`). That function relies on the package, so the package install is foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

Single flat project at the repository root: `src/`, `test/`, `index.html`, `package.json`, `README.md`, `.gitignore`. There is no build step. `src/app.js` does NOT change: it already calls `formatDistance` at line 219 (route list) and line 337 (fastest-route summary), which satisfies FR-001.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Declare the single new dependency so Node tests can import it

- [ ] T001 Add `"dependencies": { "convert": "8.0.2" }` to `package.json`. Use an exact pin with no `^` or `~` range. Leave `"scripts"` (`start`, `test`) unchanged (SC-003).
- [ ] T002 [P] Append a `node_modules/` line to the existing `.gitignore`. Keep the existing `.specify/feature.json` line.
- [ ] T003 Run `npm install` at the repository root to create `package-lock.json` (to be committed) and `node_modules/convert`. Check that `node -e "import('convert').then(m => console.log(m.convert(1500,'m').to('best','metric')))"` prints `{ quantity: 1.5, unit: 'km' }` (depends on T001).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Load the package in `src/geo.js` without blocking anything. Both stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 In `src/geo.js`, above `formatDistance`, add the non-blocking package load from plan.md "Design Notes": `let convert;` and `export const distanceFormatReady = import("convert").then((m) => { convert = m.convert; }, () => {});`. Do NOT use a static `import ... from "convert"` and do NOT use a top-level `await`. A failed or slow CDN must never stop or delay `app.js` (FR-006). `distanceFormatReady` must never reject (contract "Readiness").

**Checkpoint**: `npm test` still passes (`formatDistance` is unchanged so far), and `src/geo.js` exports `distanceFormatReady`.

---

## Phase 3: User Story 1 - Read route distances at a glance (Priority: P1) 🎯 MVP

**Goal**: Every distance in the route list and the fastest-route summary reads like "420 m", "1.5 km", "2 km" or "12.3 km". There are never two decimals, a trailing ".0", "NaN", or a thousands separator.

**Independent Test**: Run `npm test`. Every row of `contracts/format-distance.md` passes. Then in the browser (`npm start`), search at walking and car range: route list lines and the summary show the same distance text in the new format (quickstart.md §3).

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T005 [US1] In `test/geo.test.js`, import `before` from `node:test` (`import test, { before } from "node:test";`) and add `distanceFormatReady` to the import list from `../src/geo.js`. Add a top-level `before(() => distanceFormatReady);` so the package has loaded before the formatting tests run.
- [ ] T006 [US1] In `test/geo.test.js`, replace the `formatDistance` test body. Change the old `"1.50 km"` expectation to `"1.5 km"` (FR-009) and assert every row of the "Output rules (with the package loaded)" table in `contracts/format-distance.md`: `0`→`"0 m"`, `0.4`→`"0 m"`, `0.5`→`"1 m"`, `420.4`→`"420 m"`, `999.4`→`"999 m"`, `999.5`→`"1 km"`, `999.6`→`"1 km"`, `1000`→`"1 km"`, `1500`→`"1.5 km"`, `2000`→`"2 km"`, `12345`→`"12.3 km"`, `9999.96`→`"10 km"`, `1234567`→`"1234.6 km"`. Do NOT assert exact km ties such as 1050 or 1150 (spec clarification).
- [ ] T007 [US1] In `test/geo.test.js`, add a test `"formatDistance: invalid input shows —"`. It asserts that `NaN`, `undefined`, `null`, `"abc"`, `"5"`, `Infinity`, `-Infinity` and `-5` each return exactly `"—"` (U+2014 em dash) and never throw (FR-008). Rule: "anything that is not a finite number ≥ 0".
- [ ] T008 [US1] In `test/geo.test.js`, add a test `"formatDistance: fallback without the package"` that passes `null` as the second argument. It asserts `formatDistance(1500, null)`→`"1500 m"`, `formatDistance(420.4, null)`→`"420 m"`, `formatDistance(412700, null)`→`"412700 m"`, `formatDistance(NaN, null)`→`"—"` (FR-006, FR-009; contract "Fallback").
- [ ] T009 [US1] In `test/geo.test.js`, add a format-invariant test. For a sample of the valid inputs above, check that each output matches `/^\d+(\.\d)? (m|km)$/`. This means one normal space, a dot decimal separator, at most one decimal place, and no thousands separator (FR-004, SC-002). Run `npm test` and confirm the new tests from T006–T009 fail against the old implementation.

- [X] T017 [US1] Contract test for formatDistance output rules, fallback, invalid input, readiness and SC-005 in test/format-distance.contract.test.js (covers FR-002, FR-003, FR-004, FR-006, FR-008, FR-009, SC-002, SC-005, US1 scenarios 1, 2, 3, 4)
- [X] T018 [US1] AI test: route distances in the list and the fastest-route summary, incl. CDN failure and slow load in tests/ai/us1-route-distances.md (covers FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, SC-001, SC-002, US1 scenarios 1, 2, 3, 4, 5)

### Implementation for User Story 1

- [ ] T010 [US1] Rewrite `formatDistance` in `src/geo.js` as `export function formatDistance(meters, conv = convert)`, following plan.md "Design Notes → Logic" in this order: (1) `if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) return "—";` (2) `const m = Math.round(meters);` (3) `if (!conv) return `${m} m`;` (fallback, whole metres only, no km conversion) (4) `if (m === 0) return "0 m";` (the package's "best" unit for 0 is `mm`) (5) `const { quantity, unit } = conv(m, "m").to("best", "metric"); return `${+quantity.toFixed(1)} ${unit}`;`. Do not divide by 1000 and do not compare against 1000 anywhere in the distance code (SC-005). Do not change `formatDuration` or any other helper (FR-007). The function must never throw.
- [ ] T011 [US1] Run `npm test` and confirm the whole suite passes (SC-004). Also confirm with `grep -n '1000' src/geo.js` that no `/ 1000` or `< 1000` remains in `formatDistance`.

**Checkpoint**: User Story 1 is fully functional in Node tests. Both call sites in `src/app.js` show the new format.

---

## Phase 4: User Story 2 - Maintainers rely on a well-known formatter (Priority: P2)

**Goal**: The browser loads the same pinned `convert@8.0.2` from unpkg with no build step, and the docs describe the dependency.

**Independent Test**: `node -e "console.log(require('./package.json').dependencies)"` prints only `{ convert: '8.0.2' }`, and `grep -n 'convert@8.0.2' index.html` finds the import map. `npm start` serves the app, and distances are formatted by the package. With `unpkg.com/convert*` blocked in DevTools, the app still works and shows whole metres (quickstart.md §2 and §4).

- [X] T019 [US2] Contract test for the convert pin, the index.html import map, the README and the package driving formatDistance in test/distance-package.contract.test.js (covers FR-005, FR-006, FR-010, SC-003, US2 scenarios 1, 2, 3)
- [X] T020 [US2] AI test: one pinned dependency, browser loads it with no install or build, tests use it, docs updated in tests/ai/us2-package-formatter.md (covers FR-005, FR-006, FR-010, SC-003, SC-004, SC-005, US2 scenarios 1, 2, 3)

### Implementation for User Story 2

- [ ] T012 [P] [US2] In `index.html`, add `<script type="importmap">{ "imports": { "convert": "https://unpkg.com/convert@8.0.2/dist/index.js" } }</script>` BEFORE `<script type="module" src="src/app.js"></script>` (currently line 30). Leave the Leaflet `<script>` unchanged. The version in the URL must match `package.json` `dependencies.convert` exactly (FR-006), and no `integrity` attribute is used (spec clarification).
- [ ] T013 [P] [US2] In `README.md` line 12, replace "No build step or dependencies." with text that (a) still says there is no build step and that `npm start` serves the app, (b) names the [`convert`](https://convert.js.org/) package (8.0.2), loaded from unpkg through an import map, as the distance formatter, and (c) says to run `npm install` once before `npm test` (FR-010). Optionally add a "Distances: `convert` …" bullet to the stack list.
- [ ] T014 [US2] Check the browser path (quickstart.md §3–§4). Run `npm start`, open http://localhost:8000, and confirm that route distances read like "1.4 km" or "650 m" and that the summary matches the list. Then block `unpkg.com/convert*` and reload: the map loads without waiting, routes and stops still work, distances show whole metres (e.g. "1432 m"), and the console has no uncaught errors. If no browser is available, at least confirm that the server serves `index.html` and that the import map JSON is valid (`python3 -c` parse of the extracted JSON). Record that the manual browser check was not done.

**Checkpoint**: Both user stories work. The app runs from a static server and uses the package in the browser and in tests.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the success criteria

- [ ] T015 Run quickstart.md §1–§2 from the repository root: `npm install && npm test` (all pass), `node -e "console.log(require('./package.json').dependencies)"` (only `convert: '8.0.2'`), `grep -n 'convert@8.0.2' index.html` (one hit), `grep -rn '1.50 km' test/ src/` (no hits). Check that `git status` lists `package-lock.json` as added and does not list `node_modules/`.
- [ ] T016 Review the diff for scope: only `package.json`, `package-lock.json`, `.gitignore`, `index.html`, `README.md`, `src/geo.js` and `test/geo.test.js` change. `src/app.js` and `formatDuration` are untouched (FR-001, FR-007).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T003. T002 is independent.
- **Foundational (Phase 2)**: T004 depends on T003, because `import("convert")` must resolve in Node.
- **US1 (Phase 3)**: depends on T004. T005 → T006 → T007 → T008 → T009 (same file, sequential) → T010 → T011.
- **US2 (Phase 4)**: T012 and T013 depend only on Phase 1 (the pinned version), so they can run in parallel with Phase 3. T014 needs T010 and T012.
- **Polish (Phase 5)**: after all stories.

### User Story Dependencies

- **US1 (P1)**: needs Foundational only. In Node it is fully testable on its own.
- **US2 (P2)**: the declared dependency comes from Setup. The browser import map (T012) and the README (T013) are independent of US1's code. The end-to-end browser check (T014) needs US1's `formatDistance` to show the package-formatted output.

### Within Each User Story

- Tests (T005–T009) are written first and fail before T010.
- `src/geo.js` is edited by T004 and T010 only, sequentially.

### Parallel Opportunities

- T002 can run in parallel with T001/T003.
- T012 (`index.html`) and T013 (`README.md`) can run in parallel with each other and with all of Phase 3 (different files).

---

## Parallel Example: User Story 2

```bash
# Once Phase 1 is done, run these alongside US1 work:
Task: "Add the convert@8.0.2 import map before the app module script in index.html"
Task: "Update README.md: name convert, keep 'no build step', add 'npm install' before 'npm test'"
```

## Parallel Example: User Story 1

```bash
# All US1 tests touch test/geo.test.js, so run T005–T009 one after another.
# In parallel with them, another worker can do T012/T013 (US2) in other files.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T003)
2. Phase 2: Foundational (T004)
3. Phase 3: US1 (T005–T011)
4. **STOP and VALIDATE**: `npm test` passes and every contract row is covered

Note: without T012 the browser cannot resolve `"convert"`, so the deployed app shows the whole-metre fallback until US2's import map is added. The MVP is complete in tests. Ship US1 and US2 together for the visible result.

### Incremental Delivery

1. Setup + Foundational → package available and loaded without blocking
2. US1 → new format, tested
3. US2 → browser import map + README → full feature
4. Polish → quickstart validation

---

## Notes

- `"—"` is U+2014 EM DASH. Use the literal character in both source and tests.
- The CDN URL version and `package.json` must both be `8.0.2`. If one changes, change the other.
- Commit after each phase or logical group.
