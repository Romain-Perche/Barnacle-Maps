---
description: "Task list for the search box clear button"
---

# Tasks: Clear button for the search box

**Input**: `/specs/pilot-85820-clear-button-for-the-search-box/` (plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md)

**Tests**: Not requested. The repo only unit-tests pure modules (`test/*.test.js`); this feature is DOM-bound, so verification is manual via quickstart.md. Run `npm test` to confirm nothing regresses.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Run `npm test` from the repo root to record the passing baseline (no files changed)

## Phase 2: Foundational (blocks all stories)

- [ ] T002 [P] In `index.html`, wrap `#search-input` in `<span class="search-box">` and add after it `<button type="button" id="search-clear" aria-label="Clear search" hidden>×</button>`, before the "Go" button (keeps DOM/tab order: input, ×, Go)
- [ ] T003 [P] In `styles.css`, add rules: `.search-box { position: relative; flex: 1; display: flex; }`; `#search-input { flex: 1; padding-right: 32px; }` (merge into the existing `#search-input` rule, keep `padding: 8px; font-size: 16px`); `#search-clear { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border: 0; background: none; color: #888; font-size: 18px; line-height: 1; cursor: pointer; padding: 0; }`; `#search-clear:hover { color: #333; }`; `#search-input::-webkit-search-cancel-button { display: none; -webkit-appearance: none; }`; `#search-input::-ms-clear { display: none; }`. Ensure `#search-clear[hidden] { display: none; }` wins over the display set above
- [ ] T004 In `src/app.js`, next to the other `getElementById` constants (~line 34-37), add `const clearBtn = document.getElementById("search-clear");` and `function syncClear() { clearBtn.hidden = input.value === ""; }` (button visible iff value is non-empty, including spaces-only)

**Checkpoint**: Page loads, no × visible, no errors.

## Phase 3: User Story 1 - Clear the search text in one tap (P1) 🎯 MVP

**Goal**: × appears while typing and clears text, results, status; cancels pending searches; refocuses the box.

**Independent Test**: quickstart.md checks 1-5, 7-9.

- [X] T015 [US1] Contract test for the button markup, tab order, CSS and click handler in test/clear-button.test.js (covers FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, US1 scenario 1, 2, 3, 4, 5)
- [X] T016 [US1] AI test: clear search text, pending search, status message, long text in tests/ai/us1-clear-search-text.md (covers FR-001 to FR-008, FR-010, FR-011, US1 scenario 1, 2, 3, 4, 5)
- [ ] T005 [US1] In `src/app.js`, call `syncClear()` at the start of the existing `input` event listener (~line 150) so typing, pasting and deleting update visibility
- [ ] T006 [US1] In `src/app.js`, add a `clearBtn` click listener after the `input` listener: `clearTimeout(suggestTimer); searchSeq++; input.value = ""; results.replaceChildren(); setStatus(""); syncClear(); input.focus();`. Do NOT touch `currentPlace`, `stops`, routes, `selectedRoute`, `mode`, markers, and do not submit the form
- [ ] T007 [US1] Manually verify quickstart.md checks 1-5 and 7-9 with `npm start` (pending-search cancel, status cleared, spaces-only, long text, single × in browsers)

## Phase 4: User Story 2 - Clear after choosing a destination (P2)

**Goal**: × shows when the app fills the box, and clearing keeps destination, routes and stops.

**Independent Test**: quickstart.md check 6.

- [X] T017 [US2] Contract test for syncing visibility after showRoute and Add as stop, and for the handler leaving destination, routes, stops and mode alone, in test/clear-button.test.js (covers FR-002, FR-008, US2 scenario 1, 2)
- [X] T018 [US2] AI test: clear after choosing a destination and after adding a stop in tests/ai/us2-clear-after-destination.md (covers FR-002, FR-008, US2 scenario 1, 2)
- [ ] T008 [US2] In `src/app.js` `showRoute()` (~line 295), call `syncClear()` right after `input.value = place.name;`
- [ ] T009 [US2] In `src/app.js` `runSearch()` "Add as stop" click handler (~line 135), call `syncClear()` right after `input.value = "";`
- [ ] T010 [US2] Manually verify quickstart.md check 6: pick a destination, × is visible, click ×; marker, routes, selected route and stops are unchanged

## Phase 5: User Story 3 - Keyboard and assistive technology (P3)

**Goal**: × is focusable, operable with Enter/Space, named "Clear search".

**Independent Test**: quickstart.md checks 10-11.

- [X] T019 [US3] Contract test for the button's type, accessible name and tab order in test/clear-button.test.js (covers FR-009, US3 scenario 1, 2)
- [X] T020 [US3] AI test: keyboard operation and accessible name in tests/ai/us3-keyboard-and-screen-reader.md (covers FR-007, FR-009, FR-010, US3 scenario 1, 2)
- [ ] T011 [US3] Confirm in `index.html` that `#search-clear` is a native `<button type="button">` with `aria-label="Clear search"` (done by T002; adjust only if missing) and in `styles.css` that it has no `outline: none` and a visible focus ring
- [ ] T012 [US3] Manually verify quickstart.md checks 10-11 (Tab reaches ×, Enter/Space clears and focus lands in the input, hit area ≥ 24×24 px at phone width)

## Phase 6: Polish

- [ ] T013 Run `npm test` and confirm it still passes
- [ ] T014 [P] Skim the diff of `index.html`, `styles.css`, `src/app.js` for stray changes; update `README.md` only if it documents search-box behaviour

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. T002 and T003 are parallel (different files); T004 is in `src/app.js` and parallel with both.
- US1 (T005-T007) needs T002-T004. US2 (T008-T010) needs T004 and is independent of US1's click handler. US3 needs T002-T003.
- T005, T006, T008, T009 all edit `src/app.js`: do them sequentially.

## Implementation Strategy

- **MVP**: Phases 1-3 (User Story 1). Then US2 (two one-line calls), then US3 verification, then polish.
- Total: 14 tasks (Setup 1, Foundational 3, US1 3, US2 3, US3 2, Polish 2).
