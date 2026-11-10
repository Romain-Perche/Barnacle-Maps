# Quickstart: Validate "Reset view"

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/reset-view.md](./contracts/reset-view.md)

## Prerequisites

- Node.js 18+ (for `node --test`) and Python 3 (for the static server).
- A desktop browser with dev tools; network access to unpkg.com and tile.openstreetmap.org.

## 1. Automated tests

```bash
npm test
```

Expected (after implementation): all tests pass, including the new `test/view.test.js` cases for
`startingView` (located → first fix at zoom 15; no fix or invalid fix → default view; inputs not
mutated) and `test/reset-view.integration.test.js` (the control under a fake browser and fake
Leaflet). Before implementation those two suites fail and the existing suites pass.

The AI scenarios in `tests/ai/` (US1 and US2) are run by an agent in a real browser; they need
network access to unpkg.com.

## 2. Run the app

```bash
npm start   # http://localhost:8000 (localhost is required for geolocation)
```

## 3. Manual scenarios

Use dev tools → Sensors (Chrome) to override the location, e.g. Lyon `45.7640, 4.8357`.
`map` is not a global (app.js is a module), so check the view visually: note the starting view
(center and street detail) right after load, before panning.

| # | Steps | Expected | Spec |
|---|-------|----------|------|
| 1 | Allow location. Wait for the map to center on you. Pan and zoom away. Press **Reset view**. | Map returns to your location at the same close zoom as when it opened. | US1 #1–3, FR-002 |
| 2 | Block location (or reload with "Location unavailable"). Pan/zoom. Press **Reset view**. | Map returns to Paris at the default zoom. | US1 #4 |
| 3 | Press **Reset view** again right away. | View unchanged, no console errors. | US1 #5, FR-007 |
| 4 | With location allowed, change the sensor location to somewhere else (the blue dot moves). Pan away. Press **Reset view**. | Map returns to the *first* location, not the new one. | FR-002a |
| 5 | Search a place, pick it so routes are drawn, select route 2, switch mode if you like. Press **Reset view**. | Only the view changes; routes, selection, markers, panel text and status are as before. | US1 #6, FR-003, SC-004 |
| 6 | Scroll-zoom quickly and press **Reset view** mid-animation; press it 5 times fast. | Map always ends at the starting view; no errors. | Edge cases |
| 7 | Press Tab until the button has focus; press Enter; pan away; press Space. | Button gets a visible focus ring; both keys reset the view. | US2 #1, FR-004, SC-005 |
| 8 | With a screen reader (or dev tools → Accessibility pane), focus the button. | Announced as button "Reset view". | US2 #2, FR-005 |
| 9 | Dev tools device mode (e.g. 375×667, touch). Tap the button. Check layout at 375 px and 1280 px wide. | Tap resets; button visible bottom-right, above the attribution, not under the panel or zoom buttons. | US2 #3, FR-006 |
| 10 | Click the button while a route line is under it; double-click it; scroll the wheel over it. | No route selection change; the map does not zoom or pan. | FR-003a |
| 11 | Dev tools → Rendering → emulate `prefers-reduced-motion: reduce`. Pan away, press the button. | Map jumps to the starting view without animation. | Assumptions |
| 12 | After pressing with the keyboard, look at focus; measure the button in dev tools. | Focus stays on the button; button is at least 44 × 44 px. | FR-004, FR-004a |
