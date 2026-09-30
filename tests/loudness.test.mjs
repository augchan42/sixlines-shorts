import assert from "node:assert/strict";
import test from "node:test";
import { limitedGain, limiterCeiling, PEAK_DBTP, PHONE_LUFS, phoneGain } from "../scripts/series/render-lib.mjs";

// Every short at one level on a phone (the user, 2026-09-30, on 7: "sound is a bit low for some
// reason?"; then "7 and 17 look good" on the first leveled renders).
test("the gain brings a short's level above 250 Hz to the series level", () => {
  assert.equal(PHONE_LUFS, -16.5);
  // 7 measured -20.7 on a phone before: 4.2 dB up. A loud short comes down.
  assert.equal(phoneGain(-20.7), 4.2);
  assert.equal(phoneGain(-8.9), -7.6);
});

test("a limiter holds the peaks first only where the gain would pass -3 dBTP, with 1 dB spare", () => {
  assert.equal(PEAK_DBTP, -3);
  assert.equal(limiterCeiling(-1.24, 4.2), -8.2);
  assert.equal(limiterCeiling(3.3, -7.6), null);
  assert.equal(limiterCeiling(-7.2, 4.2), null);
});

test("after the limiter the gain is measured again, and never lets the peaks pass -3 dBTP", () => {
  // The limiter took 0.9 dB off 7's phone level: the gain makes it up.
  assert.equal(limitedGain(-22.0, -7.5), 4.5);
  // Peaks that still leave less room cap the gain.
  assert.equal(limitedGain(-22.0, -6.0), 3);
});
