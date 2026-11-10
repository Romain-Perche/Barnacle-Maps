# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-23968-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", should the map go back to the app's fixed default view or to the view centered on their location? → A: Option C. Go to the person's location at the close zoom if it was found when the app opened (the first location fix), otherwise to the fixed default view.
- Q: What are the fixed default view and the close zoom level? → A: the fixed default view is Paris, center 48.8566, 2.3522 at zoom 13; the close zoom is 15 (CHK001, CHK002) (decided by the factory, no question asked)
- Q: Do open popups (e.g. the destination popup) change on reset? → A: no, they stay as they are, even if they end up off screen (CHK003) (decided by the factory, no question asked)
- Q: Where is keyboard focus after the control is activated? → A: it stays on the control (CHK004) (decided by the factory, no question asked)
- Q: Is anything announced to screen readers after a reset? → A: no; the status message is not changed and no extra announcement is made, because the map view itself is not described to screen readers (CHK005) (decided by the factory, no question asked)
- Q: Where is the control in the tab order? → A: in document order with the map's own controls, after the zoom buttons; no custom tabindex (CHK006) (decided by the factory, no question asked)
- Q: How big must the touch target be? → A: at least 44 × 44 CSS px (CHK009) (decided by the factory, no question asked)
- Q: Is a visible focus indicator required? → A: yes, a clearly visible focus outline when focused by keyboard (CHK010) (decided by the factory, no question asked)
- Q: What contrast is required? → A: WCAG 2.1 AA: label text at least 4.5:1 against the button, button edge at least 3:1 against the map (CHK011) (decided by the factory, no question asked)
- Q: What does 'visible whenever the map is shown' cover? → A: the app never hides or disables the control; the panel growing over it on a very short screen with a long result list is an existing layout limit and out of scope (CHK012) (decided by the factory, no question asked)
- Q: Must the control avoid the map attribution too? → A: yes, it must not cover the OpenStreetMap attribution (CHK013) (decided by the factory, no question asked)
- Q: Where is SC-002's 1 second measured? → A: from the press to the map being settled at the starting view (any animation finished) (CHK017) (decided by the factory, no question asked)
- Q: Which states must SC-001 hold from? → A: panned, zoomed, panned and zoomed, mid-animation, and after repeated presses (CHK018) (decided by the factory, no question asked)
- Q: Is SC-003 a pass/fail gate? → A: no, it describes the benefit; SC-001 and SC-002 are the gates (CHK019) (decided by the factory, no question asked)
- Q: What does 'unchanged' mean in SC-004? → A: same routes drawn, same selected route, same markers, same panel text (search input, results, route list, pleasure, status) and same travel mode (CHK020) (decided by the factory, no question asked)
- Q: When is the map 'at the starting view'? → A: same zoom, and center within 0.00001° of the starting center (CHK021) (decided by the factory, no question asked)
- Q: What if location access is granted later in the same session? → A: the first fix that arrives in the session, whenever it arrives, is the first fix; re-asking for location is out of scope (CHK023) (decided by the factory, no question asked)
- Q: Can gestures on the control act on the map? → A: no: click, double-click, wheel and drag on the control must not pan or zoom the map or select a route (CHK024) (decided by the factory, no question asked)
- Q: Do mouse, touch and keyboard give the same result? → A: yes; the tooltip shows on mouse hover only, no long-press behaviour is required (CHK025) (decided by the factory, no question asked)
- Q: What if the window is resized or the device rotated before a reset? → A: the reset uses the same starting center and zoom; nothing is re-fitted (CHK026) (decided by the factory, no question asked)
- Q: What is the end state for repeated or mid-animation presses? → A: the map is at the starting view within 1 s of the last press (CHK027) (decided by the factory, no question asked)
- Q: What if tiles fail to load or the device is offline? → A: the control stays available and the view still changes; missing tiles are not this feature's concern (CHK028) (decided by the factory, no question asked)
- Q: Is an inaccurate first fix still used? → A: yes, any first fix is the starting view, whatever its accuracy (CHK029) (decided by the factory, no question asked)
- Q: Should the move respect reduced motion? → A: yes: when the user prefers reduced motion, the map jumps without animation (CHK030) (decided by the factory, no question asked)
- Q: If the person has already panned, zoomed or pressed Reset view before their location arrives, does the map still jump to it when the first fix arrives? → A: yes, keep today's behaviour: the map always jumps to the first-found location when it arrives, even if the person has already moved the map, and that location becomes the Reset view target (CHK016)
- Q: If routes finish computing after a reset and the map zooms to show them, is that acceptable? → A: yes; Reset view only acts at the moment it is pressed; routes that arrive later still zoom the map to show them, as they do today (CHK022)
- Q: Does the control show text, an icon, or both? → A: the words "Reset view" on the button, no icon, with the same text as tooltip (CHK007)
- Q: Where is the control placed? → A: bottom-right corner of the map, just above the OpenStreetMap attribution, on all screen sizes, checked at 375 px and 1280 px wide; the top corners are not free on phones because the search panel covers the whole top of the screen (CHK008)
- Q: What counts as a "clearly visible" focus outline? → A: a solid outline at least 2 px thick, offset from the button, with at least 3:1 contrast against both the button and the map around it (analyze A1) (decided by the factory, no question asked)
- Q: On small screens, must the button never be covered by the panel? → A: no; the button must never cover the panel, route list or other map controls, but the panel growing over the button on a very short screen is the existing layout limit already out of scope (analyze I6) (decided by the factory, no question asked)

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
- The first location fix arrives after the person has already panned, zoomed or pressed "Reset view": the map still jumps to that location (as today), and it becomes the starting view.
- Routes finish computing after a reset: the map still zooms to show them, as today. "Reset view" only acts at the moment it is pressed.
- The person moves after the app opened (live position updates): "Reset view" still returns to the first-found location, not to their latest position.
- Location access is denied or unsupported: the button stays available and returns to the fixed default view.
- The user presses the button repeatedly in quick succession: each press ends at the starting view; no errors or stuck states.
- The user presses the button while the map is still moving (e.g., during a zoom animation): the map ends at the starting view.
- Repeated or mid-animation presses: the map is at the starting view within 1 second of the last press.
- Location access granted later in the same session: the first fix that arrives, whenever it arrives, is the first fix.
- The window is resized or the device rotated before a reset: the same starting center and zoom are used; nothing is re-fitted.
- Map tiles fail to load or the device is offline: the control stays available and the view still changes.
- The first fix is inaccurate: it is still used as the starting view.
- A popup (e.g. the destination popup) is open: it stays as it is.
- Small screens: the button does not cover the search panel, route list, or other map controls. (The panel growing over the button on a very short screen with a long result list is out of scope, see Assumptions.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a control that displays the text "Reset view" (no icon), with "Reset view" as its tooltip and accessible name, visible whenever the map is shown.
- **FR-002**: Activating the control MUST set the map's center and zoom to the starting view. The starting view is the person's first-found location at the close zoom level the app uses when it first centers on them, if the location was found. Otherwise it is the app's fixed default center and zoom (Paris, 48.8566, 2.3522, zoom 13). The close zoom level is 15. The map is "at the starting view" when its zoom is equal and its center is within 0.00001° of the starting center.
- **FR-002a**: The starting view MUST be fixed at the first location fix and MUST NOT follow later position updates.
- **FR-003**: Activating the control MUST NOT change any other app state: search input and results, destination, displayed routes, selected route, travel mode, pleasure indicators, user position marker, and status messages stay as they were. Open popups stay as they are.
- **FR-003a**: Click, double-click, wheel and drag on the control MUST NOT pan or zoom the map or select a route.
- **FR-004**: The control MUST be operable by mouse, touch, and keyboard (focusable, activates with Enter and Space), with the same result for each. After activation, focus stays on the control. Tab order follows the document: with the map's controls, after the zoom buttons.
- **FR-004a**: The control MUST show a clearly visible focus outline when focused by keyboard (solid, at least 2 px thick, offset from the button, at least 3:1 contrast against the button and the map), have a touch target of at least 44 × 44 CSS px, and meet WCAG 2.1 AA contrast (label 4.5:1, button edge 3:1 against the map).
- **FR-005**: The control MUST have the accessible name "Reset view". No extra screen-reader announcement is made after a reset.
- **FR-006**: The control MUST be placed in the bottom-right corner of the map, just above the OpenStreetMap attribution, on all screen sizes, and MUST NOT overlap the search/route panel, the existing map zoom controls, or the attribution. This is checked at 375 px and 1280 px wide.
- **FR-003b**: "Reset view" acts only at the moment it is pressed. Automatic map moves that already exist (jumping to the first location fix, zooming to show newly computed routes) still happen afterwards.
- **FR-007**: Activating the control when the map is already at the starting view MUST leave the view unchanged and raise no error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned or zoomed state, one press of "Reset view" brings the map back to the starting center and zoom in 100% of attempts, from each of these states: panned, zoomed, panned and zoomed, mid-animation, and after repeated presses.
- **SC-002**: The map reaches the starting view within 1 second of pressing the button, measured from the press to the map being settled (any animation finished).
- **SC-003**: Going back to the starting view takes 1 action, versus several pan/zoom gestures before (describes the benefit; not a pass/fail gate).
- **SC-004**: After pressing "Reset view", 100% of previously displayed routes, markers and panel content are still present and unchanged: same routes drawn, same selected route, same markers, same panel text (search input, results, route list, pleasure, status) and same travel mode.
- **SC-005**: The button can be reached and activated using only the keyboard.

## Assumptions

- "Starting position and zoom" means the view the app first settles on: centered on the person's first-found location when available, otherwise the fixed default view (see Clarifications). It never means the view framing a route or search result.
- The reset only moves the map; it does not clear searches, routes, or markers. Clearing those is out of scope.
- The transition to the starting view may be animated or instant; either is acceptable as long as SC-002 is met. When the user prefers reduced motion, it MUST be instant.
- The button label is in English, like the rest of the interface. Localization is out of scope.
- The starting view is not saved between sessions; it is set again each time the app opens. This is a deliberate scope decision.
- The app never hides or disables the control. On a very short screen the panel can grow over it with a long result list; that existing layout limit is out of scope.
