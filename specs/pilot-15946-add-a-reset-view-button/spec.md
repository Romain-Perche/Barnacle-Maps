# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-15946-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", which view should the map go back to? → A: The first view the app settled on: the user's location at the closer zoom if location was found, otherwise the default view (central Paris at the city-wide zoom). Not the user's current position as they move.

- Q: What are the default starting center and zoom, as numbers? → A: Latitude 48.8566, longitude 2.3522, zoom 13 (the values the app already uses).
- Q: What zoom level is the "closer zoom" of the location-based starting view? → A: Zoom 15, the level the app already uses to auto-center.
- Q: What visual states does the button have? → A: Default white like the Leaflet controls; hover light grey (#f4f4f4); keyboard focus shows a visible 2px blue (#1a73e8) outline; no separate pressed state.
- Q: Does the button change when the map is already at the starting view? → A: No. It is always enabled and always looks the same; pressing it at the starting view does nothing.
- Q: Where does keyboard focus go after a reset? → A: It stays on the Reset view button.
- Q: What happens to an open destination popup on reset? → A: It stays open. Reset only moves the view, so the popup may end up off-screen.
- Q: Is a reset announced to screen reader users? → A: No extra announcement; the status line stays untouched (FR-005). The button's name says what it does.
- Q: What does "clearly labeled" mean for the button? → A: The button shows a ⟲ icon the same size as the zoom buttons, with the accessible name "Reset view" and the tooltip "Reset view".
- Q: Which is required, the tooltip or the label? → A: Both the accessible name and the hover tooltip. On touch screens users rely on the icon; this is an accepted limitation.
- Q: What does "visible at all times" mean when the panel is tall or the screen is short? → A: The panel's height is capped so the bottom of the map (at least 72px) stays free, and the panel scrolls inside. The button sits bottom-right, above the attribution.
- Q: What exactly is "the app first auto-centers on the user's location"? → A: The first location fix received after the page loads. Later fixes, and allowing location again after denying it, don't change the starting view. A reload starts over.
- Q: How are "obscure or overlap" and "small (mobile) screens" measured? → A: The button's box never intersects the panel or another control, with at least 8px between them. Checked at 360×640, 375×667, 667×375 (landscape) and 1280×800, with the panel showing 5 results or 3 routes.
- Q: Where is the button placed, given that the panel covers the top-left zoom control? → A: In the bottom-right corner of the map, above the attribution.
- Q: Which state must SC-003 check? → A: The same items as FR-005, including open popups.
- Q: Between which points is SC-001's "under 1 second" measured? → A: From pressing the button to the end of the map's movement.
- Q: What tolerance does "exactly" have in SC-002? → A: The zoom is equal, and the center is within 0.000001° of latitude and longitude.
- Q: How is "announced by a screen reader" checked? → A: The browser's accessibility tree shows role "button" and name "Reset view", plus one spot check with NVDA or VoiceOver.
- Q: Which success criterion covers FR-008? → A: A new SC-005: at the viewport sizes of FR-008, the button is fully visible and overlaps nothing.
- Q: What happens on a reset pressed while routes are still loading? → A: The reset happens immediately and doesn't cancel the route request. When the routes arrive, the app still fits the view to them as today, and the user can press Reset view again.
- Q: What happens on a reset pressed while the map is still moving after a drag or zoom? → A: The reset interrupts the ongoing movement and ends at the starting view.
- Q: What is the starting view if location is revoked or fails after the location starting view was set? → A: It stays the first location view until the page is reloaded.
- Q: What is the button's minimum touch size? → A: At least 44×44 CSS px.
- Q: Which contrast and focus-indicator rules apply? → A: WCAG 2.1 AA: the icon and the focus outline have at least 3:1 contrast against their background, and the focus outline is always visible on keyboard focus.
- Q: Where is the button in the keyboard tab order? → A: The page's natural order: map controls (zoom, Reset view, attribution links) first, then the search panel. No markup change.
- Q: Is the dependency on the app's one-time auto-centering documented? → A: Yes, as an assumption: the app auto-centers once, on the first location fix, at zoom 15; any change to that behavior changes the starting view too.
- Q: Does "smooth or instant transition" fit SC-001's 1-second limit? → A: The transition may be smooth or instant but must finish within 1 s, so no long fly-to animation.

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
- If location access is revoked or fails after the location starting view was set, the starting view stays that first location view until the page is reloaded. Allowing location again after denying it does not change the starting view either.
- Later updates to the user's position (as they move) do not change the starting view; Reset view returns to the original starting view, not the current position.
- Searching for a place or displaying routes moves the map but does not change the starting view.
- Pressing the button repeatedly or rapidly leaves the map at the starting view without errors.
- Pressing the button while the map is still moving (drag inertia, zoom or pan animation) interrupts that movement and ends at the starting view.
- Pressing the button while routes are still loading resets the view immediately and does not cancel the route request. When the routes arrive, the app fits the view to them as it does today; the user can press Reset view again.
- An open destination popup stays open after a reset, even if it ends up off-screen.
- The button must remain visible and usable on small (mobile) screens (360×640, 375×667 and 667×375 landscape) and must not be hidden behind the search/route panel or overlap the existing zoom controls (see FR-008, FR-012).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST display a "Reset view" button, visible at all times while the map is shown. The button shows a ⟲ icon the same size as the zoom buttons, with the accessible name "Reset view" and the tooltip "Reset view". It sits in the bottom-right corner of the map, above the attribution.
- **FR-002**: When the user activates the Reset view button, the system MUST return the map to its starting center position and starting zoom level.
- **FR-003**: The starting view MUST be the app's default view at load (latitude 48.8566, longitude 2.3522, zoom 13), replaced once by the user's location at zoom 15 if and when the app first auto-centers on the user's location. "First auto-centers" means the first location fix received after the page loads; a reload starts over.
- **FR-004**: The starting view MUST NOT change due to subsequent position updates, searches, route display, or manual panning/zooming.
- **FR-005**: Activating Reset view MUST NOT clear or alter search input, search results, displayed routes, the selected route, the travel mode, status messages, the user's position marker, or open popups. No extra announcement is made: the status line stays untouched.
- **FR-006**: The Reset view button MUST be operable with mouse/touch and with the keyboard (focusable, activatable with Enter or Space). Keyboard focus stays on the button after a reset. The button keeps the page's natural tab order: map controls (zoom, Reset view, attribution links) first, then the search panel.
- **FR-007**: The Reset view button MUST have both the accessible name "Reset view" and the hover tooltip "Reset view". On touch screens, where tooltips don't show, users rely on the icon (accepted limitation).
- **FR-008**: The Reset view button's box MUST NOT intersect the search/route panel or any other map control, with at least 8px between them, at 360×640, 375×667, 667×375 (landscape) and 1280×800, with the panel showing 5 results or 3 routes.
- **FR-009**: The button's visual states MUST be: default white like the Leaflet controls; hover light grey (#f4f4f4); keyboard focus a visible 2px blue (#1a73e8) outline. There is no separate pressed state.
- **FR-010**: The button MUST always be enabled and look the same, including when the map is already at the starting view (pressing it then does nothing).
- **FR-011**: The button MUST be at least 44×44 CSS px.
- **FR-012**: The search/route panel's height MUST be capped so the bottom strip of the map that holds the button stays free (at least 72px, and enough for the button, the attribution and the 8px gap of FR-008); the panel scrolls inside when its content is taller.
- **FR-013**: The button MUST meet WCAG 2.1 AA for non-text contrast: the icon and the focus outline have at least 3:1 contrast against their background, and the focus outline is always visible on keyboard focus.
- **FR-014**: Activating Reset view while the map is moving MUST interrupt that movement and end at the starting view. Activating it while routes are loading MUST NOT cancel the route request; the later fit-to-routes still happens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, users return to the starting view with a single action, in under 1 second measured from pressing the button to the end of the map's movement.
- **SC-002**: In 100% of tested cases, after Reset view the map's center and zoom match the starting view: the zoom is equal and the center is within 0.000001° of latitude and longitude.
- **SC-003**: In 100% of tested cases, the search input, search results, displayed routes, selected route, travel mode, status messages, the user's position marker and open popups are identical before and after Reset view.
- **SC-004**: The button can be reached and activated using only the keyboard, and the browser's accessibility tree shows role "button" and name "Reset view" (plus one spot check with NVDA or VoiceOver).
- **SC-005**: At the viewport sizes listed in FR-008, the button is fully visible and overlaps nothing.

## Assumptions

- "Starting position and zoom" means the view the map settled on when the app started: the default starting view, or — if the app auto-centered on the user's location — that location view at the zoom used for auto-centering. This matches what the user saw at startup (confirmed in Clarifications, 2026-11-10).
- The reset applies only to the map view; it does not reset the application state (searches, routes, travel mode).
- The button is placed in the bottom-right corner of the map, above the attribution, following the existing Leaflet control style (the panel covers the top-left zoom control).
- A smooth or instant transition to the starting view are both acceptable, but it must finish within SC-001's 1 second, so no long fly-to animation.
- The app auto-centers once, on the first location fix, at zoom 15. Any change to that behavior changes the starting view too.
- No persistence is needed: the starting view is determined fresh on each app load.
