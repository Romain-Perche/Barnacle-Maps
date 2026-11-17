// SF-73 design C selector: one row of segmented buttons with icons (🚶 Walk | 🚗 Car | 🚲 Bike).
// covers FR-001, FR-002, US1 scenario 1 (contracts/travel-modes.md "Selector markup")
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TRAVEL_MODES } from "../src/geo.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const html = read("index.html");
const css = read("styles.css");
const modeBlock = () => {
  const m = html.match(/<div id="mode"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(m, "#mode block in index.html");
  return m;
};
const labels = () => [...modeBlock()[1].matchAll(/<label>([\s\S]*?)<\/label>/g)].map((x) => x[1]);
const rule = (selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`(^|[},])\\s*${esc}\\s*\\{([^}]*)\\}`, "m"));
  return m ? m[2] : null;
};

test("selector is a radiogroup named Travel mode", () => {
  assert.match(modeBlock()[0], /role="radiogroup"/);
  assert.match(modeBlock()[0], /aria-label="Travel mode"/);
});

test("selector has three radios foot, car, bike in that order, Walk checked", () => {
  const inputs = [...modeBlock()[1].matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(inputs.length, 3);
  assert.deepEqual(inputs.map((i) => i.match(/value="([^"]*)"/)[1]), ["foot", "car", "bike"]);
  for (const i of inputs) assert.match(i, /type="radio"/), assert.match(i, /name="mode"/);
  assert.deepEqual(inputs.map((i) => /\schecked\b/.test(i)), [true, false, false]);
});

test("each segment shows its icon (hidden from screen readers) then its label", () => {
  const want = [["🚶", "Walk"], ["🚗", "Car"], ["🚲", "Bike"]];
  const got = labels();
  assert.equal(got.length, 3);
  got.forEach((l, i) => {
    const [icon, text] = want[i];
    assert.match(l, /<input\b[^>]*>\s*<span>/, "input followed by a span");
    assert.ok(l.includes(`<span aria-hidden="true">${icon}</span> ${text}</span>`), `${text} segment: ${l}`);
  });
});

test("selector icons and labels match TRAVEL_MODES", () => {
  for (const key of ["foot", "car", "bike"]) {
    const m = TRAVEL_MODES[key];
    assert.ok(html.includes(`value="${key}"`), key);
    assert.ok(html.includes(`<span aria-hidden="true">${m?.icon}</span> ${m?.label}</span>`), key);
  }
});

test("styles draw one bordered row of equal segments", () => {
  const box = rule("#mode");
  assert.ok(box, "#mode rule");
  assert.match(box, /display:\s*flex/);
  assert.match(box, /border:\s*1px solid/);
  assert.doesNotMatch(box, /gap:/, "segments touch (no gap)");
  assert.match(rule("#mode label") ?? "", /flex:\s*1/);
});

test("radio inputs are visually hidden but stay focusable", () => {
  const input = rule("#mode input");
  assert.ok(input, "#mode input rule");
  assert.match(input, /opacity:\s*0/);
  assert.doesNotMatch(css, /#mode input[^{]*\{[^}]*display:\s*none/);
  assert.doesNotMatch(css, /#mode input[^{]*\{[^}]*visibility:\s*hidden/);
});

test("checked segment is highlighted and keyboard focus is visible", () => {
  const on = rule("#mode input:checked + span");
  assert.ok(on, "checked rule");
  assert.match(on, /background:\s*#e8f0fe/);
  assert.match(on, /color:\s*#1a73e8/);
  assert.match(on, /font-weight:\s*600/);
  assert.match(rule("#mode input:focus-visible + span") ?? "", /outline:/);
});
