# Feature Specification: Bicycle Travel Mode

**Feature Branch**: `factory/sf-72-bycicle-track`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "bycicle track — in addition to by foot and by car, I want to be able to select bicycles as a travel possibility"

## Clarifications

### Session 2026-11-16

- Q: Which design do you want for the Bike option in the travel mode selector? → A: Design: C, segmented buttons with icons (🚶 Walk | 🚗 Car | 🚲 Bike), see `design-options.html`.
- Q: Do bike routes show the pleasure indicator (green pixels, "most pleasant")? → A: Yes, bike routes show it with the same rules as walking routes.
- Q: What does "bicycle track" mean for the routes? → A: Normal cycling routes from the routing service (which already prefers bike paths); no bike-path share is shown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get cycling routes to a destination (Priority: P1)

A user who plans to ride a bicycle selects "🚲 Bike" in the travel mode selector, next to the existing Walk and Car options, searches for a place, and sees up to 3 routes suited to cycling, each with its distance and estimated cycling duration. They pick a route in the panel or by clicking it on the map, exactly as for the other modes.

**Why this priority**: This is the whole feature: without cycling routes, no value is delivered.

**Independent Test**: Select Bike, search for a destination a few kilometres away, and verify that 1 to 3 routes appear with distance and duration, that durations are consistent with cycling (shorter than walking for the same trip), and that each route can be selected.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the travel mode selector, **Then** it is one row of three segmented buttons, "🚶 Walk", "🚗 Car" and "🚲 Bike", with Walk selected by default and the selected button highlighted (design C).
2. **Given** the user has selected Bike and their position is known, **When** they choose a destination, **Then** up to 3 cycling routes are shown on the map and in the panel, each with distance and duration, and the fastest is pre-selected.
3. **Given** cycling routes are displayed, **When** the user clicks a route on the map or in the panel, **Then** that route becomes the selected one, as in the other modes.
4. **Given** cycling routes are being computed or have been computed, **When** the user reads the status line, **Then** the wording refers to cycling (e.g. "Computing cycling routes…", "by bike", "cycling routes").
5. **Given** Bike is selected, **When** no cycling route can be found, **Then** the user sees "No cycling route found."
6. **Given** cycling routes are displayed, **When** pleasure scoring finishes, **Then** each route shows its pleasure indicator and the route with the most green is marked "most pleasant", as for walking.

---

### User Story 2 - Switch to and from Bike for the current destination (Priority: P2)

A user who already has walking or car routes displayed switches to Bike (or from Bike to another mode), and routes are recomputed for the new mode to the same destination.

**Why this priority**: Comparing modes for the same trip is the main reason to have several modes, but it builds on Story 1.

**Independent Test**: Display walking routes to a destination, switch to Bike and verify cycling routes replace them for the same destination; switch back to Walk and verify walking routes return.

**Acceptance Scenarios**:

1. **Given** walking or car routes are displayed, **When** the user selects Bike, **Then** the previous routes are replaced by cycling routes to the same destination.
2. **Given** cycling routes are displayed, **When** the user selects Walk or Car, **Then** routes for that mode replace the cycling routes.
3. **Given** the user switches modes quickly, **When** an earlier, slower computation finishes, **Then** only routes for the currently selected mode are shown.

---

### User Story 3 - Cycling routes with stops (Priority: P3)

A user who has added stops gets cycling routes that go from their position through every stop, in list order, to the destination, as already happens for walking and car.

**Why this priority**: Stops are an existing capability that should work uniformly across modes, but most cycling trips are direct.

**Independent Test**: Add 2 stops, select Bike, choose a destination and verify the cycling route passes through both stops in order.

**Acceptance Scenarios**:

1. **Given** the user has stops and Bike is selected, **When** routes are computed, **Then** every cycling route passes through all stops in list order.
2. **Given** stops exist, **When** the user switches to or from Bike, **Then** the stops are kept.

---

### Edge Cases

- The cycling routing service is unreachable or returns an error: the user sees an error message, and routes from another mode are not left displayed as if they were cycling routes.
- The routing service returns a single cycling route: only that route is shown; no artificial detour routes are generated (forced detours remain walking-only).
- Destination reachable only via roads closed to bicycles: the best cycling route the service offers is shown, or "No cycling route found." if none exists.
- Very long bike trips (beyond the existing pleasure limits) or map tiles that cannot be loaded: routes are shown normally and each shows "Pleasure unavailable", as for walking.
- Duplicate routes returned by the service are de-duplicated as in the other modes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer three options as one row of segmented buttons with icons, "🚶 Walk", "🚗 Car" and "🚲 Bike" (design C in `design-options.html`); the selected option MUST be visibly indicated and exposed as selected to assistive technology; Walk MUST remain the default.
- **FR-002**: When Bike is selected, the system MUST compute routes with the routing service's bicycle profile (roads allowed for and timed for bicycles), not the walking or car profile; the system MUST NOT add its own bike-path preference or show a bike-path share per route.
- **FR-003**: The system MUST display up to 3 cycling routes, each with distance and estimated duration, and pre-select the fastest one.
- **FR-004**: Cycling routes MUST be selectable from the panel and from the map, as for the other modes.
- **FR-005**: Cycling routes MUST show the pleasure indicator with the same rules and limits as walking routes; car routes MUST still not show it.
- **FR-006**: The system MUST NOT force detour routes through side waypoints for cycling (this remains walking-only).
- **FR-007**: Status and summary texts MUST name the cycling mode ("Computing cycling routes…", "No cycling route found.", "by bike", "cycling routes").
- **FR-008**: Switching to or from Bike MUST recompute routes for the current destination and keep the current stops.
- **FR-009**: Cycling routes MUST honour the stops list (through every stop, in list order) like the other modes.
- **FR-010**: Results from a computation started for a previously selected mode MUST NOT replace the routes of the currently selected mode.
- **FR-011**: The project README MUST mention the Bike mode, its routing source, and that the pleasure indicator applies to walking and bike routes.

### Key Entities

- **Travel mode**: one of Walk, Car, Bike; has a user-facing label, a routing profile, and mode-specific behaviours (pleasure indicator for Walk and Bike; forced detours for Walk only).
- **Route**: path from the user's position through any stops to the destination, with distance and duration, computed for one travel mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can see cycling routes for a new destination in 2 interactions (select Bike, choose destination), or 1 interaction if a destination is already chosen.
- **SC-002**: For typical urban trips of 2–10 km, displayed cycling durations are shorter than walking durations for the same trip in 100% of tested cases.
- **SC-003**: Cycling routes appear in about the same time as walking or car routes for the same trip (no noticeable extra wait).
- **SC-004**: Walk and Car behaviour (routes, pleasure indicator, detours, stops) is unchanged apart from the new selector look: all existing automated tests continue to pass.

## Assumptions

- The public OpenStreetMap-based routing provider already used for walking and car offers a bicycle profile, which will be used for cycling routes.
- Cycling durations are those estimated by the routing service; no user-configurable cycling speed is provided.
- The pleasure indicator for bike routes reuses the walking limits (distance, tile count, timeout) unchanged.
- The selector icons are emoji characters, so nothing extra is loaded; the Walk and Car options get the same segmented look as Bike.
- No distinction is made between bicycle types (e-bike, road bike, etc.) or between dedicated bike tracks and other bike-allowed roads beyond what the routing service already does; "bycicle track" in the request is understood as "bicycle travel mode".
- The selected mode is not persisted across page reloads (consistent with current behaviour).
