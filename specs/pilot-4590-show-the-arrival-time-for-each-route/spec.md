# Feature Specification: Show the Arrival Time for Each Route

**Feature Branch**: `factory/pilot-4590-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

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
- **Long routes** (duration of one hour or more, e.g. "1 h 20 min"): arrival time is still shown in the same "arrive HH:MM" form.
- **Rounding**: The arrival time is the current time plus the route's duration, rounded to the nearest minute, so that it stays consistent with the rounded duration shown (e.g., a route displayed as "25 min" at 14:07 shows 14:32, not 14:31 or 14:33).
- **Very short routes** (under a minute): shown as "1 min" today; the arrival time is the current time plus the actual duration, rounded to the nearest minute.
- **No route found / routing error**: No route entries are shown, so no arrival times are shown; existing messages are unchanged.
- **Superseded computation**: If a newer route request replaces an older one, only the arrival times of the latest routes are shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every route listed in the route panel, the system MUST display the estimated arrival clock time immediately after that route's duration, in the form "<duration>, arrive HH:MM" (e.g., "25 min, arrive 14:32").
- **FR-002**: The arrival time MUST equal the user's current local time at the moment the routes were computed plus that route's total duration, rounded to the nearest minute.
- **FR-003**: The arrival time MUST be shown in the user's local time zone using a 24-hour HH:MM format with two-digit hours and minutes (e.g., "09:05", "14:32").
- **FR-004**: When the arrival falls on a later calendar day than the departure, the system MUST indicate this next to the time (e.g., "(+1 day)", "(+2 days)").
- **FR-005**: The arrival time MUST be shown for both walking and car routes, and for routes with or without stops; for routes with stops it MUST reflect arrival at the final destination.
- **FR-006**: Every time routes are computed again (new destination, travel mode change, stop changes, or any other recomputation), the system MUST recalculate the arrival times from the current time at that moment.
- **FR-007**: Existing route information in the panel (route number, distance, duration, pleasure indicator for walking routes, route selection behavior) MUST remain unchanged apart from the added arrival time.
- **FR-008**: The arrival time MUST be part of the route entry's accessible text so that assistive technologies read it together with the duration.

### Key Entities

- **Route**: An option to reach the destination, with a distance and a duration (already existing). Gains a derived **estimated arrival time** = departure time (now, at computation) + duration.
- **Departure time**: The current local time captured when the routes are computed; shared by all routes of the same computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of route entries shown in the panel display an arrival time alongside their duration, in both walking and car modes.
- **SC-002**: For every route, the displayed arrival time differs by at most 1 minute from the current time at route computation plus the route duration (and exactly matches it after rounding to the nearest minute).
- **SC-003**: After any route recomputation, the displayed arrival times reflect the new computation's time in 100% of cases (no stale arrival times remain).
- **SC-004**: Users can tell when they will arrive on each route without any additional action (no clicks, hovers, or mental arithmetic), immediately when the routes appear.

## Assumptions

- "Leave now" means departure at the moment the routes are computed; there is no way to pick a different departure time in this feature.
- Arrival times are refreshed only when routes are recomputed, as stated in the request; they do not tick forward automatically while the user waits.
- The arrival time is based only on the route duration provided by the routing service; no traffic, waiting, or time spent at stops is added.
- A 24-hour clock is used, matching the example "14:32"; locale-specific 12-hour formats are out of scope.
- The format is "<duration>, arrive HH:MM" as in the user's example; the arrival time is added to each route entry in the panel only. The overall status summary line (e.g., "3 walking routes · fastest …") is not changed by this feature.
- The device clock and time zone are trusted as the source of current local time.
