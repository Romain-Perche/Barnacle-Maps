## Specification Analysis Report

Feature: `specs/pilot-22089-add-a-reset-view-button`. Re-run on 2026-11-10 after the review-analyze-findings fixes (plan.md, research.md, contracts/reset-view-control.md updated; tasks.md regenerated, tests re-recorded as T020–T030). Constitution: still the unfilled template, no enforceable gates.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Coverage | LOW | FR-008, SC-003; T011, T019, T025 | Glitch-free and 1 s checks are manual or AI-tested only. | Dismissed (see analyze-dismissed.md). |
| F7 | Ordering | LOW | tasks.md T020–T030 | Recorded test tasks have higher IDs than the implementation tasks after them. | Dismissed (see analyze-dismissed.md). |

Resolved since the previous run: F1 (T001 baseline and Phase 2 checkpoint now name which suites pass or fail), F2 (Tests note describes the fake-browser tests), D1 (T002 now only confirms the existing `test/view.test.js` is red), F3 (hover and active both `#f4f4f4`, as Leaflet's zoom buttons), F4 (`.leaflet-touch .reset-view { font-size: 22px; }`), F5 (plan and research use the 440 px boundary, ~420 px only as the estimate), F6 (plan Design Note 4 includes the two `scrollTop = 0` JS lines).

**Coverage**: 17/17 requirements (FR-001–FR-011, SC-001–SC-006) have tasks (100%).

| Requirement Key | Has Task? | Task IDs |
|---|---|---|
| FR-001 | Yes | T009, T010, T012, T026, T029, T030 |
| FR-002 | Yes | T007, T021, T025 |
| FR-003 | Yes | T003, T004, T006, T020, T021 |
| FR-004 | Yes | T006, T020, T021 |
| FR-005 | Yes | T007, T018, T022, T025 |
| FR-006 | Yes | T009, T012, T015, T026, T027 |
| FR-007 | Yes | T005, T009, T013, T014, T016, T026, T028, T029 |
| FR-008 | Yes | T011, T022, T025 |
| FR-009 | Yes | T010, T012, T026, T029 |
| FR-010 | Yes | T007, T024 |
| FR-011 | Yes | T008, T023, T025 |
| SC-001 | Yes | T009, T011, T025 |
| SC-002 | Yes | T011, T021, T025 |
| SC-003 | Yes | T011, T024, T025 |
| SC-004 | Yes | T022, T025 |
| SC-005 | Yes | T015, T027, T030 |
| SC-006 | Yes | T013, T016, T029, T030 |

**Constitution Alignment Issues:** none enforceable.

**Unmapped Tasks:** T001, T017, T018 (baseline, README, final checks).

**Metrics:** Total Requirements 17; Total Tasks 30; Coverage 100%; Ambiguity Count 0; Duplication Count 0; Critical Issues Count 0; High 0; open MEDIUM/LOW 0 (2 LOW dismissed).
