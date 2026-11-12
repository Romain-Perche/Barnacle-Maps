// Test harness: runs the real src/app.js in Node with a minimal fake DOM, a fake Leaflet,
// a fake geolocation and a scripted fetch. Each bootApp() call loads a fresh app instance.
// Not a test file itself (no ".test." in its name), so `node --test test/` does not run it alone.

class FakeEvent {
  constructor(type) {
    this.type = type;
    this.defaultPrevented = false;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
}

class FakeElement {
  constructor(tag, id = "") {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.children = [];
    this.parent = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this._text = "";
    this.className = "";
    this.title = "";
    this.type = "";
    this.value = "";
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.width = 0;
    this.height = 0;
    const el = this;
    this.classList = {
      toggle(c, on) {
        const set = new Set(el.className.split(/\s+/).filter(Boolean));
        const want = on === undefined ? !set.has(c) : on;
        if (want) set.add(c);
        else set.delete(c);
        el.className = [...set].join(" ");
        return want;
      },
      contains(c) {
        return el.className.split(/\s+/).includes(c);
      },
      add(c) {
        this.toggle(c, true);
      },
      remove(c) {
        this.toggle(c, false);
      },
    };
  }
  get textContent() {
    return this._text + this.children.map((c) => (typeof c === "string" ? c : c.textContent)).join("");
  }
  set textContent(v) {
    this.children = [];
    this._text = String(v);
  }
  append(...nodes) {
    for (const n of nodes) {
      if (n && typeof n === "object") n.parent = this;
      this.children.push(n);
    }
  }
  replaceChildren(...nodes) {
    this._text = "";
    this.children = [];
    this.append(...nodes);
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }
  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type) {
    const ev = new FakeEvent(type);
    for (const fn of this.listeners.get(type) || []) fn(ev);
    return ev;
  }
  click() {
    return this.dispatch("click");
  }
  get elementChildren() {
    return this.children.filter((c) => c && typeof c === "object");
  }
  querySelectorAll(tag) {
    const out = [];
    const walk = (n) => {
      for (const c of n.elementChildren) {
        if (c.tagName === tag.toUpperCase()) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
}

function fakeLeaflet(world) {
  const layer = (extra = {}) => {
    const l = {
      addTo() {
        world.layers.add(l);
        return l;
      },
      remove() {
        world.layers.delete(l);
        return l;
      },
      on() {
        return l;
      },
      setStyle() {
        return l;
      },
      bringToFront() {
        return l;
      },
      setLatLng() {
        return l;
      },
      bindPopup() {
        return l;
      },
      bindTooltip() {
        return l;
      },
      setContent() {
        return l;
      },
      openOn() {
        return l;
      },
      ...extra,
    };
    return l;
  };
  const map = {
    setView() {
      return map;
    },
    fitBounds() {
      return map;
    },
    on(type, fn) {
      world.mapListeners[type] = fn;
      return map;
    },
    closePopup() {
      return map;
    },
  };
  return {
    map: () => map,
    tileLayer: () => layer(),
    polyline: (path) => {
      const l = layer({ path });
      world.polylines.push(l);
      return l;
    },
    circleMarker: () => layer(),
    marker: () => layer(),
    divIcon: () => ({}),
    popup: () => layer(),
    featureGroup: () => ({ getBounds: () => ({}) }),
    DomEvent: { stopPropagation() {} },
  };
}

let instance = 0;

// Lets queued promises, microtasks and immediates run.
export async function settle(rounds = 20) {
  for (let i = 0; i < rounds; i++) await new Promise((r) => setImmediate(r));
}

// A promise you resolve later: used to delay a routing response.
export function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

// OSRM-like JSON for routes [{ distance, duration, path: [[lat, lng], ...] }].
export function osrmJson(routes) {
  return {
    code: "Ok",
    routes: routes.map((r) => ({
      distance: r.distance,
      duration: r.duration,
      geometry: { coordinates: r.path.map(([lat, lng]) => [lng, lat]) },
    })),
  };
}

export const START = { lat: 48.85, lng: 2.35 };
export const DEST = { lat: 48.86, lng: 2.36, name: "Destination Place" };

// Three distinct paths from START to DEST (low overlap, similar lengths).
export const PATHS = [
  [
    [48.85, 2.35],
    [48.855, 2.355],
    [48.86, 2.36],
  ],
  [
    [48.85, 2.35],
    [48.85, 2.36],
    [48.86, 2.36],
  ],
  [
    [48.85, 2.35],
    [48.86, 2.35],
    [48.86, 2.36],
  ],
];

// Builds routes with the given durations (seconds) on distinct paths. Distance 2100 m → "2.10 km".
export function routesWith(durations, distance = 2100) {
  return durations.map((duration, i) => ({ distance: distance + i * 100, duration, path: PATHS[i % 3] }));
}

/**
 * Boots a fresh app instance.
 * `route(url, call)` answers each OSRM request (call = 1-based index); return JSON, a promise of
 * JSON, or throw to make the request fail.
 * `search(q)` answers Nominatim requests; default: one result at DEST plus one stop candidate.
 */
export async function bootApp({ route, search } = {}) {
  const world = {
    layers: new Set(),
    polylines: [],
    mapListeners: {},
    routeCalls: [],
    searchCalls: [],
    tileCalls: 0,
  };
  const ids = ["map", "search-form", "search-input", "results", "status", "routes", "stops-box", "stops", "clear-stops"];
  const els = Object.fromEntries(ids.map((id) => [id, new FakeElement(id === "search-form" ? "form" : "div", id)]));
  const radios = ["foot", "car"].map((v) => {
    const r = new FakeElement("input");
    r.type = "radio";
    r.value = v;
    r.checked = v === "foot";
    return r;
  });
  let watcher = null;
  const document = {
    getElementById: (id) => els[id] ?? null,
    createElement: (tag) => new FakeElement(tag),
    querySelectorAll: (sel) => (sel === "input[name=mode]" ? radios : []),
  };
  const answerSearch =
    search ||
    (() => [
      { display_name: DEST.name, lat: String(DEST.lat), lon: String(DEST.lng) },
      { display_name: "Stop Place", lat: "48.853", lon: "2.362" },
      { display_name: "Other Stop", lat: "48.857", lon: "2.352" },
    ]);
  const answerRoute = route || (() => osrmJson(routesWith([1500, 1800, 2100])));
  const respond = (json) => ({ ok: true, status: 200, json: async () => json });
  globalThis.window = { L: fakeLeaflet(world) };
  globalThis.document = document;
  // Node defines a read-only global navigator: redefine it.
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    writable: true,
    value: {
      geolocation: {
        watchPosition(ok) {
          watcher = ok;
          return 1;
        },
      },
    },
  });
  globalThis.fetch = async (url) => {
    url = String(url);
    if (url.includes("/route/v1/")) {
      world.routeCalls.push(url);
      const json = await answerRoute(url, world.routeCalls.length);
      return respond(json);
    }
    if (url.includes("/search?")) {
      world.searchCalls.push(url);
      return respond(await answerSearch(url));
    }
    world.tileCalls++;
    return { ok: false, status: 503, json: async () => ({}) }; // map tiles: pleasure becomes unavailable
  };

  instance++;
  await import(`../../src/app.js?instance=${instance}`);

  const routesEl = els.routes;
  const app = {
    world,
    els,
    // Sends a geolocation fix to the app.
    async setPosition(p = START) {
      watcher({ coords: { latitude: p.lat, longitude: p.lng } });
      await settle();
    },
    // Types a query, submits the search form and waits for the results.
    async search(q = "Destination") {
      els["search-input"].value = q;
      els["search-form"].dispatch("submit");
      await settle();
    },
    resultButtons() {
      return els.results.elementChildren.map((li) => li.elementChildren);
    },
    // Clicks result i (the place name button): it becomes the destination.
    async pickResult(i = 0) {
      this.resultButtons()[i][0].click();
      await settle();
    },
    // Clicks "Add as stop" on result i.
    async addStopFromResult(i) {
      this.resultButtons()[i][1].click();
      await settle();
    },
    // Searches and picks the destination.
    async chooseDestination(i = 0) {
      await this.search();
      await this.pickResult(i);
    },
    async setMode(value) {
      for (const r of radios) r.checked = r.value === value;
      radios.find((r) => r.value === value).dispatch("change");
      await settle();
    },
    // Stop list buttons of stop i: [up, down, remove].
    stopButtons(i) {
      return els.stops.elementChildren[i].elementChildren.filter((c) => c.tagName === "BUTTON");
    },
    async clearStops() {
      els["clear-stops"].click();
      await settle();
    },
    routeButtons() {
      return routesEl.elementChildren.map((li) => li.elementChildren[0]);
    },
    // The text of each route's title span (first child of the route button).
    routeTitles() {
      return this.routeButtons().map((b) => b.elementChildren[0].textContent);
    },
    status() {
      return els.status.textContent;
    },
    panelText() {
      return routesEl.textContent + "\n" + els.status.textContent;
    },
  };
  return app;
}
