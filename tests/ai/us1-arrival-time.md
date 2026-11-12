# US1: See when I will arrive on each route
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, SC-001, SC-002, US1 scenario 1, 2, 3, 4, 5

All scenarios use the common setup in `tests/ai/fixtures.md`.

## Scenario 1: walking routes show their arrival time
Covers: FR-001, FR-002, FR-003, FR-005, FR-007, US1 scenario 1, 2, 3
### Setup
Common setup. The clock shows 14:07 (14:07:40).
### Steps
1. Search and choose `Test Park`.
2. Wait for 3 route entries.
3. Read the title of every route entry.
4. Read the `.pleasure` span of every route entry.
### Expected
- [ ] Route entry 1 title is exactly `Route 1 · 1.34 km · 25 min, arrive 14:32`.
- [ ] Route entry 2 title is exactly `Route 2 · 1.84 km · 29 min, arrive 14:36`.
- [ ] Route entry 3 title is exactly `Route 3 · 1.84 km · 35 min, arrive 14:42`.
- [ ] Each route button has a `.pleasure` span after the title span (walking mode), and the title span does not contain the word `Pleasure`.
- [ ] Route entry 1 has `aria-pressed="true"`; entries 2 and 3 have `aria-pressed="false"`.
- [ ] `#status` reads `3 walking routes · fastest 1.34 km · 25 min` and does not contain `arrive`.

## Scenario 2: car routes show their arrival time
Covers: FR-001, FR-005, US1 scenario 4
### Setup
Common setup.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Check the radio button labelled `Car`.
3. Wait for 3 route entries.
4. Read the title of every route entry.
### Expected
- [ ] Titles are exactly `Route 1 · 1.34 km · 10 min, arrive 14:17`, `Route 2 · 1.84 km · 12 min, arrive 14:19`, `Route 3 · 1.84 km · 15 min, arrive 14:22`.
- [ ] No route button contains a `.pleasure` span.

## Scenario 3: a route with a stop shows the arrival at the final destination
Covers: FR-005, US1 scenario 5
### Setup
Common setup.
### Steps
1. Fill `#search-input` with `Stop Cafe`, click `Go`, then click the button named `Add Stop Cafe as stop`.
2. Search and choose `Test Park`.
3. Wait for 1 route entry.
4. Read its title.
### Expected
- [ ] The title is exactly `Route 1 · 2.00 km · 40 min, arrive 14:47`.
- [ ] `#stops` lists `1. Stop Cafe`.

## Scenario 4: an arrival after midnight shows the later day
Covers: FR-004, spec edge case "Arrival after midnight"
### Setup
Common setup, but fix the clock with `page.clock.setFixedTime(new Date("2026-11-12T23:50:00+01:00"))` before `page.goto`.
### Steps
1. Search and choose `Night Bar`.
2. Wait for 3 route entries.
3. Read the title of route entry 1.
### Expected
- [ ] Route entry 1 title is exactly `Route 1 · 1.34 km · 25 min, arrive 00:15 (+1 day)`.
- [ ] Route entry 3 title ends with `35 min, arrive 00:25 (+1 day)`.

## Scenario 5: the arrival is part of the accessible name
Covers: FR-008
### Setup
Common setup.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. Query `page.getByRole("button", { name: "Route 1 · 1.34 km · 25 min, arrive 14:32", exact: false })`.
3. Read the accessibility snapshot of `#routes` (`page.locator("#routes").ariaSnapshot()`).
### Expected
- [ ] The locator of step 2 matches exactly 1 element.
- [ ] The snapshot of step 3 contains `arrive 14:32`, `arrive 14:36` and `arrive 14:42`.
- [ ] No route button has an `aria-label` attribute.

## Scenario 6: a narrow panel wraps the text and never cuts it
Covers: FR-001
### Setup
Common setup, but use `viewport: { width: 320, height: 640 }`.
### Steps
1. Search and choose `Test Park`; wait for 3 route entries.
2. For route button 1, evaluate `b.scrollWidth <= b.clientWidth`.
3. For route button 1, read the bounding boxes of the title span and of the `.pleasure` span.
4. Read the title span's `textContent` and computed `text-overflow`.
### Expected
- [ ] Step 2 returns `true` (no horizontal overflow).
- [ ] The `.pleasure` span's top is greater than or equal to the title span's bottom (the pleasure line stays below).
- [ ] The title `textContent` is exactly `Route 1 · 1.34 km · 25 min, arrive 14:32`, and `text-overflow` is not `ellipsis`.
