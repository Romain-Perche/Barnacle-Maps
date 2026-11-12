// Integration (wiring) tests for the route entry text (contracts/route-entry-ui.md).
// PILOT-4590: show the arrival time for each route.
// src/app.js needs a browser (Leaflet, DOM, geolocation), so these tests check its source,
// as test/routes.test.js already does. The browser behaviour is covered by tests/ai/.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const app = read("src/app.js");

// Body of a top-level function: from its declaration to the next top-level function.
function body(name) {
  const start = app.search(new RegExp(`^(async )?function ${name}\\(`, "m"));
  assert.ok(start >= 0, `function ${name} not found in src/app.js`);
  const rest = app.slice(start + 1);
  const next = rest.search(/^(async )?function \w+\(/m);
  return next < 0 ? app.slice(start) : app.slice(start, start + 1 + next);
}
const count = (s, sub) => s.split(sub).length - 1;

// covers FR-001, FR-005, FR-007, FR-008, US1 scenario 1, 3, 4, 5
test("integration route title: duration followed by arrival; pleasure line separate (FR-001, FR-007, FR-008)", () => {
  const imports = app.slice(0, app.indexOf('from "./geo.js"'));
  assert.match(imports, /\bformatArrival\b/, "app.js imports formatArrival from ./geo.js");
  const draw = body("drawRoutes");
  assert.match(draw, /^function drawRoutes\(routes, m, departure\)/, "drawRoutes receives the departure");
  assert.ok(
    draw.includes(
      "title.textContent = `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}, ${formatArrival(departure, route.duration)}`;",
    ),
    "title reads 'Route n · distance · duration, arrive HH:MM' for every route, walking and car",
  );
  assert.equal(count(app, "formatArrival("), 1, "formatArrival is used only in the route title");
  // FR-007 / FR-008: the title stays the button text (its accessible name); the pleasure span stays separate below.
  assert.ok(draw.includes("button.append(title);"));
  assert.ok(draw.includes('pleasure.className = "pleasure";') && draw.includes("button.append(pleasure);"));
  assert.ok(draw.indexOf("button.append(title);") < draw.indexOf("button.append(pleasure);"));
  assert.ok(!/aria-label/.test(draw), "no aria-label on the route button: its text is the accessible name");
});

// covers FR-002, FR-006, US2 scenario 1, 2, SC-003
test("integration departure: captured once per computation, after the latest-request guard (FR-002, FR-006, US2 scenario 1, 2)", () => {
  const upd = body("updateRoutes");
  const iClear = upd.indexOf("clearRoutes();");
  const iFetch = upd.indexOf("await fetchRoutes(");
  const iGuard = upd.indexOf("if (seq !== routeSeq) return;");
  const iEmpty = upd.indexOf("if (!routes.length)");
  const iDep = upd.indexOf("const departure = new Date();");
  const iDraw = upd.indexOf("drawRoutes(routes, m, departure);");
  assert.ok(iDep >= 0, "updateRoutes captures `const departure = new Date();`");
  assert.ok(iDraw >= 0, "updateRoutes calls drawRoutes(routes, m, departure)");
  assert.equal(count(upd, "new Date("), 1, "one departure per computation");
  assert.ok(iClear >= 0 && iClear < iFetch, "earlier entries are removed when a computation starts");
  assert.ok(iFetch < iGuard && iGuard < iEmpty && iEmpty < iDep && iDep < iDraw,
    "departure is taken when the final routes of the latest request are ready, just before drawing");
  // Error and no-route branches return before drawing: no entries, no arrival times.
  const iCatch = upd.indexOf("catch (err)");
  assert.ok(iCatch > iFetch && iCatch < iDep);
  // Every recomputation (destination, mode, stops, late location) goes through updateRoutes.
  assert.equal(count(app, "drawRoutes("), 2, "drawRoutes is declared once and called only from updateRoutes");
  assert.ok(body("showRoute").includes("updateRoutes();"), "new destination recomputes");
  assert.ok(body("setStops").includes("updateRoutes();"), "stop add/remove/reorder/clear recomputes");
  assert.ok(body("onPosition").includes("if (pendingRoute && currentPlace) updateRoutes();"), "late location recomputes");
  assert.match(app, /mode = radio\.value;\s*if \(currentPlace\) updateRoutes\(\);/, "mode change recomputes");
});

// covers FR-006, US2 scenario 3: no ticking, selection and pleasure do not change the arrival text
test("integration arrival text changes only on recomputation (FR-006, US2 scenario 3)", () => {
  assert.ok(app.includes("drawRoutes(routes, m, departure);"), "arrival wiring present");
  assert.ok(!app.includes("setInterval("), "no ticking clock");
  assert.ok(!app.includes("Date.now("), "the current time is read only for the departure");
  for (const name of ["drawRoutes", "selectRoute", "setPleasure", "scorePleasure", "clearRoutes"]) {
    const b = body(name);
    assert.ok(!b.includes("new Date("), `${name} must not read the time`);
    if (name !== "drawRoutes") assert.ok(!b.includes("formatArrival("), `${name} must not rewrite the arrival text`);
  }
  for (const name of ["selectRoute", "setPleasure", "scorePleasure"])
    assert.ok(!/title\.textContent|\.textContent\s*=\s*`Route/.test(body(name)), `${name} must not change the title`);
});

// covers spec Assumptions: the status summary line keeps only the fastest duration
test("integration status summary has no clock time (contracts/route-entry-ui.md)", () => {
  const upd = body("updateRoutes");
  assert.ok(upd.includes("drawRoutes(routes, m, departure);"), "arrival wiring present");
  assert.ok(upd.includes("const summary = `${formatDistance(fastest.distance)} · ${formatDuration(fastest.duration)}`;"));
  const status = upd.slice(upd.indexOf("const summary"));
  assert.ok(!status.includes("arrive") && !status.includes("formatArrival"));
});

// covers spec Assumptions (README line)
test("integration README states the arrival time and its limits", () => {
  const r = read("README.md");
  assert.ok(r.includes("25 min, arrive 14:32"), "README shows the example");
  assert.match(r, /arrival time/i);
  assert.match(r, /leave now/i);
  assert.match(r, /no traffic/i);
  assert.match(r, /waiting/i);
});

// covers plan Constitution Check: helpers stay pure and never read the clock
test("integration src/geo.js arrival helpers stay pure (plan Constitution Check)", () => {
  const g = read("src/geo.js");
  for (const n of ["export function arrivalTime(", "export function formatClock(", "export function formatArrival("])
    assert.ok(g.includes(n), n);
  assert.ok(!g.includes("Date.now("), "no Date.now() in geo.js");
  assert.ok(!/new Date\(\s*\)/.test(g), "no argument-less new Date() in geo.js");
  assert.ok(!g.includes("setInterval(") && !g.includes("Intl."));
});
