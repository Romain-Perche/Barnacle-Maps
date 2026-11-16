// Contract tests for the phone card markup and the QR library tag (contracts/phone-link.md §3, research R2).
// They read index.html and styles.css as text: no browser needed.
// PILOT-28672: QR code of the selected route.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

function tag(re) {
  const m = html.match(re);
  assert.ok(m, `missing in index.html: ${re}`);
  return m[0];
}

// covers FR-009, FR-010: well-known library, pinned with SRI, loaded before the app like Leaflet.
test("index.html loads qrcode-generator 2.0.4 with SRI before the app", () => {
  const lib = tag(/<script[^>]*qrcode-generator@2\.0\.4\/dist\/qrcode\.js[^>]*><\/script>/);
  assert.match(lib, /src="https:\/\/unpkg\.com\/qrcode-generator@2\.0\.4\/dist\/qrcode\.js"/);
  assert.match(lib, /integrity="sha384-e9EFD6BGC90bkW9aDV5xbbBfzwN7G8YImHao2lfLVKV\/hPB0E0go\+H3I64h7oHtA"/);
  assert.match(lib, /crossorigin="anonymous"/);
  const at = html.indexOf(lib);
  assert.ok(at > html.indexOf("leaflet.js"), "after Leaflet");
  assert.ok(at < html.indexOf('src="src/app.js"'), "before src/app.js");
});

// covers FR-001 (Design A: card directly under the route summary), FR-005 (hidden until routes are shown).
test("the phone card follows #status and starts hidden", () => {
  const card = tag(/<div id="phone"[^>]*>/);
  assert.match(card, /\shidden[\s>]/);
  const status = html.indexOf('id="status"');
  assert.ok(status >= 0 && html.indexOf(card) > status, "#phone after #status");
  const panelEnd = html.indexOf("<script");
  assert.ok(html.indexOf(card) < panelEnd, "#phone inside the panel, before the scripts");
});

// covers FR-001, FR-006, FR-007, US1 scenario 1: 245 x 245 QR image with a text alternative (fix round 1).
test("the QR image is 245 x 245 with an accessible alt text", () => {
  const img = tag(/<img[^>]*id="phone-qr"[^>]*>/);
  assert.match(img, /width="245"/);
  assert.match(img, /height="245"/);
  assert.match(img, /alt="QR code to open this route on your phone"/);
});

// covers FR-006, SC-003 (fix round 1): the review measured the code itself at about 96 px.
// Every phone link is 108-121 bytes, so qrcode-generator (level L) always picks version 6: 41 modules,
// plus the 4-module quiet zone on each side = 49 modules in the SVG. The code without the quiet zone
// must be at least 200 CSS px, and each module a whole number of CSS px.
test("the QR code itself is at least 200 CSS px wide", () => {
  const img = tag(/<img[^>]*id="phone-qr"[^>]*>/);
  const width = Number(img.match(/width="(\d+)"/)?.[1]);
  const modules = 41, quiet = 2 * 4;
  const code = (width * modules) / (modules + quiet);
  assert.ok(code >= 200, `code is ${code.toFixed(1)} CSS px, needs >= 200`);
  assert.ok(Number.isInteger(width / (modules + quiet)), "whole CSS px per module");
});

// covers FR-001, FR-007 (fix round 1): the full link is shown as text under the QR code.
test("the full link shows as selectable text under the QR code", () => {
  const url = tag(/<code id="phone-url"><\/code>/);
  const card = html.slice(html.indexOf('<div id="phone"'), html.indexOf("<script"));
  assert.ok(card.includes(url), "#phone-url inside #phone");
  assert.ok(card.indexOf(url) > card.indexOf('id="phone-qr"'), "#phone-url after the QR image");
  assert.ok(card.indexOf(url) < card.indexOf('id="phone-link"'), "#phone-url before the link");
  const rule = css.match(/#phone-url\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(rule, /word-break:\s*break-all/);
  assert.match(rule, /user-select:\s*all/);
});

// covers FR-007 (fix round 1): app.js writes the same link as text, never as HTML.
test("app.js writes the link text from the same url as the link", () => {
  assert.match(app, /getElementById\("phone-url"\)/);
  assert.match(app, /phoneUrl\.textContent\s*=\s*url/);
  assert.match(app, /phoneLink\.href\s*=\s*url/);
  assert.ok(!/phoneUrl\.innerHTML/.test(app), "no innerHTML");
});

// covers FR-001, FR-007: title, help line and a clickable link that opens in a new tab.
test("the card shows the title, the help line and the phone link", () => {
  assert.match(html, /<strong>Continue on your phone<\/strong>/);
  assert.match(html, /Scan with your phone camera\./);
  const a = tag(/<a[^>]*id="phone-link"[^>]*>[^<]*<\/a>/);
  assert.match(a, /target="_blank"/);
  assert.match(a, /rel="noopener"/);
  assert.match(a, />Open on your phone ↗<\/a>/);
});

// covers FR-008, edge case "journey with stops": a hidden note says stops are not included.
test("the card has a hidden stops note", () => {
  const note = tag(/<span[^>]*id="phone-stops"[^>]*>[^<]*<\/span>/);
  assert.match(note, /\shidden[\s>]/);
  assert.match(note, />Stops are not included in the phone link\.<\/span>/);
});

// covers FR-001 (thin line under the summary, items stacked in a column), FR-005 (hidden really hides).
test("styles.css lays out the card as Design A", () => {
  const rule = css.match(/#phone\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(rule, /display:\s*flex/);
  assert.match(rule, /flex-direction:\s*column/); // fix round 1: a 245 px code does not fit beside the text
  assert.match(rule, /border-top:\s*1px solid/);
  assert.match(css, /#phone\[hidden\][^{]*\{[^}]*display:\s*none/);
});

// covers edge case "small screens": the panel scrolls instead of pushing the routes off screen.
test("the panel scrolls on small screens", () => {
  const panel = css.match(/#panel\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(panel, /max-height:\s*calc\(100% - 24px\)/);
  assert.match(panel, /overflow-y:\s*auto/);
});
