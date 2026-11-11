# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-7912-add-a-reset-view-button`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-11

- Q: When someone presses "Reset view", which view should the map go back to? → A: Option A. It goes back to the first view the user saw once the app was ready: their location at zoom 15 if it was found, otherwise the default view (Paris at zoom 13). The view is fixed once set and does not follow the user as they move.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return to the starting view in one click (Priority: P1)

A person has panned and zoomed around the map (for example to look at a route, a search result, or a distant area) and wants to get back to where the map started. They press a "Reset view" button on the map and the map returns to its starting position and zoom level.

**Why this priority**: This is the whole feature. Without it, getting back to the starting view means manual panning and zooming, which is slow and imprecise.

**Independent Test**: Load the app, note the starting center and zoom, pan and zoom elsewhere, press "Reset view", and check that the map shows the same center and zoom as at start.

**Acceptance Scenarios**:

1. **Given** the map has been panned and zoomed away from its starting view, **When** the user presses "Reset view", **Then** the map shows the starting center and starting zoom level.
2. **Given** the map is already at its starting view, **When** the user presses "Reset view", **Then** the map stays at the starting view and nothing else changes.
3. **Given** the user has searched a place and routes are displayed, **When** the user presses "Reset view", **Then** only the view changes; the destination, the displayed routes, the selected route, the travel mode and the search results remain as they were.
4. **Given** the user location was found when the app started and the map centered on it, **When** the user later pans away and presses "Reset view", **Then** the map returns to that initial location-centered view (same center and zoom).
5. **Given** the user location is not available (denied or unsupported), **When** the user presses "Reset view", **Then** the map returns to the default starting center and zoom.

---

### User Story 2 - Accessible reset control (Priority: P2)

A keyboard or screen-reader user can find and activate the "Reset view" control just like the other map controls.

**Why this priority**: The control must be usable by everyone, but it builds on Story 1.

**Independent Test**: Using only the keyboard, tab to the control and activate it with Enter or Space; with a screen reader, check the control is announced with a clear name such as "Reset view".

**Acceptance Scenarios**:

1. **Given** keyboard-only navigation, **When** the user tabs to the control and presses Enter or Space, **Then** the map resets to its starting view.
2. **Given** a screen reader, **When** the control receives focus, **Then** it is announced as a button named "Reset view".

---

### Edge Cases

- The user's location is found again later (live position updates) after the starting view was set: the starting view does not move with the user; it stays the view set at startup.
- The user presses "Reset view" several times quickly: the map ends at the starting view with no error.
- The user presses "Reset view" while the map is still animating (e.g. after zooming to a route): the map ends at the starting view.
- The user presses "Reset view" before the user location is known, and the location arrives later: the first location fix still centers the map as it does today, and that view becomes the starting view for later resets.
- Small screens: the control stays visible and does not cover the search/route panel or the other map controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a control labeled "Reset view" (text and/or a recognizable icon with that accessible name) at all times while the map is displayed.
- **FR-002**: Activating the control MUST move the map to the starting view: the same center and zoom level the map had once startup positioning was done.
- **FR-003**: The starting view MUST be the default view (Paris at zoom 13) until the first location fix. When the app automatically centers on the user's location at that first fix (location at zoom 15), that location-centered view becomes the starting view.
- **FR-004**: The starting view MUST NOT change after it has been set (later live position updates, searches and route selections do not change it).
- **FR-005**: Activating the control MUST NOT change anything other than the map view: no clearing of the search input, search results, destination marker, routes, selected route, travel mode, pleasure indicators, user marker or status message.
- **FR-006**: The control MUST be operable by mouse/touch and by keyboard (focusable, activated with Enter or Space) and MUST have the accessible name "Reset view".
- **FR-007**: The control MUST be placed on the map alongside the existing map controls and MUST NOT overlap the search/route panel or the zoom controls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, one activation of the control returns the map to the starting center and zoom in 100% of tests.
- **SC-002**: The map reaches the starting view within 1 second of the user activating the control.
- **SC-003**: After a reset, 100% of the route, destination and search state shown before the reset is still shown.
- **SC-004**: A first-time user can find and use the control to get back to the starting view in under 5 seconds without instructions.

## Assumptions

- "Starting position and zoom" means the view the user saw when the app was ready: the default center and zoom, or the location-centered view the app already sets on the first location fix. The reset does not ask for a new location fix.
- The button resets the view only; it is not a "clear search/routes" action. Clearing routes is out of scope.
- The control label is in English, like the rest of the interface.
- No setting is saved between visits; the starting view is set again each time the app is opened.
- The existing map library's standard control placement and styling are reused so the button looks like the other map controls.
