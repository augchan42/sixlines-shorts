import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { clipFrames, endcardClip, hexagramClip } from "../src/lib/clips.ts";
import { beatFrame } from "../src/lib/timing.ts";

test("clip names carry the lines, tempo and length", () => {
  assert.equal(hexagramClip([1, 1, 1, 1, 1, 1], 110, 4), "assets/3d/hexagram-111111-110bpm-4b.mp4");
  assert.equal(hexagramClip([1, 0, 1, 0, 1, 0], 107.4, 4), "assets/3d/hexagram-101010-107.4bpm-4b.mp4");
});

test("end-card names carry the treatment as well", () => {
  assert.equal(endcardClip([0, 1, 0, 0, 1, 0], 100, 7, "snap"), "assets/3d/endcard-snap-010010-100bpm-7b.mp4");
  assert.equal(endcardClip([0, 1, 0, 0, 1, 0], 82.5, 7, "join"), "assets/3d/endcard-join-010010-82.5bpm-7b.mp4");
});

test("preview clips never share a name with full renders", () => {
  assert.equal(hexagramClip([1, 1, 1, 1, 1, 1], 110, 4, true), "assets/3d/hexagram-111111-110bpm-4b-preview.mp4");
});

test("a clip covers its section wherever the section starts", () => {
  for (const bpm of [107.4, 110, 120, 129.8]) {
    for (let i = 0; i < 100; i++) {
      const grid = { fps: 30, bpm, firstBeat: i / 100 };
      const section = beatFrame(grid, 23) - beatFrame(grid, 19);
      assert.ok(clipFrames(4, bpm) >= section, `${bpm} BPM, first beat ${grid.firstBeat}s`);
    }
  }
});

test("frame count matches blender/layout.py", () => {
  const cases = [];
  for (const bpm of [80, 107.4, 110, 129.8, 174]) for (const beats of [1, 2, 4, 8]) cases.push([beats, bpm]);
  const py = `import json, sys; sys.path.insert(0, "blender"); from layout import frame_count; print(json.dumps([frame_count(b, t) for b, t in ${JSON.stringify(cases)}]))`;
  const counts = JSON.parse(execFileSync("python3", ["-c", py], { encoding: "utf8" }));
  assert.deepEqual(counts, cases.map(([beats, bpm]) => clipFrames(beats, bpm)));
});
