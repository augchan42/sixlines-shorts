import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { signArgs, signName } from "../scripts/sign.mjs";

const spec = {
  name: "wuyue",
  chars: ["吳", "越"],
  layout: "stack",
  size: [1080, 1920],
  edge: "#ff5ec8",
  labels: [
    { text: "WUYUE", size: 1.7 },
    { text: "KINGDOM OF WUYUE · 907–978", size: 0.62 },
  ],
};
const at = (args, flag) => args[args.indexOf(flag) + 1];

test("characters in reading order from hanzi data, labels and sizes in step", () => {
  const args = signArgs(spec, "/r", "pixel", "/r/out/signs/wuyue-pixel.png");
  assert.equal(at(args, "--data"), "/r/public/local/hanzi/吳.json,/r/public/local/hanzi/越.json");
  assert.equal(at(args, "--labels"), "WUYUE|KINGDOM OF WUYUE · 907–978");
  assert.equal(at(args, "--sizes"), "1.7,0.62");
  assert.equal(at(args, "--font"), "/r/public/fonts/PixelOperator-Bold.ttf");
  assert.equal(at(args, "--edge"), "#ff5ec8");
  assert.equal(at(args, "--width"), "1080");
  assert.equal(at(args, "--height"), "1920");
  assert.equal(at(args, "--layout"), "stack");
  assert.equal(at(args, "--out"), "/r/out/signs/wuyue-pixel.png");
});

test("Goudy has no middle dot, so a bullet operator stands in", () => {
  const args = signArgs(spec, "/r", "goudy", "/o");
  assert.equal(at(args, "--labels"), "WUYUE|KINGDOM OF WUYUE ∙ 907–978");
  assert.equal(at(args, "--font"), "/r/public/local/fonts/goudos.ttf");
});

test("size and layout can be set for one render, and the name says so", () => {
  const over = { layout: "row", size: [1920, 1080] };
  const args = signArgs(spec, "/r", "goudy", "/o", over);
  assert.equal(at(args, "--layout"), "row");
  assert.equal(at(args, "--width"), "1920");
  assert.equal(at(args, "--height"), "1080");
  assert.equal(signName(spec, "goudy", over), "wuyue-goudy-row-1920x1080.png");
  assert.equal(signName(spec, "pixel", { layout: "stack", size: [1080, 1920] }), "wuyue-pixel.png");
});

test("a label may not hold the separator, and the font must be known", () => {
  assert.throws(() => signArgs({ ...spec, labels: [{ text: "A|B", size: 1 }] }, "/r", "pixel", "/o"), /\|/);
  assert.throws(() => signArgs(spec, "/r", "comic", "/o"), /comic/);
});

test("every spec in series/signs builds", () => {
  const dir = new URL("../series/signs/", import.meta.url);
  for (const f of readdirSync(dir)) {
    const s = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    assert.equal(`${s.name}.json`, f);
    for (const font of s.fonts) assert.ok(signArgs(s, "/r", font, "/o").includes("--data"), `${f} ${font}`);
  }
});
