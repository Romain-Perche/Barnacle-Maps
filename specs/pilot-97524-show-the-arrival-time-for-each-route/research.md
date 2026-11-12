# Research: Show the arrival time for each route

No item in the Technical Context was left as NEEDS CLARIFICATION. The decisions below settle the open design points. The command ran non-interactively, so each choice was made by the planner and is recorded here.

## R1 — Where the arrival-time logic lives

- **Decision**: Two new pure exported functions in `src/geo.js`, `arrivalTime(departure, durationSeconds)` and `formatArrival(departure, durationSeconds)`. `src/app.js` only calls them.
- **Rationale**: The repo already keeps every testable helper in `geo.js`, with no DOM and no fetch, and tests it in Node (`test/geo.test.js`, guard test `L6 geo_module_pure`). Using `Date` does not break that rule. The departure time is passed in as an argument, so the tests are deterministic and never read the real clock.
- **Alternatives considered**: Inline formatting in `drawRoutes`: it can't be unit tested and would mix time logic into DOM code. A new `src/time.js` module: it would be the only module besides `geo.js` and isn't worth it for two small functions.

## R2 — Clock formatting (24 h, zero-padded, local time zone)

- **Decision**: Build the time by hand from `getHours()`/`getMinutes()` with `String(n).padStart(2, "0")`.
- **Rationale**: FR-003 requires exactly `HH:MM` in 24-hour format whatever the browser locale is. `toLocaleTimeString` changes with the locale (it can give `2:32 PM`, `14 h 32`, or no padding), and getting its output stable across Node and browsers takes extra options and still varies by ICU version. The local getters use the device time zone, as the spec assumes.
- **Alternatives considered**: `Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })` was rejected because the output still depends on the locale (separators, numerals) and is harder to assert in tests.

## R3 — Rounding (FR-002)

- **Decision**: `arrivalMs = Math.round((departure.getTime() + durationSeconds * 1000) / 60000) * 60000`. This rounds the exact instant to the nearest minute, and a half minute rounds up (14:32:30 → 14:33, the spec's example).
- **Rationale**: This matches the spec's rounding edge case exactly. Adding the already-rounded displayed duration would accumulate up to two rounding errors.
- **Alternatives considered**: Truncating (`Math.floor`) was rejected because it contradicts the spec example. Rounding the departure and the duration separately was rejected because it can be off by 1 minute more than needed.

## R4 — Later-day marker (FR-004)

- **Decision**: `dayOffset = (Date.UTC(aY, aM, aD) − Date.UTC(dY, dM, dD)) / 86 400 000`, where the Y/M/D values are the *local* calendar fields of the arrival and departure. The suffix is `""` when the offset is 0, ` (+1 day)` when it is 1, and ` (+N days)` when N > 1. It is based on the rounded arrival, so a displayed `00:00` caused by rounding up from 23:59:40 is correctly shown as `+1 day`.
- **Rationale**: Comparing calendar dates, not elapsed time divided by 24 h, keeps the result right on DST-change days (23 h or 25 h days) and when crossing midnight after a short trip (23:50 + 30 min → +1 day).
- **Alternatives considered**: `Math.floor(durationSeconds / 86400)` was rejected because it gives 0 for 23:50 + 30 min.

## R5 — What "computed" means for the departure instant (FR-002, FR-005)

- **Decision**: Capture `const departure = new Date()` in `updateRoutes()` **after** `fetchRoutes` resolves and the superseded-request check passes, just before `drawRoutes`. Pass it to `drawRoutes(routes, m, departure)`, so every route in one computation shares the same departure.
- **Rationale**: Routing, including the detour requests, can take several seconds. The user's "leave now" is the moment the result appears. A superseded request returns before this point (`seq !== routeSeq`), so stale results never get a departure time or an arrival label (edge case "newer request supersedes").
- **Alternatives considered**: Capturing the time at request start: arrivals would be early by the network latency. Capturing it per route inside the loop: routes in one set could show different "now" values.

## R6 — Where the text goes in the panel (FR-001, FR-006)

- **Decision**: Append it to the existing title span, which then reads `Route 1 · 2.10 km · 25 min, arrive 14:32` (or `…, arrive 00:15 (+1 day)`). `formatArrival` returns the `arrive HH:MM[ (+N day[s])]` part, and `drawRoutes` joins it with `", "`.
- **Rationale**: This is exactly the form the spec asks for ("<duration>, arrive HH:MM"). The distance, duration and pleasure spans are unchanged, and the button stays one readable line for screen readers. It needs no CSS change.
- **Alternatives considered**: A separate `<span class="arrival">`: it gives styling flexibility nobody asked for, and the spec wants the text "immediately after" the duration.

## R7 — Refreshing (FR-005, FR-007)

- **Decision**: No timer. Every path that recomputes routes (mode change, `showRoute`, `setStops` for add, remove, reorder and clear, and the location becoming available) already goes through `updateRoutes()`. That function calls `clearRoutes()` first and redraws with a fresh `departure`. On error or no route it returns before `drawRoutes`, so no arrival is shown.
- **Rationale**: The spec explicitly says times don't change between recomputations. The existing single entry point already covers FR-005 and FR-007.
- **Alternatives considered**: A `setInterval` that refreshes the labels every minute was rejected because it contradicts the spec's assumption and the edge case "not changed by the passage of time alone".

## R8 — Invalid input

- **Decision**: `formatArrival` returns `""` if `departure` is not a valid Date or `durationSeconds` is not a finite number ≥ 0. `drawRoutes` then shows no arrival suffix for that route.
- **Rationale**: OSRM always returns a numeric duration, but the helper must fail quietly and never print `NaN:NaN`.
