# Implementation Plan: Clear button for the search box

**Branch**: `pilot-85820-clear-button-for-the-search-box` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/pilot-85820-clear-button-for-the-search-box/spec.md`

## Summary

Add a plain grey × button (Design A) inside the search box, shown only while the box has text. Activating it empties the box, empties the result list, cancels pending/in-flight suggestions, clears the status message and refocuses the box, leaving destination, routes and stops untouched. Implemented in the existing vanilla-JS page: one new button in `index.html`, a few CSS rules, and a small handler plus a visibility sync in `src/app.js`.

## Technical Context

**Language/Version**: JavaScript (ES modules, browser), HTML, CSS; Node for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN, unchanged); no new dependencies

**Storage**: N/A

**Testing**: `node --test test/` (pure logic only; the DOM is not unit-tested in this repo) plus manual quickstart checks

**Target Platform**: Current Chrome, Firefox, Safari, Edge; desktop and phone

**Project Type**: Single-page web app (static files)

**Performance Goals**: N/A (instant UI update)

**Constraints**: Tap target ≥ 24×24 px; exactly one clear control visible; keyboard and screen-reader operable

**Scale/Scope**: One control in one panel

## Constitution Check

`.specify/memory/constitution.md` is the unfilled template and defines no principles, so there are no gates to evaluate. Self-imposed: smallest change, no new dependencies, follow existing code style. Re-checked after design: still passes.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-85820-clear-button-for-the-search-box/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-contract.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
index.html     # wrap #search-input in a relative span; add #search-clear button
styles.css     # position ×, pad input, hide native cancel buttons
src/app.js     # syncClear(), clear handler, call syncClear after programmatic value changes
```

**Structure Decision**: Existing flat static layout; edit the three files above. No new modules.

## Complexity Tracking

No violations.
