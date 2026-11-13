# Quickstart: validating the route summary bar

## Prerequisites

- Node ≥ 20 (tests), Python 3 (static server), a browser with location access (or DevTools → Sensors → Location override, e.g. Paris 48.8566, 2.3522).

## Automated checks

```bash
npm test          # all existing tests + test/summary.test.js must pass
```

Expected: all tests pass, including:
- `test/summary.test.js` (every example table in [contracts/geo-summary-api.md](./contracts/geo-summary-api.md))
- `test/route-card-ui.test.js` ([contracts/route-card-ui.md](./contracts/route-card-ui.md))
- `test/route-card.integration.test.js` (US1–US3 behaviour through the fake browser)
- the existing L6/L8 tests (geo.js stays pure, no dependencies)

AI scenarios for an agent with headless Playwright are in `tests/ai/` (shared setup and network stubs in `tests/ai/README.md`). The manual scenarios below are the human version of the same checks.

## Manual scenarios

Run `npm start`, open http://localhost:8000, and allow location access.

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | Load the page | No bar visible | FR-007 |
| 2 | Search "Louvre", pick a result | While loading: no bar. Then a bottom-centered bar `Walk │ NN min │ X km │ Arrive HH:MM`, where the blue duration and the distance equal panel Route 1's text | US1, FR-003, FR-009 |
| 3 | Check the arrival time | Equals the device clock + displayed minutes; 12/24 h follows the browser locale (e.g. DevTools → Sensors → Locale `en-US` shows `PM`) | FR-004 |
| 4 | Click Route 2 in the panel, then Route 3 on the map | The bar changes instantly each time; a screen reader (or the accessibility tree) shows `#route-card-live` = `Route N, Walk: …` | US2, FR-006, FR-010 |
| 5 | Click the map just beside the bar | The "Add stop here" popup opens. Clicking on the bar opens nothing | FR-009 |
| 6 | Switch Walk → Car, then add/remove a stop | The bar hides during loading and reappears with `Car` and the new Route 1 figures (totals through the stops) | US3, FR-011, FR-012 |
| 7 | Wait across a minute boundary | The arrival advances by one minute within ~1 s of the clock change; no new live announcement | FR-008, SC-004 |
| 8 | Override the clock or search a long walk late at night (or test via unit tests) | `+1 day` suffix | FR-005 |
| 9 | Search an unreachable place (e.g. across the ocean) / go offline | Error status, no bar | FR-007 |
| 10 | DevTools device mode 360 px wide | The bar wraps instead of truncating, stays above the attribution, and the start/destination markers are not hidden after fit | Edge cases |
