import assert from "node:assert/strict";
import test from "node:test";
import { amberLines, STAGED, STAGED_SECONDS, stagedBeats, TIMED, TIMED_SECONDS } from "../src/lib/readoutAmber.ts";

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

// The user, on 22: "line 5 turns amber very quickly, and way too quickly for anyone to learn
// master of adornment." A staged readout runs on seconds, not shares of the lesson.

test("the master line is amber on its own for at least 3 seconds", () => {
  assert.ok(STAGED.finding - STAGED.master >= 3);
});

test("the English under WANG BI has typed out well before the finding takes over", () => {
  // MASTER OF ADORNMENT: 19 characters, one every 1.2 frames at 30 fps, 12 frames after the Chinese.
  const typedBy = STAGED.master + (12 + 19 * 1.2) / 30;
  assert.ok(STAGED.finding - typedBy >= 1.5);
});

test("the lesson sentence holds at least 2 seconds after it is typed", () => {
  // PLAIN IS THE BEST ADORNMENT. with its line break: 29 characters, 10 frames after the answer.
  const typedBy = STAGED.answer + (10 + 29 * 1.2) / 30;
  assert.ok(STAGED_SECONDS - typedBy >= 2);
});

test("a staged lesson gets enough whole beats to fit, and never fewer than the held 16", () => {
  for (const bpm of [82.5, 91.99, 100.58, 102, 120]) {
    const beats = stagedBeats(bpm);
    assert.equal(beats, Math.round(beats));
    assert.ok((beats * 60) / bpm >= STAGED_SECONDS, `${bpm} bpm`);
    assert.ok(beats >= 16);
  }
  assert.equal(stagedBeats(91.99), 20);
});

// 22 without a master (the user, 2026-09-27: "yes lets try that"): line 6, plain white, is the
// point, so its finding gets the time the master had.
test("a timed readout without a master holds its finding at least 3 seconds before the answer", () => {
  assert.ok(TIMED.answer - TIMED.finding >= 3);
});

test("a timed readout's sentence holds at least 2 seconds after it is typed", () => {
  const typedBy = TIMED.answer + (10 + 29 * 1.2) / 30;
  assert.ok(TIMED_SECONDS - typedBy >= 2);
});

test("beats follow the seconds they are asked for", () => {
  assert.equal(stagedBeats(91.99, TIMED_SECONDS), Math.max(16, Math.ceil((TIMED_SECONDS * 91.99) / 60)));
});
