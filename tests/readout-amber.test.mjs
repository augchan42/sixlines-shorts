import assert from "node:assert/strict";
import test from "node:test";
import { amberLines } from "../src/lib/readoutAmber.ts";

// Amber is the line to look at, so it follows the text on screen (Codex's review, 2026-09-27):
// in 22 Wang Bi's master is line 5 and the finding is about line 2. The master line is amber
// while WANG BI is on screen, then the finding's lines take over.
const at = { masterAt: 100, findingAt: 150 };
const r22 = { mark: [1, 4], master: { line: 4 }, findingMark: [1] };

test("nothing is amber before the master is named", () => {
  assert.deepEqual(amberLines(r22, 99, at), []);
});

test("only the master line is amber while Wang Bi names it", () => {
  assert.deepEqual(amberLines(r22, 120, at), [4]);
});

test("the finding's lines take over from the master line", () => {
  assert.deepEqual(amberLines(r22, 150, at), [1]);
});

test("without its own lines the finding is about every marked line", () => {
  assert.deepEqual(amberLines({ mark: [0, 1], master: { line: 1 } }, 160, at), [0, 1]);
});

test("a readout with no master marks its lines from the finding on, all together", () => {
  const at42 = { masterAt: 150, findingAt: 150 };
  assert.deepEqual(amberLines({ mark: [1, 2, 3, 4] }, 149, at42), []);
  assert.deepEqual(amberLines({ mark: [1, 2, 3, 4] }, 150, at42), [1, 2, 3, 4]);
});

test("a master without a line number keeps every marked line amber from the master on", () => {
  assert.deepEqual(amberLines({ mark: [1, 4], master: {} }, 120, at), [1, 4]);
});
