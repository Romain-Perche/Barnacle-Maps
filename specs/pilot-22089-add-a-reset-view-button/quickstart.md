# Quickstart: validate the Reset view button

## Prerequisites

- Node ≥ 18 (tests), Python 3 (static server), a desktop browser with devtools.
- Network access to unpkg.com and tile.openstreetmap.org (map), Nominatim and routing.openstreetmap.de (search/routes).

## Automated checks

```bash
npm test          # all suites pass, including test/view.test.js (contracts/view-helpers.md)
```

## Run the app

```bash
npm start         # then open http://localhost:8000
```

`map` is module-scoped, so it is not on `window`. Most checks below are visual. For an exact check
(SC-002), set a breakpoint at the end of `resetView()` in devtools → Sources and evaluate
`map.getCenter()` and `map.getZoom()` against `startView`.

## Scenarios

Location can be simulated with devtools → Sensors → Location (e.g. "Berlin"), or blocked via the
site permission.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Location blocked | Pan and zoom away, press **Reset view** | Central Paris at zoom 13 (US1-5) |
| 2 | Location allowed (Berlin) | Wait for blue dot + recentre, pan/zoom away, press **Reset view** | Back to the first Berlin fix at zoom 15 (US1-1, US1-4) |
| 3 | As 2 | Change simulated location to Tokyo, then press **Reset view** | Still the first Berlin view; blue dot stays at Tokyo (FR-003/004) |
| 4 | At the starting view | Press **Reset view** several times | No error in console, no jump, same view (US1-2, FR-008) |
| 5 | Location allowed | Search "Louvre", pick a result, wait for routes, select Route 2, switch mode to Car; pan away; press **Reset view** | Map returns to start; input text, results, routes, selected route, mode, pleasure, status, markers unchanged (US1-3, FR-005) |
| 6 | Location allowed | Pick a destination and press **Reset view** while "Computing … routes" is shown | Map goes to start; routes still appear afterwards (edge case) |
| 7 | Any | Tab until the button is focused, press Enter, then Space | Visible focus ring; map resets each time (US2-2) |
| 8 | Screen reader (VoiceOver/NVDA) or devtools Accessibility pane | Focus the button | Name "Reset view", role button (US2-3) |
| 9 | Devtools device toolbar, 360×640 and 1280×800 | Look at the map | Button visible in the bottom-right above zoom +/- and attribution, not under the panel; zoom buttons visible too (US2-1, FR-007) |
| 10 | Touch emulation | Tap the button | Map resets; map does not also zoom (no double-tap zoom) |

| 11 | Devtools → Rendering → emulate `prefers-reduced-motion: reduce` | Pan away, press **Reset view** | Instant jump, no animation (FR-010) |

All transitions should finish well under 1 s (SC-003).
