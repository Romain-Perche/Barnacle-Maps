# US1: See when I would arrive on each route
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-008, FR-009, FR-010, US1 scenario 1, 2, 3, 4, edge cases "long trips", "arrival on the next day", "no route found / routing fails"

Common setup for every scenario below:

- Start the app from the repository root: `npm start` (serves http://localhost:8000).
- Use headless Playwright (Chromium) with network access to OSM tiles, nominatim.openstreetmap.org, routing.openstreetmap.de and unpkg.com.
- Create the browser context with `timezoneId: "Europe/Paris"`, `locale: "en-US"` (a 12-hour locale, to check that the app still shows 24-hour time), `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and `permissions: ["geolocation"]`.
- Before `page.goto`, freeze the clock: `await page.clock.setFixedTime(new Date("<time>+01:00"))`. Each scenario gives `<time>`. The clock stays frozen, so the expected values are exact.
- "Route entry N" means the first `<span>` inside the button of the N-th `li` in `#routes`.
- Expected arrival for a route entry: read its duration text `D` (e.g. `25 min`, `2 h 5 min`), convert it to minutes, and add it to the frozen time. Because the frozen time is on a whole minute, the arrival equals the frozen time + D exactly. The only exception is a `1 min` route, which may show the frozen time + 0 or + 1 min.

## Scenario 1: every walking route shows its arrival time (US1 scenario 1, 2)
### Setup
Frozen time `2026-11-12T14:07:00`. Mode Walk (default).
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Wait for the first button in `#results`, then click it.
4. Wait until `#routes li` has at least 1 entry and `#status` no longer starts with "Computing".
5. Read the text of every route entry and the text of `#status`.
### Expected
- [ ] Every route entry text matches `^Route \d+ · .+ · .+, arrive \d{2}:\d{2}$`.
- [ ] For every route entry, the `HH:MM` after "arrive" equals 14:07 + that entry's duration (see Common setup).
- [ ] For each pair of route entries, the entry with the longer displayed duration does not show an earlier arrival. If two entries show the same duration, their arrivals are equal or 1 min apart.
- [ ] No route entry contains "AM", "PM", "am" or "pm".
- [ ] `#status` does not contain "arrive".
- [ ] Every walking route entry still has a `.pleasure` span after the title span.
- [ ] The accessible name of each route button (Playwright `getByRole("button")` name, or its `textContent`) contains "arrive HH:MM".

## Scenario 2: car routes show arrival times (US1 scenario 3, FR-005)
### Setup
Frozen time `2026-11-12T14:07:00`.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Click the radio input `#mode input[value="car"]`.
3. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
4. Click the first button in `#results`.
5. Wait until `#routes li` has at least 1 entry and `#status` no longer starts with "Computing".
6. Read the text of every route entry.
### Expected
- [ ] Every route entry text matches `^Route \d+ · .+ · .+, arrive \d{2}:\d{2}$`.
- [ ] For every route entry, the arrival equals 14:07 + that entry's duration.
- [ ] No route button contains a `.pleasure` span.

## Scenario 3: route with a stop shows the arrival at the final destination (US1 scenario 4)
### Setup
Frozen time `2026-11-12T14:07:00`. Mode Walk.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Panthéon, Paris` into `#search-input` and press Enter.
3. Wait for `#results`, then click the first "Add as stop" button (class `add-stop`).
4. Check that `#stops li` has 1 entry.
5. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
6. Click the first place-name button in `#results` (not the "Add as stop" button).
7. Wait until `#routes li` has at least 1 entry and `#status` no longer starts with "Computing".
8. Read the text of every route entry and of `#status`.
### Expected
- [ ] `#status` contains "via 1 stop".
- [ ] Every route entry text matches `^Route \d+ · .+ · .+, arrive \d{2}:\d{2}$`.
- [ ] For every route entry, the arrival equals 14:07 + that entry's duration (the full trip through the stop).

## Scenario 4: long car trip with a duration in hours (edge case "long trips")
### Setup
Frozen time `2026-11-12T14:07:00`.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Click `#mode input[value="car"]`.
3. Type `Rouen` into `#search-input` and press Enter.
4. Click the first button in `#results`.
5. Wait until `#routes li` has at least 1 entry and `#status` no longer starts with "Computing" (allow up to 30 s).
6. Read the text of route entry 1.
### Expected
- [ ] The duration in route entry 1 matches `\d+ h( \d+ min)?`.
- [ ] Route entry 1 text ends with `, arrive HH:MM`, and HH:MM equals 14:07 + that duration.

## Scenario 5: arrival on the next day (FR-004)
### Setup
Frozen time `2026-11-12T23:50:00`. Mode Car.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Click `#mode input[value="car"]`.
3. Type `Rouen` into `#search-input` and press Enter.
4. Click the first button in `#results`.
5. Wait until `#routes li` has at least 1 entry and `#status` no longer starts with "Computing".
6. Read the text of every route entry.
### Expected
- [ ] Every route entry text ends with `, arrive HH:MM (+1 day)` (a car trip to Rouen takes more than 10 min and less than 24 h).
- [ ] For every route entry, HH:MM equals 23:50 + that entry's duration, modulo 24 h.

## Scenario 6: routing fails, so no arrival time (edge case "no route found / routing fails")
### Setup
Frozen time `2026-11-12T14:07:00`. Mode Walk.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Wait for the first button in `#results`.
4. Block routing: `await page.route("**/routing.openstreetmap.de/**", (r) => r.abort())`.
5. Click the first button in `#results`.
6. Wait until `#status` no longer starts with "Computing".
### Expected
- [ ] `#status` starts with "Routing failed:".
- [ ] `#routes` has no `li`.
- [ ] The page text in `#panel` does not contain "arrive".
