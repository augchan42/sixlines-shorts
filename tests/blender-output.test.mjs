import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { keepIfComplete } from "../scripts/blender-output.mjs";

const setup = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "blender-output-"));
  const partial = path.join(dir, "render.mp4");
  const out = path.join(dir, "public", "clip.mp4");
  writeFileSync(partial, "new");
  return { partial, out };
};

test("a complete render moves to the clip's name", () => {
  const { partial, out } = setup();
  assert.equal(keepIfComplete({ partial, out, frames: 67, expected: 67 }), true);
  assert.equal(readFileSync(out, "utf8"), "new");
  assert.equal(existsSync(partial), false);
});

test("a short render is deleted and never takes the clip's name", () => {
  const { partial, out } = setup();
  assert.equal(keepIfComplete({ partial, out, frames: 60, expected: 67 }), false);
  assert.equal(existsSync(out), false);
  assert.equal(existsSync(partial), false);
});
