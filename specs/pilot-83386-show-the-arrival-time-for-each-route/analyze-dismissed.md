# Dismissed analyze findings

- C1 (LOW): integration tests check the src/app.js source text, not the rendered DOM — dismissed by the factory, 2026-11-12: deliberate write-tests decision (app.js needs a browser; test/routes.test.js uses the same approach); the AI tests in tests/ai/ check the rendered route entries for SC-004/SC-005.
- C3 (LOW): no explicit test for a clock or time-zone change between computations — dismissed by the factory, 2026-11-12: covered by design; the helpers are pure and take the departure as input (FR-007 tests), so a clock change only affects the next computation.
- U1 (LOW): line-number hints in tasks.md will drift during implementation — dismissed by the factory, 2026-11-12: the hints match src/app.js today and each task also names the function and code to change.
