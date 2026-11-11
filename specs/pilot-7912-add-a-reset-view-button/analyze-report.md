# Specification Analysis Report (run 2, 2026-11-11)

Feature: `specs/pilot-7912-add-a-reset-view-button`. Re-run after review-analyze-findings fixed the run-1 findings through `/speckit-plan`, `/speckit-tasks` and the write-tests record step.

## Findings

None open. Dismissed findings (see `analyze-dismissed.md`) are skipped: C2, B1, E1.

Run-1 findings resolved:

| ID | Severity | Resolution |
|----|----------|------------|
| F1 | HIGH | T001 now expects `test/startview.test.js` to fail (red, written first) and every other suite to pass; this matches `npm test` (88 pass, 1 fail). quickstart.md §1 says the same. |
| D1 | HIGH | T002 now confirms the existing test file and must not recreate it; T015 stays the recorded contract test. |
| F2 | MEDIUM | tasks.md gained "Pre-written test tasks": why T015–T035 come after T014 and when the unit test and AI scenarios run. |
| F3 | MEDIUM | plan.md structure tree and Testing line include `tests/ai/`; T014's allowed file list includes both `tests/ai/*.md`. |
| F4 | MEDIUM | contracts/reset-view-control.md: no overlap with `#panel` or the zoom control "wherever they are" (today top-left). |
| F5 | LOW | quickstart.md H checks 360×640 and 320×568. |
| C1 | MEDIUM | research R3, the contract and T008 define `:active` as `#f4f4f4`, matching Leaflet bar links (which have no separate active style). |

## Coverage Summary

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | ✅ | T006, T008, T018, T030, T033 | |
| FR-002 | ✅ | T003, T007, T015, T016 | |
| FR-003 | ✅ | T003, T005, T015–T017, T025–T027 | |
| FR-004 | ✅ | T003, T005, T015, T021, T022 | |
| FR-005 | ✅ | T007, T011, T018–T020, T028, T031 | |
| FR-006 | ✅ | T006, T011, T031–T033 | |
| FR-007 | ✅ | T006, T012, T030 | |
| FR-008 | ✅ | T007, T024 | |
| FR-009 | ✅ | T008, T010, T034, T035 | |
| FR-010 | ✅ | T007, T012, T029 | |
| SC-001 | ✅ | T009, T016, T023 | |
| SC-002 | ✅ | T009, T016 | |
| SC-003 | ✅ | T009, T019 | |
| SC-004 | — | — | outcome metric (E1, dismissed) |

**Constitution:** still the unfilled template; there are no principles to check.

**Unmapped tasks:** none (T001, T013, T014 are setup/polish).

## Metrics

- Total requirements: 13 · Total tasks: 35 (21 test tasks already done) · Coverage: 100% · Ambiguity: 0 · Duplication: 0 · Critical: 0 · High: 0
