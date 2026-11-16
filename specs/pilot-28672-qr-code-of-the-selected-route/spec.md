# Feature Specification: QR Code of the Selected Route

**Feature Branch**: `factory/pilot-28672-qr-code-of-the-selected-route`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "When I pick a route, show a QR code next to the route summary that opens the same route on my phone (a link with the start, the destination and the travel mode), so I can continue on my phone. Use a well-known QR code library; do not write the QR encoding by hand."

## Clarifications

### Session 2026-11-16

- Q: Which page should the QR code open on the phone? → A: OpenStreetMap directions page (same routing service as the app; stops are not carried).
- Q: Which design? → A: Design: A, QR card under the route summary, always visible while routes are shown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Continue the selected route on my phone (Priority: P1)

I am planning a trip on my computer. After choosing a destination, the panel shows the routes. Next to the route summary I see a QR code. I scan it with my phone's camera, and my phone opens a map with directions from the same start to the same destination with the same travel mode (walking or car), so I can follow the route on the go.

**Why this priority**: This is the whole feature: handing the planned trip over from the computer to the phone without retyping anything.

**Independent Test**: With a known position and destination, pick a route; scan the displayed QR code (or decode it) and check that the link it contains opens directions with the same start, destination and travel mode.

**Acceptance Scenarios**:

1. **Given** my position is known and I searched a destination in walking mode, **When** the routes are displayed, **Then** a QR code appears next to the route summary and it encodes a link containing my start position, the destination position and the walking mode.
2. **Given** routes are displayed with a QR code, **When** I scan it with a phone, **Then** the phone opens directions from the same start to the same destination with the same travel mode.
3. **Given** routes are displayed, **When** I pick another route (in the panel or on the map), **Then** a QR code is still shown next to the route summary for the selected route.

---

### User Story 2 - QR code follows my changes (Priority: P2)

When I change the travel mode or the destination, the QR code is updated so it never points to an outdated trip.

**Why this priority**: A stale QR code would send the phone to the wrong trip, which is worse than no QR code.

**Independent Test**: Display routes, note the QR link, switch from walking to car (or choose another destination) and check the new QR link reflects the change.

**Acceptance Scenarios**:

1. **Given** a QR code for a walking trip is shown, **When** I switch to car, **Then** once the car routes are displayed the QR code encodes the car mode.
2. **Given** a QR code is shown, **When** I choose another destination, **Then** the old QR code disappears while routes are recomputed and the new QR code encodes the new destination.
3. **Given** a QR code is shown, **When** routes are being recomputed, fail, or no route is found, **Then** no QR code is shown.

---

### Edge Cases

- No destination chosen, or position not known yet: no QR code is shown (there is no route to share).
- Routing fails or no route is found: no QR code is shown.
- The user's live position keeps moving: the QR code uses the start position used for the routes currently displayed, and is only refreshed when the routes are recomputed.
- Journey with stops: the link only carries the start, the destination and the travel mode (as requested); the phone shows the direct trip, not the stops. A short note next to the QR code says that stops are not included.
- The phone's directions may show a different alternative than the one picked on the computer (the link carries the start, destination and mode, not the exact alternative). This is accepted.
- The QR code library fails to load (e.g. offline): the rest of the app keeps working; the QR area is simply not shown.
- Small screens: the QR code must not hide the route list or the map controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When routes are displayed and a route is selected, the system MUST show a QR card in the panel, directly under the route summary (Design A in `design-options.html`): stacked from top to bottom: the title "Continue on your phone", the line "Scan with your phone camera.", a QR code of 245 × 245 CSS pixels, the full phone link as plain selectable text, and the link "Open on your phone", separated from the summary by a thin line. (Fix round 1: the code was enlarged from about 120 px, and the link text was added, after review.)
- **FR-002**: The QR code MUST encode a link to the public OpenStreetMap website's directions page that opens directions from the start position to the destination with the current travel mode (walking or car, using the same routing service as the app), on any phone browser, without any account or installation.
- **FR-003**: The start in the link MUST be the user's position used to compute the displayed routes; the destination MUST be the chosen place's position; the travel mode MUST be the mode of the displayed routes.
- **FR-004**: Coordinates in the link MUST be precise enough to identify the place (at least 5 decimal places, about 1 m).
- **FR-005**: The QR code MUST be updated whenever the displayed routes change (new destination, mode change, stops change) and MUST be hidden while no route is displayed (no destination, no position, computing, failure, no route found).
- **FR-006**: The QR code MUST be scannable by a standard phone camera from a computer screen (dark modules on a light background, with a quiet zone; the code itself, without the quiet zone, at least 200 CSS pixels wide, so a phone at arm's length in front of a laptop screen can read it).
- **FR-007**: The QR code MUST have an accessible text alternative describing it (e.g. "QR code to open this route on your phone"), and the link itself MUST also be available as a clickable link, and as plain text shown under the code so the user can read or copy it when the camera fails.
- **FR-008**: When the journey contains stops, the system MUST show a short note that the phone link does not include the stops.
- **FR-009**: The QR code MUST be generated with a well-known, widely used QR code library; the QR encoding MUST NOT be hand-written.
- **FR-010**: If the QR code cannot be generated (library unavailable), the rest of the app MUST keep working and no broken image is shown.
- **FR-011**: The link building (start, destination, mode → link) MUST be testable on its own, without a browser or a network.

### Key Entities

- **Phone link**: the web address encoded in the QR code; made of the start position (latitude, longitude), the destination position (latitude, longitude) and the travel mode (walking or car).
- **QR code**: the visual code shown next to the route summary, encoding the phone link.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of cases where routes are displayed, a QR code is visible next to the route summary; in 100% of cases where no route is displayed, no QR code is visible.
- **SC-002**: A user can go from routes displayed on the computer to directions open on their phone in under 10 seconds, with a single scan and no typing.
- **SC-003**: Scanning the QR code with a standard phone camera from a normal viewing distance (30–60 cm) succeeds on the first try in at least 9 out of 10 attempts.
- **SC-004**: The trip opened on the phone has the same start (within about 1 m), the same destination (within about 1 m) and the same travel mode as on the computer in 100% of tested cases.
- **SC-005**: After a change of destination or mode, the QR code never shows the previous trip once the new routes are displayed.

## Assumptions

- The app runs on the user's computer (often at a local address), so a link to the app itself would not open on the phone. The phone link therefore points to the public OpenStreetMap website's directions page (confirmed in Clarifications), which uses the same routing service as the app (OSRM foot and car profiles of routing.openstreetmap.de), so the phone shows the same trip.
- The link carries only the start, the destination and the travel mode, as requested; the exact alternative picked and any stops are not carried over.
- "Next to the route summary" means the QR card placed directly under the status summary of the displayed routes (Design A).
- In keeping with the app's "no build step" approach, the QR code library is loaded the same way as the map library (from a public content delivery network), with no build tooling added.
- Existing behaviours (search, routes, alternatives, pleasure indicator, stops, travel mode switch) are unchanged.
