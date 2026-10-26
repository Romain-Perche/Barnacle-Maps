import {
  buildSearchUrl, parseSearchResults, buildRouteUrl, parseRoute, formatDistance, formatDuration,
} from './geo.js';

const map = L.map('map').setView([48.8566, 2.3522], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
let position = null;
let youMarker = null;
let destMarker = null;
let routeLine = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function locate() {
  if (!navigator.geolocation) return setStatus('Geolocation is not supported by this browser.');
  navigator.geolocation.watchPosition(
    (p) => {
      const first = !position;
      position = { lat: p.coords.latitude, lon: p.coords.longitude };
      if (youMarker) youMarker.setLatLng([position.lat, position.lon]);
      else youMarker = L.circleMarker([position.lat, position.lon], { radius: 8, color: '#1a73e8', fillOpacity: 0.9 })
        .addTo(map).bindTooltip('You are here');
      if (first) map.setView([position.lat, position.lon], 15);
    },
    () => setStatus('Could not get your location. Allow location access to get directions.'),
    { enableHighAccuracy: true },
  );
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function search(query) {
  resultsEl.replaceChildren();
  setStatus('Searching…');
  try {
    const results = parseSearchResults(await fetchJson(buildSearchUrl(query)));
    setStatus(results.length ? '' : 'No results found.');
    for (const r of results) {
      const li = document.createElement('li');
      li.textContent = r.name;
      li.addEventListener('click', () => route(r));
      resultsEl.append(li);
    }
  } catch (e) {
    setStatus(`Search failed: ${e.message}`);
  }
}

async function route(dest) {
  resultsEl.replaceChildren();
  if (!position) return setStatus('Waiting for your location…');
  setStatus('Computing route…');
  try {
    const r = parseRoute(await fetchJson(buildRouteUrl(position, dest)));
    if (!r) return setStatus('No walking route found.');
    if (routeLine) routeLine.remove();
    if (destMarker) destMarker.remove();
    routeLine = L.polyline(r.path, { color: '#1a73e8', weight: 5 }).addTo(map);
    destMarker = L.marker([dest.lat, dest.lon]).addTo(map).bindTooltip(dest.name);
    map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
    setStatus(`${formatDistance(r.distance)} · ${formatDuration(r.duration)} on foot`);
  } catch (e) {
    setStatus(`Routing failed: ${e.message}`);
  }
}

document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.getElementById('query').value.trim();
  if (q) search(q);
});

locate();
