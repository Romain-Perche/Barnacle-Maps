# Research: Show the Arrival Time for Each Route

No item in the Technical Context was left as NEEDS CLARIFICATION; the decisions below resolve the
spec's open details. Nobody could be asked during this run, so each choice was made by the planner and is
recorded here.

## R1. Rounding rule (FR-002, edge case "Rounding")

- **Decision**: `arrival = departure truncated to the minute + Math.round(durationSeconds / 60) minutes`.
- **Rationale**: The spec's example is "a route displayed as 25 min at 14:07 shows 14:32, not 14:31 or
  14:33". The user's clock reads 14:07 for the whole minute 14:07:00–14:07:59, so the only rule that
  always matches "clock + displayed duration" is truncate the departure and add the rounded duration.
  The result is never more than 1 minute away from the exact `now + duration` (SC-002). It is
  monotonic in duration, so a longer route never shows an earlier arrival (US1 scenario 2).
- **Alternatives considered**:
  - `round(now + duration)`: at 14:07:40 + 25 min it gives 14:33, which contradicts the spec example.
  - `now + formatDuration minutes` (with the `max(1, …)` clamp): the spec's "very short routes" edge case says
    to use the *actual* duration, so the clamp is not applied. A 20 s route at 14:07 reads
    "1 min, arrive 14:07".

## R2. Departure capture point (FR-002, FR-006, superseded computation)

- **Decision**: `const departure = new Date()` in `updateRoutes()` after `fetchRoutes` resolves, after the
  `seq !== routeSeq` guard and the empty-result check, passed into `drawRoutes`. One value is shared by all routes of
  that computation.
- **Rationale**: "Now, at the moment the routes are computed". Capturing before the fetch would make the
  times stale by the network latency (detour fetches can take seconds). Every recomputation path
  (destination, mode, stops, position arriving late through `pendingRoute`) already goes through
  `updateRoutes`, so FR-006 needs no extra hook. Superseded requests return before drawing.
- **Alternatives**: capture in `drawRoutes` per route (routes could disagree by milliseconds across a
  minute boundary), or a live-ticking timer (explicitly out of scope, US2 scenario 3).

## R3. Clock formatting and time zone (FR-003)

- **Decision**: Manual `HH:MM` from `getHours()`/`getMinutes()` with `padStart(2, "0")`, using local time.
- **Rationale**: Deterministic 24-hour output on every browser/locale. `Intl.DateTimeFormat` with
  `hourCycle: "h23"` behaves the same but its output varies by locale (e.g. separators) and is harder to assert
  in tests. Local time follows the device time zone (spec Assumption).
- **DST**: Adding minutes as milliseconds to an epoch timestamp and then reading local fields gives the
  correct wall clock across DST changes.

## R4. Next-day indication (FR-004)

- **Decision**: `dayOffset` = difference between the local calendar dates of arrival and departure, computed as
  `Math.round((Date.UTC(arrY, arrM, arrD) - Date.UTC(depY, depM, depD)) / 86_400_000)`. Suffix `" (+1 day)"`
  when 1, `" (+N days)"` when N > 1, nothing when 0.
- **Rationale**: Calendar-date comparison (not `duration / 24h`) is what "next calendar day" means:
  23:50 + 25 min crosses midnight while 00:10 + 23 h does not. Using `Date.UTC` on local Y/M/D avoids
  23 h / 25 h DST days.

## R5. Where the text goes / accessibility (FR-001, FR-007, FR-008)

- **Decision**: Append `, arrive HH:MM[ (+N day[s])]` to the existing title `<span>` text in `drawRoutes`.
- **Rationale**: The `<span>` is inside the route `<button>` with no `aria-label`, so the button's
  accessible name already contains the full text. No CSS or DOM change, and the pleasure `<span>` stays as it is.
- **Alternatives**: a separate `<span class="arrival">` (more DOM and CSS for no requirement), or a `<time>`
  element (an ISO `datetime` attribute is not needed by any requirement).

## R6. Testing approach

- **Decision**: Pure helpers take `departure: Date` explicitly. Tests build dates with the local-time
  constructor `new Date(2026, 10, 12, 14, 7, 40)` so assertions hold in any `TZ`. A source check on
  `src/app.js` (as `test/routes.test.js` already does) verifies the wiring.
- **Alternatives**: mocking `Date` globally is more brittle and not needed.
