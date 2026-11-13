# Quickstart: validating the clear button

Prerequisites: `npm start`, open http://localhost:8000. Run `npm test` to confirm existing tests still pass.

Checks (see [contracts/ui-contract.md](contracts/ui-contract.md)):

1. Fresh page: no × visible.
2. Type one character: × appears; delete it by hand: × disappears.
3. Type "Eiffel", wait for suggestions, click ×: box empty, list gone, × gone, caret in box; type again works without clicking.
4. Type, then click × before the ~500 ms pause ends and while a request is pending (throttle network): no results appear afterwards.
5. Trigger "No results." (nonsense text), click ×: message cleared.
6. Pick a destination (routes show), click ×: box empties; marker, routes, selected route, stops unchanged.
7. Type only spaces: × shown; click empties.
8. Long text: text stops before the ×; × stays tappable.
9. Chrome/Safari/Edge/Firefox: only one × visible.
10. Keyboard: Tab from input reaches ×; Enter/Space clears; screen reader says "Clear search, button".
11. Narrow phone viewport: × hit area ≥ 24×24 px.
