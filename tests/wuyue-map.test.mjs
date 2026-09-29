import assert from "node:assert/strict";
import test from "node:test";
import { BORDER, HANGZHOU, PLACES, clip, project, simplify } from "../scripts/wuyue-map.mjs";

test("Hangzhou is the origin; one degree of latitude is SCALE metres", () => {
  assert.deepEqual(project(HANGZHOU, 6), [0, 0]);
  assert.equal(project([HANGZHOU[0], HANGZHOU[1] + 1], 6)[1], 6);
  // A degree of longitude is shorter, by the cosine of the map's middle latitude.
  const [x] = project([HANGZHOU[0] + 1, HANGZHOU[1]], 6);
  assert.ok(x > 4.5 && x < 5.5, String(x));
});

test("the places sit where they are: Kaesong north-east, Dazaifu east and south of it, Kaifeng north-west", () => {
  const [k, d, n] = ["korea", "japan", "north"].map((p) => project(PLACES[p].at, 6));
  assert.ok(k[0] > 0 && k[1] > 0);
  assert.ok(d[0] > k[0] && d[1] < k[1] && d[1] > 0);
  assert.ok(n[0] < 0 && n[1] > 0);
});

test("the sign stands in the kingdom's middle, inside its border and south-west of Hangzhou", () => {
  const [x, y] = project(PLACES.wuyue.at, 6);
  assert.ok(x < 0 && y < 0);
  const border = BORDER.map((p) => project(p, 6));
  assert.ok(Math.min(...border.map((p) => p[0])) < x && Math.min(...border.map((p) => p[1])) < y && Math.max(...border.map((p) => p[1])) > y);
});

test("clipping splits a line where it leaves the box and drops what is outside", () => {
  const box = [0, 0, 10, 10];
  const parts = clip([[1, 1], [5, 5], [20, 5], [5, 6], [6, 7]], box);
  assert.deepEqual(parts, [[[1, 1], [5, 5]], [[5, 6], [6, 7]]]);
  assert.deepEqual(clip([[20, 20], [30, 30]], box), []);
});

test("simplifying keeps the ends and the corners, drops points on a straight run", () => {
  const line = [[0, 0], [1, 0.001], [2, 0], [2, 2]];
  assert.deepEqual(simplify(line, 0.01), [[0, 0], [2, 0], [2, 2]]);
});

test("simplifying an island, a ring that ends where it starts, keeps its shape", () => {
  const ring = [[0, 0], [1, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
  assert.deepEqual(simplify(ring, 0.01), [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]);
});
