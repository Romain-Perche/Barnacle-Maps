# Feature Specification: Bicycle Option

**Feature Branch**: `factory/sf-65-bicycle-option`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "bicycle option — Now I want to be able to see the journey and the time it would take on a bicycle"

## Clarifications

### Session 2026-11-13

- Q: Are the bike status texts fixed or only examples? → A: Fixed, as listed in FR-006 (decided by the factory, no question asked)
- Q: What happens when Bike is selected and the user's position is not known yet? → A: Same as other modes: "Waiting for your location to compute a route…", routes computed once the position arrives (decided by the factory, no question asked)
- Q: What happens when Bike is selected before a destination is chosen? → A: Only the mode changes; nothing is computed until a destination is chosen; the existing stops-only hint stays (decided by the factory, no question asked)
- Q: Do stop limits apply in bike mode? → A: Yes, unchanged (max 5 stops, duplicates within 20 m rejected) (decided by the factory, no question asked)
- Q: What must the README say about bike? → A: The Bike mode, its routing source (OSRM bicycle profile on routing.openstreetmap.de), up to 3 alternatives, no detour routes, no pleasure indicator (decided by the factory, no question asked)
- Q: What accessibility applies to the Bike option? → A: Same as Walk/Car: a native radio labelled "Bike" in the existing "Travel mode" radiogroup, selectable with the keyboard (decided by the factory, no question asked)
- Q: What are "routes suited to cycling"? → A: The routes returned by the bicycle profile of the routing source (decided by the factory, no question asked)
- Q: How are the up to 3 bike routes chosen? → A: Same filtering as other modes: fastest first, then distinct alternatives (not much longer, not mostly overlapping) (decided by the factory, no question asked)
- Q: Which error text does bike show? → A: "Routing failed: <reason>" without stops; "No cycling route found. (<reason>)" with stops (decided by the factory, no question asked)
- Q: What is "the same format" for distance and duration? → A: Existing format: "850 m" / "2.35 km", "12 min" / "1 h 5 min" (decided by the factory, no question asked)
- Q: Must Walk/Car texts stay identical? → A: Yes, byte-identical to before; Walk is selected after every page load (decided by the factory, no question asked)
- Q: How is SC-002 measured? → A: On a reference set of 5 urban trips of 1–10 km, bike duration is shorter than walking duration for each (decided by the factory, no question asked)
- Q: Is "typically longer than driving" a requirement? → A: No, it is an indication only (decided by the factory, no question asked)
- Q: What is the baseline for SC-004? → A: The existing automated tests pass, with only the mode-list test extended for bike, plus the walk/car steps of the quickstart (decided by the factory, no question asked)
- Q: Which scenarios cover FR-007, FR-008 and FR-011? → A: Acceptance scenarios 1.6 and 1.7 added; FR-011 is checked by reading the README (decided by the factory, no question asked)
- Q: What does the status show when the mode or destination changes during a bike computation? → A: Only the latest request counts: its "Computing …" text, then its result; older results are discarded (decided by the factory, no question asked)
- Q: What does "No cycling route found." look like with stops? → A: "No cycling route found. Try removing a stop.", as other modes (decided by the factory, no question asked)
- Q: Is there a distance limit for bike? → A: No; long trips only use the "h min" duration format (decided by the factory, no question asked)
- Q: How does the user recover after a bike routing failure? → A: Selecting a mode again, changing a stop or choosing a destination recomputes; no automatic retry (decided by the factory, no question asked)
- Q: Is the bicycle routing source validated? → A: Recorded as routing.openstreetmap.de/routed-bike; checked with the quickstart request before implementation; if it fails at runtime, the normal error status shows (decided by the factory, no question asked)
- Q: Which usage limits apply to the routing source? → A: The provider's fair-use policy; bike sends one request per route update (no detour requests), so load is not higher than walking (decided by the factory, no question asked)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See cycling routes and their duration (Priority: P1)

A user has searched for a destination and wants to know how to get there by bicycle and how long it would take. They pick "Bike" in the travel mode selector of the panel (next to "Walk" and "Car"). The app shows up to 3 cycling routes on the map and in the panel, each with its distance and its cycling duration, and the user can select a route in the panel or by clicking it on the map, exactly as for the other modes.

**Why this priority**: This is the whole request: seeing the bicycle journey and its travel time.

**Independent Test**: Search for a destination, select "Bike", and verify that cycling routes are drawn and each lists a distance and a duration that is consistent with cycling speed (shorter than walking; usually longer than driving, as an indication only, not a requirement).

**Acceptance Scenarios**:

1. **Given** the user's position is known and a destination is chosen, **When** the user selects "Bike", **Then** up to 3 cycling routes are displayed, each with distance and duration, and the fastest is summarised in the status line (e.g. "… by bike" / "N cycling routes · fastest …").
2. **Given** cycling routes are displayed, **When** the user clicks a route in the panel or on the map, **Then** that route becomes the selected route, same behaviour as walking and car.
3. **Given** walking or car routes are displayed for a destination, **When** the user switches to "Bike", **Then** routes for the same destination are recomputed for cycling without re-searching.
4. **Given** cycling routes are displayed, **When** the user switches back to "Walk" or "Car", **Then** routes for that mode are shown as before this feature.
5. **Given** routes are being computed for bike, **When** the computation is in progress, **Then** the status "Computing cycling routes…" is shown.
6. **Given** cycling routes are displayed, **Then** no pleasure indicator is shown on any route.
7. **Given** the routing source returns a single cycling route, **Then** only that route is shown (no forced detour routes).

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
- Very long trips: duration is shown in hours and minutes using the same format as the other modes; there is no distance limit for bike.
- Position not yet known: the status is "Waiting for your location to compute a route…" and bike routes are computed when the position arrives.
- Bike selected with no destination: only the mode changes; nothing is computed until a destination is chosen.
- The destination changes while bike routes are being computed: only the routes of the latest request are shown.
- No cycling route with stops: "No cycling route found. Try removing a stop."
- Routing failure text: "Routing failed: <reason>" without stops, "No cycling route found. (<reason>)" with stops. The user recovers by selecting a mode again, changing a stop or choosing a destination; there is no automatic retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer a third option, "Bike", alongside "Walk" and "Car".
- **FR-002**: When "Bike" is selected and a destination is set, the system MUST compute routes suited to cycling (the routes returned by the bicycle profile of the routing source) from the user's position (through any stops, in order) to the destination.
- **FR-003**: The system MUST display up to 3 cycling routes, each with its distance and estimated cycling duration, in the same format as walking and car routes ("850 m" / "2.35 km", "12 min" / "1 h 5 min"), chosen with the same filtering as the other modes (fastest first, then distinct alternatives that are not much longer).
- **FR-004**: The cycling duration MUST reflect cycling travel time as estimated by the routing source for bicycles (not walking or driving time).
- **FR-005**: Users MUST be able to select a cycling route from the panel or by clicking it on the map.
- **FR-006**: Status and summary messages MUST name the bike mode with these texts: "Computing cycling routes…"; "<distance> · <duration> by bike[ via N stop(s)]" for one route; "N cycling routes[ via N stop(s)] · fastest <distance> · <duration>" for several; "No cycling route found." (with stops: "No cycling route found. Try removing a stop.").
- **FR-007**: The pleasure indicator MUST NOT be shown for cycling routes (it remains walking only).
- **FR-008**: Forced detour routes through side waypoints MUST NOT be generated for bike; only alternatives provided by the routing source are shown.
- **FR-009**: Switching to or from "Bike" MUST keep the current destination and stops and recompute routes for the newly selected mode.
- **FR-010**: Walking and car behaviour MUST remain unchanged, including their status texts (byte-identical); "Walk" stays the default mode and is selected after every page load.
- **FR-011**: The project documentation (README) MUST mention the bike mode: its routing source (OSRM bicycle profile on routing.openstreetmap.de), up to 3 alternatives, no detour routes, no pleasure indicator.
- **FR-012**: The "Bike" option MUST be a native radio button labelled "Bike" in the existing "Travel mode" radiogroup, selectable with the keyboard like Walk and Car.

### Key Entities

- **Travel mode**: The means of transport used to compute routes. Now one of Walk, Car, Bike. Each mode has a display label and its own routing source.
- **Route**: A path from position (via stops) to destination with distance, duration and geometry; for bike, duration is cycling time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with a destination already chosen sees cycling routes with durations in a single action (one click on "Bike").
- **SC-002**: On a reference set of 5 urban trips of 1–10 km, the displayed cycling duration is shorter than the walking duration for each trip.
- **SC-003**: 100% of displayed cycling routes show both a distance and a duration.
- **SC-004**: Existing walking and car scenarios (including stops and pleasure indicator) behave identically to before the change: the existing automated tests pass (only the travel-mode list test is extended for bike) and the walk/car steps of the quickstart give the same results.

## Assumptions

- The same public OpenStreetMap-based routing provider already used for walking and car offers a bicycle profile, and its duration estimate is accepted as the cycling time (no user-configurable speed).
- Bike type (road, e-bike, mountain bike) and user speed preferences are out of scope.
- Elevation, bike lanes preference, and bike-share availability are out of scope.
- The pleasure indicator is not extended to cycling in this feature.
- The chosen mode is not persisted across page reloads (same as today).
- Stop limits are unchanged in bike mode (max 5 stops, duplicates within 20 m rejected).
- The bicycle routing source is routing.openstreetmap.de/routed-bike; it is checked with the quickstart request before implementation. Its fair-use policy applies; bike sends one request per route update (no detour requests).
