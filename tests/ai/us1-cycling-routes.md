# US1: Get cycling routes to a destination
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, US1 scenario 1, 2, 3, 4, 5, 6, edge cases (single route, long trip)

Setup for every scenario: the common setup in `tests/ai/README.md`, with `installFakes(page)` and no options
unless the scenario says otherwise.

## Scenario 1: Selector is one row of segmented buttons with icons (design C)
Covers: FR-001, US1 scenario 1
### Setup
Common setup.
### Steps
1. Read the `innerText` of every `#mode label`, in order.
2. Read the value of the checked `input[name=mode]`.
3. Read the bounding box of each `#mode label` and of each `#mode label > span` (the outer span).
4. Read the computed `background-color` of `#mode input:checked + span` and of the two other `#mode input + span`.
5. Take a screenshot of `#mode` and save it as `us1-selector.png`.
6. Focus `input[name=mode][value=foot]` with Tab presses, then press ArrowRight two times.
7. Read the value of the checked `input[name=mode]`.
8. Run `page.getByRole("radio", { name: "Bike" }).isChecked()`.
### Expected
- [ ] The label texts are exactly "🚶 Walk", "🚗 Car", "🚲 Bike", in that order.
- [ ] At step 2, the checked value is `foot`.
- [ ] The three labels have the same top `y` (one row), and each label is 40 px tall or less (icon and text on one line).
- [ ] The gap between neighbouring labels is 2 px or less (segments touch).
- [ ] At step 4, the checked span background is `rgb(26, 115, 232)`, and the other two are different from it.
- [ ] At step 7, the checked value is `bike`.
- [ ] At step 8, the result is `true` (the accessible name is "Bike", without the emoji).

## Scenario 2: Bike routes for a destination
Covers: FR-002, FR-003, FR-007, US1 scenario 2, 4
### Setup
Common setup.
### Steps
1. Click the `#mode` label that contains "Bike".
2. Choose "Jardin du Luxembourg".
3. Right after the click, read `#status` every 100 ms until `#routes li` exists (at most 10 s).
4. Read the text of every `#routes li button` and the text of `#status`.
5. Read which `#routes button` has `aria-pressed="true"`.
6. Read `log.osrm`.
### Expected
- [ ] At step 3, `#status` showed "Computing cycling routes…" at least once.
- [ ] There are 3 entries in `#routes`; each starts with `Route N · <distance> · <duration>`.
- [ ] Only the first route button has `aria-pressed="true"`, and its duration is the smallest.
- [ ] `#status` matches `^3 cycling routes · fastest `.
- [ ] Every `log.osrm` entry has `server: "bike"` and `profile: "bike"`, and the first has `alternatives=3` in its `url`.

## Scenario 3: Pleasure indicator on bike routes
Covers: FR-005, US1 scenario 6
### Setup
Common setup.
### Steps
1. Select Bike and choose "Jardin du Luxembourg".
2. Wait until no `#routes .pleasure` text contains "…" (at most 30 s).
3. Read the text of every `#routes .pleasure` and which ones have the class `best`.
4. Hover the first `.pleasure` and read its `title`.
### Expected
- [ ] Each of the 3 routes has a `.pleasure` text matching `^Pleasure: \d+ green px`.
- [ ] Exactly one `.pleasure` contains "most pleasant", and it is the one with the class `best` and the largest number.
- [ ] The title is "Green pixels (parks, grass, woods) on the map along this route; more is more pleasant".

## Scenario 4: Select a bike route from the panel and from the map
Covers: FR-004, US1 scenario 3
### Setup
Common setup. Select Bike and choose "Jardin du Luxembourg". Wait for 3 entries in `#routes`.
### Steps
1. Click the second `#routes button`.
2. Read `aria-pressed` of the three route buttons.
3. Read the `stroke` attribute of every route `path` in `.leaflet-overlay-pane` that has `stroke-width="6"`.
4. Among the `path` elements in `.leaflet-overlay-pane` with `stroke="#888"` (the 2 grey routes), take the first one.
   Get its midpoint on screen with `page.evaluate`: `p.getPointAtLength(p.getTotalLength() / 2)` converted with
   `p.getScreenCTM()` (`new DOMPoint(x, y).matrixTransform(ctm)`). Click that point with `page.mouse.click`.
5. Read `aria-pressed` of the three route buttons again.
6. Check whether a Leaflet popup with "Add stop here" is open (`.leaflet-popup`).
### Expected
- [ ] After step 1, only route 2 has `aria-pressed="true"`.
- [ ] At step 3, exactly one path has `stroke-width="6"` and its stroke is `#1a73e8`.
- [ ] After step 4, exactly one route button has `aria-pressed="true"`, and it is not route 2.
- [ ] After step 4, the path clicked at step 4 has `stroke="#1a73e8"`.
- [ ] At step 6, no "Add stop here" popup is open.

## Scenario 5: No cycling route
Covers: FR-007, US1 scenario 5, edge case "roads closed to bicycles"
### Setup
Common setup (the fake bike server answers HTTP 400 `{"code":"NoRoute"}` for "Île aux Cygnes", as the OSRM docs say).
### Steps
1. Select Bike and choose "Île aux Cygnes".
2. Wait 3 s. Read `#status` and count the `#routes li` entries.
### Expected
- [ ] `#status` is exactly "No cycling route found.".
- [ ] `#status` does not contain "Routing failed".
- [ ] There are 0 `#routes li` entries.

## Scenario 6: A single bike route gets no forced detours
Covers: FR-006, edge case "single cycling route"
### Setup
Common setup with `installFakes(page, { single: ["bike", "foot"] })`.
### Steps
1. Select Bike and choose "Jardin du Luxembourg". Wait for `#routes li`.
2. Count the `#routes li` entries, read `#status`, and count the `log.osrm` entries with `server: "bike"`.
3. Select Walk. Wait until `#status` contains "walking" or "on foot" and no longer contains "Computing".
4. Count the `log.osrm` entries with `server: "foot"`.
### Expected
- [ ] At step 2, there is 1 route, `#status` ends with "by bike", and there is exactly 1 bike request.
- [ ] At step 4, there are 3 foot requests (walking still forces 2 detours: the control for this check).

## Scenario 7: Long bike trip shows "Pleasure unavailable"
Covers: FR-005, edge case "very long bike trips"
### Setup
Common setup.
### Steps
1. Select Bike and choose "Château de Versailles" (about 17 km away).
2. Wait for `#routes li`, then wait 2 s.
3. Read the text of every `#routes .pleasure`.
### Expected
- [ ] Routes are shown (at least 1 `#routes li`).
- [ ] Every `.pleasure` text is "Pleasure unavailable".

## Scenario 8: Bike durations are shorter than walking for the same trip
Covers: SC-002 (with the fake speeds: this checks that each mode shows its own server's durations; the real
cycling speeds come from the OSRM bike profile, which the factory cannot reach)
### Setup
Common setup.
### Steps
1. Keep Walk selected and choose "Jardin du Luxembourg". Wait for `#routes li`. Read the duration of Route 1.
2. Select Bike. Wait until `#status` contains "cycling". Read the duration of Route 1.
### Expected
- [ ] The bike duration (minutes) is smaller than the walking duration (minutes).
