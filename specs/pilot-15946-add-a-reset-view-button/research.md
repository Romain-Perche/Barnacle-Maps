# Research: Reset View Button

The Technical Context had no NEEDS CLARIFICATION items: the stack is fixed by the repo, and the spec's clarification settled what "starting view" means. The research below covers the design choices. No questions were asked, because this ran non-interactively. The choices were made autonomously and are recorded here.

## R1. Where the starting view is recorded

- **Decision**: Use a `createStartView(DEFAULT_VIEW)` object from the new `src/view.js`. `onPosition` calls `startView.settle(lat, lng, 15)`. That call returns `true` (and updates the view) only the first time. `app.js` uses the return value to decide whether to auto-center, so this replaces the existing `centered` flag.
- **Rationale**: This puts "first auto-center" and "starting view" in one place, so they cannot drift apart (FR-003/FR-004). It is pure and testable under `node --test` without Leaflet. It also matches the existing pattern of pure helpers in their own module.
- **Alternatives considered**:
  - *Read `map.getCenter()/getZoom()` right after the first `setView`*: Leaflet may round or animate, and this ties the logic to the DOM. Rejected.
  - *Keep `centered` and add a separate `startView` variable in app.js*: that gives two pieces of state to keep in sync, and it can't be unit-tested because app.js needs `window.L` and the DOM. Rejected.
  - *Put it in `geo.js`*: this is view state, not geography. Rejected to keep geo.js cohesive.

## R2. How the control is built

- **Decision**: Use a custom `L.Control` subclass whose `onAdd` returns a `div.leaflet-bar.leaflet-control` containing a native `<button type="button" class="reset-view" aria-label="Reset view" title="Reset view">`. Call `L.DomEvent.disableClickPropagation` and `disableScrollPropagation` on the container.
- **Rationale**: Leaflet places and stacks the control, so it never overlaps other Leaflet controls (FR-008). A native `<button>` gives focus and Enter/Space activation with no extra code, plus a correct "button" role (FR-006/FR-007). Stopping propagation keeps clicks on the button from reaching the map.
- **Alternatives considered**: A button in `index.html` with absolute CSS positioning would need manual collision handling with Leaflet's corners. Making `<a role="button">` the way Leaflet's zoom control does needs extra key handling for Space. Both rejected.

## R3. Placement (FR-008)

- **Decision**: `position: "bottomright"`. Leaflet stacks it above the attribution control.
- **Rationale**: `#panel` is anchored top-left with `z-index: 1000` and `width: min(360px, 100% - 24px)`. On mobile it spans the full top of the screen, and its height grows with results and routes. It already covers the default top-left zoom control. Top-left and top-right would both sit under the panel on narrow screens. Bottom-right is the one corner the panel never reaches. The spec assumes placement "near the zoom controls", but in practice those are hidden under the panel. Visual closeness doesn't matter as much as "never hidden behind the panel", so placement follows FR-008. This was chosen autonomously.
- **Alternatives considered**: `topleft` under the zoom control is hidden by the panel. `topright` is hidden on mobile. Moving the zoom control is out of scope.
- **Update (checklist gate, 2026-11-10)**: The spec now says bottom-right above the attribution (Assumptions), so the conflict is gone.

## R3b. Panel height cap (FR-012, FR-008)

- **Decision**: `#panel { max-height: calc(100% - 108px); overflow-y: auto; box-sizing: border-box; }`. The panel's top is 12px, so the bottom **96px** of the map always stays free. Inside the panel, the content scrolls.
- **Rationale**: On a phone, the panel spans the full width, so the only way to keep it clear of the bottom-right button is to keep it out of the bottom strip. That strip holds the attribution (~17px), the control's Leaflet `margin-bottom` (10px), the button (44px + 2×2px `leaflet-bar` border = 48px) and the 8px gap of FR-008: about 83px. The reviewer approved "at least 72px", which is too small for a 44px button with an 8px gap, so 96px is used (with some room for an attribution that wraps). At 667×375 landscape the panel can still be 267px tall.
- **Resize, rotation and zoom**: the cap is pure CSS (`calc(100% - 108px)` against the map container), so it follows any resize or rotation without a reload (FR-008, FR-012). At 200% browser zoom the CSS-px viewport halves and the panel still scrolls inside (FR-017). The panel is a normal `overflow-y: auto` box, so mouse wheel, touch and keyboard scrolling work, and the browser scrolls a focused result/route button into view on its own. Leaflet's own `disableScrollPropagation` is not applied to `#panel` today and does not need to be: the panel is outside the map container.
- **Update (checklist gate, 2026-11-10)**: the spec now says "at least 96px" (FR-012), matching this decision.
- **Alternatives considered**: Exactly 72px gives a gap of ~0px with the 44px button, which fails FR-008. Hiding the attribution isn't allowed by the OSM terms. Rejected.

## R4. Reset motion

- **Decision**: `map.setView([lat, lng], zoom, { animate: !reducedMotion() })`, where `reducedMotion()` reads `matchMedia("(prefers-reduced-motion: reduce)").matches` at press time (so a change of the OS setting is picked up without a reload; FR-015). Otherwise Leaflet's default animation options are used. The call is wrapped in `try { … } catch (err) { console.error(err) }`: on an unexpected error the map stays where it is and nothing is shown to the user (FR-018). Leaflet's `setView` calls `_stop()` first, so a running pan/zoom animation or drag inertia is interrupted and the map ends at the starting view (FR-014). The handler doesn't touch pending route `fetch`es; when they resolve, `fitBounds` runs as it does today (FR-014).
- **Rationale**: The spec accepts smooth or instant, as long as it ends within 1 s (Assumptions). The default animation is short (~250 ms, well under 1 s, SC-001) and lands on the exact center and zoom (SC-002). If the map is already at the start view, `setView` does nothing visible (acceptance scenario 1.3). Repeated presses are idempotent.
- **Alternatives considered**: `flyTo` takes longer over large distances and may exceed 1 s. Rejected.

## R5. Not altering app state (FR-005)

- **Decision**: The click handler only calls `map.setView`. It does not touch `routeLayers`, `selectedRoute`, `mode`, `currentPlace`, `results`, `status`, `userMarker` or `destMarker`, and it does not call `fitBounds`.
- **Rationale**: Panning and zooming in Leaflet don't affect layers. Polylines and markers keep their geographic positions. Open popups stay open, since `setView` doesn't close them (`autoClose` only reacts to other popups opening). No status message or live-region announcement is added.

## R6. Styling and icon

- **Decision**: Use an inline SVG circular arrow (`aria-hidden="true" focusable="false"`, 22×22 px viewBox `0 0 24 24`, `stroke="currentColor"`, `fill="none"`) instead of the "⟲" text glyph, so the icon shows whatever fonts the user has (CHK005). 22px matches the + and − symbols of the zoom buttons; the button stays 44×44 px. Plus `aria-label`/`title` "Reset view". Size it **44×44** px (FR-011), larger than Leaflet's 30×30 `leaflet-bar a`. Colors: icon `#000` on `#fff` (21:1), hover background `#f4f4f4`, `:focus-visible` outline `2px solid #1a73e8` with `outline-offset: -2px`, so the ring is drawn inside the button over its white background, never over the tiles (~4.6:1 against white, ≥ 3:1 per FR-013). The black icon is ~19:1 on #f4f4f4 hover and 21:1 on white. No `:active` style and no disabled state (FR-009, FR-010). The click handler doesn't move focus, so focus stays on the button.
- **Rationale**: This matches Leaflet's control look, gives a tooltip for sighted users and an accessible name for screen readers (FR-007), and shows keyboard focus (FR-006).
- **Alternatives considered**: A text-only "Reset view" label is wider and clutters mobile. The ⟲ text glyph (the earlier choice) is missing from some system fonts, which would leave touch users with a blank button. Rejected after the checklist gate.

## R7. Forced colors (FR-016)

- **Decision**: `@media (forced-colors: active) { .reset-view { background: ButtonFace; color: ButtonText; forced-color-adjust: none; } .reset-view:focus-visible { outline-color: Highlight; } }`. Because the SVG uses `currentColor`, the icon follows `ButtonText`.
- **Rationale**: Without this, the browser may drop the white background but keep a hard-coded icon color; system colors keep icon and ring visible in any high-contrast theme.
- **Alternatives considered**: Relying on the browser's automatic adjustment alone: the custom blue ring may be replaced by an invisible color in some themes. Rejected.

## R8. Lifetime of the starting view (FR-003)

- **Decision**: The StartView lives in module scope of `app.js`. A back/forward-cache restore keeps the JS heap, so the starting view the page had is kept; a real reload re-runs the module and starts over. No `pageshow` handler is needed.
- **Rationale**: This is the browser's default behavior and matches the spec exactly.

## R9. Late first fix and distant fixes (Edge Cases)

- **Decision**: Unchanged from today: `onPosition` calls `startView.settle(lat, lng, 15)` on the first fix, whatever the user has done since load, and auto-centers if it returns `true`. Any valid fix (within the ranges of the View entity) is accepted. Zoom 15 is below the tile layer's `maxZoom: 19`, so no clamping.
