# Feature Specification: Beautiful Mouse Pointer

**Feature Branch**: `factory/sf-91-beautiful-mouse`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Beautiful mouse — I want a more beautiful mouse"

## User Scenarios & Testing *(mandatory)*

Over the map, Barnacle Maps currently shows the map library's default pointer: a generic open hand. This feature replaces it with the Barnacle map cursor, the standard pointer of all Barnacle maps: a blue ring with a blue centre dot and a white edge. The ring's centre is the exact spot a click targets, so it also shows the user where an "Add stop here" click will land. Where a different action is available (dragging the map, clicking a route, a marker or a button), the familiar standard pointers stay, so the user still sees what a click will do.

### User Story 1 - The Barnacle map cursor over the map (Priority: P1)

A desktop user moves the mouse over the map and sees the Barnacle map cursor (blue ring, blue centre dot, white edge) instead of the open hand. When they click, the "Add stop here" popup opens at the centre of the ring.

**Why this priority**: The map covers almost the whole screen, so this is the pointer the user sees most of the time. It delivers the "more beautiful mouse" on its own.

**Independent Test**: Open the app on a desktop browser and move the mouse over an empty part of the map: the pointer is the blue ring with a dot. Click a street corner: the popup's tip points at the spot that was under the ring's centre.

**Acceptance Scenarios**:

1. **Given** the app is open on a device with a mouse, **When** the user moves the pointer over an empty part of the map, **Then** the pointer is a blue ring with a blue centre dot and a white edge, and not an open hand or an arrow.
2. **Given** the Barnacle map cursor is shown over the map, **When** the user clicks without moving the mouse, **Then** the "Add stop here" popup opens with its tip at the spot under the centre of the ring (within 2 screen pixels).
3. **Given** the Barnacle map cursor is shown, **When** the user moves it over a light street area, a green park and a dark or blue area (water) of the map, **Then** on each of them the blue ring and its white edge are both visible.
4. **Given** the Barnacle map cursor is shown, **When** the user zooms with the mouse wheel, **Then** the pointer is still the blue ring with a dot.

---

### User Story 2 - Standard pointers where a click does something else (Priority: P2)

While the user drags the map, or hovers something on the map that a click selects or opens, the pointer changes to the familiar standard pointer for that action. The side panel keeps its current pointers.

**Why this priority**: It keeps the pointer meaningful: the ring means "click the map here", and the hand means "this item is clickable". It depends on Story 1 being in place.

**Independent Test**: Press and drag the map, then hover a route line, a marker, the "Add stop here" button and the zoom buttons, then hover the side panel: each shows the standard pointer listed below, never the ring.

**Acceptance Scenarios**:

1. **Given** the Barnacle map cursor is shown over the map, **When** the user presses the mouse button and drags, **Then** the pointer is a closed (grabbing) hand during the whole drag, and is the blue ring again after the user releases the button.
2. **Given** routes are displayed on the map, **When** the pointer moves over a route line, **Then** the pointer is a pointing hand; **When** it moves off the line onto the empty map, **Then** it is the blue ring again.
3. **Given** a destination marker, a stop marker and the user's position dot are displayed, **When** the pointer moves over each of them, **Then** the pointer is a pointing hand.
4. **Given** the "Add stop here" popup is open, **When** the pointer moves over the "Add stop here" button, **Then** the pointer is a pointing hand.
5. **Given** the map is shown, **When** the pointer moves over the zoom "+" and "−" buttons, **Then** the pointer is a pointing hand.
6. **Given** the side panel is shown, **When** the pointer moves over the search box, **Then** it is a text cursor (I-beam); **When** it moves over a search result or a route option, **Then** it is a pointing hand; in no part of the panel is the pointer the blue ring.

---

### Edge Cases

- The cursor image cannot load (for example, it is blocked): over the map the pointer is a thin crosshair (+), not the open hand. Clicking the map still opens the "Add stop here" popup at the crosshair's centre.
- Touch-only device (phone, tablet): no pointer is shown. Tapping the map still opens the "Add stop here" popup, and dragging with a finger still moves the map.
- The pointer is over the white area of an open popup, away from its button: the pointer is a standard arrow, not the blue ring.
- The pointer is over the map attribution link ("Leaflet" / "OpenStreetMap") in the bottom corner: the pointer is a pointing hand, not the blue ring.
- Keyboard use: moving through the panel with Tab shows the same focus outlines as before, and Enter on a route option still selects that route.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Over the map, when the pointer is not over anything clickable, the app MUST show the Barnacle map cursor: a blue ring with a blue centre dot and a white edge, about the size of a standard pointer.
- **FR-002**: The click point of the Barnacle map cursor MUST be the centre of the ring (within 2 screen pixels).
- **FR-003**: The Barnacle map cursor MUST be stored with the app and MUST NOT be loaded from another site.
- **FR-004**: If the Barnacle map cursor cannot be shown, the pointer over the map MUST be a crosshair, and clicking the map MUST work as before.
- **FR-005**: While the user drags the map, the pointer MUST be the closed (grabbing) hand.
- **FR-006**: Over items on the map that a click selects or opens (route lines, the destination marker, stop markers, the user's position dot, buttons in popups, zoom buttons, links), the pointer MUST be the pointing hand.
- **FR-007**: The side panel's pointers MUST NOT change: a text cursor in the search box and the current pointers on its controls.
- **FR-008**: The change MUST NOT alter any other behaviour: searching, choosing routes, adding/reordering/removing stops, travel modes, the pleasure indicator, keyboard use and touch interaction work exactly as before.

### Key Entities

- **Barnacle map cursor**: the standard map pointer of Barnacle web apps. A blue ring with a blue centre dot and a white edge; its click point is the centre of the ring.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a desktop browser, the open hand never shows over the map: the empty map shows the blue ring, dragging shows the closed hand, and clickable items show the pointing hand.
- **SC-002**: In 10 out of 10 test clicks on precise map features (street corners), the "Add stop here" popup opens within 2 screen pixels of the ring's centre.
- **SC-003**: The blue ring and its white edge are both visible on a light street area, a green park and a dark or blue area (water) in a screenshot of each.
- **SC-004**: All existing automated tests still pass, and search, route choice, stops and travel modes work as before.
- **SC-005**: When the cursor image is blocked, the app is still fully usable and shows a crosshair over the map.

## Assumptions

- "Mouse" means the on-screen mouse pointer over the Barnacle Maps map, not a mouse character, a map marker or a physical device.
- The look follows the factory's standard for map pointers (blueprint `ui/map-cursor@1`): the Barnacle map cursor, in its exact shape and colours. The issue does not ask for another look, so no other design was considered.
- Only the pointer over the map changes. The side panel and the pointers for dragging and for clickable items stay the standard ones.
- Animated pointers, pointer trails and user-selectable pointer themes are out of scope.
- Touch-only devices are out of scope, because they show no pointer.
- The feature adds no new external service or dependency; the app stays as simple to run as it is today.
- Target browsers are the desktop browsers the app already supports (recent Chrome, Firefox, Safari, Edge).
