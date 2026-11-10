# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-21489-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", where should the map go back to? → A: To the view the map settled on at start-up: centred on the person's location (at the start-up zoom) if it was detected, otherwise the app's fixed default view. It does not follow the person if they move later. (Option A)
- Q: How is the placement, size and state styling of the button defined (CHK001, CHK003, CHK007, CHK008, CHK012, CHK022, CHK023, CHK024)? → A: Top-right map corner; same style as other map controls with hover/focus/active states; touch target at least 44 px high; text and focus indicator meet WCAG AA contrast (4.5:1 text, 3:1 focus ring); no overlap with panel, zoom controls or attribution on screens from 320 px wide; tab order follows page order (decided by the factory, no question asked)
- Q: When exactly is the starting view fixed, and what zoom does it use (CHK004, CHK005, CHK006, CHK010, CHK017, CHK018, CHK019, CHK028)? → A: It is the default view (48.8566, 2.3522, zoom 13) until the first location fix; that first fix centres the map on the user at zoom 15 and that view becomes the starting view, once, even if the user already moved the map or searched a place. Accuracy of the fix is not filtered. Later fixes never change it. This single one-time change is the only exception to FR-005 (decided by the factory, no question asked)
- Q: What does "same view" and the timing mean (CHK009, CHK013, CHK014, CHK021)? → A: Exactly the same centre and zoom values; any running map animation is interrupted; the 1 s starts at the press and ends when the map stops moving; repeated presses are harmless (decided by the factory, no question asked)
- Q: What else stays untouched and how is it announced (CHK011, CHK016, CHK025, CHK026, CHK027, CHK029)? → A: Status message unchanged; button announced as "Reset view, button" by common screen readers, no extra announcement; English only; starting view is session-only; no network request on press (decided by the factory, no question asked)
- Q: Does the button show a text label, an icon, or both (CHK002)? → A: A visible text label "Reset view" (no icon-only button), with the same text as tooltip and accessible name (Pilot, 2026-11-10)
- Q: What happens to an open popup when the view resets (CHK020)? → A: An open popup stays open and unchanged; only map position and zoom change. Leaflet may close a popup if the reset moves it out of view, which is acceptable (Pilot, 2026-11-10)

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

5. **Given** the user presses "Reset view", **When** the map moves, **Then** no search, routing or pleasure request is started.

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
- **FR-002**: The button MUST be placed on the map with the other map controls, in the top-right corner of the map, without overlapping on screens from 320 px wide the search/routes panel, the zoom controls, or the map attribution.
- **FR-003**: Pressing the button MUST return the map to the starting view: the same centre position and zoom level the map showed at start-up.
- **FR-004**: The starting view MUST be the view the map settles on at start-up: centred on the user's detected location at the start-up zoom if location is detected and the map auto-centres on it, otherwise the app's fixed default view. It MUST NOT be recomputed from the user's current location when the button is pressed.
- **FR-005**: The starting view MUST NOT change after start-up because of later location updates, panning, zooming, searches, or route display.
- **FR-006**: Pressing the button MUST change only the map's position and zoom; it MUST NOT clear or change the search input, search results, destination, routes, selected route, travel mode, pleasure indicators, user position marker, open popups (which stay open and unchanged, unless Leaflet closes one moved out of view), or status message.
- **FR-007**: The button MUST work with mouse, touch, and keyboard (Enter and Space), and MUST show a visible focus indicator.
- **FR-008**: The button MUST have the accessible name "Reset view" and show a visible text label "Reset view" (no icon-only button) with the same text as its tooltip.
- **FR-010**: The starting view MUST be the default view (48.8566, 2.3522, zoom 13) until the first location fix, which sets it once to the user's location at zoom 15, even if the map was already moved.
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

- "Starting position and zoom" means the view the user actually sees once start-up finishes, as confirmed in Clarifications (Session 2026-11-10): centred on their location if it was detected and the map auto-centred on it, otherwise the app's fixed default view. It is not recomputed from the user's current location when the button is pressed.
- Resetting the view is a navigation-only action; it does not reset or clear any search, route, or mode state (a full "clear" action is out of scope).
- The starting view is kept only for the current session; it is not saved across page reloads (a reload sets up a new starting view as usual).
- The button uses the same visual style as the existing map controls and an English label, matching the rest of the interface.
- No new external services or data sources are needed.
