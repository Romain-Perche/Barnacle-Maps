# Specification Analysis Report

**Feature**: `specs/pilot-15946-add-a-reset-view-button` | **Date**: 2026-11-10 | **Source**: `/speckit-analyze`

`npm test` at analysis time: 118 tests, 88 pass, 30 fail (expected: `src/view.js` and the button don't exist yet).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | tasks.md:L32 (T001) | T001 says to run `npm test` and confirm "all existing tests" in the four original files pass. `npm test` runs all of `test/`, which now also holds `view.test.js` and four `reset-view*` test files. That gives 30 failures today, so T001 fails as written. | Change T001 to run only the four original files (`node --test test/geo.test.js test/modes.test.js test/pleasure.test.js test/routes.test.js`), or expect the new tests to fail. |
| I2 | Inconsistency | HIGH | plan.md:L26, L71-80; tasks.md:L12 | The plan says "the repo has no browser test harness" and lists only `test/view.test.js` as new. In fact `test/support/fake-browser.js` and four integration and contract test files now exist and check `app.js` and `styles.css` directly. | Update plan §Testing and §Project Structure to list the fake-browser harness, the new test files and `tests/ai/`. State that the implementation must pass them. |
| I3 | Coverage / Inconsistency | MEDIUM | tasks.md:L130 (T020) | T020's final gate is "`test/view.test.js` plus the four existing files". It leaves out `reset-view-control.test.js` and the three `reset-view.us*.integration.test.js` files. | Make T020 "all files under `test/` pass". Add a green-check step for the new tests after T008/T010 (US1), T013 (US2) and T016 (US3). |
| D1 | Duplication | MEDIUM | tasks.md:L44 (T002), L65 (T021) | T002 ("Create `test/view.test.js` with the six contract cases") is still open. T021 covers the same file and cases and is marked done, and the file exists. | Mark T002 done (or reword it to "review the existing `test/view.test.js`"). Keep T003, which still holds: the test currently fails. |
| U1 | Underspecification | MEDIUM | tasks.md:L68, L91, L111 (T024, T026, T028) | The AI test scripts in `tests/ai/*.md` are marked done, but no task runs them, and neither the plan nor the quickstart mentions them. | Add a step that runs them in Polish, or say they are reference material only. |
| I4 | Inconsistency | LOW | tasks.md:L65-66 | T021 (StartView, a Foundational concern) and T022 (which covers US3 scenarios 2 and 4) are both tagged `[US1]`. | Re-tag them as Foundational/US3, or note that they are grouped by where they first run. |
| F1 | Ordering | LOW | tasks.md:L118 (T017) | T017 lists only "depends on T010, T009", yet it checks the button's position, which needs T007. The phase note (L142) does say T007–T010. | Add T007 to T017's dependencies. |
| I5 | Inconsistency | LOW | plan.md:L65 | The plan's documentation tree lists requirements.md, ux.md and behavior.md, but `checklists/consistency.md` also exists. | Add it to the tree. |
| A1 | Ambiguity | LOW | spec.md:L11-94 | There are about 80 clarification entries. Superseded ones are marked "(replaced: …)", but the FRs are the real source of truth, which makes the spec hard to read. | Optional: note at the top of Clarifications that the FRs take precedence. |

## Coverage Summary

All 19 FRs (FR-001–FR-019) and 7 SCs (SC-001–SC-007) have at least one task: 100% coverage.

## Constitution Alignment

None. `.specify/memory/constitution.md` is the unfilled template, so there are no principles to check against.

## Unmapped Tasks

T001 (baseline) and T018 (README) are setup and polish work and don't need a requirement.

## Metrics

- Total requirements: 26 (19 FR + 7 SC)
- Total tasks: 28 (T001–T028)
- Coverage: 100% (26/26)
- Ambiguity count: 1
- Duplication count: 1
- Critical issues: 0
- High issues: 2 (I1, I2)
