# Feature Specification: Show the arrival time for each route

**Feature Branch**: `factory/pilot-97524-show-the-arrival-time-for-each-route`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Show the arrival time for each route. Next to each route duration in the panel, show the clock time when I arrive if I leave now (for example: 25 min, arrive 14:32). It updates when the routes are computed again."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See when I will arrive on each route (Priority: P1)

As a user who has searched for a destination, I see in the panel, next to each route's duration, the clock time at which I would arrive if I left right now (e.g. "Route 1 · 2.1 km · 25 min, arrive 14:32"). I can compare routes by arrival time without doing mental arithmetic.

**Why this priority**: This is the whole feature; it turns a relative duration into an actionable answer ("will I make it by 14:45?").

**Independent Test**: Search for a destination at a known current time, and check that every route entry in the panel shows "arrive HH:MM" equal to the current time plus that route's duration.

**Acceptance Scenarios**:

1. **Given** the current time is 14:07 and a route takes 25 min, **When** the routes are shown in the panel, **Then** that route reads "25 min, arrive 14:32".
2. **Given** several routes are shown (walking or car, with or without stops), **When** I look at the panel, **Then** each route shows its own arrival time computed from its own duration.
3. **Given** a route takes 1 h 10 min and the current time is 09:55, **When** the routes are shown, **Then** that route reads "1 h 10 min, arrive 11:05".

---

### User Story 2 - Arrival time refreshes when routes are recomputed (Priority: P2)

When the routes are computed again (I change the travel mode, choose another destination, or add, remove, reorder or clear stops), the arrival times are recalculated from the time of that new computation.

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
- The page stays open without any recomputation: arrival times are not changed by the passage of time alone (they reflect "leave now" as of the last computation).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every route listed in the panel, the system MUST display the estimated arrival clock time immediately after that route's duration, in the form "<duration>, arrive HH:MM".
- **FR-002**: The arrival time MUST equal the time at which the routes were computed plus that route's travel duration, rounded to the nearest minute.
- **FR-003**: The arrival time MUST be shown in 24-hour HH:MM format (zero-padded, e.g. "09:05") in the user's local time zone.
- **FR-004**: When the arrival falls on a later calendar day than the departure, the system MUST indicate it (e.g. "(+1 day)", "(+2 days)").
- **FR-005**: The system MUST recompute and redisplay arrival times every time the routes are computed again (travel mode change, new destination, stop added/removed/reordered/cleared).
- **FR-006**: The arrival time MUST be shown for both walking and car routes, with or without stops, and MUST NOT alter the existing distance, duration, or pleasure information.
- **FR-007**: When no route is displayed (no route found or routing error), no arrival time MUST be displayed.

### Key Entities

- **Route option**: An existing route shown in the panel, with distance and duration; gains a derived arrival time (departure time of computation + duration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of routes listed in the panel show an arrival time next to their duration.
- **SC-002**: For every displayed route, the arrival time differs from (computation time + duration) by at most 1 minute.
- **SC-003**: After any recomputation of routes, 100% of displayed arrival times are based on the new computation time, with none left over from the previous set.
- **SC-004**: A user can tell which route arrives earliest in under 5 seconds by reading the panel, without calculating.

## Assumptions

- "Leave now" means the moment the routes were computed; the times do not tick forward on their own between recomputations (per the description: "It updates when the routes are computed again").
- The device's clock and local time zone are used; no time-zone selection is offered.
- 24-hour clock format is used, matching the example "14:32".
- Durations come from the existing route data; no traffic or schedule adjustments are added.
- The overall status summary line (e.g. "fastest 2.1 km · 25 min") is out of scope; only the per-route entries in the panel change.
