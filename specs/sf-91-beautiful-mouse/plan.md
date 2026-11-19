# Implementation Plan: Beautiful Mouse Pointer

**Branch**: `sf-91-beautiful-mouse` | **Date**: 2026-11-19 | **Spec**: [spec.md](spec.md)

## Summary

Replace Leaflet's open-hand pointer over the map with the Barnacle map cursor (blue ring, dot, white edge), per blueprint `ui/map-cursor@1`. CSS plus one SVG asset; no JavaScript, no dependency.

## Technical Context

**Language/Version**: plain HTML/CSS/ES modules (no build step); Node `node --test` for tests
**Primary Dependencies**: Leaflet 1.9.4 (already pinned, unchanged)
**Storage**: N/A
**Testing**: `npm test` (`node --test test/`); a new static test reads `styles.css` and `assets/map-cursor.svg`
**Target Platform**: desktop browsers (Chrome, Firefox, Safari, Edge), served by `python3 -m http.server`
**Project Type**: static web app
**Performance Goals**: none (one 24x24 SVG)
**Constraints**: cursor file local to the repo, never loaded from another site; crosshair fallback
**Scale/Scope**: 1 new file, 1 edited file, 1 new test

## Constitution Check

`.specify/memory/constitution.md` is an unfilled template: no gates. Passes. Post-design: still passes (no new project, service or dependency).

## Blueprints: `ui/map-cursor@1` (rules as steps)

The repo has no existing cursor styling, so no exception (`blueprints.json` unchanged, `exception: null`).

1. Create `assets/map-cursor.svg` with exactly this content (24x24, hot spot at the ring centre 12,12):
   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
     <circle cx="12" cy="12" r="7" fill="none" stroke="#FFFFFF" stroke-width="4"/>
     <circle cx="12" cy="12" r="7" fill="none" stroke="#2B00FF" stroke-width="2"/>
     <circle cx="12" cy="12" r="2" fill="#2B00FF" stroke="#FFFFFF" stroke-width="1"/>
   </svg>
   ```
2. In `styles.css` (loaded after Leaflet's CSS, so same-specificity rules win), append a "map cursor" block:
   - `.leaflet-container, .leaflet-grab { cursor: url("assets/map-cursor.svg") 12 12, crosshair; }`
   - `.leaflet-dragging .leaflet-grab { cursor: grabbing; }` (FR-005; more specific than the rule above)
   - `.leaflet-interactive, .leaflet-bar a, .leaflet-popup-content button, .leaflet-control-attribution a, .leaflet-popup-close-button { cursor: pointer; }` (FR-006; markers, route lines, user dot, zoom buttons, popup buttons, links). Attribution and zoom links are `a` inside `.leaflet-container`, so they need explicit rules.
   - `.leaflet-popup-content-wrapper, .leaflet-popup-tip { cursor: auto; }` (edge case: arrow over the popup's white area).
   - Do not touch `#panel` rules: `#panel` is a sibling of `#map`, not inside `.leaflet-container`, so it never gets the map cursor (FR-007).
3. The `.leaflet-dragging .leaflet-grab .leaflet-interactive` Leaflet rule keeps `grabbing` while dragging starting on a route; leave it.
4. No change to `index.html`, `src/app.js`, or any Leaflet file. Touch devices show no pointer, so nothing to do. Crosshair fallback is the CSS fallback value (FR-004).

## Tests (Build writes)

New `test/map-cursor.test.js` (node:test, static file checks): SVG file exists and equals the blueprint content; `styles.css` contains `url("assets/map-cursor.svg") 12 12, crosshair`, a `grabbing` rule under `.leaflet-dragging .leaflet-grab`, `pointer` for `.leaflet-interactive`, `.leaflet-bar a` and popup buttons, and `auto` for the popup wrapper; no `http` URL in the cursor rule (FR-003); `#panel` rules contain no `map-cursor`. Visual checks (ring on street/park/water, click within 2px) are in [quickstart.md](quickstart.md).

## Project Structure

```text
specs/sf-91-beautiful-mouse/  plan.md research.md data-model.md quickstart.md dependencies.json
assets/map-cursor.svg         (new)
styles.css                    (edit: cursor block)
test/map-cursor.test.js       (new)
```

**Structure Decision**: single static project; new top-level `assets/` directory as the blueprint requires.

## Complexity Tracking

No violations.
