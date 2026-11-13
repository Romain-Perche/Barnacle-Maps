import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (f) => readFileSync(new URL(f, root), "utf8");

// covers FR-001, FR-010, FR-012, contracts/ui.md (mode selector)
test("travel mode radiogroup offers Walk · Car · Bike, Walk checked", () => {
  const html = read("index.html");
  const group = html.match(/<div id="mode" role="radiogroup" aria-label="Travel mode">([\s\S]*?)<\/div>/);
  assert.ok(group, "Travel mode radiogroup is missing");
  const radios = [...group[1].matchAll(/<label><input type="radio" name="mode" value="(\w+)"( checked)?> (\w+)<\/label>/g)];
  assert.deepEqual(
    radios.map((r) => [r[1], r[3], Boolean(r[2])]),
    [
      ["foot", "Walk", true],
      ["car", "Car", false],
      ["bike", "Bike", false],
    ],
  );
});

// covers FR-011
test("README documents the bike mode", () => {
  const readme = read("README.md");
  const line = readme.split("\n").find((l) => l.includes("routing.openstreetmap.de/routed-bike"));
  assert.ok(line, "README does not name the bike routing source");
  assert.match(line, /bicycle/i);
  assert.match(line, /up to 3 alternatives/i);
  assert.match(line, /no detour/i);
  assert.match(line, /pleasure/i);
});
