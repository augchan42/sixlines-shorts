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
  const p = (lines, bpm, clip) => ({ hexagram: { lines }, bpm, drop: 14.4, hexagramClip: clip });
  const jobs = clipJobs(
    [p([0, 1, 0, 0, 1, 0], 100, "a.mp4"), p([0, 1, 0, 0, 1, 0], 100, "a.mp4"), p([1, 1, 1, 1, 1, 1], 100, "b.mp4")],
    (clip) => clip === "b.mp4",
  );
  assert.deepEqual(jobs, [{ clip: "a.mp4", lines: "010010", bpm: 100, beats: 8 }]);
});

test("each hexagram takes its reading and verse screens from the Matrix gallery", () => {
  assert.deepEqual(screenFiles(29, "/g"), [
    { from: "/g/matrix/reading-matrix-29-29.png", to: "public/assets/screens/29/reading.png" },
    { from: "/g/matrix/yilin-matrix-29-29.png", to: "public/assets/screens/29/verse.png" },
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
  const props = { music: "local/music/a.mp3", hexagramClip: "c.mp4", screens: [], plates: [], hexagram: { number: 29 } };
  const row = { music: { sha256: "good", certificate: { file: "a.txt", sha256: "cert" } } };
  const io = { exists: () => true, sha256: (f) => (f.endsWith("a.txt") ? "cert" : "bad") };
  assert.match(missingAssets(props, row, io).join(), /local\/music\/a.mp3 is not the analysed file/);
});

test("all mode renders the rest and lists the failures", async () => {
  const r = await renderAll([1, 2, 3], async (n) => {
    if (n === 2) throw new Error("no clip");
  });
  assert.deepEqual(r, { done: [1, 3], failures: [{ n: 2, message: "no clip" }] });
});
