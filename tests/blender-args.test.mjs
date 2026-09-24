import assert from "node:assert/strict";
import test from "node:test";
import { parseBlenderArgs } from "../scripts/blender-args.mjs";

test("reads lines bottom first, with defaults", () => {
  assert.deepEqual(parseBlenderArgs(["--lines", "101010", "--bpm", "110"]), {
    lines: [1, 0, 1, 0, 1, 0],
    bpm: 110,
    beats: 4,
    edge: "#6cff7a",
    preview: false,
  });
});

test("reads beats, edge and preview", () => {
  const a = parseBlenderArgs(["--lines", "111111", "--bpm", "107.4", "--beats", "2", "--edge", "#ffb23f", "--preview"]);
  assert.equal(a.bpm, 107.4);
  assert.equal(a.beats, 2);
  assert.equal(a.edge, "#ffb23f");
  assert.equal(a.preview, true);
});

test("rejects lines that are not six 0s and 1s", () => {
  for (const lines of ["11111", "1111111", "11a111"]) {
    assert.throws(() => parseBlenderArgs(["--lines", lines, "--bpm", "110"]), /six 0s and 1s/);
  }
  assert.throws(() => parseBlenderArgs(["--bpm", "110"]), /six 0s and 1s/);
});

test("rejects a missing or non-positive tempo or length", () => {
  assert.throws(() => parseBlenderArgs(["--lines", "111111"]), /--bpm/);
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "0"]), /--bpm/);
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "110", "--beats", "-1"]), /--beats/);
});

test("rejects an edge colour that is not #rrggbb", () => {
  assert.throws(() => parseBlenderArgs(["--lines", "111111", "--bpm", "110", "--edge", "green"]), /--edge/);
});
