# Contract: pure summary helpers (`src/geo.js`)

All functions are pure. They take `now` as a parameter and never read the clock, the DOM or the network. They are exported from `src/geo.js` alongside `formatDistance` / `formatDuration`. Keep the words `document`, `window` and `fetch(` out of `geo.js`, including comments (test L6).

## `arrivalInfo(now: Date, seconds: number) → { time: Date, dayOffset: number }`

- `minutes = Math.max(1, Math.round(seconds / 60))` (same rounding as `formatDuration`)
- `time = new Date(now.getTime() + minutes * 60_000)`
- `dayOffset = Math.round((midnight(time) − midnight(now)) / 86_400_000)`, where `midnight(d) = new Date(d.getFullYear(), d.getMonth(), d.getDate())` in local time

| now (local) | seconds | time | dayOffset |
|---|---|---|---|
| 2026-11-13 14:10:00 | 1500 | 14:35 | 0 |
| 2026-11-13 14:10:50 | 1500 | 14:35:50 | 0 |
| 2026-11-13 14:10:00 | 10 | 14:11 | 0 |
| 2026-11-13 23:50:00 | 1800 | 2026-11-14 00:20 | 1 |
| 2026-11-13 22:00:00 | 180000 (50 h) | 2026-11-16 00:00 | 3 |

## `formatArrival(now: Date, seconds: number, locale?: string) → string`

- Use the locale's hour cycle: `hc = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle`
- `hour: (hc === "h11" || hc === "h12") ? "numeric" : "2-digit"`, `minute: "2-digit"` (so en-GB gives `00:20`, not `0:20`)
- Append `" +1 day"` when `dayOffset === 1` and `" +N days"` when `dayOffset > 1`
- `locale` undefined ⇒ the device default (this is what the app uses)

| now | seconds | locale | result |
|---|---|---|---|
| 14:10 | 1500 | `en-GB` | `14:35` |
| 14:10 | 1500 | `en-US` | `2:35 PM` |
| 23:50 | 1800 | `en-GB` | `00:20 +1 day` |
| 22:00 | 180000 | `en-GB` | `00:00 +3 days` |

Tests should compare after `.replace(/\s/g, " ")`, because some ICU versions put U+202F before AM/PM.

## `routeSummary(route: { distance, duration }, now: Date, locale?: string) → { duration, distance, arrival }`

- `duration = formatDuration(route.duration)`
- `distance = formatDistance(route.distance)`
- `arrival = formatArrival(now, route.duration, locale)`

Example: `routeSummary({ distance: 2350, duration: 1740 }, 14:10, "en-GB")` → `{ duration: "29 min", distance: "2.35 km", arrival: "14:39" }`

Invariant (FR-003): `duration` and `distance` are always `===` the strings the panel builds for the same route.
