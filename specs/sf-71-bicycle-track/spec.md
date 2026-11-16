# Feature Specification: Bicycle Travel Mode (follow-up to SF-70)

**Feature Branch**: `factory/sf-71-bicycle-track`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "bicycle track — in addition to by foot and by car, I want to be able to select bicycles as a travel possibility"

## Context: Baseline Already Delivered

This request is the same, word for word, as **SF-70** (`specs/sf-70-bicycle-track/`). SF-70 was implemented and merged into `main` (PR #9). As of this spec, the app already:

- offers a "🚶 Walk | 🚗 Car | 🚲 Bike" segmented selector, with Walk as the default;
- computes up to 3 cycling routes with a bicycle routing profile, pre-selects the fastest, and lets the user select a route from the panel or the map;
- shows the pleasure indicator on cycling routes and never forces detours for cycling;
- uses cycling-specific status and summary texts;
- recomputes routes when the user switches mode, keeps stops, and ignores results from a mode that is no longer selected;
- documents the Bike mode in the README.

All 113 automated tests pass on this branch, including the bike-specific ones. **The literal request is therefore already satisfied.** This spec does two things:

1. it locks in the delivered behaviour as acceptance criteria (User Story 1);
2. it states the one open scope question: what, if anything, SF-71 should add on top of it (User Story 2).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Bike as a travel possibility (Priority: P1)

A user who plans to ride a bicycle selects "🚲 Bike" next to Walk and Car, chooses a destination, and gets cycling routes with distance and duration that they can select and compare with the other modes.

**Why this priority**: This is the user's literal request. It already exists, so this story's job is to confirm it works end to end and stays working.

**Independent Test**: Open the app, select Bike, choose a destination a few kilometres away, and check that 1 to 3 cycling routes appear. Each route shows a distance and a duration that is shorter than the walking duration for the same trip. Switch to Walk and back to Bike, and check that the routes are recomputed for the same destination and stops.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user looks at the travel mode selector, **Then** they see Walk, Car and Bike, with Walk selected by default.
2. **Given** Bike is selected and the user's position is known, **When** they choose a destination, **Then** up to 3 cycling routes are shown, each with distance and duration, and the fastest is pre-selected.
3. **Given** walking or car routes are displayed, **When** the user selects Bike, **Then** those routes are replaced by cycling routes to the same destination, through the same stops in list order.
4. **Given** no cycling route exists, **When** the computation ends, **Then** the user sees "No cycling route found."
5. **Given** the user switches modes quickly, **When** an earlier computation finishes late, **Then** only routes for the currently selected mode are shown.

---

### User Story 2 - Additional bicycle capability beyond SF-70 (Priority: P2)

[NEEDS CLARIFICATION: SF-70 already delivers Bike as a travel mode. What should SF-71 add? (a) Nothing: close SF-71 as a duplicate, with only User Story 1 verified. (b) "Bicycle track" means dedicated bike infrastructure: prefer cycle lanes and tracks over shared roads, and show how much of each route is on a dedicated bike track. (c) Something else, such as a problem seen with the current Bike mode.]

**Why this priority**: The scope and value of this story depend entirely on the answer above. It cannot be specified further until the question is answered.

**Independent Test**: Defined once the scope is clarified.

**Acceptance Scenarios**:

1. To be defined once the scope is clarified.

---

### Edge Cases

- The cycling routing service is unreachable or returns an error: the user sees an error message, and routes from the previous mode are not left on screen labelled as cycling routes.
- The routing service returns a single cycling route: only that route is shown, with no artificial detour routes.
- Very long bike trips, or map tiles that cannot be loaded: routes are shown normally, and each one says "Pleasure unavailable".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The travel mode selector MUST offer Walk, Car and Bike, with Walk as the default.
- **FR-002**: When Bike is selected, routes MUST be computed for bicycles (roads and paths where bicycles are allowed, with cycling-speed durations), not with the walking or car rules.
- **FR-003**: The system MUST show up to 3 cycling routes, each with distance and duration, pre-select the fastest one, and let the user select routes from the panel and from the map.
- **FR-004**: Switching to or from Bike MUST recompute routes for the current destination and keep the current stops in list order.
- **FR-005**: Results computed for a mode that is no longer selected MUST NOT replace the routes of the currently selected mode.
- **FR-006**: Walk and Car behaviour MUST stay unchanged.
- **FR-007**: Any capability beyond FR-001–FR-006 is limited to the answer to the User Story 2 clarification. If the answer is (a), no product change is required.

### Key Entities

- **Travel mode**: one of Walk, Car or Bike. Each mode has a user-facing label, a routing behaviour, and its own rules (for example, the pleasure indicator applies to Walk and Bike, and forced detours apply to Walk only).
- **Route**: a path from the user's position through the stops to the destination, with a distance and duration, computed for one travel mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can get cycling routes in at most 2 interactions: select Bike, then choose a destination. If a destination is already chosen, 1 interaction is enough.
- **SC-002**: For typical urban trips of 2–10 km, the displayed cycling duration is shorter than the walking duration for the same trip in 100% of tested cases.
- **SC-003**: Cycling routes appear as quickly as walking or car routes for the same trip, with no noticeable extra wait.
- **SC-004**: Every behaviour verified for Walk, Car and Bike before this feature still passes afterwards (0 regressions).

## Assumptions

- SF-70, as merged into `main`, is the baseline. Its clarified decisions remain in force: the segmented-button selector (design C) and the pleasure indicator on bike routes.
- The same OpenStreetMap-based routing provider, with its bicycle profile, keeps supplying cycling routes.
- Cycling durations come from the routing service. Users cannot set their own cycling speed.
- The selected mode is not remembered across page reloads.
