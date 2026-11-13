# Research: Summary Card for the Selected Route

No NEEDS CLARIFICATION items were left in the Technical Context. The design choices below were settled without user input, because this command ran non-interactively.

## R1. Respecting the device's 12/24-hour setting

- **Decision**: Format with `new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })`. Tests pass an explicit locale (`"en-GB"` → `14:35`, `"en-US"` → `2:35 PM`).
- **Rationale**: Web pages can't read the OS clock preference directly. The default locale's hour cycle is the standard proxy and matches what the browser shows elsewhere. No dependencies needed.
- **Alternatives considered**: Hard-coding 24 h (rejected because it contradicts the clarification). Reading `Intl.DateTimeFormat().resolvedOptions().hourCycle` and branching ourselves (not needed: the formatter already applies it).
- **Known limitation**: If a user's OS 12/24 h toggle differs from their locale's convention, browsers usually follow the locale. This is acceptable and noted here.

## R2. Arrival time consistent with the displayed duration

- **Decision**: `arrival = now + displayedMinutes × 60 000 ms`, with `displayedMinutes = max(1, round(seconds / 60))`. This is the same rounding as `formatDuration`. Seconds are dropped when the time is formatted.
- **Rationale**: The spec's edge case says the arrival time must be consistent with the displayed duration. Acceptance scenario 1.3 (14:10 + 25 min → 14:35) holds for any `now` within 14:10:00–14:10:59.
- **Alternatives considered**: Using raw seconds (rejected: a 24.6 min route shown as "25 min" could give an arrival one minute off from what the user adds up). Rounding the arrival to the nearest minute (rejected: at 14:10:50 + 25 min it would show 14:36, which breaks scenario 1.3).

## R3. Next-day indication

- **Decision**: `dayOffset = round((localMidnight(arrival) − localMidnight(now)) / 86 400 000)`. When `dayOffset ≥ 1`, append ` +1 day` or ` +N days`.
- **Rationale**: Comparing local midnights counts calendar days and stays correct across DST changes (23 h / 25 h days) thanks to `round`.
- **Alternatives considered**: Weekday names (needs locale strings, overkill). Using `toDateString()` equality (only answers "same day or not", with no count).

## R4. Keeping the arrival time current (FR-008, SC-004)

- **Decision**: While the card is visible, one `setTimeout` fires at the next wall-clock minute boundary (`60 000 − now % 60 000` ms, plus a few ms of slack), re-renders, and re-arms. It is cleared in `hideCard()`.
- **Rationale**: The displayed minute changes exactly when the clock does, so the arrival time is never more than about a second stale. That's well within the 1-minute limit. Only one timer ever exists.
- **Alternatives considered**: `setInterval(…, 60000)` (drifts up to 59 s relative to the clock's minute flip). Short polling (wasteful).
- Background tabs throttle timers. Any re-render recomputes from `new Date()`, so the value is correct as soon as the timer fires.

## R5. Accessibility without minute-by-minute announcements (FR-010)

- **Decision**: `#route-card` holds plain text (`role="group"`, `aria-label="Selected route"`) so it can be read on demand. A separate visually hidden `<p id="route-card-live" aria-live="polite">` gets the text `"Route N: 29 min, 2.35 km, arrive 14:39"` only when `selectRoute` runs.
- **Rationale**: If the bar itself were a live region, every minute refresh would be announced. A separate region announces only actual selection changes and never moves focus.
- **Alternatives considered**: Reusing `#status` (rejected: it already carries the search/routing messages, which would be overwritten). Toggling `aria-live` around the ticks (unreliable across screen readers).

## R6. Placement, overlap and map interaction (FR-009)

- **Decision**: Put the bar in `index.html` as a sibling of `#map` (not inside the Leaflet container): `position:absolute; bottom:28px; left:50%; transform:translateX(-50%); z-index:1000; max-width:calc(100% − 24px)`. Items use `white-space:nowrap` and the bar uses `flex-wrap:wrap`.
- **Rationale**: As a sibling, clicks on the bar never reach Leaflet (no stray "Add stop here" popup). Everywhere else the map stays clickable because the bar only covers its own box. `bottom:28px` keeps it above the bottom-right attribution (~16 px tall). Zoom controls are at the top-left, far from the bar. Wrapping, rather than truncating, satisfies the small-screen edge case.
- **Alternatives considered**: A custom `L.Control` at `bottomright`/`bottomleft` (Leaflet has no bottom-center slot; it would need `L.DomEvent.disableClickPropagation` and extra code). Placing it inside `#map` (would need click-propagation handling).

## R7. Not hiding the route endpoints when fitting bounds

- **Decision**: In `drawRoutes`, call `map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + card.offsetHeight + 28] })`. The card is already visible at that point because `selectRoute(0)` runs first.
- **Rationale**: Reserves the bar's height at the bottom so the start and destination markers stay visible (spec small-screen edge case).
- **Alternatives considered**: A fixed extra padding of 60 px (simpler, but wrong when the bar wraps to two lines on phones).

## R9. Showing the travel mode (clarification 2026-11-13, FR-012)

- **Decision**: Add a first, grey part `.rc-mode` with the panel's own mode word, `TRAVEL_MODES[m].label` ("Walk" / "Car"). The mode comes from the `m` that `drawRoutes(routes, m)` received, stored as `drawnMode`; the announcement becomes `Route N, Walk: 29 min, 2.35 km, arrive 14:39`.
- **Rationale**: The same word as the radio button needs no new text and no translation. Grey keeps the blue duration the strongest item (Design A). Using the drawn mode, not the radio state, means the bar can never pair car text with walking figures.
- **Alternatives considered**: An icon (a walker or a car glyph): smaller, but needs a label for screen readers and an emoji renders differently on each system. Putting the mode last: it reads as an afterthought and splits "Arrive" from the figures. Reading the global `mode`: correct today because a mode change clears the routes first, but fragile.

## R8. Where the card hooks into existing flows

- **Decision**: Hide in `clearRoutes()` and show/update in `selectRoute()`.
- **Rationale**: `updateRoutes()` calls `clearRoutes()` first on every path: new search, mode change, stop edits, waiting for position, failure, and empty result. `drawRoutes()` ends with `selectRoute(0)`, and both panel clicks and map clicks go through `selectRoute(i)`. So two hook points cover FR-006 and FR-007 completely.
