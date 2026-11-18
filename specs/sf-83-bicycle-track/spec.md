# Feature Specification: Bicycle Travel Mode

**Feature Branch**: `factory/sf-83-bicycle-track`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "bicycle track — In addition to car and walk, i want to be able so see my travel by bike."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See bike routes to a destination (Priority: P1)

A user who plans to cycle picks "Bike" in the travel mode selector (next to Walk and Car), searches for a place, and sees up to 3 cycling routes from their current position to it, drawn on the map and listed in the panel, each with its distance and estimated cycling duration. They can pick a route in the panel or click it on the map, exactly as for walking and car routes.

**Why this priority**: This is the whole request: today the app only answers "how long on foot / by car"; cyclists get wrong durations and routes that ignore cycle-friendly paths or use roads closed to bikes.

**Independent Test**: Select Bike, search for a destination a few kilometres away, and verify that routes appear with distance and duration, that durations are clearly shorter than walking and the routes are ones a bicycle is allowed to take.

**Acceptance Scenarios**:

1. **Given** the user's position is known and the travel mode is Bike, **When** they choose a destination, **Then** up to 3 cycling routes are shown on the map and in the panel, each with distance and duration, and the fastest is summarised in the status line as being by bike (e.g. "4.2 km · 15 min by bike" or "3 cycling routes · fastest …").
2. **Given** several bike routes are shown, **When** the user clicks one in the panel or on the map, **Then** that route becomes the selected one, as for the other modes.
3. **Given** a destination is chosen and walking or car routes are shown, **When** the user switches to Bike, **Then** the routes are recomputed for cycling to the same destination.
4. **Given** bike routes are shown, **When** the user switches to Walk or Car, **Then** the routes are recomputed for that mode and no bike route remains on the map.

---

### User Story 2 - Bike routes through stops (Priority: P2)

A user who has added stops (up to 5) sees bike routes that go from their position through every stop, in list order, to the destination. Stops are kept when switching to or from Bike.

**Why this priority**: Stops already work for Walk and Car; Bike must not be a second-class mode, but the basic A→B route delivers most of the value.

**Independent Test**: Add two stops, choose a destination, select Bike, and verify that the route passes through both stops in order and the status mentions the stops.

**Acceptance Scenarios**:

1. **Given** 2 stops and a destination, **When** the mode is Bike, **Then** the shown routes pass through both stops in list order and the status reads "… by bike via 2 stops" (or the multi-route equivalent).
2. **Given** stops exist and Walk is selected, **When** the user switches to Bike, **Then** the stops remain and the bike route goes through them.

---

### Edge Cases

- No cycling route exists between the points (e.g. separated by water with no bike-accessible crossing): the status reads "No cycling route found." (with "Try removing a stop." when stops are present), consistent with the other modes.
- The routing service for bikes fails or is unreachable: the status shows the routing failure message, as for other modes; the user can still switch back to Walk or Car.
- The user switches mode several times quickly: only the routes for the last selected mode are shown (older answers are discarded).
- The user's position is not yet known: the same "Waiting for your location…" behaviour as the other modes applies, and bike routes are computed as soon as the position arrives.
- The cycling service returns only one route: a single route is shown; no artificial detour routes are added for bikes (detours remain a walking-only behaviour).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer a third option, "Bike", alongside "Walk" and "Car", usable with mouse, touch and keyboard, and announced to assistive technology like the existing options.
- **FR-002**: When Bike is selected, the app MUST compute routes using a cycling-specific routing profile, so routes only use ways open to bicycles and durations reflect cycling speed.
- **FR-003**: The app MUST show up to 3 alternative bike routes, each with distance and duration, using the same map drawing, list, and route selection behaviour as Walk and Car.
- **FR-004**: Status messages MUST name the mode correctly for bikes: "Computing cycling routes…", "… by bike", "N cycling routes · fastest …", and "No cycling route found.".
- **FR-005**: Bike routes MUST honour user stops (in list order) exactly as Walk and Car do, and stops MUST be kept when switching to or from Bike.
- **FR-006**: Switching to or from Bike with a destination chosen MUST recompute the routes for the newly selected mode and discard any in-flight result for the previous mode.
- **FR-007**: The pleasure indicator MUST NOT be shown for bike routes (it remains walking-only).
- **FR-008**: The app MUST NOT add artificial detour routes for bikes when the cycling service returns fewer than 2 alternatives (detours remain walking-only).
- **FR-009**: Walk remains the default mode on load; existing Walk and Car behaviour MUST be unchanged.
- **FR-010**: The project documentation (README) MUST list the bike mode and the routing source it uses, as it does for walk and car.

### Key Entities

- **Travel mode**: one of Walk, Car, Bike. Each has a user-facing label, the routing profile it uses, and wording for status messages ("on foot" / "by car" / "by bike"). Determines whether walking-only extras (pleasure indicator, detour routes) apply.
- **Route**: a path with distance and duration, computed for one travel mode, from the user's position through any stops to the destination.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from "destination chosen" to seeing bike routes with a single action (selecting Bike), with no additional steps compared to Walk or Car.
- **SC-002**: For the same origin and destination (a few kilometres apart in a city), the fastest bike duration is shorter than the fastest walking duration in at least 95% of tries.
- **SC-003**: Bike routes appear within the same time range as walking and car routes for the same trip (no perceptible extra wait beyond normal routing service variance).
- **SC-004**: 100% of existing walking and car behaviours (routes, stops, pleasure indicator on walks) continue to work unchanged after Bike is added.

## Assumptions

- "See my travel by bike" means planning bike routes to a destination (like the existing Walk and Car modes), not recording or replaying a GPS track of trips already made.
- Bike routing comes from the same public OpenStreetMap routing provider family already used for walking and car (it offers a bicycle profile), so no account, key, or new dependency is needed.
- The pleasure (greenness) indicator is not extended to bikes for this feature; it could be added later.
- A single generic bicycle profile is enough; options such as e-bike, road bike vs. mountain bike, or avoiding hills are out of scope.
- The selected mode is not remembered between visits (consistent with the current behaviour for Walk/Car).
