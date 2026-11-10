// Contract tests for the on-map Reset view control (contracts/reset-view-control.md):
// its DOM (via the fake Leaflet in test/support/fake-browser.js) and its styling (styles.css).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bootApp, findResetButtons, resetButton } from "./support/fake-browser.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// --- Tiny CSS reader: top-level rules and the rules inside @media blocks ----------------------

function parseCss(src) {
  const css = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const top = [];
  const media = [];
  let i = 0;
  let plain = "";
  while (i < css.length) {
    const at = css.indexOf("@media", i);
    if (at < 0) { plain += css.slice(i); break; }
    plain += css.slice(i, at);
    const open = css.indexOf("{", at);
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    media.push({ query: css.slice(at + 6, open).trim(), rules: rulesOf(css.slice(open + 1, j - 1)) });
    i = j;
  }
  top.push(...rulesOf(plain));
  return { top, media };
}

function rulesOf(text) {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    selectors: sel.split(",").map((s) => s.trim().replace(/\s+/g, " ")),
    decls: Object.fromEntries(
      body.split(";").map((d) => d.split(/:(.*)/s).map((x) => x?.trim())).filter(([k, v]) => k && v)
        .map(([k, v]) => [k.toLowerCase(), v.replace(/\s*!important$/, "")]),
    ),
  }));
}

function declsFor(rules, selector) {
  const out = {};
  for (const r of rules) if (r.selectors.includes(selector)) Object.assign(out, r.decls);
  return out;
}

function hasSelector(rules, re) {
  return rules.some((r) => r.selectors.some((s) => re.test(s)));
}

const NAMED = { white: "#ffffff", black: "#000000" };
function rgb(color) {
  let c = String(color).trim().toLowerCase();
  c = NAMED[c] ?? c;
  let m = c.match(/^#([0-9a-f]{3})$/);
  if (m) c = "#" + [...m[1]].map((x) => x + x).join("");
  m = c.match(/^#([0-9a-f]{6})$/);
  if (m) return [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16));
  m = c.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
  if (m) return m.slice(1, 4).map(Number);
  return null;
}
function luminance([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const colorIn = (value) => (String(value).match(/#[0-9a-f]{3,6}\b|rgba?\([^)]*\)|\b(?:white|black)\b/i) || [])[0];
const px = (v) => { const m = String(v ?? "").match(/^(-?\d+(?:\.\d+)?)px$/); return m ? Number(m[1]) : NaN; };

const css = parseCss(read("styles.css"));
const btn = declsFor(css.top, ".reset-view");
const hover = declsFor(css.top, ".reset-view:hover");
const focus = declsFor(css.top, ".reset-view:focus-visible");

// --- DOM contract ------------------------------------------------------------------------------

// covers FR-001 (added once, bottom-right, above the attribution)
test("control: exactly one Reset view control, in the bottomright corner", async () => {
  const ctx = await bootApp();
  const found = findResetButtons(ctx);
  assert.equal(found.length, 1, "exactly one Reset view button among the map controls");
  assert.equal(found[0].position, "bottomright");
  const corner = ctx.map._corners.bottomright;
  assert.ok(corner.contains(found[0].container), "the control's container sits in the bottom-right corner");
});

// covers FR-001, FR-009 (Leaflet control look), contract §DOM
test("control: container is a leaflet-bar with the reset-view-control class", async () => {
  const { container } = resetButton(await bootApp());
  assert.ok(container.classList.contains("leaflet-bar"), "leaflet-bar supplies the Leaflet border and radius");
  assert.ok(container.classList.contains("reset-view-control"));
});

// covers FR-006, FR-007, FR-010, US3 scenarios 2 and 4
test("control: native <button type=button class=reset-view> named and titled 'Reset view', never disabled", async () => {
  const { button } = resetButton(await bootApp());
  assert.equal(button.localName, "button");
  assert.equal(button.getAttribute("type"), "button");
  assert.ok(button.classList.contains("reset-view"));
  assert.equal(button.getAttribute("aria-label"), "Reset view");
  assert.equal(button.getAttribute("title"), "Reset view");
  assert.equal(button.disabled, false);
  assert.equal(button.hasAttribute("disabled"), false);
  assert.equal(button.getAttribute("aria-disabled"), null);
  assert.equal(button.getAttribute("role"), null, "a native button needs no role attribute");
  assert.equal(button.getAttribute("tabindex"), null, "natural tab order: no tabindex");
});

// covers FR-001 (inline SVG circular arrow ~22px, no text glyph)
test("control: icon is an inline aria-hidden SVG of 22x22 px, not the ⟲ text glyph", async () => {
  const { button } = resetButton(await bootApp());
  const svgEl = [button, ...button.descendants()].find((e) => e.localName === "svg");
  const markup = button.innerHTML + [...button.descendants()].map((e) => e.innerHTML).join("");
  assert.ok(svgEl || /<svg[\s>]/i.test(markup), "the button contains an <svg>");
  assert.ok(!button.textContent.includes("⟲") && !markup.replace(/<svg[\s\S]*<\/svg>/i, "").includes("⟲"),
    "no ⟲ text character outside the SVG");
  assert.equal(button.textContent.replace(/<[^>]*>/g, "").trim(), "", "no visible text label");
  const attr = (name) => svgEl ? svgEl.getAttribute(name) : (markup.match(new RegExp(`<svg[^>]*\\s${name}="([^"]*)"`, "i")) || [])[1] ?? null;
  assert.equal(attr("aria-hidden"), "true");
  assert.equal(attr("focusable"), "false");
  const cssSvg = { ...declsFor(css.top, ".reset-view svg"), ...declsFor(css.top, ".reset-view > svg") };
  const w = px(cssSvg.width) || Number(attr("width"));
  const h = px(cssSvg.height) || Number(attr("height"));
  assert.equal(w, 22, "icon width 22px");
  assert.equal(h, 22, "icon height 22px");
});

// covers FR-002 (clicks, double-clicks, wheel and presses on the button never reach the map)
test("control: click and scroll propagation to the map are disabled on the control", async () => {
  const { container, button } = resetButton(await bootApp());
  const chain = [];
  for (let x = button; x && x !== container.parentNode; x = x.parentNode) chain.push(x);
  assert.ok(chain.some((e) => e._fakeClickPropagationDisabled), "L.DomEvent.disableClickPropagation on the control");
  assert.ok(chain.some((e) => e._fakeScrollPropagationDisabled), "L.DomEvent.disableScrollPropagation on the control");
});

// --- Styling contract (styles.css) ------------------------------------------------------------

// covers FR-011
test("css: .reset-view is at least 44x44 CSS px", () => {
  const w = Math.max(px(btn.width) || 0, px(btn["min-width"]) || 0);
  const h = Math.max(px(btn.height) || 0, px(btn["min-height"]) || 0);
  assert.ok(w >= 44, `width ${w}px >= 44px`);
  assert.ok(h >= 44, `height ${h}px >= 44px`);
});

// covers FR-009 (white default, #f4f4f4 hover, no pressed or disabled style)
test("css: white default, #f4f4f4 hover, no :active and no disabled style", () => {
  const bg = colorIn(btn.background ?? btn["background-color"]);
  assert.ok(bg && rgb(bg).join() === "255,255,255", `default background is #fff (got ${bg})`);
  const hv = colorIn(hover.background ?? hover["background-color"]);
  assert.ok(hv && rgb(hv).join() === "244,244,244", `hover background is #f4f4f4 (got ${hv})`);
  assert.ok(!hasSelector(css.top, /\.reset-view:active/), "no :active style");
  assert.ok(!hasSelector(css.top, /\.reset-view(:disabled|\[disabled\]|\[aria-disabled)/), "no disabled style");
});

// covers FR-009, FR-013 (visible 2px #1a73e8 focus outline drawn inside the button)
test("css: :focus-visible shows a 2px solid #1a73e8 outline inside the button edge", () => {
  const outline = focus.outline ?? "";
  const width = px((outline.match(/-?\d+(?:\.\d+)?px/) || [])[0] ?? focus["outline-width"]);
  const style = (outline.match(/\b(solid|dashed|dotted|double)\b/) || [])[0] ?? focus["outline-style"];
  const color = colorIn(outline) ?? colorIn(focus["outline-color"]);
  assert.equal(width, 2, "outline width 2px");
  assert.equal(style, "solid");
  assert.ok(color && rgb(color).join() === "26,115,232", `outline color #1a73e8 (got ${color})`);
  assert.ok(px(focus["outline-offset"]) <= -width, `outline-offset <= -${width}px so it is drawn inside the edge`);
});

// covers FR-013 (WCAG 2.1 AA non-text contrast >= 3:1)
test("css: icon contrast >= 3:1 on #fff and #f4f4f4; focus outline >= 3:1 on #fff", () => {
  assert.ok(Object.keys(btn).length > 0, "a .reset-view rule exists in styles.css");
  // A <button> uses black text (ButtonText) when no color is set.
  const icon = colorIn(btn.color) ?? "#000000";
  assert.ok(contrast(icon, "#ffffff") >= 3, `icon on white: ${contrast(icon, "#ffffff").toFixed(2)}:1`);
  assert.ok(contrast(icon, "#f4f4f4") >= 3, `icon on hover: ${contrast(icon, "#f4f4f4").toFixed(2)}:1`);
  assert.ok(contrast("#1a73e8", "#ffffff") >= 3);
});

// covers FR-016 (forced-colors: ButtonFace / ButtonText / Highlight)
test("css: forced-colors mode uses ButtonFace, ButtonText and Highlight", () => {
  const block = css.media.find((m) => /forced-colors\s*:\s*active/.test(m.query));
  assert.ok(block, "an @media (forced-colors: active) block exists");
  const b = declsFor(block.rules, ".reset-view");
  const f = declsFor(block.rules, ".reset-view:focus-visible");
  assert.match(b.background ?? b["background-color"] ?? "", /buttonface/i);
  assert.match(b.color ?? "", /buttontext/i);
  assert.match(f["outline-color"] ?? f.outline ?? "", /highlight/i);
});

// covers FR-012, FR-008, FR-017 (panel capped so the bottom 96px of the map stay free; scrolls inside)
test("css: #panel is capped to leave a free bottom strip of at least 96px and scrolls inside", () => {
  const panel = declsFor(css.top, "#panel");
  const m = String(panel["max-height"] ?? "").match(/^calc\(\s*100%\s*-\s*(\d+(?:\.\d+)?)px\s*\)$/);
  assert.ok(m, `#panel max-height is calc(100% - Npx) (got ${panel["max-height"]})`);
  const top = px(panel.top);
  assert.equal(top, 12, "the cap assumes the panel's 12px top offset (spec Assumptions)");
  const borderBox = /border-box/.test(panel["box-sizing"] ?? "");
  const pad = px(panel.padding) || 0;
  const free = Number(m[1]) - top - (borderBox ? 0 : 2 * pad);
  assert.ok(free >= 96, `free strip ${free}px >= 96px`);
  assert.match(panel["overflow-y"] ?? panel.overflow ?? "", /auto|scroll/, "the panel scrolls inside");
});
