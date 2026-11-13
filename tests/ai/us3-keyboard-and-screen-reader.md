# US3: Keyboard and assistive-technology users can clear
Covers: FR-007, FR-009, FR-010, US3 scenario 1, 2

## Scenario 1: Keyboard operation
### Setup
Run `npm start` (serves http://localhost:8000). Open it in headless Playwright with a 390x844 viewport.
### Steps
1. Click `#search-input` and type "Eiffel".
2. Press Tab once.
3. Read `document.activeElement.id`.
4. Press Enter.
5. Type "Lou" and press Shift+Tab to return to the box, then type "x", press Tab, then press Space.
### Expected
- [ ] After step 3, the active element id is "search-clear".
- [ ] After step 4, `#search-input` value is "" and `document.activeElement` is `#search-input`.
- [ ] After step 5, `#search-input` value is "" (Space also clears).
- [ ] The focused `#search-clear` shows a visible focus ring (screenshot shows an outline).

## Scenario 2: Accessible name
### Setup
Run `npm start` (serves http://localhost:8000). Open it in headless Playwright with a 390x844 viewport.
### Steps
1. Type "a" into `#search-input`.
2. Read the accessibility snapshot entry for `#search-clear` (`page.accessibility.snapshot()` or `getByRole("button", { name: "Clear search" })`).
### Expected
- [ ] `getByRole("button", { name: "Clear search" })` finds exactly one element.
- [ ] The element is a button with type "button".
- [ ] Its tappable area is 24 px by 24 px or more.
