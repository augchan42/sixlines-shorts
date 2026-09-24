import assert from "node:assert/strict";
import test from "node:test";
import { clipJobs, missingAssets, parseNumbers, renderAll, screenFiles, shareBitrate, slug } from "../scripts/series/render-lib.mjs";

test("hexagram arguments are a number, a list, or all", () => {
  assert.deepEqual(parseNumbers("29"), [29]);
  assert.deepEqual(parseNumbers("2,52"), [2, 52]);
  assert.equal(parseNumbers("all"), "all");
  assert.throws(() => parseNumbers("65"), /1 to 64/);
});

test("clip jobs skip clips that exist and never repeat one", () => {
  const p = (lines, bpm, clip, end) => ({ hexagram: { lines }, bpm, drop: 14.4, hexagramClip: clip, endcard: { clip: end, mode: "snap" } });
  const jobs = clipJobs(
    [p([0, 1, 0, 0, 1, 0], 100, "a.mp4", "ea.mp4"), p([0, 1, 0, 0, 1, 0], 100, "a.mp4", "ea.mp4"), p([1, 1, 1, 1, 1, 1], 100, "b.mp4", "eb.mp4")],
    (clip) => clip === "b.mp4" || clip === "ea.mp4",
  );
  assert.deepEqual(jobs, [
    { kind: "hexagram", clip: "a.mp4", lines: "010010", bpm: 100, beats: 8 },
    { kind: "endcard", clip: "eb.mp4", lines: "111111", bpm: 100, beats: 9, mode: "snap" },
  ]);
});

test("each hexagram takes its reading, verse and today screens from the Matrix galleries", () => {
  assert.deepEqual(screenFiles(29, "/ios"), [
    { from: "/ios/gallery/matrix/reading-matrix-29-29.png", to: "public/assets/screens/29/reading.png" },
    { from: "/ios/gallery/matrix/yilin-matrix-29-29.png", to: "public/assets/screens/29/verse.png" },
    { from: "/ios/gallery-today/matrix/today-matrix-29.png", to: "public/assets/screens/29/today.png" },
  ]);
});

test("folder names drop the tone marks", () => {
  assert.equal(slug("Kǎn"), "kan");
  assert.equal(slug("Gèn"), "gen");
});

test("the share bitrate keeps a short under 25 MB", () => {
  for (const s of [27.5, 30, 34.2]) assert.ok(((shareBitrate(s) + 128) * 1000 * s) / 8 < 24e6, `${s} s`);
  assert.equal(shareBitrate(10), 8000);
});

test("a music file that is not the analysed one stops the render", () => {
  const props = { music: "local/music/a.mp3", hexagramClip: "c.mp4", endcard: { clip: "e.mp4", mode: "snap" }, screens: [], plates: [], hexagram: { number: 29 } };
  const row = { music: { sha256: "good", certificate: { file: "a.txt", sha256: "cert" } } };
  const io = { exists: () => true, sha256: (f) => (f.endsWith("a.txt") ? "cert" : "bad") };
  assert.match(missingAssets(props, row, io).join(), /local\/music\/a.mp3 is not the analysed file/);
});

test("a missing end card names the command that renders it", () => {
  const props = { music: "m.mp3", hexagramClip: "c.mp4", endcard: { clip: "e.mp4", mode: "snap" }, screens: [], plates: [], hexagram: { number: 29 } };
  const io = { exists: (f) => f !== "e.mp4", sha256: () => "" };
  assert.deepEqual(missingAssets(props, { music: {} }, io), ["e.mp4 is missing. Run: npm run series:clips -- 29"]);
});

test("all mode renders the rest and lists the failures", async () => {
  const r = await renderAll([1, 2, 3], async (n) => {
    if (n === 2) throw new Error("no clip");
  });
  assert.deepEqual(r, { done: [1, 3], failures: [{ n: 2, message: "no clip" }] });
});
