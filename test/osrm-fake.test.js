// Self-checks of the fake OSRM (test/fakes/osrm.js) against the OSRM HTTP API docs.
// Not feature tests: they prove the fake refuses what real OSRM refuses (see .factory/test-env.md).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { answerRoute, checkRouteUrl, GENERAL_OPTIONS, ROUTE_OPTIONS, SCHEMA_PATH, schemaOptionNames } from "./fakes/osrm.js";

const OK = "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometries=geojson";
const noSchema = existsSync(SCHEMA_PATH) ? false : "OSRM docs not downloaded (.factory/schemas/osrm-http.md); see .factory/test-env.md";

test("fake OSRM option lists match the OSRM HTTP docs", { skip: noSchema }, () => {
  assert.deepEqual(schemaOptionNames("**Request options**"), GENERAL_OPTIONS);
  assert.deepEqual(schemaOptionNames("### Route service"), ROUTE_OPTIONS);
});

test("fake OSRM refuses an unknown option, a bad value, bad coordinates and an unknown server", () => {
  assert.equal(checkRouteUrl(OK), null);
  assert.equal(checkRouteUrl(OK.replace("geometries", "geometrie")).body.code, "InvalidOptions");
  assert.equal(checkRouteUrl(OK.replace("geojson", "json")).body.code, "InvalidValue");
  assert.equal(checkRouteUrl(OK.replace("2.35,48.85", "48.85,200")).body.code, "InvalidValue");
  assert.equal(checkRouteUrl(OK.replace("routed-bike", "routed-cycle")).body.code, "InvalidUrl");
});

test("fake OSRM answers NoRoute with HTTP 400, as the docs say for every error", () => {
  const a = answerRoute(OK, { noRoute: true });
  assert.equal(a.status, 400);
  assert.equal(a.body.code, "NoRoute");
});

test("fake OSRM answers Ok with documented route fields", () => {
  const a = answerRoute(`${OK}&alternatives=3`);
  assert.equal(a.status, 200);
  assert.equal(a.body.code, "Ok");
  for (const r of a.body.routes) {
    for (const k of ["distance", "duration", "weight", "weight_name", "geometry", "legs"]) assert.ok(k in r, k);
    assert.equal(r.geometry.type, "LineString");
  }
});
