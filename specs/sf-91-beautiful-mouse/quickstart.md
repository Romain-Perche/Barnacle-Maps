# Quickstart

1. `npm test`: all tests pass, including `test/map-cursor.test.js`.
2. `npm start`, open http://localhost:8000 in a desktop browser.
3. Empty map: blue ring with dot. Click a street corner: the popup tip is within 2px of the ring centre. Check over a street, a park and water.
4. Drag the map: closed hand; release: ring. Hover a route line, markers, popup button, zoom buttons, attribution link: pointing hand. Popup white area: arrow.
5. Side panel: I-beam in search box, pointing hand on results and route options, never the ring.
6. Block `assets/map-cursor.svg` in dev tools (or rename it): crosshair over the map, clicking still works.
7. Touch (edge case 2): open the app with touch emulation (dev tools device mode, or Playwright `hasTouch: true, isMobile: true`; script: `.factory/run/touch-check.cjs`). Tap the empty map: the "Add stop here" popup opens with its tip at the tap point (within 2px horizontally). Drag 100px with one finger: the map centre moves. Result (2026-11-19, Chromium, touch emulation): tap at 400,450 opened the popup with its tip at x=400; a 100px one-finger drag moved the centre from lng 2.3522 to 2.3351. Same result as with `main`'s `styles.css`.
