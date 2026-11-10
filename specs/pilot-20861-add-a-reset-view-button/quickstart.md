# Quickstart: Validating Reset View

**Prerequisites**: `npm install` not required. Run `npm test` and `npm start` (serves http://localhost:8000).

1. **Automated**: `npm test` — all existing tests pass.
2. **Default view (location denied)**: deny geolocation, load app, pan/zoom away, press Reset view → returns to Paris center at zoom 13.
3. **First-position view**: allow location (or use browser devtools sensor override), confirm map centers at zoom 15; pan/zoom away, press Reset view → returns to that center/zoom. Change the simulated position; press again → still the *first* position.
4. **Late permission**: deny, move the map, then grant/override location → map auto-centers once; Reset goes there.
5. **State untouched**: search a place, pick a destination so routes show, pan away, press Reset view → results, marker, routes, selected route and travel mode unchanged.
6. **Keyboard/AT**: Tab to the button (visible focus, announced "Reset view"), press Enter and Space → map resets.
7. **Layout**: at 320px and desktop widths, the button doesn't overlap the panel, zoom control, or attribution. Rapid repeated presses cause no errors.

See [ui-contract](contracts/ui-contract.md) and [data-model](data-model.md).
