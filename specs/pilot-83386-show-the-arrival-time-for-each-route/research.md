# Research: Show the arrival time for each route

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-12

The Technical Context had no open NEEDS CLARIFICATION items: the stack is fixed by the existing app (plain ES modules, no build, `node --test`). The research below settles the design decisions the spec leaves open.

## R1. Where the arrival-time logic lives

- **Decision**: Put two new pure helpers in `src/geo.js`: `arrivalTime(departure, seconds)` (computes the value) and `formatArrival(departure, seconds)` (builds the text). `src/app.js` only calls `formatArrival` when it builds each route entry.
- **Rationale**: `src/geo.js` is the project's home for pure, DOM-free helpers that are unit-tested in Node (`formatDuration`, `formatDistance`, …). Keeping the clock arithmetic there makes the edge cases (midnight rollover, several days, rounding) testable without a browser.
- **Alternatives considered**: Inline date code in `drawRoutes` (can't be unit-tested, and it mixes the DOM with time arithmetic). A new module `src/time.js` (more structure than two small functions need, and it breaks the single-helper-module convention).

## R2. Departure moment ("leave now")

- **Decision**: Capture `const departure = new Date()` in `updateRoutes()` once the routes have arrived and the superseded-request check (`seq !== routeSeq`) has passed, right before `drawRoutes(...)`. Pass it into `drawRoutes(routes, m, departure)` so every route of that computation shares the same departure.
- **Rationale**: Per the spec's Assumptions, "leave now" is the moment the routes were computed, and all routes of one computation share it. Taking the time after the fetch (which can take seconds, or longer with walking detours) is closest to when the user actually sees the routes. Taking it after the supersede check means a stale, discarded request never produces arrival times (edge case "Superseded computation").
- **Alternatives considered**: Taking the time when the request starts (slightly stale by the network latency). Calling `new Date()` separately for each route (routes of one computation could straddle a minute boundary, which breaks "shared departure moment").

## R3. Rounding

- **Decision**: `arrival = departure + seconds * 1000 ms`, then round that instant to the nearest minute (`Math.round(ms / 60000) * 60000`). Don't add the *displayed* (rounded, minimum 1 min) duration.
- **Rationale**: FR-002 says "plus that route's travel time, rounded to the nearest minute", and the Assumptions say it uses the *exact* travel time. Rounding a monotonic function keeps it monotonic, so a longer route never shows an earlier arrival (US1 scenario 2). The result is always within 30 s of the true arrival (SC-002).
- **Alternatives considered**: Truncating the departure to the minute and then adding the rounded duration. That can be off by up to about 1.5 min and doesn't match FR-002's wording. Plain truncation (floor) of the arrival is biased early.

## R4. Local time, 24-hour format, day offset

- **Decision**: Use the `Date` local getters (`getHours()`, `getMinutes()`) and zero-pad them with `String(n).padStart(2, "0")` to get `HH:MM`. Compute the day offset as the difference between the **local calendar dates** of departure and arrival: `Math.round((Date.UTC(aY,aM,aD) - Date.UTC(dY,dM,dD)) / 86400000)` using local `getFullYear/getMonth/getDate`.
- **Rationale**: FR-002 and FR-003 call for device local time and a fixed 24-hour `HH:MM`. `Intl.DateTimeFormat`/`toLocaleTimeString` depend on the locale (they can produce 12-hour output, different separators, or `24:05` in some engines), so manual formatting is deterministic and matches the spec everywhere. Comparing calendar dates through `Date.UTC` of the local Y/M/D components ignores DST jumps (23 h or 25 h days), so "+1 day" means "a later calendar date", as FR-004 requires.
- **Alternatives considered**: `toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", hourCycle: "h23"})` (works, but the output still varies by locale, and it's harder to assert in Node tests that run under arbitrary locales). Using elapsed hours / 24 for the day offset (wrong: leaving at 23:50 for 25 min is "+1 day" even though less than 24 h elapsed).

## R5. Text format and placement

- **Decision**: The route title becomes `Route N · <distance> · <duration>, arrive HH:MM` plus an optional suffix ` (+1 day)` or ` (+N days)`. It stays in the same single `<span>` text node inside the route button.
- **Rationale**: The text matches the spec's example ("25 min, arrive 14:32") and FR-004's marker wording. Because the arrival is part of the visible text in the button, assistive technologies read it with the duration (FR-009), with no extra ARIA needed. The pleasure span, the selection, and the status line stay as they are (FR-008, FR-010).
- **Alternatives considered**: A separate styled `<span class="arrival">` (possible later, but a plain text node is enough and keeps the diff minimal; no CSS changes needed). A `<time datetime>` element (semantic, but it adds markup for no requirement).

## R6. Refresh behaviour

- **Decision**: No timer. Arrival times are computed only inside `updateRoutes()` → `drawRoutes()`, which already runs on every recomputation trigger (destination, mode, stops, a pending position).
- **Rationale**: FR-006 (recompute on every recomputation) is met for free because `clearRoutes()` and `drawRoutes()` rebuild every entry. FR-007 (no live ticking) is met because nothing updates the text between computations.
- **Alternatives considered**: A `setInterval` refresh, which the spec rejects (FR-007).
