# Feature Specification: Sort Search Results by Distance

**Feature Branch**: `factory/sf-74-sort-search-results`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Sort search results — The searched results need to be sorted by closeness to your position"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nearest place listed first (Priority: P1)

A user whose position is known searches for a place (for example "bakery" or a street name that exists in several towns). The results list shows the place closest to them first, then the next closest, and so on, so the one they most likely want is at the top.

**Why this priority**: This is the whole feature. Today results come back in the search service's own order, so a far-away match can appear above the one around the corner.

**Independent Test**: With a known position, search for a term that matches places at different distances. Check that the list is in increasing distance from the user.

**Acceptance Scenarios**:

1. **Given** the user's position is known, **When** they submit a search that returns several places, **Then** the results are listed from nearest to farthest (straight-line distance from the user's position).
2. **Given** the user's position is known, **When** suggestions appear while they type, **Then** the suggestions are also listed from nearest to farthest.
3. **Given** two results are at the same distance, **When** the list is shown, **Then** they keep the order the search service returned them in.
4. **Given** results are sorted, **When** the user clicks a result or "Add as stop", **Then** the action applies to the place they clicked (the route or stop matches that place).

---

### User Story 2 - See how far each result is (Priority: P2)

Next to each result, the user sees its straight-line distance from their position (for example "350 m" or "4.2 km"), so they understand why the list is in that order and can pick between similar names.

**Why this priority**: Makes the ordering clear and helps pick a result, but the sorting alone already delivers the main value.

**Independent Test**: With a known position, run a search and check that each result shows a distance, in the same format the app already uses for route distances, and that the distances increase down the list.

**Acceptance Scenarios**:

1. **Given** the user's position is known, **When** results are shown, **Then** each result shows its distance from the user in the app's existing distance format.
2. **Given** the user's position is not known, **When** results are shown, **Then** no distance is shown.

---

### Edge Cases

- **Position not yet known** (permission denied, still locating, or unavailable): results are shown in the search service's original order, with no distance. Search still works.
- **Position changes while results are on screen**: the list already shown is not reordered (to avoid results moving under the user's pointer); the next search or suggestion uses the latest position.
- **Single result or no results**: behaves as today ("No results." when empty).
- **A newer search replaces an older one**: only the latest search's results are shown, sorted (existing behavior kept).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the user's position is known, the system MUST list search results in increasing straight-line distance from that position.
- **FR-002**: The same ordering MUST apply to both submitted searches and suggestions shown while typing.
- **FR-003**: Results at equal distance MUST keep the order the search service returned them in.
- **FR-004**: When the user's position is not known, the system MUST list results in the search service's original order.
- **FR-005**: Each result's actions ("show route" and "Add as stop") MUST still apply to that result after sorting.
- **FR-006**: When the user's position is known, each result SHOULD show its straight-line distance from the user, in the app's existing distance format.
- **FR-007**: The number of results shown MUST stay the same as today (up to 5); sorting only changes their order.

### Key Entities

- **Search result**: a place returned by the search, with a name and a location; gains a distance from the user when the user's position is known.
- **User position**: the user's latest known location, used as the reference point for sorting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of searches made with a known position, the first result shown is the closest of the returned places.
- **SC-002**: In 100% of searches made with a known position, the distances of the listed results never decrease from one row to the next.
- **SC-003**: Searches made without a known position still show results, in the same order as before this feature.
- **SC-004**: Results appear with no noticeable extra delay compared to before (sorting at most 5 results).

## Assumptions

- "Closeness" means straight-line (as-the-crow-flies) distance, not travel distance or time along a route; computing routes for every result would be too slow and too costly for the routing service.
- Only the results the search service already returns (up to 5) are sorted. Asking the search service to favor or limit results to the user's area is out of scope.
- Stops already added do not affect the ordering; distance is always measured from the user's position.
- The sort is the same for walking and car modes.
- The user's live position, already tracked by the app, is the reference point.
