# Contract: route summary bar (UI)

## Markup (`index.html`, after `#map`, before `#panel`)

```html
<div id="route-card" role="group" aria-label="Selected route" hidden>
  <b class="rc-duration"></b><span class="rc-distance"></span><span class="rc-arrival"></span>
</div>
<p id="route-card-live" class="sr-only" aria-live="polite"></p>
```

- Visible text order: `29 min` | `2.35 km` | `Arrive 14:39`. The arrival span text is `Arrive ${arrival}`.
- No buttons, no close control (spec assumption).

## Style (`styles.css`, Design A from `design-options.html`)

| Property | Value |
|---|---|
| position | `absolute; left: 50%; transform: translateX(-50%); bottom: 28px; z-index: 1000` |
| box | `background:#fff; border-radius:8px; padding:7px 14px; box-shadow:0 2px 8px rgba(0,0,0,.3)` |
| layout | `display:flex; flex-wrap:wrap; justify-content:center; gap:4px 12px; align-items:baseline; max-width:calc(100% - 24px); box-sizing:border-box` |
| text | `font-size:13px`. Children: `white-space:nowrap` |
| duration | `.rc-duration { color:#1a73e8; font-size:15px }` (same blue as `SELECTED_STYLE`) |
| separators | `span + span`-style left border `1px solid #ddd; padding-left:12px` between items |
| hidden | `#route-card[hidden] { display:none }` (needed because `display:flex` overrides the UA `hidden` rule) |
| `.sr-only` | standard visually hidden utility (1×1 px, clip, overflow hidden) |

Must not overlap: the Leaflet attribution (bottom-right, < 28 px tall) or the zoom control (top-left). It must not block map clicks outside its own box, and clicks on it must not open the "Add stop here" popup (it is not inside the Leaflet container).

## Behaviour (`src/app.js`)

| Trigger | Effect |
|---|---|
| `selectRoute(i)` (default first route, panel click, map click, re-select) | Render the summary of `routeLayers[i].route` with `new Date()`, show the bar, (re)arm the minute timer, set `#route-card-live` text to `Route ${i+1}: ${duration}, ${distance}, arrive ${arrival}` |
| `clearRoutes()` (any new request, mode/stop change, failure, no route) | `hidden = true`, clear the timer, empty `#route-card-live` |
| Minute timer (next wall-clock minute) | Re-render the bar text only (no live-region update), re-arm |
| `drawRoutes()` fitBounds | `paddingTopLeft:[40,40]`, `paddingBottomRight:[40, 40 + card.offsetHeight + 28]` |
