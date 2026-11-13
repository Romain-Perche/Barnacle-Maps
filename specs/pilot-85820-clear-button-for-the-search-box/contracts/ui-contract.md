# UI Contract: Search clear button

- Element: `<button type="button" id="search-clear" aria-label="Clear search">×</button>` inside the search box, right edge; plain grey ×, no background (Design A).
- Visible iff the search input value is non-empty (including spaces-only); updated on typing, paste, deletion, and programmatic changes.
- Activation (click/tap/Enter/Space): empties input, results and status; cancels pending/in-flight suggestions; focuses the input; does not submit; does not alter destination, routes, selected route, stops or mode.
- Hit area ≥ 24×24 CSS px; focusable in DOM order right after the input, before "Go".
- Native browser clear controls on the input are hidden so only this one shows.
