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
  assert.equal(p.screens.length, 3);
  assert.deepEqual(p.endcard, { clip: "assets/3d/endcard-snap-010010-100bpm-9b.mp4", mode: "snap" });
});

test("the end card's transition follows the energy of the upper trigram's track", () => {
  const modes = Object.fromEntries(
    ["kun", "gen", "qian", "li", "zhen", "kan", "xun", "dui"].map((t) => [t, seriesProps({ ...row, upper: t }).endcard.mode]),
  );
  // Calm tracks join, steady ones flip, and the tracks that jump at the drop snap.
  assert.deepEqual(modes, { kun: "join", gen: "join", qian: "flip", li: "flip", zhen: "snap", kan: "snap", xun: "snap", dui: "snap" });
});

test("each short shows two of its hexagram's own screens, then one of the app's shared screens", () => {
  const own = ["reading", "verse", "today", "painting-scrolled", "text-scrolled"];
  for (let n = 1; n <= 64; n++) {
    const s = seriesProps({ ...row, number: n }).screens;
    assert.equal(s.length, 3);
    for (const x of s.slice(0, 2)) assert.match(x.src, new RegExp(`^assets/screens/${n}/(${own.join("|")})\\.png$`));
    assert.notEqual(s[0].src, s[1].src);
    assert.match(s[2].src, /^assets\/screens\/tour\/(ask|dates|prove|archive)\.png$/);
  }
});

test("neighbouring shorts never show the same screens, and every screen is used", () => {
  const key = (n) => seriesProps({ ...row, number: n }).screens.map((s) => s.src.replace(/\/\d+\//, "/N/")).join();
  const used = new Set();
  for (let n = 1; n <= 64; n++) {
    if (n > 1) assert.notEqual(key(n), key(n - 1));
    for (const s of seriesProps({ ...row, number: n }).screens) used.add(s.src.replace(/\/\d+\//, "/N/"));
  }
  assert.equal(used.size, 9);
});

test("an override that changes the tempo changes the clip too", () => {
  const p = seriesProps(row, { bpm: 82.5, drop: 14.54 });
  assert.equal(p.hexagramClip, "assets/3d/hexagram-010010-82.5bpm-6b.mp4");
  assert.equal(p.endcard.clip, "assets/3d/endcard-snap-010010-82.5bpm-9b.mp4");
});

test("a row without copy cannot become a short", () => {
  assert.throws(() => seriesProps({ ...row, copy: null }), /hexagram 29 has no copy/);
});
