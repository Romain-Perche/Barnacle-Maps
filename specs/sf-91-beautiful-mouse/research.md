# Research

- **Decision**: CSS-only cursor with an SVG file at `assets/map-cursor.svg`, hot spot `12 12`, fallback `crosshair`. **Rationale**: mandated by blueprint `ui/map-cursor@1`; no JS, no dependency, local file. **Alternatives**: a Leaflet cursor plugin or a JS-drawn overlay element (rejected: dependency/complexity, lag, wrong click point); a PNG (rejected: blurry on high-DPI).
- **Decision**: leave Leaflet's `.leaflet-interactive` pointer and grabbing-while-dragging rules as is, add explicit `pointer` for zoom/attribution/popup buttons and `auto` for the popup body. **Rationale**: Leaflet 1.9.4's own CSS sets `grab` on `.leaflet-grab`, which is what we override; other elements inherit the container cursor otherwise.
- No NEEDS CLARIFICATION remained.
