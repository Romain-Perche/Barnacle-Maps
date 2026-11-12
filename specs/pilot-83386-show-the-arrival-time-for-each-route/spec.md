# Feature Specification: Show the arrival time for each route

**Feature Branch**: `factory/pilot-83386-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

## Clarifications

### Session 2026-11-12

- Q: Should the arrival time also appear in the status line under the route list, or only in each route entry? → A: Only in each route entry (Option A); the status line does not change.
- Q: When exactly is the departure moment ("leave now") taken? → A: the moment the computed routes are received, just before they are displayed; one departure moment per computation (decided by the factory, no question asked)
- Q: Do all routes of one computation share one departure moment? → A: yes, all routes displayed together use the same departure moment (now stated in FR-002) (decided by the factory, no question asked)
- Q: Which events recompute the routes and so refresh the arrival times? → A: every rebuild of the route list: destination change, mode change, stop added/removed/reordered/cleared, and the first route computation after the position becomes available; position updates that do not rebuild the list do not change the arrival times (decided by the factory, no question asked)
- Q: What does a route entry show while routes are still being computed? → A: nothing new: route entries (and their arrival times) appear only once the routes are computed; the existing "Computing … routes…" status stays (decided by the factory, no question asked)
- Q: Is "later calendar day" a calendar date difference or elapsed 24-hour periods? → A: the difference between the local calendar dates of departure and arrival, based on the displayed (rounded) arrival time (decided by the factory, no question asked)
- Q: Which time-zone rules apply across a daylight-saving change? → A: the arrival time is the local clock time the device will show at the arrival instant, using the device's time-zone rules; the day marker still compares calendar dates (decided by the factory, no question asked)
- Q: Is the 24-hour format required whatever the locale or 12-hour preference? → A: yes, always HH:MM 24-hour, regardless of locale or device 12-hour setting (decided by the factory, no question asked)
- Q: Is the word "arrive" fixed? → A: yes, the fixed lowercase English word "arrive", like the rest of the app's English-only text (decided by the factory, no question asked)
- Q: Does US1 scenario 1 (14:07 + 25 min → 14:32) depend on the seconds of the current time? → A: the scenario assumes the current time is exactly 14:07:00; the scenario text now says so (decided by the factory, no question asked)
- Q: How can SC-004 be measured? → A: the arrival time is in the same line of text as the duration of each route entry, with no extra action needed (SC-004 reworded) (decided by the factory, no question asked)
- Q: How is SC-003 tested without a precise departure moment? → A: SC-003 now refers to the departure moment as defined in Key Entities (decided by the factory, no question asked)
- Q: Which success criterion verifies FR-009? → A: new SC-005: the arrival time is part of each route entry's accessible name (decided by the factory, no question asked)
- Q: How does monotonicity apply to routes with the same displayed duration? → A: it applies to exact travel times: a route with a longer exact travel time never shows an earlier arrival; routes with equal displayed durations may show the same or a one-minute-later arrival (decided by the factory, no question asked)
- Q: Does rounding alone past midnight trigger the next-day marker? → A: yes, the marker follows the displayed arrival time (e.g. 23:59:40 + 10 s shows "arrive 00:00 (+1 day)") (decided by the factory, no question asked)
- Q: What happens if the device clock or time zone changes between computations? → A: the arrival times shown do not change; the next computation uses the new clock and time zone (decided by the factory, no question asked)
- Q: What departure moment applies when routes wait for the user's location? → A: the moment the routes are received after the location became available (decided by the factory, no question asked)
- Q: What if a route's travel time is zero? → A: the arrival time equals the departure moment (shown with the existing "1 min" duration); the routing data always provides a travel time (decided by the factory, no question asked)
- Q: How do screen readers get the arrival time? → A: by reading the visible route entry text as is; no extra label (decided by the factory, no question asked)
- Q: How does the longer route text fit on narrow panels? → A: it wraps onto several lines inside the route entry; no truncation (decided by the factory, no question asked)
- Q: Should stale times be flagged when no recomputation happens? → A: no; no staleness indicator, out of scope (the request asks for an update only when routes are recomputed) (decided by the factory, no question asked)
- Q: Should users be told the arrival ignores traffic and delays? → A: no user-visible note; the limitation stays in Assumptions (decided by the factory, no question asked)
- Q: What if the device clock is wrong? → A: the arrival times are off by the same amount; the device clock is assumed correct (added to Assumptions) (decided by the factory, no question asked)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when I would arrive on each route (Priority: P1)

As someone planning a trip, after searching for a destination I see, for every route listed in the panel, the clock time at which I would arrive if I left right now, placed right after that route's duration (for example "Route 1 · 2.10 km · 25 min, arrive 14:32"). This lets me compare routes by "when will I be there" without doing mental arithmetic.

**Why this priority**: This is the entire feature; without it there is no value delivered.

**Independent Test**: Search for a destination, let routes appear, and check that each route entry shows "arrive HH:MM" equal to the current local time plus that route's travel time.

**Acceptance Scenarios**:

1. **Given** the current local time is 14:07:00 and a route takes 25 minutes, **When** the routes are shown in the panel, **Then** that route's entry reads "… 25 min, arrive 14:32".
2. **Given** three routes are shown with different durations, **When** I look at the panel, **Then** each route shows its own arrival time, and a route with a longer travel time never shows an earlier arrival time than a route with a shorter one (routes with the same displayed duration may differ by one minute).
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
- **Rounding past midnight**: if rounding alone moves the arrival past midnight (e.g. leave 23:59:40, 10 s trip), the next-day marker is shown ("arrive 00:00 (+1 day)").
- **Daylight-saving change**: the arrival time is the local clock time the device shows at the arrival instant; the day marker compares calendar dates.
- **Clock or time zone changed between computations**: displayed arrival times stay unchanged; the next computation uses the new clock and time zone.
- **Waiting for location**: when routes wait for the user's position, the departure moment is when the routes are received after the position arrives.
- **While computing**: no route entries and so no arrival times are shown until the routes are received; the existing status message is unchanged.
- **Zero travel time**: the arrival time equals the departure moment.
- **Narrow panel**: the route entry text wraps onto several lines; nothing is truncated.
- **Time passes without recomputation**: arrival times stay as computed (they do not tick forward on their own); they change only when the routes are computed again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each route entry in the panel MUST show an arrival time immediately after the route's duration, in the form "<duration>, arrive HH:MM" (e.g. "25 min, arrive 14:32").
- **FR-002**: The arrival time MUST equal the moment the routes were computed plus that route's travel time, rounded to the nearest minute, expressed in the device's local time. All routes of one computation MUST use the same departure moment.
- **FR-003**: The arrival time MUST be shown in 24-hour format with two-digit hours and minutes (e.g. 09:05, 14:32), regardless of the device locale or 12-hour setting. The word "arrive" is fixed, lowercase English.
- **FR-004**: When the arrival falls on a later local calendar date than the departure moment (comparing calendar dates of the displayed arrival time, not elapsed 24-hour periods), the arrival time MUST be accompanied by a next-day marker indicating the number of days later (e.g. "(+1 day)", "(+2 days)").
- **FR-005**: The arrival time MUST be shown for every displayed route, in both walking and car modes, and with or without stops.
- **FR-006**: Whenever routes are computed again (new destination, mode change, stop added/removed/reordered/cleared, or the first computation once the user's position is available), the arrival times MUST be recalculated from the time of that new computation.
- **FR-007**: The arrival time MUST NOT change between computations (no live ticking).
- **FR-008**: Existing route information (route number, distance, duration, pleasure indicator, selection behavior) MUST remain unchanged apart from the added arrival time.
- **FR-009**: The arrival time MUST be part of the route entry's text so it is available to assistive technologies along with the duration; screen readers read the visible text as is, with no extra label.
- **FR-010**: The status line under the route list (e.g. "3 walking routes · fastest 2.10 km · 25 min") MUST NOT show an arrival time and MUST stay unchanged.

### Key Entities

- **Route**: an existing option listed in the panel, with distance and travel time; gains a derived arrival time.
- **Departure moment**: the time at which the computed routes are received, just before they are displayed; the "leave now" reference used for all routes of that computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of displayed routes show an arrival time whenever routes are listed.
- **SC-002**: For every route, the displayed arrival time is within 1 minute of the departure moment plus the route's travel time.
- **SC-003**: After any recomputation of routes, the arrival times shown reflect the new departure moment as defined in Key Entities (no stale values) in 100% of cases.
- **SC-004**: Each route entry shows its arrival time in the same line of text as its duration, so users read it without any extra action or calculation.
- **SC-005**: In 100% of route entries, the arrival time is part of the entry's accessible name.

## Assumptions

- "Leave now" means the moment the routes were computed; all routes in one computation share the same departure moment.
- Travel time is the duration already shown for each route; no extra time is added for stops (stops are passed through without waiting), traffic, or delays beyond what the routing data provides.
- The device's local clock and time zone are used; 24-hour format is used everywhere, matching the example in the request.
- The status line summary under the route list (e.g. "3 walking routes · fastest …") is out of scope and stays unchanged (confirmed in Clarifications, see FR-010).
- Rounding: the arrival time uses the exact travel time rounded to the nearest minute, so it may differ by at most one minute from "current time + displayed rounded duration".
- The device clock is assumed correct; if it is wrong, the arrival times are off by the same amount.
- No user-visible note says that traffic and delays are ignored; no staleness indicator is shown when time passes without recomputation.
