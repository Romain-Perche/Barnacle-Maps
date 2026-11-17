# Feature Specification: Bicycle Travel Mode

**Feature Branch**: `factory/pilot-45168-bicycle-track`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "bicycle track — in addition to by foot and by car, I want to be able to select bicycles as a travel possibility"

## Clarifications

### Session 2026-11-16

- Q: Which design do you want for the Bike option in the travel mode selector? → A: Design: C, segmented buttons with icons in the order 🚶 Walk | 🚗 Car | 🚲 Bike (the icons of mock C on the segmented control of mock B; selected segment highlighted).
- Q: Should bike routes show the pleasure indicator ("most pleasant" green score)? → A: Yes, bike routes show the pleasure indicator the same way as walking routes.

### Session 2026-11-17

- Q: Should screen readers read the mode icons (🚶 🚗 🚲) or only the labels? → A: Only the labels ("Walk", "Car", "Bike"); the icons are decorative and hidden from assistive technologies (decided by the factory, to confirm)
- Q: In Bike mode, may the user's position, stops and destination be sent to the FOSSGIS cycling routing server (routing.openstreetmap.de/routed-bike), the same third party that already computes walking and car routes? → A: Yes, but only that operator: no new third party receives location data, and nothing is stored by the app (decided by the factory, to confirm)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get cycling routes to a destination (Priority: P1)

A user who wants to ride a bicycle searches for a place and selects "Bike" as the travel mode, next to the existing "Walk" and "Car" options. Like walking routes, cycling routes show the pleasure indicator. The app shows up to 3 cycling routes from their current position to the destination, each with its distance and duration computed for a cyclist, and the user can pick one in the panel or on the map exactly as for the other modes.

**Why this priority**: This is the whole feature: without bicycle routes, nothing else in the request delivers value.

**Independent Test**: Open the app, allow geolocation, search for a destination, select "Bike", and verify that one to three routes appear with distances and durations consistent with cycling (faster than walking, typically slower than driving on the same trip).

**Acceptance Scenarios**:

1. **Given** the app is open with the travel mode selector visible, **When** the user looks at the selector, **Then** it is a segmented control with three icon-labelled segments in the order "🚶 Walk", "🚗 Car", "🚲 Bike", with exactly one segment selected and highlighted at a time.
2. **Given** the user has a known position and has chosen a destination, **When** they select "Bike", **Then** the app recomputes and shows up to 3 cycling routes, each with distance and duration.
3. **Given** cycling routes are displayed, **When** the user selects one in the panel or clicks it on the map, **Then** that route becomes the selected route, as in the other modes.
4. **Given** cycling routes are displayed, **When** the pleasure scores are computed, **Then** each cycling route shows a pleasure line and the route with the most green is marked "most pleasant", as for walking routes.
5. **Given** cycling routes are being computed, **When** the user looks at the status, **Then** the messages refer to cycling (e.g. "Computing cycling routes…", "2 cycling routes · fastest …", "… by bike").

---

### User Story 2 - Switch between modes without losing context (Priority: P2)

A user comparing options switches between Walk, Bike and Car for the same destination and stops. The destination and stop list are kept, and routes are recomputed for the newly selected mode each time.

**Why this priority**: Comparing modes is the natural reason to add a third one; it relies on User Story 1 but is a separate behavior.

**Independent Test**: With a destination and two stops set, switch Walk → Bike → Car → Bike and verify the destination and stops stay unchanged and routes update to the selected mode each time.

**Acceptance Scenarios**:

1. **Given** a destination is chosen and walking routes are shown, **When** the user selects "Bike", **Then** the destination is kept and cycling routes replace the walking routes.
2. **Given** one or more stops are defined, **When** the user selects "Bike", **Then** cycling routes go from the user's position through every stop, in list order, to the destination.
3. **Given** the user switches modes quickly, **When** results for a previously selected mode arrive late, **Then** they are ignored and only routes for the currently selected mode are displayed.

---

### Edge Cases

- No cycling route can be found (e.g. destination unreachable by bike): the app shows a cycling-specific message such as "No cycling route found." and no stale routes from another mode.
- The cycling routing service is unavailable or fails: the user sees an error message and the app remains usable in the other modes.
- The routing service returns only one cycling route: only that route is shown; no artificial detour routes are added (same as car).
- With stops defined, fewer alternatives (often a single route) may be returned, as for the other modes.
- Pleasure indicator on a long ride: when the tiles cannot be loaded or the ride is too long to score, the cycling route shows "Pleasure unavailable", with the same limit as walking; the routes themselves stay visible.
- Car routes: the pleasure indicator stays absent for car routes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST be a segmented control with three segments, each with an icon and a label, in this order: "🚶 Walk", "🚗 Car", "🚲 Bike". Exactly one segment is selected at any time, and the selected segment is visibly highlighted (Design C in `design-options.html`, using the segmented style of its mock B). The control MUST stay keyboard-operable and announce the selected mode to assistive technologies, as the current radio group does.
- **FR-002**: Walk MUST remain the default travel mode when the app opens.
- **FR-003**: When "Bike" is selected and a destination is set, the system MUST compute routes using a bicycle-specific routing profile (paths and roads usable by bicycles, cycling speeds).
- **FR-004**: The system MUST display up to 3 cycling routes, each with distance and estimated duration, using the same route list, map display and selection behavior as the other modes.
- **FR-005**: Cycling routes MUST honor the stop list: start at the user's position, pass through every stop in list order, and end at the destination.
- **FR-006**: Switching to or from "Bike" MUST keep the current destination and stops and MUST recompute routes for the newly selected mode.
- **FR-007**: Status and summary messages MUST name the cycling mode (computing, results, no-route and single-route summaries) rather than reuse walking or driving wording.
- **FR-008**: The system MUST NOT add artificial detour routes for cycling when the routing service returns fewer than 2 alternatives.
- **FR-009**: The pleasure indicator MUST be computed and displayed for cycling routes the same way as for walking routes (per-route pleasure line, "most pleasant" mark on the greenest route, "Pleasure unavailable" when it cannot be scored). It MUST remain absent for car routes.
- **FR-010**: If no cycling route is found or the routing request fails, the system MUST show a clear message and MUST NOT display routes from a previously selected mode.
- **FR-011**: Results from an outdated request (different mode, destination or stops) MUST NOT overwrite the routes of the current selection.
- **FR-012**: The project documentation MUST mention the bicycle mode and its routing source.

### Key Entities

- **Travel Mode**: A way of travelling the user can choose (Walk, Bike, Car). Has a user-facing label and determines which routing profile is used and which mode-specific extras apply (pleasure indicator: Walk and Bike; detour routes: Walk only).
- **Route**: A path from the user's position through the stops to the destination, with distance and duration, computed for the selected travel mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can get cycling routes to a chosen destination with a single additional action (selecting "Bike").
- **SC-002**: For the same trip, displayed cycling durations are shorter than walking durations in at least 95% of test trips over 1 km.
- **SC-003**: Switching between the three modes never loses the destination or stops (100% of mode switches in testing).
- **SC-004**: Cycling route results appear in a time comparable to walking and car results (within a few seconds under normal network conditions).
- **SC-005**: Existing walking and car behavior (routes, pleasure indicator on walking, stops) is unchanged apart from the restyled mode selector: all existing automated tests keep passing.

## Assumptions

- "Bicycle track" means a bicycle travel mode for routing, not recording or tracking a ride (GPS track logging is out of scope).
- Cycling routes come from the same public OpenStreetMap-based routing provider already used for walking and car, using its bicycle profile; no account or API key is needed.
- A standard bicycle is assumed: no e-bike, road-bike or mountain-bike variants, and no elevation or bike-lane preferences in this version.
- The pleasure indicator applies to walking and cycling (it no longer is walking-only); the README must be updated to say so.
- Detour routes stay walking-only, consistent with the existing car behavior.
- The chosen mode is not remembered between visits (current behavior for Walk/Car).
