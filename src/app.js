import {
  addStop,
  bestPleasure,
  countGreenPixels,
  pathPixels,
  pathTiles,
  detourWaypoints,
  formatDistance,
  formatArrival,
  formatDuration,
  mapPointStop,
  MAX_STOPS,
  MIN_SUGGEST_CHARS,
  moveStop,
  parseRoutes,
  parseSearchResults,
  pickRoutes,
  removeStop,
  routeUrl,
  searchUrl,
  straightLineLength,
  TRAVEL_MODES,
} from "./geo.js";

const L = window.L;
const TILE_URL = "https://tile.openstreetmap.org";
const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };

const map = L.map("map").setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);
L.tileLayer(`${TILE_URL}/{z}/{x}/{y}.png`, {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");
const routesList = document.getElementById("routes");
const stopsBox = document.getElementById("stops-box");
const stopsList = document.getElementById("stops");
const clearStopsBtn = document.getElementById("clear-stops");

const PLEASURE_ZOOM = 16;
const PLEASURE_RADIUS_PX = 4;
const PLEASURE_MAX_TILES = 150;
const PLEASURE_TIMEOUT_MS = 20000;
const PLEASURE_MAX_STRAIGHT_M = 15000;
const ROUTE_STYLE = { color: "#888", weight: 5, opacity: 0.7 };
const SELECTED_STYLE = { color: "#1a73e8", weight: 6, opacity: 1 };

let position = null;
let userMarker = null;
let destMarker = null;
let routeLayers = []; // one { route, line, button, pleasure } per drawn route
let selectedRoute = 0;
let routeSeq = 0;
let pleasureAbort = null;
let centered = false;
let mode = "foot";
let currentPlace = null;
let stops = []; // ordered { name, lat, lng } visited between the start and the destination
let stopMarkers = [];
let pendingRoute = false; // a route is waiting for the user's position

function setStatus(text) {
  status.textContent = text;
}

function onPosition(pos) {
  position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  const latlng = [position.lat, position.lng];
  if (!userMarker) {
    userMarker = L.circleMarker(latlng, {
      radius: 8,
      color: "#fff",
      weight: 2,
      fillColor: "#1a73e8",
      fillOpacity: 1,
    }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
  }
  if (!centered) {
    map.setView(latlng, 15);
    centered = true;
  }
  if (pendingRoute && currentPlace) updateRoutes();
}

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    onPosition,
    () => setStatus("Location unavailable. Allow location access to get directions."),
    { enableHighAccuracy: true },
  );
} else {
  setStatus("Geolocation is not supported by this browser.");
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

let searchSeq = 0;
let suggestTimer = null;
const SUGGEST_DELAY_MS = 500;

async function runSearch(q, { announce = true } = {}) {
  const seq = ++searchSeq;
  if (announce) setStatus("Searching…");
  try {
    const found = parseSearchResults(await fetchJson(searchUrl(q)));
    if (seq !== searchSeq) return; // a newer search superseded this one
    results.replaceChildren();
    if (!found.length) return setStatus("No results.");
    setStatus("");
    for (const place of found) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = place.name;
      btn.addEventListener("click", () => showRoute(place));
      const add = document.createElement("button");
      add.type = "button";
      add.className = "add-stop";
      add.textContent = "Add as stop";
      add.setAttribute("aria-label", `Add ${place.name} as stop`);
      add.addEventListener("click", () => {
        searchSeq++;
        clearTimeout(suggestTimer);
        results.replaceChildren();
        input.value = "";
        tryAddStop(place);
      });
      li.append(btn, add);
      results.append(li);
    }
  } catch (err) {
    if (seq === searchSeq) setStatus(`Search failed: ${err.message}`);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearTimeout(suggestTimer);
  const q = input.value.trim();
  if (q) runSearch(q);
});

// Pre-fill: suggest places while typing (debounced to respect Nominatim's rate limit).
input.addEventListener("input", () => {
  clearTimeout(suggestTimer);
  const q = input.value.trim();
  if (q.length < MIN_SUGGEST_CHARS) {
    searchSeq++; // drop any in-flight suggestion
    results.replaceChildren();
    setStatus("");
    return;
  }
  suggestTimer = setTimeout(() => runSearch(q, { announce: false }), SUGGEST_DELAY_MS);
});

function clearRoutes() {
  for (const { line } of routeLayers) line.remove();
  routeLayers = [];
  selectedRoute = 0;
  routesList.replaceChildren();
}

function selectRoute(i) {
  selectedRoute = i;
  routeLayers.forEach(({ line, button }, j) => {
    const on = j === i;
    line.setStyle(on ? SELECTED_STYLE : ROUTE_STYLE);
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("selected", on);
  });
  routeLayers[i]?.line.bringToFront();
}

function setPleasure(entry, text, { title = "", label = text } = {}) {
  entry.pleasure.textContent = text;
  entry.pleasure.title = title;
  entry.pleasure.setAttribute("aria-label", label);
}

async function fetchRoutes(place, seq, m, st = []) {
  const main = parseRoutes(
    await fetchJson(routeUrl(position, place, undefined, { alternatives: 3, mode: m, stops: st })),
  );
  if (seq !== routeSeq || !main.length) return main;
  // With user stops, no artificial detours: OSRM's own routes through the stops only.
  if (st.length > 0) return pickRoutes(main);
  // Car detours through arbitrary side points give silly routes: only walking forces them.
  if (main.length >= 2 || m !== "foot") return pickRoutes(main);
  // OSRM often has no alternative for short walks: force detours through side waypoints.
  const detours = await Promise.allSettled(
    detourWaypoints(position, place).map((via) =>
      fetchJson(routeUrl(position, place, undefined, { via, mode: m, stops: st })),
    ),
  );
  const extra = detours
    .filter((d) => d.status === "fulfilled")
    .map((d) => parseRoutes(d.value)[0])
    .filter(Boolean);
  return pickRoutes([...main, ...extra]);
}

function drawRoutes(routes, m, departure) {
  routes.forEach((route, i) => {
    // bubblingMouseEvents: false so a click on a route selects it without opening the add-stop popup.
    const line = L.polyline(route.path, { ...ROUTE_STYLE, bubblingMouseEvents: false }).addTo(map);
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const title = document.createElement("span");
    title.textContent = `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}, ${formatArrival(departure, route.duration)}`;
    button.append(title);
    let pleasure = null;
    if (m === "foot") {
      pleasure = document.createElement("span");
      pleasure.className = "pleasure";
      button.append(pleasure);
    }
    li.append(button);
    routesList.append(li);
    const entry = { route, line, button, pleasure };
    if (pleasure) setPleasure(entry, "Pleasure: …", { label: "Pleasure: computing" });
    line.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      selectRoute(i);
    });
    button.addEventListener("click", () => selectRoute(i));
    routeLayers.push(entry);
  });
  selectRoute(0);
  const layers = [...routeLayers.map((r) => r.line), ...stopMarkers, destMarker, userMarker].filter(Boolean);
  const bounds = L.featureGroup(layers).getBounds();
  map.fitBounds(bounds, { padding: [40, 40] });
}

async function loadTile(x, y, signal) {
  const res = await fetch(`${TILE_URL}/${PLEASURE_ZOOM}/${x}/${y}.png`, { signal });
  if (!res.ok) throw new Error(`Tile failed (${res.status})`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(256, 256)
      : Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, 256, 256).data;
}

// Best-effort pleasure: green pixels of the OSM tiles along each route. Never blocks or hides the routes.
async function scorePleasure(place, seq, st = []) {
  const entries = routeLayers.slice();
  const unavailable = () => {
    if (seq !== routeSeq) return;
    for (const e of entries) setPleasure(e, "Pleasure unavailable");
  };
  if (straightLineLength([position, ...st, place]) > PLEASURE_MAX_STRAIGHT_M) return unavailable();
  const pixels = entries.map((e) => pathPixels(e.route.path, PLEASURE_ZOOM, PLEASURE_RADIUS_PX));
  const needed = pathTiles(pixels.flat());
  if (needed.length > PLEASURE_MAX_TILES) return unavailable();
  const controller = new AbortController();
  pleasureAbort = controller;
  const timer = setTimeout(() => controller.abort(), PLEASURE_TIMEOUT_MS);
  try {
    const loaded = await Promise.all(
      needed.map(([x, y]) => loadTile(x, y, controller.signal).then((d) => [`${x}/${y}`, d])),
    );
    const tiles = new Map(loaded);
    if (seq !== routeSeq) return;
    const counts = pixels.map((p) => countGreenPixels(p, tiles));
    const best = bestPleasure(counts);
    entries.forEach((e, i) => {
      const isBest = i === best;
      setPleasure(e, `Pleasure: ${counts[i]} green px${isBest ? " · most pleasant" : ""}`, {
        title: "Green pixels (parks, grass, woods) on the map along this walk; more is more pleasant",
        label: `Pleasure ${counts[i]} green pixels${isBest ? ", most pleasant" : ""}`,
      });
      e.pleasure.classList.toggle("best", isBest);
    });
  } catch {
    unavailable();
  } finally {
    clearTimeout(timer);
    if (pleasureAbort === controller) pleasureAbort = null;
  }
}

function showRoute(place) {
  currentPlace = place;
  searchSeq++;
  clearTimeout(suggestTimer);
  input.value = place.name;
  results.replaceChildren();
  destMarker?.remove();
  destMarker = L.marker([place.lat, place.lng]).addTo(map).bindPopup(place.name);
  updateRoutes();
}

// Computes and draws the routes from the user's position through every stop to the destination.
async function updateRoutes() {
  const m = mode;
  const place = currentPlace;
  const st = stops.slice(); // consistent list for this request even if stops change meanwhile
  const seq = ++routeSeq;
  pleasureAbort?.abort();
  pleasureAbort = null;
  pendingRoute = false;
  clearRoutes();
  if (!place) {
    return setStatus(st.length ? "Choose a destination to get a route through your stops." : "");
  }
  if (!position) {
    pendingRoute = true;
    map.setView([place.lat, place.lng], 15);
    return setStatus("Waiting for your location to compute a route…");
  }
  setStatus(m === "car" ? "Computing driving routes…" : "Computing walking routes…");
  const noRoute = m === "car" ? "No driving route found." : "No walking route found.";
  let routes;
  try {
    routes = await fetchRoutes(place, seq, m, st);
  } catch (err) {
    if (seq === routeSeq) setStatus(st.length ? `${noRoute} (${err.message})` : `Routing failed: ${err.message}`);
    return;
  }
  if (seq !== routeSeq) return; // a newer request superseded this one
  if (!routes.length) return setStatus(st.length ? `${noRoute} Try removing a stop.` : noRoute);
  const departure = new Date();
  drawRoutes(routes, m, departure);
  const fastest = routes[0];
  const summary = `${formatDistance(fastest.distance)} · ${formatDuration(fastest.duration)}`;
  const car = m === "car";
  const via = st.length ? ` via ${st.length} stop${st.length > 1 ? "s" : ""}` : "";
  setStatus(
    routes.length === 1
      ? `${summary} ${car ? "by car" : "on foot"}${via}`
      : `${routes.length} ${car ? "driving" : "walking"} routes${via} · fastest ${summary}`,
  );
  if (!car) scorePleasure(place, seq, st);
}

// --- Stops ----------------------------------------------------------------------------------

function stopButton(text, label, disabled, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.setAttribute("aria-label", label);
  b.disabled = disabled;
  b.addEventListener("click", onClick);
  return b;
}

function renderStops() {
  for (const mk of stopMarkers) mk.remove();
  stopMarkers = stops.map((s, i) =>
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({ className: "stop-marker", html: String(i + 1), iconSize: [24, 24], iconAnchor: [12, 12] }),
      title: `Stop ${i + 1}: ${s.name}`,
    })
      .addTo(map)
      .bindTooltip(`${i + 1}. ${s.name}`),
  );
  stopsList.replaceChildren(
    ...stops.map((s, i) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "stop-name";
      name.textContent = `${i + 1}. ${s.name}`;
      li.append(
        name,
        stopButton("\u2191", `Move stop ${i + 1} up`, i === 0, () => setStops(moveStop(stops, i, -1))),
        stopButton("\u2193", `Move stop ${i + 1} down`, i === stops.length - 1, () =>
          setStops(moveStop(stops, i, 1)),
        ),
        stopButton("\u2715", `Remove stop ${i + 1}`, false, () => setStops(removeStop(stops, i))),
      );
      return li;
    }),
  );
  stopsBox.hidden = stops.length === 0;
}

function setStops(next) {
  stops = next;
  renderStops();
  updateRoutes();
}

function tryAddStop(place) {
  const r = addStop(stops, place);
  if (r.error === "limit") return setStatus(`You can add at most ${MAX_STOPS} stops.`);
  if (r.error === "duplicate") return setStatus("This place is already a stop.");
  setStops(r.stops);
}

clearStopsBtn.addEventListener("click", () => setStops([]));

// Click on the map (not after a drag): offer to add a stop at that point.
map.on("click", (e) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "add-stop-here";
  btn.textContent = "Add stop here";
  const popup = L.popup().setLatLng(e.latlng).setContent(btn).openOn(map);
  btn.addEventListener("click", () => {
    map.closePopup(popup);
    tryAddStop(mapPointStop(e.latlng));
  });
});

for (const radio of document.querySelectorAll("input[name=mode]")) {
  radio.addEventListener("change", () => {
    if (!radio.checked || !(radio.value in TRAVEL_MODES)) return;
    mode = radio.value;
    if (currentPlace) updateRoutes(); // stops are kept
  });
}
