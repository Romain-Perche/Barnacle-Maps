# Quickstart: Validate the Reset view button

## Prerequisites

- Node.js ≥ 18 (for `node --test`) and Python 3 (for the static server)
- A browser with network access to unpkg.com and tile.openstreetmap.org

## 1. Unit tests

```bash
npm test
```

Expected: all existing tests pass, and `test/view.test.js` covers the cases listed in [contracts/start-view.md](./contracts/start-view.md).

## 2. Run the app

```bash
npm start   # http://localhost:8000
```

## 3. Manual scenarios

| # | Steps | Expected |
|---|---|---|
| A (US1-1) | **Deny** location. Pan and zoom far away. Press ⟲. | The map returns to central Paris at zoom 13. |
| B (US1-2) | **Allow** location (or set it in DevTools ▸ Sensors). Once it has auto-centered, pan and zoom away. Press ⟲. | The map returns to your location at zoom 15. |
| C (US1-3) | Right after load, press ⟲ again and again. | The view doesn't change. No console errors. |
| D (edge) | With location allowed, change the simulated location in DevTools ▸ Sensors. Press ⟲. | The map returns to the *first* location, not the new one. The blue marker is at the new location. |
| E (US2) | Search for "Louvre", pick it, wait for routes, select Route 2, switch to Car, zoom in. Press ⟲. | Only the view changes. The routes, the selected route, the panel, the mode, the status and the markers stay as they were. The starting view is still the one from scenario A or B. |
| F (US3) | Tab to the ⟲ button and press Enter. Pan away, then press Space. | Both keys reset the view. A visible focus ring is shown. |
| G (US3) | In DevTools ▸ Accessibility (or a screen reader), inspect the button. | Role: button. Name: "Reset view". Hovering shows the "Reset view" tooltip. |
| H (FR-008) | Device toolbar at 375×667. Search so the panel fills with results and routes. | The ⟲ button stays visible in the bottom-right, above the attribution, and doesn't overlap the panel or other controls. |

Exact check for SC-002: `map` is module-scoped, so it can't be reached from the console. While validating, add a temporary `console.log(map.getCenter(), map.getZoom())` in the reset handler. The logged values must match the starting view exactly.
