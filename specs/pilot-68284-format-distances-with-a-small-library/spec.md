# Feature Specification: Format distances with a small library

**Feature Branch**: `factory/pilot-68284-format-distances-with-a-small-library`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Format distances with a small library — Use a small, well-known npm package to format the distances shown on the map (e.g. 1.2 km)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read route distances in a clear, consistent format (Priority: P1)

A person searches for a destination (walking or car, with or without stops) and looks at the route list in the panel. Each route shows its distance in a short, familiar format: whole metres for short distances (e.g. "420 m") and kilometres with one decimal for longer ones (e.g. "1.2 km", "12.3 km"). The same format is used in the route summary.

**Why this priority**: Distance is one of the two key facts (with duration) used to compare routes; it is the whole point of this feature.

**Independent Test**: Search for destinations at various distances and check that every distance in the route list and summary follows the format rules below.

**Acceptance Scenarios**:

1. **Given** a route of 420 m, **When** the routes are shown, **Then** its distance reads "420 m".
2. **Given** a route of 1,234 m, **When** the routes are shown, **Then** its distance reads "1.2 km".
3. **Given** a route of 12,345 m, **When** the routes are shown, **Then** its distance reads "12.3 km".
4. **Given** several routes are displayed, **When** the person compares them, **Then** all distances (route titles and summary) use the same format rules.

---

### User Story 2 - Distance formatting delegated to a small, well-known package (Priority: P2)

The project maintainer wants distance formatting handled by a small, widely used, actively maintained open-source npm package instead of hand-written formatting code, so the formatting rules are reliable and not re-invented.

**Why this priority**: This is the explicit technical ask, but it only matters if User Story 1's visible output is correct.

**Independent Test**: Inspect the project's declared dependencies and the distance formatting code: the formatting is performed by the package, and the app and automated tests both run with it.

**Acceptance Scenarios**:

1. **Given** the project's dependency list, **When** a maintainer reviews it, **Then** exactly one new small, well-known formatting package is declared, pinned to a specific version.
2. **Given** the app is started with the documented start command, **When** routes are shown in the browser, **Then** distances are formatted by the package with no build step required.
3. **Given** the automated tests are run with the documented test command (after the documented install step, if any), **When** the distance formatting tests execute, **Then** they pass.

---

### Edge Cases

- Distance of 0 m reads "0 m".
- Values that round up to 1,000 m (e.g. 999.6 m) read "1.0 km" (or "1 km") rather than "1000 m".
- Fractional metre values below 1 km are rounded to whole metres (e.g. 420.4 m → "420 m").
- Very long distances (e.g. 123,456 m) read "123.5 km" without a thousands separator issue or scientific notation.
- If the formatting package fails to load in the browser, the rest of the app (map, search, routes) still works and distances fall back to a readable value rather than breaking the panel.
- Missing or invalid distance values do not crash the route list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST format every distance shown to the user (route list titles and route summary) through a single shared formatting function.
- **FR-002**: Distances below 1,000 m MUST be shown in whole metres with the unit "m" (e.g. "420 m").
- **FR-003**: Distances of 1,000 m or more (after rounding) MUST be shown in kilometres with one decimal place and the unit "km" (e.g. "1.2 km", "12.3 km").
- **FR-004**: The number and unit MUST be separated by a single space and use a "." decimal separator, matching the rest of the English UI.
- **FR-005**: The formatting MUST be performed by a small (minimal footprint, no or few transitive dependencies), well-known, actively maintained, permissively licensed npm package.
- **FR-006**: The package MUST work both in the browser (served without a build step, consistent with how the app is run today) and in the automated test runner.
- **FR-007**: The package version MUST be pinned so the output does not change unexpectedly.
- **FR-008**: Existing hand-written distance formatting logic MUST be replaced (not duplicated) by the package-based formatting.
- **FR-009**: Automated tests MUST cover the formatting rules in FR-002–FR-004 and the edge cases above (0 m, rounding to 1 km, sub-metre rounding, long distances).
- **FR-010**: The project README MUST be updated to mention the new dependency and any install step it requires.
- **FR-011**: Duration formatting and all other behaviour (routing, stops, pleasure indicator, travel modes) MUST remain unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of distances displayed in the route panel follow the format rules (whole metres below 1 km, one-decimal kilometres from 1 km).
- **SC-002**: All automated tests pass, including new distance-formatting cases for each listed edge case.
- **SC-003**: The project gains exactly one new runtime dependency, and its added download size is small (under 10 KB minified).
- **SC-004**: The app still starts and shows routes with the same documented start command and no build step.

## Assumptions

- "Distances shown on the map" means the route distances displayed in the route panel (route titles and summary); there are no other distance labels on the map today.
- One decimal for kilometres is chosen, following the user's example "1.2 km"; this changes today's output for 1–10 km (e.g. "1.50 km" becomes "1.5 km"), and the existing test will be updated accordingly.
- Metric units only; no imperial (miles/feet) option and no user-selectable units.
- Output stays in English formatting regardless of browser locale, to match the rest of the UI.
- The project currently has "no build step or dependencies"; adding one npm package is accepted by the request. In the browser the package may be loaded the same way Leaflet already is (from a public CDN at a pinned version) or served locally; the tests may require a one-time documented install step.
- The specific package is chosen during planning, among small, popular options with a permissive license.
