# Feature Specification: Format distances with a small library

**Feature Branch**: `factory/pilot-68528-format-distances-with-a-small-library`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Format distances with a small library — Use a small, well-known npm package to format the distances shown on the map (e.g. 1.2 km)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read route distances at a glance (Priority: P1)

A traveller searches for a destination and sees up to 3 route options in the panel, plus a summary for the fastest route. Each route shows its distance in a short, consistent, easy-to-read form such as "1.2 km" or "850 m", instead of the current mix of two-decimal ("1.50 km") and one-decimal ("12.3 km") values.

**Why this priority**: Distance is one of the two key facts (with duration) used to choose a route; it is the only user-visible outcome of this feature.

**Independent Test**: Search for a destination at walking range and at driving range; check that every distance shown in the route list and in the route summary follows the formatting rules below.

**Acceptance Scenarios**:

1. **Given** a route of 420.4 m, **When** the route list is shown, **Then** its distance reads "420 m".
2. **Given** a route of 1,500 m, **When** the route list is shown, **Then** its distance reads "1.5 km".
3. **Given** a route of 12,345 m, **When** the route list is shown, **Then** its distance reads "12.3 km".
4. **Given** a route of 2,000 m, **When** the route list is shown, **Then** its distance reads "2 km" (no trailing ".0").
5. **Given** several routes, **When** the route list and the fastest-route summary are shown, **Then** both use exactly the same distance text for the same route.

---

### User Story 2 - Maintainers rely on a well-known formatter (Priority: P2)

A maintainer of the app no longer owns hand-written unit-conversion and rounding logic for distances; formatting is delegated to a small, widely used, actively published open-source package, so future tweaks (units, rounding) are configuration rather than custom code.

**Why this priority**: This is the stated motivation of the request, but it has no visible effect on its own beyond User Story 1.

**Independent Test**: Inspect the project's declared dependencies and the distance formatting helper: a single small, well-known package is declared and used; the automated test suite passes.

**Acceptance Scenarios**:

1. **Given** the project's dependency list, **When** it is reviewed, **Then** exactly one new runtime package is added, and it is used for distance formatting.
2. **Given** the app is started the usual way (static file server, no build step), **When** a route is displayed, **Then** distances are formatted by the package, with no additional install or build step required to run the app in a browser.
3. **Given** the automated test suite, **When** it is run, **Then** distance formatting tests pass using the package.

### Edge Cases

- Distance of 0 m (destination equal to start): shows "0 m".
- Distance just below 1 km (e.g. 999.6 m) must not display as "1000 m"; it shows "1 km".
- Very long routes (e.g. 1,234,567 m, a long car trip) show "1234.6 km" (no thousands separator) — always in kilometres, never in another unit (no miles, no megametres).
- Fractional metres below 1 (e.g. 0.4 m) show "0 m".
- Missing or invalid distance (not a number): the app must not crash; show nothing or a neutral placeholder rather than "NaN km".
- The package fails to load in the browser: the rest of the app (map, search, routes) still works; distances may fall back to a plain format.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every distance shown to the user (route list entries and the fastest-route summary) MUST be produced by one shared formatting function.
- **FR-002**: Distances below 1,000 m MUST be shown in whole metres with the unit "m" (e.g. "420 m").
- **FR-003**: Distances of 1,000 m or more (after rounding) MUST be shown in kilometres with at most one decimal place and the unit "km" (e.g. "1.2 km", "12.3 km"); a trailing ".0" MUST be omitted (e.g. "2 km").
- **FR-004**: The number and unit MUST be separated by a single space, and the decimal separator MUST be a dot, matching the rest of the English UI.
- **FR-005**: The formatting MUST be delegated to a single small, well-known, open-source npm package (small install footprint, no transitive runtime dependencies preferred, widely downloaded, permissive licence).
- **FR-006**: The app MUST keep running without a build step: the package MUST be loadable directly by the browser (as the map library already is) and by the automated tests.
- **FR-007**: Durations and every other displayed value MUST remain unchanged.
- **FR-008**: Invalid or missing distances MUST NOT produce "NaN" or crash the route display.
- **FR-009**: Automated tests MUST cover the examples and edge cases listed above, and existing tests that assert the old format ("1.50 km") MUST be updated to the new format.
- **FR-010**: Project documentation MUST be updated so it no longer claims the app has no dependencies, and names the package used for distance formatting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of distances shown in the route list and route summary follow the formatting rules (verified on all acceptance scenarios and edge cases).
- **SC-002**: No displayed distance has more than one decimal place.
- **SC-003**: Exactly one new runtime dependency is added to the project, and no build step is introduced; the app starts with the same single command as before.
- **SC-004**: The full automated test suite passes.
- **SC-005**: The project's own distance formatting code shrinks to a thin call to the package (no hand-written unit selection or rounding logic left).

## Assumptions

- "Distances shown on the map" means the route distances shown in the side panel (each route option and the fastest-route summary); these are the only distances currently displayed. Coordinates of map points are not distances and are out of scope.
- Metric units only (m / km), matching the current app; no imperial units or user setting for units.
- English formatting (dot decimal separator) is kept, matching the current English-only UI; localisation is out of scope.
- One decimal place for kilometres is chosen to match the example "1.2 km" in the request, replacing the current two-decimal format under 10 km.
- The package is loaded in the browser the same way the map library already is (from a public CDN), so the "no build step" property of the app is preserved; the package is also declared in the project's dependency list for tests.
- Duration formatting stays hand-written and unchanged (the request concerns distances only).
