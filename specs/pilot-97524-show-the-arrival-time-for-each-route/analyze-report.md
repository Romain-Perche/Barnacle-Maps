# Analyze report (run 2, 2026-11-12, after review-analyze-findings fixes)

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| N1 | Terminology | LOW | test/arrival.test.js:L15 | A test comment says the 22:00 rows use "the corrected values (T001)". After the tasks re-run, T001 is "confirm the red phase", not the contract fix. | Harmless; the contract and the tests now agree. |

Resolved since run 1: D1, I1, I2, I3, I4, C1, T1, T2 (fixed); C2, A1, K1, O1 (dismissed, see analyze-dismissed.md).

**Coverage**: 15/15 requirements (FR-001–FR-011, SC-001–SC-004) have at least one task. FR-009 and SC-004 are covered by the AI scenario only (dismissed C2; SC-004 is a human-judgement criterion).

**Constitution**: unfilled template, no principles to check (K1 dismissed).

**Metrics**: 15 requirements, 28 tasks (13 implementation tasks open, 15 test tasks done), 100% coverage, 0 ambiguities, 0 duplications, 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (dismissed).
