// Contract tests for the search clear button (specs/pilot-85820-.../contracts/ui-contract.md).
// The repo has no DOM library, so these check the shipped source files. Behaviour is covered by tests/ai/*.md.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

const button = html.match(/<button\b[^>]*\bid="search-clear"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? "";

// Returns the source of the first listener body for `target.addEventListener("event", ...)`.
function listener(target, event) {
  const start = js.indexOf(`${target}.addEventListener("${event}"`);
  if (start < 0) return "";
  const next = js.indexOf(".addEventListener(", start + 10);
  return js.slice(start, next < 0 ? undefined : next);
}

test("clear button exists, is a non-submitting button named 'Clear search', hidden initially", () => {
  // covers FR-001, FR-008, FR-009, US1 scenario 1, US3 scenario 2
  assert.ok(button, "button#search-clear missing in index.html");
  assert.match(button, /type="button"/);
  assert.match(button, /aria-label="Clear search"/);
  assert.match(button, /\bhidden\b/);
  assert.match(button, />\s*×\s*</);
});

test("clear button sits after the input and before Go, inside the search form (tab order)", () => {
  // covers FR-009, US3 scenario 1
  const form = html.match(/<form id="search-form">[\s\S]*?<\/form>/)[0];
  const i = form.indexOf('id="search-input"');
  const c = form.indexOf('id="search-clear"');
  const go = form.indexOf('type="submit"');
  assert.ok(i >= 0 && c > i && go > c, "expected order: input, clear button, Go");
});

test("CSS hides native search clear controls so only one × shows", () => {
  // covers FR-011, SC-005
  assert.match(css, /#search-input::-webkit-search-cancel-button\s*\{[^}]*display:\s*none/);
  assert.match(css, /#search-input::-ms-clear\s*\{[^}]*display:\s*none/);
});

test("CSS gives the button a >=24px tap area and keeps text clear of it", () => {
  // covers FR-010, edge case: long text
  const rule = css.match(/#search-clear\s*\{[^}]*\}/)?.[0] ?? "";
  const size = (p) => Number(rule.match(new RegExp(`${p}:\\s*(\\d+)px`))?.[1] ?? 0);
  assert.ok(size("width") >= 24 && size("height") >= 24, "width/height must be at least 24px");
  const pad = Number(css.match(/#search-input\s*\{[^}]*padding-right:\s*(\d+)px/)?.[1] ?? 0);
  assert.ok(pad >= 28, "input needs padding-right so text does not run under the button");
  assert.match(css, /#search-clear\[hidden\]\s*\{[^}]*display:\s*none/);
});

test("visibility is synced on typing and on app-set values", () => {
  // covers FR-002, US1 scenario 2 and 5, US2 scenario 1
  assert.match(js, /function syncClear\(\)\s*\{[^}]*clearBtn\.hidden\s*=\s*input\.value\s*===\s*""/);
  assert.match(listener("input", "input"), /syncClear\(\)/);
  const show = js.slice(js.indexOf("function showRoute"));
  assert.match(show.slice(0, show.indexOf("updateRoutes")), /input\.value = place\.name;\s*syncClear\(\)/);
  assert.match(js, /input\.value = "";\s*syncClear\(\);\s*tryAddStop/);
});

test("click handler empties box, results, status; cancels searches; refocuses", () => {
  // covers FR-003, FR-004, FR-005, FR-006, FR-007, US1 scenario 3 and 4
  const h = listener("clearBtn", "click");
  assert.ok(h, "no click listener on clearBtn");
  for (const part of [
    /clearTimeout\(suggestTimer\)/,
    /searchSeq\+\+/,
    /input\.value = ""/,
    /results\.replaceChildren\(\)/,
    /setStatus\(""\)/,
    /syncClear\(\)/,
    /input\.focus\(\)/,
  ]) assert.match(h, part);
});

test("click handler leaves destination, routes, stops and mode alone and does not submit", () => {
  // covers FR-008, US2 scenario 2
  const h = listener("clearBtn", "click");
  assert.ok(h, "no click listener on clearBtn");
  for (const bad of [/currentPlace/, /stops\b/, /clearRoutes/, /updateRoutes/, /selectedRoute/, /\bmode\b/, /destMarker/, /runSearch/, /submit/])
    assert.doesNotMatch(h, bad);
});
