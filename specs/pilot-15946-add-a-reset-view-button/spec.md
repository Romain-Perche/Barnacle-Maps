# Feature Specification: Reset View Button

**Feature Branch**: `factory/pilot-15946-add-a-reset-view-button`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Add a Reset view button — Add a button on the map that puts the map back to its starting position and zoom."

## Clarifications

> **Precedence**: the answers below are kept in the order they were given. Where an earlier answer and a requirement disagree, the Functional Requirements, Success Criteria and Assumptions sections take precedence; superseded answers are marked "(replaced: …)".

### Session 2026-11-10

- Q: When someone presses "Reset view", which view should the map go back to? → A: The first view the app settled on: the user's location at the closer zoom if location was found, otherwise the default view (central Paris at the city-wide zoom). Not the user's current position as they move.

- Q: What are the default starting center and zoom, as numbers? → A: Latitude 48.8566, longitude 2.3522, zoom 13 (the values the app already uses).
- Q: What zoom level is the "closer zoom" of the location-based starting view? → A: Zoom 15, the level the app already uses to auto-center.
- Q: What visual states does the button have? → A: Default white like the Leaflet controls; hover light grey (#f4f4f4); keyboard focus shows a visible 2px blue (#1a73e8) outline; no separate pressed state.
- Q: Does the button change when the map is already at the starting view? → A: No. It is always enabled and always looks the same; pressing it at the starting view does nothing.
- Q: Where does keyboard focus go after a reset? → A: It stays on the Reset view button.
- Q: What happens to an open destination popup on reset? → A: It stays open. Reset only moves the view, so the popup may end up off-screen.
- Q: Is a reset announced to screen reader users? → A: No extra announcement; the status line stays untouched (FR-005). The button's name says what it does.
- Q: What does "clearly labeled" mean for the button? → A: The button shows a ⟲ icon the same size as the zoom buttons, with the accessible name "Reset view" and the tooltip "Reset view". (replaced: see FR-001, inline SVG ~22px; button 44×44)
- Q: Which is required, the tooltip or the label? → A: Both the accessible name and the hover tooltip. On touch screens users rely on the icon; this is an accepted limitation.
- Q: What does "visible at all times" mean when the panel is tall or the screen is short? → A: The panel's height is capped so the bottom of the map (at least 72px) stays free, and the panel scrolls inside. The button sits bottom-right, above the attribution. (replaced: see FR-012, 96px)
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
- Q: Is the dependency on the app's one-time auto-centering documented? → A: Yes, as an assumption: the app auto-centers once, on the first location fix, at zoom 15; any change to that behavior changes the starting view too. (replaced: see Assumptions, FR-003 is the literal zoom 15)
- Q: Does "smooth or instant transition" fit SC-001's 1-second limit? → A: The transition may be smooth or instant but must finish within 1 s, so no long fly-to animation.
- Q: Does a reset leave the destination marker alone? → A: Yes. The destination marker is added to FR-005 and SC-003.
- Q: Can using the button also move the map? → A: No. Clicking, double-clicking or double-tapping the button, or scrolling the mouse wheel over it, never pans or zooms the map. Only the reset moves it.
- Q: How does the capped panel scroll? → A: With the mouse wheel, touch and keyboard. When keyboard focus moves to a result or route, the browser scrolls it into view. No other change.
- Q: What happens after a resize or rotation? → A: FR-008 and FR-012 still hold, with no reload. The starting view doesn't change.
- Q: What if the user's font can't draw the ⟲ symbol? → A: The icon is an inline SVG of a circular arrow instead of the ⟲ text character, so it always shows. Same look and size, no new dependency.
- Q: Does "the same size as the zoom buttons" mean the icon or the button? → A: The icon is the same size as the + and − symbols on the zoom buttons (about 22px). The button itself is 44×44 px per FR-011.
- Q: Against which background is the focus outline's 3:1 contrast measured? → A: The button's white background. The outline is drawn inside the button's edge (negative outline-offset), so it never sits on the tiles.
- Q: Must the icon contrast also hold on the hover background? → A: Yes, at least 3:1 on both white and #f4f4f4. A black icon gives about 19:1.
- Q: Does the attribution count as "another map control" for the 8px gap? → A: Yes. Leaflet's normal 10px margin between stacked controls meets the rule.
- Q: Does SC-001's "end of the map's movement" include tile loading? → A: No. It ends when the map's pan or zoom animation finishes (Leaflet's `moveend`).
- Q: Is "at least 72px" the right floor for the free strip? → A: No. FR-012 now says at least 96px, matching the plan (research.md R3b).
- Q: How does SC-003 ("identical in 100% of cases") fit FR-014's late fit-to-routes? → A: SC-003 is measured with no route request in flight. The in-flight case is checked against FR-014 only.
- Q: How does "Leaflet control style" fit the 44×44 size? → A: The button has the same white box, border, corner radius and hover color as Leaflet's controls, but it is bigger (44×44) to meet FR-011.
- Q: Should `view.js` enforce the data model's value ranges? → A: Yes. It rejects lat outside −90..90, lng outside −180..180 and zoom outside 0..19 with `TypeError`, with a unit test.
- Q: Is the panel height cap in scope? → A: Yes, because the button can't stay visible without it (FR-001). The reset action itself still only moves the view.
- Q: Which success criterion covers FR-009, FR-011, FR-012 and FR-013? → A: A new SC-006.
- Q: On which device or browser is SC-001's 1 s measured? → A: Current Chrome desktop with DevTools CPU throttling at 4× slowdown, standing in for a mid-range phone.
- Q: Which other panel states does SC-005 test? → A: Also an error status message, and results with long place names that wrap to two lines.
- Q: What happens on a restore from the back/forward cache? → A: The page keeps the starting view it had. Only a real reload starts over.
- Q: What about a very distant first fix, or zoom 15 above the map's maximum? → A: Any valid first fix becomes the starting view, wherever it is. Zoom 15 is within the map's maximum of 19, so no clamping is needed.
- Q: Does a late first fix still move the map if the user already moved it or pressed Reset view? → A: Yes. The app still auto-centers on that first fix as it does today, and that view becomes the starting view.
- Q: What happens if the reset can't run? → A: The button is added only once the map exists, and the stored view is always valid (checked when set), so there is no expected failure. If an error happens anyway, it is logged to the console and the map stays where it is. Nothing is shown to the user.
- Q: What about a reset while a popup is opening or a marker is being added? → A: The reset only changes the view. The popup or marker ends up in its normal state; neither is cancelled or changed.
- Q: What about users who ask for reduced motion? → A: With `prefers-reduced-motion: reduce`, the reset is instant (no animation).
- Q: What about forced-colors or high-contrast modes? → A: The button uses system colors: the icon stays visible and the focus outline uses the system highlight color.
- Q: What about browser zoom or larger text? → A: At 200% browser zoom (WCAG 1.4.4 / 1.4.10), the button stays fully visible and usable, and the panel stays usable by scrolling inside. The 8px gap of FR-008 only applies at 100% zoom.
- Q: Is the English-only label intended? → A: Yes. The app's interface is in English only; translation is out of scope.
- Q: Should superseded clarification answers be marked? → A: Yes. They stay in place, with "(replaced: see …)" after them.
- Q: Does the data model's reset line match the contract? → A: It now points to the reset in contracts/reset-view-control.md §Behavior (`setView` with `animate: false` under reduced motion, inside try/catch).
- Q: Does the plan summary list all the state FR-005 protects? → A: It now says the reset touches nothing listed in FR-005.
- Q: Do the acceptance scenarios match the later FRs? → A: US2-AS2 also names the destination marker and an open popup; US3 gains AS3 (focus stays on the button after keyboard activation) and AS4 (hover shows the tooltip "Reset view").
- Q: Is FR-003's zoom 15 literal, or whatever the auto-center uses? → A: The literal zoom 15. If the app's auto-center zoom changes, FR-003 must be updated to match.
- Q: Does FR-010's "look the same" forbid hover and focus states? → A: No. Whether or not the map is at the starting view, the button is enabled and looks the same, apart from the FR-009 hover and focus states.
- Q: What does "usable" at 200% browser zoom mean? → A: The button is fully inside the map and doesn't intersect the panel or other controls (no minimum gap); it works with pointer and keyboard; all panel content can be reached by scrolling inside the panel.
- Q: What are the Leaflet control style values? → A: Leaflet 1.9.4's: background #fff, border 2px solid rgba(0,0,0,0.2), corner radius 4px.
- Q: Which system colors apply in forced-colors mode, and does the 3:1 rule hold there? → A: Background ButtonFace, icon ButtonText, focus outline Highlight. FR-013's 3:1 rule doesn't apply in this mode, because the user's theme sets the colors.
- Q: Where does focus go after a failed reset? → A: It stays on the button, as after a successful reset. The status line stays untouched (FR-005).
- Q: What is a "valid" first location fix? → A: Finite coordinates within lat −90..90 and lng −180..180. The fix's accuracy is ignored, as the app does today.
- Q: Do pointer presses that don't end in a click move the map? → A: No. No pointer press that starts on the button (drag, long-press, right-click, pinch) pans or zooms the map. The browser's own context menu may still appear.
- Q: Which requirement holds the starting-view validation? → A: A new FR-019: the stored starting view is always valid (lat −90..90, lng −180..180, zoom 0..19); invalid values are rejected and leave it unchanged.
- Q: What if Leaflet or the map fails to load? → A: Out of scope. With no map there is no button, as today.
- Q: Is a keyboard shortcut for Reset view in scope? → A: No, out of scope.
- Q: Which success criterion covers FR-014 to FR-018? → A: A new SC-007.
- Q: How is FR-018's failure path checked? → A: By code review: the reset is wrapped in try/catch with `console.error`.
- Q: Is the temporary `console.log` for SC-002 acceptable? → A: Yes, as a validation-only change that is never committed. The stored value is also covered by the `view.js` unit tests.
- Q: Should SC-006 reference quickstart H and I? → A: No. The reference is removed; the criterion is complete without it.
- Q: Which screen reader setup and result does SC-004's spot check use? → A: NVDA with Chrome or Firefox on Windows, or VoiceOver with Safari on macOS. The button is announced as "Reset view, button".
- Q: What if the first location fix arrives while the user is dragging or pinching? → A: The auto-center still runs, as it does today, and that view becomes the starting view.
- Q: Is FR-008's reliance on Leaflet's 10px margin recorded? → A: Yes, as an assumption tied to Leaflet 1.9.4's default CSS.
- Q: Where does the zoom range 0..19 come from? → A: The tile layer's `maxZoom`. If that changes, the data model's zoom range and FR-019 change with it.
- Q: Is the panel cap's dependency on the panel's 12px top offset recorded? → A: Yes, as an assumption: if the panel moves, the cap must change so the 96px free strip stays.
- Q: Are the repo conventions recorded in the spec? → A: Yes, as an assumption: no build step, no new dependencies, Leaflet loaded from the CDN, as today.
- Q: With about 80 clarification entries, which source wins when an early answer and a requirement differ? → A: The FRs, SCs and Assumptions take precedence; a note at the top of Clarifications says so (analyze A1).

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
2. **Given** the user's position marker is shown, **When** the user presses Reset view, **Then** the position marker remains visible at the user's current location, and the destination marker and any open popup stay as they were.

---

### User Story 3 - Accessible and discoverable control (Priority: P3)

A user navigating with a keyboard or screen reader can find and activate the Reset view button, and every user can understand what it does from its label or tooltip.

**Why this priority**: Ensures the control is usable by everyone, but the feature still delivers value for pointer users without it.

**Independent Test**: Tab to the button with the keyboard, confirm it has an accessible name of "Reset view", activate it with Enter or Space, and confirm the view resets.

**Acceptance Scenarios**:

1. **Given** keyboard focus is on the Reset view button, **When** the user presses Enter or Space, **Then** the map resets to its starting view.
2. **Given** a screen reader user reaches the button, **When** it is announced, **Then** it is identified as a button named "Reset view".
3. **Given** keyboard focus is on the Reset view button, **When** the user activates it with Enter or Space, **Then** focus stays on the button after the reset.
4. **Given** a pointer user, **When** they hover over the button, **Then** the tooltip "Reset view" is shown.

---

### Edge Cases

- If the user's location becomes available only after they have already moved the map, the starting view is the view the map was first centered on (the user's location), consistent with the app's existing one-time auto-centering behavior.
- If the first location fix arrives after the user has already moved the map or pressed Reset view, the app still auto-centers on it as it does today, and that view becomes the starting view.
- If the first location fix arrives while the user is dragging or pinching, the auto-center still runs, as it does today, and that view becomes the starting view.
- Any valid first location fix (finite coordinates within lat −90..90 and lng −180..180; its accuracy is ignored, as today) becomes the starting view, however far it is from Paris. Zoom 15 is within the map's maximum zoom (19), so no clamping is needed.
- If location access is denied or unavailable, the starting view is the app's default starting center and zoom.
- If location access is revoked or fails after the location starting view was set, the starting view stays that first location view until the page is reloaded. Allowing location again after denying it does not change the starting view either.
- Later updates to the user's position (as they move) do not change the starting view; Reset view returns to the original starting view, not the current position.
- Searching for a place or displaying routes moves the map but does not change the starting view.
- Pressing the button repeatedly or rapidly leaves the map at the starting view without errors.
- Pressing the button while the map is still moving (drag inertia, zoom or pan animation) interrupts that movement and ends at the starting view.
- Pressing the button while routes are still loading resets the view immediately and does not cancel the route request. When the routes arrive, the app fits the view to them as it does today; the user can press Reset view again.
- An open destination popup stays open after a reset, even if it ends up off-screen.
- A reset while a popup is opening or a marker is being added only changes the view; the popup or marker ends up in its normal state and neither is cancelled or changed.
- A restore from the browser's back/forward cache keeps the starting view the page had. Only a real reload starts over.
- After a resize or rotation (e.g. 375×667 → 667×375), FR-008 and FR-012 still hold with no reload, and the starting view doesn't change.
- If the reset throws anyway (not expected: the button exists only once the map does, and the stored view is validated when set), the error is logged to the console and the map stays where it is. Nothing is shown to the user.
- The button must remain visible and usable on small (mobile) screens (360×640, 375×667 and 667×375 landscape) and must not be hidden behind the search/route panel or overlap the existing zoom controls (see FR-008, FR-012).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST display a "Reset view" button, visible at all times while the map is shown. The button shows a circular-arrow (⟲) icon drawn as an inline SVG (not a text character, so it always shows whatever the user's fonts), the same size as the + and − symbols on the zoom buttons (about 22px); the button itself is 44×44 px per FR-011. It has the accessible name "Reset view" and the tooltip "Reset view". It sits in the bottom-right corner of the map, above the attribution.
- **FR-002**: When the user activates the Reset view button, the system MUST return the map to its starting center position and starting zoom level. Clicking, double-clicking or double-tapping the button, or scrolling the mouse wheel over it, MUST NOT pan or zoom the map; only the reset moves it. No pointer press that starts on the button (drag, long-press, right-click, pinch) may pan or zoom the map; the browser's own context menu may still appear.
- **FR-003**: The starting view MUST be the app's default view at load (latitude 48.8566, longitude 2.3522, zoom 13), replaced once by the user's location at zoom 15 if and when the app first auto-centers on the user's location. "First auto-centers" means the first location fix received after the page loads; a real reload starts over, while a restore from the back/forward cache keeps the starting view the page had.
- **FR-004**: The starting view MUST NOT change due to subsequent position updates, searches, route display, or manual panning/zooming.
- **FR-005**: Activating Reset view MUST NOT clear or alter search input, search results, displayed routes, the selected route, the travel mode, status messages, the user's position marker, the destination marker, or open popups. No extra announcement is made: the status line stays untouched.
- **FR-006**: The Reset view button MUST be operable with mouse/touch and with the keyboard (focusable, activatable with Enter or Space). Keyboard focus stays on the button after a reset. The button keeps the page's natural tab order: map controls (zoom, Reset view, attribution links) first, then the search panel.
- **FR-007**: The Reset view button MUST have both the accessible name "Reset view" and the hover tooltip "Reset view". On touch screens, where tooltips don't show, users rely on the icon (accepted limitation).
- **FR-008**: The Reset view button's box MUST NOT intersect the search/route panel or any other map control, with at least 8px between them, at 360×640, 375×667, 667×375 (landscape) and 1280×800, with the panel showing 5 results, 3 routes, an error status message, or results with long place names that wrap to two lines. The attribution counts as a map control (Leaflet's 10px margin between stacked controls meets the gap). This also holds after a resize or rotation, with no reload. The 8px gap applies at 100% browser zoom.
- **FR-009**: The button's visual states MUST be: default like the Leaflet 1.9.4 controls (background #fff, border 2px solid rgba(0,0,0,0.2), corner radius 4px); hover light grey (#f4f4f4); keyboard focus a visible 2px blue (#1a73e8) outline. There is no separate pressed state.
- **FR-010**: Whether or not the map is at the starting view, the button MUST be enabled and look the same (apart from the FR-009 hover and focus states); pressing it at the starting view does nothing.
- **FR-011**: The button MUST be at least 44×44 CSS px.
- **FR-012**: The search/route panel's height MUST be capped so the bottom strip of the map that holds the button stays free (at least 96px, enough for the button, the attribution and the 8px gap of FR-008); the panel scrolls inside when its content is taller. The panel can be scrolled with the mouse wheel, touch and keyboard, and when keyboard focus moves to a result or route, the browser scrolls it into view. The cap also holds after a resize or rotation.
- **FR-013**: The button MUST meet WCAG 2.1 AA for non-text contrast: the icon has at least 3:1 contrast against both the default white and the hover #f4f4f4 background; the focus outline has at least 3:1 contrast against the button's white background and is drawn inside the button's edge (negative outline-offset), so it never sits on the map tiles; the focus outline is always visible on keyboard focus.
- **FR-014**: Activating Reset view while the map is moving MUST interrupt that movement and end at the starting view. Activating it while routes are loading MUST NOT cancel the route request; the later fit-to-routes still happens.
- **FR-015**: When the user has `prefers-reduced-motion: reduce` set, the reset MUST be instant (no animation).
- **FR-016**: In forced-colors (high-contrast) mode, the button MUST use system colors: background ButtonFace, icon ButtonText, focus outline Highlight. FR-013's 3:1 rule doesn't apply in this mode, because the user's theme sets the colors.
- **FR-017**: At 200% browser zoom (WCAG 1.4.4 / 1.4.10), the button MUST be fully inside the map and MUST NOT intersect the panel or other controls (no minimum gap); it MUST work with pointer and keyboard; all panel content MUST be reachable by scrolling inside the panel.
- **FR-018**: If the reset throws despite the validated starting view, the error MUST be logged to the console and the map MUST stay where it is; nothing is shown to the user. Keyboard focus stays on the button, and the status line stays untouched (FR-005).
- **FR-019**: The stored starting view MUST always be valid: lat −90..90, lng −180..180, zoom 0..19. Invalid values MUST be rejected and leave the starting view unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any panned/zoomed state, users return to the starting view with a single action, in under 1 second measured from pressing the button to the end of the map's pan or zoom animation (Leaflet's `moveend`; tile loading excluded), in current Chrome desktop with DevTools CPU throttling at 4× slowdown.
- **SC-002**: In 100% of tested cases, after Reset view the map's center and zoom match the starting view: the zoom is equal and the center is within 0.000001° of latitude and longitude.
- **SC-003**: In 100% of tested cases, the search input, search results, displayed routes, selected route, travel mode, status messages, the user's position marker, the destination marker and open popups are identical before and after Reset view, measured with no route request in flight (the in-flight case is checked against FR-014 only).
- **SC-004**: The button can be reached and activated using only the keyboard, and the browser's accessibility tree shows role "button" and name "Reset view" (plus one spot check with NVDA with Chrome or Firefox on Windows, or VoiceOver with Safari on macOS, where the button is announced as "Reset view, button").
- **SC-005**: At the viewport sizes and panel states listed in FR-008 (including an error status message and long wrapping place names), the button is fully visible and overlaps nothing.
- **SC-006**: At the FR-008 viewport sizes, the button is at least 44×44 px, shows the FR-009 states, meets FR-013's 3:1 contrast, and the panel never enters the bottom free strip of FR-012.
- **SC-007**: A reset during movement ends at the starting view, and routes in flight still load and fit. Under reduced motion the reset has no animation. In forced-colors mode the icon and focus ring are visible. At 200% zoom the button is fully visible and works. No console errors are logged during any reset. FR-018's failure path can't be triggered in normal use, so it is checked by code review: the reset is wrapped in try/catch with `console.error`.

## Assumptions

- "Starting position and zoom" means the view the map settled on when the app started: the default starting view, or — if the app auto-centered on the user's location — that location view at the zoom used for auto-centering. This matches what the user saw at startup (confirmed in Clarifications, 2026-11-10).
- The reset applies only to the map view; it does not reset the application state (searches, routes, travel mode).
- The button is placed in the bottom-right corner of the map, above the attribution (the panel covers the top-left zoom control). It has the same white box, border, corner radius and hover color as Leaflet's controls, but is bigger (44×44) to meet FR-011.
- A smooth or instant transition to the starting view are both acceptable, but it must finish within SC-001's 1 second, so no long fly-to animation.
- The app auto-centers once, on the first location fix, at zoom 15. If the app's auto-center zoom changes, FR-003 must be updated to match.
- Capping the panel's height (FR-012) is in scope, because the button can't stay visible without it (FR-001). The reset action itself still only moves the view.
- The app's interface is in English only; translating the "Reset view" label is out of scope.
- No persistence is needed: the starting view is determined fresh on each app load.
- If Leaflet or the map fails to load (e.g. the CDN is unreachable), that is out of scope: with no map there is no button, as today.
- A keyboard shortcut for Reset view (other than tabbing to the button) is out of scope.
- Checking SC-002 may use a temporary `console.log` in the reset handler; this is a validation-only change that is never committed. The stored value is also covered by the `view.js` unit tests.
- FR-008's gap relies on Leaflet 1.9.4's default 10px control margin. A Leaflet upgrade or a CSS override means FR-008 must be checked again.
- The zoom range 0..19 comes from the tile layer's `maxZoom`. If that changes, the data model's zoom range and FR-019 change with it.
- The panel height cap assumes the panel sits 12px from the top of the map. If the panel moves, the cap must change so the 96px free strip of FR-012 stays.
- Repo conventions: no build step, no new dependencies, and Leaflet is loaded from the CDN, as today.
