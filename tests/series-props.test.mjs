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

test("a lesson on the lines names the two trigrams, upper first", () => {
  const lesson = { kind: "lines", text: "Water under earth.", source: "written" };
  const p = seriesProps({ ...row, number: 7, lines: [0, 1, 0, 0, 0, 0], upper: "kun", copy: { ...row.copy, lesson } });
  assert.deepEqual(p.lesson, { kind: "lines", text: "Water under earth.", trigrams: [{ zh: "地", name: "EARTH" }, { zh: "水", name: "WATER" }] });
  assert.deepEqual(p.screens, []);
});

test("a lesson on the judgment or the painting shows the Library's own page for it", () => {
  const withLesson = (kind) => seriesProps({ ...row, copy: { ...row.copy, lesson: { kind, text: "t", source: "written" } } }).lesson;
  assert.deepEqual(withLesson("judgment").screen, { src: "assets/screens/29/text-scrolled.png", caption: "THE JUDGMENT" });
  assert.deepEqual(withLesson("painting").screen, { src: "assets/screens/29/painting-scrolled.png", caption: "THE PAINTING" });
});

test("a short without a lesson keeps its showcase", () => {
  assert.equal(seriesProps(row).lesson, undefined);
});

test("a painting lesson opens on the painting itself, credited, before the Library's page", () => {
  const lesson = { kind: "painting", text: "t", credit: "RENOIR · 1881", source: "written" };
  const p = seriesProps({ ...row, copy: { ...row.copy, lesson, pace: "held" } });
  assert.deepEqual(p.lesson.painting, { src: "assets/paintings/29.jpg", credit: "RENOIR · 1881" });
  assert.equal(p.pace, "held");
  assert.equal(seriesProps(row).pace, "even");
});

test("a painting the app does not pair with the hexagram opens by its own key, with no Library page after it", () => {
  const lesson = { kind: "painting", text: "t", credit: "YOSHITOSHI · 1885", painting: "mid-autumn-2026", source: "written" };
  const p = seriesProps({ ...row, copy: { ...row.copy, lesson } }).lesson;
  assert.deepEqual(p.painting, { src: "assets/paintings/mid-autumn-2026.jpg", credit: "YOSHITOSHI · 1885" });
  assert.equal(p.screen, undefined);
});
