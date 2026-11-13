# Feature Specification: Summary Card for the Selected Route

**Feature Branch**: `factory/pilot-73195-summary-card-for-the-selected-route`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Summary card for the selected route — When I pick a route, show a small card on the map with its distance, duration and arrival time, so I can see it without looking at the panel."

## Clarifications

### Session 2026-11-13

- Q: Which design? → A: Design: A, one-line bar centered at the bottom of the map: "29 min | 2.35 km | Arrive 14:39" (see `design-options.html`).
- Q: How should the arrival time be written? → A: Follow the device's clock setting (e.g. 14:39 or 2:39 PM).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the selected route's key figures on the map (Priority: P1)

After searching for a destination, the user sees routes drawn on the map. A small summary card appears on the map showing the currently selected route's distance, duration and estimated arrival time. The user can read these figures at a glance while looking at the map, without turning to the side panel.

**Why this priority**: This is the whole feature: the key figures of the chosen route are visible where the user is already looking.

**Independent Test**: Search for a destination; when routes appear, check that a card on the map shows the first (selected) route's distance, duration and an arrival time equal to the current time plus that duration.

**Acceptance Scenarios**:

1. **Given** the user has a position and searches for a destination, **When** routes are displayed (the first route being selected by default), **Then** a summary card appears on the map with that route's distance, duration and arrival time.
2. **Given** a route is selected, **When** the user reads the card, **Then** the distance and duration shown are identical (same values, same format) to those shown for that route in the panel.
3. **Given** a route with a duration of 25 minutes is selected at 14:10 local time, **When** the card is shown, **Then** the arrival time reads 14:35.

---

### User Story 2 - Card follows the route the user picks (Priority: P1)

When several routes are offered, the user switches between them, either from the panel or by clicking a route on the map. The card immediately updates to show the newly selected route's figures, so the user can compare routes by clicking through them while watching the map.

**Why this priority**: The description explicitly ties the card to "when I pick a route"; a card stuck on the first route would be misleading.

**Independent Test**: With 2 or more routes displayed, select route 2 in the panel, then click route 3 on the map; the card shows route 2's figures, then route 3's.

**Acceptance Scenarios**:

1. **Given** several routes are displayed, **When** the user selects another route in the panel, **Then** the card shows that route's distance, duration and arrival time.
2. **Given** several routes are displayed, **When** the user clicks another route on the map, **Then** the card shows that route's distance, duration and arrival time.
3. **Given** a route is selected, **When** the user re-selects the same route, **Then** the card content stays the same (apart from an arrival-time refresh).

---

### User Story 3 - Card stays accurate and out of the way (Priority: P2)

The card disappears when there is no route to describe (routes cleared, a new search is loading, routing failed) and reappears with fresh content when new routes are shown, including after changing the travel mode or editing stops. While the user keeps the map open, the arrival time stays current.

**Why this priority**: Prevents showing stale or wrong information, which would be worse than no card.

**Independent Test**: Display routes, then change the travel mode: the card hides during loading and comes back with the new selected route's figures. Leave the page open for over a minute: the arrival time moves forward accordingly.

**Acceptance Scenarios**:

1. **Given** the card is shown, **When** the routes are cleared or a new route request starts, **Then** the card is hidden until new routes are displayed.
2. **Given** a route request fails or returns no route, **When** the error is reported, **Then** no card is shown.
3. **Given** the card is shown, **When** at least one minute passes without any user action, **Then** the arrival time is recomputed from the current time and the selected route's duration.
4. **Given** the user changes the travel mode or adds/removes/reorders stops, **When** the new routes are displayed, **Then** the card shows the new selected route's figures.

---

### Edge Cases

- Arrival on a later day (e.g. a long walk started late in the evening): the arrival time is followed by a next-day indication (e.g. "+1 day") so it is not mistaken for a time today.
- Very short routes (under 1 minute): the duration follows the existing panel rule (shown as at least 1 min) and the arrival time is consistent with the displayed duration.
- Routes with stops: distance, duration and arrival time cover the whole journey through all stops to the destination (the same totals as in the panel).
- Small screens: the one-line bar stays within the map width (it may wrap or shorten its separators but never truncate a figure) and stays small enough not to hide the selected route's start or destination when the map is fitted to the routes, and does not cover the map's zoom controls or attribution.
- Walking routes: the pleasure indicator is not part of the card (the card shows only distance, duration and arrival time).
- The card must not intercept map interactions beyond its own area (clicking the map next to it still works, e.g. to add a stop).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a summary card overlaid on the map whenever a route is selected and displayed.
- **FR-002**: The card MUST show the selected route's distance, duration and estimated arrival time, and nothing that would require the panel to understand it.
- **FR-003**: Distance and duration on the card MUST use the same values and the same formatting as the panel entry of the selected route.
- **FR-004**: The arrival time MUST be the current local time plus the selected route's duration, displayed as a local clock time in hours and minutes, using the device's 12/24-hour clock setting (e.g. "14:39" or "2:39 PM").
- **FR-005**: When the arrival falls on a later calendar day than the current one, the card MUST indicate it (e.g. "+1 day").
- **FR-006**: The card MUST update immediately when the selected route changes, whether the selection is made in the panel or on the map.
- **FR-007**: The card MUST be hidden when no route is displayed: before any search, while new routes are loading, after routes are cleared, and when routing fails or returns no route.
- **FR-008**: The arrival time MUST be refreshed at least once per minute while the card is visible.
- **FR-009**: The card MUST follow Design A (`design-options.html`): a single-line bar, centered horizontally near the bottom edge of the map, showing duration (emphasized, in the selected-route blue), distance and "Arrive <time>", in that order. It MUST NOT cover the map's zoom controls or attribution, and MUST NOT block clicks on the map outside its own area.
- **FR-010**: The card MUST be accessible to assistive technologies: its content is readable as text, and a change of selected route is announced politely (without stealing focus).
- **FR-011**: The card MUST work identically for walking and car routes, and for routes with or without stops.

### Key Entities

- **Selected route**: The route currently highlighted on the map and in the panel; provides distance (meters) and duration (seconds) for the whole journey.
- **Route summary**: What the card displays — formatted distance, formatted duration, and arrival time derived from the current time and the duration (with an optional next-day indication).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of cases where routes are displayed, a card with distance, duration and arrival time is visible on the map without opening or scrolling the panel.
- **SC-002**: After selecting a different route (panel or map), the card shows the new figures with no perceptible delay (under 100 ms).
- **SC-003**: The card's distance and duration match the panel entry for the selected route in 100% of checks.
- **SC-004**: The displayed arrival time is never more than 1 minute off from "current time + selected route duration" while the card is visible.
- **SC-005**: No stale card is ever shown: while routes are loading, cleared or unavailable, the card is absent in 100% of checks.

## Assumptions

- The first route remains selected by default when routes are displayed, as today; the card therefore appears as soon as routes are shown.
- "Arrival time" means estimated arrival if the user leaves now; there is no departure-time picker in scope.
- Arrival time uses the device's local time zone.
- The card is informational only: it has no buttons and is not a substitute for the panel (no route switching, no close button in this version).
- The card follows Design A (bottom-centered one-line bar); exact sizes and spacing are settled in planning against `design-options.html`.
- Durations and distances come from the existing routing results; no new data source is needed.
