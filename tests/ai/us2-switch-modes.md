# US2: Switch to and from Bike for the current destination
Covers: FR-005, FR-008, FR-010, US2 scenario 1, 2, 3, edge case "routing service unreachable"

Setup for every scenario: the common setup in `tests/ai/README.md`.

## Scenario 1: Walk → Bike → Car → Walk for the same destination
Covers: FR-008, FR-005, US2 scenario 1, 2
### Setup
Common setup with `installFakes(page)`.
### Steps
1. Choose "Jardin du Luxembourg" (Walk selected). Wait until `#status` matches `walking routes`.
2. Click the "Bike" label. Wait until `#status` matches `cycling routes`.
3. Read the last `log.osrm` entry and the `.pleasure` count.
4. Click the "Car" label. Wait until `#status` matches `driving routes`.
5. Read the `.pleasure` count and the last `log.osrm` entry.
6. Click the "Walk" label. Wait until `#status` matches `walking routes`.
7. Read `#search-input` value.
### Expected
- [ ] At step 3, the last request has `server: "bike"`, its last coordinate is `[2.3372, 48.8462]` (the destination),
      and there are 3 `.pleasure` elements.
- [ ] At step 5, the last request has `server: "car"` with the same last coordinate, and there are 0 `.pleasure` elements.
- [ ] At step 6, the last request has `server: "foot"` with the same last coordinate.
- [ ] At step 7, the value still starts with "Jardin du Luxembourg".

## Scenario 2: A slow bike answer does not replace the Walk routes
Covers: FR-010, US2 scenario 3
### Setup
Common setup with `installFakes(page, { delayMs: { bike: 3000 } })`.
### Steps
1. Choose "Jardin du Luxembourg" (Walk). Wait until `#status` matches `walking routes`.
2. Click the "Bike" label. After 300 ms, click the "Walk" label.
3. Wait 5 s (the bike answer arrives during this wait).
4. Read `#status`, the checked mode, and the `log.osrm` entries with `server: "bike"`.
### Expected
- [ ] At least one bike request is in `log.osrm` (the slow answer really happened).
- [ ] The checked mode is `foot`.
- [ ] `#status` matches `walking routes` and does not contain "cycling" or "by bike".

## Scenario 3: Bike server unreachable
Covers: edge case "routing service unreachable"
### Setup
Common setup with `installFakes(page, { fail: ["bike"] })`.
### Steps
1. Choose "Jardin du Luxembourg" (Walk). Wait until `#status` matches `walking routes`.
2. Click the "Bike" label. Wait 3 s.
3. Read `#status`, count `#routes li`, and count the `path` elements in `.leaflet-overlay-pane`.
### Expected
- [ ] `#status` starts with "Routing failed".
- [ ] There are 0 `#routes li` entries.
- [ ] There is exactly 1 `path` in `.leaflet-overlay-pane` (the user's position marker; no route lines are left).
