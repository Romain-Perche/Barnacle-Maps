// Contract tests for qrImageSrc (contracts/phone-link.md §2). The QR library is injected as a stub:
// the real qrcode-generator is loaded from the CDN in the browser only.
// PILOT-28672: QR code of the selected route.
import test from "node:test";
import assert from "node:assert/strict";

// Dynamic import so each test fails on its own while src/qr.js does not exist yet.
const qr = await import("../src/qr.js").catch(() => ({}));

function stubFactory(svg = "<svg>x</svg>") {
  const calls = [];
  const factory = (...args) => {
    calls.push(["factory", ...args]);
    return {
      addData: (t) => calls.push(["addData", t]),
      make: () => calls.push(["make"]),
      createSvgTag: (opts) => (calls.push(["createSvgTag", opts]), svg),
    };
  };
  return { factory, calls };
}

const LINK = "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=48.85660%2C2.35220%3B48.86061%2C2.33764";

// covers FR-009 (library does the encoding), FR-006 (SVG image), US1 scenario 1 (QR encodes the link).
test("qrImageSrc returns an SVG data URL built by the library from the link", () => {
  const { factory, calls } = stubFactory();
  assert.equal(qr.qrImageSrc(factory, LINK), "data:image/svg+xml," + encodeURIComponent("<svg>x</svg>"));
  assert.deepEqual(calls, [
    ["factory", 0, "L"],
    ["addData", LINK],
    ["make"],
    ["createSvgTag", { cellSize: 1, margin: 4, scalable: true }],
  ]);
});

// covers FR-006: the quiet zone is 4 modules and the image scales to its CSS size.
test("qrImageSrc asks for a 4-module quiet zone and a scalable SVG", () => {
  const { factory, calls } = stubFactory();
  qr.qrImageSrc(factory, LINK);
  const opts = calls.find((c) => c[0] === "createSvgTag")?.[1];
  assert.equal(opts?.margin, 4);
  assert.equal(opts?.scalable, true);
});

// covers FR-010: library missing (CDN failed) or not a function: no image, no throw.
test("qrImageSrc returns null when the library is missing", () => {
  assert.equal(qr.qrImageSrc(undefined, LINK), null);
  assert.equal(qr.qrImageSrc({}, LINK), null);
  assert.equal(qr.qrImageSrc("qrcode", LINK), null);
});

// covers FR-005 (nothing to share): empty text gives no image.
test("qrImageSrc returns null for an empty link", () => {
  const { factory, calls } = stubFactory();
  assert.equal(qr.qrImageSrc(factory, ""), null);
  assert.equal(qr.qrImageSrc(factory, null), null);
  assert.equal(calls.length, 0);
});

// covers FR-010: a library error is caught and gives no image.
test("qrImageSrc returns null when the library throws", () => {
  const boom = () => {
    throw new Error("boom");
  };
  assert.equal(qr.qrImageSrc(boom, LINK), null);
  const makeThrows = () => ({ addData() {}, make: boom, createSvgTag: () => "<svg/>" });
  assert.equal(qr.qrImageSrc(makeThrows, LINK), null);
});
