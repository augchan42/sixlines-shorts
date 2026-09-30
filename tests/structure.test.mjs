import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { corners, edges, neighbours, opposite, path, pathTimes } from "../src/lib/cube.ts";
import { value } from "../src/lib/diagram.ts";

// The structure shorts (docs/superpowers/specs/2026-09-30-structure-shorts-design.md).
const rows = JSON.parse(readFileSync(new URL("../series/hexagrams.json", import.meta.url), "utf8"));
const v = (n) => value(rows.find((r) => r.number === n).lines);

test("each hexagram has six neighbours one line away; the cube has 192 edges", () => {
  for (let x = 0; x < 64; x++) {
    const ns = neighbours(x);
    assert.equal(ns.length, 6);
    for (const y of ns) assert.equal((x ^ y).toString(2).replace(/0/g, "").length, 1);
  }
  assert.equal(edges().length, 192);
});

test("the opposite corner changes every line: Qian to Kun, six steps, one line at a time", () => {
  assert.equal(opposite(v(1)), v(2));
  const p = path(v(1), v(2));
  assert.equal(p.length, 7);
  for (let i = 1; i < p.length; i++) assert.ok(neighbours(p[i - 1]).includes(p[i]));
});

test("the Zuo zhuan's Guan zhi Pi: Guan (20) and Pi (12) are neighbours, by line 4", () => {
  assert.ok(neighbours(v(20)).includes(v(12)));
  // Line 4 counted from the bottom; the bottom line is the most significant bit.
  assert.equal(v(20) ^ v(12), 1 << (6 - 4));
});

test("King Wen's 32 pairs: 28 turned upside down, 4 with every line flipped", () => {
  const lines = (n) => rows.find((r) => r.number === n).lines;
  const flipped = [];
  let turned = 0;
  for (let a = 1; a < 64; a += 2) {
    const [x, y] = [lines(a), lines(a + 1)];
    const rev = [...x].reverse();
    if (rev.join("") !== x.join("") && rev.join("") === y.join("")) turned++;
    else if (y.every((l, i) => l === 1 - x[i])) flipped.push(a);
  }
  assert.equal(turned, 28);
  assert.deepEqual(flipped, [1, 27, 29, 61]);
});

test("the cube drawn in 3D: 64 separate points, Qian at the top, Kun straight below", () => {
  const pts = corners();
  assert.equal(pts.length, 64);
  const top = pts.reduce((a, p, i) => (p[2] > pts[a][2] ? i : a), 0);
  assert.equal(top, 63);
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(pts[0][k] + pts[63][k]) < 1e-9);
  assert.ok(Math.abs(pts[63][0]) < 1e-9 && Math.abs(pts[63][1]) < 1e-9, "Qian straight up");
  let min = Infinity;
  for (let a = 0; a < 64; a++) for (let b = a + 1; b < 64; b++) min = Math.min(min, Math.hypot(...pts[a].map((x, k) => x - pts[b][k])));
  // Along the icosahedron's six axes no two corners land together or crowd.
  assert.ok(min > 0.5, `closest two corners ${min}`);
});

test("a path clip lights one edge per step, at `at` and then every `gap` seconds", () => {
  assert.deepEqual(pathTimes({ path: [63, 31, 15], at: 2, gap: 1 }), [2, 3]);
  assert.deepEqual(pathTimes({ focus: 42 }), []);
});

const cube = JSON.parse(readFileSync(new URL("../series/explainers/structure-cube.json", import.meta.url), "utf8"));
const scenes = cube.chapters.flatMap((c) => c.pages).flatMap((p) => (p.show?.clip?.scene ? [p.show.clip.scene] : []));

test("the cube short's paths run along edges, and every edge lights inside its clip", () => {
  assert.ok(scenes.length >= 4);
  for (const s of scenes) {
    for (let i = 1; i < (s.path ?? []).length; i++) assert.ok(neighbours(s.path[i - 1]).includes(s.path[i]), `${s.path}`);
    for (const t of pathTimes(s)) assert.ok(t + 1 < s.secs, `edge at ${t} s in a ${s.secs} s clip`);
    if (s.focus !== undefined) assert.ok((s.at ?? 1) + 1 < s.secs);
  }
  // Page 3 goes from Qian to Kun as path() would, and page 4's edge is Guan to Pi.
  assert.deepEqual(scenes[2].path, path(v(1), v(2)));
  assert.deepEqual(scenes[3].path, [v(20), v(12)]);
});

test("a marked corner draws its own hexagram, and the finished path stays up at least 3 s", () => {
  const pages = cube.chapters.flatMap((c) => c.pages);
  const marked = pages.filter((p) => p.show?.mark !== undefined);
  assert.ok(marked.length >= 1);
  for (const p of marked) assert.equal(v(p.show.mark), p.show.clip.scene.focus);
  // Page 3: its last edge lights at pathTimes' end; the page holds past it (hold counts from the typed answer).
  const p3 = pages[2].show;
  assert.ok(p3.hold >= 9, `hold ${p3.hold}`);
});

const BANNED = ["oracle", "divination", "fortune", "prediction", "mystical", "magical", "預測", "预测", "占卜", "算命", "神諭"];
test("the cube short's copy has none of the banned words", () => {
  const copy = `${JSON.stringify(cube.chapters)} ${cube.caption}`.toLowerCase();
  for (const w of BANNED) assert.ok(!copy.includes(w), w);
});
