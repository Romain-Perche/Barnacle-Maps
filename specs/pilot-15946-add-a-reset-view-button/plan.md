# Implementation Plan: Reset View Button

**Branch**: `factory/pilot-15946-add-a-reset-view-button` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-15946-add-a-reset-view-button/spec.md`

## Summary

Add a "Reset view" button on the map that returns it to its *starting view*. The starting view is the default view (central Paris, zoom 13). The first time the app auto-centers on the user's location (zoom 15), that location view replaces it, once. After that it never changes. The button only calls `map.setView(...)`. It does not touch anything listed in FR-005 (search input and results, routes, selected route, travel mode, status, both markers, open popups).

Technical approach:
- A small pure module `src/view.js` exports `createStartView(defaultView)`. It holds the starting view and a one-shot `settle(lat, lng, zoom)` transition. It is unit-tested with `node --test`.
- `src/app.js` uses it in place of the current `centered` boolean in `onPosition`. It also adds a custom Leaflet control (`L.Control`) at `bottomright` that holds a native `<button>` named "Reset view".
- `styles.css` gets a few rules so the control matches Leaflet's `leaflet-bar` look, is 44×44 px and has a visible focus ring. It also caps `#panel`'s height (`max-height: calc(100% - 108px)`, `overflow-y: auto`) so the bottom 96px of the map always stays free for the button (FR-012).
- Focus stays on the button after a reset. `setView` interrupts any running pan/zoom/inertia animation. Route requests in flight are not touched (FR-014).
- Checklist gate (behavior.md, 2026-11-10): the icon is an inline SVG circular arrow (~22px) instead of the ⟲ glyph; the focus outline is drawn inside the button (`outline-offset: -2px`); `@media (forced-colors: active)` uses system colors; under `prefers-reduced-motion: reduce` the reset calls `setView(..., { animate: false })` (FR-015); the handler wraps the reset in `try/catch` and logs to the console (FR-018); `src/view.js` also rejects out-of-range lat/lng/zoom with `TypeError`.

## Technical Context

**Language/Version**: JavaScript (ES modules, browser), Node.js built-in test runner for unit tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN, global `window.L`), OpenStreetMap tiles. No new dependencies.

**Storage**: N/A (the starting view is in-memory and recomputed on every load, per the spec assumptions)

**Testing**: `npm test` → `node --test test/`. Three layers (analyze gate I2, 2026-11-10):
- *Unit*: `test/view.test.js` tests `src/view.js` (contracts/start-view.md cases 1–6).
- *Contract and integration, no browser*: `test/support/fake-browser.js` is a test-only fake DOM, fake Leaflet (`window.L`), geolocation, `matchMedia` and `fetch`. Its `bootApp()` loads the real `src/app.js`, records every Leaflet call and DOM mutation, and drives the button. `test/reset-view-control.test.js` checks the control's DOM and parses `styles.css`; `test/reset-view.us1/us2/us3.integration.test.js` check the reset per user story. No new dependencies.
- *AI tests*: `tests/ai/us1-…`, `us2-…`, `us3-….md` are headless-Playwright scenarios for real layout, animation, viewport sizes, forced colors and 200% zoom. They are run against the served app (`npm start`) in the Polish phase. [quickstart.md](./quickstart.md) stays the manual check (screen reader spot check, SC-001 timing).

The implementation MUST pass all of `test/` and MUST NOT rewrite these test files. Constraints the tests impose:
- The button is a real DOM element created with `L.DomUtil.create` or `document.createElement` (the harness throws if "Reset view" exists only as an `innerHTML` string). The SVG inside it may be set with `innerHTML`.
- The control is a `L.Control` at `bottomright` whose container has `leaflet-bar reset-view-control`, with `L.DomEvent.disableClickPropagation` and `disableScrollPropagation` on it.
- The click handler makes exactly one `map.setView` call and no other Leaflet call, changes no DOM, calls no `focus()`, never uses `flyTo`, passes `{ animate: false }` when `matchMedia("(prefers-reduced-motion: reduce)")` matches, and catches errors with one `console.error`.
- `styles.css` uses the literal values the contract test parses: `.reset-view` ≥ 44×44 px, `#fff` and `:hover` `#f4f4f4`, no `:active`/disabled rule, `:focus-visible` `outline: 2px solid #1a73e8` with `outline-offset: -2px`, a `@media (forced-colors: active)` block with ButtonFace/ButtonText/Highlight, and `#panel` keeps `top: 12px` with `max-height: calc(100% - <N>px)` and `overflow-y: auto`, where the free strip N − 12 (minus 2× padding unless `box-sizing: border-box`) is ≥ 96px.

**Target Platform**: Modern desktop and mobile browsers. Served statically (`npm start` → `python3 -m http.server 8000`).

**Project Type**: Single-page static web app (no build step)

**Performance Goals**: The reset finishes in < 1 s (SC-001), measured to Leaflet's `moveend` (tiles excluded) in Chrome desktop with 4× CPU throttling. This is one `setView` call, and Leaflet's pan/zoom animation is ~250 ms.

**Constraints**: No build step and no new dependencies. Free strip at the bottom of the map ≥ 96px (FR-012). Instant reset under reduced motion (FR-015), system colors in forced-colors mode (FR-016), usable at 200% browser zoom (FR-017). The control is at least 44×44 px (FR-011), and its box must not intersect `#panel` or other map controls, with ≥ 8px between them at 360×640, 375×667, 667×375 and 1280×800 (FR-008, SC-005). WCAG 2.1 AA non-text contrast ≥ 3:1 for the icon and focus outline (FR-013).

**Scale/Scope**: 1 new module (~25 LOC), ~30 LOC in `app.js`, ~15 LOC CSS. Tests already written by `/write-tests`: 5 test files + 1 harness under `test/`, 3 AI scenario files under `tests/ai/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled Spec Kit template. It defines no principles, so there are no project-specific gates. The plan follows the conventions already in the repo instead:

| Implicit convention (from repo) | Status |
|---|---|
| No build step, no runtime dependencies (README) | ✅ No new deps. Plain ES module. |
| Pure logic lives in importable modules tested with `node --test` (`src/geo.js` + `test/*.test.js`) | ✅ Start-view logic goes in `src/view.js` with `test/view.test.js` |
| Accessible controls (existing `aria-label`, `aria-pressed`, `role="status"`) | ✅ Native `<button>` with `aria-label`/`title` "Reset view" |

**Pre-design gate**: PASS (nothing to violate). **Post-design re-check**: PASS. The design adds one small module and no new complexity.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-15946-add-a-reset-view-button/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── start-view.md        # src/view.js module contract
│   └── reset-view-control.md # UI contract for the on-map button
├── checklists/requirements.md, checklists/ux.md, checklists/behavior.md, checklists/consistency.md
├── analyze-report.md    # /speckit-analyze output
└── tasks.md             # Phase 2 output (/speckit-tasks – not created here)
```

### Source Code (repository root)

```text
index.html               # unchanged (control is created by Leaflet in app.js)
styles.css               # + .reset-view control styles (44×44, hover, inset focus ring, forced-colors), #panel max-height + scroll
src/
├── app.js               # use createStartView; replace `centered`; add ResetViewControl
├── geo.js               # unchanged
└── view.js              # NEW: createStartView(defaultView)
test/
├── view.test.js                          # NEW (written): unit tests for createStartView
├── reset-view-control.test.js            # NEW (written): control DOM + styles.css contract
├── reset-view.us1.integration.test.js    # NEW (written): US1 reset behavior on the real app.js
├── reset-view.us2.integration.test.js    # NEW (written): US2 nothing but the view changes
├── reset-view.us3.integration.test.js    # NEW (written): US3 keyboard, name, focus
└── support/fake-browser.js               # NEW (written): test-only fake DOM + Leaflet harness
tests/ai/
├── us1-return-to-starting-view.md        # NEW (written): headless Playwright scenarios
├── us2-reset-without-losing-work.md
└── us3-accessible-control.md
```

**Structure Decision**: Keep the existing single-project layout (`src/` + `test/`). The start-view logic goes in its own module (`src/view.js`) rather than `geo.js`. `geo.js` handles geography and routing, while this is map-view state. A separate module also stays importable in Node without Leaflet. The test files above already exist and fail until `src/view.js`, the control and the CSS exist; the implementation makes them pass without editing them.

## Complexity Tracking

No violations. Nothing to justify.
