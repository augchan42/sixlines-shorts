import assert from "node:assert/strict";
import test from "node:test";
import { readBeforeCut } from "../src/lib/lessonRead.ts";

// The user, on the lesson (2026-09-27): "read the amber finding... this sentence shows on the
// screen way too fast then goes away (around 2:50 mark)". Lines typed before a cut to a full
// readout are held long enough to read first.
test("lines typed before a cut are held at reading speed", () => {
  assert.equal(readBeforeCut(["NO MASTER (主) NAMED?", "READ THE AMBER FINDING."]), 8 / 3.7);
});

test("a short line before a cut still gets a second and a half", () => {
  assert.equal(readBeforeCut(["NEXT."]), 1.5);
});
