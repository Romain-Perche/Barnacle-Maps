// Contract tests for the Reset view styles and the narrow-screen panel cap in styles.css
// (specs/pilot-22089-add-a-reset-view-button/contracts/reset-view-control.md, "Placement").
// A small CSS reader: no browser layout, so this checks the declared rules, not measured pixels
// (the measured clearance of SC-006 is checked by tests/ai/us2-find-and-use-button.md).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

// Returns [{ media: string|null, selectors: string[], decls: {prop: value} }]
function parse(text, media = null, out = []) {
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    const head = text.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      j++;
    }
    const body = text.slice(open + 1, j - 1);
    if (head.startsWith("@media")) parse(body, head, out);
    else if (!head.startsWith("@")) {
      const decls = {};
      for (const d of body.split(";")) {
        const k = d.indexOf(":");
        if (k > 0) decls[d.slice(0, k).trim().toLowerCase()] = d.slice(k + 1).trim().toLowerCase();
      }
      out.push({ media, selectors: head.split(",").map((s) => s.trim().replace(/\s+/g, " ")), decls });
    }
    i = j;
  }
  return out;
}
const rules = parse(css);
const declsFor = (pred, media = (m) => m === null) =>
  Object.assign({}, ...rules.filter((r) => media(r.media) && r.selectors.some(pred)).map((r) => r.decls));
const narrow = (m) => m !== null && /max-width:\s*440px/.test(m);

function px(v) {
  const m = String(v || "").match(/^(\d+(?:\.\d+)?)px$/);
  return m ? Number(m[1]) : NaN;
}
function rgb(v) {
  const s = String(v || "").trim();
  let m = s.match(/^#([0-9a-f]{3})$/);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = s.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
  m = s.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return m.slice(1, 4).map(Number);
  if (s === "black") return [0, 0, 0];
  if (s === "white") return [255, 255, 255];
  return null;
}
function luminance([r, g, b]) {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const isBase = (s) => /(^|[\s>])\.reset-view$/.test(s) || /button\.reset-view$/.test(s);

// covers FR-009 (at least 30×30 CSS px), FR-001 (square, same size as the zoom buttons)
test("css contract: .reset-view is a square of at least 30×30 px", () => {
  const d = declsFor(isBase);
  const w = px(d.width ?? d["min-width"]);
  const h = px(d.height ?? d["min-height"]);
  assert.ok(w >= 30, `width ${d.width}`);
  assert.ok(h >= 30, `height ${d.height}`);
  assert.equal(w, h, "square");
});

// covers FR-001 (glyph #333 or darker), FR-009 (≥ 3:1 against the background)
test("css contract: the ⌂ glyph is #333 or darker with ≥ 3:1 contrast on its background", () => {
  const d = declsFor(isBase);
  const fg = rgb(d.color);
  assert.ok(fg, `color declared on .reset-view (got ${d.color})`);
  assert.ok(luminance(fg) <= luminance([0x33, 0x33, 0x33]) + 1e-9, `${d.color} is #333 or darker`);
  const bgDecl = (d["background-color"] ?? d.background ?? "#fff").split(/\s+/)[0];
  const bg = rgb(bgDecl) || [255, 255, 255];
  assert.ok(contrast(fg, bg) >= 3, `contrast ${contrast(fg, bg).toFixed(2)}`);
  for (const state of [":hover", ":active"]) {
    const s = declsFor((sel) => sel.includes(".reset-view" + state));
    const sbg = rgb((s["background-color"] ?? s.background ?? "").split(/\s+/)[0]);
    if (sbg) assert.ok(contrast(fg, sbg) >= 3, `${state} contrast`);
  }
});

// covers FR-001 (same hover/active look as the zoom buttons)
test("css contract: .reset-view has hover and active styles", () => {
  for (const state of [":hover", ":active"]) {
    const s = declsFor((sel) => sel.includes(".reset-view" + state));
    assert.ok(Object.keys(s).length > 0, `${state} rule`);
  }
});

// covers FR-006 (visible focus indicator)
test("css contract: .reset-view shows a visible keyboard focus indicator", () => {
  const s = declsFor((sel) => /\.reset-view:focus(-visible)?\b/.test(sel));
  const ring = s.outline ?? s["outline-style"] ?? s["box-shadow"];
  assert.ok(ring, "outline or box-shadow on :focus-visible");
  assert.doesNotMatch(ring, /^(none|0)\b/, "focus indicator is not removed");
});

// covers FR-007, SC-006 (panel capped above the controls on ≤ 440 px wide viewports)
test("css contract: at ≤ 440 px the panel is a capped, non-scrolling flex column", () => {
  const p = declsFor((s) => s === "#panel", narrow);
  assert.match(p["max-height"] || "", /calc\(\s*100%\s*-\s*\d+px\s*\)/, "max-height: calc(100% - Npx)");
  const offset = Number((p["max-height"] || "").match(/(\d+)px/)?.[1]);
  assert.ok(offset >= 172, `offset ${offset}px leaves room for the bottom-right stack + 10 px`);
  assert.equal(p.display, "flex");
  assert.equal(p["flex-direction"], "column");
  assert.equal(p.overflow, "hidden", "the panel itself does not scroll");
});

// covers FR-007 (only results/routes scroll; search box, Go, mode and status stay visible)
test("css contract: at ≤ 440 px only #results and #routes shrink and scroll", () => {
  for (const id of ["#results", "#routes"]) {
    const d = declsFor((s) => s === id, narrow);
    assert.ok(["auto", "scroll"].includes(d["overflow-y"] ?? d.overflow), `${id} overflow-y: auto`);
    assert.equal(px(d["min-height"]) || Number(d["min-height"]), 0, `${id} min-height: 0`);
  }
  for (const id of ["#search-form", "#mode", "#status"]) {
    const d = declsFor((s) => s === id, narrow);
    assert.ok(d.flex === "none" || d["flex-shrink"] === "0", `${id} keeps its height (flex: none)`);
  }
});

// covers FR-007 (wider viewports keep the panel unchanged)
test("css contract: outside the narrow media query the panel has no height cap", () => {
  const p = declsFor((s) => s === "#panel");
  assert.equal(p["max-height"], undefined);
  assert.notEqual(p.overflow, "hidden");
  // and the narrow rules exist at all (otherwise this test would say nothing)
  assert.ok(rules.some((r) => narrow(r.media)), "@media (max-width: 440px) block present");
});
