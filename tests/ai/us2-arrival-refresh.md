# US2: Arrival times refresh when routes are recomputed
Covers: FR-006, FR-007, FR-002, US2 scenario 1, 2, edge cases "time passes without recomputation", "waiting for location"

Common setup for every scenario below:

- Start the app from the repository root: `npm start` (serves http://localhost:8000).
- Use headless Playwright (Chromium) with network access to OSM tiles, nominatim.openstreetmap.org, routing.openstreetmap.de and unpkg.com.
- Create the browser context with `timezoneId: "Europe/Paris"` and `locale: "en-GB"`.
- Freeze the clock before `page.goto` with `await page.clock.setFixedTime(new Date("<time>+01:00"))`. A scenario moves the clock with another `page.clock.setFixedTime(...)` call.
- "Route entry N" means the first `<span>` inside the button of the N-th `li` in `#routes`.
- "Routes are ready" means `#routes li` has at least 1 entry and `#status` does not start with "Computing".
- The expected arrival equals the frozen time + the entry's displayed duration (the frozen time is on a whole minute). The only exception is a `1 min` route, which may show + 0 or + 1 min.

## Scenario 1: time passes without recomputation, then a recomputation updates the times (US2 scenario 1, FR-006, FR-007)
### Setup
Frozen time `2026-11-12T14:07:00`. Context with `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and `permissions: ["geolocation"]`. Mode Walk.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Click the first button in `#results`.
4. Wait until routes are ready. Record the text of route entry 1 as `T1` and its duration as `D`.
5. Move the clock: `page.clock.setFixedTime(new Date("2026-11-12T14:12:00+01:00"))`.
6. Wait 3 seconds without any other action. Record the text of route entry 1 as `T2`.
7. Click `#mode input[value="car"]` and wait until routes are ready.
8. Click `#mode input[value="foot"]` and wait until routes are ready.
9. Record the text of route entry 1 as `T3` and its duration as `D3`.
### Expected
- [ ] `T1` ends with `arrive HH:MM`, where HH:MM equals 14:07 + `D`.
- [ ] `T2` equals `T1` (no change without a recomputation).
- [ ] `T3` ends with `arrive HH:MM`, where HH:MM equals 14:12 + `D3`.
- [ ] If `D3` equals `D`, the arrival in `T3` is exactly 5 minutes later than the arrival in `T1` (e.g. 14:32 → 14:37).

## Scenario 2: switching from walking to car uses the time of the switch (US2 scenario 2)
### Setup
Frozen time `2026-11-12T14:07:00`. Context with `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and `permissions: ["geolocation"]`. Mode Walk.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Click the first button in `#results` and wait until routes are ready.
4. Move the clock: `page.clock.setFixedTime(new Date("2026-11-12T14:20:00+01:00"))`.
5. Click `#mode input[value="car"]` and wait until routes are ready.
6. Read the text of every route entry.
### Expected
- [ ] No route button contains a `.pleasure` span (these are car routes).
- [ ] Every route entry ends with `arrive HH:MM`, where HH:MM equals 14:20 + that entry's duration.

## Scenario 3: adding and clearing a stop recomputes the times (FR-006)
### Setup
Frozen time `2026-11-12T14:07:00`. Context with `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and `permissions: ["geolocation"]`. Mode Walk.
### Steps
1. Open http://localhost:8000 and wait until the user marker appears (`#map .leaflet-overlay-pane path` count ≥ 1).
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Click the first button in `#results` and wait until routes are ready.
4. Move the clock: `page.clock.setFixedTime(new Date("2026-11-12T14:30:00+01:00"))`.
5. Type `Panthéon, Paris` into `#search-input` and press Enter.
6. Click the first "Add as stop" button (class `add-stop`) in `#results` and wait until routes are ready.
7. Record the text of every route entry as list `A`.
8. Move the clock: `page.clock.setFixedTime(new Date("2026-11-12T14:45:00+01:00"))`.
9. Click `#clear-stops` and wait until routes are ready.
10. Record the text of every route entry as list `B`.
### Expected
- [ ] `#status` contained "via 1 stop" after step 6.
- [ ] Every entry in `A` ends with `arrive HH:MM`, where HH:MM equals 14:30 + that entry's duration.
- [ ] Every entry in `B` ends with `arrive HH:MM`, where HH:MM equals 14:45 + that entry's duration.

## Scenario 4: routes that wait for the location use the time when the location arrives (edge case "waiting for location")
### Setup
Frozen time `2026-11-12T14:07:00`. Mode Walk. Do not set `geolocation` or `permissions` on the context. Instead, before `page.goto`, replace the browser geolocation with a manual one:

```js
await page.addInitScript(() => {
  Object.defineProperty(navigator, "geolocation", {
    value: { watchPosition: (ok) => { window.__sendPosition = ok; return 1; }, clearWatch() {} },
  });
});
```
### Steps
1. Open http://localhost:8000.
2. Type `Jardin du Luxembourg, Paris` into `#search-input` and press Enter.
3. Click the first button in `#results`.
4. Read `#status` and count `#routes li`.
5. Move the clock: `page.clock.setFixedTime(new Date("2026-11-12T14:15:00+01:00"))`.
6. Send the position: `page.evaluate(() => window.__sendPosition({ coords: { latitude: 48.8566, longitude: 2.3522 } }))`.
7. Wait until routes are ready (allow up to 30 s).
8. Read the text of every route entry.
### Expected
- [ ] In step 4, `#status` reads "Waiting for your location to compute a route…" and `#routes` has no `li`.
- [ ] In step 4, `#panel` text does not contain "arrive".
- [ ] Every route entry ends with `arrive HH:MM`, where HH:MM equals 14:15 + that entry's duration (not 14:07 + duration).
