// User Story 2: the QR code follows changes of mode and destination (never an outdated trip).
// The DOM lifecycle (hide while recomputing) is covered by tests/ai/us2-qr-follows-changes.md.
// PILOT-28672: QR code of the selected route.
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const qr = await import("../src/qr.js").catch(() => ({}));

// Fake library: the "image" is the encoded text, so tests can read what the QR code holds.
const echo = () => {
  let text = "";
  return { addData: (t) => (text = t), make() {}, createSvgTag: () => `<svg data-text="${text}"/>` };
};
const decoded = (src) => decodeURIComponent(src.slice("data:image/svg+xml,".length)).match(/data-text="([^"]*)"/)[1];

const start = { lat: 48.8566, lng: 2.3522 };
const louvre = { lat: 48.860611, lng: 2.337644 };
const eiffel = { lat: 48.858222, lng: 2.2945 };

// covers FR-005, US2 scenario 1: walking -> car switches the engine, same start and destination.
test("switching to car changes only the engine in the QR link", () => {
  const foot = new URL(geo.phoneRouteUrl(start, louvre, "foot"));
  const car = new URL(geo.phoneRouteUrl(start, louvre, "car"));
  assert.equal(foot.searchParams.get("engine"), "fossgis_osrm_foot");
  assert.equal(car.searchParams.get("engine"), "fossgis_osrm_car");
  assert.equal(car.searchParams.get("route"), foot.searchParams.get("route"));
  assert.equal(decoded(qr.qrImageSrc(echo, car.href)), car.href);
});

// covers FR-005, SC-005, US2 scenario 2: a new destination gives a new QR code without the old one.
test("choosing another destination gives a QR code for the new destination only", () => {
  const before = geo.phoneRouteUrl(start, louvre, "foot");
  const after = geo.phoneRouteUrl(start, eiffel, "foot");
  const src = qr.qrImageSrc(echo, after);
  assert.notEqual(src, qr.qrImageSrc(echo, before));
  assert.equal(decoded(src), after);
  assert.ok(after.includes("48.85822%2C2.29450"), after);
  assert.ok(!after.includes("48.86061"), "old destination must not remain");
});

// covers FR-003, edge case "live position keeps moving": the link uses the start it is given,
// so a later position gives a different link only when routes are recomputed with it.
test("the start in the link is exactly the start passed in", () => {
  const moved = { lat: 48.8571, lng: 2.3531 };
  const a = new URL(geo.phoneRouteUrl(start, louvre, "foot")).searchParams.get("route");
  const b = new URL(geo.phoneRouteUrl(moved, louvre, "foot")).searchParams.get("route");
  assert.ok(a.startsWith("48.85660,2.35220;"), a);
  assert.ok(b.startsWith("48.85710,2.35310;"), b);
});
