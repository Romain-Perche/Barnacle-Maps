# Feature Specification: Show the Arrival Time for Each Route

**Feature Branch**: `factory/pilot-4590-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

## Clarifications

### Session 2026-11-12

- Q: When exactly is the departure time ("now") taken? → A: When the routes of the latest request are received from the routing service, just before they are shown. A computation that waits for the user's location takes its departure time when those routes arrive. (decided by the factory, no question asked)
- Q: Do all routes of one computation share one departure time? → A: Yes. One departure time is captured per computation and used for every route of it. (decided by the factory, no question asked)
- Q: Which events recompute the arrival times? → A: Every route computation: a new destination, a travel mode change, a stop added, removed or reordered, and the first computation that starts when the user's location becomes available. Movement of the user's position alone does not recompute routes (unchanged behaviour). (decided by the factory, no question asked)
- Q: Can actions that do not recompute routes change the arrival text? → A: No. Selecting a route or the pleasure scores finishing leave the arrival text unchanged. (decided by the factory, no question asked)
- Q: What is the exact wording of the later-day indication? → A: One space, then "(+1 day)" for one day or "(+N days)" for N ≥ 2, directly after the time: "arrive 00:15 (+1 day)". Nothing is added for the same day. (decided by the factory, no question asked)
- Q: Where does the arrival text go in the route entry? → A: On the route's title line, after the duration: "Route 1 · 1.20 km · 25 min, arrive 14:32". The pleasure indicator stays on its own line below, unchanged. (decided by the factory, no question asked)
- Q: What if the routing service gives a missing or invalid duration? → A: It is treated as 0, shown as "1 min" like any very short route, so the arrival is the departure minute + 1. The routing service always returns a duration in practice. (decided by the factory, no question asked)
- Q: Which time zone and clock are used, and what if they change while routes are shown? → A: The device clock and time zone at the moment of computation. A later clock or time-zone change has no effect until the next computation. (decided by the factory, no question asked)
- Q: How is "later calendar day" decided? → A: By comparing the local calendar date of the shown arrival time with the local calendar date of the departure, not by counting 24-hour periods. (decided by the factory, no question asked)
- Q: Where does the arrival go when the duration has several parts ("1 h 20 min")? → A: After the whole duration text: "1 h 20 min, arrive 15:27". (decided by the factory, no question asked)
- Q: Must two routes with the same displayed duration show the same arrival time? → A: Yes. Equal arrival times are allowed; a longer route never shows an earlier one. (decided by the factory, no question asked)
- Q: Is SC-004 measured separately? → A: No. SC-004 is met when SC-001 and SC-002 are met. (decided by the factory, no question asked)
- Q: How is a stale arrival time recognised? → A: An arrival time is stale when its departure time is earlier than the latest completed computation. (decided by the factory, no question asked)
- Q: What do the walking, car and stops scenarios show exactly? → A: The same format as the first scenario. Example with a stop, at 14:07 and a 40-minute route: "40 min, arrive 14:47". (decided by the factory, no question asked)
- Q: What happens across a daylight-saving change? → A: The real elapsed duration is added, and the result is shown on the local wall clock (for example, 01:50 + 25 min across a 02:00→03:00 change gives 03:15). (decided by the factory, no question asked)
- Q: What about a departure on a day boundary (23:59:59 + 1 s)? → A: The rounding rule applies first; the later-day indication then compares the calendar dates of the shown arrival time and of the departure. (decided by the factory, no question asked)
- Q: What does assistive technology read? → A: The full title text, including "arrive HH:MM" and any "(+N days)", as part of the route button's accessible name. (decided by the factory, no question asked)
- Q: How does the longer text fit a narrow panel? → A: It wraps onto the next line inside the route button. It is never truncated. (decided by the factory, no question asked)
- Q: Is the limitation "no waiting time at stops" told to the user? → A: Yes. The README says that the arrival time is the current time plus the routing duration only. (decided by the factory, no question asked)
- Q: How is the arrival time rounded (clock 14:07, real time 14:07:40, route shown as "25 min")? → A: Add the displayed minutes to the displayed clock: "arrive 14:32". The departure is truncated to its minute (the clock the user sees), and the duration minutes are exactly the ones shown in the route entry. The arrival always equals clock + duration shown.
- Q: What arrival time does a very short route show (clock 14:07, a 20-second route shown as "1 min")? → A: Use the displayed minute: "1 min, arrive 14:08". The arrival always agrees with the duration on the same line.
- Q: Is SC-002 consistent with the rounding rule? → A: SC-002 is restated: the shown arrival exactly equals the displayed departure clock plus the displayed duration minutes, and it differs from the exact departure + duration by less than 90 seconds.
- Q: Does the spec match the planner's rounding decision? → A: The spec is the reference; the planner's design is updated to the rule above (displayed clock + displayed minutes, including the 1-minute minimum).
- Q: Is the design's arrival formula the same in every document? → A: Yes. The spec rule (displayed clock + displayed minutes) is the reference; the design documents use the same formula. (decided by the factory, no question asked)
- Q: How is a missing, non-numeric, non-finite or negative duration shown, given that FR-007 keeps the duration text unchanged? → A: All are invalid and count as 0 for both the duration text and the arrival: the duration reads "1 min" and the arrival is the departure minute + 1. This is the only allowed change to the duration text (FR-007). (decided by the factory, no question asked)
- Q: When is the route list of a walking computation with extra detour requests "received"? → A: When the final route list of the latest request is ready, after every extra detour response has arrived or failed. The departure time is taken then. (decided by the factory, no question asked)
- Q: Which Node.js version is required? → A: Node.js 20 or later (built-in test runner). Newer versions, such as the development version 26, also work. (decided by the factory, no question asked)
- Q: Do older notes in the checklists that mention "nearest-minute rounding" or an un-updated spec still apply? → A: No. They are historical. The Clarifications in this spec are the reference. (decided by the factory, no question asked)
- Q: What happens to the route entries shown when a new computation starts, ends in an error, or finds no route? → A: Every computation removes the earlier route entries and their arrival times when it starts. While it runs, only the status message ("Computing … routes…") is shown. If it ends in an error or finds no route, no route entries and no arrival times are shown. (decided by the factory, no question asked)
- Q: Does a computation that fails or finds no route count as "completed" for SC-003? → A: Yes. It completes with zero route entries, so no arrival time from an earlier computation can remain. (decided by the factory, no question asked)
- Q: How does the arrival text read for a duration of whole hours? → A: Like other durations: "1 h, arrive 15:07". (decided by the factory, no question asked)
- Q: What exactly does the README say? → A: One line near the route description: each route shows its duration and the arrival time if you leave now ("25 min, arrive 14:32"); the arrival time is the current time plus the routing duration only, with no traffic and no waiting time at stops. (decided by the factory, no question asked)
- Q: Which principles govern this feature, given that the constitution is an unfilled template? → A: The project conventions listed in the plan's Constitution Check (no build step, no dependencies, pure tested helpers in src/geo.js, routeSeq guard, accessibility unchanged, simplicity). Filling in the constitution is out of scope. (decided by the factory, no question asked)
- Q: How are "the duration minutes displayed" defined, independently of the duration text format? → A: As max(1, round(duration in seconds / 60)), halves rounded up, with an invalid duration counted as 0. The duration text and the arrival use this same minute count. (decided by the factory, no question asked)
- Q: Across a daylight-saving change, which duration is added? → A: The displayed minute count, added as real elapsed time to the displayed departure minute. The result is read on the local wall clock. (decided by the factory, no question asked)
- Q: What is shown when the local clock goes back an hour (repeated hour)? → A: The real elapsed time is added and the result is shown on the wall clock. Example: 02:50 (first occurrence) + 25 min across a 03:00→02:00 change reads "arrive 02:15". No later-day indication is shown when the calendar date is the same, even if the shown clock is earlier than the departure clock. (decided by the factory, no question asked)
- Q: Is "the pleasure indicator stays on its own line" a layout or a structure requirement? → A: Both: the pleasure indicator is a separate line below the title in the route entry, and it stays below the title when the title wraps. (decided by the factory, no question asked)
- Q: Are all concrete spec examples traceable to the design examples and checks? → A: Yes. The helper examples include every spec example (including 23:59:59 + 1 s → "arrive 00:00 (+1 day)", a 40-minute route with a stop, whole hours, and a half-minute duration); the daylight-saving examples are checked with a fixed time zone. (decided by the factory, no question asked)
- Q: What is the minute count for a duration of exactly half a minute (e.g. 1530 s)? → A: Halves round up: 1530 s is "26 min", so at 14:07 it reads "26 min, arrive 14:33". (decided by the factory, no question asked)
- Q: Is the time-zone independence of the checks a requirement? → A: It is a design constraint that follows from FR-003 (device local time zone): the checks must give the same result in any time zone. (decided by the factory, no question asked)
- Q: How is FR-006's rule (selecting a route or pleasure scores finishing do not change the arrival text) checked manually? → A: The manual checks include a step: select another route and wait for the pleasure scores; the arrival text of every route stays the same. (decided by the factory, no question asked)
- Q: Which departure time applies when the location arrives late and the mode or stops change before the first routes arrive? → A: The departure time of the latest request, taken when its routes arrive. Earlier requests are superseded and show nothing. (decided by the factory, no question asked)
- Q: Does removing the last stop recompute arrival times? → A: Yes. Every stop change, including removing the last stop, recomputes the routes and the arrival times. (decided by the factory, no question asked)
- Q: Can the status summary line and the route entries give conflicting timing information? → A: No. The status line shows only the fastest duration, with no clock time, so it cannot disagree with the arrival times. (decided by the factory, no question asked)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when I will arrive on each route (Priority: P1)

As a person looking at the routes to a destination, I want to see, next to each route's duration, the clock time at which I would arrive if I left right now, so I can tell at a glance whether I will make it on time without doing the arithmetic myself.

**Why this priority**: This is the whole feature. The duration ("25 min") is already shown; the arrival clock time ("arrive 14:32") is what lets the user decide quickly which route fits their schedule.

**Independent Test**: Search for a destination, wait for routes to appear, and check that every route entry in the panel shows its duration followed by "arrive HH:MM", where HH:MM equals the current local time plus that route's duration.

**Acceptance Scenarios**:

1. **Given** the current local time is 14:07 and a route takes 25 minutes, **When** the routes are shown in the panel, **Then** that route's entry reads "25 min, arrive 14:32" (alongside its existing route number and distance).
2. **Given** three routes with different durations are shown, **When** the user looks at the panel, **Then** each route shows its own arrival time, computed from its own duration, and a longer route never shows an earlier arrival time than a shorter one.
3. **Given** walking mode is selected, **When** routes are shown, **Then** the arrival time appears next to each duration and the pleasure indicator is still shown as before.
4. **Given** car mode is selected, **When** routes are shown, **Then** the arrival time appears next to each duration.
5. **Given** the journey has one or more stops, **When** routes are shown, **Then** each arrival time is the arrival at the final destination (current time plus the full route duration through all stops).

---

### User Story 2 - Arrival time stays consistent with freshly computed routes (Priority: P2)

As a user who changes the destination, travel mode, or stops (or whose routes are otherwise recomputed), I want the arrival times to be recalculated from the moment the new routes are computed, so the displayed times match the routes I am looking at.

**Why this priority**: Without this, arrival times would be stale or wrong after any change, undermining trust in the feature. It depends on Story 1 existing.

**Independent Test**: Show routes, wait at least one minute, then trigger a route recomputation (e.g., switch walking ↔ car, or add a stop) and check that the new arrival times are based on the current time at recomputation, not the earlier time.

**Acceptance Scenarios**:

1. **Given** routes were computed at 14:07 showing "arrive 14:32", **When** the routes are computed again at 14:10 with the same 25-minute duration, **Then** the entry shows "arrive 14:35".
2. **Given** routes are shown, **When** the user switches travel mode, changes destination, or adds, removes, or reorders a stop, **Then** the arrival times shown correspond to the newly computed routes and the current time at that moment.
3. **Given** routes are shown and no recomputation happens, **When** time passes, **Then** the arrival times stay as they were (they are not required to tick forward on their own).

---

### Edge Cases

- **Arrival after midnight**: If the arrival falls on the next calendar day (e.g., leaving 23:50 on a 25-minute route), the time shown is the next-day clock time (00:15) with a clear indication that it is the next day (e.g., "arrive 00:15 (+1 day)"). Arrivals several days later show the matching number of days.
- **Long routes** (duration of one hour or more, e.g. "1 h 20 min"): arrival time is still shown in the same "arrive HH:MM" form. Whole hours read "1 h, arrive 15:07".
- **Half-minute durations**: halves round up (1530 s → "26 min"; at 14:07 → "arrive 14:33").
- **Repeated hour (clock goes back)**: 02:50 (first occurrence) + 25 min across a 03:00→02:00 change reads "arrive 02:15", with no later-day indication.
- **Rounding**: The arrival time is the displayed clock plus the displayed duration minutes, so that it stays consistent with the rounded duration shown (e.g., a route displayed as "25 min" while the clock shows 14:07, real time 14:07:40, shows 14:32, not 14:31 or 14:33).
- **Very short routes** (under a minute): shown as "1 min" today; the arrival time uses that displayed minute (e.g., a 20-second route at 14:07 reads "1 min, arrive 14:08").
- **No route found / routing error**: No route entries are shown, so no arrival times are shown; existing messages are unchanged.
- **Superseded computation**: If a newer route request replaces an older one, only the arrival times of the latest routes are shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every route listed in the route panel, the system MUST display the estimated arrival clock time immediately after that route's duration, in the form "<duration>, arrive HH:MM" (e.g., "25 min, arrive 14:32"), followed by the later-day indication of FR-004 when it applies. The text is on the route's title line; the pleasure indicator stays on its own line. Narrow panels wrap the text and never truncate it.
- **FR-002**: The arrival time MUST equal the user's current local time at the moment the routes were computed plus that route's total duration, computed as the displayed clock (the departure time truncated to its minute) plus the duration minutes displayed for that route (max(1, round(duration in seconds / 60)), halves rounded up). The arrival therefore always equals the shown clock plus the shown duration. The current time is captured once per computation, when the final route list of the latest request is ready (after any extra detour responses), and is shared by all routes of that computation. A missing, non-numeric, non-finite or negative duration is invalid: it counts as 0 for both the duration text and the arrival, and is displayed as "1 min".
- **FR-003**: The arrival time MUST be shown in the user's local time zone using a 24-hour HH:MM format with two-digit hours and minutes (e.g., "09:05", "14:32").
- **FR-004**: When the arrival falls on a later calendar day than the departure, the system MUST indicate this next to the time as " (+1 day)" or " (+N days)" for N ≥ 2. "Later calendar day" compares local calendar dates, not 24-hour periods. Across a daylight-saving change, the displayed minute count is added as real elapsed time to the displayed departure minute, and the result is shown on the local wall clock (for a repeated hour, the shown clock can be earlier than the departure clock without a later-day indication).
- **FR-005**: The arrival time MUST be shown for both walking and car routes, and for routes with or without stops; for routes with stops it MUST reflect arrival at the final destination.
- **FR-006**: Every time routes are computed again (new destination, travel mode change, stop changes, or any other recomputation), the system MUST recalculate the arrival times from the current time at that moment. This includes the first computation that starts when the user's location becomes available. Selecting a route or pleasure scores finishing MUST NOT change the arrival text. A clock or time-zone change while routes are shown has no effect until the next computation. Every computation removes the earlier route entries and their arrival times when it starts; while it runs only the status message is shown.
- **FR-007**: Existing route information in the panel (route number, distance, duration, pleasure indicator for walking routes, route selection behavior) MUST remain unchanged apart from the added arrival time, and apart from an invalid duration now reading "1 min" (FR-002).
- **FR-008**: The arrival time MUST be part of the route entry's accessible text so that assistive technologies read it together with the duration, including any later-day indication.

### Key Entities

- **Route**: An option to reach the destination, with a distance and a duration (already existing). Gains a derived **estimated arrival time** = departure time (now, at computation) + duration.
- **Departure time**: The current local time captured when the routes are computed; shared by all routes of the same computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of route entries shown in the panel display an arrival time alongside their duration, in both walking and car modes.
- **SC-002**: For every route, the displayed arrival time exactly equals the departure clock (HH:MM at route computation) plus the displayed duration minutes, and differs by less than 90 seconds from the exact departure time plus the route duration.
- **SC-003**: After any route recomputation, the displayed arrival times reflect the new computation's time in 100% of cases (no stale arrival times remain; an arrival time is stale when its departure time is earlier than the latest completed computation; a computation that ends in an error or finds no route is completed and shows no route entries).
- **SC-004**: Users can tell when they will arrive on each route without any additional action (no clicks, hovers, or mental arithmetic), immediately when the routes appear. Met when SC-001 and SC-002 are met.

## Assumptions

- "Leave now" means departure at the moment the routes are computed; there is no way to pick a different departure time in this feature.
- Arrival times are refreshed only when routes are recomputed, as stated in the request; they do not tick forward automatically while the user waits.
- The arrival time is based only on the route duration provided by the routing service; no traffic, waiting, or time spent at stops is added. The README states this limitation in one line: each route shows its duration and the arrival time if you leave now ("25 min, arrive 14:32"), and this time is the current time plus the routing duration only.
- A 24-hour clock is used, matching the example "14:32"; locale-specific 12-hour formats are out of scope.
- The format is "<duration>, arrive HH:MM" as in the user's example; the arrival time is added to each route entry in the panel only. The overall status summary line (e.g., "3 walking routes · fastest …") is not changed by this feature.
- The device clock and time zone are trusted as the source of current local time.
