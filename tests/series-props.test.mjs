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
    "assets/screens/29/reading.png", "assets/screens/29/verse.png", "assets/screens/29/today.png", "assets/matrix-ask.png",
  ]);
  assert.deepEqual(p.endcard, { clip: "assets/3d/endcard-snap-010010-100bpm-9b.mp4", mode: "snap" });
});

test("the end card's transition follows the energy of the upper trigram's track", () => {
  const modes = Object.fromEntries(
    ["kun", "gen", "qian", "li", "zhen", "kan", "xun", "dui"].map((t) => [t, seriesProps({ ...row, upper: t }).endcard.mode]),
  );
  // Calm tracks join, steady ones flip, and the tracks that jump at the drop snap.
  assert.deepEqual(modes, { kun: "join", gen: "join", qian: "flip", li: "flip", zhen: "snap", kan: "snap", xun: "snap", dui: "snap" });
});

test("the third screen is the hexagram's own day on the Almanac, and ask closes", () => {
  for (const n of [27, 28, 29]) {
    const s = seriesProps({ ...row, number: n }).screens;
    assert.deepEqual(s[2], { src: `assets/screens/${n}/today.png`, caption: "YOUR DAY, READ" });
    assert.equal(s[3].src, "assets/matrix-ask.png");
  }
});

test("an override that changes the tempo changes the clip too", () => {
  const p = seriesProps(row, { bpm: 82.5, drop: 14.54 });
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-82.5bpm-6b.mp4");
  assert.equal(p.endcard.clip, "assets/3d/endcard-snap-010010-82.5bpm-9b.mp4");
});

test("a row without copy cannot become a short", () => {
  assert.throws(() => seriesProps({ ...row, copy: null }), /hexagram 29 has no copy/);
});
