import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { signArgs, signName, signTiming } from "../scripts/sign.mjs";

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

// A clip at 90 bpm and 30 fps: a beat is 20 frames.
const clip = (over = {}) => signTiming({ counts: [3, 2], order: {}, bpm: 90, labels: 2, drop: 8.05, ...over });

test("a clip traces each character's strokes in order, a pause between characters", () => {
  const t = clip();
  assert.deepEqual(
    t.strokes.map(([c, s]) => [c, s]),
    [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1]],
  );
  // From half a beat, 0.9 of a beat apart, and 0.6 of a beat more between characters.
  assert.deepEqual(t.strokes.map(([, , f]) => f), [10, 28, 46, 76, 94]);
  assert.equal(t.draw, 16);
});

test("a character can set its own drawing order, which must name every stroke once", () => {
  const t = clip({ counts: [4], order: { 0: [2, 3, 0, 1] } });
  assert.deepEqual(t.strokes.map(([, s]) => s), [2, 3, 0, 1]);
  assert.throws(() => clip({ counts: [4], order: { 0: [2, 3, 0] } }), /every stroke/);
  assert.throws(() => clip({ counts: [4], order: { 0: [2, 3, 0, 0] } }), /every stroke/);
});

test("the flare lands on a whole beat after the last stroke, then the labels, then a hold", () => {
  const t = clip();
  // The last stroke ends at 110; 0.4 of a beat later is 118, so the next beat is 120.
  assert.equal(t.flare, 120);
  assert.deepEqual(t.labels, [[130, 30], [150, 30]]);
  assert.equal(t.frames, 180 + 3 * 30);
});

test("the music starts so the flare lands on its drop, or on a phrase after it", () => {
  // The flare is at 4 s; the drop is at 8.05 s.
  assert.equal(clip().musicStart.toFixed(3), "4.050");
  // A flare after the drop waits for the drop 16 beats (10.667 s) on.
  const late = clip({ counts: [20], labels: 1 });
  assert.ok(late.flare / 30 > 8.05);
  const start = late.musicStart;
  assert.ok(start >= 0);
  assert.equal((start + late.flare / 30).toFixed(3), (8.05 + 16 * (60 / 90)).toFixed(3));
});

test("a clip passes its timing to Blender and is named .mp4", () => {
  const timing = clip();
  const args = signArgs(spec, "/r", "goudy", "/o", { timing });
  assert.deepEqual(JSON.parse(at(args, "--timing")), timing);
  assert.equal(signName(spec, "goudy", { clip: true }), "wuyue-goudy.mp4");
  assert.ok(!signArgs(spec, "/r", "goudy", "/o").includes("--timing"));
});
