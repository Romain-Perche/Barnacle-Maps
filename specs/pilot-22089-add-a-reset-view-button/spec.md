# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-22089-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

### Session 2026-11-10

- Q: When someone presses "Reset view", where should the map go: the place where it first opened (central Paris, zoom 13), or the view centered on their location that the app shows once the location is found? → A: Option A. Go back to the first view the app shows by itself: centered on the user's location at zoom 15 if it was found when the app opened, otherwise central Paris at zoom 13. Later live-position updates do not move the reset target.
- Q: Which startup outcomes define the starting view? → A: the first successful location fix of the page load, whenever it arrives (even after an earlier error), at zoom 15; if no fix ever succeeds (denied, unsupported, error, still pending), the default view (decided by the factory, no question asked)
- Q: Which state must a reset leave unchanged? → A: everything except the map center and zoom, including the destination marker and any status message, such as "Waiting for your location…" (decided by the factory, no question asked)
- Q: Which interaction states does the control have? → A: the same hover and active look as the zoom buttons, plus a visible focus indicator; it is never disabled (decided by the factory, no question asked)
- Q: Is a reset announced to screen readers? → A: no; the map movement is the feedback, the button keeps its name and focus, and the status message is not changed (decided by the factory, no question asked)
- Q: Is a visible hint required for mouse users? → A: yes, a "Reset view" tooltip on hover (decided by the factory, no question asked)
- Q: Is there a time limit on "at startup" for the location? → A: no; the first successful fix of the page load sets the starting view whenever it arrives; later fixes never change it (decided by the factory, no question asked)
- Q: What does "next to the other map controls" mean? → A: in the same map corner as the zoom buttons, directly stacked with them (decided by the factory, no question asked)
- Q: How close is "within a few meters"? → A: within 5 meters of the starting center (decided by the factory, no question asked)
- Q: What is a "visible glitch"? → A: any flicker, blank map, zoom bounce or shift of the view when the map is already at the starting view (decided by the factory, no question asked)
- Q: What does the 1-second limit measure? → A: from the press until the map movement ends; loading of new map tiles is not included (decided by the factory, no question asked)
- Q: What is a "small screen"? → A: any viewport from 320 px wide; the button must fit from 320×568 up (decided by the factory, no question asked)
- Q: How does FR-007 apply when the search panel hides the zoom buttons? → A: the zoom buttons must be visible (not under the panel) and the reset button sits with them (decided by the factory, no question asked)
- Q: Can showing a destination before the location is known set the starting view? → A: no; only the app's automatic centering on the first location fix can replace the default view (decided by the factory, no question asked)
- Q: Do US1-4 and the late-location edge case describe the same rule? → A: yes; both mean the first location fix of the page load, whenever it arrives (decided by the factory, no question asked)
- Q: How is SC-005 judged? → A: the button is reachable with Tab and a single Enter or Space press resets the map (decided by the factory, no question asked)
- Q: Which accessible name is accepted? → A: exactly "Reset view" (decided by the factory, no question asked)
- Q: What do the acceptance scenarios expect exactly? → A: the starting center (per SC-002) and the exact starting zoom from FR-003 (decided by the factory, no question asked)
- Q: What happens on a press before the first location fix? → A: the map goes to the default view; when the fix arrives later, the app centers on it as usual and that becomes the starting view (decided by the factory, no question asked)
- Q: What happens on a press during a drag or pinch? → A: the map goes to the starting view; any movement the user makes after the press is normal panning or zooming (decided by the factory, no question asked)
- Q: Where is keyboard focus after activation? → A: it stays on the button (decided by the factory, no question asked)
- Q: Can double-click or double-tap on the button zoom the map? → A: no; presses on the button never reach the map, and two presses are just two resets (decided by the factory, no question asked)
- Q: What happens after a window resize or rotation? → A: the reset target stays the same center and zoom; no adjustment (decided by the factory, no question asked)
- Q: Which touch-target size and contrast are required? → A: at least 30×30 CSS px, and at least 3:1 contrast for the icon and border against their background (decided by the factory, no question asked)
- Q: How is reduced motion handled? → A: when the user prefers reduced motion, the map jumps instantly instead of animating (decided by the factory, no question asked)
- Q: Is a visible focus indicator required? → A: yes (decided by the factory, no question asked)
- Q: Is persisting the starting view out of scope? → A: yes; it is a requirement that it is never stored between page loads (decided by the factory, no question asked)
- Q: Which style does the button follow? → A: the Leaflet zoom buttons' style (white box, border, shadow, same size) (decided by the factory, no question asked)
- Q: If Reset view is pressed while routes are loading, the routes then arrive and the app zooms to fit them, undoing the reset. Must the reset last once the routes appear? → A: yes, a reset pressed while routes are loading wins. The routes are still drawn and listed when they arrive, but the map does not zoom to them. Any later route search zooms to its routes as usual.
- Q: The search panel covers the top-left corner where the zoom buttons are today. Where do the zoom buttons and Reset view go? → A: the zoom buttons move to the bottom-right corner, Reset view sits directly above them and the map credits stay below, on desktop and mobile.
- Q: What does the button show? → A: a square button the same size as the zoom buttons, with a home icon (⌂), the tooltip "Reset view" on hover, and "Reset view" as the name read by screen readers.
- Q: When does "while routes are loading" (FR-011) start and end? → A: from the moment a route search starts computing (status "Computing … routes…") until its routes are drawn, or until it ends with an error, "No … route found", or is replaced by a newer search (decided by the factory, no question asked)
- Q: Does a reset pressed while a destination is "Waiting for your location…" block a later route zoom? → A: no; no routes are loading then (the app computes no route by itself when the fix arrives), so FR-011 does not apply; the next route search the user starts zooms to its routes as usual (decided by the factory, no question asked)
- Q: Does a travel-mode change after a reset count as a later route search under FR-011? → A: yes; changing the travel mode starts a new route search, and its routes zoom the map as usual (decided by the factory, no question asked)
- Q: Does the placement rule cover small heights and landscape? → A: yes; FR-007 applies to every viewport at least 320 px wide and 320 px high, in portrait and landscape (e.g. 568×320) (decided by the factory, no question asked)
- Q: Must the moved zoom buttons keep their behavior? → A: yes; they keep their behavior, accessible names, tooltips and keyboard use, only their corner changes (decided by the factory, no question asked)
- Q: FR-001 says "same size as the zoom buttons" and FR-009 "at least 30×30 px": which wins? → A: FR-009 wins: the button is never smaller than 30×30 CSS px; with Leaflet 1.9.4 in the target browsers the zoom buttons also render at 30×30, so both hold (decided by the factory, no question asked)
- Q: Is it deliberate that a reset during route loading beats the route zoom, but a reset before the first fix is overridden when the app centers on that fix? → A: yes; the first-fix centering is the startup view itself (it becomes the reset target), while the route zoom is a reaction to a user search that the reset supersedes (decided by the factory, no question asked)
- Q: Which tolerance is the acceptance bar for the reset center? → A: SC-002 (within 5 meters); the contract's floating-point tolerance is stricter and satisfies it (decided by the factory, no question asked)
- Q: Does a correction smaller than 5 m count as a "shift of the view" in FR-008? → A: a shift is any visible movement of more than 1 CSS px; smaller corrections do not count (decided by the factory, no question asked)
- Q: Which list of unchanged state is the reference? → A: FR-005; SC-004 and the contract's guarantees are subsets of it (decided by the factory, no question asked)
- Q: Does the internal marker that makes a reset win over loading routes break FR-005? → A: no; FR-005 covers state the user can see or set; internal bookkeeping needed for FR-011 is allowed (decided by the factory, no question asked)
- Q: Does reduced motion (FR-010) apply to other map moves? → A: no; only to the reset; the startup centering and the route zoom keep their current behavior (decided by the factory, no question asked)
- Q: When is the reduced-motion preference read? → A: at each press, so a change made during the session applies to the next reset (decided by the factory, no question asked)
- Q: How is the ⌂ icon drawn, so contrast can be checked the same way everywhere? → A: as the text glyph ⌂ at the zoom buttons' glyph size, in #333 or darker on the white button; contrast is judged on the colour values, not the font shape (decided by the factory, no question asked)
- Q: How exactly are the bottom-right controls stacked? → A: top to bottom: Reset view (its own bordered group), zoom in/out, map credits, with Leaflet's standard spacing between controls (decided by the factory, no question asked)
- Q: What happens if the starting view's map tiles fail to load (e.g. offline)? → A: out of scope; the reset still sets the center and zoom, and missing tiles behave as they do today (decided by the factory, no question asked)
- Q: Is the README update in the plan a requirement? → A: no; it is documentation only, not judged as a spec requirement (decided by the factory, no question asked)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return to the starting view in one click (Priority: P1)

A user has panned and zoomed the map away from where it started (for example, while exploring a route or browsing another area) and wants to get back to where they began. They press a "Reset view" button on the map, and the map returns to the position and zoom level it had when it started.

**Why this priority**: This is the whole feature. Without it, users have to pan and zoom back by hand, which is slow and imprecise, especially on touch devices.

**Independent Test**: Open the app, note the initial map view, pan and zoom elsewhere, press "Reset view", and check that the map shows the same center and zoom level as at the start.

**Acceptance Scenarios**:

1. **Given** the map has been panned and zoomed away from its starting view, **When** the user presses "Reset view", **Then** the map shows the starting center (within 5 meters, SC-002) and exactly the starting zoom level (FR-003).
2. **Given** the map is already at its starting view, **When** the user presses "Reset view", **Then** the view stays the same and no error appears.
3. **Given** the user has searched for a place and routes are displayed, **When** the user presses "Reset view", **Then** the map returns to the starting view and the search results, selected destination, routes and route selection all stay as they were.
4. **Given** the user's location was found during the page load (whenever the first fix arrived) and the map centered on it, **When** the user later presses "Reset view", **Then** the map returns to that first location-centered view, not to the generic default area.
5. **Given** the user's location was not available when the app opened, **When** the user presses "Reset view", **Then** the map returns to the default starting area and zoom.

---

### User Story 2 - Find and use the button with any input method (Priority: P2)

A user who navigates with a keyboard or screen reader, or on a touch device, can find the "Reset view" control, understand what it does, and activate it.

**Why this priority**: The button must be usable by everyone, but this story only refines how the main capability is presented.

**Independent Test**: Tab to the button with the keyboard, check that its name is announced as "Reset view", activate it with Enter or Space, and check that the map resets. Repeat with a tap on a touch screen.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the map, **Then** the "Reset view" button is visible on the map next to the other map controls and does not cover the search panel.
2. **Given** keyboard focus is on the button, **When** the user presses Enter or Space, **Then** the map resets to its starting view.
3. **Given** a screen reader is in use, **When** the button gets focus, **Then** its accessible name is "Reset view".

---

### Edge Cases

- **Location arrives after the user has already moved the map**: the starting view is the first view the app set on its own at startup (the default view, then replaced by the first location-centered view when the location arrives). Later updates to the user's live position do not change the starting view.
- **Location permission denied or geolocation unsupported**: the starting view is the default view.
- **Button pressed during an animation or while routes are loading**: the map still goes to the starting view; route loading continues unaffected. The reset wins: when those routes arrive they are drawn and listed, but the map does not zoom to fit them (FR-011). Any later route search zooms to its routes as usual.
- **Button pressed repeatedly**: each press brings the map to the same starting view; nothing builds up or drifts.
- **Small screens** (any viewport from 320 px wide): the button stays visible and tappable and does not overlap the search panel or the zoom controls.
- **Button pressed before the first location fix**: the map goes to the default view; when the fix arrives later, the app centers on it as usual and that becomes the starting view.
- **Button pressed during a drag or pinch**: the map goes to the starting view; movement after the press is normal panning or zooming.
- **Double-click or double-tap on the button**: two resets; the map itself does not zoom.
- **Window resized or device rotated**: the reset target keeps the same center and zoom.
- **Location fix arriving while routes load**: cannot happen; routes are only computed once the location is known.
- **Pressed while a destination waits for the location**: no routes are loading, so FR-011 does not apply; the next route search the user starts zooms to its routes.
- **Map tiles fail to load at the starting view**: out of scope; the reset still sets center and zoom, missing tiles behave as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST show a "Reset view" control whenever the map is displayed: a square button the same size as the zoom buttons, showing a home icon (⌂) with no visible text, whose accessible name is "Reset view". It MUST show a "Reset view" tooltip on hover, MUST use the same hover/active look as the zoom buttons, and is never disabled. The icon is the text glyph ⌂ at the zoom buttons' glyph size, in #333 or darker. Where "same size as the zoom buttons" and FR-009 differ, FR-009 wins.
- **FR-002**: Activating the control MUST set the map center and zoom level to the starting view.
- **FR-003**: The starting view MUST be the view the app shows on its own at startup: the default area (central Paris) at zoom 13, replaced by the first successful location fix of the page load at zoom 15 when that fix arrives, with no time limit and even after an earlier location error. If no fix ever succeeds, it stays the default view. It MUST NOT follow the user's current location afterward.
- **FR-004**: The starting view MUST be recorded once per page load and MUST NOT change when the user pans, zooms, searches, selects a route, or when the live position updates afterward. Showing a destination before the location is known does not set it. It MUST NOT be stored between page loads.
- **FR-005**: Activating the control MUST NOT change any other app state: search input, search results, chosen destination, displayed routes, selected route, travel mode, pleasure indicators, status messages (including "Waiting for your location…"), the destination marker, and the user's position marker stay as they were. Only the map center and zoom change. FR-005 is the reference list of unchanged state (SC-004 and the contract are subsets); internal bookkeeping needed for FR-011 is not app state.
- **FR-006**: The control MUST work with mouse, touch, and keyboard (Enter and Space), MUST have the accessible name "Reset view", MUST show a visible focus indicator, and keyboard focus MUST stay on the button after activation. No extra screen-reader announcement is made. Presses on the control MUST NOT reach the map (a double-click or double-tap on it never zooms the map).
- **FR-007**: The zoom buttons MUST move from the top-left to the bottom-right corner of the map, and the control MUST be placed directly above them, with the map credits (attribution) below, on desktop and mobile. It MUST NOT overlap the search/route panel at any viewport from 320 px wide. The zoom buttons themselves MUST be visible (not under the panel). This applies to every viewport at least 320 px wide and 320 px high, in portrait and landscape. Top to bottom the corner shows Reset view (its own bordered group), the zoom buttons, then the map credits, with Leaflet's standard spacing. The moved zoom buttons keep their behavior, accessible names, tooltips and keyboard use.
- **FR-008**: Activating the control when the map is already at the starting view MUST NOT cause an error or a visible glitch (no flicker, blank map, zoom bounce, or shift of the view). A shift is any visible movement of more than 1 CSS px.
- **FR-009**: The control MUST be at least 30×30 CSS px, and its icon and border MUST have at least 3:1 contrast against their background.
- **FR-010**: When the user prefers reduced motion, the reset MUST move the map instantly, without animation. This applies only to the reset, and the preference is read at each press.
- **FR-011**: If the control is pressed while routes are loading, the map MUST stay on the starting view when those routes arrive: they are drawn and listed, but the map does not zoom to fit them. Routes from any route search started after the press zoom the map to fit them as usual. "Routes are loading" means from the moment a route search starts computing until its routes are drawn, it fails, finds no route, or is replaced by a newer search. A destination waiting for the user's location is not loading. A travel-mode change starts a new route search.

### Key Entities

- **Starting view**: the map center (latitude/longitude) and zoom level the app first shows by itself at startup. Recorded once per page load; used as the reset target.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned or zoomed state, a user gets back to the starting view in one action (one click, tap, or key press).
- **SC-002**: After a reset, the map center matches the starting center within 5 meters and the zoom level matches exactly, in 100% of attempts. This is the acceptance bar; stricter implementation tolerances satisfy it.
- **SC-003**: The map finishes moving to the starting view within 1 second of the button being pressed (measured until the map movement ends; loading of new map tiles is not included).
- **SC-004**: In 100% of resets, search results, routes, route selection, and travel mode are unchanged afterward.
- **SC-005**: Keyboard-only and screen-reader users can find and use the control without a mouse: it is reachable with Tab and one Enter or Space press resets the map.

## Assumptions

- "Starting position and zoom" means the view the map settles on at startup without user input (confirmed in Clarifications, Session 2026-11-10): the default area (currently central Paris, zoom 13) or, if the location is found, the location-centered view (zoom 15). If the location arrives after a delay, the first location-centered view replaces the default as the starting view.
- Reset only moves the map. It does not clear the search, routes, or selection; users who want to start over can still start a new search.
- The button follows the visual style of the Leaflet zoom buttons (white box, border, shadow, same size). No new settings or preferences are added.
- The starting view is not saved between sessions; each page load records its own (now also required by FR-004).
- A short smooth transition or an instant jump are both fine, as long as SC-003 is met.
- The README line mentioned in the plan is documentation only, not a requirement.
