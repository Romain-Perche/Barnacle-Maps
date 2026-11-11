// covers FR-001..FR-006, SC-001, US1 scenarios 1-2
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const current = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const base = execFileSync("git", ["show", "main:README.md"], { encoding: "utf8" });
const added = current.startsWith(base) ? current.slice(base.length) : null;
const addedLines = added === null ? [] : added.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === ""));

test("README only gains lines at the end, none modified or removed (FR-004, FR-006, US1 scenario 1)", () => {
  assert.notEqual(added, null, "README must start with the main-branch content");
});

test("README gains exactly one newline-terminated line (FR-001, SC-001)", () => {
  assert.equal(addedLines.length, 1);
  assert.ok(current.endsWith("\n"));
});

test("added line is a hidden HTML comment (FR-002, US1 scenario 2)", () => {
  assert.match(addedLines[0] ?? "", /^<!--.*-->$/);
});

test("comment says 'push manager check' and is under 100 chars (FR-003)", () => {
  const line = addedLines[0] ?? "";
  assert.ok(line.toLowerCase().includes("push manager check"));
  assert.ok(line.length > 0 && line.length < 100);
});

test("comment appears exactly once (FR-006)", () => {
  assert.equal(current.split("push manager check").length - 1, 1);
});
