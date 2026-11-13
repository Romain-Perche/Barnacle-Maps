# Feature Specification: Bicycle Option

**Feature Branch**: `factory/sf-65-bicycle-option`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "bicycle option — Now I want to be able to see the journey and the time it would take on a bicycle"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See cycling routes and their duration (Priority: P1)

A user has searched for a destination and wants to know how to get there by bicycle and how long it would take. They pick "Bike" in the travel mode selector of the panel (next to "Walk" and "Car"). The app shows up to 3 cycling routes on the map and in the panel, each with its distance and its cycling duration, and the user can select a route in the panel or by clicking it on the map, exactly as for the other modes.

**Why this priority**: This is the whole request: seeing the bicycle journey and its travel time.

**Independent Test**: Search for a destination, select "Bike", and verify that cycling routes are drawn and each lists a distance and a duration that is consistent with cycling speed (shorter than walking, typically longer than driving for the same trip).

**Acceptance Scenarios**:

1. **Given** the user's position is known and a destination is chosen, **When** the user selects "Bike", **Then** up to 3 cycling routes are displayed, each with distance and duration, and the fastest is summarised in the status line (e.g. "… by bike" / "N cycling routes · fastest …").
2. **Given** cycling routes are displayed, **When** the user clicks a route in the panel or on the map, **Then** that route becomes the selected route, same behaviour as walking and car.
3. **Given** walking or car routes are displayed for a destination, **When** the user switches to "Bike", **Then** routes for the same destination are recomputed for cycling without re-searching.
4. **Given** cycling routes are displayed, **When** the user switches back to "Walk" or "Car", **Then** routes for that mode are shown as before this feature.
5. **Given** routes are being computed for bike, **When** the computation is in progress, **Then** a status such as "Computing cycling routes…" is shown.

---

### User Story 2 - Cycle through stops (Priority: P2)

A user who has added stops to the journey selects "Bike" and gets a cycling route that goes from their position through each stop, in list order, to the destination.

**Why this priority**: Stops are an existing capability; bike must behave consistently with the other modes, but the core value is delivered by Story 1.

**Independent Test**: Add 2 stops, select "Bike", verify the displayed route passes through the stops in order and the total duration is shown.

**Acceptance Scenarios**:

1. **Given** the journey has stops, **When** the user selects "Bike", **Then** the cycling route visits every stop in order before reaching the destination, and the stops are kept.
2. **Given** cycling mode is active with stops, **When** the user reorders, adds or removes a stop, **Then** the cycling route is recomputed.

---

### Edge Cases

- No cycling route exists between the points (e.g. island, no cycle-accessible road): show "No cycling route found." and no routes, as other modes do.
- The routing service for bicycles is unavailable or fails: show an error status, consistent with the existing walk/car failure behaviour; switching to another mode still works.
- The user switches mode while bike routes are still being computed: only the routes of the latest selected mode are shown (stale results are discarded).
- Only one cycling route is available: show just that one; no artificial detour routes are forced for bike (as for car).
- Very long trips: duration is shown in hours and minutes using the same format as the other modes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer a third option, "Bike", alongside "Walk" and "Car".
- **FR-002**: When "Bike" is selected and a destination is set, the system MUST compute routes suited to cycling from the user's position (through any stops, in order) to the destination.
- **FR-003**: The system MUST display up to 3 cycling routes, each with its distance and estimated cycling duration, in the same format as walking and car routes.
- **FR-004**: The cycling duration MUST reflect cycling travel time as estimated by the routing source for bicycles (not walking or driving time).
- **FR-005**: Users MUST be able to select a cycling route from the panel or by clicking it on the map.
- **FR-006**: Status and summary messages MUST name the bike mode (e.g. "Computing cycling routes…", "by bike", "cycling routes", "No cycling route found.").
- **FR-007**: The pleasure indicator MUST NOT be shown for cycling routes (it remains walking only).
- **FR-008**: Forced detour routes through side waypoints MUST NOT be generated for bike; only alternatives provided by the routing source are shown.
- **FR-009**: Switching to or from "Bike" MUST keep the current destination and stops and recompute routes for the newly selected mode.
- **FR-010**: Walking and car behaviour MUST remain unchanged; "Walk" stays the default mode.
- **FR-011**: The project documentation (README) MUST mention the bike mode.

### Key Entities

- **Travel mode**: The means of transport used to compute routes. Now one of Walk, Car, Bike. Each mode has a display label and its own routing source.
- **Route**: A path from position (via stops) to destination with distance, duration and geometry; for bike, duration is cycling time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with a destination already chosen sees cycling routes with durations in a single action (one click on "Bike").
- **SC-002**: For the same trip, the displayed cycling duration is shorter than the walking duration in at least 95% of typical urban trips over 1 km.
- **SC-003**: 100% of displayed cycling routes show both a distance and a duration.
- **SC-004**: Existing walking and car scenarios (including stops and pleasure indicator) behave identically to before the change.

## Assumptions

- The same public OpenStreetMap-based routing provider already used for walking and car offers a bicycle profile, and its duration estimate is accepted as the cycling time (no user-configurable speed).
- Bike type (road, e-bike, mountain bike) and user speed preferences are out of scope.
- Elevation, bike lanes preference, and bike-share availability are out of scope.
- The pleasure indicator is not extended to cycling in this feature.
- The chosen mode is not persisted across page reloads (same as today).
