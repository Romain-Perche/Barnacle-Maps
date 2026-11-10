# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-20861-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button. Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", where should the map go back to? → A: Option A — the first view the app settled on: the person's first known position at the app's initial location zoom when location is available, otherwise the default starting center and zoom; it stays fixed and does not follow later movement. The person approved the recommended defaults for all remaining items.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return the map to its starting view (Priority: P1)

A user has panned and zoomed the map around (for example while exploring a search result or a route) and wants to get back to where the map started without manually dragging and zooming. They press a "Reset view" button on the map, and the map returns to the same center and zoom level it showed when the app first settled on load.

**Why this priority**: This is the entire feature; it removes the tedium of manually navigating back after exploring.

**Independent Test**: Open the app, wait for the initial view to settle, note the center and zoom, pan and zoom elsewhere, press "Reset view", and confirm the map shows the noted center and zoom again.

**Acceptance Scenarios**:

1. **Given** the app has loaded and location access was granted, so the map centered on the user's first known position, **When** the user pans/zooms away and presses "Reset view", **Then** the map returns to that first-position center at the same zoom level used for that initial centering.
2. **Given** the app has loaded and location is denied, unavailable, or not yet known, **When** the user pans/zooms away and presses "Reset view", **Then** the map returns to the app's default starting center and zoom.
3. **Given** a destination is selected and routes are displayed, **When** the user presses "Reset view", **Then** the map view changes to the starting view while the search results, destination marker, routes, selected route, and travel mode remain unchanged.
4. **Given** the map is already at the starting view, **When** the user presses "Reset view", **Then** nothing visibly breaks and the map stays at the starting view.

---

### User Story 2 - Use the button with keyboard and assistive technology (Priority: P2)

A keyboard or screen-reader user can find and activate the "Reset view" button just like any other control.

**Why this priority**: Keeps the app usable for everyone; low cost on top of Story 1.

**Independent Test**: Tab to the button, confirm it is announced with an understandable name (e.g., "Reset view"), activate it with Enter or Space, and confirm the map resets.

**Acceptance Scenarios**:

1. **Given** keyboard focus is on the page, **When** the user tabs through the controls, **Then** the "Reset view" button receives focus with a visible focus indicator.
2. **Given** the button has focus, **When** the user presses Enter or Space, **Then** the map resets exactly as in Story 1.

---

### Edge Cases

- The user's live position keeps updating after load: the starting view stays fixed at the first-position view and does not follow later position updates.
- Location access is granted only after the user has already moved the map: the starting view becomes the first-position view at that moment (matching the app's existing one-time auto-centering), so a later reset goes there.
- The button is pressed repeatedly in quick succession: the map ends at the starting view with no errors.
- Small screens: the button must not overlap or be hidden by the search/routes panel or the map's existing zoom controls and attribution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST display a button labelled or described as "Reset view" that is visible whenever the map is shown.
- **FR-002**: Activating the button MUST set the map's center and zoom to the starting view.
- **FR-003**: The starting view MUST be the first view the app automatically centers on: the user's first known position at the app's initial location zoom when location is available, otherwise the app's default starting center and zoom. Pressing the button before any position is known MUST go to the default starting view.
- **FR-004**: The starting view MUST NOT change after it has been established by the first position fix, even as the user's position updates.
- **FR-005**: Activating the button MUST NOT alter any other app state: search input and results, selected destination, displayed routes, selected route, travel mode, pleasure indicators, user position marker, and status messages remain as they were.
- **FR-006**: The button MUST be operable by mouse/touch and by keyboard (Enter/Space) and MUST expose an accessible name.
- **FR-007**: The button MUST be placed so it does not overlap the search/routes panel, the existing zoom controls, or the map attribution, on both desktop and narrow mobile screens.
- **FR-008**: The button MUST be visually consistent with the existing map controls (size, style).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any amount of panning and zooming, one press of the button returns the map to the starting center and zoom in 100% of attempts.
- **SC-002**: Users can return to the starting view in a single action, in under 2 seconds, compared to several manual pan/zoom gestures before.
- **SC-003**: In 100% of tested cases, pressing the button leaves routes, destination, search results, and travel mode unchanged.
- **SC-004**: The button is reachable and operable by keyboard alone and is announced with a meaningful name by a screen reader.

## Assumptions

- "Starting position and zoom" means the view the map settles on at load: the existing one-time auto-centering on the user's first position, or the default city view when no position is available. Resetting does not follow the user's live position (that would be a separate "center on me" feature).
- Resetting the view does not clear the search, routes, or destination; it only moves the map.
- An animated or instant transition are both acceptable, as long as the final view is the starting view.
- The starting view is not persisted across page reloads; each load establishes its own.
- The button sits with the map's existing on-map controls rather than in the search panel.
