# US2: Find and use the button with any input method
Covers: FR-001, FR-004, FR-004a, FR-005, FR-006, SC-005, US2 scenarios 1, 2, 3

## Common setup (all scenarios)

Same as tests/ai/us1-reset-view.md "Common setup": `npm start`, headless Playwright Chromium,
**Location blocked** context unless a scenario says otherwise, and the same **center tile check**,
**Pan away** and **Zoom away** steps. The fixed default view's center tile is `/13/4149/2818.png`.

## Scenario 1: Keyboard only: Tab to the button, use Enter and Space (US2 scenario 1, FR-004, SC-005)
### Setup
Location blocked, 1280 × 800. Open http://localhost:8000. Wait until the center tile check passes for `/13/4149/2818.png`.
### Steps
1. Click on `body` at (5, 795) so that nothing is focused. Then press Tab at most 30 times, and after each press read `document.activeElement.textContent.trim()`. Stop when it is "Reset view". Record, in order, the elements focused before it.
2. Zoom away with the keyboard: press Shift+Tab until `a.leaflet-control-zoom-out` is focused, press Enter 3 times (400 ms apart), then press Tab until "Reset view" is focused again.
3. Press Enter. Wait 1 s. Run the center tile check.
4. Read `document.activeElement.textContent.trim()`.
5. Zoom away again as in step 2, ending with focus on "Reset view".
6. Press Space. Wait 1 s. Run the center tile check.
7. Read `document.activeElement.textContent.trim()`.
### Expected
- [ ] The button gets focus within 30 Tab presses
- [ ] Before the button, the focus passed through `a.leaflet-control-zoom-in` and `a.leaflet-control-zoom-out` (the reset button comes after the zoom buttons)
- [ ] The reset button has no `tabindex` attribute (`button.hasAttribute("tabindex")` is false)
- [ ] After step 3, the center tile is `/13/4149/2818.png`
- [ ] In step 4, the focused element is still "Reset view"
- [ ] After step 6, the center tile is `/13/4149/2818.png`
- [ ] In step 7, the focused element is still "Reset view"

## Scenario 2: Visible focus outline for keyboard users (FR-004a, CHK010)
### Setup
As Scenario 1, step 1 only (the button has keyboard focus).
### Steps
1. Read `getComputedStyle(button).outlineStyle`, `outlineWidth` and `outlineColor`, and `button.matches(":focus-visible")`.
2. Take a screenshot of the bottom-right 300 × 200 px of the page.
### Expected
- [ ] In step 1, `matches(":focus-visible")` is true, `outlineStyle` is not "none" and `outlineWidth` is at least 2px
- [ ] The screenshot from step 2 shows a ring around the button

## Scenario 3: Accessible name, role and tooltip (US2 scenario 2, FR-001, FR-005)
### Setup
Location blocked. Open http://localhost:8000.
### Steps
1. Run `page.getByRole("button", { name: "Reset view", exact: true }).count()`.
2. Run `page.accessibility.snapshot()` (or `locator.ariaSnapshot()` on `.leaflet-control-container`) and find the node for the button.
3. Read the button's `title` attribute, `type` attribute, and its `innerHTML`.
4. Hover the button with the mouse.
### Expected
- [ ] Step 1 returns 1
- [ ] Step 2 shows a node with role "button" and name "Reset view"
- [ ] `title` is "Reset view" and `type` is "button"
- [ ] `innerHTML` holds only the text "Reset view" (no `<img>`, `<svg>`, `<i>` or other icon element)
- [ ] The button is not `disabled` and has no `hidden` or `aria-hidden` attribute
- [ ] Pressing the button sets no new text in `#status`, and no new element with `role="status"`, `role="alert"` or `aria-live` appears (FR-005)

## Scenario 4: Touch tap on a phone (US2 scenario 3, FR-004)
### Setup
Create the context with `viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true`, location allowed (Lyon, as in US1). Open http://localhost:8000. Wait until the center tile check passes for `/15/16824/11688.png`.
### Steps
1. Pan away with a touch drag: `page.touchscreen` is tap-only, so dispatch touch events by script or use CDP `Input.dispatchTouchEvent` to drag the map center 150 px left. If touch dragging can't be done, click the zoom-out button 3 times instead.
2. Check that the center tile check for `/15/16824/11688.png` fails.
3. `page.getByRole("button", { name: "Reset view" }).tap()`.
4. Wait 1 s and run the center tile check.
### Expected
- [ ] After step 2, the center tile is not `/15/16824/11688.png`
- [ ] After step 4, the center tile is `/15/16824/11688.png`

## Scenario 5: Placement, size and overlap at 375 px and 1280 px (FR-006, FR-004a, CHK008, CHK009, CHK013)
### Setup
Location blocked. Run the steps twice: viewport 375 × 667, then 1280 × 800. Open http://localhost:8000 each time.
### Steps
1. Read `getBoundingClientRect()` of: the Reset view button (B); the reset control's container (`.reset-view` or the button's parent `.leaflet-control`); `#panel` (P); `.leaflet-control-zoom` (Z); `.leaflet-control-attribution` (A); `#map` (M).
2. Check that B's container is inside `.leaflet-bottom.leaflet-right` (`button.closest(".leaflet-bottom.leaflet-right") !== null`).
3. Take a full-page screenshot.
### Expected (for each viewport)
- [ ] B's container is inside `.leaflet-bottom.leaflet-right`
- [ ] B.width ≥ 44 and B.height ≥ 44
- [ ] B lies fully inside M
- [ ] B.bottom ≤ A.top (above the attribution, no overlap)
- [ ] B does not intersect P, and B does not intersect Z (rectangles do not overlap)
- [ ] B.right is within 20 px of M.right (bottom-right corner)

## Scenario 6: Contrast (FR-004a, CHK011)
### Setup
Location blocked, 1280 × 800. Open http://localhost:8000. Let tiles load (wait 3 s); if tiles can't load, use the map background colour.
### Steps
1. Read the button's computed `color` and `background-color`; walk up to the first non-transparent background if the button's own is transparent.
2. Read the computed `border-top-color` and `border-top-width` of the button and of its `.leaflet-control` container. Use whichever has a visible edge (non-zero width, non-transparent colour).
3. Compute the WCAG contrast ratio of text colour vs. background (step 1).
4. Compute the WCAG contrast ratio of the edge colour (step 2), alpha-blended over white (`#ffffff`), vs. white, and vs. `#f2efe9` (the OSM land colour).
### Expected
- [ ] Text contrast is ≥ 4.5:1
- [ ] Edge contrast is ≥ 3:1 against both `#ffffff` and `#f2efe9`
