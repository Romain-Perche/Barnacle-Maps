# US2: Arrival time stays consistent with freshly computed routes
Covers: FR-002, FR-006, SC-003, US2 scenario 1, 2, 3

All scenarios use the common setup in `tests/ai/fixtures.md`.

## Scenario 1: a recomputation uses the new clock
Covers: FR-006, US2 scenario 1, 2
### Setup
Common setup. The clock shows 14:07 (14:07:40).
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Record the title of route entry 1.
3. Run `page.clock.setFixedTime(new Date("2026-11-12T14:10:00+01:00"))`.
4. Check the radio button labelled `Car`; wait for 3 route entries.
5. Record the title of route entry 1.
6. Check the radio button labelled `Walk`; wait for 3 route entries.
7. Record the title of route entry 1.
### Expected
- [ ] Step 2 title ends with `25 min, arrive 14:32`.
- [ ] Step 5 title ends with `10 min, arrive 14:20`.
- [ ] Step 7 title ends with `25 min, arrive 14:35`.

## Scenario 2: stop changes and a new destination recompute the arrival
Covers: FR-006, US2 scenario 2
### Setup
Common setup.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Run `page.clock.setFixedTime(new Date("2026-11-12T14:20:00+01:00"))`.
3. Fill `#search-input` with `Stop Cafe`, click `Go`, click the button named `Add Stop Cafe as stop`; wait for 1 route entry.
4. Record the title of route entry 1.
5. Run `page.clock.setFixedTime(new Date("2026-11-12T14:30:00+01:00"))`.
6. Click the button named `Remove stop 1`; wait for 3 route entries.
7. Record the title of route entry 1.
8. Run `page.clock.setFixedTime(new Date("2026-11-12T14:40:00+01:00"))`.
9. Search and choose `Night Bar`; wait for 3 route entries.
10. Record the title of route entry 1.
### Expected
- [ ] Step 4 title is exactly `Route 1 · 2.00 km · 40 min, arrive 15:00`.
- [ ] Step 7 title ends with `25 min, arrive 14:55`.
- [ ] Step 10 title ends with `25 min, arrive 15:05`.

## Scenario 3: time passing, selecting a route and pleasure scores do not change the arrival
Covers: FR-006, US2 scenario 3
### Setup
Common setup.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Record the titles of all 3 route entries.
3. Run `page.clock.setFixedTime(new Date("2026-11-12T14:09:00+01:00"))`.
4. Wait until every `.pleasure` span reads `Pleasure unavailable` (tiles return 404).
5. Click route button 2.
6. Wait 2 seconds.
7. Record the titles of all 3 route entries.
### Expected
- [ ] Step 7 titles are identical to step 2 titles (`… arrive 14:32`, `… arrive 14:36`, `… arrive 14:42`).
- [ ] Route button 2 has `aria-pressed="true"`.

## Scenario 4: no route and a routing error leave no arrival time
Covers: FR-006, SC-003, spec edge case "No route found / routing error"
### Setup
Common setup.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Search and choose `Ocean Point`.
3. Wait until `#status` reads `No walking route found.`
4. Count the `#routes li` elements and search the panel text for `arrive`.
5. Search and choose `Broken Place`.
6. Wait until `#status` starts with `Routing failed:`.
7. Count the `#routes li` elements and search the panel text for `arrive`.
### Expected
- [ ] Step 4: `#routes li` count is 0 and `#panel` text does not contain `arrive`.
- [ ] Step 7: `#routes li` count is 0 and `#panel` text does not contain `arrive`.
