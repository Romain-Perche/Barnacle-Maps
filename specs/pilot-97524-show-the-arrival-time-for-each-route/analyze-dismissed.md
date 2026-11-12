# Dismissed analyze findings

- C2 (LOW): FR-009 (wrap, no truncation) has only an AI/manual test — dismissed by the factory, 2026-11-12: a Node test cannot measure layout; the change adds no CSS and the AI scenario checks `nowrap`/`ellipsis` in a 320 px panel.
- A1 (LOW): SC-002 allows 1 minute while FR-002 rounds exactly — dismissed by the factory, 2026-11-12: deliberate; SC-002 is the user-visible tolerance measured on a live clock, FR-002 is the exact rule, and they do not conflict.
- K1 (LOW): constitution is the unfilled template — dismissed by the factory, 2026-11-12: out of scope for this feature; the plan uses the repo's implicit gates (L6, L8).
- O1 (LOW): task IDs out of order — dismissed by the factory, 2026-11-12: by design; the write-tests record step numbers test tasks after the highest ID and never renumbers.
- N1 (LOW): a comment in test/arrival.test.js cites T001 for the corrected contract rows, but T001 has a new meaning after the tasks re-run — dismissed by the factory, 2026-11-12: comment only; the contract and the tests agree, and the test files stay unchanged after the write-tests gate.
