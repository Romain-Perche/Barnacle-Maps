// Contract tests for the bar's markup and Design A styles (PILOT-73195).
// Contract: specs/pilot-73195-summary-card-for-the-selected-route/contracts/route-card-ui.md
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBody } from "./helpers/fake-browser.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const html = read("index.html");
const css = read("styles.css");
const body = parseBody(html);

// Declarations of the CSS rule whose selector list is exactly `selector`.
function rule(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
  const m = new RegExp(`(?:^|})\\s*${esc}\\s*\\{([^}]*)\\}`).exec(css);
  return m ? m[1].replace(/\s+/g, " ") : null;
}

test("markup: #route-card is a hidden, labelled group with mode, duration, distance, arrival in order", () => {
  // covers FR-002, FR-009 (order), FR-010 (readable text), FR-007 (hidden initially), FR-012 (mode first)
  const card = body.querySelector("#route-card");
  assert.ok(card, "#route-card exists");
  assert.equal(card.hidden, true, "hidden in the initial HTML");
  assert.equal(card.getAttribute("role"), "group");
  assert.equal(card.getAttribute("aria-label"), "Selected route");
  const kids = card.children.filter((c) => c.tagName !== "#TEXT").map((c) => `${c.tagName}.${c.className}`);
  assert.deepEqual(kids, ["SPAN.rc-mode", "B.rc-duration", "SPAN.rc-distance", "SPAN.rc-arrival"]);
  assert.equal(card.querySelectorAll("button").length, 0, "informational only: no buttons");
});

test("markup: #route-card-live is a visually hidden polite live region", () => {
  // covers FR-010 (announced politely, no focus steal)
  const live = body.querySelector("#route-card-live");
  assert.ok(live, "#route-card-live exists");
  assert.equal(live.getAttribute("aria-live"), "polite");
  assert.ok(live.classList.contains("sr-only"));
  assert.equal(live.getAttribute("tabindex"), null);
});

test("markup: the bar is a sibling after #map and before #panel, not inside the map", () => {
  // covers FR-009 (does not block map clicks outside its area; clicks on it don't reach Leaflet)
  const tops = body.children.filter((c) => c.tagName !== "#TEXT").map((c) => c.id);
  const iMap = tops.indexOf("map");
  const iCard = tops.indexOf("route-card");
  const iPanel = tops.indexOf("panel");
  assert.ok(iMap >= 0 && iCard > iMap && iCard < iPanel, `top-level order: ${tops.join(", ")}`);
  assert.equal(body.querySelector("#map").children.length, 0);
});

test("styles: Design A bottom-centered bar above the map and its attribution", () => {
  // covers FR-009 (bottom centre, not over attribution/zoom), edge case "small screens"
  const r = rule("#route-card");
  assert.ok(r, "#route-card rule exists");
  assert.match(r, /position:\s*absolute/);
  assert.match(r, /left:\s*50%/);
  assert.match(r, /translateX\(\s*-50%\s*\)/);
  const bottom = /bottom:\s*(\d+)px/.exec(r);
  assert.ok(bottom && Number(bottom[1]) >= 20, "bottom offset clears the attribution");
  assert.doesNotMatch(r, /(^|[^-])top:/, "anchored at the bottom, not the top");
  assert.match(r, /z-index:\s*\d{3,}/);
  assert.match(r, /max-width:\s*calc\(100%\s*-\s*\d+px\)/);
  assert.match(r, /flex-wrap:\s*wrap/);
  assert.match(r, /background:\s*#fff/);
});

test("styles: hidden really hides; figures never truncate; duration in selected-route blue", () => {
  // covers FR-007 (hidden), FR-009 (duration emphasized in #1a73e8), edge case "never truncate a figure"
  assert.match(rule("#route-card[hidden]") || "", /display:\s*none/);
  assert.match(rule("#route-card > *") || "", /white-space:\s*nowrap/);
  assert.doesNotMatch(css.match(/#route-card[^{]*\{[^}]*\}/g).join(""), /text-overflow:\s*ellipsis/);
  assert.match(rule("#route-card .rc-duration") || "", /color:\s*#1a73e8/i);
});

test("styles: the travel mode is grey, so the blue duration stays the strongest item", () => {
  // covers FR-009, FR-012 (mode "in grey")
  const r = rule("#route-card .rc-mode");
  assert.ok(r, "#route-card .rc-mode rule exists");
  assert.match(r, /color:\s*#666\b/i, "the panel's secondary grey, not the duration blue");
});

test("styles: .sr-only utility exists", () => {
  // covers FR-010
  const r = rule(".sr-only");
  assert.ok(r, ".sr-only rule exists");
  assert.match(r, /position:\s*absolute/);
  assert.match(r, /overflow:\s*hidden/);
});
