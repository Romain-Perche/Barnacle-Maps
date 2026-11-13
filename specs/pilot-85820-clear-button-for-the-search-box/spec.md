# Feature Specification: Clear button for the search box

**Feature Branch**: `factory/pilot-85820-clear-button-for-the-search-box`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "When I have typed a place in the search box, show a small clear button (×) inside the box that empties it and hides the result list, so I do not have to delete the text by hand."

## Clarifications

### Session 2026-11-13

- Q: Which design do you want for the clear button (×)? → A: Design: A, plain grey × inside the box on its right edge (see design-options.html).
- Q: After you choose a destination, what does the × clear? → A: Only the search text and the result list; the destination, routes and stops stay.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear the search text in one tap (Priority: P1)

A user has typed (part of) a place name in the search box and sees suggested results. They change their mind or made a typo, so they tap the small × inside the search box. The text disappears, the result list disappears, and the box is ready for a new search.

**Why this priority**: This is the whole feature — removing the need to delete text by hand, which is especially tedious on a phone.

**Independent Test**: Type a place name, wait for suggestions, tap ×. The box is empty, no results are listed, and typing immediately starts a new search.

**Acceptance Scenarios**:

1. **Given** the search box is empty, **When** the page is shown, **Then** no clear button is visible.
2. **Given** the search box is empty, **When** the user types at least one character, **Then** a clear button (×) appears inside the search box.
3. **Given** the search box contains text and suggested results are listed, **When** the user activates the clear button, **Then** the search box becomes empty, the result list is hidden/emptied, and the clear button disappears.
4. **Given** the user has just activated the clear button, **When** they start typing, **Then** the text goes into the search box without them having to tap it first (focus is in the search box).
5. **Given** the search box contains text, **When** the user deletes all text by hand, **Then** the clear button disappears.

---

### User Story 2 - Clear the box after choosing a destination (Priority: P2)

After picking a destination, the search box shows the destination's name. The user wants to search for another place (e.g. to add it as a stop) and taps × to start fresh, without losing the routes already shown.

**Why this priority**: Common follow-up flow, but secondary to basic clearing.

**Independent Test**: Pick a destination so routes are shown, tap ×; the box empties while the destination marker, routes and stops remain.

**Acceptance Scenarios**:

1. **Given** a destination has been chosen and its name fills the search box, **When** the page shows it, **Then** the clear button is visible.
2. **Given** a destination with routes is shown, **When** the user activates the clear button, **Then** the search box is emptied but the destination, the displayed routes, the selected route, and the stops list are unchanged.

---

### User Story 3 - Keyboard and assistive-technology users can clear (Priority: P3)

A keyboard or screen-reader user can reach and activate the clear button and understands what it does.

**Why this priority**: Accessibility; the app already labels its controls for assistive technology.

**Independent Test**: Using only the keyboard, tab to the clear button and press Enter or Space; a screen reader announces it as a button named "Clear search".

**Acceptance Scenarios**:

1. **Given** the clear button is visible, **When** the user tabs through the panel, **Then** the clear button can receive focus and be activated with Enter or Space.
2. **Given** a screen reader is used, **When** the clear button receives focus, **Then** it is announced as a button with an accessible name such as "Clear search".

---

### Edge Cases

- A suggestion search is still pending (typed text waiting for the typing pause, or a request in flight) when the user clears: the late results MUST NOT reappear after clearing.
- A "Searching…", "No results." or "Search failed" message is shown when the user clears: the message is cleared too, since it relates to the text that was removed.
- The search box contains only spaces: the clear button is shown (the box is not visually empty) and clearing empties it.
- Long text in the search box: the text does not run underneath the clear button; the button stays visible and tappable.
- Some browsers display their own built-in clear control in search fields: the user MUST see only one clear control, which behaves as specified here.
- Clearing while no results are listed simply empties the box; nothing else changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The search box MUST show a small, plain grey clear button (×) inside the box, on its right edge (Design A in design-options.html), whenever the box contains any text, and MUST hide it whenever the box is empty.
- **FR-002**: The clear button's visibility MUST update on every change to the box's content, whether from typing, deleting, pasting, or the app filling it in (e.g. with the chosen destination's name or emptying it after "Add as stop").
- **FR-003**: Activating the clear button MUST empty the search box.
- **FR-004**: Activating the clear button MUST hide/empty the search result list.
- **FR-005**: Activating the clear button MUST cancel any pending or in-flight suggestion search so that its results are never shown afterwards.
- **FR-006**: Activating the clear button MUST clear any search-related status message (e.g. "Searching…", "No results.", "Search failed: …").
- **FR-007**: After clearing, keyboard focus MUST be in the search box so the user can type a new search immediately.
- **FR-008**: Activating the clear button MUST NOT submit a search, and MUST NOT change the chosen destination, the displayed routes, the selected route, the stops, or the travel mode.
- **FR-009**: The clear button MUST be operable by mouse, touch, and keyboard (Enter/Space), and MUST have an accessible name ("Clear search").
- **FR-010**: The clear button MUST be large enough to tap comfortably on a phone (at least about 24×24 CSS pixels of tappable area) while looking small inside the box.
- **FR-011**: Only one clear control MUST be visible in the search box; any built-in browser clear control MUST NOT appear alongside it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can empty a search box containing any amount of text with a single tap or click (previously one keystroke per character).
- **SC-002**: In 100% of tested cases, after clearing, the result list is empty and stays empty until the user types again, even when a suggestion was pending at the moment of clearing.
- **SC-003**: In 100% of tested cases, clearing the box leaves the destination, routes and stops exactly as they were.
- **SC-004**: A keyboard-only user can reach and activate the clear button, and a screen reader announces it as "Clear search".
- **SC-005**: Exactly one clear control is visible in the search box in current versions of the major browsers (Chrome, Firefox, Safari, Edge).

## Assumptions

- "Clear" affects only the search text, the result list, and the search status message; the destination, routes and stops are kept (confirmed in Clarifications). Removing the destination is out of scope.
- The clear button appears for any non-empty content (including text shorter than the minimum length that triggers suggestions).
- No keyboard shortcut (such as Escape) is added; that is out of scope for this feature.
- The × follows Design A (plain grey ×, matching the panel's plain controls); no new icons or assets are required.
- The feature works within the existing single-page app with no new external services.
