# Implementation Plan: Bicycle Travel Mode

**Branch**: `factory/sf-70-bicycle-track` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/sf-70-bicycle-track/spec.md`

## Summary

Add a third travel mode, Bike, next to Walk and Car, with the selector redrawn as one row of segmented buttons with emoji icons (design C). Bike routes come from the same FOSSGIS OSRM provider (`routing.openstreetmap.de/routed-bike`), go through the existing stops/alternatives/de-duplication pipeline, get the pleasure indicator like walking, and no forced detours. To avoid scattering `m === "bike"` checks, the per-mode behaviour (icon, pleasure, detours, status texts) moves into `TRAVEL_MODES` in `src/geo.js`, where it is unit-testable, and `src/app.js` reads it.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node 18+ for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN); no npm dependencies, no build step

**Storage**: N/A (in-memory state; mode not persisted)

**Testing**: `node --test test/` (built-in Node test runner); pure helpers in `src/geo.js` only

**Target Platform**: Modern desktop/mobile browsers (served statically, geolocation on localhost/HTTPS)

**Project Type**: Static single-page web app

**Performance Goals**: Cycling routes appear as fast as walking/car routes (one OSRM request with alternatives; SC-003)

**Constraints**: Public OSM services only (Nominatim, OSRM FOSSGIS, OSM tiles); no API keys; no new dependencies; pleasure limits unchanged

**Scale/Scope**: ~4 source files touched (`src/geo.js`, `src/app.js`, `index.html`, `styles.css`) + `README.md`; tests: `test/bike.test.js` (new), `test/modes.test.js`, `test/routes.test.js` (L5), `tests/ai/` (AI scenarios)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (placeholders only), so there are no ratified principles to gate on. Gate: **PASS (no constraints defined)**. As a substitute, the plan follows the project's visible conventions: no build step or dependencies, pure logic in `src/geo.js` with Node unit tests, DOM code in `src/app.js`, README kept current.

Post-design re-check: **PASS**. The design adds no dependency, no new module and no new project; the only edits to existing tests are the `TRAVEL_MODES` key-list assertion and L5 reading `src/geo.js` too (see research R7).

## Project Structure

### Documentation (this feature)

```text
specs/sf-70-bicycle-track/
├── spec.md
├── design-options.html  # design C chosen
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── travel-modes.md  # Phase 1: TRAVEL_MODES, routeUrl, selector markup, texts
├── checklists/
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html           # selector: 3 radios (foot/car/bike) with icon spans, design C markup
styles.css           # #mode as segmented control: hidden inputs, checked/focus styles
src/
├── geo.js           # TRAVEL_MODES += bike; per-mode icon/pleasure/detours/texts
└── app.js           # fetchRoutes/drawRoutes/updateRoutes read TRAVEL_MODES[m]; pleasure tooltip "route"
test/
├── bike.test.js     # SF-70 contract + markup/source/README checks (written by /write-tests)
├── modes.test.js    # key-list assertion now includes bike
└── routes.test.js   # L5 checks app.js + geo.js
tests/ai/            # AI scenarios per user story (us1-, us2-, us3-*.md)
README.md            # Bike mode, routed-bike source, pleasure for walking and bike
```

**Structure Decision**: Existing flat static-app layout; no new files in `src/` or `test/`.

## Implementation Approach

1. **`src/geo.js`**: add `bike: { label: "Bike", icon: "🚲", base: ".../routed-bike", profile: "bike", pleasure: true, detours: false, computing, noRoute, single: "by bike", plural: "cycling" }` and the matching fields to `foot`/`car`, with values reproducing today's strings. Update the header comment. `routeUrl` itself needs no change.
2. **`src/app.js`**:
   - `fetchRoutes`: `!TRAVEL_MODES[m].detours` replaces `m !== "foot"`.
   - `drawRoutes`: `TRAVEL_MODES[m].pleasure` replaces `m === "foot"`.
   - `updateRoutes`: status/no-route/summary strings from the mode entry; `if (cfg.pleasure) scorePleasure(...)` replaces `if (!car)`.
   - `scorePleasure` tooltip: "along this route".
   - Mode `change` listener unchanged (already validates `value in TRAVEL_MODES` and keeps stops); stale results already dropped by `routeSeq` (FR-010).
3. **`index.html` / `styles.css`**: design C markup and CSS per `contracts/travel-modes.md` (colours from `design-options.html`: border `#dadce0`, selected `#e8f0fe` / `#1a73e8` / 600).
4. **Tests**: already written before implementation (`test/bike.test.js`, updated `test/modes.test.js` and L5 in `test/routes.test.js`). The implementation makes them pass; it does not edit them.
5. **README**: Bike line (OSRM `routed-bike`, no detours, with pleasure); pleasure line "walking and bike routes".

## Decisions taken without asking (non-interactive run)

- OSRM profile segment `bike` (server ignores it; `driving` is the fallback) — research R1. Live endpoint not reachable from the planning sandbox; verified at implementation via quickstart.
- Native radios kept and restyled rather than `aria-pressed` buttons — research R3.
- Mode-specific texts/flags centralised in `TRAVEL_MODES` — research R2.

## Complexity Tracking

No constitution violations; nothing to justify.

## Fix round 1

- **Problem (AI review):** each mode button shows the emoji on its own line above the label ("🚶" over "Walk"), so each segment is about 60px tall. Design C / FR-001 asks for "🚶 Walk" on one line.
- **Cause:** `styles.css` uses `#mode span { display:block; padding:6px 8px; … }`. That descendant selector also matches the nested `<span aria-hidden="true">ICON</span>`, so the icon becomes a padded block. T011 asked for `#mode input + span`.
- **Fix:** scope the rule to the outer span: change the selector `#mode span` to `#mode input + span` (same declarations). The nested icon span keeps its default inline display. No markup or spec change.
- **Files:** `styles.css` only.
- **Test:** `test/bike.test.js` "styles.css: #mode button padding does not apply to the nested icon span" fails while any `#mode … span` rule without `+`/`>` before `span` sets `display` or `padding`, and requires `#mode input + span` to set the padding.
