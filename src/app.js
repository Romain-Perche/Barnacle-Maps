import {
  detourWaypoints,
  formatDistance,
  formatDuration,
  formatPleasure,
  haversine,
  MIN_SUGGEST_CHARS,
  overpassQuery,
  parseOverpass,
  parseRoutes,
  parseSearchResults,
  pickRoutes,
  pleasureLevel,
  pleasureScore,
  routesBbox,
  routeUrl,
  searchUrl,
} from "./geo.js";

const L = window.L;
const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };

const map = L.map("map").setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const results = document.getElementById("results");
const status = document.getElementById("status");
const routesList = document.getElementById("routes");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_MS = 15000;
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

async function postForm(url, body, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal,
  });
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
      li.append(btn);
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

async function fetchRoutes(place, seq) {
  const main = parseRoutes(await fetchJson(routeUrl(position, place, undefined, { alternatives: 3 })));
  if (seq !== routeSeq || !main.length) return main;
  if (main.length >= 2) return pickRoutes(main);
  // OSRM often has no alternative for short walks: force detours through side waypoints.
  const detours = await Promise.allSettled(
    detourWaypoints(position, place).map((via) => fetchJson(routeUrl(position, place, undefined, { via }))),
  );
  const extra = detours
    .filter((d) => d.status === "fulfilled")
    .map((d) => parseRoutes(d.value)[0])
    .filter(Boolean);
  return pickRoutes([...main, ...extra]);
}

function drawRoutes(routes) {
  routes.forEach((route, i) => {
    const line = L.polyline(route.path, ROUTE_STYLE).addTo(map);
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    const title = document.createElement("span");
    title.textContent = `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}`;
    const pleasure = document.createElement("span");
    pleasure.className = "pleasure";
    button.append(title, pleasure);
    li.append(button);
    routesList.append(li);
    const entry = { route, line, button, pleasure };
    setPleasure(entry, "Pleasure: …", { label: "Pleasure: computing" });
    line.on("click", () => selectRoute(i));
    button.addEventListener("click", () => selectRoute(i));
    routeLayers.push(entry);
  });
  selectRoute(0);
  const bounds = L.featureGroup(routeLayers.map((r) => r.line)).getBounds();
  map.fitBounds(bounds, { padding: [40, 40] });
}

// Best-effort pleasure score from one Overpass request. Never blocks or hides the routes.
async function scorePleasure(place, seq) {
  const entries = routeLayers.slice();
  const unavailable = () => {
    if (seq !== routeSeq) return;
    for (const e of entries) setPleasure(e, "Pleasure unavailable");
  };
  if (haversine(position, place) > PLEASURE_MAX_STRAIGHT_M) return unavailable();
  const controller = new AbortController();
  pleasureAbort = controller;
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
  try {
    const query = overpassQuery(routesBbox(entries.map((e) => e.route.path)));
    const json = await postForm(OVERPASS_URL, `data=${encodeURIComponent(query)}`, controller.signal);
    if (seq !== routeSeq) return;
    const features = parseOverpass(json);
    for (const e of entries) {
      const score = pleasureScore(e.route.path, features);
      const level = pleasureLevel(score);
      setPleasure(e, `Pleasure ${formatPleasure(level)}`, {
        title: `Share of the walk near parks, water or pedestrian streets (score ${score}/100)`,
        label: `Pleasure ${level} of 5`,
      });
    }
  } catch {
    unavailable();
  } finally {
    clearTimeout(timer);
    if (pleasureAbort === controller) pleasureAbort = null;
  }
}

async function showRoute(place) {
  const seq = ++routeSeq;
  pleasureAbort?.abort();
  pleasureAbort = null;
  searchSeq++;
  clearTimeout(suggestTimer);
  input.value = place.name;
  results.replaceChildren();
  destMarker?.remove();
  clearRoutes();
  destMarker = L.marker([place.lat, place.lng]).addTo(map).bindPopup(place.name);
  if (!position) {
    map.setView([place.lat, place.lng], 15);
    return setStatus("Waiting for your location to compute a route…");
  }
  setStatus("Computing walking routes…");
  let routes;
  try {
    routes = await fetchRoutes(place, seq);
  } catch (err) {
    if (seq === routeSeq) setStatus(`Routing failed: ${err.message}`);
    return;
  }
  if (seq !== routeSeq) return; // a newer destination superseded this one
  if (!routes.length) return setStatus("No walking route found.");
  drawRoutes(routes);
  const fastest = routes[0];
  const summary = `${formatDistance(fastest.distance)} · ${formatDuration(fastest.duration)}`;
  setStatus(routes.length === 1 ? `${summary} on foot` : `${routes.length} walking routes · fastest ${summary}`);
  scorePleasure(place, seq);
}
