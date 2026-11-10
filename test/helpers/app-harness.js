// Loads src/app.js in Node with a minimal fake DOM, fake Leaflet (window.L) and fake geolocation.
// Records every map call so tests can check what the reset control does.
let counter = 0;

export function fakeElement(tag = "div") {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    attrs: {},
    listeners: {},
    style: {},
    className: "",
    classList: {
      add: (...c) => (el.className = [...new Set([...el.className.split(/\s+/).filter(Boolean), ...c])].join(" ")),
      remove: () => {},
      toggle: () => {},
      contains: (c) => el.className.split(/\s+/).includes(c),
    },
    dataset: {},
    textContent: "",
    value: "",
    appendChild(c) { el.children.push(c); c.parent = el; return c; },
    append(...cs) { for (const c of cs) el.appendChild(c); },
    replaceChildren(...cs) { el.children = []; el.append(...cs); },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute: (k) => (k in el.attrs ? el.attrs[k] : null),
    addEventListener(t, f) { (el.listeners[t] ??= []).push(f); },
    removeEventListener() {},
    remove() {},
    focus() {},
    dispatch(t, ev = {}) {
      const e = { type: t, preventDefault() {}, stopPropagation() {}, target: el, ...ev };
      for (const f of el.listeners[t] ?? []) f(e);
    },
    click() { el.dispatch("click"); },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return el;
}

export function walk(el, pred, out = []) {
  if (pred(el)) out.push(el);
  for (const c of el.children ?? []) walk(c, pred, out);
  return out;
}

export async function loadApp({ geolocation = true, fetchImpl } = {}) {
  const calls = []; // every map method call: { fn, args }
  const controls = []; // { position, container }
  const stopped = []; // elements passed to DomEvent.disableClickPropagation
  const elements = {};
  const watchers = [];
  const fetches = [];

  const mapObj = new Proxy({}, {
    get(_, fn) {
      if (fn === "then") return undefined;
      return (...args) => { calls.push({ fn, args }); return mapObj; };
    },
  });
  const chain = () => new Proxy(function () {}, { get: (_, k) => (k === "then" ? undefined : chain()), apply: () => chain() });

  class Control {
    constructor(options = {}) { this.options = { ...(this.constructor.prototype.options ?? {}), ...options }; }
    addTo(map) {
      const container = this.onAdd(map);
      controls.push({ position: this.getPosition(), container });
      return this;
    }
    getPosition() { return this.options.position ?? "topright"; }
    setPosition(p) { this.options.position = p; return this; }
    remove() { return this; }
  }
  Control.extend = (proto) => {
    const C = class extends Control {};
    Object.assign(C.prototype, proto);
    C.extend = Control.extend;
    return C;
  };

  const L = {
    map: () => mapObj,
    tileLayer: () => ({ addTo: () => mapObj }),
    circleMarker: () => ({ addTo: () => ({ setLatLng() {} }), setLatLng() {} }),
    marker: () => ({ addTo: () => ({ bindPopup: () => ({ remove() {} }), remove() {} }) }),
    polyline: chain,
    featureGroup: chain,
    Control,
    control: (opts) => new Control(opts),
    DomUtil: { create: (tag, cls, parent) => { const e = fakeElement(tag); if (cls) e.className = cls; parent?.appendChild(e); return e; } },
    DomEvent: {
      disableClickPropagation: (e) => { stopped.push(e); return L.DomEvent; },
      disableScrollPropagation: () => L.DomEvent,
      on: () => L.DomEvent,
      stopPropagation: () => L.DomEvent,
      preventDefault: () => L.DomEvent,
      stop: () => L.DomEvent,
    },
  };

  const ids = ["search-form", "search-input", "results", "status", "routes", "map", "panel"];
  for (const id of ids) elements[id] = fakeElement(id === "search-form" ? "form" : "div");
  const doc = {
    getElementById: (id) => elements[id] ?? (elements[id] = fakeElement()),
    createElement: (t) => fakeElement(t),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };

  const nav = geolocation
    ? { geolocation: { watchPosition: (ok, err) => { watchers.push({ ok, err }); return 1; } } }
    : {};
  const defs = {
    window: { L },
    document: doc,
    navigator: nav,
    fetch: async (url) => {
      fetches.push(String(url));
      if (fetchImpl) return fetchImpl(url);
      return { ok: true, json: async () => [] };
    },
  };
  // Globals stay installed: app.js reads document/fetch/navigator at runtime, after import.
  // (node --test runs each test file in its own process, so nothing leaks.)
  for (const [k, v] of Object.entries(defs)) {
    Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  }
  await import(`../../src/app.js?harness=${++counter}`);

  const resetControl = () => controls.find((c) => c.container && walk(c.container, (e) => e.tagName === "BUTTON").length);
  return {
    calls, controls, stopped, elements, fetches,
    setViews: () => calls.filter((c) => c.fn === "setView").map((c) => c.args),
    lastSetView: () => calls.filter((c) => c.fn === "setView").at(-1)?.args,
    firstFix: (lat, lng, accuracy = 25) => watchers.forEach((w) => w.ok({ coords: { latitude: lat, longitude: lng, accuracy } })),
    resetControl,
    resetButton: () => { const c = resetControl(); return c && walk(c.container, (e) => e.tagName === "BUTTON")[0]; },
  };
}
