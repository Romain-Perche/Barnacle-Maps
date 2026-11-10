# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-15946-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return the map to its starting view (Priority: P1)

A user has panned and zoomed around the map (for example while exploring a destination or comparing routes) and wants to get back to where the map started without manually dragging and zooming. They press a "Reset view" button on the map and the map immediately returns to its starting position and zoom level.

**Why this priority**: This is the entire feature; it delivers the core value of a one-tap way back to a familiar view.

**Independent Test**: Load the app, pan and zoom the map away from its initial view, press the Reset view button, and confirm the map shows the same center and zoom level it showed when the app first settled on its starting view.

**Acceptance Scenarios**:

1. **Given** the app has loaded and the user has not shared their location, **When** the user pans and zooms the map and then presses Reset view, **Then** the map returns to the default starting center and zoom level.
2. **Given** the app has loaded and centered the map on the user's location, **When** the user pans and zooms elsewhere and then presses Reset view, **Then** the map returns to the center and zoom level it was first centered on at the user's location.
3. **Given** the map is already at its starting view, **When** the user presses Reset view, **Then** the map stays at the same view and nothing else changes.

---

### User Story 2 - Reset the view without losing work (Priority: P2)

A user has searched for a place and is looking at route options. After zooming in on details, they reset the view. The routes, selected route, search results, travel mode, and their position marker remain as they were; only the map's position and zoom change.

**Why this priority**: Resetting the view must not be destructive; otherwise users would avoid the button for fear of losing their search and routes.

**Independent Test**: Search for a destination, display routes, select one, zoom/pan, press Reset view, and confirm all panel content, the selected route, and route lines on the map are unchanged.

**Acceptance Scenarios**:

1. **Given** routes are displayed and one is selected, **When** the user presses Reset view, **Then** the routes, the selected route, and the panel contents are unchanged and only the map view changes.
2. **Given** the user's position marker is shown, **When** the user presses Reset view, **Then** the position marker remains visible at the user's current location.

---

### User Story 3 - Accessible and discoverable control (Priority: P3)

A user navigating with a keyboard or screen reader can find and activate the Reset view button, and every user can understand what it does from its label or tooltip.

**Why this priority**: Ensures the control is usable by everyone, but the feature still delivers value for pointer users without it.

**Independent Test**: Tab to the button with the keyboard, confirm it has an accessible name of "Reset view", activate it with Enter or Space, and confirm the view resets.

**Acceptance Scenarios**:

1. **Given** keyboard focus is on the Reset view button, **When** the user presses Enter or Space, **Then** the map resets to its starting view.
2. **Given** a screen reader user reaches the button, **When** it is announced, **Then** it is identified as a button named "Reset view".

---

### Edge Cases

- If the user's location becomes available only after they have already moved the map, the starting view is the view the map was first centered on (the user's location), consistent with the app's existing one-time auto-centering behavior.
- If location access is denied or unavailable, the starting view is the app's default starting center and zoom.
- Later updates to the user's position (as they move) do not change the starting view; Reset view returns to the original starting view, not the current position.
- Searching for a place or displaying routes moves the map but does not change the starting view.
- Pressing the button repeatedly or rapidly leaves the map at the starting view without errors.
- The button must remain visible and usable on small (mobile) screens and must not be hidden behind the search/route panel or overlap the existing zoom controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST display a clearly labeled "Reset view" button, visible at all times while the map is shown.
- **FR-002**: When the user activates the Reset view button, the system MUST return the map to its starting center position and starting zoom level.
- **FR-003**: The starting view MUST be the app's default center and zoom at load, replaced once by the user's location view if and when the app first auto-centers on the user's location.
- **FR-004**: The starting view MUST NOT change due to subsequent position updates, searches, route display, or manual panning/zooming.
- **FR-005**: Activating Reset view MUST NOT clear or alter search input, search results, displayed routes, the selected route, the travel mode, status messages, or the user's position marker.
- **FR-006**: The Reset view button MUST be operable with mouse/touch and with the keyboard (focusable, activatable with Enter or Space).
- **FR-007**: The Reset view button MUST have an accessible name "Reset view" and a tooltip/label conveying its purpose.
- **FR-008**: The Reset view button MUST NOT obscure or overlap existing map controls or the search/route panel, on both desktop and mobile screen sizes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, users return to the starting view with a single action, in under 1 second.
- **SC-002**: In 100% of tested cases, after Reset view the map's center and zoom match the starting view exactly.
- **SC-003**: In 100% of tested cases, routes, selected route, search results, and travel mode are identical before and after Reset view.
- **SC-004**: The button can be reached and activated using only the keyboard, and is announced as "Reset view" by a screen reader.

## Assumptions

- "Starting position and zoom" means the view the map settled on when the app started: the default starting view, or — if the app auto-centered on the user's location — that location view at the zoom used for auto-centering. This matches what the user saw at startup.
- The reset applies only to the map view; it does not reset the application state (searches, routes, travel mode).
- The button is placed alongside the map's existing on-map controls (near the zoom controls), following the existing visual style.
- A smooth or instant transition to the starting view are both acceptable; no specific animation is required.
- No persistence is needed: the starting view is determined fresh on each app load.
