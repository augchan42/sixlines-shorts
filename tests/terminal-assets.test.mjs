// tests/terminal-assets.test.mjs
// The plain web terminal's generated assets (scripts/terminal-assets.mjs): the data, both
// fonts and every sound in both formats are written, the data matches the Godot build's, and
// no banned word appears in it. The page itself (and its own build/output tests) now live in
// sixlines-site; see docs/superpowers/specs/2026-09-29-plain-web-terminal.md.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { DEFAULT_OUT, SOUNDS, buildAssets } from "../scripts/terminal-assets.mjs";

const built = await buildAssets(path.join(mkdtempSync(path.join(tmpdir(), "terminal-assets-")), "assets"));
const rel = built.files.map((f) => path.relative(built.out, f));
const BANNED = /oracle|divination|fortune|prediction|mystical|magical|預測|预测|占卜|算命|神諭/i;

test("the data, both fonts and every sound in both formats", () => {
  for (const f of ["data/hexagrams.json", "fonts/PixelOperator-Bold.woff2", "fonts/NotoSansTC-subset.woff2"]) assert.ok(rel.includes(f), f);
  for (const s of SOUNDS) for (const ext of ["ogg", "m4a"]) assert.ok(rel.includes(`sfx/${s}.${ext}`), `${s}.${ext}`);
});

test("the data is the Godot build's, as is", () => {
  assert.equal(readFileSync(path.join(built.out, "data/hexagrams.json"), "utf8"), readFileSync(new URL("../godot/wangbi-terminal/data/hexagrams.json", import.meta.url), "utf8"));
});

test("no banned words in the data", () => {
  assert.doesNotMatch(readFileSync(path.join(built.out, "data/hexagrams.json"), "utf8"), BANNED);
});

test("a default output directory, and an npm script that uses it", () => {
  assert.match(DEFAULT_OUT, /sixlines-site\/terminal\/assets$/);
  assert.equal(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts["terminal:assets"], "node scripts/terminal-assets.mjs");
});
