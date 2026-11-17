# Implementation Plan: Sort Search Results by Distance

**Branch**: `sf-74-sort-search-results` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/sf-74-sort-search-results/spec.md`

## Summary

When the user's position is known, (1) ask Nominatim to prefer a box around the user (`viewbox`, `bounded=0`), (2) sort the returned places by straight-line (haversine) distance from the user with a stable sort, and (3) show each distance (existing `formatDistance`) in a column right of the name, before "Add as stop" (Design A). Without a position, behaviour is unchanged. All logic is a pure helper in `src/geo.js`; `src/app.js` only wires it and renders the distance.

## Technical Context

**Language/Version**: JavaScript (ES modules), Node for tests, browser at runtime

**Primary Dependencies**: None (vanilla JS, Leaflet-free helpers in `src/geo.js`; Nominatim search API)

**Storage**: N/A

**Testing**: `node --test test/` (node:test), new cases in `test/geo.test.js`

**Target Platform**: Static web page (`python3 -m http.server`)

**Project Type**: Single-page web app (no backend)

**Performance Goals**: Sorting ≤5 results: negligible (SC-004)

**Constraints**: Keep limit of 5 results; no extra network calls; Nominatim rate limits respected

**Scale/Scope**: 2 source files, 1 test file, 1 CSS rule

## Constitution Check

`.specify/memory/constitution.md` is an unfilled template: no ratified principles, so no gates apply. Plan still follows the repo's own convention (pure helpers in `geo.js` with unit tests, DOM code in `app.js`). Pass before and after design.

## Project Structure

### Documentation (this feature)

```text
specs/sf-74-sort-search-results/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── search-ui-and-api.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── geo.js      # searchUrl(query, base, near?) ; sortByDistance(results, from) ; NEAR_BOX_DEG
└── app.js      # runSearch: pass position, sort, render distance span
styles.css      # .distance column rule
test/
└── geo.test.js # URL viewbox, sort order/stability, no-position cases
```

**Structure Decision**: Existing single-project layout; no new files in `src/`.

## Complexity Tracking

No violations.
