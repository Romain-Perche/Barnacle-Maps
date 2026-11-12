# Contract: arrival-time helpers (`src/geo.js`) and panel text

## `arrivalTime(departure, durationSeconds) → Date | null`

- `departure`: `Date`, the moment the routes were computed.
- `durationSeconds`: number, the route duration from OSRM.
- Returns a new `Date` equal to `departure + durationSeconds`, rounded to the nearest minute (a half minute rounds up).
- Returns `null` if `departure` is not a valid Date or `durationSeconds` is not a finite number ≥ 0.
- Pure: it never reads the clock and never mutates `departure`.

## `formatArrival(departure, durationSeconds) → string`

- Returns `"arrive HH:MM"`, using 24-hour local time with zero-padded hours and minutes.
- Appends `" (+1 day)"` when the arrival falls on the next local calendar day, and `" (+N days)"` when N ≥ 2.
- Returns `""` when `arrivalTime` returns `null`.

### Examples (dates built with the local `new Date(y, mIndex, d, h, min, s)`, so they hold in any time zone)

| departure | durationSeconds | result |
|-----------|-----------------|--------|
| 2026-11-12 14:07:00 | 1500 (25 min) | `arrive 14:32` |
| 2026-11-12 09:55:00 | 4200 (1 h 10 min) | `arrive 11:05` |
| 2026-11-12 14:07:40 | 1490 (24 min 50 s) | `arrive 14:33` |
| 2026-11-12 08:00:00 | 300 | `arrive 08:05` |
| 2026-11-12 23:50:00 | 1500 | `arrive 00:15 (+1 day)` |
| 2026-11-12 23:59:40 | 20 | `arrive 00:00 (+1 day)` |
| 2026-11-12 22:00:00 | 180000 (50 h) | `arrive 00:00 (+2 days)` |
| 2026-11-12 14:07:00 | 0 | `arrive 14:07` |
| `new Date(NaN)` / `NaN` / `-5` | — | `""` |

## Panel text (UI contract, `src/app.js` `drawRoutes`)

Each route button's title span reads:

```
Route {i} · {formatDistance(distance)} · {formatDuration(duration)}, {formatArrival(departure, duration)}
```

e.g. `Route 1 · 2.10 km · 25 min, arrive 14:32`. If `formatArrival` returns `""`, the `", …"` suffix is left out. The pleasure span, the button structure, `aria-pressed`, and the status line stay as they are (FR-006, spec assumption on the summary line).
