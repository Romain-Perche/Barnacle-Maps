# Specification Analysis Report

Run: `/speckit-analyze`, 2026-11-12, re-run after review-analyze-findings fixes (plan.md, quickstart.md, tasks.md regenerated, tests re-recorded).

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution | LOW (informational) | `.specify/memory/constitution.md` | Constitution is the unfilled template. Dismissed (see analyze-dismissed.md). | None. |

Resolved since the previous run:
- D1 (HIGH): tasks.md no longer has open tasks that write or recreate the committed tests; it says to extend them, never rewrite.
- D2 (MEDIUM): the duplicate `test/geo.test.js` task is removed; T002 runs the existing assertions.
- I1 (MEDIUM): plan.md lists `test/route-entry.test.js` and `tests/ai/*.md`.
- I2 (MEDIUM): tasks.md explains the order of the recorded test IDs; the dependency section includes them.
- I3 (LOW): gone with D1.
- U1 (LOW): T001 confirms the new suites fail before implementation.

No ambiguities, duplications or conflicts. Test baseline: 131 tests, 97 pass, 32 fail as expected, 2 skip (DST, needs TZ=Europe/Paris).

## Coverage Summary

| Requirement Key | Has Task? | Task IDs |
|-----------------|-----------|----------|
| FR-001 | ✅ | T006, T012, T018, T022, T023, T027 |
| FR-002 | ✅ | T002, T003, T007, T013–T016, T021, T022, T028 |
| FR-003 | ✅ | T004, T011, T013, T014, T022 |
| FR-004 | ✅ | T003, T005, T011, T013, T014, T017, T025 |
| FR-005 | ✅ | T006, T018, T022–T024 |
| FR-006 | ✅ | T007–T009, T028–T033 |
| FR-007 | ✅ | T002, T006, T015, T018, T019, T022 |
| FR-008 | ✅ | T006, T018, T026 |
| SC-001 | ✅ | T018, T022, T023 |
| SC-002 | ✅ | T016 |
| SC-003 | ✅ | T009, T028, T033 |
| SC-004 | ✅ (derived) | met when SC-001 and SC-002 are met |
| README line | ✅ | T010, T020 |

**Metrics:** 12 requirements · 33 tasks (12 open, 21 test tasks done) · coverage 100% · ambiguities 0 · duplications 0 · critical 0 · high 0
