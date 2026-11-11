# Quickstart: validate the Reset view button

## Prerequisites

- Node.js ≥ 18 (for `node --test`) and Python 3 (for the static server)
- A desktop browser with devtools (responsive mode for the small-screen check)
- Internet access to unpkg.com, tile.openstreetmap.org, nominatim.openstreetmap.org and routing.openstreetmap.de

## 1. Unit tests

```bash
npm test
```

Expected after implementation: all tests pass, including the `test/startview.test.js` cases listed in [contracts/start-view-helper.md](./contracts/start-view-helper.md). Before `createStartView` is added to `src/geo.js`, `test/startview.test.js` fails (it is written first, on purpose) and every other suite passes.

## 2. Run the app

```bash
npm start   # serves http://localhost:8000
```

Open http://localhost:8000. `map` is a module-scoped variable and is not on `window`, so check views by eye: look at the landmarks and the zoom level shown by the tile detail.

## 3. Manual scenarios

Contract to check against: [contracts/reset-view-control.md](./contracts/reset-view-control.md).

| # | Steps | Expected |
|---|-------|----------|
| A (US1-1, 1-4) | Allow location. Wait for the map to center on you (zoom 15). Pan and zoom far away. Click "Reset view". | Map is back on your first-fix position at zoom 15 within 1 s. |
| B (US1-5) | Block location in the browser's site settings, reload, pan/zoom, click "Reset view". | Map shows Paris at zoom 13. |
| C (US1-2) | Right after load, click "Reset view". | Nothing visibly changes; no console errors. |
| D (US1-3, FR-005) | Search a place, pick it, wait for routes and pleasure. Select route 2. Switch mode if you like. Click "Reset view". | Only the view changes. Input text, destination marker, routes, the selected route, mode, pleasure labels and status text are all unchanged. |
| E (FR-004) | In devtools → Sensors, set a location, load, then change the location to another city. Click "Reset view". | Map goes back to the **first** location, not the new one. |
| F (edge) | Pick a destination and click "Reset view" right away while the map is zooming to the routes. Then click it 5 times quickly. | Map ends at the starting view; no errors. |
| G (US2) | Press Tab until the control has focus, then press Enter, then Space (after panning again). | Focus ring is visible; each key resets the view. A screen reader (or the devtools Accessibility pane) reports a "button" named "Reset view". |
| H (FR-007) | Devtools responsive mode at 360×640, then at 320×568 (the smallest supported viewport), with search results and routes shown. | Control is bottom-right, above the attribution, fully visible, and does not cover the panel or the zoom control. |
| I (FR-010) | Turn on "prefers-reduced-motion: reduce" in devtools Rendering, pan away, click "Reset view". | The map jumps to the starting view with no animation. |
