import assert from "node:assert/strict";
import test from "node:test";
import { ffmpegArgs } from "../scripts/terminal-record-args.mjs";

test("rescales full-range MJPEG to limited-range yuv420p", () => {
  const args = ffmpegArgs("out/terminal/7-army.avi", "out/terminal/7-army.mp4");
  const vfIndex = args.indexOf("-vf");
  assert.ok(vfIndex >= 0, "-vf is present");
  assert.equal(args[vfIndex + 1], "scale=in_range=full:out_range=tv,format=yuv420p");
  const pixFmtIndex = args.indexOf("-pix_fmt");
  assert.equal(args[pixFmtIndex + 1], "yuv420p");
  assert.ok(args.includes("+faststart"));
  assert.ok(args.includes("aac"));
  assert.equal(args.at(-1), "out/terminal/7-army.mp4");
});
