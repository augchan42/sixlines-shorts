import assert from "node:assert/strict";
import test from "node:test";
import { planOf } from "../src/lib/seriesPlan.ts";
import { seriesMotion, sentenceBeat } from "../src/lib/seriesMotion.ts";

const base = { bpm: 95, drop: 15.16, pace: "held", credit: true };
const at = (motion, beat) => [...motion].reverse().find((m) => beat >= m.beat);

test("the frame does not punch while there is text to read", () => {
  for (const lesson of [{ kind: "lines", text: "t" }, { kind: "moon", text: "t", clip: "c.mp4" }]) {
    const p = { ...base, lesson };
    const s = planOf(p);
    const { motion } = seriesMotion(s, lesson);
    const sentence = lesson.clip ? s.cta - 5 : s.showcase + (s.cta - s.showcase) / 2;
    for (const beat of [0.5, s.meaning + 0.5, s.question + 0.5, sentence + 0.5]) {
      assert.equal(at(motion, beat).punch, 0, `${lesson.kind} at beat ${beat}`);
      assert.ok(at(motion, beat).sway <= 0.15, `${lesson.kind} at beat ${beat}`);
    }
    assert.ok(at(motion, s.drop + 0.5).punch > 0, "the lesson's picture still punches on the beat");
  }
});

test("the drop gets one short, lighter burst of shake", () => {
  const s = planOf(base);
  assert.deepEqual(seriesMotion(s, undefined).shakes, [{ beat: s.drop, strength: 30, beats: 0.5 }]);
});

test("a lesson's sentence comes on halfway, over a moon's last 5 beats, or a character's last 3", () => {
  const s = planOf({ ...base, lesson: {} });
  assert.equal(sentenceBeat(s, { kind: "lines" }), s.showcase + (s.cta - s.showcase) / 2);
  assert.equal(sentenceBeat(s, { kind: "moon", clip: "c.mp4" }), s.cta - 5);
  assert.equal(sentenceBeat(s, { kind: "character", clip: "c.mp4" }), s.cta - 3);
  const { motion } = seriesMotion(s, { kind: "character", clip: "c.mp4" });
  assert.equal(at(motion, s.cta - 2.5).punch, 0);
});
