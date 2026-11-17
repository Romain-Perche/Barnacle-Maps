# US1: Get cycling routes to a destination
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, US1 scenario 1, 2, 3, 4, 5, 6

Setup for all scenarios: see `tests/ai/README.md`. Use the default harness options unless a scenario says otherwise.

## Scenario 1: design C selector looks and works like one row of segmented buttons
### Setup
`openApp()`. Wait for `#mode` to be visible.
### Steps
1. Read the text, bounding box and computed background colour of each `#mode label` and its `span`.
2. Take a screenshot `us1-s1-selector.png` of `#panel`.
3. Press `Tab` until `#mode input[value=foot]` has focus (check `document.activeElement`).
4. Press `ArrowRight` twice.
5. Take a screenshot `us1-s1-focus.png` of `#panel`.
6. Read the `#mode input:checked` value and the computed background of each segment span.
### Expected
- [ ] There are exactly 3 segments, in order `🚶 Walk`, `🚗 Car`, `🚲 Bike`.
- [ ] The 3 segments have the same `top` (one row) and widths within 4 px of each other.
- [ ] In step 1, only the Walk segment has background `rgb(232, 240, 254)`. The others are transparent.
- [ ] In step 6, the checked input is `bike` and only the Bike segment has background `rgb(232, 240, 254)`.
- [ ] The Bike segment span has computed `outline-style` `solid` and `outline-width` `2px` in step 6, and the outline shows in `us1-s1-focus.png`.
- [ ] No radio circle shows in `us1-s1-selector.png`.

## Scenario 2: cycling routes on the real map, chosen from the panel and from the map
### Setup
`openApp()`.
### Steps
1. Select Bike.
2. Search `Jardin des Plantes`.
3. Wait until routes are ready.
4. Count the `path.leaflet-interactive` elements in the map and the `#routes button` elements.
5. Click the second `#routes button`.
6. Wait 1 s (map zoom animation). Then, in the page, take each `#map path.leaflet-interactive` with stroke `#888`. Compute its midpoint as `p.getPointAtLength(p.getTotalLength() / 2).matrixTransform(p.getScreenCTM())`. Keep the first path where `document.elementFromPoint(x, y) === p`, and click that point with `page.mouse.click(x, y)`.
7. Take a screenshot `us1-s2-routes.png`.
### Expected
- [ ] `log` contains exactly one URL that starts with `https://routing.openstreetmap.de/routed-bike/route/v1/bike/`, and no `routed-foot` or `routed-car` URL.
- [ ] The map shows 3 route lines and the panel lists 3 route buttons. Each button text matches `Route N · <distance> · <duration>`.
- [ ] After step 5, the second button has `aria-pressed="true"` and the second line is blue (`stroke="#1a73e8"`).
- [ ] After step 6, the clicked path has stroke `#1a73e8`, exactly one `#routes button` has `aria-pressed="true"`, it is not the button selected after step 5, and no `.add-stop-here` popup is open.

## Scenario 3: cycling texts while computing and after
### Setup
`openApp({ osrmDelayMs: 1500 })`.
### Steps
1. Select Bike.
2. Search `Jardin des Plantes`.
3. Within 1 s, read `#status`.
4. Wait until routes are ready. Read `#status`.
### Expected
- [ ] Step 3 reads exactly `Computing cycling routes…`.
- [ ] Step 4 matches `3 cycling routes · fastest <distance> · <duration>`.

## Scenario 4: a single cycling route is summarised "by bike"
### Setup
`openApp({ routes: 1 })`.
### Steps
1. Select Bike.
2. Search `Jardin des Plantes`.
3. Wait until routes are ready.
### Expected
- [ ] `#status` matches `<distance> · <duration> by bike`.
- [ ] There is exactly 1 `#routes button`, and `log` has exactly 1 `routing.openstreetmap.de` URL (no detours).

## Scenario 5: no cycling route
### Setup
`openApp({ noRoute: true })`. The fake answers HTTP 400 `{"code":"NoRoute"}`, as OSRM does.
### Steps
1. Select Bike.
2. Search `Jardin des Plantes`.
3. Wait 2 s.
### Expected
- [ ] `#status` reads exactly `No cycling route found.`
- [ ] `#routes` has no button and the map has no route line.

## Scenario 6: pleasure indicator on cycling routes, computed from real map tiles in the browser
### Setup
`openApp()`. The fake tiles are green when x + y is even and beige otherwise.
### Steps
1. Select Bike.
2. Search `Jardin des Plantes`.
3. Wait up to 25 s until a `#routes .pleasure.best` element exists.
4. Read the text of every `#routes .pleasure`, and the `title` of one of them.
5. Take a screenshot `us1-s6-pleasure.png` of `#panel`.
### Expected
- [ ] Every route shows `Pleasure: <n> green px`. Exactly one also shows `· most pleasant` in green bold.
- [ ] The `title` reads `Green pixels (parks, grass, woods) on the map along this route; more is more pleasant`.
- [ ] `log` contains URLs that start with `https://tile.openstreetmap.org/16/`.

## Scenario 7: a ride too long to score
### Setup
`openApp({ place: { display_name: "Versailles, France", lat: "48.8049", lon: "2.1204" } })`. Versailles is about 17 km away.
### Steps
1. Select Bike.
2. Search `Versailles`.
3. Wait until routes are ready, then wait 2 s more.
### Expected
- [ ] Every `#routes .pleasure` reads `Pleasure unavailable`.
- [ ] `log` contains no URL that starts with `https://tile.openstreetmap.org/16/`.
