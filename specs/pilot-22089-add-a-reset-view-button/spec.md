# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-22089-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", where should the map go: the place where it first opened (central Paris, zoom 13), or the view centered on their location that the app shows once the location is found? → A: Option A. Go back to the first view the app shows by itself: centered on the user's location at zoom 15 if it was found when the app opened, otherwise central Paris at zoom 13. Later live-position updates do not move the reset target.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return to the starting view in one click (Priority: P1)

A user has panned and zoomed the map away from where it started (for example, while exploring a route or browsing another area) and wants to get back to where they began. They press a "Reset view" button on the map, and the map returns to the position and zoom level it had when it started.

**Why this priority**: This is the whole feature. Without it, users have to pan and zoom back by hand, which is slow and imprecise, especially on touch devices.

**Independent Test**: Open the app, note the initial map view, pan and zoom elsewhere, press "Reset view", and check that the map shows the same center and zoom level as at the start.

**Acceptance Scenarios**:

1. **Given** the map has been panned and zoomed away from its starting view, **When** the user presses "Reset view", **Then** the map shows the starting center and starting zoom level.
2. **Given** the map is already at its starting view, **When** the user presses "Reset view", **Then** the view stays the same and no error appears.
3. **Given** the user has searched for a place and routes are displayed, **When** the user presses "Reset view", **Then** the map returns to the starting view and the search results, selected destination, routes and route selection all stay as they were.
4. **Given** the user's location was found when the app opened and the map centered on it, **When** the user later presses "Reset view", **Then** the map returns to that first location-centered view, not to the generic default area.
5. **Given** the user's location was not available when the app opened, **When** the user presses "Reset view", **Then** the map returns to the default starting area and zoom.

---

### User Story 2 - Find and use the button with any input method (Priority: P2)

A user who navigates with a keyboard or screen reader, or on a touch device, can find the "Reset view" control, understand what it does, and activate it.

**Why this priority**: The button must be usable by everyone, but this story only refines how the main capability is presented.

**Independent Test**: Tab to the button with the keyboard, check that its name is announced as "Reset view", activate it with Enter or Space, and check that the map resets. Repeat with a tap on a touch screen.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the map, **Then** the "Reset view" button is visible on the map next to the other map controls and does not cover the search panel.
2. **Given** keyboard focus is on the button, **When** the user presses Enter or Space, **Then** the map resets to its starting view.
3. **Given** a screen reader is in use, **When** the button gets focus, **Then** its accessible name is "Reset view" (or an equivalent clear label).

---

### Edge Cases

- **Location arrives after the user has already moved the map**: the starting view is the first view the app set on its own at startup (the default view, then replaced by the first location-centered view when the location arrives). Later updates to the user's live position do not change the starting view.
- **Location permission denied or geolocation unsupported**: the starting view is the default view.
- **Button pressed during an animation or while routes are loading**: the map still goes to the starting view; route loading continues unaffected.
- **Button pressed repeatedly**: each press brings the map to the same starting view; nothing builds up or drifts.
- **Small screens**: the button stays visible and tappable and does not overlap the search panel or the zoom controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a control labeled "Reset view" (text, icon with a text alternative, or both) whenever the map is displayed.
- **FR-002**: Activating the control MUST set the map center and zoom level to the starting view.
- **FR-003**: The starting view MUST be the view the app shows on its own at startup: the user's first known location at zoom 15 if the location was found at startup, otherwise the default area (central Paris) at zoom 13. It MUST NOT follow the user's current location afterward.
- **FR-004**: The starting view MUST be recorded once per page load and MUST NOT change when the user pans, zooms, searches, selects a route, or when the live position updates afterward.
- **FR-005**: Activating the control MUST NOT change any other app state: search input, search results, chosen destination, displayed routes, selected route, travel mode, pleasure indicators, status messages, and the user's position marker stay as they were.
- **FR-006**: The control MUST work with mouse, touch, and keyboard (Enter and Space), and MUST have an accessible name a screen reader can announce.
- **FR-007**: The control MUST be placed with the other map controls and MUST NOT overlap the search/route panel on desktop or mobile screen sizes.
- **FR-008**: Activating the control when the map is already at the starting view MUST NOT cause an error or a visible glitch.

### Key Entities

- **Starting view**: the map center (latitude/longitude) and zoom level the app first shows by itself at startup. Recorded once per page load; used as the reset target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned or zoomed state, a user gets back to the starting view in one action (one click, tap, or key press).
- **SC-002**: After a reset, the map center matches the starting center within a few meters and the zoom level matches exactly, in 100% of attempts.
- **SC-003**: The map finishes moving to the starting view within 1 second of the button being pressed.
- **SC-004**: In 100% of resets, search results, routes, route selection, and travel mode are unchanged afterward.
- **SC-005**: Keyboard-only and screen-reader users can find and use the control without a mouse.

## Assumptions

- "Starting position and zoom" means the view the map settles on at startup without user input (confirmed in Clarifications, Session 2026-11-10): the default area (currently central Paris, zoom 13) or, if the location is found, the location-centered view (zoom 15). If the location arrives after a delay, the first location-centered view replaces the default as the starting view.
- Reset only moves the map. It does not clear the search, routes, or selection; users who want to start over can still start a new search.
- The button follows the visual style of the existing map controls (such as the zoom buttons). No new settings or preferences are added.
- The starting view is not saved between sessions; each page load records its own.
- A short smooth transition or an instant jump are both fine, as long as SC-003 is met.
