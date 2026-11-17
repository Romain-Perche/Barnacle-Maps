// Runs the real src/app.js in Node with a minimal fake DOM, a fake Leaflet, fake geolocation and a
// fake fetch (OSRM through ./osrm.js, Nominatim in its documented jsonv2 shape, map tiles all green).
// Each loadApp() imports a fresh copy of app.js, so tests do not share state.
import { readFileSync } from "node:fs";
import { answerRoute } from "./osrm.js";

class ClassList {
  constructor() { this.set = new Set(); }
  add(c) { this.set.add(c); }
  remove(c) { this.set.delete(c); }
  contains(c) { return this.set.has(c); }
  toggle(c, on = !this.set.has(c)) { on ? this.set.add(c) : this.set.delete(c); return on; }
}

export class El {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.listeners = {};
    this.attrs = {};
    this.classList = new ClassList();
    this._text = "";
    this.hidden = false;
    this.disabled = false;
    this.title = "";
    this.type = "";
    Object.assign(this, attrs);
  }
  get className() { return [...this.classList.set].join(" "); }
  set className(v) { this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set textContent(v) { this._text = String(v); this.children = []; }
  append(...c) { this.children.push(...c); }
  replaceChildren(...c) { this.children = [...c]; this._text = ""; }
  remove() {}
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  dispatch(t, ev = {}) { for (const f of this.listeners[t] || []) f({ preventDefault() {}, target: this, ...ev }); }
  click() { this.dispatch("click"); }
  // All descendants (depth first), including this element.
  all() { return [this, ...this.children.flatMap((c) => (c instanceof El ? c.all() : []))]; }
}

const PLACE = { display_name: "Jardin des Plantes, Paris, France", lat: "48.8440", lon: "2.3596" };
// Nominatim jsonv2 search answer (fields from the Nominatim "Place Output Formats" docs).
export function nominatimPlace({ display_name, lat, lon } = PLACE) {
  return {
    place_id: 100149, licence: "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
    osm_type: "way", osm_id: 4210424, lat, lon, category: "leisure", type: "park", place_rank: 24,
    importance: 0.5, addresstype: "park", name: display_name.split(",")[0], display_name,
    boundingbox: [lat, lat, lon, lon],
  };
}

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, blob: async () => ({}) };
}

// options:
//   position: { lat, lng } given by geolocation (default Paris, about 1.4 km from the place)
//   osrm(url) -> { status, body } | Promise: override the OSRM answer (default answerRoute(url))
//   routes: max routes per OSRM answer; noRoute: answer NoRoute; tiles: "green" (default) | "fail"
//   noPosition: true -> no position until the test calls app.setPosition()
export async function loadApp(options = {}) {
  const position = options.position ?? { lat: 48.8566, lng: 2.3522 };
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const els = {};
  for (const id of ["map", "search-form", "search-input", "results", "status", "routes", "stops-box", "stops", "clear-stops"]) {
    els[id] = new El("div", { id });
  }
  els["stops-box"].hidden = true;
  // Mode radios read from the real index.html, in document order.
  const radios = [...html.matchAll(/<input\b[^>]*name="mode"[^>]*>/g)].map((m) => {
    const value = m[0].match(/value="([^"]*)"/)?.[1];
    return new El("input", { type: "radio", name: "mode", value, checked: /\schecked\b/.test(m[0]) });
  });
  const fetchLog = [];
  const document = {
    getElementById: (id) => els[id] ?? null,
    createElement: (tag) => new El(tag),
    querySelectorAll: (sel) => (sel === "input[name=mode]" ? radios : []),
  };
  const layers = [];
  const layer = (kind, extra = {}) => {
    const l = {
      kind, removed: false, listeners: {}, style: null,
      addTo() { layers.push(l); return l; }, remove() { l.removed = true; return l; },
      bindPopup() { return l; }, bindTooltip() { return l; }, setLatLng() { return l; },
      setStyle(s) { l.style = s; return l; }, bringToFront() { return l; },
      on(t, f) { (l.listeners[t] ||= []).push(f); return l; },
      getBounds() { return {}; }, setContent() { return l; }, openOn() { return l; },
      ...extra,
    };
    return l;
  };
  const map = layer("map", { setView() { return map; }, fitBounds() { return map; }, closePopup() {} });
  const L = {
    map: () => map,
    tileLayer: () => layer("tiles"),
    circleMarker: () => layer("circle"),
    marker: () => layer("marker"),
    polyline: (path, style) => layer("polyline", { path, style }),
    featureGroup: () => layer("group"),
    popup: () => layer("popup", { setLatLng() { return this; } }),
    divIcon: () => ({}),
    DomEvent: { stopPropagation() {} },
  };
  let watch = null;
  const g = globalThis;
  g.window = { L };
  g.document = document;
  Object.defineProperty(g, "navigator", {
    configurable: true, writable: true,
    value: { geolocation: { watchPosition: (ok) => { watch = ok; } } },
  });
  g.createImageBitmap = async () => ({});
  g.OffscreenCanvas = class {
    getContext() {
      const data = new Uint8ClampedArray(256 * 256 * 4);
      for (let i = 0; i < data.length; i += 4) data.set([170, 224, 160, 255], i); // park green
      return { drawImage() {}, getImageData: () => ({ data }) };
    }
  };
  g.fetch = async (url, init = {}) => {
    url = String(url);
    fetchLog.push(url);
    if (url.startsWith("https://nominatim.openstreetmap.org/search?")) {
      return response(200, [nominatimPlace(options.place)]);
    }
    if (url.startsWith("https://tile.openstreetmap.org/")) {
      if (init.signal?.aborted) throw new Error("aborted");
      return options.tiles === "fail" ? response(503, {}) : response(200, {});
    }
    if (url.startsWith("https://routing.openstreetmap.de/")) {
      const a = await (options.osrm ? options.osrm(url) : answerRoute(url, options));
      return response(a.status, a.body);
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  await import(`../../src/app.js?instance=${Math.random()}`);

  const flush = async (n = 20) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0)); };
  const app = {
    els, radios, fetchLog, layers, map,
    status: () => els.status.textContent,
    routeButtons: () => els.routes.all().filter((e) => e.tagName === "BUTTON"),
    routeTitles: () => app.routeButtons().map((b) => b.children[0]?.textContent ?? ""),
    pleasures: () => app.routeButtons().map((b) => b.all().find((e) => e.classList.contains("pleasure")) ?? null),
    drawnLines: () => layers.filter((l) => l.kind === "polyline" && !l.removed),
    osrmUrls: () => fetchLog.filter((u) => u.startsWith("https://routing.openstreetmap.de/")),
    async setPosition(p = position) { watch?.({ coords: { latitude: p.lat, longitude: p.lng } }); await flush(); },
    async selectMode(value) {
      const r = radios.find((x) => x.value === value);
      if (!r) throw new Error(`no mode radio with value ${value} in index.html`);
      for (const x of radios) x.checked = x === r;
      r.dispatch("change");
      await flush();
    },
    // Types a query, submits, clicks the first result (destination) or "Add as stop".
    async search(q = "Jardin des Plantes", { asStop = false } = {}) {
      els["search-input"].value = q;
      els["search-form"].dispatch("submit");
      await flush();
      const li = els.results.children[0];
      if (!li) throw new Error(`no search result; status: ${app.status()}`);
      li.children[asStop ? 1 : 0].click();
      await flush();
    },
    async addStop(place) {
      const saved = options.place;
      options.place = place;
      await app.search(place.display_name, { asStop: true });
      options.place = saved;
    },
    flush,
  };
  if (!options.noPosition) await app.setPosition();
  return app;
}
