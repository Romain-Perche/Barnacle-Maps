# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-23968-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", should the map go back to the app's fixed default view or to the view centered on their location? → A: Option C. Go to the person's location at the close zoom if it was found when the app opened (the first location fix), otherwise to the fixed default view.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return the map to its starting view (Priority: P1)

A user has panned and zoomed around the map (for example to look at a route, a search result, or just to explore) and has lost their bearings. They press a "Reset view" button shown on the map, and the map returns to the starting view: the view centered on their location at close zoom if their location was found when the app opened, or the app's fixed default view if it was not.

**Why this priority**: This is the entire feature. It gives users a one-step way back to a known reference view instead of manually panning and zooming.

**Independent Test**: Open the app (once with location access allowed, once denied), note the starting view, pan and zoom elsewhere, press "Reset view", and confirm the map shows the starting view again.

**Acceptance Scenarios**:

1. **Given** the user has panned the map away from its starting center, **When** they press "Reset view", **Then** the map is centered on the starting center again.
2. **Given** the user has zoomed in or out from the starting zoom level, **When** they press "Reset view", **Then** the map returns to the starting zoom level.
3. **Given** the person's location was found when the app opened, **When** they press "Reset view", **Then** the map centers on that first-found location at the close zoom level.
4. **Given** location access was denied or the location could not be found, **When** the person presses "Reset view", **Then** the map shows the fixed default view.
5. **Given** the map is already showing the starting view, **When** the user presses "Reset view", **Then** the view stays the same and nothing breaks.
6. **Given** routes, a destination, or the user's position marker are shown on the map, **When** the user presses "Reset view", **Then** only the view changes; the routes, markers, search results, selected travel mode and selected route are left as they were.

---

### User Story 2 - Find and use the button with any input method (Priority: P2)

A user who navigates with the keyboard or a screen reader can find the button, understand what it does, and trigger it.

**Why this priority**: Makes the feature usable by everyone, but the core value is delivered by Story 1.

**Independent Test**: Using only the keyboard, move focus to the button and activate it; with a screen reader, confirm the button is announced as "Reset view".

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user tabs through the page, **Then** the "Reset view" button can receive focus and be activated with Enter or Space.
2. **Given** a screen reader is in use, **When** the button receives focus, **Then** it is announced with an accessible name of "Reset view".
3. **Given** a touch device, **When** the user taps the button, **Then** the map resets just as with a mouse click.

### Edge Cases

- The person presses "Reset view" before the first location fix has arrived: the map goes to the fixed default view; once the first fix arrives, it becomes the starting view for later presses.
- The person moves after the app opened (live position updates): "Reset view" still returns to the first-found location, not to their latest position.
- Location access is denied or unsupported: the button stays available and returns to the fixed default view.
- The user presses the button repeatedly in quick succession: each press ends at the starting view; no errors or stuck states.
- The user presses the button while the map is still moving (e.g., during a zoom animation): the map ends at the starting view.
- Small screens: the button stays visible and does not cover the search panel, route list, or other map controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a control labelled "Reset view" (text and/or an icon with a "Reset view" tooltip and accessible name) that is visible whenever the map is shown.
- **FR-002**: Activating the control MUST set the map's center and zoom to the starting view. The starting view is the person's first-found location at the close zoom level the app uses when it first centers on them, if the location was found. Otherwise it is the app's fixed default center and zoom.
- **FR-002a**: The starting view MUST be fixed at the first location fix and MUST NOT follow later position updates.
- **FR-003**: Activating the control MUST NOT change any other app state: search input and results, destination, displayed routes, selected route, travel mode, pleasure indicators, user position marker, and status messages stay as they were.
- **FR-004**: The control MUST be operable by mouse, touch, and keyboard (focusable, activates with Enter and Space).
- **FR-005**: The control MUST have the accessible name "Reset view".
- **FR-006**: The control MUST be placed so that it does not overlap the search/route panel or the existing map zoom controls on desktop and mobile screen sizes.
- **FR-007**: Activating the control when the map is already at the starting view MUST leave the view unchanged and raise no error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned or zoomed state, one press of "Reset view" brings the map back to the starting center and zoom in 100% of attempts.
- **SC-002**: The map reaches the starting view within 1 second of pressing the button.
- **SC-003**: Going back to the starting view takes 1 action, versus several pan/zoom gestures before.
- **SC-004**: After pressing "Reset view", 100% of previously displayed routes, markers and panel content are still present and unchanged.
- **SC-005**: The button can be reached and activated using only the keyboard.

## Assumptions

- "Starting position and zoom" means the view the app first settles on: centered on the person's first-found location when available, otherwise the fixed default view (see Clarifications). It never means the view framing a route or search result.
- The reset only moves the map; it does not clear searches, routes, or markers. Clearing those is out of scope.
- The transition to the starting view may be animated or instant; either is acceptable as long as SC-002 is met.
- The button label is in English, like the rest of the interface.
- The starting view is not saved between sessions; it is set again each time the app opens.
