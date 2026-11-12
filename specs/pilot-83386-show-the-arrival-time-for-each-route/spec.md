# Feature Specification: Show the arrival time for each route

**Feature Branch**: `factory/pilot-83386-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when I would arrive on each route (Priority: P1)

As someone planning a trip, after searching for a destination I see, for every route listed in the panel, the clock time at which I would arrive if I left right now, placed right after that route's duration (for example "Route 1 · 2.10 km · 25 min, arrive 14:32"). This lets me compare routes by "when will I be there" without doing mental arithmetic.

**Why this priority**: This is the entire feature; without it there is no value delivered.

**Independent Test**: Search for a destination, let routes appear, and check that each route entry shows "arrive HH:MM" equal to the current local time plus that route's travel time.

**Acceptance Scenarios**:

1. **Given** the current local time is 14:07 and a route takes 25 minutes, **When** the routes are shown in the panel, **Then** that route's entry reads "… 25 min, arrive 14:32".
2. **Given** three routes are shown with different durations, **When** I look at the panel, **Then** each route shows its own arrival time, and a longer route never shows an earlier arrival time than a shorter one.
3. **Given** the travel mode is car, **When** routes are shown, **Then** each car route also shows its arrival time.
4. **Given** the journey includes one or more stops, **When** routes are shown, **Then** the arrival time is that of reaching the final destination after passing through all stops.

---

### User Story 2 - Arrival times refresh when routes are recomputed (Priority: P2)

When the routes are computed again — because I change the destination, the travel mode, the stops, or my position triggers a new computation — the arrival times shown are recalculated from the time of that new computation, so they never show a stale "leave now" moment.

**Why this priority**: Without refresh, the arrival times quickly become misleading; but the feature is still useful on first display alone.

**Independent Test**: Show routes, wait a few minutes, then trigger a new route computation (e.g. switch mode and back); verify arrival times reflect the new current time.

**Acceptance Scenarios**:

1. **Given** routes were computed at 14:07 with a 25 min route showing "arrive 14:32", **When** routes are computed again at 14:12 and the route still takes 25 min, **Then** it shows "arrive 14:37".
2. **Given** routes are displayed, **When** I switch from walking to car, **Then** the new car routes show arrival times based on the time of the switch.

---

### Edge Cases

- **Arrival on the next day**: if the arrival falls after midnight (e.g. leave 23:50, 25 min trip), the time shows as 00:15 together with a clear next-day marker (e.g. "arrive 00:15 (+1 day)"). Trips spanning several days show the corresponding number of days.
- **Long trips**: durations displayed in hours (e.g. "2 h 5 min") still get an arrival time.
- **Very short trips**: a route shown as "1 min" still shows an arrival time (current time plus actual travel time, rounded to the minute).
- **No route found / routing fails**: no arrival time is shown, since no route entries exist; existing error messages are unchanged.
- **Superseded computation**: if a newer route request replaces an older one, only the arrival times of the routes actually displayed are shown, based on when those routes were computed.
- **Time passes without recomputation**: arrival times stay as computed (they do not tick forward on their own); they change only when the routes are computed again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each route entry in the panel MUST show an arrival time immediately after the route's duration, in the form "<duration>, arrive HH:MM" (e.g. "25 min, arrive 14:32").
- **FR-002**: The arrival time MUST equal the moment the routes were computed plus that route's travel time, rounded to the nearest minute, expressed in the device's local time.
- **FR-003**: The arrival time MUST be shown in 24-hour format with two-digit hours and minutes (e.g. 09:05, 14:32).
- **FR-004**: When the arrival falls on a later calendar day than the departure moment, the arrival time MUST be accompanied by a next-day marker indicating the number of days later (e.g. "(+1 day)", "(+2 days)").
- **FR-005**: The arrival time MUST be shown for every displayed route, in both walking and car modes, and with or without stops.
- **FR-006**: Whenever routes are computed again (new destination, mode change, stop change, or any other recomputation), the arrival times MUST be recalculated from the time of that new computation.
- **FR-007**: The arrival time MUST NOT change between computations (no live ticking).
- **FR-008**: Existing route information (route number, distance, duration, pleasure indicator, selection behavior) MUST remain unchanged apart from the added arrival time.
- **FR-009**: The arrival time MUST be part of the route entry's text so it is available to assistive technologies along with the duration.

### Key Entities

- **Route**: an existing option listed in the panel, with distance and travel time; gains a derived arrival time.
- **Departure moment**: the time at which the routes were computed; the "leave now" reference used for all routes of that computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed routes show an arrival time whenever routes are listed.
- **SC-002**: For every route, the displayed arrival time is within 1 minute of the departure moment plus the route's travel time.
- **SC-003**: After any recomputation of routes, the arrival times shown reflect the new departure moment (no stale values) in 100% of cases.
- **SC-004**: Users can tell when they would arrive on each route in a single glance, without having to calculate it themselves.

## Assumptions

- "Leave now" means the moment the routes were computed; all routes in one computation share the same departure moment.
- Travel time is the duration already shown for each route; no extra time is added for stops (stops are passed through without waiting), traffic, or delays beyond what the routing data provides.
- The device's local clock and time zone are used; 24-hour format is used everywhere, matching the example in the request.
- The overall status line summary (e.g. "3 walking routes · fastest …") is out of scope and stays unchanged.
- Rounding: the arrival time uses the exact travel time rounded to the nearest minute, so it may differ by at most one minute from "current time + displayed rounded duration".
