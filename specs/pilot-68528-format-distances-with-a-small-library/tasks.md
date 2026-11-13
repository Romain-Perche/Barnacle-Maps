---

description: "Task list for PILOT-68528: Format distances with a small library"
---

# Tasks: Format distances with a small library

**Input**: Design documents from `/specs/pilot-68528-format-distances-with-a-small-library/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/format-distance.md, quickstart.md

**Tests**: Requested (FR-009). The deterministic tests are already written and committed (listed as completed tasks in each story phase): `test/format-distance.contract.test.js` (US1), `test/distance-package.contract.test.js` (US2), and the old `"1.50 km"` assertion in `test/geo.test.js` is already `"1.5 km"`. AI tests (browser checks) are in `tests/ai/`. The test runner is `node --test test/` with `node:assert/strict`. Do not duplicate these assertions in other files.

**Organization**: Tasks are grouped by user story. US1 (P1) is the visible distance format. US2 (P2) covers the dependency, browser loading and documentation. Both stories share one function (`formatDistance` in `src/geo.js`). That function relies on the package, so the package install is foundational.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

Single flat project at the repository root: `src/`, `test/`, `tests/ai/`, `index.html`, `package.json`, `README.md`, `.gitignore`. There is no build step. `src/app.js` does NOT change: it already calls `formatDistance` at line 219 (route list) and line 337 (fastest-route summary), which satisfies FR-001.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Declare the single new dependency so Node tests can import it

- [ ] T001 Add `"dependencies": { "convert": "8.0.2" }` to `package.json`. Use an exact pin with no `^` or `~` range. Leave `"scripts"` (`start`, `test`) unchanged (SC-003).
- [ ] T002 [P] Append a `node_modules/` line to the existing `.gitignore`. Keep the existing `.specify/feature.json` line.
- [ ] T003 Run `npm install` at the repository root to create `package-lock.json` (to be committed) and `node_modules/convert`. Check the plan's assumptions about the package (depends on T001): `node -e "import('convert').then(({convert}) => { for (const m of [420, 1500, 1234567]) console.log(m, convert(m,'m').to('best','metric')) })"` prints unit `m` for 420, `{ quantity: 1.5, unit: 'km' }` for 1500, and unit `km` for 1234567 (never `dam`, `hm` or `Mm`). Also check `curl -sI https://unpkg.com/convert@8.0.2/dist/index.js` returns HTTP 200 (the URL used by the import map). If either check fails, stop and report: the plan's design does not hold.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Load the package in `src/geo.js` without blocking anything. Both stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 In `src/geo.js`, above `formatDistance`, add the non-blocking package load from plan.md "Design Notes": `let convert;` and `export const distanceFormatReady = import("convert").then((m) => { convert = m.convert; }, () => {});`. Do NOT use a static `import ... from "convert"` and do NOT use a top-level `await`. A failed or slow CDN must never stop or delay `app.js` (FR-006). `distanceFormatReady` must never reject (contract "Readiness").

**Checkpoint**: `src/geo.js` exports `distanceFormatReady`, and the test "distanceFormatReady is exported and resolves" in `test/format-distance.contract.test.js` passes. The other committed distance tests still fail (expected until T007, T009 and T010). The tests in `test/modes.test.js`, `test/pleasure.test.js`, `test/routes.test.js` and `test/stops.test.js` still pass.

---

## Phase 3: User Story 1 - Read route distances at a glance (Priority: P1) 🎯 MVP

**Goal**: Every distance in the route list and the fastest-route summary reads like "420 m", "1.5 km", "2 km" or "12.3 km". There are never two decimals, a trailing ".0", "NaN", or a thousands separator.

**Independent Test**: `node --test test/geo.test.js test/format-distance.contract.test.js` passes. Every row of `contracts/format-distance.md` is covered there. Then in the browser (`npm start`), search at walking and car range: route list lines and the summary show the same distance text in the new format (quickstart.md §3).

### Tests for User Story 1 ⚠️

> **NOTE: These tests are already written. Confirm they FAIL before implementation.**

- [ ] T005 [US1] Run `node --test test/geo.test.js test/format-distance.contract.test.js` and confirm that the `formatDistance` tests fail against the old implementation (red step). Do not add more `formatDistance` assertions to `test/geo.test.js`: the contract test already covers every contract row, invalid input, the fallback, the output shape and SC-005 (FR-009).

- [X] T014 [US1] Contract test for formatDistance output rules, fallback, invalid input, readiness and SC-005 in test/format-distance.contract.test.js (covers FR-002, FR-003, FR-004, FR-006, FR-008, FR-009, SC-002, SC-005, US1 scenarios 1, 2, 3, 4)
- [X] T015 [US1] AI test: route distances in the list and the fastest-route summary, incl. CDN failure and slow load in tests/ai/us1-route-distances.md (covers FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, SC-001, SC-002, US1 scenarios 1, 2, 3, 4, 5)

### Implementation for User Story 1

- [ ] T006 [US1] Rewrite `formatDistance` in `src/geo.js` as `export function formatDistance(meters, conv = convert)`, following plan.md "Design Notes → Logic" in this order: (1) `if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) return "—";` (U+2014 em dash) (2) `const m = Math.round(meters);` (3) `if (!conv) return `${m} m`;` (fallback, whole metres only, no km conversion) (4) `if (m === 0) return "0 m";` (the package's "best" unit for 0 is `mm`) (5) `const { quantity, unit } = conv(m, "m").to("best", "metric"); return `${+quantity.toFixed(1)} ${unit}`;`. Do not divide by 1000 and do not compare against 1000 anywhere in the distance code (SC-005). Do not change `formatDuration` or any other helper (FR-007). The function must never throw.
- [ ] T007 [US1] Run `node --test test/geo.test.js test/format-distance.contract.test.js` and confirm every test passes. Also confirm with `grep -n '1000' src/geo.js` that no `/ 1000` or `< 1000` remains in `formatDistance`. The full suite (`npm test`) is not expected to pass yet: `test/distance-package.contract.test.js` needs T009 and T010 (US2).

**Checkpoint**: User Story 1 is fully functional in Node tests. Both call sites in `src/app.js` show the new format.

---

## Phase 4: User Story 2 - Maintainers rely on a well-known formatter (Priority: P2)

**Goal**: The browser loads the same pinned `convert@8.0.2` from unpkg with no build step, and the docs describe the dependency.

**Independent Test**: `node --test test/distance-package.contract.test.js` passes: `package.json` declares only `{ convert: '8.0.2' }`, `index.html` has the import map, and the README is updated. `npm start` serves the app, and distances are formatted by the package. With `unpkg.com/convert*` blocked in DevTools, the app still works and shows whole metres (quickstart.md §2 and §4).

- [X] T016 [US2] Contract test for the convert pin, the index.html import map, the README and the package driving formatDistance in test/distance-package.contract.test.js (covers FR-005, FR-006, FR-010, SC-003, US2 scenarios 1, 2, 3)
- [X] T017 [US2] AI test: one pinned dependency, browser loads it with no install or build, tests use it, docs updated in tests/ai/us2-package-formatter.md (covers FR-005, FR-006, FR-010, SC-003, SC-004, SC-005, US2 scenarios 1, 2, 3)

### Implementation for User Story 2

- [ ] T008 [US2] Run `node --test test/distance-package.contract.test.js` and confirm that the import map and README tests fail before T009 and T010 (red step).
- [ ] T009 [P] [US2] In `index.html`, add `<script type="importmap">{ "imports": { "convert": "https://unpkg.com/convert@8.0.2/dist/index.js" } }</script>` BEFORE `<script type="module" src="src/app.js"></script>` (currently line 30). Leave the Leaflet `<script>` unchanged. The version in the URL must match `package.json` `dependencies.convert` exactly (FR-006), and no `integrity` attribute is used (spec clarification).
- [ ] T010 [P] [US2] In `README.md` line 12, replace "No build step or dependencies." with text that (a) still says there is no build step and that `npm start` serves the app, (b) names the [`convert`](https://convert.js.org/) package (8.0.2), loaded from unpkg through an import map, as the distance formatter, and (c) says to run `npm install` once before `npm test` (FR-010). Optionally add a "Distances: `convert` …" bullet to the stack list.
- [ ] T011 [US2] Check the browser path (quickstart.md §3–§4, AI tests in `tests/ai/`). Run `npm start`, open http://localhost:8000, and confirm that route distances read like "1.4 km" or "650 m" and that the summary matches the list. Then block `unpkg.com/convert*` and reload: the map loads without waiting, routes and stops still work, distances show whole metres (e.g. "1432 m"), and the console has no uncaught errors. If no browser is available, at least confirm that the server serves `index.html` and that the import map JSON is valid (`python3 -c` parse of the extracted JSON). Record that the manual browser check was not done.

**Checkpoint**: Both user stories work. The app runs from a static server and uses the package in the browser and in tests.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the success criteria

- [ ] T012 Run the full suite and quickstart.md §1–§2 from the repository root: `npm install && npm test` (all tests pass, SC-004), `node -e "console.log(require('./package.json').dependencies)"` (only `convert: '8.0.2'`), `grep -n 'convert@8.0.2' index.html` (one hit), `grep -rn '1.50 km' test/ src/` (no hits). Check that `git status` lists `package-lock.json` as added and does not list `node_modules/`.
- [ ] T013 Review the diff against `main` for scope. Only these files may change: `package.json`, `package-lock.json`, `.gitignore`, `index.html`, `README.md`, `src/geo.js`, `test/geo.test.js`, `test/format-distance.contract.test.js`, `test/distance-package.contract.test.js`, `tests/ai/us1-route-distances.md`, `tests/ai/us2-package-formatter.md`, and files under `specs/pilot-68528-format-distances-with-a-small-library/`. `src/app.js` and `formatDuration` are untouched (FR-001, FR-007).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 → T003. T002 is independent.
- **Foundational (Phase 2)**: T004 depends on T003, because `import("convert")` must resolve in Node.
- **US1 (Phase 3)**: depends on T004. T005 → T006 → T007.
- **US2 (Phase 4)**: T008, T009 and T010 depend only on Phase 1 (the pinned version), so they can run in parallel with Phase 3. T011 needs T006, T009 and T010.
- **Polish (Phase 5)**: after all stories. T012 is the first point where the whole `npm test` suite must pass.

### User Story Dependencies

- **US1 (P1)**: needs Foundational only. In Node it is fully testable on its own with its own test files (T007).
- **US2 (P2)**: the declared dependency comes from Setup. The browser import map (T009) and the README (T010) are independent of US1's code. The "formatDistance uses the package" test in `test/distance-package.contract.test.js` and the browser check (T011) also need US1's T006.

### Within Each User Story

- The committed tests are run first and fail (T005, T008) before the implementation.
- `src/geo.js` is edited by T004 and T006 only, sequentially.

### Parallel Opportunities

- T002 can run in parallel with T001/T003.
- T009 (`index.html`) and T010 (`README.md`) can run in parallel with each other and with all of Phase 3 (different files).

---

## Parallel Example: User Story 2

```bash
# Once Phase 1 is done, run these alongside US1 work:
Task: "Add the convert@8.0.2 import map before the app module script in index.html"
Task: "Update README.md: name convert, keep 'no build step', add 'npm install' before 'npm test'"
```

## Parallel Example: User Story 1

```bash
# US1 touches only src/geo.js (T004, T006, sequential).
# In parallel, another worker can do T009/T010 (US2) in other files.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T003)
2. Phase 2: Foundational (T004)
3. Phase 3: US1 (T005–T007)
4. **STOP and VALIDATE**: `node --test test/geo.test.js test/format-distance.contract.test.js` passes (the US2 contract test is expected to fail until Phase 4)

Note: without T009 the browser cannot resolve `"convert"`, so the deployed app shows the whole-metre fallback until US2's import map is added. The MVP is complete in tests. Ship US1 and US2 together for the visible result.

### Incremental Delivery

1. Setup + Foundational → package available and loaded without blocking
2. US1 → new format, tested
3. US2 → browser import map + README → full feature
4. Polish → full suite and quickstart validation

---

## Notes

- `"—"` is U+2014 EM DASH. Use the literal character in both source and tests.
- The CDN URL version and `package.json` must both be `8.0.2`. If one changes, change the other.
- Commit after each phase or logical group.
