import test from "node:test";
import assert from "node:assert/strict";
import {
  bestPleasure,
  countGreenPixels,
  isGreenPixel,
  lngLatToPixel,
  pathPixels,
  pathTiles,
} from "../src/geo.js";

const close = (x, y, tol = 1e-6) => assert.ok(Math.abs(x - y) <= tol, `${x} not within ${y} ± ${tol}`);
const sortPx = (a) => a.map(([x, y]) => [x, y]).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
const PX_DEG_Z0 = 360 / 256; // degrees of longitude per pixel at zoom 0

// OpenStreetMap standard style colours.
const PARK = [200, 250, 204];
const GRASS = [205, 235, 176];
const FOREST = [173, 209, 158];
const BACKGROUND = [242, 239, 233];
const WATER = [170, 211, 223];
const WHITE = [255, 255, 255];
const FOOTWAY = [250, 128, 114];
const BUILDING = [217, 208, 201];

function tile(rgb) {
  const data = new Uint8ClampedArray(256 * 256 * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
    data[i + 3] = 255;
  }
  return data;
}

function paint(data, x, y, rgb) {
  const i = (y * 256 + x) * 4;
  data[i] = rgb[0];
  data[i + 1] = rgb[1];
  data[i + 2] = rgb[2];
  data[i + 3] = 255;
}

// --- lngLatToPixel ---------------------------------------------------------------------------

test("lngLatToPixel: equator and prime meridian is the centre of the world", () => {
  const p0 = lngLatToPixel(0, 0, 0);
  close(p0.x, 128);
  close(p0.y, 128);
  const p16 = lngLatToPixel(0, 0, 16);
  close(p16.x, 128 * 2 ** 16);
  close(p16.y, 128 * 2 ** 16);
});

test("lngLatToPixel: world edges", () => {
  close(lngLatToPixel(0, -180, 1).x, 0);
  close(lngLatToPixel(0, 180, 1).x, 512);
  close(lngLatToPixel(85.0511287798, 0, 0).y, 0, 1e-3);
  close(lngLatToPixel(-85.0511287798, 0, 0).y, 256, 1e-3);
});

test("lngLatToPixel: north is up (smaller y) and east is right (larger x)", () => {
  const c = lngLatToPixel(48.85, 2.35, 16);
  const n = lngLatToPixel(48.86, 2.35, 16);
  const e = lngLatToPixel(48.85, 2.36, 16);
  assert.ok(n.y < c.y);
  close(n.x, c.x);
  assert.ok(e.x > c.x);
  close(e.y, c.y);
});

// --- pathPixels -------------------------------------------------------------------------------

test("pathPixels: empty or missing path gives no pixel", () => {
  assert.deepEqual(pathPixels([], 16), []);
  assert.deepEqual(pathPixels(null, 16), []);
});

test("pathPixels: single point covers its own pixel", () => {
  assert.deepEqual(pathPixels([[0, 0]], 0), [[128, 128]]);
});

test("pathPixels: radius adds every pixel within that distance", () => {
  assert.deepEqual(sortPx(pathPixels([[0, 0]], 0, 1)), [[127, 128], [128, 127], [128, 128], [128, 129], [129, 128]]);
  assert.equal(pathPixels([[0, 0]], 0, 2).length, 13);
});

test("pathPixels: a segment covers every pixel it crosses, without gaps", () => {
  const px = pathPixels([[0, 0], [0, 4.5 * PX_DEG_Z0]], 0);
  assert.deepEqual(sortPx(px), [[128, 128], [129, 128], [130, 128], [131, 128], [132, 128]]);
});

test("pathPixels: diagonal segment has a pixel in every column it spans", () => {
  const px = pathPixels([[0, 0], [0.05, 0.05]], 16);
  const a = lngLatToPixel(0, 0, 16);
  const b = lngLatToPixel(0.05, 0.05, 16);
  const xs = new Set(px.map(([x]) => x));
  for (let x = Math.floor(a.x); x <= Math.floor(b.x); x++) assert.ok(xs.has(x), `column ${x}`);
  for (const [x, y] of px) {
    assert.ok(Number.isInteger(x) && Number.isInteger(y));
    assert.ok(y <= Math.floor(a.y) && y >= Math.floor(b.y));
  }
});

test("pathPixels: no duplicate pixels, even when the path goes back over itself", () => {
  const out = [[0, 0], [0, 4.5 * PX_DEG_Z0]];
  const back = [[0, 0], [0, 4.5 * PX_DEG_Z0], [0, 0]];
  const a = pathPixels(back, 0, 2);
  assert.equal(new Set(a.map(([x, y]) => `${x}:${y}`)).size, a.length);
  assert.deepEqual(sortPx(a), sortPx(pathPixels(out, 0, 2)));
});

// --- pathTiles --------------------------------------------------------------------------------

test("pathTiles: unique 256 px tiles holding the pixels", () => {
  const t = pathTiles([[10, 10], [300, 10], [255, 255], [256, 256], [300, 20], [0, 0]]);
  assert.deepEqual(sortPx(t), [[0, 0], [1, 0], [1, 1]]);
  assert.deepEqual(pathTiles([]), []);
});

// --- isGreenPixel -----------------------------------------------------------------------------

test("isGreenPixel: parks, grass and forest are green", () => {
  for (const c of [PARK, GRASS, FOREST]) assert.equal(isGreenPixel(...c), true, String(c));
  assert.equal(isGreenPixel(0, 200, 0, 255), true);
});

test("isGreenPixel: background, water, roads, footways and buildings are not green", () => {
  for (const c of [BACKGROUND, WATER, WHITE, FOOTWAY, BUILDING, [0, 0, 0]]) assert.equal(isGreenPixel(...c), false, String(c));
});

test("isGreenPixel: transparent pixels are not green", () => {
  assert.equal(isGreenPixel(...PARK, 0), false);
  assert.equal(isGreenPixel(...PARK, 255), true);
});

// --- countGreenPixels -------------------------------------------------------------------------

test("countGreenPixels: counts only the given pixels that are green", () => {
  const t = tile(BACKGROUND);
  paint(t, 5, 5, PARK);
  paint(t, 6, 5, FOREST);
  paint(t, 200, 100, GRASS);
  const tiles = new Map([["0/0", t]]);
  assert.equal(countGreenPixels([[5, 5], [6, 5], [7, 5]], tiles), 2);
  assert.equal(countGreenPixels([[7, 5], [8, 5]], tiles), 0);
  assert.equal(countGreenPixels([[200, 100]], tiles), 1);
  assert.equal(countGreenPixels([], tiles), 0);
});

test("countGreenPixels: uses the right tile and the local position inside it", () => {
  const green = tile(BACKGROUND);
  paint(green, 3, 4, PARK); // global pixel (256 * 2 + 3, 256 * 1 + 4)
  const tiles = new Map([["0/0", tile(PARK)], ["2/1", green]]);
  assert.equal(countGreenPixels([[515, 260]], tiles), 1);
  assert.equal(countGreenPixels([[516, 260], [515, 261]], tiles), 0);
  assert.equal(countGreenPixels([[0, 0], [255, 255], [515, 260]], tiles), 3);
});

test("countGreenPixels: pixels on a missing tile are not counted", () => {
  const tiles = new Map([["0/0", tile(PARK)]]);
  assert.equal(countGreenPixels([[10, 10], [300, 10], [10, 300]], tiles), 1);
  assert.equal(countGreenPixels([[10, 10]], new Map()), 0);
});

test("a route through a park scores more green pixels than one through streets", () => {
  const z = 16;
  const park = [[0.001, 0.001], [0.001, 0.003]];
  const streets = [[-0.001, 0.001], [-0.001, 0.003]];
  const tiles = new Map();
  for (const [tx, ty] of pathTiles([...pathPixels(park, z, 4), ...pathPixels(streets, z, 4)])) {
    const data = tile(BACKGROUND);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        // Green everywhere north of the equator.
        if (ty * 256 + y < 128 * 2 ** z) paint(data, x, y, PARK);
      }
    }
    tiles.set(`${tx}/${ty}`, data);
  }
  const parkPx = pathPixels(park, z, 4);
  const counts = [countGreenPixels(pathPixels(streets, z, 4), tiles), countGreenPixels(parkPx, tiles)];
  assert.equal(counts[0], 0);
  assert.equal(counts[1], parkPx.length);
  assert.equal(bestPleasure(counts), 1);
});

// --- bestPleasure -----------------------------------------------------------------------------

test("bestPleasure: index of the route with the most green pixels", () => {
  assert.equal(bestPleasure([10, 50, 30]), 1);
  assert.equal(bestPleasure([90, 50, 30]), 0);
  assert.equal(bestPleasure([1, 2, 3]), 2);
  assert.equal(bestPleasure([7]), 0);
});

test("bestPleasure: ties go to the first (fastest) route", () => {
  assert.equal(bestPleasure([5, 40, 40]), 1);
});

test("bestPleasure: no best when there is no route or no green at all", () => {
  assert.equal(bestPleasure([]), -1);
  assert.equal(bestPleasure([0, 0, 0]), -1);
  assert.equal(bestPleasure(null), -1);
});
