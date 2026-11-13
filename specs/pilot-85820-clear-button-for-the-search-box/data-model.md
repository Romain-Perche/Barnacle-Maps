# Data Model: Clear button for the search box

No persistent data or new entities. UI state touched:

| State | Owner | Effect of clearing |
|-------|-------|--------------------|
| `#search-input` value | DOM | set to `""` |
| `#results` children | DOM | emptied |
| `#status` text | DOM | set to `""` |
| `searchSeq`, `suggestTimer` | `src/app.js` | `searchSeq++`, timer cleared (cancels pending/in-flight search) |
| `#search-clear` `hidden` | DOM | derived: hidden iff input value is `""` |
| `currentPlace`, `stops`, routes, `selectedRoute`, `mode`, markers | `src/app.js` | **unchanged** |

Invariant: `#search-clear` is visible exactly when `input.value !== ""`.
