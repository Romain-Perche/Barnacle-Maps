import {
  formatDistance,
  formatDuration,
  MIN_SUGGEST_CHARS,
  parseRoute,
  parseSearchResults,
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

let position = null;
let userMarker = null;
let destMarker = null;
let routeLine = null;
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

async function showRoute(place) {
  searchSeq++;
  clearTimeout(suggestTimer);
  input.value = place.name;
  results.replaceChildren();
  destMarker?.remove();
  routeLine?.remove();
  destMarker = L.marker([place.lat, place.lng]).addTo(map).bindPopup(place.name);
  if (!position) {
    map.setView([place.lat, place.lng], 15);
    return setStatus("Waiting for your location to compute a route…");
  }
  setStatus("Computing walking route…");
  try {
    const route = parseRoute(await fetchJson(routeUrl(position, place)));
    if (!route) return setStatus("No walking route found.");
    routeLine = L.polyline(route.path, { color: "#1a73e8", weight: 5 }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    setStatus(`${formatDistance(route.distance)} · ${formatDuration(route.duration)} on foot`);
  } catch (err) {
    setStatus(`Routing failed: ${err.message}`);
  }
}
