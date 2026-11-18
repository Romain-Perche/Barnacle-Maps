# Feature Specification: Bicycle Travel Mode

**Feature Branch**: `factory/sf-81-bicycle-track`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "bicycle track — in addition to by foot and by car, I want to be able to select bicycles as a travel possibility"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get cycling routes to a destination (Priority: P1)

A user who plans to ride a bicycle selects "Bike" in the travel mode selector, next to the existing "Walk" and "Car" options, searches for a place, and sees up to 3 routes suited to cycling, each with its distance and estimated cycling duration. They pick a route in the panel or by clicking it on the map, exactly as for the other modes.

**Why this priority**: This is the whole feature: without cycling routes, no value is delivered.

**Independent Test**: Select "Bike", search for a destination a few kilometres away, and verify that 1 to 3 routes appear with distance and duration, that durations are consistent with cycling (shorter than walking for the same trip), and that routes can be selected.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the travel mode selector, **Then** it offers exactly three options, "Walk", "Car" and "Bike", and Walk is selected.
2. **Given** the user has selected Bike and their position is known, **When** they choose a destination, **Then** up to 3 cycling routes are displayed on the map and in the panel, each with distance and duration, and the fastest is pre-selected.
3. **Given** cycling routes are displayed, **When** the user clicks a route on the map or in the panel, **Then** that route is highlighted in blue on the map and in the panel, and the other routes are not.
4. **Given** cycling routes are being computed, **When** the user waits, **Then** the status says "Computing cycling routes…", and when routes arrive it says "N cycling routes · fastest …" (or "… by bike" when there is only 1 route).
5. **Given** no cycling route can be found, **When** the computation ends, **Then** the user sees "No cycling route found."
6. **Given** cycling routes are displayed, **When** pleasure scoring finishes, **Then** each route shows "Pleasure: N green px", and exactly one route also shows "most pleasant".

---

### User Story 2 - Switch to and from Bike for the current trip (Priority: P2)

A user who already has walking or car routes displayed switches to Bike (or from Bike to another mode), and routes are recomputed for the new mode, keeping the same destination and stops.

**Why this priority**: Comparing modes for the same trip is the main reason to have several modes, but it builds on Story 1.

**Independent Test**: Display walking routes to a destination, switch to Bike and verify cycling routes replace them for the same destination; switch back to Walk and verify walking routes return.

**Acceptance Scenarios**:

1. **Given** walking or car routes are displayed, **When** the user selects Bike, **Then** the status says "Computing cycling routes…" and then lists cycling routes to the same destination, and no walking or car route remains on the map.
2. **Given** cycling routes are displayed, **When** the user selects Walk or Car, **Then** the status names that mode ("walking routes" / "driving routes", or "on foot" / "by car" for a single route) and its routes replace the cycling routes.
3. **Given** a destination is chosen, **When** the user switches modes quickly (e.g., Walk → Bike → Car within one second), **Then** after all computations finish the status names the last selected mode, and only its routes are shown.

---

### User Story 3 - Cycling routes with stops (Priority: P3)

A user who has added stops gets cycling routes that go from their position through every stop, in list order, to the destination, as already happens for walking and car.

**Why this priority**: Stops are an existing capability that should work uniformly across modes, but most cycling trips are direct.

**Independent Test**: Add 2 stops, select Bike, choose a destination, and verify the displayed cycling route passes through both stops in order.

**Acceptance Scenarios**:

1. **Given** the stop list contains stops and Bike is selected, **When** routes are computed, **Then** the status says "… via 2 stops", and the selected route on the map passes through stop 1, then stop 2.
2. **Given** stops exist, **When** the user switches to or from Bike, **Then** the stop list still shows the same stops in the same order.

---

### Edge Cases

- The cycling routing service is unreachable or returns an error: the status says "Routing failed: …" (or "No cycling route found. (…)" when stops exist), and the route list and the map show no route.
- The routing service returns a single cycling route: the route list shows exactly 1 route and the status says "<distance> · <duration> by bike"; no detour routes are added.
- No cycling route exists to the destination (e.g., reachable only by motorway): the status says "No cycling route found." and the route list is empty.
- Very long bike trips (beyond the existing pleasure limits) or map tiles that cannot be loaded: the routes are listed with distance and duration, and each route shows "Pleasure unavailable".
- The service returns two identical cycling routes: the route list shows that route once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer three options, "Walk", "Car" and "Bike", following the chosen design; the selected option MUST be visibly indicated and announced as selected to assistive technology; Walk MUST remain the default.
- **FR-002**: When Bike is selected, the system MUST compute routes with a bicycle-specific routing profile (roads allowed for and timed at cycling speed), not the walking or car profile.
- **FR-003**: The system MUST display up to 3 cycling routes, each with distance and estimated duration, and pre-select the fastest one.
- **FR-004**: Cycling routes MUST be selectable from the panel and from the map, as for the other modes.
- **FR-005**: Cycling routes MUST show the pleasure indicator with the same rules as walking routes (greenery along the route, "most pleasant" on the best one, "Pleasure unavailable" beyond the same limits or on map tile failure); its explanatory text MUST not refer only to walks. Car routes MUST still not show it.
- **FR-006**: The system MUST NOT force detour routes through side waypoints for cycling (this remains walking-only).
- **FR-007**: Status and summary texts MUST name the cycling mode ("Computing cycling routes…", "No cycling route found.", "by bike", "cycling routes").
- **FR-008**: Switching to or from Bike MUST recompute routes for the current destination and keep the current stops.
- **FR-009**: Cycling routes MUST honour the stop list (through every stop, in list order) like the other modes.
- **FR-010**: Results from a computation for a previously selected mode MUST NOT replace the routes of the currently selected mode.
- **FR-011**: The project README MUST describe the Bike mode, its routing source, and that the pleasure indicator applies to walking and bike routes.

### Key Entities

- **Travel mode**: one of Walk, Car, Bike; has a user-facing label, a routing profile, and mode-specific behaviours (pleasure indicator for Walk and Bike; forced detours only for Walk).
- **Route**: path from the user's position through any stops to the destination, with distance and duration, computed for one travel mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can get cycling routes for a new destination in 2 interactions (select Bike, choose destination), or 1 interaction if a destination is already chosen.
- **SC-002**: For typical urban trips of 2–10 km, displayed cycling durations are shorter than walking durations for the same trip in 100% of tested cases.
- **SC-003**: Cycling routes appear in about the same time as walking or car routes for the same trip (no noticeable additional wait).
- **SC-004**: Walk and Car behaviour (routes, pleasure indicator, detours, stops, texts) is unchanged: all existing automated tests continue to pass.

## Assumptions

- The public OpenStreetMap-based routing provider already used for walking and car offers a bicycle profile, which is used for cycling routes.
- Cycling durations are those estimated by the routing service; no user-configurable cycling speed.
- Bike routes show the pleasure indicator, reusing the walking limits (distance, tile count, timeout) unchanged — this matches the decision taken for the earlier attempt at this feature (SF-70).
- No distinction between bicycle types (e-bike, road bike, etc.) or between dedicated bike tracks and other bike-allowed roads; "bicycle track" in the request is understood as "bicycle travel mode".
- The selected mode is not persisted across page reloads, consistent with current behaviour.
