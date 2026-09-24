import assert from "node:assert/strict";
import test from "node:test";
import { clipFrames, hexagramClip } from "../src/lib/clips.ts";
import { beatFrame } from "../src/lib/timing.ts";

test("clip names carry the lines, tempo and length", () => {
  assert.equal(hexagramClip([1, 1, 1, 1, 1, 1], 110, 4), "assets/3d/hexagram-111111-110bpm-4b.mp4");
  assert.equal(hexagramClip([1, 0, 1, 0, 1, 0], 107.4, 4), "assets/3d/hexagram-101010-107.4bpm-4b.mp4");
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
  assert.equal(clipFrames(4, 110), 67);
});
