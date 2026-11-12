# Contract: arrival helpers (`src/geo.js`)

Pure functions with no DOM and no fetch, and they never read the current time themselves. They are exported alongside `formatDuration`.

## `arrivalTime(departure, seconds) → { at: Date, dayOffset: number }`

- `departure`: `Date`, the moment the routes were computed.
- `seconds`: route duration in seconds. Non-finite or negative values are treated as `0`.
- `at` = `departure` with seconds/ms zeroed + `Math.max(1, Math.round(seconds / 60))` minutes (epoch arithmetic, DST-safe). This is the same minute count `formatDuration` displays, so the arrival always equals the shown clock + the shown duration.
- `dayOffset` = number of local calendar days from `departure`'s date to `at`'s date (≥ 0).

## `formatClock(date) → string`

- Local time, 24-hour, `HH:MM`, both fields zero-padded. Examples: `09:05`, `14:32`, `00:15`.

## `formatArrival(departure, seconds) → string`

- `"arrive " + formatClock(at)` + suffix: `""` if `dayOffset === 0`, `" (+1 day)"` if 1, `" (+N days)"` if N ≥ 2.

## Examples (local time)

| departure | seconds | result |
|-----------|---------|--------|
| 14:07:40 | 1500 (25 min) | `arrive 14:32` |
| 14:10:00 | 1500 | `arrive 14:35` |
| 14:07:00 | 1529 (25.48 min) | `arrive 14:32` |
| 14:07:00 | 1531 (25.52 min) | `arrive 14:33` |
| 14:07:00 | 20 | `arrive 14:08` |
| 14:07:00 | 0 / NaN / -5 | `arrive 14:08` |
| 08:55:00 | 600 | `arrive 09:05` |
| 14:07:00 | 4800 (1 h 20 min) | `arrive 15:27` |
| 23:50:00 | 1500 | `arrive 00:15 (+1 day)` |
| 23:00:00 | 180000 (50 h) | `arrive 01:00 (+3 days)` |
