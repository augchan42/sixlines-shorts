import assert from "node:assert/strict";
import test from "node:test";
import { limiterCeiling, loudnessTarget, SERIES_LUFS } from "../scripts/series/render-lib.mjs";

// Every short at one level (the user, 2026-09-30, on 7: "sound is a bit low for some reason?";
// the 64 measured -17.3 to -6.9 LUFS, most over 0 dBTP): one gain per short, so its mix is kept.
test("a short whose peaks leave room goes to the series level", () => {
  assert.equal(SERIES_LUFS, -14);
  assert.equal(loudnessTarget({ input_i: "-8.0", input_tp: "3.3" }), -14);
  assert.equal(loudnessTarget({ input_i: "-16.0", input_tp: "-5.0" }), -14);
});

test("a quiet short with loud peaks stops where its peaks reach -1.5 dBTP, floored a tenth below", () => {
  // -17.3 + (-1.5 - 1.3) = -20.1, floored and a tenth under.
  assert.equal(loudnessTarget({ input_i: "-17.3", input_tp: "1.3" }), -20.2);
});

test("a limiter holds those peaks first, just low enough for the gain, with half a dB spare", () => {
  // 17: -17.3 LUFS, +1.3 dBTP. Gain 3.3 dB, so peaks must sit at -1.5 - 3.3 - 0.5 = -5.3 dBFS.
  assert.equal(limiterCeiling({ input_i: "-17.3", input_tp: "1.3" }), -5.3);
  // Room already: no limiter.
  assert.equal(limiterCeiling({ input_i: "-8.0", input_tp: "3.3" }), null);
  assert.equal(limiterCeiling({ input_i: "-16.0", input_tp: "-5.0" }), null);
});
