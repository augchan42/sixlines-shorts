// tests/terminal-plain-build.test.mjs
// The plain web terminal's build (scripts/terminal-plain.mjs): every file the page loads is there,
// no banned word in any text file, and the whole of it stays under 0.6 MB.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SOUNDS, buildPlain } from "../scripts/terminal-plain.mjs";

const built = await buildPlain(path.join(mkdtempSync(path.join(tmpdir(), "terminal-plain-")), "build"));
const rel = built.files.map((f) => path.relative(built.out, f));
const BANNED = /oracle|divination|fortune|prediction|mystical|magical|預測|预测|占卜|算命|神諭/i;

test("the page, its module, the data, both fonts and every sound in both formats", () => {
  for (const f of ["index.html", "main.js", "data/hexagrams.json", "fonts/PixelOperator-Bold.woff2", "fonts/NotoSansTC-subset.woff2"]) assert.ok(rel.includes(f), f);
  for (const s of SOUNDS) for (const ext of ["ogg", "m4a"]) assert.ok(rel.includes(`sfx/${s}.${ext}`), `${s}.${ext}`);
});

test("the page loads what the build wrote", () => {
  const html = readFileSync(path.join(built.out, "index.html"), "utf8");
  const js = readFileSync(path.join(built.out, "main.js"), "utf8");
  assert.match(html, /<script type="module" src="main.js">/);
  for (const f of ["fonts/PixelOperator-Bold.woff2", "fonts/NotoSansTC-subset.woff2", "data/hexagrams.json"]) assert.ok(js.includes(f), f);
  assert.match(js, /sfx\//);
  assert.match(html, /touch-action: none/);
});

test("the data is the Godot build's, as is", () => {
  assert.equal(readFileSync(path.join(built.out, "data/hexagrams.json"), "utf8"), readFileSync(new URL("../godot/wangbi-terminal/data/hexagrams.json", import.meta.url), "utf8"));
});

test("no banned words in any text file", () => {
  for (const f of built.files.filter((f) => /\.(html|js|json|css|txt)$/.test(f))) assert.doesNotMatch(readFileSync(f, "utf8"), BANNED, f);
});

test("the whole build is under 0.6 MB", () => {
  assert.ok(built.raw < 600_000, `${built.raw} bytes`);
  assert.ok(built.gzip <= built.raw);
});

test("the build folder is ignored and has its npm script", () => {
  assert.match(readFileSync(new URL("../.gitignore", import.meta.url), "utf8"), /^web\/terminal\/build\/$/m);
  assert.equal(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts["terminal:plain"], "node scripts/terminal-plain.mjs");
});
