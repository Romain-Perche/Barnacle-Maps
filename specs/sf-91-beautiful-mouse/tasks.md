# Tasks: Beautiful Mouse Pointer

**Input**: `specs/sf-91-beautiful-mouse/` (plan.md, spec.md, research.md, data-model.md, quickstart.md)
**Tests**: `npm test` (`node --test test/`), static checks on `styles.css` and the SVG. Blueprint `ui/map-cursor@1` rules are tested in the story that first uses them. No outside services and no blueprint exceptions, so no schema or `docs/DECISIONS.md` tasks.

## Phase 1: Setup

- [x] T001 Create the directory `assets/` at the repo root (holds `assets/map-cursor.svg`)

## Phase 2: Foundational

None: the stories only touch `styles.css` and the new asset.

## Phase 3: User Story 1 - Barnacle map cursor over the map (P1) 🎯 MVP

**Goal**: the empty map shows the blue ring cursor, click point at the ring centre, crosshair fallback.
**Independent test**: `npm test` passes the new tests; in a browser the empty map shows the ring and a click opens the popup under its centre.

- [x] T002 [US1] Write `test/map-cursor.test.js` (node:test) with checks that: `assets/map-cursor.svg` exists and equals exactly the blueprint SVG (24x24; circles r=7 white stroke-width 4, r=7 `#2B00FF` stroke-width 2, r=2 `#2B00FF` fill with white stroke-width 1); `styles.css` contains `.leaflet-container` and `.leaflet-grab` with cursor `url("assets/map-cursor.svg") 12 12, crosshair`; that cursor value contains no `http` URL (FR-003). Run it and see it fail.
- [x] T003 [US1] Create `assets/map-cursor.svg` with exactly the SVG given in plan.md step 1
- [x] T004 [US1] Append a "map cursor" block to `styles.css` with `.leaflet-container, .leaflet-grab { cursor: url("assets/map-cursor.svg") 12 12, crosshair; }`; run `npm test`, T002 now passes

## Phase 4: User Story 2 - Standard pointers where a click does something else (P2)

**Goal**: grabbing while dragging, pointing hand on clickable map items, arrow on popup body, panel unchanged.
**Independent test**: `npm test` passes; manual checks of quickstart.md steps 4-5.

- [x] T005 [US2] Extend `test/map-cursor.test.js` with checks that `styles.css` has: `.leaflet-dragging .leaflet-grab` with `cursor: grabbing`; `cursor: pointer` for `.leaflet-interactive`, `.leaflet-bar a`, `.leaflet-popup-content button`, `.leaflet-control-attribution a` and `.leaflet-popup-close-button`; `cursor: auto` for `.leaflet-popup-content-wrapper` and `.leaflet-popup-tip`; no `map-cursor` in any `#panel`/`#results`/`#routes`/`#search-input` rule (FR-007). See them fail.
- [x] T006 [US2] Add the rules of plan.md step 2 (grabbing, pointer list, popup `auto`) to the map cursor block in `styles.css`; run `npm test`, all pass

## Phase 5: Polish

- [x] T007 Follow `quickstart.md` manually (`npm start`): ring over street/park/water, click within 2 px, drag, hover items, panel pointers, blocked-SVG crosshair; fix `styles.css` if any step fails
- [x] T008 Run the full `npm test` and confirm the existing tests still pass (FR-008)

## Dependencies

T001 → T002/T003 → T004 → T005 → T006 → T007, T008. US2 builds on US1's block in `styles.css`. T002 and T003 touch different files and can run in parallel; nothing else is parallel (same files).

## Strategy

MVP = User Story 1 (T001-T004). Then US2, then polish.

## Fix round 1: touch edge case not verified

- [x] T009 Extend `test/map-cursor.test.js` with a guard test: parse the "map cursor (ui/map-cursor@1)" block of `styles.css` and assert every declaration in it is a `cursor` property (no `touch-action`, `pointer-events`, `user-select`); assert `git diff origin/main...HEAD --name-only` lists no file under `src/` (skip that assert when git or `origin/main` is missing). This guards FR-008 touch behaviour; it passes with the current code and fails if a later edit adds a touch-affecting rule.
- [x] T010 Add step 7 to `specs/sf-91-beautiful-mouse/quickstart.md`: open the app with touch emulation (dev tools device mode, or Playwright `hasTouch: true, isMobile: true`); tap the empty map: the "Add stop here" popup opens at the tap point; drag with one finger: the map centre moves. Run it once and record the result.
- [x] T011 Run the full `npm test`; all tests pass.

## Fix round 2: guard test depends on the branch's git diff

- [x] T012 Check first: `grep -nE "child_process|git'|origin/main|src/" test/map-cursor.test.js` finds the git-diff `src/` check now (fails); it must find nothing after T013. Also confirm the static guard still bites: temporarily add `touch-action: none;` to a rule in the map cursor block of `styles.css`, run `npm test`, see the guard test fail, then revert that edit.
- [x] T013 In `test/map-cursor.test.js`, edit the test `map cursor block sets only cursor properties, no src/ change` (FR-008, edge case 2): remove the `node:child_process` import, the `git diff origin/main...HEAD` call and the `src/` assert; rename it to `map cursor block sets only cursor properties // covers FR-008, Edge case 2`. Keep the cursor-only and no `touch-action`/`pointer-events`/`user-select` asserts as they are. Make the function non-async if nothing awaits. This supersedes the `src/` part of T009. Edit no other test.
- [x] T014 Run the full `npm test`; all tests pass, and the T012 grep finds nothing.
