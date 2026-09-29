import assert from "node:assert/strict";
import test from "node:test";
import { effortOf, parseAnswer, problemsOf, tally, votesOf } from "../scripts/convergence.mjs";

const copy = {
  hook: "Waiting for a sign to start?",
  meaning1: "The Creative\nsays: begin.",
  meaning2: "No conditions.\nJust mean it.",
  question: "What would you\nstart today?",
  lesson: "Heaven never\ntakes a day off.",
  finding: "SIX STRONG LINES. NO REST.",
  caption: "Heaven moves without rest. So does the one who starts.",
};
const fresh = () => ({ rounds: [], shorts: { 1: { name: "The Creative", readout: true, options: { current: { ...copy } }, problems: { current: [] }, votes: [], agreed: null } } });

test("both ship in round 1: agreed on the shipped copy", () => {
  const s = tally(fresh(), 1, {
    opus: votesOf({ shorts: [{ number: 1, verdict: "ship", score: 8, reason: "a" }] }, 1),
    astra: votesOf({ shorts: [{ number: 1, verdict: "ship", score: 7, reason: "b" }] }, 1),
  });
  assert.equal(s.shorts[1].agreed, "current");
});

test("one ships and one rewrites: still open, and the rewrite becomes an option with its rule problems", () => {
  const s = tally(fresh(), 1, {
    opus: votesOf({ shorts: [{ number: 1, verdict: "change", score: 6, reason: "flat", rewrite: { hook: "Still waiting for a sign?" } }] }, 1),
    astra: votesOf({ shorts: [{ number: 1, verdict: "ship", score: 8, reason: "fine" }] }, 1),
  });
  const x = s.shorts[1];
  assert.equal(x.agreed, null);
  assert.equal(x.options["opus-1"].hook, "Still waiting for a sign?");
  assert.equal(x.options["opus-1"].question, copy.question);
  assert.deepEqual(x.problems["opus-1"], []);
  assert.deepEqual(x.votes[0].opus, { choice: "opus-1", score: 6, reason: "flat" });
});

test("later rounds agree when both pick the same option, or two rewrites with the same text", () => {
  const s = tally(fresh(), 1, {
    opus: votesOf({ shorts: [{ number: 1, verdict: "change", score: 6, reason: "x", rewrite: { hook: "Still waiting for a sign?" } }] }, 1),
    astra: votesOf({ shorts: [{ number: 1, verdict: "change", score: 6, reason: "y", rewrite: { hook: "Waiting on a sign?" } }] }, 1),
  });
  assert.equal(s.shorts[1].agreed, null);
  tally(s, 2, { opus: votesOf({ shorts: [{ number: 1, choice: "astra-1", score: 8, reason: "ok" }] }, 2), astra: votesOf({ shorts: [{ number: 1, choice: "astra-1", score: 8, reason: "ok" }] }, 2) });
  assert.equal(s.shorts[1].agreed, "astra-1");

  const t = tally(fresh(), 2, {
    opus: votesOf({ shorts: [{ number: 1, choice: "new", score: 8, reason: "a", rewrite: { question: "What would\nyou begin?" } }] }, 2),
    astra: votesOf({ shorts: [{ number: 1, choice: "new", score: 8, reason: "b", rewrite: { question: "What would\nyou begin?" } }] }, 2),
  });
  assert.equal(t.shorts[1].agreed, "opus-2");
});

test("a round 1 change with no rewrite counts as ship; an unknown option id counts as the shipped copy", () => {
  assert.equal(votesOf({ shorts: [{ number: 1, verdict: "change", score: 5, reason: "vague" }] }, 1)["1"].choice, "current");
  const s = tally(fresh(), 2, { opus: votesOf({ shorts: [{ number: 1, choice: "astra-9", score: 7, reason: "" }] }, 2), astra: votesOf({ shorts: [{ number: 1, choice: "current", score: 7, reason: "" }] }, 2) });
  assert.equal(s.shorts[1].agreed, "current");
});

test("a rewrite may only touch the reviewable fields", () => {
  const v = votesOf({ shorts: [{ number: 1, verdict: "change", score: 5, reason: "", rewrite: { hook: "A new hook here", endcard: "x", meaning1: "" } }] }, 1);
  assert.deepEqual(v["1"].rewrite, { hook: "A new hook here" });
});

test("rule problems: banned words, width on the rain, caption sentences", () => {
  assert.deepEqual(problemsOf(copy, true), []);
  const bad = { ...copy, hook: "What does the oracle say?", meaning1: "An extremely long line here", caption: "One. Two. Three." };
  const p = problemsOf(bad, true);
  assert.ok(p.some((x) => x.startsWith("hook: uses a banned word")));
  assert.ok(p.some((x) => x.startsWith("meaning 1:") && x.includes("too wide")));
  assert.ok(p.some((x) => x.includes("caption: 3 sentences")));
});

test("answers are parsed from the first JSON object, with or without a fence", () => {
  assert.deepEqual(parseAnswer('```json\n{"shorts": []}\n```'), { shorts: [] });
  assert.equal(parseAnswer("no json"), null);
});

test("rounds 1 and 2 at high effort, round 3 at xhigh", () => {
  assert.deepEqual([1, 2, 3].map(effortOf), ["high", "high", "xhigh"]);
});
