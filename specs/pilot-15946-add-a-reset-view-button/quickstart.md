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
| A2 (FR-018, SC-007) | Open DevTools ▸ Console and press ⟲ a few times. | No errors are logged. (The failure path itself is checked by code review: try/catch with `console.error`.) |
| B (US1-2) | **Allow** location (or set it in DevTools ▸ Sensors). Once it has auto-centered, pan and zoom away. Press ⟲. | The map returns to your location at zoom 15. |
| C (US1-3) | Right after load, press ⟲ again and again. | The view doesn't change. No console errors. |
| D (edge) | With location allowed, change the simulated location in DevTools ▸ Sensors. Press ⟲. | The map returns to the *first* location, not the new one. The blue marker is at the new location. |
| E (US2) | Search for "Louvre", pick it, wait for routes, select Route 2, switch to Car, zoom in. Press ⟲. | Only the view changes. The routes, the selected route, the panel, the mode, the status and the markers stay as they were. The starting view is still the one from scenario A or B. |
| F (US3) | Tab to the ⟲ button and press Enter. Pan away, then press Space. | Both keys reset the view. A visible focus ring is shown. |
| G (US3) | In DevTools ▸ Accessibility (or a screen reader), inspect the button. | Role: button. Name: "Reset view". Hovering shows the "Reset view" tooltip. |
| H (FR-008, SC-005) | In the device toolbar, try 360×640, 375×667, 667×375 and 1280×800. At each size, show 5 search results, then 3 routes, then an error status (e.g. go offline and search), then results with long names that wrap (e.g. search "Rue"). Then rotate 375×667 → 667×375 without reloading. | The ⟲ button stays fully visible in the bottom-right, above the attribution. Its box is ≥ 8px from the panel and from every control. The panel scrolls inside instead of growing over the button. |
| I (FR-011, FR-013, SC-006) | Inspect the button. | Its box is ≥ 44×44 px. The icon is an SVG, ~22×22 px. Hover is #f4f4f4. Keyboard focus shows a 2px #1a73e8 outline drawn inside the button's edge. |
| J (FR-006) | Tab to ⟲, press Enter, then press Tab again. | Focus stays on ⟲ after the reset. The next Tab moves on in the natural order (attribution links, then the panel). |
| K (FR-005) | Pick a destination so its popup opens, pan away, press ⟲. | The popup stays open (it may be off-screen). The status text doesn't change. |
| L (FR-014) | Fling the map so it keeps gliding, and press ⟲ during the glide. Then pick a destination and press ⟲ before the routes arrive. | The glide stops and the map ends at the starting view. The routes still load and the map then fits to them. |
| M (FR-002) | Double-click the ⟲ button, then scroll the mouse wheel over it. | The map only resets; it never zooms in or scrolls-zooms. |
| N (FR-012) | Show 5 results at 667×375. Scroll the panel with the wheel, by touch, and by Tab-ing through the results. | The panel scrolls inside; the focused result is scrolled into view. |
| O (FR-015) | DevTools ▸ Rendering ▸ Emulate `prefers-reduced-motion: reduce`. Pan away, press ⟲. | The map jumps instantly, with no animation. |
| P (FR-016) | DevTools ▸ Rendering ▸ Emulate `forced-colors: active`. Tab to ⟲. | The icon stays visible in the system text color, and the focus ring uses the highlight color. |
| Q (FR-017) | Set browser zoom to 200% at 1280×800. | The button is fully visible and usable; the panel scrolls inside. |
| R (FR-003) | Pan away, follow a link out (or navigate to another page) and press Back so the page is restored from the back/forward cache. Press ⟲. | The map returns to the starting view the page had. After a real reload, it starts over. |

Timing for SC-001: in Chrome desktop with DevTools ▸ Performance ▸ CPU 4× slowdown, record a press of ⟲; the time from the click to Leaflet's `moveend` is under 1 s (tile loading is not counted).

SC-003 is checked with no route request in flight (scenario E after the routes have loaded); scenario L covers the in-flight case.

Exact check for SC-002: `map` is module-scoped, so it can't be reached from the console. While validating, add a temporary `console.log(map.getCenter(), map.getZoom())` in the reset handler (validation only; never commit it). The logged zoom must be equal, and the center must be within 0.000001° of latitude and longitude of the starting view. For SC-004, check role and name in the DevTools accessibility tree and do one spot check with NVDA (Chrome or Firefox, Windows) or VoiceOver (Safari, macOS): the button is announced as "Reset view, button".
