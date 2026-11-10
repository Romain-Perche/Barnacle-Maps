// Test-only harness: a minimal fake DOM, Leaflet (window.L), geolocation, matchMedia and fetch, so
// src/app.js can be loaded and driven under `node --test` with no browser and no dependencies.
// It records every Leaflet call and every DOM mutation, so tests can check that a reset changes
// nothing but the map view. This file defines no tests.

// ---------------------------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------------------------

const REFLECTED = { id: "id", title: "title", type: "type", className: "class", name: "name" };

export class FakeElement {
  constructor(doc, tag, ns = null) {
    this.ownerDocument = doc;
    this.localName = String(tag).toLowerCase();
    this.tagName = ns ? this.localName : this.localName.toUpperCase();
    this.namespaceURI = ns;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.dataset = {};
    this._text = "";
    this._html = "";
    this._value = "";
    this._checked = false;
    this._disabled = false;
    this.onclick = null;
    const el = this;
    this.classList = {
      _list: () => (el.getAttribute("class") || "").split(/\s+/).filter(Boolean),
      add(...c) { el.setAttribute("class", [...new Set([...this._list(), ...c])].join(" ")); },
      remove(...c) { el.setAttribute("class", this._list().filter((x) => !c.includes(x)).join(" ")); },
      toggle(c, force) {
        const on = force === undefined ? !this.contains(c) : !!force;
        if (on) this.add(c); else this.remove(c);
        return on;
      },
      contains(c) { return this._list().includes(c); },
    };
    for (const [prop, attr] of Object.entries(REFLECTED)) {
      Object.defineProperty(this, prop, {
        get: () => this.getAttribute(attr) ?? "",
        set: (v) => this.setAttribute(attr, String(v)),
        enumerable: true,
      });
    }
  }

  _mutate() { this.ownerDocument.mutations.push(this); }

  setAttribute(n, v) { this.attributes.set(n, String(v)); if (n === "disabled") this._disabled = true; this._mutate(); }
  getAttribute(n) {
    if (n === "aria-label" && !this.attributes.has(n) && this._ariaLabel != null) return this._ariaLabel;
    return this.attributes.has(n) ? this.attributes.get(n) : null;
  }
  hasAttribute(n) { return this.getAttribute(n) !== null; }
  removeAttribute(n) { this.attributes.delete(n); if (n === "disabled") this._disabled = false; this._mutate(); }
  get ariaLabel() { return this.getAttribute("aria-label"); }
  set ariaLabel(v) { this._ariaLabel = v; this._mutate(); }
  get disabled() { return this._disabled; }
  set disabled(v) { this._disabled = !!v; this._mutate(); }
  get value() { return this._value; }
  set value(v) { this._value = String(v); this._mutate(); }
  get checked() { return this._checked; }
  set checked(v) { this._checked = !!v; this._mutate(); }

  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set textContent(v) { this._detachAll(); this._text = String(v ?? ""); this._html = ""; this._mutate(); }
  get innerHTML() { return this._html || this._text; }
  set innerHTML(v) { this._detachAll(); this._html = String(v ?? ""); this._text = ""; this._mutate(); }
  get firstChild() { return this.children[0] ?? null; }
  get childNodes() { return this.children; }

  _detachAll() { for (const c of this.children) c.parentNode = null; this.children = []; }
  _adopt(node) {
    if (typeof node === "string") { const t = this.ownerDocument.createTextNode(node); return this._adopt(t); }
    node.parentNode?.children.splice(node.parentNode.children.indexOf(node), 1);
    node.parentNode = this;
    return node;
  }
  append(...nodes) { for (const n of nodes) this.children.push(this._adopt(n)); this._mutate(); }
  appendChild(n) { this.append(n); return n; }
  prepend(...nodes) { this.children.unshift(...nodes.map((n) => this._adopt(n))); this._mutate(); }
  insertBefore(n, ref) {
    const node = this._adopt(n);
    const i = ref ? this.children.indexOf(ref) : -1;
    if (i < 0) this.children.push(node); else this.children.splice(i, 0, node);
    this._mutate();
    return n;
  }
  removeChild(n) { const i = this.children.indexOf(n); if (i >= 0) { this.children.splice(i, 1); n.parentNode = null; } this._mutate(); return n; }
  replaceChildren(...nodes) { this._detachAll(); this._text = ""; this._html = ""; this.append(...nodes); }
  remove() { this.parentNode?.removeChild(this); }
  contains(n) { for (let x = n; x; x = x.parentNode) if (x === this) return true; return false; }
  closest(sel) { for (let x = this; x; x = x.parentNode) if (x.matches?.(sel)) return x; return null; }
  matches(sel) {
    return sel.split(",").some((s) => {
      s = s.trim();
      const m = s.match(/^([a-z0-9]+)?(?:#([\w-]+))?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\])?$/i);
      if (!m) return false;
      const [, tag, id, classes, attr, val] = m;
      if (tag && this.localName !== tag.toLowerCase()) return false;
      if (id && this.id !== id) return false;
      for (const c of (classes || "").split(".").filter(Boolean)) if (!this.classList.contains(c)) return false;
      if (attr) {
        const actual = attr === "name" ? this.name : this.getAttribute(attr);
        if (actual === null || actual === "") return false;
        if (val !== undefined && actual !== val) return false;
      }
      return true;
    });
  }
  *descendants() { for (const c of this.children) { yield c; yield* c.descendants(); } }
  querySelectorAll(sel) { return [...this.descendants()].filter((e) => e.matches(sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const l = this.listeners.get(type) || [];
    const i = l.indexOf(fn);
    if (i >= 0) l.splice(i, 1);
  }
  // Like a browser: an exception in a listener doesn't reach the dispatcher. It is reported as an
  // uncaught error instead (doc.uncaught), so tests can tell a caught error from an uncaught one.
  dispatchEvent(ev) {
    ev.target ??= this;
    ev.currentTarget = this;
    const fns = [...(this.listeners.get(ev.type) || [])];
    if (ev.type === "click" && typeof this.onclick === "function") fns.push(this.onclick);
    for (const fn of fns) {
      try { (typeof fn === "function" ? fn : fn.handleEvent.bind(fn)).call(this, ev); }
      catch (err) { this.ownerDocument.uncaught.push(err); }
    }
    return !ev.defaultPrevented;
  }
  click() { this.dispatchEvent(makeEvent("click", { button: 0, detail: 1 })); }
  focus() { this.ownerDocument.focusCalls.push(this); this.ownerDocument.activeElement = this; }
  blur() { if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = this.ownerDocument.body; }
  getBoundingClientRect() { return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  scrollIntoView() {}
}

export function makeEvent(type, props = {}) {
  return {
    type,
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() {},
    stopImmediatePropagation() {},
    ...props,
  };
}

export class FakeDocument {
  constructor() {
    this.mutations = [];
    this.uncaught = [];
    this.focusCalls = [];
    this.documentElement = new FakeElement(this, "html");
    this.body = new FakeElement(this, "body");
    this.documentElement.append(this.body);
    this.activeElement = this.body;
  }
  createElement(tag) { return new FakeElement(this, tag); }
  createElementNS(ns, tag) { return new FakeElement(this, tag, ns); }
  createTextNode(text) {
    const t = new FakeElement(this, "#text");
    t._text = String(text);
    return t;
  }
  createDocumentFragment() { return new FakeElement(this, "#fragment"); }
  getElementById(id) { return [...this.documentElement.descendants()].find((e) => e.id === id) ?? null; }
  querySelectorAll(sel) { return this.documentElement.querySelectorAll(sel); }
  querySelector(sel) { return this.documentElement.querySelector(sel); }
  addEventListener() {}
  removeEventListener() {}
}

// The page from index.html: #map and #panel with the search form, mode radios, results, routes, status.
function buildPage(doc) {
  const el = (tag, attrs = {}, ...kids) => {
    const e = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    e.append(...kids);
    return e;
  };
  const foot = el("input", { type: "radio", name: "mode", value: "foot" });
  foot._checked = true;
  const car = el("input", { type: "radio", name: "mode", value: "car" });
  foot._value = "foot";
  car._value = "car";
  doc.body.append(
    el("div", { id: "map" }),
    el("div", { id: "panel" },
      el("form", { id: "search-form" },
        el("input", { id: "search-input", type: "search", "aria-label": "Search a place" }),
        el("button", { type: "submit" }, "Go")),
      el("div", { id: "mode", role: "radiogroup", "aria-label": "Travel mode" },
        el("label", {}, foot, " Walk"), el("label", {}, car, " Car")),
      el("ul", { id: "results" }),
      el("ul", { id: "routes", "aria-label": "Route options" }),
      el("p", { id: "status", role: "status" })),
  );
  doc.mutations.length = 0;
}

// ---------------------------------------------------------------------------------------------
// Leaflet
// ---------------------------------------------------------------------------------------------

export function toLatLng(a, b) {
  if (Array.isArray(a)) return { lat: Number(a[0]), lng: Number(a[1]) };
  if (a && typeof a === "object") return { lat: Number(a.lat), lng: Number(a.lng ?? a.lon) };
  return { lat: Number(a), lng: Number(b) };
}

function createFakeLeaflet(doc, calls) {
  let seq = 0;

  // A layer whose every method call is recorded and returns the layer (chainable, like Leaflet).
  function recorder(kind, base = {}) {
    const name = `${kind}#${++seq}`;
    const target = { _name: name, _kind: kind, ...base };
    const proxy = new Proxy(target, {
      get(t, prop) {
        if (prop in t) return t[prop];
        if (typeof prop === "symbol" || prop === "then") return undefined;
        return (...args) => { calls.push({ target: name, kind, method: prop, args }); return proxy; };
      },
    });
    return proxy;
  }

  function layer(kind, latlng, extra = {}) {
    const state = { latlng: latlng === undefined ? null : toLatLng(latlng) };
    let self;
    self = recorder(kind, {
      _state: state,
      getLatLng: () => ({ ...state.latlng }),
      setLatLng(ll) { calls.push({ target: self._name, kind, method: "setLatLng", args: [ll] }); state.latlng = toLatLng(ll); return self; },
      ...extra,
    });
    return self;
  }

  const mapEl = doc.getElementById("map");
  const corners = {};
  for (const pos of ["topleft", "topright", "bottomleft", "bottomright"]) {
    corners[pos] = doc.createElement("div");
    corners[pos].setAttribute("class", `leaflet-${pos.startsWith("top") ? "top" : "bottom"} leaflet-${pos.endsWith("left") ? "left" : "right"}`);
    mapEl.append(corners[pos]);
  }

  let map;
  function createMap() {
    const view = { center: null, zoom: null };
    const controls = [];
    map = recorder("map", {
      _view: view,
      _controls: controls,
      _corners: corners,
      throwOnSetView: null,
      setView(center, zoom, options) {
        calls.push({ target: "map", kind: "map", method: "setView", args: [center, zoom, options] });
        if (map.throwOnSetView) throw map.throwOnSetView;
        view.center = toLatLng(center);
        if (zoom !== undefined) view.zoom = zoom;
        return map;
      },
      fitBounds(bounds, options) {
        calls.push({ target: "map", kind: "map", method: "fitBounds", args: [bounds, options] });
        view.center = { lat: 0.5, lng: 0.5 }; // somewhere that is not a starting view
        view.zoom = 16;
        return map;
      },
      getCenter: () => ({ ...view.center }),
      getZoom: () => view.zoom,
      getContainer: () => mapEl,
      addControl(control) { control.addTo(map); return map; },
    });
    return map;
  }

  class Control {
    constructor(options) {
      this.options = { position: "topright", ...this.options, ...(options || {}) };
      if (typeof this.initialize === "function") this.initialize(options);
    }
    getPosition() { return this.options.position; }
    setPosition(p) { this.options.position = p; return this; }
    getContainer() { return this._container; }
    addTo(m) {
      this._map = m;
      const container = this.onAdd(m);
      this._container = container;
      container.classList.add("leaflet-control");
      const pos = this.getPosition();
      if (pos.startsWith("bottom")) corners[pos].insertBefore(container, corners[pos].firstChild);
      else corners[pos].append(container);
      m._controls.push({ control: this, container, position: pos });
      return this;
    }
    remove() {
      this._container?.remove();
      const i = this._map?._controls.findIndex((c) => c.control === this);
      if (i >= 0) this._map._controls.splice(i, 1);
      return this;
    }
  }
  Control.extend = function extend(props = {}) {
    const Parent = this;
    class Sub extends Parent {}
    const { options, statics, includes, ...rest } = props;
    Object.assign(Sub.prototype, rest);
    Sub.prototype.options = { ...(Parent.prototype.options || {}), ...(options || {}) };
    Sub.extend = extend;
    if (statics) Object.assign(Sub, statics);
    return Sub;
  };
  Control.prototype.options = { position: "topright" };

  const on = (el, types, fn, ctx) => {
    if (typeof types === "object") { for (const [t, f] of Object.entries(types)) on(el, t, f, fn); return L.DomEvent; }
    for (const t of String(types).split(/\s+/).filter(Boolean)) el.addEventListener(t, ctx ? fn.bind(ctx) : fn);
    return L.DomEvent;
  };

  const L = {
    version: "1.9.4-fake",
    map: () => createMap(),
    tileLayer: (url, opts) => recorder("tileLayer", { options: opts }),
    circleMarker: (ll, opts) => layer("circleMarker", ll, { options: opts }),
    marker: (ll, opts) => layer("marker", ll, { options: opts }),
    polyline: (path, opts) => layer("polyline", undefined, { _path: path, options: opts }),
    featureGroup: (layers) => recorder("featureGroup", { getBounds: () => recorder("bounds") }),
    latLng: (a, b) => toLatLng(a, b),
    latLngBounds: () => recorder("bounds"),
    Control,
    control: (options) => new Control(options),
    DomUtil: {
      create(tag, className, container) {
        const e = doc.createElement(tag);
        if (className) e.setAttribute("class", className);
        container?.append(e);
        return e;
      },
      addClass: (e, c) => e.classList.add(...c.split(/\s+/)),
      removeClass: (e, c) => e.classList.remove(...c.split(/\s+/)),
    },
    DomEvent: {
      on,
      addListener: on,
      off: () => L.DomEvent,
      disableClickPropagation(el) { el._fakeClickPropagationDisabled = true; return L.DomEvent; },
      disableScrollPropagation(el) { el._fakeScrollPropagationDisabled = true; return L.DomEvent; },
      stop: (e) => { e?.preventDefault?.(); return L.DomEvent; },
      stopPropagation: () => L.DomEvent,
      preventDefault: (e) => { e?.preventDefault?.(); return L.DomEvent; },
    },
    Util: { bind: (fn, obj) => fn.bind(obj), setOptions: (obj, o) => Object.assign((obj.options ??= {}), o) },
  };
  return { L, getMap: () => map };
}

// ---------------------------------------------------------------------------------------------
// Fetch fixtures
// ---------------------------------------------------------------------------------------------

export const PARIS_FIX = { lat: 48.8584, lng: 2.2945 }; // first location fix used by the tests
export const LOUVRE = { display_name: "Louvre Museum, Rue de Rivoli, Paris", lat: "48.8606", lon: "2.3376" };

export function searchResponse() {
  return [
    LOUVRE,
    { display_name: "Louvre - Rivoli, Paris", lat: "48.8609", lon: "2.3409" },
    { display_name: "Place du Louvre, Paris", lat: "48.8597", lon: "2.3412" },
  ];
}

// Three clearly different walking routes from PARIS_FIX to the Louvre (OSRM GeoJSON format).
export function routeResponse(from = PARIS_FIX, to = { lat: 48.8606, lng: 2.3376 }) {
  const mid = (dLat, dLng) => [(from.lng + to.lng) / 2 + dLng, (from.lat + to.lat) / 2 + dLat];
  const route = (m, distance, duration) => ({
    distance, duration,
    geometry: { type: "LineString", coordinates: [[from.lng, from.lat], m, [to.lng, to.lat]] },
  });
  return {
    code: "Ok",
    routes: [route(mid(0, 0), 3300, 2400), route(mid(0.01, 0), 3600, 2600), route(mid(-0.01, 0), 3700, 2700)],
  };
}

export function jsonResponse(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data, blob: async () => ({}) };
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// ---------------------------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------------------------

let bootCount = 0;

/**
 * Sets up the fake browser globals and loads a fresh instance of src/app.js.
 * @param {object} o
 * @param {"prompt"|"deny"|"unsupported"} [o.location] "deny" calls the error callback right after load
 * @param {boolean} [o.reducedMotion]
 * @param {(url: string) => any} [o.fetch] returns a response (or a promise of one); default: 404 for everything
 */
export async function bootApp({ location = "prompt", reducedMotion = false, fetch } = {}) {
  const doc = new FakeDocument();
  buildPage(doc);
  const calls = [];
  const { L, getMap } = createFakeLeaflet(doc, calls);
  const geo = { success: null, error: null, watchCount: 0 };
  const geolocation = {
    watchPosition(success, error) { geo.success = success; geo.error = error; geo.watchCount++; return 1; },
    getCurrentPosition(success, error) { geo.success ??= success; geo.error ??= error; },
    clearWatch() {},
  };
  const consoleErrors = [];
  const fetchCalls = [];

  globalThis.window = globalThis;
  globalThis.L = L;
  globalThis.document = doc;
  Object.defineProperty(globalThis, "navigator", {
    value: location === "unsupported" ? { userAgent: "fake" } : { userAgent: "fake", geolocation },
    configurable: true, writable: true,
  });
  globalThis.matchMedia = (query) => ({
    media: query,
    matches: reducedMotion && /prefers-reduced-motion\s*:\s*reduce/.test(query),
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  });
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url: String(url), init });
    return fetch ? fetch(String(url), init) : jsonResponse({}, 404);
  };
  console.error = (...args) => consoleErrors.push(args);

  await import(new URL(`../../src/app.js?boot=${++bootCount}`, import.meta.url));

  const map = getMap();
  const ctx = {
    doc, L, map, calls, geo, consoleErrors, fetchCalls,
    input: doc.getElementById("search-input"),
    form: doc.getElementById("search-form"),
    results: doc.getElementById("results"),
    routes: doc.getElementById("routes"),
    status: doc.getElementById("status"),
    radios: doc.querySelectorAll("input[name=mode]"),
    view: () => ({ ...map.getCenter(), zoom: map.getZoom() }),
    fix(lat, lng) { geo.success({ coords: { latitude: lat, longitude: lng, accuracy: 20 }, timestamp: Date.now() }); },
    locationError(code = 1) { geo.error?.({ code, message: "denied" }); },
    // Simulates the user panning/zooming the map by hand.
    userMoves(lat = 10, lng = 10, zoom = 5) { map._view.center = { lat, lng }; map._view.zoom = zoom; },
  };
  if (location === "deny") ctx.locationError(1);
  return ctx;
}

export const flush = async (n = 10) => { for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r)); };

/** All Reset view buttons inside map controls (FR-001). */
export function findResetButtons(ctx) {
  const found = [];
  for (const c of ctx.map._controls) {
    const els = [c.container, ...c.container.descendants()];
    for (const e of els) {
      if (e.localName === "button" && e.getAttribute("aria-label") === "Reset view") found.push({ ...c, button: e });
    }
  }
  return found;
}

export function resetButton(ctx) {
  const found = findResetButtons(ctx);
  if (found.length !== 1) {
    const html = ctx.map._controls.map((c) => c.container.innerHTML).join(" ");
    throw new Error(
      `expected exactly one <button aria-label="Reset view"> in a map control (FR-001), found ${found.length}` +
      (html.includes("Reset view") ? " (a 'Reset view' string exists in innerHTML; the button must be a real element)" : ""),
    );
  }
  return found[0];
}

/**
 * Focuses the Reset view button and clicks it (a native <button> fires `click` for mouse, tap,
 * Enter and Space). Returns what happened during the click only.
 */
export function pressReset(ctx) {
  const { button } = resetButton(ctx);
  button.focus();
  const c0 = ctx.calls.length;
  const m0 = ctx.doc.mutations.length;
  const u0 = ctx.doc.uncaught.length;
  const e0 = ctx.consoleErrors.length;
  const f0 = ctx.doc.focusCalls.length;
  button.click();
  const newCalls = ctx.calls.slice(c0);
  return {
    button,
    calls: newCalls,
    setViews: newCalls.filter((c) => c.target === "map" && c.method === "setView"),
    mutations: ctx.doc.mutations.slice(m0),
    uncaught: ctx.doc.uncaught.slice(u0),
    consoleErrors: ctx.consoleErrors.slice(e0),
    focusCalls: ctx.doc.focusCalls.slice(f0),
  };
}

/** Types a query, submits the search, and waits for the results list. */
export async function search(ctx, q = "Louvre") {
  ctx.input.value = q;
  ctx.form.dispatchEvent(makeEvent("submit"));
  await flush();
}

export function resultButtons(ctx) { return ctx.results.querySelectorAll("button"); }
export function routeButtons(ctx) { return ctx.routes.querySelectorAll("button"); }
