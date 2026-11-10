// Minimal fake browser + fake Leaflet so src/app.js can be imported and driven in Node.
// It models only what app.js uses: a few DOM elements, navigator.geolocation, fetch,
// matchMedia, storage, and the Leaflet API surface (map, layers, controls, DomUtil, DomEvent).
// Not a test file itself: it only exports helpers.

let loadCount = 0;

class FakeClassList {
  constructor(el) {
    this.el = el;
  }
  _list() {
    return String(this.el.className || "").split(/\s+/).filter(Boolean);
  }
  add(...names) {
    const s = new Set(this._list());
    names.forEach((n) => s.add(n));
    this.el.className = [...s].join(" ");
  }
  remove(...names) {
    this.el.className = this._list().filter((n) => !names.includes(n)).join(" ");
  }
  toggle(name, force) {
    const has = this.contains(name);
    const on = force === undefined ? !has : Boolean(force);
    if (on) this.add(name);
    else this.remove(name);
    return on;
  }
  contains(name) {
    return this._list().includes(name);
  }
}

export class FakeElement {
  constructor(env, tagName) {
    this.env = env;
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.listeners = {};
    this.className = "";
    this.classList = new FakeClassList(this);
    this.style = {};
    this.dataset = {};
    this._text = "";
    this._html = null;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.title = "";
    this.type = "";
    this.id = "";
    this.scrollTop = 0;
    this.scrollLeft = 0;
  }
  // --- attributes
  setAttribute(name, value) {
    this.attrs[name] = String(value);
    if (name === "class") this.className = String(value);
    if (name === "title") this.title = String(value);
    if (name === "type") this.type = String(value);
    if (name === "id") this.id = String(value);
  }
  getAttribute(name) {
    if (name === "class") return this.className || null;
    if (name === "title") return this.title || this.attrs.title || null;
    if (name === "type") return this.type || this.attrs.type || null;
    if (name === "aria-label" && this.ariaLabel != null && !("aria-label" in this.attrs)) return this.ariaLabel;
    if (name === "aria-hidden" && this.ariaHidden != null && !("aria-hidden" in this.attrs)) return this.ariaHidden;
    return name in this.attrs ? this.attrs[name] : null;
  }
  hasAttribute(name) {
    return this.getAttribute(name) !== null;
  }
  removeAttribute(name) {
    delete this.attrs[name];
  }
  // --- tree
  append(...nodes) {
    for (const n of nodes) this.appendChild(typeof n === "string" ? this.env.document.createTextNode(n) : n);
  }
  appendChild(node) {
    node.parentNode?._detach(node);
    node.parentNode = this;
    this.children.push(node);
    this._html = null;
    return node;
  }
  insertBefore(node, ref) {
    node.parentNode?._detach(node);
    node.parentNode = this;
    const i = ref ? this.children.indexOf(ref) : -1;
    if (i < 0) this.children.push(node);
    else this.children.splice(i, 0, node);
    return node;
  }
  prepend(...nodes) {
    for (const n of nodes.reverse()) this.insertBefore(n, this.children[0] || null);
  }
  _detach(node) {
    const i = this.children.indexOf(node);
    if (i >= 0) this.children.splice(i, 1);
    node.parentNode = null;
  }
  removeChild(node) {
    this._detach(node);
    return node;
  }
  remove() {
    this.parentNode?._detach(this);
  }
  replaceChildren(...nodes) {
    for (const c of this.children.slice()) this._detach(c);
    this._text = "";
    this._html = null;
    this.append(...nodes);
  }
  get firstChild() {
    return this.children[0] || null;
  }
  get firstElementChild() {
    return this.children.find((c) => c instanceof FakeElement && c.tagName !== "#TEXT") || null;
  }
  get childElementCount() {
    return this.children.filter((c) => c.tagName !== "#TEXT").length;
  }
  get textContent() {
    if (this._html != null) return this._html.replace(/<[^>]*>/g, "");
    return this._text + this.children.map((c) => c.textContent).join("");
  }
  set textContent(v) {
    for (const c of this.children.slice()) this._detach(c);
    this._html = null;
    this._text = String(v ?? "");
  }
  get innerText() {
    return this.textContent;
  }
  set innerText(v) {
    this.textContent = v;
  }
  get innerHTML() {
    return this._html ?? this.textContent;
  }
  set innerHTML(v) {
    for (const c of this.children.slice()) this._detach(c);
    this._text = "";
    this._html = String(v ?? "");
  }
  descendants() {
    const out = [];
    for (const c of this.children) {
      out.push(c);
      if (c.descendants) out.push(...c.descendants());
    }
    return out;
  }
  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }
  querySelectorAll(sel) {
    return this.descendants().filter((e) => matches(e, sel));
  }
  closest(sel) {
    let e = this;
    while (e) {
      if (matches(e, sel)) return e;
      e = e.parentNode;
    }
    return null;
  }
  contains(node) {
    let e = node;
    while (e) {
      if (e === this) return true;
      e = e.parentNode;
    }
    return false;
  }
  // --- events
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn);
  }
  dispatchEvent(ev) {
    const event = { target: this, currentTarget: this, defaultPrevented: false, ...ev };
    event.preventDefault ||= () => {
      event.defaultPrevented = true;
    };
    event.stopPropagation ||= () => {};
    for (const fn of (this.listeners[event.type] || []).slice()) fn.call(this, event);
    if (typeof this["on" + event.type] === "function") this["on" + event.type](event);
    return !event.defaultPrevented;
  }
  click() {
    if (this.disabled) return;
    this.dispatchEvent({ type: "click", button: 0 });
  }
  focus() {
    this.env.document.activeElement = this;
  }
  blur() {
    if (this.env.document.activeElement === this) this.env.document.activeElement = this.env.document.body;
  }
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}

function matches(el, sel) {
  if (!(el instanceof FakeElement) || el.tagName === "#TEXT") return false;
  return sel.split(",").some((part) => {
    const s = part.trim();
    const m = s.match(/^([a-zA-Z]*)((?:[.#][\w-]+)*)((?:\[[^\]]+\])*)$/);
    if (!m) return false;
    const [, tag, rest, attrs] = m;
    if (tag && el.tagName !== tag.toUpperCase()) return false;
    for (const tok of rest.match(/[.#][\w-]+/g) || []) {
      if (tok[0] === "." && !el.classList.contains(tok.slice(1))) return false;
      if (tok[0] === "#" && el.id !== tok.slice(1)) return false;
    }
    for (const a of attrs.match(/\[[^\]]+\]/g) || []) {
      const [, name, val] = a.match(/^\[([\w-]+)(?:=["']?([^"'\]]*)["']?)?\]$/) || [];
      if (!name) return false;
      const got = name === "name" ? (el.name ?? el.getAttribute("name")) : el.getAttribute(name);
      if (val === undefined ? got == null : String(got) !== val) return false;
    }
    return true;
  });
}

function toLatLng(c) {
  if (Array.isArray(c)) return { lat: Number(c[0]), lng: Number(c[1]) };
  if (c && typeof c === "object") return { lat: Number(c.lat), lng: Number(c.lng ?? c.lon) };
  throw new Error(`fake Leaflet: bad latlng ${JSON.stringify(c)}`);
}

function createFakeLeaflet(env) {
  const L = {};
  const created = env.leaflet;

  class Layer {
    constructor(kind, latlng, options) {
      this.kind = kind;
      this.latlng = latlng ? toLatLng(latlng) : null;
      this.options = options || {};
      this.map = null;
      this.handlers = {};
      created.layers.push(this);
    }
    addTo(map) {
      this.map = map;
      map.layers.add(this);
      return this;
    }
    remove() {
      this.map?.layers.delete(this);
      this.map = null;
      return this;
    }
    setLatLng(ll) {
      this.latlng = toLatLng(ll);
      return this;
    }
    getLatLng() {
      return this.latlng;
    }
    bindPopup(content) {
      this.popup = content;
      return this;
    }
    openPopup() {
      return this;
    }
    setStyle(s) {
      this.options = { ...this.options, ...s };
      return this;
    }
    bringToFront() {
      return this;
    }
    on(type, fn) {
      (this.handlers[type] ||= []).push(fn);
      return this;
    }
    off() {
      return this;
    }
  }

  class FakeMap {
    constructor(id, options = {}) {
      this.id = id;
      this.options = options;
      this.center = null;
      this.zoom = null;
      this.moves = []; // every view change: { method, center, zoom, options }
      this.layers = new Set();
      this.corners = { topleft: [], topright: [], bottomleft: [], bottomright: [] };
      this.handlers = {};
      created.maps.push(this);
      if (options.center && options.zoom != null) this._move("init", toLatLng(options.center), options.zoom, {});
      if (options.zoomControl !== false) L.control.zoom().addTo(this);
      if (options.attributionControl !== false) {
        const c = new L.Control.Attribution();
        c.addTo(this);
        this.attributionControl = c;
      }
    }
    _move(method, center, zoom, options) {
      this.center = center;
      this.zoom = zoom;
      this.moves.push({ method, center, zoom, options: options || {} });
    }
    _addControl(position, el, control) {
      const corner = this.corners[position];
      if (!corner) throw new Error(`fake Leaflet: unknown control position ${position}`);
      // Leaflet 1.9.4 L.Control#addTo: bottom corners insert before existing controls.
      if (position.startsWith("bottom")) corner.unshift({ el, control });
      else corner.push({ el, control });
    }
    setView(center, zoom, options) {
      this._move("setView", toLatLng(center), zoom ?? this.zoom, options);
      return this;
    }
    flyTo(center, zoom, options) {
      this._move("flyTo", toLatLng(center), zoom ?? this.zoom, options);
      return this;
    }
    panTo(center, options) {
      this._move("panTo", toLatLng(center), this.zoom, options);
      return this;
    }
    setZoom(zoom, options) {
      this._move("setZoom", this.center, zoom, options);
      return this;
    }
    fitBounds(bounds, options) {
      // Any other view, so a test can tell a fit from a reset.
      const c = bounds?.center || { lat: 0, lng: 0 };
      this._move("fitBounds", c, 16, options);
      return this;
    }
    flyToBounds(bounds, options) {
      return this.fitBounds(bounds, options);
    }
    getCenter() {
      return { ...this.center };
    }
    getZoom() {
      return this.zoom;
    }
    stop() {
      return this;
    }
    on(type, fn) {
      (this.handlers[type] ||= []).push(fn);
      return this;
    }
    once(type, fn) {
      return this.on(type, fn);
    }
    off() {
      return this;
    }
    addLayer(l) {
      return l.addTo(this), this;
    }
    removeLayer(l) {
      l.remove();
      return this;
    }
    hasLayer(l) {
      return this.layers.has(l);
    }
    addControl(c) {
      c.addTo(this);
      return this;
    }
    invalidateSize() {
      return this;
    }
    getContainer() {
      return env.mapEl;
    }
  }

  L.map = (id, options) => new FakeMap(id, options);
  L.Map = FakeMap;
  L.latLng = (a, b) => (b === undefined ? toLatLng(a) : { lat: Number(a), lng: Number(b) });
  L.tileLayer = (url, options) => new Layer("tileLayer", null, { url, ...options });
  L.circleMarker = (ll, o) => new Layer("circleMarker", ll, o);
  L.marker = (ll, o) => new Layer("marker", ll, o);
  L.polyline = (path, o) => {
    const l = new Layer("polyline", null, o);
    l.path = path;
    return l;
  };
  L.featureGroup = (layers = []) => ({
    layers,
    getBounds() {
      const pts = layers.flatMap((l) => l.path || []);
      const lat = pts.reduce((s, p) => s + p[0], 0) / (pts.length || 1);
      const lng = pts.reduce((s, p) => s + p[1], 0) / (pts.length || 1);
      return { center: { lat, lng }, isValid: () => pts.length > 0 };
    },
    addTo(m) {
      return this;
    },
  });
  L.latLngBounds = (pts = []) => L.featureGroup([{ path: pts.map((p) => [toLatLng(p).lat, toLatLng(p).lng]) }]).getBounds();

  L.DomUtil = {
    create(tag, className, container) {
      const el = env.document.createElement(tag);
      if (className) el.className = className;
      if (container) container.appendChild(el);
      return el;
    },
    addClass(el, c) {
      el.classList.add(...String(c).split(/\s+/).filter(Boolean));
    },
    removeClass(el, c) {
      el.classList.remove(...String(c).split(/\s+/).filter(Boolean));
    },
    hasClass(el, c) {
      return el.classList.contains(c);
    },
  };

  L.DomEvent = {
    on(el, types, fn, ctx) {
      for (const t of String(types).split(/\s+/).filter(Boolean)) el.addEventListener(t, ctx ? fn.bind(ctx) : fn);
      return L.DomEvent;
    },
    off() {
      return L.DomEvent;
    },
    disableClickPropagation(el) {
      created.clickPropagationDisabled.add(el);
      return L.DomEvent;
    },
    disableScrollPropagation(el) {
      created.scrollPropagationDisabled.add(el);
      return L.DomEvent;
    },
    stopPropagation(e) {
      e?.stopPropagation?.();
      return L.DomEvent;
    },
    preventDefault(e) {
      e?.preventDefault?.();
      return L.DomEvent;
    },
    stop(e) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return L.DomEvent;
    },
  };

  class Control {
    constructor(options) {
      this.options = { ...this.options, ...(options || {}) };
      if (typeof this.initialize === "function") this.initialize(options);
    }
    getPosition() {
      return this.options.position;
    }
    setPosition(p) {
      this.options.position = p;
      return this;
    }
    addTo(map) {
      this._map = map;
      const el = this.onAdd(map);
      this._container = el;
      map._addControl(this.getPosition(), el, this);
      created.controls.push(this);
      return this;
    }
    remove() {
      return this;
    }
    getContainer() {
      return this._container;
    }
  }
  Control.prototype.options = { position: "topright" };
  Control.extend = function extend(props = {}) {
    const Parent = this;
    class Sub extends Parent {}
    const { options, ...methods } = props;
    Object.assign(Sub.prototype, methods);
    Sub.prototype.options = { ...Parent.prototype.options, ...(options || {}) };
    Sub.extend = extend;
    return Sub;
  };

  class Zoom extends Control {
    onAdd() {
      const bar = L.DomUtil.create("div", "leaflet-control-zoom leaflet-bar leaflet-control");
      for (const [cls, label, text] of [
        ["leaflet-control-zoom-in", "Zoom in", "+"],
        ["leaflet-control-zoom-out", "Zoom out", "−"],
      ]) {
        const a = L.DomUtil.create("a", cls, bar);
        a.setAttribute("role", "button");
        a.setAttribute("aria-label", label);
        a.title = label;
        a.textContent = text;
      }
      this.kind = "zoom";
      return bar;
    }
  }
  Zoom.prototype.options = { position: "topleft" };

  class Attribution extends Control {
    onAdd() {
      this.kind = "attribution";
      const el = L.DomUtil.create("div", "leaflet-control-attribution leaflet-control");
      el.textContent = "Leaflet | © OpenStreetMap contributors";
      return el;
    }
  }
  Attribution.prototype.options = { position: "bottomright" };

  Control.Zoom = Zoom;
  Control.Attribution = Attribution;
  L.Control = Control;
  L.control = (o) => new Control(o);
  L.control.zoom = (o) => new Zoom(o);
  L.control.attribution = (o) => new Attribution(o);
  return L;
}

function jsonResponse(data) {
  return { ok: true, status: 200, json: async () => data, blob: async () => ({}) };
}

export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// OSRM response with two clearly distinct routes from `from` to `to` ({lat,lng}).
export function osrmTwoRoutes(from, to) {
  const north = [
    [from.lng, from.lat],
    [from.lng, to.lat],
    [to.lng, to.lat],
  ];
  const south = [
    [from.lng, from.lat],
    [to.lng, from.lat],
    [to.lng, to.lat],
  ];
  return {
    code: "Ok",
    routes: [
      { distance: 1000, duration: 700, geometry: { type: "LineString", coordinates: north } },
      { distance: 1100, duration: 800, geometry: { type: "LineString", coordinates: south } },
    ],
  };
}

export const flush = async (n = 10) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setImmediate(r));
};

/**
 * Installs fresh fake globals and imports a fresh copy of src/app.js.
 * options.geolocation: true (supported, default) | false (unsupported)
 * options.reducedMotion: initial prefers-reduced-motion value (mutable via env.reducedMotion)
 * options.searchResults: Nominatim jsonv2 array returned for every search
 * Route requests wait on env.routeRequests (array of { url, deferred }) unless env.autoRoutes is set.
 */
export async function loadApp(options = {}) {
  const env = {
    reducedMotion: Boolean(options.reducedMotion),
    searchResults: options.searchResults || [],
    routeRequests: [],
    autoRoutes: options.autoRoutes ?? null, // (url) => json, answers routes immediately
    fetches: [],
    storageWrites: [],
    created: [],
    leaflet: {
      maps: [],
      layers: [],
      controls: [],
      clickPropagationDisabled: new Set(),
      scrollPropagationDisabled: new Set(),
    },
    geo: { watchers: [], getters: [] },
    errors: [],
  };

  const document = {
    activeElement: null,
    createElement(tag) {
      const el = new FakeElement(env, tag);
      env.created.push(el);
      return el;
    },
    createTextNode(text) {
      const t = new FakeElement(env, "#text");
      t._text = String(text);
      return t;
    },
    createDocumentFragment() {
      return new FakeElement(env, "#fragment");
    },
    getElementById(id) {
      return env.byId[id] || null;
    },
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    },
    querySelectorAll(sel) {
      if (sel.replace(/\s/g, "") === "input[name=mode]" || sel.replace(/\s/g, "") === 'input[name="mode"]') return env.radios;
      return [env.body, ...env.body.descendants(), ...env.created].filter(
        (e, i, all) => all.indexOf(e) === i && matches(e, sel),
      );
    },
    addEventListener() {},
    removeEventListener() {},
  };
  env.document = document;

  const el = (tag, id) => {
    const e = new FakeElement(env, tag);
    e.id = id || "";
    return e;
  };
  env.body = el("body");
  document.body = env.body;
  document.documentElement = env.body;
  document.activeElement = env.body;
  env.mapEl = el("div", "map");
  const panel = el("div", "panel");
  const form = el("form", "search-form");
  const input = el("input", "search-input");
  const go = el("button", "go");
  go.type = "submit";
  form.append(input, go);
  const modeBox = el("div", "mode");
  env.radios = ["foot", "car"].map((v) => {
    const r = el("input");
    r.type = "radio";
    r.name = "mode";
    r.value = v;
    r.checked = v === "foot";
    r.setAttribute("name", "mode");
    modeBox.append(r);
    return r;
  });
  const results = el("ul", "results");
  const routes = el("ul", "routes");
  const status = el("p", "status");
  panel.append(form, modeBox, results, routes, status);
  env.body.append(env.mapEl, panel);
  env.byId = { map: env.mapEl, panel, "search-form": form, "search-input": input, mode: modeBox, results, routes, status };
  Object.assign(env, { form, input, results, routesList: routes, status });

  const geolocation = {
    watchPosition(ok, err) {
      env.geo.watchers.push({ ok, err });
      return env.geo.watchers.length;
    },
    getCurrentPosition(ok, err) {
      env.geo.getters.push({ ok, err });
    },
    clearWatch() {},
  };
  const navigator = options.geolocation === false ? { userAgent: "fake" } : { userAgent: "fake", geolocation };

  const storage = (name) => ({
    getItem: () => null,
    setItem: (k, v) => env.storageWrites.push({ name, k, v }),
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  });

  const fetch = async (url) => {
    const u = String(url);
    env.fetches.push(u);
    if (u.includes("nominatim")) return jsonResponse(env.searchResults);
    if (u.includes("/route/v1/")) {
      if (env.autoRoutes) return jsonResponse(env.autoRoutes(u));
      const d = deferred();
      env.routeRequests.push({ url: u, deferred: d });
      return d.promise.then(jsonResponse);
    }
    throw new Error("offline (fake fetch)"); // map tiles for the pleasure score
  };

  const matchMedia = (query) => ({
    media: query,
    matches: /prefers-reduced-motion:\s*reduce/.test(query) ? env.reducedMotion : false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });

  env.L = createFakeLeaflet(env);
  const g = globalThis;
  const set = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  set("window", g);
  set("L", env.L);
  set("document", document);
  set("navigator", navigator);
  set("fetch", fetch);
  set("matchMedia", matchMedia);
  set("localStorage", storage("localStorage"));
  set("sessionStorage", storage("sessionStorage"));
  set("createImageBitmap", async () => {
    throw new Error("no images in fake browser");
  });
  set("OffscreenCanvas", undefined);
  set("requestAnimationFrame", (fn) => setTimeout(() => fn(Date.now()), 0));
  set("cancelAnimationFrame", (id) => clearTimeout(id));

  await import(`../../src/app.js?fake=${++loadCount}`);
  env.map = env.leaflet.maps[0];

  // --- helpers for tests
  env.fix = (lat, lng, accuracy = 10) => {
    for (const w of env.geo.watchers) w.ok({ coords: { latitude: lat, longitude: lng, accuracy }, timestamp: Date.now() });
    for (const w of env.geo.getters.splice(0)) w.ok({ coords: { latitude: lat, longitude: lng, accuracy }, timestamp: Date.now() });
  };
  env.geoError = (code = 1) => {
    for (const w of env.geo.watchers) w.err?.({ code, message: "denied" });
  };
  env.resetButtons = () =>
    env.created.filter(
      (e) => e.tagName === "BUTTON" && (e.getAttribute("aria-label") === "Reset view" || e.classList.contains("reset-view")),
    );
  env.resetButton = () => {
    const all = env.resetButtons();
    if (all.length !== 1) throw new Error(`expected exactly one Reset view button, found ${all.length}`);
    return all[0];
  };
  env.pressReset = () => {
    env.resetButton().click();
  };
  env.userMarker = () => env.leaflet.layers.find((l) => l.kind === "circleMarker" && l.map);
  env.destMarker = () => env.leaflet.layers.find((l) => l.kind === "marker" && l.map);
  env.polylinesOnMap = () => env.leaflet.layers.filter((l) => l.kind === "polyline" && l.map);
  env.search = async (q) => {
    env.input.value = q;
    env.form.dispatchEvent({ type: "submit" });
    await flush();
  };
  env.resultButtons = () => env.results.children.map((li) => li.querySelector("button")).filter(Boolean);
  env.routeButtons = () => env.routesList.children.map((li) => li.querySelector("button")).filter(Boolean);
  env.answerRoutes = async (from, to) => {
    while (env.routeRequests.length) env.routeRequests.shift().deferred.resolve(osrmTwoRoutes(from, to));
    await flush(20);
  };
  env.setMode = async (value) => {
    for (const r of env.radios) r.checked = r.value === value;
    env.radios.find((r) => r.value === value).dispatchEvent({ type: "change" });
    await flush();
  };
  return env;
}

// Distance in metres between two {lat,lng}.
export function metres(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
}
