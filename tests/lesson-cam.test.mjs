import assert from "node:assert/strict";
import test from "node:test";
import { cameraStart } from "../src/lib/lessonCam.ts";

// The flight camera is one state carried across a lesson's pages (the review, 2026-09-27, item 1):
// it comes in once per hexagram, so a page that shows a different hexagram starts from far off.
const far = { come: 0, down: 0 };
const down = { come: 1, down: 1 };

test("a page on the same hexagram carries the camera where the last one left it", () => {
  assert.equal(cameraStart(down, far, 22, 22), down);
});

test("a page on a new hexagram starts the camera from far off, for its own approach", () => {
  assert.equal(cameraStart(down, far, 22, 7), far);
});

test("the first hexagram page starts from where the lesson began", () => {
  assert.equal(cameraStart(far, far, undefined, 22), far);
});
