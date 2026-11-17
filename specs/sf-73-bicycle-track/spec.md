# Feature Specification: Bicycle Travel Mode

**Feature Branch**: `factory/sf-73-bicycle-track`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "bicycle track — in addition to by foot and by car, I want to be able to select bicycles as a travel possibility"

## Clarifications

### Session 2026-11-17

- Q: Which design do you want for the Bike option in the travel mode selector? → A: Design: C, one row of segmented buttons with icons (🚶 Walk | 🚗 Car | 🚲 Bike), see `design-options.html`.
- Q: Do bike routes also show the pleasure indicator (green pixels, "most pleasant")? → A: Yes, bike routes show the pleasure indicator the same way as walking routes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get cycling routes to a destination (Priority: P1)

A user who plans to ride a bicycle selects "🚲 Bike" in the travel mode selector, searches for a place, and sees up to 3 cycling routes from their current position to the destination, each with its distance, estimated riding duration and pleasure indicator. They can pick a route in the panel or click it on the map, exactly as with walking and car routes.

**Why this priority**: This is the whole point of the request: cycling as a third travel possibility. Without it, cyclists must use walking routes (wrong duration, may use footpaths where bikes are not allowed) or car routes (may use roads closed to bikes).

**Independent Test**: Select the bicycle mode, search for a destination a few kilometres away, and check that the routes shown follow roads and paths open to cyclists, with durations between the walking and car durations for the same trip.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the travel mode selector, **Then** it is one row of three segmented buttons, "🚶 Walk", "🚗 Car" and "🚲 Bike", with Walk selected by default and the selected button highlighted (design C).
2. **Given** the app is open with a known position, **When** the user selects the bicycle mode and searches for a destination, **Then** up to 3 cycling routes are shown on the map and in the panel, each with distance and duration.
3. **Given** cycling routes are shown, **When** the user clicks a route on the map or in the panel, **Then** that route is highlighted as the selected one.
4. **Given** the bicycle mode is selected, **When** routes are being computed, **Then** the status text says cycling routes are being computed, and the result summary refers to cycling (e.g., "by bike" / "cycling routes").
5. **Given** the bicycle mode is selected, **When** no cycling route exists to the destination, **Then** the user sees a "No cycling route found." message.
6. **Given** cycling routes are shown, **When** pleasure scoring finishes, **Then** each route shows its pleasure (green pixels) and the route with the most green pixels is marked "most pleasant", as for walking routes; a ride too long to score shows "Pleasure unavailable".

---

### User Story 2 - Switch between walk, bike and car (Priority: P2)

A user comparing options switches the travel mode between walking, bicycle and car for the same destination. The routes are recomputed for the newly selected mode without having to search again.

**Why this priority**: Comparing modes for the same trip is the main reason to have several modes; it builds on Story 1.

**Independent Test**: With a destination selected, switch Walk → Bike → Car → Bike and check that each switch replaces the routes with ones for the selected mode and that the destination is kept.

**Acceptance Scenarios**:

1. **Given** walking routes to a destination are shown, **When** the user selects the bicycle mode, **Then** the walking routes are replaced by cycling routes to the same destination.
2. **Given** cycling routes are shown, **When** the user selects car or walk, **Then** the cycling routes are replaced by routes for that mode.
3. **Given** the user switches mode quickly several times, **When** the results arrive, **Then** only the routes for the last selected mode are displayed.

---

### User Story 3 - Cycling routes with stops (Priority: P3)

A user who added stops gets cycling routes that go from their position through every stop, in list order, to the destination, as already works for walking and car.

**Why this priority**: Stops are an existing feature; cycling should behave consistently, but a single-leg cycling route is already valuable on its own.

**Independent Test**: Add two stops, select the bicycle mode, search a destination, and check the cycling route passes through both stops in order.

**Acceptance Scenarios**:

1. **Given** the user has stops in the list, **When** they select the bicycle mode and a destination, **Then** the cycling route(s) pass through every stop in list order.
2. **Given** stops exist, **When** the user switches to or from the bicycle mode, **Then** the stops are kept.

---

### Edge Cases

- The cycling routing service is unreachable or returns an error: the user sees an error message for cycling; switching to another mode still works.
- The routing service returns only one cycling route (common for short trips or with stops): a single route is shown; no artificial detours are added for cycling.
- The destination is only reachable via segments where cycling is not allowed: the route may include pushing the bike or the service may find no route; the "No cycling route found." message covers the latter.
- A cycling route is too long for pleasure scoring, or the map tiles cannot be loaded: the route shows "Pleasure unavailable", as for walking.
- The user has no position yet: same behaviour as the other modes (routes are computed once the position is known).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST be one row of three segmented buttons, "🚶 Walk", "🚗 Car" and "🚲 Bike" (in that order), with exactly one selected at a time and the selected button highlighted (design C in `design-options.html`). It MUST stay keyboard-operable as a single travel-mode choice.
- **FR-002**: Walk MUST remain the default selected mode when the app opens.
- **FR-003**: When the bicycle mode is selected, the system MUST compute routes using cycling-specific routing (paths and roads open to bicycles, cycling speeds), not walking or car routing.
- **FR-004**: In bicycle mode the system MUST show up to 3 alternative routes, each with distance and estimated duration, selectable from the panel or the map.
- **FR-005**: Status and result texts MUST refer to cycling when the bicycle mode is selected (computing message, summary, "no route found" message).
- **FR-006**: Changing the travel mode while a destination is set MUST recompute routes for the new mode without a new search, and MUST discard results from a previously selected mode that arrive late.
- **FR-007**: Cycling routes MUST honour the user's stops (all stops, in list order), and stops MUST be kept when switching to or from the bicycle mode.
- **FR-008**: Cycling routes MUST show the pleasure indicator the same way as walking routes (green pixels along the route, "most pleasant" on the best one, "Pleasure unavailable" when it cannot be computed). Car routes keep no pleasure indicator.
- **FR-009**: Detour routes through side waypoints MUST NOT be generated for cycling (remains walking-only).
- **FR-010**: The project documentation (README) MUST mention the bicycle mode alongside walking and car.

### Key Entities

- **Travel mode**: The way the user travels (walk, bike, car). Determines which routing is used, which texts are shown, and whether the pleasure indicator (walk and bike) and detour routes (walk only) apply.
- **Route**: A path from the user's position through any stops to the destination, with distance and duration, computed for one travel mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can get cycling routes to a searched destination in at most one additional click compared to walking routes (selecting the Bike option).
- **SC-002**: For the same trip, the displayed cycling duration is shorter than the walking duration and the route uses ways open to bicycles in 100% of tested sample trips.
- **SC-003**: Switching travel mode with a destination set shows the new mode's routes without any re-search, in 100% of attempts.
- **SC-004**: Existing walking and car behaviour (routes, pleasure indicator, stops) is unchanged apart from the new selector look: all existing automated tests continue to pass.

## Assumptions

- Cycling routes come from the same family of free public OpenStreetMap-based routing used for walking and car, which offers a bicycle profile; no account or key is needed.
- "Bicycle" means a standard bicycle; e-bikes, cargo bikes, bike-sharing availability, elevation profiles and bike-lane preference settings are out of scope.
- The pleasure indicator uses the same method and limits for cycling as for walking; its wording may refer to rides instead of walks where it names the mode.
- The selected travel mode is not persisted between visits (same as today).
- A previous bicycle-mode attempt (SF-70) was reverted; this spec restarts from the current walk/car behaviour.
