# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-7912-add-a-reset-view-button`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-11

- Q: When someone presses "Reset view", which view should the map go back to? → A: Option A. It goes back to the first view the user saw once the app was ready: their location at zoom 15 if it was found, otherwise the default view (Paris at zoom 13). The view is fixed once set and does not follow the user as they move.

### Session 2026-11-11 (check-plan-completeness)

- Q: Is the default starting view given with exact values? → A: Center 48.8566, 2.3522 (Paris) at zoom 13. (decided by the factory, no question asked)
- Q: What happens to an open destination popup on reset? → A: The reset neither opens nor closes it; an open popup stays open on its marker. (decided by the factory, no question asked)
- Q: Where does keyboard focus go after activating the control? → A: It stays on the "Reset view" button. (decided by the factory, no question asked)
- Q: Is the reset announced to assistive technology? → A: No. The status message is not changed and nothing extra is announced; the button keeps its name and focus. (decided by the factory, no question asked)
- Q: Are the control's visual states (default, hover, focus, active) defined? → A: They follow the map library's standard control styles, plus a visible focus indicator (FR-009). (decided by the factory, no question asked)
- Q: Does "once startup positioning was done" (FR-002) have a precise meaning? → A: FR-002 now points to FR-003: the starting view is the one defined there. (decided by the factory, no question asked)
- Q: Does the control's position have to avoid the zoom control even though the search panel may already cover it? → A: Yes. The control must not overlap the zoom control wherever that control is. Moving the zoom control is out of scope. (decided by the factory, no question asked)
- Q: What does "small screens" mean? → A: Viewports from 320×568 CSS px up. (decided by the factory, no question asked)
- Q: Which icon is used, if any? → A: A house symbol (⌂), with the accessible name and tooltip "Reset view". (decided by the factory, no question asked)
- Q: What tolerance applies to "the same center and zoom"? → A: Exactly the same zoom level, and a center within 1 screen pixel of the starting center. (decided by the factory, no question asked)
- Q: Is the move to the starting view animated? → A: Yes, a short animation that ends within 1 second, and no animation when the user's system asks for reduced motion (FR-010). (decided by the factory, no question asked)
- Q: Does "nothing else changes" in scenario 1.2 match the FR-005 list? → A: Scenario 1.2 now refers to the FR-005 list. (decided by the factory, no question asked)
- Q: Is the default view provisional or "set" under FR-004? → A: Provisional: FR-004 applies only from the first location fix on. (decided by the factory, no question asked)
- Q: How is SC-004 measured? → A: Informal test with 5 people who have not used the app; at least 4 of 5 find and use the control in under 5 seconds. (decided by the factory, no question asked)
- Q: Where does SC-002's 1-second window start and end? → A: From activation until the map is at rest at the starting view. (decided by the factory, no question asked)
- Q: Can SC-003 be checked against an explicit list? → A: Yes, the list in FR-005. (decided by the factory, no question asked)
- Q: Do the US2 scenarios require both Enter and Space? → A: Yes, each key on its own must reset the view. (decided by the factory, no question asked)
- Q: What if location access is granted after an earlier denial in the same session? → A: If a first location fix ever arrives in the session, FR-003 applies to it as usual; until then the default view is used. (decided by the factory, no question asked)
- Q: What if location fails after a successful first fix? → A: The starting view stays at the first fix. (decided by the factory, no question asked)
- Q: What about viewport resize or orientation change? → A: Reset keeps the same center and zoom; the visible area may differ, which is intended. (decided by the factory, no question asked)
- Q: Does a reset affect route or pleasure computations still in progress? → A: No. They continue and their results are shown as usual. (decided by the factory, no question asked)
- Q: Is the control enabled when the map is already at the starting view? → A: Yes, it is always visible and enabled. (decided by the factory, no question asked)
- Q: Is a minimum touch-target size specified? → A: At least 30×30 CSS px (34×34 on touch devices), like the other map controls. (decided by the factory, no question asked)
- Q: Are focus indicator and contrast requirements specified? → A: A visible focus indicator, and at least 3:1 contrast for the icon and the focus indicator against their background. (decided by the factory, no question asked)
- Q: Is reduced-motion behaviour specified? → A: When the user's system asks for reduced motion, the reset jumps with no animation. (decided by the factory, no question asked)
- Q: Does "reuse the map library's styling" conflict with a native, keyboard-operable button? → A: No. Only the look and placement are reused; the control itself is a native button. (decided by the factory, no question asked)
- Q: Is "the reset does not request a new location fix" a testable requirement? → A: Yes, it is now FR-008. (decided by the factory, no question asked)
- Q: Where exactly does the Reset view button sit on the map? → A: In the bottom-right corner, just above the map credits line, where the search panel never covers it on any screen size.
- Q: What does the button show: a word, an icon, or both? → A: A house icon (⌂) only, the same size as the other map buttons, with the tooltip and screen-reader name "Reset view".
- Q: If the person moves the map before their location is found, does the first location fix still move the map to them? → A: Yes, as today: the first fix always centers the map on the person at zoom 15, even if they have moved the map, and that view becomes the starting view.
- Q: If the person picks a destination before their location is found, what does the first location fix do? → A: As today: the first fix centers the map on the person at zoom 15 (moving away from the destination) and becomes the starting view; the routes are then computed as usual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return to the starting view in one click (Priority: P1)

A person has panned and zoomed around the map (for example to look at a route, a search result, or a distant area) and wants to get back to where the map started. They press a "Reset view" button on the map and the map returns to its starting position and zoom level.

**Why this priority**: This is the whole feature. Without it, getting back to the starting view means manual panning and zooming, which is slow and imprecise.

**Independent Test**: Load the app, note the starting center and zoom, pan and zoom elsewhere, press "Reset view", and check that the map shows the same center and zoom as at start.

**Acceptance Scenarios**:

1. **Given** the map has been panned and zoomed away from its starting view, **When** the user presses "Reset view", **Then** the map shows the starting center and starting zoom level.
2. **Given** the map is already at its starting view, **When** the user presses "Reset view", **Then** the map stays at the starting view and none of the state listed in FR-005 changes.
3. **Given** the user has searched a place and routes are displayed, **When** the user presses "Reset view", **Then** only the view changes; the destination, the displayed routes, the selected route, the travel mode and the search results remain as they were.
4. **Given** the user location was found when the app started and the map centered on it, **When** the user later pans away and presses "Reset view", **Then** the map returns to that initial location-centered view (same center and zoom).
5. **Given** the user location is not available (denied or unsupported), **When** the user presses "Reset view", **Then** the map returns to the default starting center and zoom.

---

### User Story 2 - Accessible reset control (Priority: P2)

A keyboard or screen-reader user can find and activate the "Reset view" control just like the other map controls.

**Why this priority**: The control must be usable by everyone, but it builds on Story 1.

**Independent Test**: Using only the keyboard, tab to the control and activate it with Enter or Space; with a screen reader, check the control is announced with a clear name such as "Reset view".

**Acceptance Scenarios**:

1. **Given** keyboard-only navigation, **When** the user tabs to the control and presses Enter, **Then** the map resets to its starting view; pressing Space instead gives the same result.
2. **Given** a screen reader, **When** the control receives focus, **Then** it is announced as a button named "Reset view".

---

### Edge Cases

- The user's location is found again later (live position updates) after the starting view was set: the starting view does not move with the user; it stays the view set at startup.
- The user presses "Reset view" several times quickly: the map ends at the starting view with no error.
- The user presses "Reset view" while the map is still animating (e.g. after zooming to a route): the map ends at the starting view.
- The user presses "Reset view" before the user location is known, and the location arrives later: the first location fix still centers the map as it does today, and that view becomes the starting view for later resets.
- Small screens (viewports from 320×568 CSS px up): the control stays visible and does not cover the search/route panel or the other map controls.
- Location access is granted after an earlier denial in the same session: if a first location fix arrives, FR-003 applies to it as usual; until then resets go to the default view.
- Location fails after a successful first fix: the starting view stays at that first fix.
- The viewport is resized or rotated: a reset still uses the same center and zoom; the visible area may differ.
- A route or pleasure computation is still in progress: the reset does not cancel or change it.
- The user pans or zooms before the first location fix: the first fix still centers the map on the user at zoom 15, overriding their manual view (as today), and that view becomes the starting view.
- The user picks a destination before the first location fix (the map centers on the destination): the first fix still centers the map on the user at zoom 15, moving away from the destination (as today), and that view becomes the starting view; the routes are then computed as usual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a "Reset view" control at all times while the map is displayed. The control shows a house icon (⌂) only, no visible text, at the same size as the other map buttons; its tooltip and accessible name are "Reset view". The control is always enabled, also when the map is already at the starting view. Its default, hover and active states follow the map library's standard control styles.
- **FR-002**: Activating the control MUST move the map to the starting view: the starting view defined in FR-003. "Same" means exactly the same zoom level and a center within 1 screen pixel.
- **FR-003**: The starting view MUST be the default view (Paris: 48.8566, 2.3522, at zoom 13) until the first location fix. When the app automatically centers on the user's location at that first fix (location at zoom 15), that location-centered view becomes the starting view.
- **FR-004**: The default view is provisional. Once the first location fix has set the starting view, it MUST NOT change (later live position updates, searches and route selections do not change it).
- **FR-005**: Activating the control MUST NOT change anything other than the map view: no clearing of the search input, search results, destination marker, routes, selected route, travel mode, pleasure indicators, user marker or status message. An open destination popup stays open. Route or pleasure computations in progress are not cancelled. Nothing extra is announced to assistive technology.
- **FR-006**: The control MUST be operable by mouse/touch and by keyboard (focusable, activated with Enter or Space) and MUST have the accessible name "Reset view". After activation, keyboard focus stays on the control.
- **FR-007**: The control MUST be placed in the bottom-right corner of the map, just above the map credits (attribution) line, and MUST NOT overlap the search/route panel or the zoom controls, wherever the zoom control is. Moving the zoom control is out of scope.
- **FR-008**: Activating the control MUST NOT request a new location fix.
- **FR-009**: The control MUST have a touch target of at least 30×30 CSS px (34×34 on touch devices), a visible keyboard focus indicator, and at least 3:1 contrast for its icon and focus indicator against their background.
- **FR-010**: The move to the starting view SHOULD be a short animation. When the user's system asks for reduced motion, it MUST happen with no animation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, one activation of the control returns the map to the starting center and zoom (same zoom, center within 1 screen pixel) in 100% of tests.
- **SC-002**: The map reaches the starting view within 1 second of the user activating the control, measured from activation until the map is at rest.
- **SC-003**: After a reset, 100% of the route, destination and search state shown before the reset is still shown (every item listed in FR-005).
- **SC-004**: A first-time user can find and use the control to get back to the starting view in under 5 seconds without instructions, measured in an informal test where at least 4 of 5 people who have not used the app succeed.

## Assumptions

- "Starting position and zoom" means the view the user saw when the app was ready: the default center and zoom, or the location-centered view the app already sets on the first location fix. The reset does not ask for a new location fix.
- The button resets the view only; it is not a "clear search/routes" action. Clearing routes is out of scope.
- The control label is in English, like the rest of the interface.
- No setting is saved between visits; the starting view is set again each time the app is opened.
- The existing map library's standard control placement and styling are reused so the button looks like the other map controls; the control itself is a native button so it works with the keyboard.
