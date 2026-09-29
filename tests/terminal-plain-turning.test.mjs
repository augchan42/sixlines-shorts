// tests/terminal-plain-turning.test.mjs
// Turning the plain terminal's plot by drag and by held keys (web/terminal/turning.js).
import assert from "node:assert/strict";
import test from "node:test";
import { KEY_RATE, TILT_MAX, TURN_KEYS, TURN_MAX, dragAngles, heldDirection, turnByKeys } from "../web/terminal/turning.js";

const DEG = Math.PI / 180;
const near = (a, b) => Math.abs(a - b) < 1e-9;
const at = { turn: 0, tilt: 0, base: 0 };

test("WASD and the arrows are the turn keys; M, G and digits are not", () => {
  for (const k of ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"]) assert.ok(TURN_KEYS[k], k);
  for (const k of ["KeyM", "KeyG", "Digit1", "Enter"]) assert.equal(TURN_KEYS[k], undefined, k);
});

test("D turns about 60 degrees a second, A the other way, the arrows the same", () => {
  assert.equal(KEY_RATE, 60 * DEG);
  assert.ok(near(turnByKeys(new Set(["KeyD"]), 0.5, at).turn, 30 * DEG));
  assert.ok(near(turnByKeys(new Set(["ArrowLeft"]), 0.5, at).turn, -30 * DEG));
  assert.equal(turnByKeys(new Set(["KeyD"]), 0.5, at).tilt, 0);
});

test("S tilts down and W up, as a drag down and up does", () => {
  assert.ok(turnByKeys(new Set(["KeyS"]), 0.1, at).tilt > 0 && dragAngles(0, 30, 0, 0).tilt > 0);
  assert.ok(turnByKeys(new Set(["ArrowUp"]), 0.1, at).tilt < 0);
});

test("opposite keys cancel; other keys do nothing", () => {
  assert.deepEqual(heldDirection(new Set(["KeyA", "KeyD", "KeyW", "ArrowDown"])), [0, 0]);
  assert.deepEqual(turnByKeys(new Set(["KeyM", "Digit3"]), 1, at), { turn: 0, tilt: 0 });
});

test("held keys keep the drag's clamps: 80 degrees from where they started, 25 of tilt", () => {
  const far = turnByKeys(new Set(["KeyD", "KeyS"]), 10, { turn: 2 * Math.PI, tilt: 0, base: 2 * Math.PI });
  assert.ok(near(far.turn, 2 * Math.PI + TURN_MAX) && near(far.tilt, TILT_MAX));
  assert.ok(near(turnByKeys(new Set(["KeyW"]), 10, at).tilt, -TILT_MAX));
});

test("a drag turns 0.4 degrees a pixel, within the same clamps", () => {
  const d = dragAngles(100, -20, 0, 0);
  assert.ok(near(d.turn, 40 * DEG) && near(d.tilt, -8 * DEG));
  assert.ok(near(dragAngles(1000, 1000, 1, 0).turn, 1 + TURN_MAX));
});
