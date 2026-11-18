// Runs the SF-73 AI scenarios (tests/ai/us*.md) and prints JSON results per scenario.
// Usage (repo root, after .factory/run/setup.sh):
//   NODE_PATH=/opt/playwright/node_modules node .factory/run/scenarios.mjs [name-filter]
import { openApp } from "../../tests/ai/harness.mjs";
const OUT = new URL("./out/", import.meta.url).pathname;
const filter = process.argv[2] ?? "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BIKE = "#mode label:nth-child(3)", CAR = "#mode label:nth-child(2)", WALK = "#mode label:nth-child(1)";
async function search(page, q) {
  await page.fill("#search-input", q);
  await page.click("#search-form button[type=submit]");
  await page.waitForSelector("#results button", { timeout: 10000 });
  await page.click("#results li button >> nth=0");
}
async function ready(page, contains) {
  await page.waitForFunction((c) => {
    const s = document.querySelector("#status").textContent;
    return document.querySelectorAll("#routes button").length > 0 && !s.startsWith("Computing") && (!c || s.includes(c));
  }, contains, { timeout: 15000 });
}
const lines = (page) => page.$$eval("#map path.leaflet-interactive", (ps) => ps.filter((p) => ["#888", "#1a73e8"].includes(p.getAttribute("stroke"))).length);
const nBtn = (page) => page.$$eval("#routes button", (b) => b.length);
const status = (page) => page.textContent("#status");
const routing = (log) => log.filter((u) => u.startsWith("https://routing.openstreetmap.de/"));
const results = [];
const reqMap = new WeakMap();
const app_requests = (page) => reqMap.get(page) ?? [];
async function run(name, opts, fn) {
  if (!name.includes(filter)) return;
  const app = await openApp(opts);
  // tests/ai/harness.mjs does not log tile URLs: record every request the page makes.
  const rq = []; reqMap.set(app.page, rq); app.page.on("request", (q) => rq.push(q.url()));
  const r = { name, checks: {} };
  try { await fn(app, r.checks); } catch (e) { r.error = String(e); }
  await app.close();
  r.passed = !r.error && Object.values(r.checks).every((c) => c === true || c?.ok === true);
  results.push(r); console.error(JSON.stringify(r));
}
const ok = (cond, info) => ({ ok: !!cond, info });

await run("us1-s1", {}, async ({ page }, c) => {
  await page.waitForSelector("#mode", { state: "visible" });
  const seg = () => page.$$eval("#mode label", (ls) => ls.map((l) => { const s = l.querySelector(":scope > span"); const b = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { text: s.textContent.trim(), top: Math.round(b.top), w: b.width, bg: cs.backgroundColor, os: cs.outlineStyle, ow: cs.outlineWidth }; }));
  const s1 = await seg();
  await page.locator("#panel").screenshot({ path: OUT + "us1-s1-selector.png" });
  let focused = false;
  for (let i = 0; i < 15 && !focused; i++) { await page.keyboard.press("Tab"); focused = await page.evaluate(() => document.activeElement?.matches("#mode input[value=foot]")); }
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await page.locator("#panel").screenshot({ path: OUT + "us1-s1-focus.png" });
  const checked = await page.$eval("#mode input:checked", (i) => i.value);
  const s6 = await seg();
  const HL = "rgb(232, 240, 254)", T = "rgba(0, 0, 0, 0)";
  c.three = ok(s1.length === 3 && s1.map((s) => s.text).join("|") === "🚶 Walk|🚗 Car|🚲 Bike", s1.map((s) => s.text));
  c.row = ok(new Set(s1.map((s) => s.top)).size === 1 && Math.max(...s1.map((s) => s.w)) - Math.min(...s1.map((s) => s.w)) <= 4, s1.map((s) => [s.top, s.w]));
  c.step1bg = ok(s1[0].bg === HL && s1[1].bg === T && s1[2].bg === T, s1.map((s) => s.bg));
  c.focusReached = ok(focused);
  c.step6 = ok(checked === "bike" && s6[2].bg === HL && s6[0].bg === T && s6[1].bg === T, [checked, s6.map((s) => s.bg)]);
  c.outline = ok(s6[2].os === "solid" && s6[2].ow === "2px", [s6[2].os, s6[2].ow]);
});

await run("us1-s2", {}, async ({ page, log }, c) => {
  await page.click(BIKE); await search(page, "Jardin des Plantes"); await ready(page);
  const nl = await lines(page), nb = await nBtn(page);
  const texts = await page.$$eval("#routes button", (b) => b.map((x) => x.querySelector("span")?.textContent ?? x.textContent));
  await page.click("#routes button >> nth=1");
  const after5 = await page.evaluate(() => ({ pressed: [...document.querySelectorAll("#routes button")].map((b) => b.getAttribute("aria-pressed")), strokes: [...document.querySelectorAll("#map path.leaflet-interactive")].map((p) => p.getAttribute("stroke")) }));
  await sleep(1000);
  const pt = await page.evaluate(() => {
    const ps = [...document.querySelectorAll("#map path.leaflet-interactive")];
    for (const [i, p] of ps.entries()) { if (p.getAttribute("stroke") !== "#888") continue; const q = p.getPointAtLength(p.getTotalLength() / 2).matrixTransform(p.getScreenCTM()); if (document.elementFromPoint(q.x, q.y) === p) { p.dataset.clicked = "1"; return { x: q.x, y: q.y, i }; } }
    return null;
  });
  if (pt) await page.mouse.click(pt.x, pt.y);
  await sleep(300);
  const after6 = await page.evaluate(() => ({ stroke: document.querySelector("path[data-clicked]")?.getAttribute("stroke"), pressed: [...document.querySelectorAll("#routes button")].map((b) => b.getAttribute("aria-pressed")), popup: !!document.querySelector(".leaflet-popup .add-stop-here") }));
  await page.screenshot({ path: OUT + "us1-s2-routes.png" });
  const r = routing(log);
  c.urls = ok(r.length === 1 && r[0].startsWith("https://routing.openstreetmap.de/routed-bike/route/v1/bike/") && !log.some((u) => /routed-(foot|car)/.test(u)), r);
  c.three = ok(nl === 3 && nb === 3 && texts.every((t, i) => new RegExp(`^Route ${i + 1} · \\S+ \\S+ · .+$`).test(t)), [nl, nb, texts]);
  // second line: lines are ordered as routes in DOM? check that exactly one blue stroke and pressed index 1
  c.step5 = ok(after5.pressed[1] === "true" && after5.pressed.filter((p) => p === "true").length === 1 && after5.strokes.filter((s) => s === "#1a73e8").length === 1, after5);
  const idx = after6.pressed.indexOf("true");
  c.step6 = ok(pt && after6.stroke === "#1a73e8" && after6.pressed.filter((p) => p === "true").length === 1 && idx !== 1 && !after6.popup, { pt, after6 });
});

await run("us1-s3", { osrmDelayMs: 1500 }, async ({ page }, c) => {
  await page.click(BIKE); await search(page, "Jardin des Plantes");
  await sleep(300); const s3 = await status(page);
  await ready(page); const s4 = await status(page);
  c.computing = ok(s3 === "Computing cycling routes…", s3);
  c.summary = ok(/^3 cycling routes · fastest \S+ \S+ · .+$/.test(s4), s4);
});

await run("us1-s4", { routes: 1 }, async ({ page, log }, c) => {
  await page.click(BIKE); await search(page, "Jardin des Plantes"); await ready(page); await sleep(500);
  const s = await status(page);
  c.status = ok(/^\S+ \S+ · .+ by bike$/.test(s), s);
  c.one = ok((await nBtn(page)) === 1 && routing(log).length === 1, routing(log));
});

await run("us1-s5", { noRoute: true }, async ({ page }, c) => {
  await page.click(BIKE); await search(page, "Jardin des Plantes"); await sleep(2000);
  const s = await status(page);
  c.status = ok(s === "No cycling route found.", s);
  c.empty = ok((await nBtn(page)) === 0 && (await lines(page)) === 0);
});

await run("us1-s6", {}, async ({ page, log }, c) => {
  await page.click(BIKE); await search(page, "Jardin des Plantes");
  await page.waitForSelector("#routes .pleasure.best", { timeout: 25000 });
  const p = await page.$$eval("#routes .pleasure", (es) => es.map((e) => ({ t: e.textContent, title: e.title, best: e.classList.contains("best"), color: getComputedStyle(e).color, fw: getComputedStyle(e).fontWeight })));
  await page.locator("#panel").screenshot({ path: OUT + "us1-s6-pleasure.png" });
  const best = p.filter((e) => e.t.includes("· most pleasant"));
  c.texts = ok(p.length > 0 && p.every((e) => /^Pleasure: \d+ green px/.test(e.t)) && best.length === 1 && Number(best[0].fw) >= 600, p);
  c.title = ok(p[0].title === "Green pixels (parks, grass, woods) on the map along this route; more is more pleasant", p[0].title);
  c.tiles = ok(log.concat(app_requests(page)).some((u) => u.startsWith("https://tile.openstreetmap.org/16/")), "harness log has no tile URLs; checked page requests");
});

await run("us1-s7", { place: { display_name: "Versailles, France", lat: "48.8049", lon: "2.1204" } }, async ({ page, log }, c) => {
  await page.click(BIKE); await search(page, "Versailles"); await ready(page); await sleep(2000);
  const p = await page.$$eval("#routes .pleasure", (es) => es.map((e) => e.textContent));
  c.unavail = ok(p.length > 0 && p.every((t) => t === "Pleasure unavailable"), p);
  c.noTiles = ok(!log.concat(app_requests(page)).some((u) => u.startsWith("https://tile.openstreetmap.org/16/")));
});

await run("us2-s1", {}, async ({ page, log }, c) => {
  // Marker CSS transforms change with the map zoom: read the destination marker's LatLng instead.
  await page.addInitScript(() => { let v; Object.defineProperty(window, "L", { configurable: true, get: () => v, set: (x) => { v = x; x.Map.addInitHook(function () { window.__map = this; }); } }); });
  await page.reload();
  const snap = async () => ({ lines: await lines(page), btn: await nBtn(page), pl: await page.$$eval("#routes .pleasure", (e) => e.length), marker: await page.evaluate(() => { const o = []; window.__map.eachLayer((l) => { if (l instanceof L.Marker && !l.getElement()?.classList.contains("stop-marker")) o.push(l.getLatLng()); }); return JSON.stringify(o); }), input: await page.inputValue("#search-input") });
  const snaps = [];
  await search(page, "Jardin des Plantes"); await ready(page, "walking"); snaps.push(await snap());
  const nom = log.filter((u) => u.includes("nominatim")).length;
  await page.click(BIKE); await ready(page, "cycling"); snaps.push(await snap());
  await page.click(CAR); await ready(page, "driving"); snaps.push(await snap());
  await page.click(BIKE); await ready(page, "cycling"); snaps.push(await snap());
  const r = routing(log);
  const kinds = r.map((u) => u.match(/routed-(\w+)/)[1]);
  // collapse consecutive duplicates (walking may issue detour requests)
  const seq = kinds.filter((k, i) => k !== kinds[i - 1]);
  c.order = ok(seq.join(",") === "foot,bike,car,bike" && r.every((u) => u.split("?")[0].endsWith(";2.3596,48.844") || u.split("?")[0].includes("2.3596,48.844")), r);
  c.nominatim = ok(log.filter((u) => u.includes("nominatim")).length === nom, nom);
  c.linesMatch = ok(snaps.every((s) => s.lines === s.btn), snaps.map((s) => [s.lines, s.btn]));
  c.marker = ok(snaps.every((s) => JSON.stringify(s.marker) === JSON.stringify(snaps[0].marker) && s.input === "Jardin des Plantes, Paris, France"), snaps.map((s) => [s.marker, s.input]));
  c.pleasure = ok(snaps[2].pl === 0 && snaps[1].pl === snaps[1].btn && snaps[3].pl === snaps[3].btn, snaps.map((s) => s.pl));
});

await run("us2-s2", { osrmDelayMs: 800 }, async ({ page }, c) => {
  await search(page, "Jardin des Plantes"); await ready(page);
  for (const s of [BIKE, CAR, BIKE, CAR]) { await page.click(s); await sleep(50); }
  await sleep(4000);
  const checked = await page.$eval("#mode input:checked", (i) => i.value);
  const bgs = await page.$$eval("#mode label > span", (s) => s.map((x) => getComputedStyle(x).backgroundColor));
  const s = await status(page);
  c.checked = ok(checked === "car" && bgs[1] === "rgb(232, 240, 254)" && bgs[0] !== bgs[1] && bgs[2] !== bgs[1], [checked, bgs]);
  c.status = ok(s.startsWith("3 driving routes") || s.endsWith("by car"), s);
  c.noPleasure = ok((await page.$$("#routes .pleasure")).length === 0 && (await lines(page)) === (await nBtn(page)));
});

await run("us3-s1", {}, async ({ page, log }, c) => {
  await page.waitForSelector(".leaflet-interactive", { timeout: 10000 });
  await sleep(500);
  const pos = await page.evaluate(() => { const el = document.querySelector("#map path.leaflet-interactive, #map .leaflet-marker-icon"); const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
  await page.mouse.click(pos.x - 150, pos.y); await sleep(400);
  await page.locator(".add-stop-here").last().click(); await sleep(500);
  await page.mouse.click(pos.x, pos.y + 150); await sleep(400);
  await page.locator(".add-stop-here").last().click(); await sleep(500);
  await page.click(BIKE); await search(page, "Jardin des Plantes"); await ready(page);
  const u5 = routing(log).at(-1); const stops = await page.$$eval("#stops li", (l) => l.map((x) => x.textContent)); const s5 = await status(page);
  await page.click(CAR); await ready(page, "driving");
  await page.click(BIKE); await ready(page, "cycling");
  const u7 = routing(log).at(-1); const stops7 = await page.$$eval("#stops li", (l) => l.length);
  const markers = await page.$$eval(".leaflet-marker-icon", (m) => m.map((x) => x.textContent.trim()).filter(Boolean));
  await page.screenshot({ path: OUT + "us3-s1-stops.png" });
  const ll = stops.map((t) => t.match(/\(([-\d.]+),\s*([-\d.]+)\)/)).map((m) => m && [m[2], m[1]]);
  const coords = u5.split("/bike/")[1].split("?")[0].split(";");
  const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.0002;
  c.url5 = ok(u5.startsWith("https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.3522,48.8566;") && coords.length === 4 && ll.every((p, i) => p && near(coords[i + 1].split(",")[0], p[0]) && near(coords[i + 1].split(",")[1], p[1])) && coords[3] === "2.3596,48.844", { u5, stops });
  c.status = ok(s5.includes("via 2 stops") && (s5.includes("cycling") || s5.includes("by bike")), s5);
  c.markers = ok(markers.includes("1") && markers.includes("2") && stops7 === 2, { markers, stops7 });
  c.url7 = ok(u7.includes("routed-bike") && u7.split("/bike/")[1].split("?")[0].split(";").slice(1, 3).join(";") === coords.slice(1, 3).join(";"), u7);
});
console.log(JSON.stringify(results.map((r) => ({ name: r.name, passed: r.passed, error: r.error }))));
