import assert from "node:assert/strict";
import test from "node:test";
import { cubics, fitTo, toHanziPath } from "../scripts/ancient-forms.mjs";

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);
const nearPt = (p, q, eps) => (near(p[0], q[0], eps), near(p[1], q[1], eps));

test("lines, h and v become cubic segments, one list per subpath", () => {
  const [sub] = cubics("M0 0 L10 0 V10 H0 Z");
  assert.equal(sub.length, 3);
  assert.deepEqual(sub[0][0], [0, 0]);
  assert.deepEqual(sub[2][3], [0, 10]);
});

test("a relative m after z starts from the closed subpath's start", () => {
  const subs = cubics("m10 10 l5 0 h5 v5 z m1 1 l1 1");
  assert.equal(subs.length, 2);
  assert.deepEqual(subs[1][0][0], [11, 11]);
  assert.deepEqual(subs[1][0][3], [12, 12]);
});

test("an arc becomes quarter cubics on its circle", () => {
  // From (0,0) to (20,0), radius 10, sweep 1: through (10,-10) in SVG's y-down space.
  const [sub] = cubics("M0 0 A10 10 0 0 1 20 0");
  assert.equal(sub.length, 2);
  nearPt(sub[0][3], [10, -10], 1e-9);
  nearPt(sub[1][3], [20, 0], 1e-9);
});

test("arc flags may be run together with the next number", () => {
  assert.deepEqual(cubics("M0 0a10 10 0 0120 0"), cubics("M0 0 A10 10 0 0 1 20 0"));
});

test("s reflects the last control point", () => {
  const [sub] = cubics("M0 0 C0 10 10 10 10 0 S20 -10 20 0");
  assert.deepEqual(sub[1][1], [10, -10]);
});

test("a form is fitted into a box, centred, y flipped to hanzi's y-up", () => {
  const subs = fitTo(cubics("M0 0 L100 0 L100 50 L0 50 Z"), { x0: 0, y0: 0, x1: 200, y1: 200 });
  const pts = subs.flat().flatMap((s) => [s[0], s[3]]);
  const ys = pts.map((p) => p[1]);
  const xs = pts.map((p) => p[0]);
  near(Math.min(...xs), 0);
  near(Math.max(...xs), 200);
  near(Math.min(...ys), 50);
  near(Math.max(...ys), 150);
  // SVG's top edge (y 0) lands on top (the larger hanzi y).
  nearPt(subs[0][0][0], [0, 150], 1e-9);
});

test("the hanzi path is absolute M and C with Z, as blender/character.py reads it", () => {
  const d = toHanziPath([[[[0, 0], [1, 1], [2, 2], [3, 3]]]]);
  assert.equal(d, "M 0 0 C 1 1 2 2 3 3 Z");
});
