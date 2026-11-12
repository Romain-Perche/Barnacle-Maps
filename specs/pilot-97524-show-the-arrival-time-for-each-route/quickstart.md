# Quickstart: validate "arrival time for each route"

## Prerequisites

- Node ≥ 18 (for `node --test`) and Python 3 (for `npm start`). There are no dependencies to install.

## Automated checks

```bash
npm test                         # every test, including the new arrival-time tests
TZ=Pacific/Kiritimati npm test   # same results in a UTC+14 zone
TZ=America/New_York npm test     # same results in a DST zone
```

Expected: all tests pass in every time zone. The arrival tests cover each example row in [contracts/arrival.md](contracts/arrival.md) (US1 scenarios 1 and 3, the rounding edge case, the +1 and +2 day edge cases, and invalid input). The existing guard tests (`L6 geo_module_pure`, `L8 no_new_dependencies`, and the others) still pass.

## Manual end-to-end check (browser)

1. `npm start` and open http://localhost:8000, then allow location access.
2. Search for a destination and pick a result. Each route row reads `Route N · <distance> · <duration>, arrive HH:MM`, and HH:MM is the current clock plus that row's duration, within 1 minute (US1, SC-001, SC-002).
3. Wait at least one minute without doing anything: the arrival times do **not** change (edge case "passage of time alone").
4. Switch Walk → Car. The new rows show arrival times based on the new current time and the car durations (US2 scenario 1).
5. Add a stop ("Add stop here" on the map). The rows are recomputed with longer durations and the new current time (US2 scenario 2). Reordering, removing and "Clear stops" also refresh the rows.
6. Pick a destination with no route, or go offline. No route rows are shown and the status message reads as before (FR-007).
7. The pleasure line (walking) and the status summary line look the same as before (FR-006).
