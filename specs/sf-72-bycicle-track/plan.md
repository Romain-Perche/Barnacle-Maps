# Implementation Plan: Bicycle Travel Mode

**Branch**: `factory/sf-72-bycicle-track` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/sf-72-bycicle-track/spec.md`

## Summary

Add a third travel mode, Bike, next to Walk and Car. The selector becomes one row of segmented buttons with emoji icons (design C). Bike routes come from the same FOSSGIS OSRM provider (`routing.openstreetmap.de/routed-bike`) and go through the existing pipeline for stops, alternatives and de-duplication. They get the pleasure indicator like walking routes, and no forced detours. Per-mode behaviour flags (`icon`, `pleasure`, `detours`) are added to `TRAVEL_MODES` in `src/geo.js`, and `src/app.js` reads them instead of checking mode names. The status texts go in a small per-mode map in `src/app.js`. A routing "no route" answer (HTTP 400 with code `NoRoute`/`NoSegment`, per the OSRM docs) now shows "No … route found." instead of "Routing failed" (research R7).

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node 18+ for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN); no npm dependencies, no build step

**Storage**: N/A (in-memory state; mode not persisted)

**Testing**: `node --test test/` (built-in Node runner); pure helpers in `src/geo.js` plus static source/markup checks; OSRM requests checked against the OSRM docs by the fake `test/fakes/osrm.js` (see `.factory/test-env.md`); AI scenarios in `tests/ai/` run the real app in headless Playwright with fake OSRM/Nominatim/tiles

**Target Platform**: Modern desktop/mobile browsers, served statically (geolocation needs localhost/HTTPS)

**Project Type**: Static single-page web app

**Performance Goals**: Cycling routes appear as fast as walking/car routes: one OSRM request with alternatives, no detour requests (SC-003)

**Constraints**: Public OSM services only (Nominatim, FOSSGIS OSRM, OSM tiles); no API keys; no new dependencies; pleasure limits unchanged; existing tests keep passing (SC-004)

**Scale/Scope**: 4 source files (`src/geo.js`, `src/app.js`, `index.html`, `styles.css`) + `README.md`; tests (already written by the write-tests gate): `test/bike.test.js`, key-list update in `test/modes.test.js`, `test/fakes/osrm.js`, `tests/ai/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so there are no ratified principles to gate on. **Gate: PASS (no constraints defined).** Instead, the plan follows the project's visible conventions: no build step or dependencies (test L8), pure logic in `src/geo.js` without DOM or fetch (L6), DOM code in `src/app.js`, README kept current (L3, FR-011).

**Post-design re-check: PASS.** No dependency, no new module or project. The only edit to an existing test is the `TRAVEL_MODES` key-list assertion in `test/modes.test.js`, which cannot be avoided once a key is added (research R6).

## Project Structure

### Documentation (this feature)

```text
specs/sf-72-bycicle-track/
├── spec.md
├── design-options.html     # design C chosen
├── plan.md                 # This file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   └── travel-modes.md     # TRAVEL_MODES, routeUrl, selector markup/CSS, texts, isNoRouteResponse
├── checklists/
└── tasks.md                # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
index.html        # selector: 3 radios (foot/car/bike), each with an aria-hidden emoji span (design C)
styles.css        # #mode as segmented control; rules target `#mode input + span` only
src/
├── geo.js        # TRAVEL_MODES += bike; icon/pleasure/detours flags on every mode; isNoRouteResponse
└── app.js        # MODE_TEXT map; flags read in fetchRoutes/drawRoutes/updateRoutes; NoRoute → no routes; tooltip "route"
test/
├── bike.test.js  # written: bike routeUrl, flags, OSRM-docs checks, isNoRouteResponse, markup, CSS, texts, README
├── fakes/osrm.js # written: fake OSRM checked against .factory/schemas/osrm-http.md
└── modes.test.js # written: key list now includes bike (+ bike base/profile)
tests/ai/         # written: us1-, us2-, us3-*.md scenarios + support/fake-services.mjs (Playwright fakes)
README.md         # Bike mode, routed-bike source, pleasure for walking and bike routes
```

**Structure Decision**: Keep the existing flat static-app layout. No new files in `src/`.

## Implementation Approach

1. **`src/geo.js`**: export `isNoRouteResponse(json)`: true only when `json?.code` is `"NoRoute"` or `"NoSegment"` (contracts §6). Add `bike: { label: "Bike", icon: "🚲", base: ".../routed-bike", profile: "bike", pleasure: true, detours: false }`, and add `icon`/`pleasure`/`detours` to `foot` (🚶, true, true) and `car` (🚗, false, false). Update the header comment and the `routeUrl` comment. `routeUrl` logic does not change.
2. **`src/app.js`**:
   - Add a `MODE_TEXT` map (see contracts §5 and data-model ModeText). The foot and car values are today's exact strings.
   - `fetchRoutes`: `!TRAVEL_MODES[m].detours` replaces `m !== "foot"`.
   - `drawRoutes`: `TRAVEL_MODES[m].pleasure` replaces `m === "foot"`.
   - `updateRoutes`: the computing, no-route, single-route and plural texts come from `MODE_TEXT[m]`, and `if (TRAVEL_MODES[m].pleasure) scorePleasure(...)` replaces `if (!car)`.
   - `scorePleasure` tooltip: "along this route".
   - Routing requests: a non-OK response whose JSON body passes `isNoRouteResponse` counts as no routes (`[]`), for the main request and the detour requests; any other non-OK response still throws `Request failed (<status>)` (contracts §6, research R7). `fetchJson` for search does not change.
   - The mode `change` listener does not change.
3. **`index.html` / `styles.css`**: markup and CSS as in contracts §3–§4 (avoid the SF-70 nested-span bug).
4. **Tests**: already written (`test/bike.test.js`, `test/modes.test.js` key list, `test/fakes/osrm.js`, `tests/ai/`). Make them pass; do not edit them, except the profile assertions if the live check forces the `driving` fallback.
5. **README**: add a Bike line (OSRM `routed-bike` profile, up to 3 alternatives, with the pleasure indicator, no detour routes). Change the intro and the Pleasure line to "walking and bike routes".

## Decisions taken without asking (non-interactive run)

- OSRM profile segment `bike`, with `driving` as the fallback (research R1). The live endpoint was blocked by the sandbox firewall while planning; the check moves to quickstart §6.
- Native radios restyled rather than `aria-pressed` buttons (research R3).
- Behaviour flags go in `TRAVEL_MODES` (geo.js) and the texts in `MODE_TEXT` (app.js), so the existing L5 test passes unchanged (research R2).
- OSRM "no route" (HTTP 400 `NoRoute`/`NoSegment`) shows "No … route found." in all modes (research R7; spec Clarifications, to confirm).

## Complexity Tracking

No constitution violations; nothing to justify.
