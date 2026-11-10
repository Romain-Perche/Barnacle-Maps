// A tiny fake browser + fake Leaflet, just enough to import src/app.js under node --test
// and observe what it does to the map. No dependencies (README: no build step or dependencies).

export class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.listeners = {};
    this.className = "";
    this._text = "";
    this.value = "";
    this.style = {};
    this.blurred = false;
    const el = this;
    this.classList = {
      add: (...c) => { el.className = [...new Set([...el.className.split(/\s+/).filter(Boolean), ...c])].join(" "); },
      remove: (...c) => { el.className = el.className.split(/\s+/).filter((x) => x && !c.includes(x)).join(" "); },
      toggle: (c, on) => { (on ?? !el.classList.contains(c)) ? el.classList.add(c) : el.classList.remove(c); },
      contains: (c) => el.className.split(/\s+/).includes(c),
    };
  }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(""); }
  set textContent(v) { this.children = []; this._text = String(v); }
  get innerText() { return this.textContent; }
  set innerText(v) { this.textContent = v; }
  get innerHTML() { return this.textContent; }
  set innerHTML(v) { this.textContent = String(v).replace(/<[^>]*>/g, ""); }
  get title() { return this.attributes.title ?? ""; }
  set title(v) { this.attributes.title = String(v); }
  get type() { return this.attributes.type ?? (this.tagName === "BUTTON" ? "submit" : ""); }
  set type(v) { this.attributes.type = String(v); }
  get id() { return this.attributes.id ?? ""; }
  set id(v) { this.attributes.id = String(v); }
  get tabIndex() { return this.attributes.tabindex === undefined ? (this.tagName === "BUTTON" ? 0 : -1) : Number(this.attributes.tabindex); }
  set tabIndex(v) { this.attributes.tabindex = String(v); }
  get disabled() { return "disabled" in this.attributes; }
  set disabled(v) { if (v) this.attributes.disabled = ""; else delete this.attributes.disabled; }
  get hidden() { return "hidden" in this.attributes; }
  set hidden(v) { if (v) this.attributes.hidden = ""; else delete this.attributes.hidden; }
  setAttribute(k, v) { if (k === "class") this.className = String(v); else this.attributes[k] = String(v); }
  getAttribute(k) { return k === "class" ? this.className : (this.attributes[k] ?? null); }
  hasAttribute(k) { return k in this.attributes; }
  removeAttribute(k) { delete this.attributes[k]; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  append(...cs) { for (const c of cs) this.appendChild(typeof c === "string" ? textNode(c) : c); }
  replaceChildren(...cs) { this.children = []; this._text = ""; this.append(...cs); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((c) => c !== this); }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn); }
  dispatchEvent(ev) {
    for (const fn of [...(this.listeners[ev.type] ?? [])]) fn.call(this, ev);
    return !ev.defaultPrevented;
  }
  click() {
    const ev = fakeEvent("click", this);
    this.dispatchEvent(ev);
  }
  focus() { globalThis.document.activeElement = this; }
  blur() { this.blurred = true; if (globalThis.document.activeElement === this) globalThis.document.activeElement = globalThis.document.body; }
  querySelectorAll(sel) { return findAll(this, (e) => matches(e, sel)); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] ?? null; }
  getContext() { return null; }
}

function textNode(s) {
  const t = new FakeElement("#text");
  t._text = s;
  return t;
}

export function fakeEvent(type, target) {
  return {
    type, target, currentTarget: target, defaultPrevented: false, propagationStopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; },
  };
}

export function findAll(root, pred) {
  const out = [];
  for (const c of root.children) {
    if (pred(c)) out.push(c);
    out.push(...findAll(c, pred));
  }
  return out;
}

function matches(e, sel) {
  if (sel.startsWith("#")) return e.id === sel.slice(1);
  if (sel.startsWith(".")) return e.classList.contains(sel.slice(1));
  const m = sel.match(/^(\w+)\[name=(\w+)\]$/);
  if (m) return e.tagName === m[1].toUpperCase() && e.attributes.name === m[2];
  return e.tagName === sel.toUpperCase();
}

// ---------------------------------------------------------------------------
// Fake Leaflet

export function createFakeLeaflet() {
  const log = []; // every map/layer call, in order: { kind, args }
  const controls = []; // { control, position, container }
  const domEvents = { clickDisabled: [], scrollDisabled: [] };
  let map = null;

  function evented(target) {
    target._handlers = {};
    target.on = function (type, fn) {
      if (typeof type === "object") { for (const [t, f] of Object.entries(type)) this.on(t, f); return this; }
      for (const t of type.split(/\s+/)) (this._handlers[t] ??= []).push({ fn, once: false });
      return this;
    };
    target.once = function (type, fn) {
      for (const t of type.split(/\s+/)) (this._handlers[t] ??= []).push({ fn, once: true });
      return this;
    };
    target.off = function (type, fn) {
      for (const t of type.split(/\s+/)) this._handlers[t] = (this._handlers[t] ?? []).filter((h) => fn && h.fn !== fn);
      return this;
    };
    target.fire = function (type, data = {}) {
      const hs = this._handlers[type] ?? [];
      this._handlers[type] = hs.filter((h) => !h.once);
      for (const h of hs) h.fn.call(this, { type, target: this, ...data });
      return this;
    };
    target.listens = function (type) { return (this._handlers[type] ?? []).length > 0; };
    return target;
  }

  function layer(kind, args) {
    const l = evented({
      kind, args,
      addTo(m) { log.push({ kind: `${kind}.addTo` }); m._layers.push(this); return this; },
      remove() { log.push({ kind: `${kind}.remove` }); if (map) map._layers = map._layers.filter((x) => x !== this); return this; },
      setLatLng(ll) { log.push({ kind: `${kind}.setLatLng`, args: [ll] }); return this; },
      setStyle(s) { this.style = s; return this; },
      bringToFront() { return this; },
      bindPopup(p) { this.popup = p; return this; },
      openPopup() { log.push({ kind: `${kind}.openPopup` }); return this; },
      closePopup() { log.push({ kind: `${kind}.closePopup` }); return this; },
      getBounds() { return { kind: "bounds" }; },
    });
    return l;
  }

  function toLatLng(c) {
    if (Array.isArray(c)) return { lat: c[0], lng: c[1] };
    return { lat: c.lat, lng: c.lng ?? c.lon };
  }

  function addControl(m, control) {
    const position = control.options?.position ?? control.getPosition?.() ?? "topright";
    const container = control.onAdd ? control.onAdd(m) : null;
    control._container = container;
    control._map = m;
    controls.push({ control, position, container });
    log.push({ kind: "map.addControl", args: [position] });
    return control;
  }

  const L = {
    map(id, opts) {
      map = evented({
        id, opts, _layers: [], _animatingZoom: false,
        _center: null, _zoom: null,
        setView(center, zoom, options) {
          // Leaflet 1.9.4: during a zoom animation an animated setView is dropped
          // (_tryAnimatedZoom returns true without moving), and an un-animated one is
          // overwritten when the running animation ends (see startZoomAnimation below).
          if (this._animatingZoom && options?.animate !== false) {
            log.push({ kind: "map.setView.dropped", args: [toLatLng(center), zoom, options] });
            return this;
          }
          log.push({ kind: "map.setView", args: [toLatLng(center), zoom, options] });
          this._center = toLatLng(center); this._zoom = zoom;
          return this;
        },
        fitBounds(b, o) { log.push({ kind: "map.fitBounds", args: [b, o] }); return this; },
        flyTo(c, z, o) { log.push({ kind: "map.flyTo", args: [toLatLng(c), z, o] }); this._center = toLatLng(c); this._zoom = z; return this; },
        panTo(c, o) { log.push({ kind: "map.panTo", args: [toLatLng(c), o] }); this._center = toLatLng(c); return this; },
        setZoom(z, o) { log.push({ kind: "map.setZoom", args: [z, o] }); this._zoom = z; return this; },
        stop() { log.push({ kind: "map.stop" }); return this; },
        closePopup() { log.push({ kind: "map.closePopup" }); return this; },
        removeLayer(l) { log.push({ kind: "map.removeLayer" }); this._layers = this._layers.filter((x) => x !== l); return this; },
        hasLayer(l) { return this._layers.includes(l); },
        /** Test helper: start a zoom animation towards (center, zoom). */
        startZoomAnimation(center, zoom) { this._animatingZoom = true; this._animTarget = { center: toLatLng(center), zoom }; },
        /** Test helper: finish it — the map lands on the animation target, then zoomend/moveend fire. */
        endZoomAnimation() {
          const t = this._animTarget;
          this._animatingZoom = false; this._animTarget = null;
          if (t) { this._center = t.center; this._zoom = t.zoom; log.push({ kind: "map.zoomAnimEnd", args: [t.center, t.zoom] }); }
          this.fire("zoomend"); this.fire("moveend");
        },
        getCenter() { return { ...this._center }; },
        getZoom() { return this._zoom; },
        addControl(c) { return addControl(this, c); },
        getContainer() { return globalThis.document.getElementById("map"); },
      });
      return map;
    },
    tileLayer: (...a) => layer("tileLayer", a),
    circleMarker: (...a) => layer("circleMarker", a),
    marker: (...a) => layer("marker", a),
    polyline: (...a) => layer("polyline", a),
    featureGroup: (...a) => layer("featureGroup", a),
    latLng: (a, b) => (Array.isArray(a) ? toLatLng(a) : typeof a === "object" ? toLatLng(a) : { lat: a, lng: b }),
    DomUtil: {
      create(tag, className, parent) {
        const el = globalThis.document.createElement(tag);
        if (className) el.className = className;
        if (parent) parent.appendChild(el);
        return el;
      },
      addClass(el, c) { el.classList.add(...c.split(/\s+/)); },
    },
    DomEvent: {
      disableClickPropagation(el) { domEvents.clickDisabled.push(el); return this; },
      disableScrollPropagation(el) { domEvents.scrollDisabled.push(el); return this; },
      on(el, types, fn) {
        if (typeof types === "object") { for (const [t, f] of Object.entries(types)) el.addEventListener(t, f); return this; }
        for (const t of types.split(/\s+/)) el.addEventListener(t, fn);
        return this;
      },
      off(el, types, fn) { for (const t of types.split(/\s+/)) el.removeEventListener(t, fn); return this; },
      stopPropagation(e) { e?.stopPropagation?.(); return this; },
      preventDefault(e) { e?.preventDefault?.(); return this; },
      stop(e) { e?.stopPropagation?.(); e?.preventDefault?.(); return this; },
    },
  };

  class Control {
    constructor(options) { this.options = { position: "topright", ...(this.options ?? {}), ...(options ?? {}) }; }
    getPosition() { return this.options.position; }
    setPosition(p) { this.options.position = p; return this; }
    getContainer() { return this._container; }
    addTo(m) { return addControl(m, this); }
    remove() { return this; }
  }
  Control.extend = function (props) {
    const Parent = this;
    const { options: childOptions, initialize, ...rest } = props;
    class Child extends Parent {
      constructor(options) {
        super();
        this.options = { ...this.options, ...(childOptions ?? {}), ...(options ?? {}) };
        initialize?.call(this, options);
      }
    }
    Object.assign(Child.prototype, rest);
    Child.extend = Control.extend;
    return Child;
  };
  L.Control = Control;
  L.control = (options) => new Control(options);
  L.control.zoom = (options) => new Control({ position: "topleft", ...options });

  return {
    L, log, controls, domEvents,
    get map() { return map; },
  };
}

// ---------------------------------------------------------------------------
// Install the fake browser globals and import a fresh copy of src/app.js

let importCounter = 0;

/**
 * @param {object} opts
 * @param {"pending"|"denied"|"unsupported"} [opts.geolocation] what geolocation does at load
 * @param {boolean} [opts.reducedMotion] whether prefers-reduced-motion: reduce matches
 */
export async function loadApp({ geolocation = "pending", reducedMotion = false } = {}) {
  const fake = createFakeLeaflet();
  const body = new FakeElement("body");
  const byId = {};
  for (const [id, tag] of [["map", "div"], ["panel", "div"], ["search-form", "form"], ["search-input", "input"],
    ["results", "ul"], ["routes", "ul"], ["status", "p"]]) {
    const el = new FakeElement(tag);
    el.id = id;
    byId[id] = el;
    body.appendChild(el);
  }
  const radios = ["foot", "car"].map((v) => {
    const r = new FakeElement("input");
    r.attributes.name = "mode"; r.type = "radio"; r.value = v; r.checked = v === "foot";
    byId.panel.appendChild(r);
    return r;
  });

  const document = {
    body,
    activeElement: body,
    getElementById: (id) => byId[id] ?? findAll(body, (e) => e.id === id)[0] ?? null,
    querySelectorAll: (sel) => (sel === "input[name=mode]" ? radios : body.querySelectorAll(sel)),
    querySelector: (sel) => document.querySelectorAll(sel)[0] ?? null,
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (s) => textNode(s),
  };

  const geo = { onPosition: null, onError: null, watchCalls: 0 };
  const navigatorObj = {};
  if (geolocation !== "unsupported") {
    navigatorObj.geolocation = {
      watchPosition(ok, err) { geo.watchCalls++; geo.onPosition = ok; geo.onError = err; return 1; },
      getCurrentPosition(ok, err) { geo.onPosition = ok; geo.onError = err; },
      clearWatch() {},
    };
  }

  const mediaQueries = [];
  const window = {
    L: fake.L,
    document,
    navigator: navigatorObj,
    matchMedia(q) {
      mediaQueries.push(q);
      const matches = reducedMotion && /prefers-reduced-motion:\s*reduce/.test(q);
      return { matches, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
    },
    addEventListener() {}, removeEventListener() {},
    setTimeout, clearTimeout,
  };

  const fetchCalls = [];
  setGlobal("window", window);
  setGlobal("document", document);
  setGlobal("navigator", navigatorObj);
  setGlobal("L", fake.L);
  setGlobal("matchMedia", window.matchMedia);
  setGlobal("fetch", async (url) => { fetchCalls.push(url); throw new Error("network disabled in tests"); });

  await import(new URL(`../../src/app.js?test=${++importCounter}`, import.meta.url).href);

  if (geolocation === "denied") geo.onError?.({ code: 1, message: "denied" });

  return {
    ...fake,
    byId,
    document,
    window,
    geo,
    mediaQueries,
    fetchCalls,
    /** Simulate a location fix. */
    fix(lat, lng, accuracy = 10) { geo.onPosition({ coords: { latitude: lat, longitude: lng, accuracy } }); },
    /** The setView calls made on the map so far. */
    setViews() { return fake.log.filter((e) => e.kind === "map.setView").map((e) => e.args); },
    lastSetView() { const v = this.setViews(); return v[v.length - 1]; },
  };
}

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true, enumerable: true });
}

/** Find the "Reset view" control: { control, position, container, button } or null. */
export function findResetControl(app) {
  for (const c of app.controls) {
    if (!c.container) continue;
    const buttons = [c.container, ...findAll(c.container, () => true)].filter((e) => e.tagName === "BUTTON");
    const button = buttons.find((b) => b.textContent.trim() === "Reset view" || b.title === "Reset view");
    if (button) return { ...c, button };
  }
  return null;
}
