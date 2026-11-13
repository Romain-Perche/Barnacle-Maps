# Data Model: Summary Card for the Selected Route

There is no persistence. All entities live in memory in the browser.

## Selected route (existing)

Source: `parseRoutes()` output, stored as `routeLayers[selectedRoute].route` in `src/app.js`.

| Field | Type | Notes |
|---|---|---|
| `distance` | number (m) | Whole journey, including stops |
| `duration` | number (s) | Whole journey, including stops |
| `path` | `[lat, lng][]` | Not used by the card |

Selection state: `selectedRoute` (index) together with `routeLayers` (empty ⇒ no route displayed).

## Arrival info (new, from `arrivalInfo(now, seconds)`)

| Field | Type | Rule |
|---|---|---|
| `time` | `Date` | `now + max(1, round(seconds/60)) × 60 000 ms` |
| `dayOffset` | integer ≥ 0 | Calendar days between local `now` and local `time` (DST-safe, see research R3) |

## Route summary (new, from `routeSummary(route, now, locale?)`)

| Field | Type | Rule |
|---|---|---|
| `duration` | string | `formatDuration(route.duration)`, identical to the panel (FR-003) |
| `distance` | string | `formatDistance(route.distance)`, identical to the panel (FR-003) |
| `arrival` | string | `formatArrival(now, route.duration, locale)`, e.g. `"14:39"`, `"2:39 PM"`, `"00:20 +1 day"` (FR-004, FR-005) |

Validation: `route` must have finite, non-negative `distance` and `duration` (this is already guaranteed by `parseRoute`).

## Card visibility state (in app.js)

```text
           selectRoute(i) [routeLayers non-empty]
 Hidden ──────────────────────────────────────────▶ Visible(route i)
   ▲                                                  │  │  ▲
   │ clearRoutes()  (new request, mode/stops change,  │  │  │ minute tick → re-render arrival
   │                 failure, no route, waiting pos)  │  │  │ (no announcement)
   └──────────────────────────────────────────────────┘  └──┘
                                    selectRoute(j) → Visible(route j) + polite announcement
```

- Visible ⇒ exactly one minute timer is armed. Hidden ⇒ no timer.
- Initial state: Hidden (`hidden` attribute in the HTML).
