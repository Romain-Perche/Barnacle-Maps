import {
  formatDistance,
  formatDuration,
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  results.replaceChildren();
  setStatus("Searching…");
  try {
    const found = parseSearchResults(await fetchJson(searchUrl(q)));
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
    setStatus(`Search failed: ${err.message}`);
  }
});

async function showRoute(place) {
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
