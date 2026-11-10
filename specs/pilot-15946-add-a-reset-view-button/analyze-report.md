# Specification Analysis Report

**Feature**: `specs/pilot-15946-add-a-reset-view-button` | **Date**: 2026-11-10 | **Source**: `/speckit-analyze` (re-run after the review-analyze-findings apply round)

`npm test` at analysis time: 118 tests, 88 pass, 30 fail (expected: `src/view.js` and the button don't exist yet). The new T001 baseline (`node --test` on the four original files) gives 88/88 passing.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| — | — | — | — | No findings. | — |

Previous findings, all resolved in this round:

| ID | Severity | Resolution |
|----|----------|------------|
| I1 | HIGH | T001 runs only `test/geo|modes|pleasure|routes.test.js` and says the new feature tests are expected to fail until they are implemented. |
| I2 | HIGH | plan.md §Testing describes the fake-browser harness, the contract/integration tests and `tests/ai/`, and lists the constraints they impose (a real DOM button, not an `innerHTML` string). §Project Structure lists every test file. contracts/reset-view-control.md and quickstart.md §1 match. |
| I3 | MEDIUM | T020 requires every file under `test/` to pass. Green checks for the new tests were added to T005, T011 (US1), T013 (US2) and T016 (US3). |
| D1 | MEDIUM | T002 is marked done and reworded: review the existing `test/view.test.js` and don't rewrite it. T003 is kept. |
| U1 | MEDIUM | New Polish task T021 runs the `tests/ai/*.md` scenarios. |
| I4 | LOW | The StartView unit test sits in Foundational with no story tag. The control contract test is in US3. Test tasks were re-recorded as T022–T029. |
| F1 | LOW | T017 depends on T007, T009 and T010. |
| I5 | LOW | The plan's docs tree lists `checklists/consistency.md` and `analyze-report.md`. |
| A1 | LOW | A precedence note at the top of spec.md Clarifications says the FRs, SCs and Assumptions win over earlier answers. |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs (examples) | Notes |
|-----------------|-----------|---------------------|-------|
| FR-001–FR-002 | Yes | T007, T024, T027, T029 | |
| FR-003–FR-004 | Yes | T004, T006, T022, T023 | |
| FR-005 | Yes | T008, T012, T025, T028 | |
| FR-006–FR-007 | Yes | T007, T016, T027, T028 | |
| FR-008, FR-012 | Yes | T010, T017, T027, T029 | |
| FR-009–FR-011, FR-013 | Yes | T009, T014, T016, T027 | |
| FR-014–FR-015 | Yes | T008, T013, T023, T025 | |
| FR-016–FR-017 | Yes | T015, T016, T027, T029 | |
| FR-018 | Yes | T008, T019, T023 | |
| FR-019 | Yes | T004, T022 | |
| SC-001–SC-007 | Yes | T011, T013, T016, T017, T019, T023–T029 | |

All 19 FRs and 7 SCs have at least one task: 100% coverage.

## Constitution Alignment

None. `.specify/memory/constitution.md` is the unfilled template.

## Unmapped Tasks

T001 (baseline), T018 (README) and T021 (running the AI tests) are setup and polish work.

## Metrics

- Total requirements: 26 (19 FR + 7 SC)
- Total tasks: 29 (T001–T029)
- Coverage: 100% (26/26)
- Ambiguity count: 0
- Duplication count: 0
- Critical issues: 0
- High issues: 0

## Next Actions

No CRITICAL or HIGH issues. Proceed to `/speckit-implement`.
