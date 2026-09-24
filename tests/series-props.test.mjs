import assert from "node:assert/strict";
import test from "node:test";
import { seriesProps } from "../src/series/props.ts";

const line = (text) => ({ text, source: "written" });
const row = {
  number: 29, zh: "坎", pinyin: "Kǎn", name: "The Abyss", lines: [0, 1, 0, 0, 1, 0], upper: "kan",
  commentary: "Danger doubled.",
  music: { trigram: "kan", file: "pick09-synthwave.mp3", bpm: 100, start: 91.223, firstBeat: 0, drop: 14.4 },
  copy: { hook: line("One problem after another?"), meaning: [line("a b c"), line("d e f")], question: line("Next?"), plates: ["29-31", "29-60"] },
  source: { sixlinesContent: "abc" },
};

test("a row becomes the template's props", () => {
  const p = seriesProps(row);
  assert.equal(p.music, "local/music/pick09-synthwave.mp3");
  assert.equal(p.musicStart, 91.223);
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-100bpm-8b.mp4");
  assert.deepEqual(p.plates, ["assets/yilin/stipple-29-31.webp", "assets/yilin/stipple-29-60.webp"]);
  assert.deepEqual(p.screens.map((s) => s.src), [
    "assets/screens/29/reading.png", "assets/screens/29/verse.png", "assets/matrix-records.png", "assets/matrix-ask.png",
  ]);
  assert.equal(p.url, "sixlines.day");
});

test("the third screen rotates so neighbouring shorts differ", () => {
  const third = (n) => seriesProps({ ...row, number: n }).screens[2].src;
  assert.deepEqual([third(27), third(28), third(29)], ["assets/matrix-today.png", "assets/matrix-journal.png", "assets/matrix-records.png"]);
  for (const n of [27, 28, 29]) assert.equal(seriesProps({ ...row, number: n }).screens[3].src, "assets/matrix-ask.png");
});

test("an override that changes the tempo changes the clip too", () => {
  const p = seriesProps(row, { bpm: 82.5, drop: 14.54 });
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-82.5bpm-6b.mp4");
});

test("a row without copy cannot become a short", () => {
  assert.throws(() => seriesProps({ ...row, copy: null }), /hexagram 29 has no copy/);
});
