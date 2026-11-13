# Feature Specification: Format distances with a small library

**Feature Branch**: `factory/pilot-68528-format-distances-with-a-small-library`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Format distances with a small library — Use a small, well-known npm package to format the distances shown on the map (e.g. 1.2 km)."

## Clarifications

### Session 2026-11-13

- Q: How should the app load the distance-formatting package in the browser? → A: Option A — from a public CDN (unpkg), like the map library; declared as a project dependency only so the automated tests can use it. If it cannot load, distances fall back to a plain format and the rest of the app keeps working. (Reply also approved every other proposal in the spec as written.)

### Session 2026-11-13 (check-plan-completeness)

- Q: Is the rounding before choosing a unit defined? → A: Distances are first rounded to the nearest whole metre; the m/km choice is made on that rounded value (decided by the factory, no question asked)
- Q: How are kilometre ties rounded (e.g. 1,050 m, 1,150 m)? → A: To the nearest 0.1 km; an exact tie (±50 m) may round either way and tests do not assert exact ties (decided by the factory, no question asked)
- Q: What is shown for an invalid or missing distance? → A: The placeholder "—" (em dash) (decided by the factory, no question asked)
- Q: Are negative distances formatted? → A: No; they are invalid and show "—" (decided by the factory, no question asked)
- Q: Must the fallback path have an automated test? → A: Yes, at least one test covers formatting when the package is unavailable (decided by the factory, no question asked)
- Q: Must the docs mention the new install step? → A: Yes; the README says to run `npm install` once before `npm test`; `npm start` is unchanged (decided by the factory, no question asked)
- Q: What do "small, well-known, actively published" mean? → A: No runtime dependencies, loadable as an ES module without a build step, public source repository, a release within the last 2 years (decided by the factory, no question asked)
- Q: Which licences are "permissive"? → A: MIT, ISC, BSD-2-Clause, BSD-3-Clause or Apache-2.0 (decided by the factory, no question asked)
- Q: Is "no transitive runtime dependencies" a hard rule? → A: Yes (decided by the factory, no question asked)
- Q: What does "pinned version" mean? → A: One exact version (no range), identical in the CDN URL and in package.json (decided by the factory, no question asked)
- Q: Normal or non-breaking space between number and unit? → A: A normal space (decided by the factory, no question asked)
- Q: Are unit spellings fixed? → A: Yes: exactly "m" and "km", lower case (decided by the factory, no question asked)
- Q: Is "no thousands separator" a requirement? → A: Yes; added to FR-004 (decided by the factory, no question asked)
- Q: Do the CDN script and package.json entry count as one dependency (SC-003)? → A: Yes, it is one package declared in two places (decided by the factory, no question asked)
- Q: How is SC-005 verified? → A: The project's distance code has no division by 1000 and no comparison against 1000; unit choice and conversion come from the package (decided by the factory, no question asked)
- Q: Does every edge case have an exact expected output? → A: Yes; the edge cases now give exact strings (decided by the factory, no question asked)
- Q: What if the package loads slowly? → A: The app never waits for it: map, search and routes start at once; distances use the fallback format until the package has loaded (decided by the factory, no question asked)
- Q: Which boundary values are covered? → A: 999.4 m → "999 m", 999.5 m → "1 km", 0.5 m → "1 m", 9,999.96 m → "10 km" (decided by the factory, no question asked)
- Q: How are non-numeric inputs handled? → A: One rule: anything that is not a finite number ≥ 0 (undefined, null, strings, Infinity, NaN) shows "—" (decided by the factory, no question asked)
- Q: Do routes with stops follow the same rules? → A: Yes; the route's total distance uses the same formatting function (decided by the factory, no question asked)
- Q: What is the minimum browser support? → A: Browsers with import maps (Chrome/Edge 89+, Firefox 108+, Safari 16.4+) (decided by the factory, no question asked)
- Q: Are accessibility needs for "m"/"km" in scope? → A: Out of scope; the abbreviations are the same as before this feature (decided by the factory, no question asked)
- Q: Is reliance on unpkg an accepted risk? → A: Yes, the same accepted risk as the map library; the app maintainers own it (decided by the factory, no question asked)

### Session 2026-11-13 (check-plan-completeness, Pilot)

- Q: What exactly do distances look like when the package cannot be loaded (or has not loaded yet), and how does that fit SC-005? → A: The fallback shows whole metres only, e.g. "1500 m" or "412700 m"; invalid values still show "—". No hand-written km logic is kept, so SC-005 stays as written.
- Q: How do we make sure the package file served by the CDN has not been tampered with? → A: The same trust model as the map library: one exact pinned version and no integrity hash.

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
- Distance just below 1 km (e.g. 999.6 m) must not display as "1000 m"; it shows "1 km". Boundaries: 999.4 m → "999 m", 999.5 m → "1 km", 9,999.96 m → "10 km".
- Very long routes (e.g. 1,234,567 m, a long car trip) show "1234.6 km" (no thousands separator) — always in kilometres, never in another unit (no miles, no megametres).
- Fractional metres below 1: 0.4 m shows "0 m", 0.5 m shows "1 m".
- Missing or invalid distance (anything that is not a finite number ≥ 0: undefined, null, strings, NaN, Infinity, negatives): the app must not crash; it shows "—", never "NaN km".
- The package fails to load, or has not loaded yet, in the browser: the rest of the app (map, search, routes) still works and never waits for the package; distances use the fallback format: whole metres only (e.g. 1,500 m shows "1500 m", 412,700 m shows "412700 m"; 420.4 m shows "420 m"; invalid values still show "—").

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every distance shown to the user (route list entries and the fastest-route summary) MUST be produced by one shared formatting function.
- **FR-002**: Distances below 1,000 m MUST be shown in whole metres with the unit "m" (e.g. "420 m").
- **FR-003**: Distances of 1,000 m or more (after rounding to the nearest whole metre) MUST be shown in kilometres with at most one decimal place and the unit "km" (e.g. "1.2 km", "12.3 km"), rounded to the nearest 0.1 km (exact ties may round either way); a trailing ".0" MUST be omitted (e.g. "2 km").
- **FR-004**: The number and unit MUST be separated by a single normal space, the unit MUST be exactly "m" or "km" (lower case), the decimal separator MUST be a dot, and there MUST be no thousands separator, matching the rest of the English UI.
- **FR-005**: The formatting MUST be delegated to a single small, well-known, open-source npm package (no runtime dependencies, loadable as an ES module without a build step, public source repository, a release within the last 2 years, licence MIT, ISC, BSD-2-Clause, BSD-3-Clause or Apache-2.0).
- **FR-006**: The app MUST keep running without a build step: the browser MUST load the package from the same public CDN as the map library (unpkg), at one exact pinned version (the same version as declared for the tests), without delaying the start of the app, and the automated tests MUST use the same package declared as a project dependency. If the package cannot be loaded (or has not loaded yet), distances MUST fall back to whole metres only: the value rounded to the nearest whole metre, a normal space, then "m", with no thousands separator (e.g. "1500 m"); invalid values show "—" (FR-008). No kilometre conversion is done in the fallback. The rest of the app MUST keep working. The package is trusted the same way as the map library: one exact pinned version, no integrity hash.
- **FR-007**: Durations and every other displayed value MUST remain unchanged.
- **FR-008**: Invalid or missing distances MUST NOT produce "NaN" or crash the route display; they show "—".
- **FR-009**: Automated tests MUST cover the examples and edge cases listed above, including the fallback format, and existing tests that assert the old format ("1.50 km") MUST be updated to the new format.
- **FR-010**: Project documentation MUST be updated so it no longer claims the app has no dependencies, names the package used for distance formatting, and says to run `npm install` once before `npm test`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of distances shown in the route list and route summary follow the formatting rules (verified on all acceptance scenarios and edge cases).
- **SC-002**: No displayed distance has more than one decimal place.
- **SC-003**: Exactly one new runtime dependency is added to the project, and no build step is introduced; the app starts with the same single command as before.
- **SC-004**: The full automated test suite passes.
- **SC-005**: The project's own distance formatting code shrinks to a thin call to the package (no hand-written unit selection or rounding logic left: no division by 1000 and no comparison against 1000 in the project's distance code).

## Assumptions

- "Distances shown on the map" means the route distances shown in the side panel (each route option and the fastest-route summary); these are the only distances currently displayed. Coordinates of map points are not distances and are out of scope.
- Metric units only (m / km), matching the current app; no imperial units or user setting for units.
- English formatting (dot decimal separator) is kept, matching the current English-only UI; localisation is out of scope.
- One decimal place for kilometres is chosen to match the example "1.2 km" in the request, replacing the current two-decimal format under 10 km.
- The package is loaded in the browser from the same public CDN as the map library (confirmed in Clarifications), so the "no build step" property of the app is preserved; the package is also declared in the project's dependency list for tests.
- Supported browsers are those with import maps (Chrome/Edge 89+, Firefox 108+, Safari 16.4+).
- Accessibility of the "m"/"km" abbreviations is out of scope (unchanged from before).
- Relying on unpkg is the same accepted risk as for the map library; the app maintainers own it. No subresource integrity hash is used, as for the map library; the exact pinned version is the only safeguard.
- Routes with stops show their total distance with the same formatting function.
- Duration formatting stays hand-written and unchanged (the request concerns distances only).
