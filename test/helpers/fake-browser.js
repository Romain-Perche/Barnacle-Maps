// Minimal fake browser for driving src/app.js under `node --test` without dependencies:
// a tiny DOM built from the real index.html, a fake Leaflet, a scripted fetch and geolocation.
// Only what app.js uses is implemented.
import { readFileSync } from "node:fs";

const VOID = new Set(["meta", "link", "input", "br", "img", "hr"]);

export class El {
  constructor(tag, attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this.listeners = {};
    this._text = "";
    this.textWrites = 0;
    this.hidden = "hidden" in attrs;
    this.value = attrs.value ?? "";
    this.checked = "checked" in attrs;
    this.disabled = false;
    this.title = "";
    this.style = {};
    this.offsetHeight = 0;
    const self = this;
    this.classList = {
      get _set() { return new Set((self.attrs.class || "").split(/\s+/).filter(Boolean)); },
      contains: (c) => self.classList._set.has(c),
      add: (c) => { const s = self.classList._set; s.add(c); self.attrs.class = [...s].join(" "); },
      remove: (c) => { const s = self.classList._set; s.delete(c); self.attrs.class = [...s].join(" "); },
      toggle: (c, on) => {
        const want = on === undefined ? !self.classList.contains(c) : !!on;
        want ? self.classList.add(c) : self.classList.remove(c);
        return want;
      },
    };
  }
  get id() { return this.attrs.id || ""; }
  get className() { return this.attrs.class || ""; }
  set className(v) { this.attrs.class = v; }
  get type() { return this.attrs.type || ""; }
  set type(v) { this.attrs.type = v; }
  get name() { return this.attrs.name || ""; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set textContent(v) {
    this.textWrites++;
    for (const c of this.children) c.parent = null;
    this.children = [];
    this._text = String(v ?? "");
  }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === "hidden") this.hidden = true; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; if (k === "hidden") this.hidden = false; }
  append(...nodes) {
    for (const n of nodes) {
      const node = typeof n === "string" ? Object.assign(new El("#text"), { _text: n }) : n;
      node.parent = this;
      this.children.push(node);
    }
  }
  replaceChildren(...nodes) { this.children = []; this._text = ""; this.append(...nodes); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type, ev = {}) {
    const e = { target: this, preventDefault() {}, stopPropagation() {}, ...ev };
    for (const fn of this.listeners[type] || []) fn(e);
  }
  click() { if (!this.disabled) this.dispatch("click"); }
  *descendants() { for (const c of this.children) { yield c; yield* c.descendants(); } }
  matches(sel) {
    const m = /^([a-z]*)(?:#([\w-]+))?(?:\.([\w-]+))?(?:\[(\w[\w-]*)(?:=["']?([^"'\]]*)["']?)?\])?$/i.exec(sel.trim());
    if (!m) throw new Error(`fake DOM: unsupported selector ${sel}`);
    const [, tag, id, cls, attr, val] = m;
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    if (id && this.id !== id) return false;
    if (cls && !this.classList.contains(cls)) return false;
    if (attr && (this.getAttribute(attr) === null || (val !== undefined && this.getAttribute(attr) !== val))) return false;
    return true;
  }
  querySelectorAll(sel) {
    const parts = sel.split(",");
    return [...this.descendants()].filter((d) => d.tagName !== "#TEXT" && parts.some((p) => d.matches(p)));
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
}

// Parses the <body> of an HTML string into El nodes (scripts skipped). Enough for index.html.
export function parseBody(html) {
  const body = new El("body");
  const src = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const stack = [body];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  let first = true;
  while ((m = re.exec(src))) {
    if (first) { first = false; if (m[2] === "body") continue; }
    const [, close, tag, rawAttrs, selfClose, text] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined) { if (text.trim()) top.append(text.trim()); continue; }
    if (!tag) continue;
    const t = tag.toLowerCase();
    if (close) {
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName === t.toUpperCase()) { stack.length = i; break; }
      continue;
    }
    if (t === "script") { re.lastIndex = src.indexOf("</script>", re.lastIndex) + 9; continue; }
    const attrs = {};
    for (const a of rawAttrs.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
      attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? "";
    const el = new El(t, attrs);
    top.append(el);
    if (!VOID.has(t) && !selfClose) stack.push(el);
  }
  return body;
}

// --- Fake Leaflet ----------------------------------------------------------------------------

function layer(kind, props = {}) {
  const l = {
    kind, ...props, handlers: {}, styleHistory: [], onMap: false,
    addTo() { l.onMap = true; return l; },
    remove() { l.onMap = false; return l; },
    setLatLng(ll) { l.latlng = ll; return l; },
    bindPopup() { return l; },
    bindTooltip() { return l; },
    setStyle(s) { l.style = { ...l.style, ...s }; l.styleHistory.push(s); return l; },
    bringToFront() { return l; },
    on(evt, fn) { (l.handlers[evt] ||= []).push(fn); return l; },
    fire(evt, e = {}) { for (const fn of l.handlers[evt] || []) fn({ originalEvent: {}, ...e }); },
  };
  return l;
}

function fakeLeaflet() {
  const created = { polylines: [], popups: [] };
  const map = layer("map", { fitCalls: [], viewCalls: [] });
  map.setView = (...a) => { map.viewCalls.push(a); return map; };
  map.fitBounds = (bounds, opts) => { map.fitCalls.push(opts); return map; };
  map.closePopup = () => map;
  const L = {
    map: () => map,
    tileLayer: () => layer("tiles"),
    circleMarker: (ll, o) => layer("circleMarker", { latlng: ll, style: o }),
    marker: (ll, o) => layer("marker", { latlng: ll, options: o }),
    polyline: (path, o) => {
      const p = layer("polyline", { path, style: { ...o } });
      created.polylines.push(p);
      return p;
    },
    featureGroup: () => ({ getBounds: () => ({}) }),
    divIcon: (o) => o,
    popup: () => {
      const p = layer("popup");
      p.setContent = (c) => { p.content = c; return p; };
      p.openOn = () => p;
      created.popups.push(p);
      return p;
    },
    DomEvent: { stopPropagation() {} },
  };
  return { L, map, created };
}

// --- Fake network ----------------------------------------------------------------------------

// OSRM-like response: each route is { distance, duration, path: [[lat, lng], ...] }.
export function osrm(routes) {
  return {
    code: "Ok",
    routes: routes.map((r) => ({
      distance: r.distance,
      duration: r.duration,
      geometry: { coordinates: r.path.map(([lat, lng]) => [lng, lat]) },
    })),
  };
}

const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body, blob: async () => ({}) });

// Scripted fetch. net.route(url) returns the OSRM body (or throws to fail); net.hold() makes
// route requests wait until net.release().
function fakeNetwork() {
  const net = {
    calls: [],
    held: [],
    holding: false,
    places: [{ display_name: "Louvre", lat: "48.86", lon: "2.36" }],
    route: () => osrm([]),
    hold() { net.holding = true; },
    release() { net.holding = false; for (const r of net.held.splice(0)) r(); },
  };
  net.fetch = (url) => {
    const u = String(url);
    net.calls.push(u);
    if (u.includes("nominatim")) return Promise.resolve(json(net.places));
    if (u.includes("/route/v1/") || u.includes("routed-")) {
      const answer = () => {
        const body = net.route(u);
        return body instanceof Error ? Promise.reject(body) : json(body);
      };
      if (net.holding) return new Promise((res) => net.held.push(() => res(answer())));
      return Promise.resolve().then(answer);
    }
    return Promise.reject(new Error("offline in tests")); // map tiles (pleasure): unavailable
  };
  return net;
}

// --- Boot -------------------------------------------------------------------------------------

let bootCount = 0;

export const flush = async (n = 20) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r));
};

// Installs the fakes as globals and imports a fresh copy of src/app.js.
export async function boot() {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const body = parseBody(html);
  const document = {
    body,
    getElementById: (id) => body.querySelector(`#${id}`),
    querySelector: (s) => body.querySelector(s),
    querySelectorAll: (s) => body.querySelectorAll(s),
    createElement: (t) => new El(t),
  };
  const { L, map, created } = fakeLeaflet();
  const net = fakeNetwork();
  const geo = { watchers: [] };
  const navigator = {
    geolocation: { watchPosition: (ok, err) => { geo.watchers.push({ ok, err }); return 1; } },
  };
  globalThis.document = document;
  globalThis.window = { L };
  globalThis.L = L;
  Object.defineProperty(globalThis, "navigator", { value: navigator, configurable: true, writable: true });
  globalThis.fetch = net.fetch;
  await import(`../../src/app.js?boot=${++bootCount}`);
  const app = {
    document, map, created, net, geo,
    $: (id) => document.getElementById(id),
    setPosition(lat, lng) { for (const w of geo.watchers) w.ok({ coords: { latitude: lat, longitude: lng } }); },
    // Types a query, submits, and clicks the first result (routes to that place).
    async searchAndPick(q = "Louvre") {
      app.$("search-input").value = q;
      app.$("search-form").dispatch("submit");
      await flush();
      const btn = app.$("results").querySelector("button");
      if (!btn) throw new Error("no search result button");
      btn.click();
      await flush();
    },
    routeButtons: () => app.$("routes").querySelectorAll("button"),
    // Panel text of route i (0-based): { distance, duration } as the panel prints them.
    panelFigures(i) {
      const title = app.routeButtons()[i].querySelector("span").textContent; // "Route 1 · 2.35 km · 25 min"
      const [, distance, duration] = title.split(" · ");
      return { distance, duration };
    },
    drawnLines: () => created.polylines.filter((p) => p.onMap),
    async setMode(value) {
      for (const r of document.querySelectorAll("input[name=mode]")) r.checked = r.value === value;
      for (const r of document.querySelectorAll("input[name=mode]")) if (r.checked) r.dispatch("change");
      await flush();
    },
    async clickMapAndAddStop(lat, lng) {
      for (const fn of map.handlers.click || []) fn({ latlng: { lat, lng } });
      const popup = created.popups[created.popups.length - 1];
      popup.content.click();
      await flush();
    },
  };
  return app;
}
