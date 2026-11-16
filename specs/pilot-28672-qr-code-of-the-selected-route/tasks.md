---

description: "Task list for QR Code of the Selected Route"
---

# Tasks: QR Code of the Selected Route

**Input**: Design documents from `/specs/pilot-28672-qr-code-of-the-selected-route/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/phone-link.md, quickstart.md

**Tests**: The write-tests gate has already written them. They fail until the feature is built, and they are recorded below as completed `[X]` tasks:
- Deterministic tests in `test/`, run with `node --test test/`: `phone-link`, `qr-image`, `phone-card` and `phone-updates`.
- AI scenarios in `tests/ai/`.

Implementation must make the tests pass **without changing them**. The existing tests, including the structure checks L1–L8 in `test/routes.test.js`, must keep passing.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Paths are relative to the repository root (a flat static app: `index.html`, `styles.css`, `src/`, `test/`, `tests/ai/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Load the QR code library the same way Leaflet is loaded (no build step, no npm dependency).

- [ ] T001 In `index.html`, add this exact line right after the Leaflet `<script>` and before `<script type="module" src="src/app.js">`: `<script src="https://unpkg.com/qrcode-generator@2.0.4/dist/qrcode.js" integrity="sha384-e9EFD6BGC90bkW9aDV5xbbBfzwN7G8YImHao2lfLVKV/hPB0E0go+H3I64h7oHtA" crossorigin="anonymous"></script>`. It defines the global `window.qrcode` (research.md R2). Do not add anything to `package.json` (test L8 requires no `dependencies` and no `devDependencies`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure helpers that build the phone link and the QR image. Both stories depend on them.

**⚠️ CRITICAL**: Finish this phase before starting either user story.

- [ ] T002 [P] In `src/geo.js`:
  - Add `osmEngine: "fossgis_osrm_foot"` to `TRAVEL_MODES.foot` and `osmEngine: "fossgis_osrm_car"` to `TRAVEL_MODES.car`. Leave `label`, `base` and `profile` unchanged.
  - Add and export `phoneRouteUrl(from, to, mode = "foot", base = "https://www.openstreetmap.org")`:
    1. Return `null` unless `from` and `to` exist and all four of `lat`/`lng` are finite numbers (`Number.isFinite`).
    2. Set `const m = TRAVEL_MODES[mode] || TRAVEL_MODES.foot`.
    3. Return `` `${base}/directions?` + new URLSearchParams({ engine: m.osmEngine, route: `${from.lat.toFixed(5)},${from.lng.toFixed(5)};${to.lat.toFixed(5)},${to.lng.toFixed(5)}` }) ``. The order is lat,lng (the opposite of OSRM). Use exactly 5 decimals (FR-004).
  - Add a one-line comment saying that the link opens the OSM directions page with the same OSRM engines as the app, and that it does not carry stops.
  - Do not write the words `document`, `fetch(` or `window` anywhere in `src/geo.js`, not even in comments (test L6).
- [ ] T003 [P] Create `src/qr.js`, exporting `qrImageSrc(factory, text)`:
  1. If `typeof factory !== "function"` or `!text`, return `null`.
  2. Otherwise, inside `try`, run `const qr = factory(0, "L"); qr.addData(text); qr.make(); return "data:image/svg+xml," + encodeURIComponent(qr.createSvgTag({ cellSize: 1, margin: 4, scalable: true }));`.
  3. In `catch`, return `null`.

  Add a header comment saying the encoding comes from the qrcode-generator library (FR-009) and that `null` means "don't show the QR area" (FR-010).
- [ ] T004 Run `npm test`. `test/phone-link.test.js`, `test/qr-image.test.js` and `test/phone-updates.test.js` must now pass, and every existing test must still pass. Only `test/phone-card.test.js` may still fail; US1 fixes it.

**Checkpoint**: The link and QR helpers are proven without a browser (FR-011). The UI work can start.

---

## Phase 3: User Story 1 - Continue the selected route on my phone (Priority: P1) 🎯 MVP

**Goal**: When routes are displayed, a QR card (Design A) under the route summary encodes the OSM directions link for the start, destination and mode of those routes.

**Independent Test**: Run `npm start`, allow location and pick a destination on foot. The card shows under `#status`, and "Open on your phone" points to `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=<start>%2C…%3B<dest>…`. Scanning it opens the same trip on a phone. Picking another route keeps the card (`tests/ai/us1-continue-on-phone.md`; quickstart V1–V4, V7, V10, V11).

### Tests for User Story 1 (written, failing until built)

- [X] T015 [US1] Contract test for the phone link builder in test/phone-link.test.js (covers FR-002, FR-003, FR-004, FR-005, FR-011, US1 scenario 1, 2, edge cases "no destination or position", "journey with stops")
- [X] T016 [US1] Contract test for the QR image helper in test/qr-image.test.js (covers FR-005, FR-006, FR-009, FR-010, US1 scenario 1)
- [X] T017 [US1] Contract test for the phone card markup, library tag and styles in test/phone-card.test.js (covers FR-001, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, edge case "small screens")
- [X] T018 [US1] AI test: continue the selected route on my phone in tests/ai/us1-continue-on-phone.md (covers FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, SC-001, SC-003, SC-004, US1 scenario 1, 2, 3, edge cases "journey with stops", "small screens")

### Implementation for User Story 1

- [ ] T005 [US1] In `index.html`, add the phone card right after `<p id="status" role="status"></p>` inside `#panel`. Use exactly this markup:

  ```html
  <div id="phone" hidden>
    <img id="phone-qr" width="120" height="120" alt="QR code to open this route on your phone">
    <div class="phone-text">
      <strong>Continue on your phone</strong>
      <span>Scan with your phone camera.</span>
      <a id="phone-link" target="_blank" rel="noopener">Open on your phone ↗</a>
      <span id="phone-stops" hidden>Stops are not included in the phone link.</span>
    </div>
  </div>
  ```

  This covers FR-001, FR-007 and FR-008.
- [ ] T006 [P] [US1] In `styles.css`:
  - Add `max-height: calc(100% - 24px); overflow-y: auto; box-sizing: border-box;` to the existing `#panel` rule, so the panel scrolls on small screens.
  - Add the Design A card styles:

    ```css
    #phone { display: flex; gap: 10px; align-items: center; margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #e0e0e0; }
    #phone[hidden], #phone-stops[hidden] { display: none; }
    #phone-qr { flex: none; border: 1px solid #ddd; background: #fff; }
    .phone-text { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
    #phone-link { color: #1a73e8; font-size: 13px; }
    #phone-stops { font-size: 12px; color: #666; }
    ```

- [ ] T007 [US1] In `src/app.js`:
  - Import `phoneRouteUrl` from `./geo.js` (keep the import list alphabetical) and `qrImageSrc` from `./qr.js`.
  - Next to the other `getElementById` constants, add `phoneCard` (`#phone`), `phoneQr` (`#phone-qr`), `phoneLink` (`#phone-link`) and `phoneStops` (`#phone-stops`).
  - Add `function showPhone(from, place, m, st)`:
    1. `const url = phoneRouteUrl(from, place, m); const src = url && qrImageSrc(window.qrcode, url);`
    2. If `!src`, set `phoneCard.hidden = true` and return (FR-010: no broken image, no throw).
    3. Otherwise set `phoneQr.src = src`, `phoneLink.href = url`, `phoneStops.hidden = st.length === 0` and `phoneCard.hidden = false`.
- [ ] T008 [US1] In `src/app.js` `updateRoutes()`:
  - Right after the `if (!position) { … }` block, add `const from = position;` (FR-003: this is the start of the displayed routes).
  - Right after `drawRoutes(routes, m);`, call `showPhone(from, place, m, st);`. That point is already behind the `seq !== routeSeq` and empty-routes guards.
  - Do not change `selectRoute()`. The link doesn't depend on which alternative is picked (US1 scenario 3).
- [ ] T009 [US1] Run `npm test`: all tests must pass, including all of `test/phone-card.test.js`. Then run the scenarios in `tests/ai/us1-continue-on-phone.md`. Quickstart V3 (a real phone scan) also confirms the OSM URL format.

**Checkpoint**: User Story 1 works on its own. It is a shippable MVP.

---

## Phase 4: User Story 2 - QR code follows my changes (Priority: P2)

**Goal**: The QR card never shows an outdated trip. It is hidden during any recompute, failure, missing position or missing destination, and it comes back only for the new routes. It also always uses the start the displayed routes were computed from.

**Independent Test**: With a card shown on foot, switch to Car. The card disappears while computing, then shows `engine=fossgis_osrm_car`. Choose another destination: the old card disappears, and the new one encodes the new destination. A failure, no route, or no position: no card (`tests/ai/us2-qr-follows-changes.md`; quickstart V5, V6, V8, V9).

### Tests for User Story 2 (written, failing until built)

- [X] T019 [US2] Contract test for QR link updates on mode and destination change in test/phone-updates.test.js (covers FR-003, FR-005, SC-005, US2 scenario 1, 2, edge case "live position keeps moving")
- [X] T020 [US2] AI test: QR code follows my changes in tests/ai/us2-qr-follows-changes.md (covers FR-003, FR-005, FR-010, SC-001, SC-005, US2 scenario 1, 2, 3, edge cases "no destination or position", "routing fails", "live position keeps moving", "library fails to load")

### Implementation for User Story 2

- [ ] T010 [US2] In `src/app.js` `clearRoutes()`, add `phoneCard.hidden = true;`. `updateRoutes()` calls `clearRoutes()` first, so the card is hidden while computing, after a routing failure, when no route is found, while waiting for position and when there is no destination (FR-005, US2 scenarios 2–3).
- [ ] T011 [US2] In `src/app.js`, change `fetchRoutes(place, seq, m, st = [])` to `fetchRoutes(place, seq, m, st = [], from = position)`. Use `from` instead of `position` in both `routeUrl(...)` calls and in `detourWaypoints(...)`. In `updateRoutes()`, call `fetchRoutes(place, seq, m, st, from)`. This way the main and detour requests and the QR link all use the same start, even if `watchPosition` updates `position` in between (the "live position keeps moving" edge case). Leave `scorePleasure` unchanged. Keep the string `Promise.allSettled` in `app.js` (test L4).
- [ ] T012 [US2] Run `npm test` (it must pass). Then run the scenarios in `tests/ai/us2-qr-follows-changes.md`.

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T013 [P] In `README.md`, add a bullet after the "Stops" bullet: `- Phone: a QR code under the route summary opens the same trip (start, destination, walking or car) on the OpenStreetMap directions page on your phone; stops are not included. Generated with [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (loaded from unpkg).` Change "No build step or dependencies." to "No build step or npm dependencies (Leaflet and qrcode-generator load from a CDN)." Keep the existing mentions of "up to 3" routes and "pleasure" (test L3).
- [ ] T014 Run `npm test`, both AI scenario files and the full quickstart.md checklist (V1–V11) once more. Confirm that the search, route alternatives, pleasure indicator, stops and mode switch behave exactly as before.

---

## Fix round 1: bigger QR code and the link as text

**Goal**: the code itself is at least 200 CSS px wide (it was about 100 px), and the full link shows as text under it (FR-001, FR-006, FR-007; plan.md "Fix round 1").

**Tests (written, failing until built)**: `test/phone-card.test.js` ("the QR image is 245 x 245…", "the QR code itself is at least 200 CSS px wide", "the full link shows as selectable text under the QR code", "styles.css lays out the card as Design A" (column), "app.js writes the link text") and `tests/ai/us1-continue-on-phone.md` Scenario 1.

- [ ] T021 In `index.html`, replace the `#phone` card with exactly this markup (no `.phone-text` wrapper):

  ```html
  <div id="phone" hidden>
    <strong>Continue on your phone</strong>
    <span>Scan with your phone camera.</span>
    <img id="phone-qr" width="245" height="245" alt="QR code to open this route on your phone">
    <code id="phone-url"></code>
    <a id="phone-link" target="_blank" rel="noopener">Open on your phone ↗</a>
    <span id="phone-stops" hidden>Stops are not included in the phone link.</span>
  </div>
  ```

- [ ] T022 In `styles.css`, replace the `#phone`, `#phone-qr` and `.phone-text` rules with these, and keep `#phone[hidden]`, `#phone-link` and `#phone-stops`:

  ```css
  #phone { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin: 8px 0 0; padding-top: 8px; border-top: 1px solid #e0e0e0; font-size: 14px; }
  #phone-qr { flex: none; border: 1px solid #ddd; background: #fff; }
  #phone-url { max-width: 100%; font-size: 12px; color: #444; word-break: break-all; user-select: all; }
  ```

- [ ] T023 In `src/app.js`, add `const phoneUrl = document.getElementById("phone-url");` next to `phoneLink`. In `showPhone`, add `phoneUrl.textContent = url;` next to `phoneLink.href = url;`. Do not use `innerHTML`.
- [ ] T024 Run `npm test` (all tests must pass). Then run `tests/ai/us1-continue-on-phone.md` Scenarios 1 and 6, and scan the code with a real phone at arm's length from a laptop screen (quickstart V1, V3).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: no dependencies.
- **Foundational (T002–T004)**: T002 and T003 can run in parallel. T004 comes after both. This phase blocks both stories.
- **US1 (T005–T009)**: needs T001 and Phase 2. T006 can run in parallel with T005. T007 comes after T005. T008 comes after T007. T009 comes last.
- **US2 (T010–T012)**: needs Phase 2 and T007 (`phoneCard` and `showPhone` exist). T010 and T011 both edit `src/app.js`, so do them one after the other.
- **Polish (T013–T014)**: after the stories.
- **Tests (T015–T020)**: already done. They are the acceptance gate for each phase.

### User Story Dependencies

- **US1 (P1)**: depends only on Setup and Foundational.
- **US2 (P2)**: builds on the card elements from US1 (T007). It can be tested on its own once they exist.

### Parallel Opportunities

- T002 (`src/geo.js`) ∥ T003 (`src/qr.js`)
- T005 (`index.html`) ∥ T006 (`styles.css`)
- T013 (`README.md`) ∥ any remaining US2 validation

---

## Parallel Example: Foundational + User Story 1

```bash
Task: "T002 Add osmEngine + phoneRouteUrl in src/geo.js"
Task: "T003 Create qrImageSrc in src/qr.js"

Task: "T005 Add #phone card markup in index.html"
Task: "T006 Add Design A card styles + #panel scroll in styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 (library tag), then T002–T004 (helpers; the helper tests now pass).
2. T005–T009: the card shows the right QR code for the displayed routes.
3. **Stop and validate**: run the US1 AI scenarios and scan with a phone (quickstart V3).

### Incremental Delivery

1. Add US2 (T010–T012): hide on recompute, keep the start consistent. This means no stale QR code.
2. Polish (T013–T014): README and a full regression check.

---

## Notes

- Choices made without asking (factory run):
  - The stops note (FR-008) is in US1, because it is part of what the card shows.
  - The `from` capture for `fetchRoutes` is in US2 (consistency when position changes).
  - The `#panel` scroll fix is in US1 (T006), because `test/phone-card.test.js` checks it together with the card styles.
- Commit after each phase.
- No change to `package.json`.
