# Feature Specification: Show the arrival time for each route

**Feature Branch**: `factory/pilot-97524-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

## Clarifications

### Session 2026-11-12

- Q: Which instant is "the time at which the routes were computed"? → A: The moment the route results are received and about to be displayed (after any superseded-request check), taken once and shared by all routes of that set. (decided by the factory, no question asked)
- Q: Is the location becoming available a recomputation trigger? → A: Yes. When a route was waiting for the user's position and the position arrives, the routes are computed and the arrival times use that moment. (decided by the factory, no question asked)
- Q: What is shown if one route's duration is missing or invalid? → A: That route shows no arrival suffix; the other routes keep theirs. Distance and duration are unchanged. (decided by the factory, no question asked)
- Q: Is the departure time ("now") shown anywhere? → A: No. Only the arrival time is shown; "+N day" is relative to the user's current local day at computation. (decided by the factory, no question asked)
- Q: How is exactly half a minute rounded? → A: Up (14:32:30 → 14:33). (decided by the factory, no question asked)
- Q: Is "later calendar day" counted in local calendar days or in 24-hour periods? → A: Local calendar days (23:50 + 30 min → "+1 day"), which also stays correct on daylight-saving days. (decided by the factory, no question asked)
- Q: What is the exact day-marker text? → A: One space after HH:MM, then "(+1 day)" for one day and "(+N days)" for N ≥ 2. (decided by the factory, no question asked)
- Q: What exactly follows the duration? → A: A comma and a space, then "arrive HH:MM" in lower case, on the same line as the distance and duration. (decided by the factory, no question asked)
- Q: Which time zone is used? → A: The device's time zone at the moment of computation. (decided by the factory, no question asked)
- Q: Which duration is added: the raw one or the displayed one? → A: The raw routing duration in seconds, not the rounded displayed duration. (decided by the factory, no question asked)
- Q: Is the example distance "2.1 km" consistent with the app's format? → A: No; the example is corrected to "2.10 km" (two decimals under 10 km). (decided by the factory, no question asked)
- Q: Is excluding the status summary line consistent with "every route listed in the panel"? → A: Yes. The summary line is not a route entry; FR-001 applies only to the route entries. (decided by the factory, no question asked)
- Q: Do US2, FR-005 and SC-003 list the same triggers? → A: They now share one list: travel mode change, new destination, stop added/removed/reordered/cleared, and the location becoming available for a waiting route. (decided by the factory, no question asked)
- Q: Is "+2 days" a realistic case? → A: Rare, but long car trips can exceed a day; the general "+N days" rule is kept. (decided by the factory, no question asked)
- Q: How is SC-004 measured? → A: With 3 routes shown, a reviewer who has not seen the routes before names the earliest-arriving route by reading the panel only, in under 5 seconds. (decided by the factory, no question asked)
- Q: How is a "leftover" arrival time defined for SC-003? → A: Any arrival time on screen whose departure instant is older than the latest completed computation. (decided by the factory, no question asked)
- Q: Is there an acceptance example for the day marker? → A: Yes; scenario 4 of US1 is added (23:50 + 25 min → "arrive 00:15 (+1 day)"). (decided by the factory, no question asked)
- Q: What is shown between a recomputation trigger and its results? → A: The previous routes and their arrival times are removed at once (existing behavior); the new ones appear with the results. (decided by the factory, no question asked)
- Q: How are daylight-saving transitions handled? → A: The clock shows the real local wall-clock time of the arrival instant; the day marker uses local calendar days. (decided by the factory, no question asked)
- Q: What if the device clock or time zone changes while the page is open? → A: Nothing changes until the next computation, which uses the new clock and time zone. (decided by the factory, no question asked)
- Q: What if rounding alone moves the arrival past midnight? → A: The rounded arrival decides the day: 23:59:40 + 20 s → "arrive 00:00 (+1 day)". (decided by the factory, no question asked)
- Q: What if the duration is zero or under a minute? → A: The arrival is the computation time plus that duration, rounded to the nearest minute; it may equal the current minute. (decided by the factory, no question asked)
- Q: How are the arrival texts announced by screen readers? → A: They are plain text inside the route button, so they are part of its accessible name; no extra label is needed. (decided by the factory, no question asked)
- Q: What happens if the longer route line does not fit the narrow panel? → A: It wraps onto a second line; it is never truncated. (decided by the factory, no question asked)
- Q: Is 24-hour-only a deliberate choice? → A: Yes, it matches the request example; no 12-hour option is offered in this feature. (decided by the factory, no question asked)
- Q: Are car durations a reliable "leave now" estimate? → A: They are the routing service's estimates without live traffic; this is a known limitation. (decided by the factory, no question asked)
- Q: What if the device clock is wrong? → A: The arrival times are wrong by the same amount; this is accepted and not detected. (decided by the factory, no question asked)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when I will arrive on each route (Priority: P1)

As a user who has searched for a destination, I see in the panel, next to each route's duration, the clock time at which I would arrive if I left right now (e.g. "Route 1 · 2.10 km · 25 min, arrive 14:32"). I can compare routes by arrival time without doing mental arithmetic.

**Why this priority**: This is the whole feature; it turns a relative duration into an actionable answer ("will I make it by 14:45?").

**Independent Test**: Search for a destination at a known current time, and check that every route entry in the panel shows "arrive HH:MM" equal to the current time plus that route's duration.

**Acceptance Scenarios**:

1. **Given** the current time is 14:07 and a route takes 25 min, **When** the routes are shown in the panel, **Then** that route reads "25 min, arrive 14:32".
2. **Given** several routes are shown (walking or car, with or without stops), **When** I look at the panel, **Then** each route shows its own arrival time computed from its own duration.
3. **Given** a route takes 1 h 10 min and the current time is 09:55, **When** the routes are shown, **Then** that route reads "1 h 10 min, arrive 11:05".
4. **Given** the current time is 23:50 and a route takes 25 min, **When** the routes are shown, **Then** that route reads "25 min, arrive 00:15 (+1 day)".

---

### User Story 2 - Arrival time refreshes when routes are recomputed (Priority: P2)

When the routes are computed again (I change the travel mode, choose another destination, add, remove, reorder or clear stops, or my location becomes available for a route that was waiting for it), the arrival times are recalculated from the time of that new computation.

**Why this priority**: Without refreshing, arrival times become stale and misleading; the description explicitly requires it.

**Independent Test**: Show routes, wait a few minutes, switch Walk → Car (or add a stop), and check that the new arrival times are based on the new current time and the new durations.

**Acceptance Scenarios**:

1. **Given** routes were shown at 14:07, **When** at 14:12 I switch the travel mode and the routes are recomputed, **Then** each new route's arrival time equals 14:12 plus its new duration.
2. **Given** routes are shown, **When** I add a stop and the routes are recomputed, **Then** the arrival times reflect the new (longer) durations and the time of recomputation.

---

### Edge Cases

- Arrival after midnight: if now + duration falls on a later calendar day, the time is still shown as HH:MM and is marked as being on a later day (e.g. "arrive 00:15 (+1 day)"; "+2 days" etc. for longer trips).
- Rounding: the arrival time is the computation time plus the exact route duration, rounded to the nearest minute (e.g. 14:07:40 + 24 min 50 s = 14:32:30 → "arrive 14:33"); it may therefore differ by up to one minute from adding the rounded displayed duration to the displayed clock.
- No route found or routing fails: no arrival time is shown (the existing status message is unchanged).
- A newer route request supersedes an older one: only the arrival times of the routes actually displayed are shown.
- Recomputation in progress: the previous routes and their arrival times are removed as soon as a recomputation starts; the new ones appear with the new results.
- Daylight-saving transitions: the clock shows the real local wall-clock time of the arrival instant; the day marker counts local calendar days.
- Device clock or time zone changes between computations: shown times do not change until the next computation, which uses the new clock and time zone. A wrong device clock gives arrival times wrong by the same amount.
- Rounding past midnight: the rounded arrival decides the day (23:59:40 + 20 s → "arrive 00:00 (+1 day)").
- Zero or sub-minute duration: the arrival is the computation time plus that duration, rounded; it may equal the current minute.
- A route with a missing or invalid duration shows no arrival suffix; the other routes keep theirs.
- The page stays open without any recomputation: arrival times are not changed by the passage of time alone (they reflect "leave now" as of the last computation).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every route listed in the panel, the system MUST display the estimated arrival clock time immediately after that route's duration, in the form "<duration>, arrive HH:MM": a comma and a space, then "arrive" in lower case, on the same line as the distance and duration.
- **FR-002**: The arrival time MUST equal the time at which the routes were computed (the moment the route results are received for display, taken once per set of routes) plus that route's raw travel duration in seconds, rounded to the nearest minute (half a minute rounds up).
- **FR-003**: The arrival time MUST be shown in 24-hour HH:MM format (zero-padded, e.g. "09:05") in the device's local time zone at the moment of computation.
- **FR-004**: When the arrival falls on a later local calendar day than the departure, the system MUST indicate it after HH:MM, separated by one space: "(+1 day)" for one day, "(+N days)" for N ≥ 2. Days are counted as local calendar days, not 24-hour periods.
- **FR-005**: The system MUST recompute and redisplay arrival times every time the routes are computed again (travel mode change, new destination, stop added/removed/reordered/cleared, the user's location becoming available for a route that was waiting for it).
- **FR-006**: The arrival time MUST be shown for both walking and car routes, with or without stops, and MUST NOT alter the existing distance, duration, or pleasure information.
- **FR-007**: When no route is displayed (no route found or routing error), no arrival time MUST be displayed.
- **FR-008**: The arrival text MUST be plain text inside the route entry, so it is part of the entry's accessible name for screen readers.
- **FR-009**: When a route entry does not fit the panel width, it MUST wrap onto more lines; it MUST NOT be truncated.

### Key Entities

- **Route option**: An existing route shown in the panel, with distance and duration; gains a derived arrival time (departure time of computation + duration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of routes listed in the panel show an arrival time next to their duration.
- **SC-002**: For every displayed route, the arrival time differs from (computation time + duration) by at most 1 minute, where the computation time is the instant defined in FR-002.
- **SC-003**: After any recomputation of routes, 100% of displayed arrival times are based on the new computation time, with none left over from the previous set (a leftover is any shown arrival time whose departure instant is older than the latest completed computation).
- **SC-004**: With 3 routes shown, a reviewer who has not seen them before names the earliest-arriving route in under 5 seconds by reading the panel only, without calculating.

## Assumptions

- "Leave now" means the moment the routes were computed; the times do not tick forward on their own between recomputations (per the description: "It updates when the routes are computed again").
- The device's clock and local time zone are used; no time-zone selection is offered.
- 24-hour clock format is used, matching the example "14:32"; this is deliberate and no 12-hour option is offered.
- The departure time itself is not shown; "+N day" markers are relative to the user's current local day.
- Durations come from the existing route data; no traffic or schedule adjustments are added. Car durations are therefore estimates without live traffic (known limitation).
- The device clock is trusted; a wrong clock is not detected.
- The overall status summary line (e.g. "fastest 2.1 km · 25 min") is out of scope; only the per-route entries in the panel change. The summary line is not a route entry, so this is consistent with FR-001.
