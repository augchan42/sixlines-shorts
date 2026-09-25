import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { copyProblems } from "../scripts/series/copy-rules.mjs";

const line = (text) => ({ text, source: "written" });
const entry = (over = {}) => ({
  hook: line("Can't stop overthinking?"),
  meaning: [line("Keeping Still\nsays: pause."), line("Stay with where\nyou are now.")],
  question: line("What can wait?"),
  plates: ["52-51", "52-40"],
  caption: line("Can't stop overthinking? Stay with where you are now. Most things can wait."),
  ...over,
});

test("a good entry has no problems", () => {
  assert.deepEqual(copyProblems(52, entry()), []);
});

test("word counts are enforced", () => {
  assert.match(copyProblems(52, entry({ hook: line("Stuck?") })).join(), /hook: 1 words/);
  assert.match(copyProblems(52, entry({ question: line("What could you honestly let wait today?") })).join(), /question: 7 words/);
});

test("a screen line over 18 characters is too wide for the frame", () => {
  assert.match(copyProblems(52, entry({ meaning: [line("Keeping Still says: pause."), line("Stay with where\nyou are now.")] })).join(), /too wide/);
});

test("the tone rules catch banned words, exclamation marks and I Ching without a hyphen", () => {
  for (const bad of ["You should rest.", "Rest now!", "The AI says so.", "Your fortune awaits.", "Ask the I Ching."]) {
    assert.notDeepEqual(copyProblems(52, entry({ question: line(bad) })), [], bad);
  }
});

test("plates are two of this hexagram's, never the one the verse screen shows", () => {
  assert.match(copyProblems(52, entry({ plates: ["52-52", "52-40"] })).join(), /52-52 is the verse screen's plate/);
  assert.match(copyProblems(52, entry({ plates: ["29-31", "52-40"] })).join(), /29-31 is not a plate of 52/);
  assert.match(copyProblems(52, entry({ plates: ["52-51"] })).join(), /plates: need two/);
});

test("the post caption is 8 to 35 words and follows the tone rules", () => {
  assert.match(copyProblems(52, entry({ caption: line("Too short.") })).join(), /caption: 2 words/);
  assert.match(copyProblems(52, entry({ caption: line("You should rest now and let the mountain hold still.") })).join(), /caption: says "should"/);
  assert.match(copyProblems(52, entry({ caption: line("word ".repeat(36)) })).join(), /caption: 36 words/);
  assert.match(copyProblems(52, entry({ caption: undefined })).join(), /caption: missing/);
});

test("every line names a source", () => {
  assert.match(copyProblems(52, entry({ hook: { text: "Can't stop overthinking?", source: "" } })).join(), /hook: no source/);
});

test("every entry in series/copy.json passes", () => {
  const copy = JSON.parse(readFileSync("series/copy.json", "utf8"));
  for (const [n, e] of Object.entries(copy)) assert.deepEqual(copyProblems(Number(n), e), [], `hexagram ${n}`);
});

test("a lesson's sentence follows the same rules as the meaning lines, when there is one", () => {
  const lesson = (text) => ({ kind: "lines", text, source: "written" });
  assert.match(copyProblems(52, entry({ lesson: lesson("Water under the earth:\nunseen, but everywhere.") })).join(), /lesson: "Water under the earth:" is too wide/);
  assert.deepEqual(copyProblems(52, entry({ lesson: lesson("Unseen water\nunder the earth.") })), []);
});

test("every special in series/specials passes", () => {
  for (const f of readdirSync("series/specials")) {
    const s = JSON.parse(readFileSync(`series/specials/${f}`, "utf8"));
    assert.deepEqual(copyProblems(s.hexagram, s.copy), [], f);
  }
});
