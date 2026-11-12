# Contract: Arrival time helpers and route entry text

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

The app has no network API of its own. Its interfaces are (1) the pure helper module `src/geo.js`, which the tests import, and (2) the text of the route panel, which users and assistive tech read.

## 1. Module API (`src/geo.js`, new exports)

### `arrivalTime(departure, seconds) → { hours, minutes, dayOffset }`

| Param       | Type             | Meaning |
|-------------|------------------|---------|
| `departure` | `Date \| number` | Departure moment (a `Date` or epoch ms) |
| `seconds`   | `number`         | Exact travel time in seconds (`route.duration`) |

Returns the local clock time of `departure + seconds`, rounded to the nearest minute, and the number of local calendar days after the departure date. Pure: no reads of the current clock.

| Departure (local)    | seconds | Result |
|----------------------|---------|--------|
| 2026-11-12 14:07:00  | 1500    | `{ hours: 14, minutes: 32, dayOffset: 0 }` |
| 2026-11-12 14:12:00  | 1500    | `{ hours: 14, minutes: 37, dayOffset: 0 }` |
| 2026-11-12 14:07:00  | 29      | `{ hours: 14, minutes: 7, dayOffset: 0 }` (rounds down) |
| 2026-11-12 14:07:00  | 30      | `{ hours: 14, minutes: 8, dayOffset: 0 }` (rounds half up) |
| 2026-11-12 23:50:00  | 1500    | `{ hours: 0, minutes: 15, dayOffset: 1 }` |
| 2026-11-12 22:00:00  | 2 × 86400 + 7200 | `{ hours: 0, minutes: 0, dayOffset: 3 }` |
| 2026-11-12 23:59:40  | 10      | `{ hours: 0, minutes: 0, dayOffset: 1 }` (rounding crosses midnight) |

### `formatArrival(departure, seconds) → string`

| Condition         | Output |
|-------------------|--------|
| `dayOffset === 0` | `"arrive 14:32"` |
| `dayOffset === 1` | `"arrive 00:15 (+1 day)"` |
| `dayOffset >= 2`  | `"arrive 00:00 (+3 days)"` |

Hours and minutes are always two digits (`09:05`). It is always 24-hour, whatever the locale.

## 2. UI contract (route panel `#routes`)

Each `<li>` in `#routes` contains a `<button>` whose first `<span>` reads exactly:

```text
Route {n} · {formatDistance(distance)} · {formatDuration(duration)}, {formatArrival(departure, duration)}
```

Examples:
- `Route 1 · 2.10 km · 25 min, arrive 14:32`
- `Route 2 · 48.3 km · 2 h 5 min, arrive 16:12`
- `Route 1 · 1.20 km · 18 min, arrive 00:08 (+1 day)`

Invariants:
- Every route in the list has an arrival (walk and car, with or without stops), using one `departure` per computation.
- Walking routes keep the `.pleasure` span after the title, unchanged.
- `#status` is unchanged and contains no arrival time (FR-010).
- The text doesn't change until the next `updateRoutes()` draws new routes (FR-007).
