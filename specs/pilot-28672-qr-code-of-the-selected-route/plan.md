# Implementation Plan: QR Code of the Selected Route

**Branch**: `factory/pilot-28672-qr-code-of-the-selected-route` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/pilot-28672-qr-code-of-the-selected-route/spec.md`

## Summary

When routes are displayed, show a QR card under the route summary (Design A). The QR code encodes a link to the public OpenStreetMap directions page, made of the start position used for the routes, the destination and the travel mode. That page uses the same OSRM engines as the app.

- **Link building**: `phoneRouteUrl` goes in `src/geo.js`. It is pure and unit-tested.
- **QR generation**: the well-known **qrcode-generator 2.0.4** library, loaded from unpkg like Leaflet (pinned, with SRI). The output is an SVG data URL shown in an accessible `<img>`.
- **Lifecycle**: the card is hidden by `clearRoutes()` and shown only after the current request draws its routes. If the library is missing, the card stays hidden.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules) in the browser; Node 18+ for tests

**Primary Dependencies**: Leaflet 1.9.4 (existing, CDN); **qrcode-generator 2.0.4** (new, CDN `<script>` with SRI; see [research.md](research.md) R2)

**Storage**: N/A

**Testing**: `node --test test/` (built-in runner, `node:assert/strict`); new `test/phone-link.test.js`, `test/qr-image.test.js`, `test/phone-card.test.js`, `test/phone-updates.test.js` (already written by the write-tests gate; failing until built); AI scenarios in `tests/ai/`

**Target Platform**: Modern desktop browsers (the app); any phone browser (the target of the scanned link)

**Project Type**: Static single-page web app, no build step

**Performance Goals**: Generating the QR code takes well under 50 ms per routes refresh (one short string). It adds no network request per route; the library loads once (about 57 kB)

**Constraints**:
- No build tooling and no npm dependencies.
- The QR encoding must come from a library (FR-009).
- The app must keep working if the library fails to load (FR-010).
- The QR code is at least about 120 CSS px with a quiet zone (FR-006).
- Coordinates have 5 or more decimals (FR-004).

**Scale/Scope**: One new card in the panel. The changes:
- one new helper in `geo.js`;
- one new small module `src/qr.js`;
- about 30 lines in `app.js`;
- markup in `index.html`;
- about 10 lines of CSS;
- four test files (already written);
- a README line.

No NEEDS CLARIFICATION remains. Every open choice was resolved in [research.md](research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template: it has placeholder principles only and no ratified rules. **No constitutional gates apply.** Instead, the plan follows the project's own documented conventions (README, existing code):

| Convention | Plan |
|------------|------|
| No build step, no dependencies | ✅ The library is loaded by a CDN `<script>` like Leaflet; nothing is added to `package.json` |
| Pure, testable helpers in modules; DOM wiring in `app.js` | ✅ `phoneRouteUrl` and `qrImageSrc` are pure; the QR factory is injected |
| Tests with `node --test`, no browser or network | ✅ The new `test/*.test.js` files use a stub factory and read `index.html`/`styles.css` as text |
| Existing behaviours unchanged | ✅ The only change to existing logic: `fetchRoutes` gets the captured start `from` instead of reading `position` again (same value; fixes start drift between the main and detour requests) |

**Post-design re-check (after Phase 1)**: still passes, with no violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-28672-qr-code-of-the-selected-route/
├── spec.md
├── design-options.html     # Design A chosen
├── plan.md                 # This file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   └── phone-link.md       # Phase 1: phoneRouteUrl, qrImageSrc, phone card UI
├── checklists/requirements.md
└── tasks.md                # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
index.html        # + qrcode-generator <script> (pinned, SRI) before app.js; + #phone card after #status
styles.css        # + #phone card styles (Design A); #panel max-height + overflow-y: auto
src/
├── geo.js        # + TRAVEL_MODES[*].osmEngine; + export phoneRouteUrl(from, to, mode)
├── qr.js         # NEW: export qrImageSrc(factory, text) → SVG data URL | null
└── app.js        # capture `from` in updateRoutes; hidePhone() in clearRoutes; showPhone(...) after drawRoutes
test/
├── phone-link.test.js    # NEW (written): phoneRouteUrl fixtures, osmEngine (contract §1)
├── qr-image.test.js      # NEW (written): qrImageSrc with stub/missing/throwing factory (contract §2)
├── phone-card.test.js    # NEW (written): library tag, card markup, Design A CSS, #panel scroll (contract §3)
└── phone-updates.test.js # NEW (written): US2 link changes on mode/destination
tests/ai/
├── us1-continue-on-phone.md   # NEW (written): AI scenarios for US1
└── us2-qr-follows-changes.md  # NEW (written): AI scenarios for US2
README.md         # + one bullet: "Phone: QR code to continue on your phone (OSM directions; stops not included)"
```

**Structure Decision**: Keep the existing flat layout: a static page, `src/` ES modules and `test/` with Node's test runner. No new directories.

## Design Details

1. **`src/geo.js`**
   - Add `osmEngine: "fossgis_osrm_foot"` and `osmEngine: "fossgis_osrm_car"` to the `TRAVEL_MODES` entries.
   - Add `phoneRouteUrl(from, to, mode = "foot", base = "https://www.openstreetmap.org")`. The behaviour is described in [contracts/phone-link.md](contracts/phone-link.md) §1.
2. **`src/qr.js`**: `qrImageSrc(factory, text)` as described in contract §2. It uses error correction `L`, an automatic version, a 4-module quiet zone and a scalable SVG. Any error gives `null`.
3. **`index.html`**
   - Add `<script src="https://unpkg.com/qrcode-generator@2.0.4/dist/qrcode.js" integrity="sha384-e9EFD6BGC90bkW9aDV5xbbBfzwN7G8YImHao2lfLVKV/hPB0E0go+H3I64h7oHtA" crossorigin="anonymous"></script>` after Leaflet's script.
   - Add the `#phone` card markup from contract §3 after `<p id="status">`.
4. **`src/app.js`**
   - `updateRoutes()`: once position is known, set `const from = position`. Pass it to `fetchRoutes(place, seq, m, st, from)`, which uses it instead of `position` for `routeUrl` and `detourWaypoints`.
   - `clearRoutes()`: set `phoneCard.hidden = true`.
   - New `showPhone(from, place, m, st)`:
     1. `url = phoneRouteUrl(from, place, m)`
     2. `src = url && qrImageSrc(window.qrcode, url)`
     3. If `!src`, keep the card hidden and return.
     4. Otherwise set `phoneQr.src = src`, `phoneLink.href = url`, `phoneStops.hidden = !st.length` and `phoneCard.hidden = false`.
   - Call `showPhone` right after `drawRoutes(routes, m)` (it is already behind the `seq === routeSeq` guard).
   - `selectRoute` is unchanged.
5. **`styles.css`**
   - `#phone { display:flex; gap:10px; align-items:center; margin:8px 0 0; padding-top:8px; border-top:1px solid #e0e0e0 }`
   - `#phone[hidden] { display:none }`
   - `#phone-qr { flex:none; border:1px solid #ddd }`
   - `.phone-text { display:flex; flex-direction:column; gap:4px; font-size:14px }`
   - `#phone-link { color:#1a73e8; font-size:13px }`
   - `#phone-stops { font-size:12px; color:#666 }`
   - `#panel { max-height: calc(100% - 24px); overflow-y: auto; box-sizing: border-box }`
6. **Tests**: already written before implementation (see [quickstart.md](quickstart.md)). Implementation must make them pass without changing them. The existing structure checks in `test/routes.test.js` (L6: no `document`, `fetch(` or `window` in `src/geo.js`; L8: no npm dependencies) must keep passing.

## Decisions Made Without Asking (factory run)

- **Library**: qrcode-generator 2.0.4, pinned with SRI on unpkg (research R2).
- **Error correction**: L, for bigger modules at 120 px (R3).
- **Coordinates**: exactly 5 decimals (R1).
- **Link and library failure**: if the QR code can't be built, the whole card is hidden, including the text link (FR-010: "the QR area is simply not shown").
- **Stops note wording**: "Stops are not included in the phone link."
- **OSM URL format**: written from known openstreetmap-website conventions, because the sandbox network blocked a live check. It is to be confirmed by quickstart V3.
- **Optional before-plan git hook**: skipped (working tree clean).

## Complexity Tracking

No violations. Nothing to justify.

## Fix round 1

**Problem** (AI review): the QR code is too small to scan from a phone held at arm's length in front of a laptop screen (about 96 px). The reviewer asks for a code at least 200 px wide, and the link shown as text under it.

**Cause**: the code follows FR-001 as it was written: a `120 × 120` image. The SVG includes the 4-module quiet zone on each side. Every phone link is 108–121 characters long, so qrcode-generator (level L, byte mode: version 5 holds 106 bytes, version 6 holds 134 bytes) always picks version 6, which has 41 modules. The image is 41 + 8 = 49 modules wide, so the code itself is only 120 × 41 / 49 ≈ 100 CSS px (≈ 2.45 px per module). The link is only available behind "Open on your phone ↗", and the user cannot read it.

**Fix** (option A, recommended):
- The QR image becomes `245 × 245` CSS px: 49 modules × 5 px. The code itself is 41 × 5 = 205 CSS px (≥ 200), with whole pixels per module.
- A 245 px code does not fit beside the text in the 360 px panel, so the card becomes a column: title, help line, QR image, the full link as selectable text (`<code id="phone-url">`), "Open on your phone ↗", stops note. The `.phone-text` wrapper is removed.
- `showPhone` also sets `phoneUrl.textContent = url`.
- The quiet zone (4 modules), level L, the library and the hide rules do not change. The panel already scrolls on small screens. The card is taller, which is fine.

**Rejected**: (B) a small code plus an "Enlarge" button that opens a big code in an overlay: one more click, and more code. (C) keep 120 px (the code matched the old spec): it does not fix the scan problem.

**Files to change**: `index.html` (card markup), `styles.css` (`#phone` column, `#phone-url`), `src/app.js` (`phoneUrl`). The tests are already updated: `test/phone-card.test.js` and `tests/ai/us1-continue-on-phone.md`.
