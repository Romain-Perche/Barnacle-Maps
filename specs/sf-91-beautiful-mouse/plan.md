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

## Fix round 1

**Problem**: the AI review marked edge case 2 (touch-only device) as failed. It did not run it: it used no touch device and no touch emulation. All other scenarios passed.

**Cause**: the review is incomplete, not the code. The change adds only `cursor` rules in `styles.css`. It adds no `touch-action`, `pointer-events` or `user-select` rule and no JavaScript, so Leaflet's tap and one-finger drag are unchanged (FR-008). The spec's touch edge case had no result a headless tester could check, so the review skipped it.

**Fix** (option A, no app code change):
1. Build adds a static guard test: the map cursor block in `styles.css` sets only `cursor` properties (no `touch-action`, `pointer-events`, `user-select`), and the branch changes no file under `src/`. It passes now and keeps touch behaviour safe from later edits.
2. The spec's touch edge case now states a check a tester can run with browser touch emulation (Playwright `hasTouch: true`, `isMobile: true`): a tap on the empty map opens the "Add stop here" popup at the tap point, and a one-finger drag moves the map centre. The next AI review performs it.
3. Build adds the touch step to `quickstart.md`.

**Files**: `test/map-cursor.test.js` (extend), `specs/sf-91-beautiful-mouse/quickstart.md` (step 7), `spec.md` (edge case wording). No dependency.

## Fix round 2

**Problem**: the AI code review marked the Fix round 1 guard test as must-fix. The test `map cursor block sets only cursor properties, no src/ change` in `test/map-cursor.test.js` runs `git diff origin/main...HEAD --name-only` and fails when the branch changes any file under `src/`. The test stays in the suite after merge, so any later branch that edits `src/` (for example `src/app.js`) fails `npm test`.

**Cause**: Fix round 1 step 1 put a check for this branch only ("the branch changes no file under `src/`") into a permanent test. That check depends on the git state of the branch, not on the code. It is not deterministic across branches.

**Fix** (no app code change, no spec change):
1. Build removes the git-diff / `src/` part from that test (the `child_process` import, the `git diff` call and the `src/` assert) and renames the test to drop "no src/ change". The static part stays: every declaration in the map cursor block of `styles.css` is a `cursor` property, and the block has no `touch-action`, `pointer-events` or `user-select`. This still guards FR-008 touch behaviour.
2. The "no `src/` change" fact for this branch is checked by the review only (plan.md step 4 above), not by a test. Fix round 1 step 1 is changed by this round.

**Files**: `test/map-cursor.test.js` (edit one test). No dependency. `spec.md` unchanged: what the user gets does not change.
