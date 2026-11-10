# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-21489-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return the map to its starting view (Priority: P1)

A user has panned and zoomed around the map (by dragging, zooming, searching a place, or viewing routes) and wants to get back to where the map started. They press a clearly labelled "Reset view" button on the map, and the map returns to the exact position and zoom level it showed when the app was opened.

**Why this priority**: This is the entire feature. It gives users a one-step way to recover their bearings instead of manually panning and zooming back.

**Independent Test**: Open the app, note the starting view, pan and zoom elsewhere, press "Reset view", and confirm the map shows the same centre and zoom as at start.

**Acceptance Scenarios**:

1. **Given** the app is open and the user has panned and zoomed away from the starting view, **When** the user presses "Reset view", **Then** the map shows the starting centre position and starting zoom level.
2. **Given** the map is already at its starting view, **When** the user presses "Reset view", **Then** the map stays at the starting view and nothing else changes.
3. **Given** the user has searched a place and routes are displayed, **When** the user presses "Reset view", **Then** only the map view changes; the search result, destination marker, routes, selected route, travel mode, pleasure indicators and the user's position marker all remain as they were.
4. **Given** the user's live position was detected and the map automatically centred on it at start-up, **When** the user later presses "Reset view", **Then** the map returns to that same centred-on-the-user position and zoom from start-up (not to the user's current position if they have since moved).

---

### User Story 2 - Use the button with keyboard and assistive technology (Priority: P2)

A keyboard or screen-reader user can find, understand, and activate the "Reset view" button the same way as a mouse or touch user.

**Why this priority**: Keeps the app accessible; the rest of the app's controls already have accessible labels.

**Independent Test**: Using only the keyboard, tab to the button and activate it with Enter or Space; with a screen reader, confirm it is announced as a "Reset view" button.

**Acceptance Scenarios**:

1. **Given** keyboard focus is on the page, **When** the user tabs through the controls, **Then** the "Reset view" button receives focus with a visible focus indicator.
2. **Given** the button has focus, **When** the user presses Enter or Space, **Then** the map resets to the starting view.
3. **Given** a screen reader is running, **When** the button is focused, **Then** it is announced as a button named "Reset view".

---

### Edge Cases

- **Location not available**: If location permission is denied, unsupported, or never arrives, the starting view is the app's default view, and "Reset view" returns there.
- **Location arrives late**: If the map has not yet auto-centred on the user when the button is pressed, the map returns to the default view; once auto-centring happens, that centred view becomes the starting view for later resets.
- **User moves after start-up**: The starting view does not follow the user's later location updates; it stays the view captured at start-up.
- **Repeated presses**: Pressing the button several times in a row gives the same result as pressing it once, with no errors.
- **Pressed mid-animation**: If the map is still moving (e.g. fitting to new routes) when the button is pressed, the map still ends up at the starting view.
- **Small screens**: The button stays visible and usable on narrow mobile screens and does not cover the search panel, other map controls, or the map attribution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST display a "Reset view" button at all times while the map is shown.
- **FR-002**: The button MUST be placed on the map with the other map controls, without overlapping the search/routes panel, the zoom controls, or the map attribution.
- **FR-003**: Pressing the button MUST return the map to the starting view: the same centre position and zoom level the map showed at start-up.
- **FR-004**: The starting view MUST be the view the map settles on at start-up: the user's detected location at its start-up zoom if location is detected and the map auto-centres on it, otherwise the app's default view.
- **FR-005**: The starting view MUST NOT change after start-up because of later location updates, panning, zooming, searches, or route display.
- **FR-006**: Pressing the button MUST change only the map's position and zoom; it MUST NOT clear or change the search input, search results, destination, routes, selected route, travel mode, pleasure indicators, user position marker, or status message.
- **FR-007**: The button MUST work with mouse, touch, and keyboard (Enter and Space), and MUST show a visible focus indicator.
- **FR-008**: The button MUST have the accessible name "Reset view" and show a tooltip or visible label saying what it does.
- **FR-009**: Pressing the button MUST NOT start a search, routing request, or pleasure calculation.

### Key Entities

- **Starting view**: The map's centre position and zoom level at start-up, kept for the whole session and used as the target for resets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, one press of "Reset view" returns the map to the starting centre and zoom in 100% of attempts.
- **SC-002**: The map finishes moving to the starting view within 1 second of the press.
- **SC-003**: A first-time user can find and use the button to get back to the starting view in under 5 seconds without instructions.
- **SC-004**: After a reset, 100% of the previously shown search results, routes, and route selection are still shown unchanged.
- **SC-005**: The button can be reached and activated using only the keyboard, and is announced correctly by a screen reader.

## Assumptions

- "Starting position and zoom" means the view the user actually sees once start-up finishes: centred on their location if it was detected and the map auto-centred on it, otherwise the app's existing default view. It is not recomputed from the user's current location when the button is pressed.
- Resetting the view is a navigation-only action; it does not reset or clear any search, route, or mode state (a full "clear" action is out of scope).
- The starting view is kept only for the current session; it is not saved across page reloads (a reload sets up a new starting view as usual).
- The button uses the same visual style as the existing map controls and an English label, matching the rest of the interface.
- No new external services or data sources are needed.
