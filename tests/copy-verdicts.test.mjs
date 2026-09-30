import assert from "node:assert/strict";
import test from "node:test";
import { chosenCopy, applyCopy } from "../scripts/copy-verdicts.mjs";

// The user's copy verdicts on the review board (series/review/copy-verdicts.json): "good" ships
// the change Opus and Astra agreed on, "opus" or "astra" takes that reviewer's last choice, and
// `take` mixes in fields from the other.
const cur = { hook: "h", meaning1: "m1", meaning2: "m2", question: "q", lesson: "l", finding: "F", caption: "c" };
const state = {
  shorts: {
    7: { agreed: null, options: { current: cur, "opus-3": { ...cur, hook: "H7" }, "astra-2": { ...cur, question: "Q7" } }, votes: [{ opus: { choice: "opus-3" }, astra: { choice: "astra-2" } }] },
    8: { agreed: "new-2", options: { current: cur, "new-2": { ...cur, caption: "C8" } }, votes: [{ opus: { choice: "new-2" }, astra: { choice: "new-2" } }] },
    26: { agreed: null, options: { current: cur, "opus-3": { ...cur, finding: "OPUS F" }, "astra-3": { ...cur, finding: "ASTRA F", lesson: "L26" } }, votes: [{ opus: { choice: "opus-3" }, astra: { choice: "astra-3" } }] },
  },
};

test("each verdict picks its version; only the fields that change are returned", () => {
  const v = { 7: { verdict: "astra" }, 8: { verdict: "good" }, 26: { verdict: "astra", take: { finding: "opus" } } };
  assert.deepEqual(chosenCopy(state, v), { 7: { question: "Q7" }, 8: { caption: "C8" }, 26: { finding: "OPUS F", lesson: "L26" } });
});

test("a split short marked good is an error: there is no agreed change to ship", () => {
  assert.throws(() => chosenCopy(state, { 7: { verdict: "good" } }), /7/);
});

test("the fields land where series/copy.json keeps them", () => {
  const copy = { 26: { hook: { text: "h" }, meaning: [{ text: "m1" }, { text: "m2" }], question: { text: "q" }, caption: { text: "c" }, lesson: { text: "l", readout: { finding: "F" } } } };
  const out = applyCopy(copy, { 26: { finding: "OPUS F", lesson: "L26", meaning2: "M2", caption: "C" } }, "board");
  assert.equal(out[26].lesson.readout.finding, "OPUS F");
  assert.equal(out[26].lesson.text, "L26");
  assert.equal(out[26].meaning[1].text, "M2");
  assert.equal(out[26].caption.text, "C");
  assert.equal(out[26].meaning[1].source, "board");
  // The input is left alone.
  assert.equal(copy[26].lesson.text, "l");
});
