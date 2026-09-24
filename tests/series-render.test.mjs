import assert from "node:assert/strict";
import test from "node:test";
import { clipJobs, parseNumbers, screenFiles } from "../scripts/series/render-lib.mjs";

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
