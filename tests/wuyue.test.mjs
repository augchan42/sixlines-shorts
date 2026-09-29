import assert from "node:assert/strict";
import test from "node:test";
import { CUTS, ROUTE, cardsFilter, musicStart } from "../scripts/wuyue.mjs";

test("the route test runs 11 s: out, the far shore, back, then a hold", () => {
  const s = ROUTE.seconds;
  assert.equal(ROUTE.frames, 330);
  assert.ok(s.out[0] < s.out[1] && s.out[1] <= s.shore[0] && s.shore[1] <= s.back[0]);
  assert.ok(s.back[1] < 11 - 2, "at least 2 s of hold after the line comes home");
  assert.equal(ROUTE.flare, Math.round(s.back[1] * 30));
});

test("the text cards do not overlap and each stays up at least 2 s", () => {
  const cards = ROUTE.cards;
  for (const [i, c] of cards.entries()) {
    assert.ok(c.to - c.from >= 2, c.text);
    if (i) assert.ok(c.from >= cards[i - 1].to, c.text);
  }
  for (const c of cards) for (const w of ["oracle", "divination", "fortune", "prediction", "mystical", "magical"]) assert.ok(!c.text.toLowerCase().includes(w));
});

test("each cut sets its frame and puts the far shore where it fits", () => {
  assert.deepEqual(CUTS.vertical.size, [1080, 1920]);
  assert.deepEqual(CUTS.wide.size, [1920, 1080]);
  // Korea lies north-east of Hangzhou in both, further east in the wide frame.
  for (const c of Object.values(CUTS)) assert.ok(c.shore[0] > 0 && c.shore[1] > 0);
  assert.ok(CUTS.wide.shore[0] / CUTS.wide.shore[1] > CUTS.vertical.shore[0] / CUTS.vertical.shore[1]);
});

test("the text is drawn with fades, centred, escaped for ffmpeg", () => {
  const f = cardsFilter([{ text: "Lost books.", from: 0.3, to: 3 }, { text: "Wuyue ∙ 907–978: it's", from: 3.3, to: 6 }], CUTS.vertical, "/f/goudos.ttf");
  assert.match(f, /drawtext=fontfile='\/f\/goudos.ttf':text='Lost books.'/);
  assert.match(f, /x=\(w-text_w\)\/2/);
  assert.match(f, /enable='between\(t,0.3,3\)'/);
  assert.match(f, /it\\\\\\'s|it\\u2019s|it’s/);
  assert.equal(f.split("drawtext").length - 1, 2);
});

test("the music starts so the line comes home on the track's drop", () => {
  const m = { start: 158.426, drop: 14.4 };
  assert.equal(musicStart(m, 8).toFixed(3), (158.426 + 14.4 - 8).toFixed(3));
});
