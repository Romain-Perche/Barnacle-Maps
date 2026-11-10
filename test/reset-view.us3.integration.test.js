// Integration tests, US3 "Accessible and discoverable control": src/app.js driven through the
// fake browser and Leaflet in test/support/fake-browser.js. Real keyboard, screen reader and
// rendering checks are in tests/ai/us3-accessible-control.md.
import test from "node:test";
import assert from "node:assert/strict";
import { bootApp, pressReset, resetButton } from "./support/fake-browser.js";

const DEFAULT = { lat: 48.8566, lng: 2.3522, zoom: 13 };

// covers FR-006, US3 scenario 1 (Enter / Space activate a native <button type="button"> via `click`)
test("US3-1: the control is a native button whose click (Enter, Space, tap) resets the view", async () => {
  const ctx = await bootApp({ location: "deny" });
  const { button } = resetButton(ctx);
  assert.equal(button.localName, "button", "a native button: Enter and Space fire click with no extra code");
  assert.equal(button.getAttribute("type"), "button", "type=button: never submits a form");
  assert.equal(button.getAttribute("tabindex"), null, "focusable in the natural tab order");
  ctx.userMoves(1, 1, 4);
  pressReset(ctx);
  assert.deepEqual(ctx.view(), DEFAULT);
});

// covers FR-007, SC-004, US3 scenario 2
test("US3-2: the button's role is button and its accessible name is 'Reset view'", async () => {
  const { button } = resetButton(await bootApp());
  assert.equal(button.localName, "button");
  assert.ok([null, "button"].includes(button.getAttribute("role")));
  assert.equal(button.getAttribute("aria-label"), "Reset view");
  const svgs = [...button.descendants()].filter((e) => e.localName === "svg");
  for (const s of svgs) assert.equal(s.getAttribute("aria-hidden"), "true", "the icon adds nothing to the name");
});

// covers FR-006, FR-018, US3 scenario 3 (focus stays on the button after a reset)
test("US3-3: keyboard focus stays on the button after the reset", async () => {
  const ctx = await bootApp({ location: "deny" });
  ctx.userMoves(1, 1, 4);
  const r = pressReset(ctx);
  assert.equal(ctx.doc.activeElement, r.button, "document.activeElement is still the button");
  assert.deepEqual(r.focusCalls, [], "the handler doesn't move focus anywhere");
});

// covers FR-007, US3 scenario 4 (hover tooltip)
test("US3-4: hovering shows the tooltip 'Reset view' (title attribute)", async () => {
  const { button } = resetButton(await bootApp());
  assert.equal(button.getAttribute("title"), "Reset view");
});

// covers FR-005, FR-010 (no announcement; looks the same after a reset)
test("US3: a reset makes no announcement and doesn't change the button", async () => {
  const ctx = await bootApp({ location: "deny" });
  const { button } = resetButton(ctx);
  const attrs = [...button.attributes];
  ctx.userMoves(1, 1, 4);
  const r = pressReset(ctx);
  assert.equal(r.mutations.length, 0, "no status text or live region change, no attribute change");
  assert.deepEqual([...button.attributes], attrs);
  assert.equal(button.disabled, false);
});
