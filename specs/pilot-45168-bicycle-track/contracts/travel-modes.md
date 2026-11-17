# Contract: `src/geo.js` travel modes

```js
TRAVEL_MODES.bike  // { label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike",
                   //   profile: "bike", noun: "cycling", adverb: "by bike", pleasure: true, detours: false }
Object.keys(TRAVEL_MODES)  // ["foot", "car", "bike"]
```

`routeUrl(from, to, base?, { mode: "bike", alternatives?, via?, stops? })`:

| Call | URL |
|------|-----|
| `routeUrl({lat:48.85,lng:2.35},{lat:48.86,lng:2.36},undefined,{mode:"bike"})` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometries=geojson` |
| same + `alternatives: 3` | same + `&alternatives=3` |
| same + `stops: [s1, s2]` | coordinates `from;s1;s2;to`, in order |
| explicit `base` | `${base}/route/v1/bike/...` |

Foot and car URLs are unchanged.
